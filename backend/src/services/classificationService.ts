// src/services/classificationService.ts

import { supabase } from "../config/supabase.js";
import { logger } from "../utils/logger.js";
import { ClassificationResult } from "../types/whatsapp.js";

// Default dictionaries (copied from frontend)
const DEFAULT_KEYWORDS: Record<string, string[]> = {
  Preço: [
    "preço",
    "quanto custa",
    "valor",
    "quanto é",
    "barato",
    "caro",
    "desconto",
    "promoção",
    "oferta",
  ],
  Cores: ["cor", "cores", "colorido", "preto", "branco", "azul", "vermelho", "rosa", "verde"],
  Tamanhos: ["tamanho", "número", "medida", "p ", "m ", "g ", "gg", "grande", "pequeno"],
  Pagamento: ["pagamento", "pagar", "parcela", "pix", "cartão", "boleto", "dinheiro"],
  Frete: ["frete", "entrega", "envio", "prazo", "correios", "sedex", "transportadora"],
  Trocas: ["troca", "devolução", "defeito", "arrependimento", "reembolso", "garantia"],
};

export async function classifyMessage(
  text: string,
  userId?: string
): Promise<ClassificationResult> {
  try {
    if (!text || text.trim().length === 0) {
      return { category: null, matched: false };
    }

    const normalizedText = normalizeText(text);
    let keywordDict = DEFAULT_KEYWORDS;

    // Se tiver userId, buscar keywords customizadas
    if (userId) {
      try {
        const { data: customKeywords } = await supabase
          .from("keyword_dictionaries")
          .select("*")
          .eq("user_id", userId);

        if (customKeywords && customKeywords.length > 0) {
          keywordDict = {};
          customKeywords.forEach((kw) => {
            keywordDict[kw.category] = kw.keywords || [];
          });
        }
      } catch (err) {
        logger.warn(`Could not fetch custom keywords for user ${userId}`, err);
        // Fall back to defaults
      }
    }

    // Verificar contra cada categoria
    for (const [category, keywords] of Object.entries(keywordDict)) {
      for (const keyword of keywords) {
        const normalizedKeyword = normalizeText(keyword);
        if (normalizedText.includes(normalizedKeyword)) {
          logger.info(`✅ Classification: "${text}" → "${category}" (matched keyword: "${keyword}")`);
          return { category, matched: true };
        }
      }
    }

    logger.info(`⚠️ No classification for: "${text}"`);
    return { category: null, matched: false };
  } catch (err) {
    logger.error(`Classification error: ${err}`);
    return { category: null, matched: false };
  }
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
