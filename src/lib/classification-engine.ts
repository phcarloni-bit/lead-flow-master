export interface KeywordDictionary {
  category: string;
  keywords: string[];
}

export interface ClassificationResult {
  category: string | null;
  matched: boolean;
}

// Priority order: higher priority categories are checked first
const CATEGORY_PRIORITY: string[] = [
  'Como Comprar',
  'Rastreamento',
  'Preço',
  'Uso e Indicações',
  'Segurança',
  'Cores',
  'Tamanhos',
  'Pagamento',
  'Frete',
  'Trocas',
];

const normalize = (str: string): string =>
  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const DEFAULT_DICTIONARIES: KeywordDictionary[] = [
  {
    category: 'Como Comprar',
    keywords: ['comprar', 'compra', 'pedido', 'whatsapp', 'instagram', 'vende por aqui', 'faz pedido', 'linha', 'gestante', 'plus size', 'como faço', 'onde compro', 'site'],
  },
  {
    category: 'Rastreamento',
    keywords: ['rastreio', 'rastrear', 'acompanhar', 'onde está', 'chegou', 'código', 'status do pedido', 'cpf', 'meu pedido'],
  },
  {
    category: 'Preço',
    keywords: ['preço', 'valor', 'custa', 'quanto', 'sale', 'promoção', 'desconto', 'oferta', 'barato', 'caro', 'quanto é', 'quanto tá'],
  },
  {
    category: 'Cores',
    keywords: ['cor', 'cores', 'disponível', 'tem preto', 'tem nude', 'tem bege', 'chocolate', 'preto', 'branco', 'rosa', 'nude'],
  },
  {
    category: 'Tamanhos',
    keywords: ['tamanho', 'medida', 'serve', 'veste', 'gg', 'pp', 'plus size', 'xgg', 'cintura', 'busto', 'quadril', 'ficou grande', 'apertado', 'escolher tamanho', 'entre dois tamanhos', '3g', 'tabela'],
  },
  {
    category: 'Pagamento',
    keywords: ['pagamento', 'pagar', 'cartão', 'pix', 'boleto', 'parcela', 'juros', '12x', 'parcelamento', 'forma de pagamento', 'à vista'],
  },
  {
    category: 'Frete',
    keywords: ['frete', 'envio', 'correio', 'prazo', 'chega', 'entrega', 'cep', 'grátis', 'transportadora', 'para onde', 'enviam para', 'dias úteis'],
  },
  {
    category: 'Trocas',
    keywords: ['troca', 'devolução', 'devolver', 'trocar', 'não serviu', 'errado', 'política', 'reembolso', 'garantia', 'defeito'],
  },
  {
    category: 'Segurança',
    keywords: ['seguro', 'segurança', 'confiável', 'golpe', 'fraude', 'criptografia', 'é seguro', 'confiavel'],
  },
  {
    category: 'Uso e Indicações',
    keywords: ['usar', 'dormir', 'cirurgia', 'pós operatório', 'lipo', 'horas', 'tempo', 'dia todo', 'machuca', 'pós cirúrgico', 'indicação'],
  },
];

export function classifyMessage(
  message: string,
  dictionaries?: KeywordDictionary[]
): ClassificationResult {
  const dicts = dictionaries && dictionaries.length > 0 ? dictionaries : DEFAULT_DICTIONARIES;
  const normalizedMessage = normalize(message);

  // Sort dictionaries by priority order
  const sortedDicts = [...dicts].sort((a, b) => {
    const idxA = CATEGORY_PRIORITY.indexOf(a.category);
    const idxB = CATEGORY_PRIORITY.indexOf(b.category);
    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
  });

  for (const dict of sortedDicts) {
    for (const keyword of dict.keywords) {
      if (normalizedMessage.includes(normalize(keyword))) {
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
    return 'Não entendi sua dúvida. Poderia reformular? 😊\n\nSe quiser, posso te ajudar com informações sobre preço, cores, tamanhos, pagamento ou frete.\n\nSe já decidiu, clique em "Quero comprar" que um atendente vai te ajudar! 🛒';
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

  // Append CTA to all responses
  if (!response.includes('Quero comprar')) {
    response += '\n\nGostou? Clique em "Quero comprar" para falar com um atendente! 🛒';
  }

  return response;
}

export const DEFAULT_TEMPLATES = [
  { category: 'Preço', response_text: 'O valor do nosso produto é {{preco}}. Temos condições especiais! 💰', is_active: true },
  { category: 'Cores', response_text: 'Temos disponível nas cores: {{cores_disponiveis}}. Qual combina mais com você? 🎨', is_active: true },
  { category: 'Tamanhos', response_text: 'Trabalhamos com tamanhos P, M, G e GG. Posso te ajudar a escolher o ideal? 📏', is_active: true },
  { category: 'Pagamento', response_text: 'Aceitamos PIX, cartão de crédito (até 12x) e boleto bancário. 💳', is_active: true },
  { category: 'Frete', response_text: 'Fazemos envio para todo o Brasil! O prazo médio é de 5-10 dias úteis. 📦', is_active: true },
  { category: 'Trocas', response_text: 'Aceitamos trocas em até 7 dias após o recebimento, desde que o produto esteja sem uso e com etiqueta. Entre em contato para iniciar o processo! 🔄', is_active: true },
  { category: 'Outro', response_text: 'Obrigado pelo contato! Vou verificar e te respondo em breve. 😊', is_active: true },
];
