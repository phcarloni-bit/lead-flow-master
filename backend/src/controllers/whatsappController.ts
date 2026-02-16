// src/controllers/whatsappController.ts

import { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { logger } from "../utils/logger.js";
import { sendWhatsAppMessage, markAsRead } from "../services/whatsappService.js";
import { classifyMessage } from "../services/classificationService.js";
import { getTemplate, buildResponse } from "../services/templateService.js";
import { WhatsAppWebhookPayload, WhatsAppMessage } from "../types/whatsapp.js";

export async function handleWebhookEvent(req: Request, res: Response) {
  try {
    const payload: WhatsAppWebhookPayload = req.body;

    // Processar todas as mensagens
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const { value } = change;

        if (!value.messages) {
          logger.debug("Webhook event without messages (status update, etc)");
          continue;
        }

        // Processar cada mensagem
        for (const message of value.messages) {
          await processMessage(message, value.metadata);
        }
      }
    }

    // Responder ao Meta imediatamente
    res.status(200).json({ success: true });
  } catch (err) {
    logger.error(`Webhook handler error: ${err}`);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function processMessage(
  message: WhatsAppMessage,
  metadata: { phone_number_id: string; display_phone_number: string }
) {
  try {
    logger.info(`📨 Processing message from ${message.from}: "${message.text?.body}"`);

    // 1. Extrair dados
    const phoneNumber = message.from;
    const messageText = message.text?.body || "";
    const messageId = message.id;
    const phoneId = metadata.phone_number_id;

    if (!messageText) {
      logger.debug("Empty message, skipping");
      return;
    }

    // 2. Encontrar usuário (usando phone_id do store_config)
    const { data: storeConfigs } = await supabase
      .from("store_config")
      .select("user_id, *")
      .eq("whatsapp_phone_id", phoneId)
      .maybeSingle();

    if (!storeConfigs) {
      logger.warn(`No store config found for phone_id: ${phoneId}`);
      return;
    }

    const userId = storeConfigs.user_id;

    // 3. Classificar mensagem
    const classification = await classifyMessage(messageText, userId);

    // 4. Buscar template
    const template = await getTemplate(userId, classification.category);

    // 5. Construir resposta com dados da loja
    const responseText = buildResponse(classification.category, template, storeConfigs);

    // 6. Registrar interação no DB
    const { data: logData } = await supabase.from("interaction_logs").insert({
      user_id: userId,
      contact_name: phoneNumber,
      channel: "whatsapp",
      message_received: messageText,
      category_assigned: classification.category,
      response_sent: responseText,
      status: "auto_replied",
      clicked_buy: false,
      created_at: new Date().toISOString(),
    });

    logger.debug(`📝 Logged interaction`, logData);

    // 7. Enviar resposta automática via WhatsApp
    try {
      await sendWhatsAppMessage(phoneNumber, responseText, phoneId, true);

      // 8. Marcar como lido (opcional)
      await markAsRead(messageId, phoneId);

      logger.info(`✅ Response sent to ${phoneNumber}`);
    } catch (sendErr) {
      logger.error(`Failed to send response: ${sendErr}`);
      // Não fazer throw - apenas logar erro
    }
  } catch (err) {
    logger.error(`Error processing message: ${err}`);
    // Não fazer throw para não quebrar o webhook
  }
}

export async function handleButtonClick(req: Request, res: Response) {
  try {
    const payload: WhatsAppWebhookPayload = req.body;

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const { value } = change;

        if (!value.messages) continue;

        for (const message of value.messages) {
          if (
            message.type === "interactive" &&
            message.interactive?.button_reply?.id === "buy_now"
          ) {
            const phoneNumber = message.from;
            const phoneId = value.metadata.phone_number_id;

            logger.info(`🎯 BUY BUTTON CLICKED from ${phoneNumber}`);

            // 1. Encontrar store config
            const { data: storeConfig } = await supabase
              .from("store_config")
              .select("user_id")
              .eq("whatsapp_phone_id", phoneId)
              .maybeSingle();

            if (!storeConfig) {
              logger.warn(`No store config for phone_id: ${phoneId}`);
              continue;
            }

            const userId = storeConfig.user_id;

            // 2. Atualizar interaction_logs (marcar clicked_buy)
            const { data: logs } = await supabase
              .from("interaction_logs")
              .select("id, category_assigned")
              .eq("user_id", userId)
              .eq("contact_name", phoneNumber)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (logs) {
              await supabase
                .from("interaction_logs")
                .update({ clicked_buy: true })
                .eq("id", logs.id);

              logger.debug(`✅ Updated interaction log: ${logs.id}`);
            }

            // 3. Criar lead qualificado
            const { data: qualifiedLead } = await supabase
              .from("qualified_leads")
              .insert({
                user_id: userId,
                contact_name: phoneNumber,
                channel: "whatsapp",
                category: logs?.category_assigned || null,
                status: "waiting",
                clicked_at: new Date().toISOString(),
              })
              .select()
              .maybeSingle();

            logger.info(`🎉 Created qualified lead:`, qualifiedLead);
          }
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (err) {
    logger.error(`Button click handler error: ${err}`);
    res.status(500).json({ error: "Internal server error" });
  }
}
