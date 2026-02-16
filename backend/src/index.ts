// src/index.ts

import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { logger } from "./utils/logger.js";
import { testSupabaseConnection } from "./config/supabase.js";
import { connectRedis } from "./config/redis.js";
import { errorHandler } from "./middleware/errorHandler.js";
import webhookRoutes from "./routes/webhooks.js";
import healthRoutes from "./routes/health.js";

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// ============= MIDDLEWARE =============

// Security
app.use(helmet());

// CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Body parser - raw para webhook signature verification
app.use((req, res, next) => {
  if (req.path === "/webhooks/whatsapp" && req.method === "POST") {
    // Para webhooks, manter body como string para verificação de assinatura
    express.raw({ type: "application/json" })(req, res, () => {
      req.body = JSON.parse(req.body.toString());
      next();
    });
  } else {
    express.json()(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ============= ROUTES =============

// Health check
app.use("/health", healthRoutes);

// Webhooks
app.use("/webhooks", webhookRoutes);

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    name: "LeadFlow Backend",
    version: "0.1.0",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  logger.warn(`404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: "Not Found",
    path: req.path,
    method: req.method,
  });
});

// Error handling
app.use(errorHandler);

// ============= SERVER STARTUP =============

async function startServer() {
  try {
    // Test Supabase connection
    logger.info("Testing Supabase connection...");
    const supabaseOk = await testSupabaseConnection();
    if (!supabaseOk) {
      throw new Error("Supabase connection failed");
    }

    // Connect to Redis
    logger.info("Connecting to Redis...");
    await connectRedis();

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`
╔════════════════════════════════════════╗
║     LeadFlow Backend Server Running    ║
╚════════════════════════════════════════╝

📍 PORT: ${PORT}
🌐 URL: http://localhost:${PORT}
📡 Webhooks: http://localhost:${PORT}/webhooks/whatsapp
❤️  Health: http://localhost:${PORT}/health

Environment: ${process.env.NODE_ENV || "development"}
Time: ${new Date().toISOString()}
      `);
    });
  } catch (err) {
    logger.error(`❌ Failed to start server: ${err}`);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  logger.info("Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("Shutting down gracefully...");
  process.exit(0);
});

// Start the server
startServer();

export default app;
