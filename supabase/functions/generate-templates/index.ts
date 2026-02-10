import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CATEGORY_MAP: Record<string, string> = {
  price: "Preço",
  colors: "Cores",
  sizes: "Tamanhos",
  payment: "Pagamento",
  shipping: "Frete",
  exchanges: "Trocas",
  fallback: "Outro",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL é obrigatória" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um assistente especialista em e-commerce e atendimento ao cliente no Brasil.
Sua tarefa é analisar a URL fornecida e extrair informações sobre a loja para gerar templates de atendimento automático.

Se for um perfil de Instagram, use o contexto do nome de usuário, bio e informações públicas disponíveis.
Se for um site, analise as informações disponíveis sobre produtos, preços, cores, tamanhos, pagamento, frete e trocas.

IMPORTANTE: Gere textos de resposta naturais, educados e vendedores em Português do Brasil.
Use variáveis {{preco}}, {{cores_disponiveis}} e {{link_produto}} quando apropriado nos textos.
Inclua emojis relevantes nos textos de resposta.`;

    const userPrompt = `Analise a loja no endereço: ${url}

Gere templates de atendimento automático para as seguintes categorias:
1. price - Política de Preços e Promoções
2. colors - Cores disponíveis dos produtos
3. sizes - Tabela de Medidas/Tamanhos
4. payment - Formas de Pagamento
5. shipping - Frete e Prazos de entrega
6. exchanges - Política de Trocas e Devoluções
7. fallback - Resposta padrão quando não entender a pergunta

Para cada categoria, gere:
- Um texto de resposta natural e vendedor em PT-BR
- 5 a 10 palavras-chave que os clientes usariam para acionar essa categoria`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "generate_templates",
                description:
                  "Gera templates de atendimento automático para a loja analisada",
                parameters: {
                  type: "object",
                  properties: {
                    templates: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: {
                            type: "string",
                            enum: [
                              "price",
                              "colors",
                              "sizes",
                              "payment",
                              "shipping",
                              "exchanges",
                              "fallback",
                            ],
                          },
                          response_text: { type: "string" },
                          keywords: {
                            type: "array",
                            items: { type: "string" },
                          },
                        },
                        required: ["id", "response_text", "keywords"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["templates"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "generate_templates" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error:
              "Limite de requisições excedido. Tente novamente em alguns minutos.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error:
              "Créditos de IA esgotados. Adicione créditos ao seu workspace.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao conectar com a IA" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "A IA não retornou dados estruturados" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const aiTemplates = parsed.templates;

    // Map AI categories to Meraki categories
    const result = aiTemplates.map(
      (t: { id: string; response_text: string; keywords: string[] }) => ({
        category: CATEGORY_MAP[t.id] || t.id,
        response_text: t.response_text,
        is_active: true,
        keywords: t.keywords,
      })
    );

    return new Response(JSON.stringify({ templates: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-templates error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Erro desconhecido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
