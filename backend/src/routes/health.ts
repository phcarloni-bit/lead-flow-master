// src/routes/health.ts

import { Router, Request, Response } from "express";
import { redisClient } from "../config/redis.js";
import { testSupabaseConnection } from "../config/supabase.js";
import { rateLimitStats } from "../middleware/rateLimiter.js";
import { logger } from "../utils/logger.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const redisStatus = redisClient.isOpen ? "connected" : "disconnected";
    const supabaseOk = await testSupabaseConnection();

    const status = {
      status: supabaseOk && redisClient.isOpen ? "healthy" : "degraded",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        redis: redisStatus,
        supabase: supabaseOk ? "connected" : "disconnected",
        nodejs: process.version,
      },
    };

    const statusCode = supabaseOk && redisClient.isOpen ? 200 : 503;
    res.status(statusCode).json(status);
  } catch (err) {
    logger.error(`Health check error: ${err}`);
    res.status(503).json({ status: "unhealthy", error: String(err) });
  }
});

router.get("/stats", (req: Request, res: Response) => {
  try {
    const stats = rateLimitStats();
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      rateLimit: stats,
      environment: {
        node_env: process.env.NODE_ENV,
        port: process.env.PORT,
        log_level: process.env.LOG_LEVEL,
      },
    });
  } catch (err) {
    logger.error(`Stats endpoint error: ${err}`);
    res.status(500).json({ error: String(err) });
  }
});

export default router;
