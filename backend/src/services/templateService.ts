// src/services/templateService.ts

import { supabase } from "../config/supabase.js";
import { logger } from "../utils/logger.js";

export interface Template {
  category: string;
  response_text: string;
  is_active: boolean;
}

const DEFAULT_TEMPLATES: Template[] = [
  {
    category: "Preço",
    response_text:
      "O valor do nosso produto é {{preco}}. Temos condições especiais! 💰",
    is_active: true,
  },
  {
    category: "Cores",
    response_text:
      "Temos disponível nas cores: {{cores_disponiveis}}. Qual combina mais com você? 🎨",
    is_active: true,
  },
  {
    category: "Tamanhos",
    response_text:
      "Trabalhamos com tamanhos P, M, G e GG. Posso te ajudar a escolher o ideal? 📏",
    is_active: true,
  },
  {
    category: "Pagamento",
    response_text:
      "Aceitamos PIX, cartão de crédito (até 12x) e boleto bancário. 💳",
    is_active: true,
  },
  {
    category: "Frete",
    response_text:
      "Fazemos envio para todo o Brasil! O prazo médio é de 5-10 dias úteis. 📦",
    is_active: true,
  },
  {
    category: "Trocas",
    response_text:
      "Aceitamos trocas em até 7 dias após o recebimento, desde que o produto esteja sem uso e com etiqueta. Entre em contato para iniciar o processo! 🔄",
    is_active: true,
  },
  {
    category: "Outro",
    response_text: "Obrigado pelo contato! Vou verificar e te respondo em breve. 😊",
    is_active: true,
  },
];

export async function getTemplate(
  userId: string,
  category: string | null
): Promise<Template> {
  try {
    if (!category) {
      return DEFAULT_TEMPLATES.find((t) => t.category === "Outro") || DEFAULT_TEMPLATES[6];
    }

    // Buscar template no banco
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("user_id", userId)
      .eq("category", category)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      logger.warn(`Could not fetch template for ${category}:`, error);
      return getDefaultTemplate(category);
    }

    if (data) {
      return {
        category: data.category,
        response_text: data.response_text,
        is_active: data.is_active,
      };
    }

    return getDefaultTemplate(category);
  } catch (err) {
    logger.error(`Template service error: ${err}`);
    return getDefaultTemplate(category);
  }
}

export function getDefaultTemplate(category: string | null): Template {
  const template = DEFAULT_TEMPLATES.find((t) => t.category === category);
  return (
    template || {
      category: "Outro",
      response_text: DEFAULT_TEMPLATES[6].response_text,
      is_active: true,
    }
  );
}

export function buildResponse(
  category: string | null,
  template: Template,
  storeConfig?: Record<string, any>
): string {
  let response = template.response_text;

  if (storeConfig) {
    response = response
      .replace(/\{\{preco\}\}/g, storeConfig.default_price || "[preço não configurado]")
      .replace(
        /\{\{cores_disponiveis\}\}/g,
        storeConfig.available_colors || "[cores não configuradas]"
      )
      .replace(/\{\{link_produto\}\}/g, storeConfig.product_link || "[link não configurado]");
  }

  return response;
}
