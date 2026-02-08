export interface KeywordDictionary {
  category: string;
  keywords: string[];
}

export interface ClassificationResult {
  category: string | null;
  matched: boolean;
}

const DEFAULT_DICTIONARIES: KeywordDictionary[] = [
  {
    category: 'Preço',
    keywords: ['preço', 'quanto custa', 'valor', 'quanto é', 'quanto tá', 'quanto ta', 'barato', 'caro', 'desconto', 'promoção', 'promocao', 'oferta'],
  },
  {
    category: 'Cores',
    keywords: ['cor', 'cores', 'colorido', 'preto', 'branco', 'azul', 'vermelho', 'rosa', 'verde', 'amarelo'],
  },
  {
    category: 'Tamanhos',
    keywords: ['tamanho', 'tamanhos', 'número', 'numero', 'medida', 'p ', 'm ', 'g ', 'gg', 'pp', 'grande', 'pequeno'],
  },
  {
    category: 'Pagamento',
    keywords: ['pagamento', 'pagar', 'parcela', 'parcelamento', 'pix', 'cartão', 'cartao', 'boleto', 'dinheiro', 'à vista', 'a vista'],
  },
  {
    category: 'Frete',
    keywords: ['frete', 'entrega', 'envio', 'prazo', 'chegar', 'correios', 'sedex', 'transportadora', 'retirar'],
  },
];

export function classifyMessage(
  message: string,
  dictionaries?: KeywordDictionary[]
): ClassificationResult {
  const dicts = dictionaries && dictionaries.length > 0 ? dictionaries : DEFAULT_DICTIONARIES;
  const lowerMessage = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  for (const dict of dicts) {
    for (const keyword of dict.keywords) {
      const normalizedKeyword = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (lowerMessage.includes(normalizedKeyword)) {
        return { category: dict.category, matched: true };
      }
    }
  }

  return { category: null, matched: false };
}

export function buildResponse(
  category: string | null,
  templates: { category: string; response_text: string; is_active: boolean }[],
  storeConfig?: { default_price?: string; available_colors?: string; product_link?: string }
): string {
  if (!category) {
    return 'Não entendi sua dúvida. Poderia reformular? 😊\n\nSe quiser, posso te ajudar com informações sobre preço, cores, tamanhos, pagamento ou frete.';
  }

  const template = templates.find((t) => t.category === category && t.is_active);
  if (!template) {
    return `Obrigado pela sua pergunta sobre ${category.toLowerCase()}! Em breve teremos mais informações.`;
  }

  let response = template.response_text;
  if (storeConfig) {
    response = response
      .replace(/\{\{preco\}\}/g, storeConfig.default_price || '[preço não configurado]')
      .replace(/\{\{cores_disponiveis\}\}/g, storeConfig.available_colors || '[cores não configuradas]')
      .replace(/\{\{link_produto\}\}/g, storeConfig.product_link || '[link não configurado]');
  }

  return response;
}

export const DEFAULT_TEMPLATES = [
  { category: 'Preço', response_text: 'O valor do nosso produto é {{preco}}. Temos condições especiais! 💰', is_active: true },
  { category: 'Cores', response_text: 'Temos disponível nas cores: {{cores_disponiveis}}. Qual combina mais com você? 🎨', is_active: true },
  { category: 'Tamanhos', response_text: 'Trabalhamos com tamanhos P, M, G e GG. Posso te ajudar a escolher o ideal? 📏', is_active: true },
  { category: 'Pagamento', response_text: 'Aceitamos PIX, cartão de crédito (até 12x) e boleto bancário. 💳', is_active: true },
  { category: 'Frete', response_text: 'Fazemos envio para todo o Brasil! O prazo médio é de 5-10 dias úteis. 📦', is_active: true },
  { category: 'Outro', response_text: 'Obrigado pelo contato! Vou verificar e te respondo em breve. 😊', is_active: true },
];
