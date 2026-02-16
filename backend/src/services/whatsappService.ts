// src/services/whatsappService.ts

import axios from "axios";
import { logger } from "../utils/logger.js";
import { WhatsAppSendRequest } from "../types/whatsapp.js";

const WHATSAPP_API_VERSION = "v18.0";
const WHATSAPP_API_URL = `https://graph.instagram.com/${WHATSAPP_API_VERSION}`;

export async function sendWhatsAppMessage(
  phoneNumber: string,
  responseText: string,
  phoneId: string,
  withCTA: boolean = true
): Promise<any> {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error("Missing WHATSAPP_ACCESS_TOKEN");
    }

    const url = `${WHATSAPP_API_URL}/${phoneId}/messages`;

    const payload: WhatsAppSendRequest = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: responseText },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: "buy_now",
                title: "Quero comprar! 🛒",
              },
            },
          ],
        },
      },
    };

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    logger.info(
      `✅ Message sent to ${phoneNumber}: ${response.data?.messages?.[0]?.id}`
    );
    return response.data;
  } catch (err: any) {
    logger.error(
      `❌ Failed to send WhatsApp message to ${phoneNumber}: ${err.message}`
    );
    throw err;
  }
}

export async function sendSimpleMessage(
  phoneNumber: string,
  text: string,
  phoneId: string
): Promise<any> {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error("Missing WHATSAPP_ACCESS_TOKEN");
    }

    const url = `${WHATSAPP_API_URL}/${phoneId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "text",
      text: { body: text },
    };

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    return response.data;
  } catch (err: any) {
    logger.error(
      `❌ Failed to send simple message to ${phoneNumber}: ${err.message}`
    );
    throw err;
  }
}

export async function markAsRead(
  messageId: string,
  phoneId: string
): Promise<void> {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error("Missing WHATSAPP_ACCESS_TOKEN");
    }

    const url = `${WHATSAPP_API_URL}/${phoneId}/messages`;

    await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    logger.debug(`✅ Marked message as read: ${messageId}`);
  } catch (err: any) {
    logger.warn(`Could not mark message as read: ${err.message}`);
    // Don't throw - this is non-critical
  }
}
