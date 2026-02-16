// src/routes/webhooks.ts

import { Router } from "express";
import { handleWebhookEvent, handleButtonClick } from "../controllers/whatsappController.js";
import { verifyWebhookToken, verifyWebhookSignature } from "../middleware/verifyWebhook.js";
import { rateLimiterMiddleware, debounceMiddleware } from "../middleware/rateLimiter.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

// GET handler - Meta webhook verification
router.get("/whatsapp", verifyWebhookToken);

// POST handler - Incoming messages and button clicks
router.post(
  "/whatsapp",
  rateLimiterMiddleware,
  debounceMiddleware,
  verifyWebhookSignature,
  asyncHandler(handleWebhookEvent),
  asyncHandler(handleButtonClick)
);

export default router;
