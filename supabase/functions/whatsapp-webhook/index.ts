import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0";

// ── Classification Engine (same logic as frontend) ──

const CATEGORY_PRIORITY = [
  "Como Comprar", "Rastreamento", "Preço", "Uso e Indicações",
  "Segurança", "Cores", "Tamanhos", "Pagamento", "Frete", "Trocas",
];

const DEFAULT_KEYWORDS: Record<string, string[]> = {
  "Como Comprar": ["comprar", "compra", "pedido", "como faço", "onde compro", "site", "faz pedido"],
  "Rastreamento": ["rastreio", "rastrear", "acompanhar", "onde está", "código", "status do pedido", "meu pedido"],
  "Preço": ["preço", "valor", "custa", "quanto", "promoção", "desconto", "oferta", "barato"],
  "Cores": ["cor", "cores", "preto", "nude", "bege", "chocolate", "disponível"],
  "Tamanhos": ["tamanho", "medida", "serve", "veste", "gg", "pp", "plus size", "tabela"],
  "Pagamento": ["pagamento", "pagar", "cartão", "pix", "boleto", "parcela", "juros"],
  "Frete": ["frete", "envio", "correio", "prazo", "entrega", "cep", "grátis", "dias úteis"],
  "Trocas": ["troca", "devolução", "devolver", "trocar", "não serviu", "reembolso", "garantia"],
  "Segurança": ["seguro", "segurança", "confiável", "golpe", "é seguro"],
  "Uso e Indicações": ["usar", "dormir", "cirurgia", "pós operatório", "lipo", "horas", "pós cirúrgico", "indicação"],
};

const DEFAULT_TEMPLATES: Record<string, string> = {
  "Como Comprar": "As compras são realizadas pelo nosso site: {{link_produto}}. Basta escolher o produto, selecionar o tamanho e finalizar o pagamento. 🛍️",
  "Rastreamento": "Para acompanhar seu pedido, acesse 'Acompanhar Pedido' no site e informe o número do pedido ou CPF. 📍",
  "Preço": "Nossos preços variam conforme a linha. Confira as ofertas no site: {{link_produto}}. 💰",
  "Cores": "Trabalhamos com Preto, Nude e Chocolate. A disponibilidade varia por modelo: {{link_produto}} 🎨",
  "Tamanhos": "Cada produto possui tabela de medidas. Recomendamos medir busto, cintura e quadril. Do P ao 3G! 📏",
  "Pagamento": "Parcelamos em até 12x! Aceitamos cartão, PIX (com 10% off!) e boleto. 💳",
  "Frete": "Enviamos para todo o Brasil! Frete grátis acima de R$ 249,90. 📦",
  "Trocas": "Aceitamos trocas desde que o produto esteja sem uso, com etiquetas e dentro do prazo. 🔄",
  "Segurança": "Nosso site é 100% seguro! Utilizamos pagamento criptografado e certificado SSL. 🔒",
  "Uso e Indicações": "Nossas peças são indicadas para uso estético e funcional. Verifique se é indicado para pós-cirúrgico ou uso diário. 💪",
  "Outro": "Olá! Bem-vinda à Silouete 👋 Posso te ajudar com dúvidas sobre tamanhos, como comprar ou rastrear seu pedido.",
};

function normalize(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function classifyMessage(
  text: string,
  customKeywords?: Record<string, string[]>
): { category: string | null; matched: boolean } {
  const keywords = customKeywords && Object.keys(customKeywords).length > 0
    ? customKeywords
    : DEFAULT_KEYWORDS;

  const normalizedText = normalize(text);

  // Sort by priority
  const sortedCategories = Object.keys(keywords).sort((a, b) => {
    const idxA = CATEGORY_PRIORITY.indexOf(a);
    const idxB = CATEGORY_PRIORITY.indexOf(b);
    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
  });

  for (const category of sortedCategories) {
    for (const keyword of keywords[category]) {
      if (normalizedText.includes(normalize(keyword))) {
        return { category, matched: true };
      }
    }
  }

  return { category: null, matched: false };
}

function buildResponse(
  category: string | null,
  templates: Record<string, string>,
  storeConfig: Record<string, string>
): string {
  const cat = category || "Outro";
  let response = templates[cat] || DEFAULT_TEMPLATES[cat] || DEFAULT_TEMPLATES["Outro"];

  response = response
    .replace(/\{\{preco\}\}/g, storeConfig.default_price || "[preço não configurado]")
    .replace(/\{\{cores_disponiveis\}\}/g, storeConfig.available_colors || "[cores não configuradas]")
    .replace(/\{\{link_produto\}\}/g, storeConfig.product_link || "[link não configurado]");

  // Append CTA
  if (!response.includes("Quero comprar")) {
    response += '\n\nGostou? Clique em "Quero comprar" para falar com um atendente! 🛒';
  }

  return response;
}

// ── WhatsApp API helpers ──

async function sendWhatsAppMessage(
  phoneNumber: string,
  responseText: string,
  phoneId: string,
  accessToken: string
) {
  const url = `${WHATSAPP_API_URL}/${phoneId}/messages`;

  const payload = {
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
            reply: { id: "buy_now", title: "Quero comprar! 🛒" },
          },
        ],
      },
    },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`WhatsApp send error [${resp.status}]:`, errText);
    throw new Error(`WhatsApp API error: ${resp.status}`);
  }

  const data = await resp.json();
  console.log(`✅ Message sent to ${phoneNumber}:`, data.messages?.[0]?.id);
  return data;
}

async function markAsRead(messageId: string, phoneId: string, accessToken: string) {
  try {
    const url = `${WHATSAPP_API_URL}/${phoneId}/messages`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    });
    await resp.text(); // consume body
    console.log(`✅ Marked as read: ${messageId}`);
  } catch (err) {
    console.warn(`Could not mark as read: ${err}`);
  }
}

// ── Main handler ──

Deno.serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // ── GET: Webhook verification (Meta challenge) ──
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

    console.log(`🔍 Verification attempt - mode: "${mode}", token received: "${token}", expected: "${VERIFY_TOKEN}", challenge: "${challenge}"`);
    console.log(`🔍 Token match: ${token === VERIFY_TOKEN}, token length: ${token?.length}, expected length: ${VERIFY_TOKEN?.length}`);

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ Webhook verified!");
      return new Response(challenge || "", {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    console.warn("❌ Webhook verification failed");
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  // ── POST: Incoming messages ──
  if (req.method === "POST") {
    try {
      const payload = await req.json();

      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");

      if (!WHATSAPP_ACCESS_TOKEN) {
        console.error("WHATSAPP_ACCESS_TOKEN not configured");
        return new Response(JSON.stringify({ error: "Missing WhatsApp token" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      for (const entry of payload.entry || []) {
        for (const change of entry.changes || []) {
          const { value } = change;

          if (!value?.messages) {
            console.log("Status update or non-message event, skipping");
            continue;
          }

          for (const message of value.messages) {
            const phoneNumber = message.from;
            const phoneId = value.metadata.phone_number_id;

            // ── Handle button clicks ──
            if (
              message.type === "interactive" &&
              message.interactive?.button_reply?.id === "buy_now"
            ) {
              console.log(`🎯 BUY BUTTON from ${phoneNumber}`);

              const { data: storeConfig } = await supabase
                .from("store_config")
                .select("user_id")
                .eq("whatsapp_phone_id", phoneId)
                .maybeSingle();

              if (!storeConfig) continue;

              const userId = storeConfig.user_id;

              // Find last interaction
              const { data: lastLog } = await supabase
                .from("interaction_logs")
                .select("id, category_assigned")
                .eq("user_id", userId)
                .eq("contact_name", phoneNumber)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

              if (lastLog) {
                await supabase
                  .from("interaction_logs")
                  .update({ clicked_buy: true })
                  .eq("id", lastLog.id);
              }

              // Create qualified lead
              await supabase.from("qualified_leads").insert({
                user_id: userId,
                contact_name: phoneNumber,
                channel: "whatsapp",
                category: lastLog?.category_assigned || null,
                status: "waiting",
                clicked_at: new Date().toISOString(),
              });

              console.log(`🎉 Qualified lead created for ${phoneNumber}`);
              continue;
            }

            // ── Handle text messages ──
            const messageText = message.text?.body || "";
            if (!messageText) continue;

            console.log(`📨 Message from ${phoneNumber}: "${messageText}"`);

            // Find store config by phone_id
            const { data: storeConfig } = await supabase
              .from("store_config")
              .select("*")
              .eq("whatsapp_phone_id", phoneId)
              .maybeSingle();

            if (!storeConfig) {
              console.warn(`No store config for phone_id: ${phoneId}`);
              continue;
            }

            const userId = storeConfig.user_id;

            // Load custom keywords
            let customKeywords: Record<string, string[]> | undefined;
            const { data: kwData } = await supabase
              .from("keyword_dictionaries")
              .select("*")
              .eq("user_id", userId);

            if (kwData && kwData.length > 0) {
              customKeywords = {};
              for (const kw of kwData) {
                customKeywords[kw.category] = kw.keywords || [];
              }
            }

            // Classify
            const classification = classifyMessage(messageText, customKeywords);

            // Load custom templates
            let templateMap: Record<string, string> = { ...DEFAULT_TEMPLATES };
            const { data: tplData } = await supabase
              .from("templates")
              .select("*")
              .eq("user_id", userId)
              .eq("is_active", true);

            if (tplData && tplData.length > 0) {
              for (const tpl of tplData) {
                templateMap[tpl.category] = tpl.response_text;
              }
            }

            // Build response
            const responseText = buildResponse(classification.category, templateMap, storeConfig);

            // Log interaction
            await supabase.from("interaction_logs").insert({
              user_id: userId,
              contact_name: phoneNumber,
              channel: "whatsapp",
              message_received: messageText,
              category_assigned: classification.category,
              response_sent: responseText,
              status: "auto_replied",
              clicked_buy: false,
            });

            // Send response
            try {
              await sendWhatsAppMessage(phoneNumber, responseText, phoneId, WHATSAPP_ACCESS_TOKEN);
              await markAsRead(message.id, phoneId, WHATSAPP_ACCESS_TOKEN);
            } catch (sendErr) {
              console.error(`Failed to send response: ${sendErr}`);
            }
          }
        }
      }

      // Always return 200 to Meta
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Webhook error:", err);
      // Still return 200 so Meta doesn't retry
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
});
