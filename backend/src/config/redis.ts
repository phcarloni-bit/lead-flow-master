// src/config/redis.ts

import { createClient } from "redis";
import { logger } from "../utils/logger";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redisClient = createClient({ url: redisUrl });

redisClient.on("error", (err) => logger.error(`Redis error: ${err}`));
redisClient.on("connect", () => logger.info("✅ Redis connected"));

export async function connectRedis() {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    return redisClient;
  } catch (err) {
    // In development, Redis is optional for basic testing
    if (process.env.NODE_ENV === "development") {
      logger.warn(`⚠️  Redis connection failed (continuing in dev mode): ${err}`);
      return null;
    }
    logger.error(`❌ Redis connection failed: ${err}`);
    throw err;
  }
}

export { redisClient };
