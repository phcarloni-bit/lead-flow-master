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
  { category: 'Como Comprar', response_text: 'As compras são realizadas exclusivamente pelo nosso site: {{link_produto}}. Basta escolher o produto, selecionar o tamanho correto e finalizar o pagamento no checkout. Trabalhamos com lingerie feminina, gestante e plus size. 🛍️', is_active: true },
  { category: 'Rastreamento', response_text: 'Para acompanhar seu pedido, acesse a página "Acompanhar Pedido" no site e informe o número do pedido ou CPF. O código de rastreio fica disponível após o envio. 📍', is_active: true },
  { category: 'Preço', response_text: 'Nossos preços variam conforme a linha (Feminina, Gestante, Plus Size). Confira as ofertas exclusivas e combos diretamente no site: {{link_produto}}. 💰', is_active: true },
  { category: 'Cores', response_text: 'Trabalhamos com uma paleta variada incluindo Preto, Nude e Chocolate. A disponibilidade varia por modelo no site: {{link_produto}} 🎨', is_active: true },
  { category: 'Tamanhos', response_text: 'Cada produto possui tabela de medidas na página. Recomendamos medir busto, cintura e quadril. Trabalhamos do P ao 3G! 📏', is_active: true },
  { category: 'Pagamento', response_text: 'Parcelamos em até 12x! Aceitamos cartão de crédito, PIX (com 10% de desconto!) e boleto bancário. 💳', is_active: true },
  { category: 'Frete', response_text: 'Enviamos para todo o Brasil! Frete grátis para compras acima de R$ 249,90. 📦', is_active: true },
  { category: 'Trocas', response_text: 'Aceitamos trocas desde que o produto esteja sem uso, com etiquetas e dentro do prazo da política. 🔄', is_active: true },
  { category: 'Segurança', response_text: 'Nosso site é 100% seguro! Utilizamos plataformas de pagamento criptografadas e certificado SSL. 🔒', is_active: true },
  { category: 'Uso e Indicações', response_text: 'Nossas peças são indicadas para uso estético e funcional. Verifique na descrição se é indicado para pós-cirúrgico ou uso diário. 💪', is_active: true },
  { category: 'Outro', response_text: 'Olá! Bem-vinda à Silouete 👋 Sou sua especialista virtual. Posso te ajudar com dúvidas sobre tamanhos, como comprar no site ou rastrear seu pedido.', is_active: true },
];
