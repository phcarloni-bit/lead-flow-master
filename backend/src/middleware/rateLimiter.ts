// src/middleware/rateLimiter.ts

import { Request, Response, NextFunction } from "express";
import { redisClient } from "../config/redis.js";
import { logger } from "../utils/logger.js";

// ============= CONFIGURATION =============
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || "60"); // seconds
const RATE_LIMIT_MAX_REQUESTS = parseInt(
  process.env.RATE_LIMIT_MAX_REQUESTS || "1"
); // requests per window
const DEBOUNCE_WINDOW = parseInt(process.env.DEBOUNCE_WINDOW || "3000"); // milliseconds
const ENABLE_RATE_LIMITING =
  process.env.ENABLE_RATE_LIMITING !== "false";
const ENABLE_DEBOUNCE = 
  process.env.ENABLE_DEBOUNCE !== "false";

// ============= IN-MEMORY FALLBACK =============
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface DebounceEntry {
  lastMessageTime: number;
  lastMessageHash: string;
}

const inMemoryRateLimit = new Map<string, RateLimitEntry>();
const inMemoryDebounce = new Map<string, DebounceEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  
  // Clean rate limit
  for (const [key, entry] of inMemoryRateLimit) {
    if (now > entry.resetTime) {
      inMemoryRateLimit.delete(key);
    }
  }
  
  // Clean debounce
  for (const [key, entry] of inMemoryDebounce) {
    if (now - entry.lastMessageTime > DEBOUNCE_WINDOW * 2) {
      inMemoryDebounce.delete(key);
    }
  }
  
  logger.debug(
    `Memory cleanup: RateLimit=${inMemoryRateLimit.size}, Debounce=${inMemoryDebounce.size}`
  );
}, 5 * 60 * 1000);

// ============= RATE LIMITING =============

async function incrementRateLimit(phoneNumber: string): Promise<number> {
  try {
    // Try Redis first
    const key = `rate_limit:${phoneNumber}`;
    const current = await redisClient.incr(key);
    
    if (current === 1) {
      await redisClient.expire(key, RATE_LIMIT_WINDOW);
    }
    
    return current;
  } catch (err) {
    logger.debug(`Redis error, using in-memory fallback: ${err}`);
    
    // Fallback to in-memory
    const key = `rate_limit:${phoneNumber}`;
    const now = Date.now();
    
    let entry = inMemoryRateLimit.get(key);
    
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + RATE_LIMIT_WINDOW * 1000,
      };
    }
    
    entry.count++;
    inMemoryRateLimit.set(key, entry);
    
    return entry.count;
  }
}

export async function rateLimiterMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!ENABLE_RATE_LIMITING) {
    return next();
  }

  try {
    // Extract phone number
    const phoneNumber =
      req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;

    if (!phoneNumber) {
      return next();
    }

    // Check rate limit
    const current = await incrementRateLimit(phoneNumber);

    if (current > RATE_LIMIT_MAX_REQUESTS) {
      logger.warn(
        `⚠️  Rate limit exceeded for ${phoneNumber}: ${current}/${RATE_LIMIT_MAX_REQUESTS} requests in ${RATE_LIMIT_WINDOW}s`
      );
      return res.status(429).json({
        error: "Too many requests",
        retryAfter: RATE_LIMIT_WINDOW,
        current,
        limit: RATE_LIMIT_MAX_REQUESTS,
      });
    }

    res.locals.phoneNumber = phoneNumber;
    next();
  } catch (err) {
    logger.error(`Rate limiter error: ${err}`);
    // Continue mesmo se falhar
    next();
  }
}

export async function checkRateLimit(phoneNumber: string): Promise<boolean> {
  if (!ENABLE_RATE_LIMITING) {
    return true;
  }

  try {
    const key = `rate_limit:${phoneNumber}`;
    const current = await redisClient.get(key);
    return !current;
  } catch (err) {
    logger.debug(`Rate limit check error: ${err}`);
    
    // Fallback to in-memory
    const entry = inMemoryRateLimit.get(key);
    return !entry || Date.now() > entry.resetTime;
  }
}

// ============= DEBOUNCE =============

function hashMessage(message: string): string {
  return Buffer.from(message).toString("base64").slice(0, 10);
}

export async function debounceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!ENABLE_DEBOUNCE) {
    return next();
  }

  try {
    const phoneNumber = res.locals.phoneNumber;
    const messageText = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;

    if (!phoneNumber || !messageText) {
      return next();
    }

    const messageHash = hashMessage(messageText);
    const now = Date.now();
    const key = `debounce:${phoneNumber}`;

    try {
      // Try Redis first
      const lastRecord = await redisClient.get(key);
      
      if (lastRecord) {
        const [lastTime, lastHash] = lastRecord.split("|");
        const timeSinceLastMessage = now - parseInt(lastTime);
        
        if (timeSinceLastMessage < DEBOUNCE_WINDOW && lastHash === messageHash) {
          logger.info(
            `⏸️  Debounced duplicate message from ${phoneNumber} (${timeSinceLastMessage}ms since last)`
          );
          return res.status(202).json({
            message: "Duplicate message debounced",
            retryAfter: Math.ceil((DEBOUNCE_WINDOW - timeSinceLastMessage) / 1000),
          });
        }
      }
      
      // Store current message
      await redisClient.setex(
        key,
        Math.ceil(DEBOUNCE_WINDOW / 1000),
        `${now}|${messageHash}`
      );
    } catch (err) {
      logger.debug(`Redis debounce error, using in-memory: ${err}`);
      
      // Fallback to in-memory
      const entry = inMemoryDebounce.get(key);
      
      if (
        entry &&
        now - entry.lastMessageTime < DEBOUNCE_WINDOW &&
        entry.lastMessageHash === messageHash
      ) {
        logger.info(
          `⏸️  Debounced duplicate message from ${phoneNumber} (${now - entry.lastMessageTime}ms since last)`
        );
        return res.status(202).json({
          message: "Duplicate message debounced",
          retryAfter: Math.ceil(
            (DEBOUNCE_WINDOW - (now - entry.lastMessageTime)) / 1000
          ),
        });
      }
      
      inMemoryDebounce.set(key, {
        lastMessageTime: now,
        lastMessageHash: messageHash,
      });
    }

    next();
  } catch (err) {
    logger.error(`Debounce middleware error: ${err}`);
    next();
  }
}

export function rateLimitStats() {
  return {
    inMemoryRateLimit: inMemoryRateLimit.size,
    inMemoryDebounce: inMemoryDebounce.size,
    config: {
      RATE_LIMIT_WINDOW,
      RATE_LIMIT_MAX_REQUESTS,
      DEBOUNCE_WINDOW,
      ENABLE_RATE_LIMITING,
      ENABLE_DEBOUNCE,
    },
  };
}
