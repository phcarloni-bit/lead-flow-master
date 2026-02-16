// src/middleware/verifyWebhook.ts

import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { logger } from "../utils/logger.js";

export function verifyWebhookSignature(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Para requisições GET (verificação inicial do webhook do Meta)
  if (req.method === "GET") {
    return next();
  }

  // Para requisições POST (mensagens reais)
  if (req.method === "POST") {
    const signature = req.headers["x-hub-signature-256"] as string;

    if (!signature) {
      logger.warn("Missing webhook signature");
      return res.status(403).json({ error: "Missing signature" });
    }

    const appSecret = process.env.WHATSAPP_APP_SECRET;
    if (!appSecret) {
      logger.error("Missing WHATSAPP_APP_SECRET");
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Converter body para string se ainda não estiver
    const bodyString =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body);

    const hash = crypto
      .createHmac("sha256", appSecret)
      .update(bodyString)
      .digest("hex");

    const expectedSignature = `sha256=${hash}`;

    if (signature !== expectedSignature) {
      logger.warn(`Invalid webhook signature: ${signature} !== ${expectedSignature}`);
      return res.status(403).json({ error: "Invalid signature" });
    }

    logger.debug("✅ Webhook signature verified");
    return next();
  }

  return next();
}

export function verifyWebhookToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Apenas para requisições GET (verificação inicial)
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

    if (mode === "subscribe" && token === verifyToken) {
      logger.info("✅ Webhook verified with Meta");
      return res.status(200).send(challenge);
    }

    logger.warn("Webhook verification failed");
    return res.status(403).json({ error: "Verification failed" });
  }

  return next();
}
