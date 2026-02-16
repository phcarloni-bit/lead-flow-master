// src/types/whatsapp.ts

export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: "text" | "interactive";
  text?: { body: string };
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
  };
}

export interface WhatsAppMetadata {
  phone_number_id: string;
  display_phone_number: string;
}

export interface WhatsAppValue {
  messaging_product: "whatsapp";
  messages?: WhatsAppMessage[];
  statuses?: Array<{
    id: string;
    status: "sent" | "delivered" | "read" | "failed";
  }>;
  metadata: WhatsAppMetadata;
}

export interface WhatsAppChange {
  value: WhatsAppValue;
}

export interface WhatsAppEntry {
  changes: WhatsAppChange[];
}

export interface WhatsAppWebhookPayload {
  entry: WhatsAppEntry[];
}

export interface WhatsAppSendRequest {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "interactive" | "text";
  interactive?: {
    type: "button";
    body: { text: string };
    action: {
      buttons: Array<{
        type: "reply";
        reply: { id: string; title: string };
      }>;
    };
  };
  text?: { body: string };
}

export interface ClassificationResult {
  category: string | null;
  matched: boolean;
  confidence?: number;
}

export interface InteractionLog {
  id?: string;
  user_id: string;
  contact_name: string;
  channel: string;
  message_received: string;
  category_assigned: string | null;
  response_sent: string | null;
  clicked_buy: boolean;
  status: string;
  created_at?: string;
}

export interface QualifiedLead {
  id?: string;
  user_id: string;
  contact_name: string;
  channel: string;
  category: string | null;
  status: "waiting" | "assumed" | "sold";
  clicked_at: string;
  assumed_at?: string;
  sold_at?: string;
}

export interface StoreConfig {
  id?: string;
  user_id: string;
  store_name?: string;
  products?: string;
  default_price?: string;
  available_colors?: string;
  product_link?: string;
  whatsapp_token?: string;
  whatsapp_phone_id?: string;
  whatsapp_connected?: boolean;
  notifications_enabled?: boolean;
}
