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
    keywords: ['comprar', 'compra', 'pedido', 'whatsapp', 'instagram', 'vende por aqui', 'faz pedido', 'linha', 'gestante', 'plus size', 'como faço', 'onde compro', 'site', 'quero', 'queria', 'tem como', 'pedir', 'encomenda', 'catálogo'],
  },
  {
    category: 'Rastreamento',
    keywords: ['rastreio', 'rastrear', 'acompanhar', 'onde está', 'chegou', 'código', 'status do pedido', 'cpf', 'meu pedido', 'não chegou', 'quando chega', 'previsão', 'despacho', 'despachado'],
  },
  {
    category: 'Preço',
    keywords: ['preço', 'valor', 'custa', 'quanto', 'sale', 'promoção', 'desconto', 'oferta', 'barato', 'caro', 'quanto é', 'quanto tá', 'tabela de preço', 'cupom'],
  },
  {
    category: 'Cores',
    keywords: ['cor', 'cores', 'disponível', 'tem preto', 'tem nude', 'tem bege', 'chocolate', 'preto', 'branco', 'rosa', 'nude', 'qual cor', 'opções de cor'],
  },
  {
    category: 'Tamanhos',
    keywords: ['tamanho', 'medida', 'serve', 'veste', 'gg', 'pp', 'plus size', 'xgg', 'cintura', 'busto', 'quadril', 'ficou grande', 'apertado', 'escolher tamanho', 'entre dois tamanhos', '3g', 'tabela', 'medir', 'fita métrica', 'qual tamanho'],
  },
  {
    category: 'Pagamento',
    keywords: ['pagamento', 'pagar', 'cartão', 'pix', 'boleto', 'parcela', 'juros', '12x', 'parcelamento', 'forma de pagamento', 'à vista', 'débito', 'crédito', 'desconto pix'],
  },
  {
    category: 'Frete',
    keywords: ['frete', 'envio', 'correio', 'prazo', 'chega', 'entrega', 'cep', 'grátis', 'transportadora', 'para onde', 'enviam para', 'dias úteis', 'frete grátis', 'calcular frete'],
  },
  {
    category: 'Trocas',
    keywords: ['troca', 'devolução', 'devolver', 'trocar', 'não serviu', 'errado', 'política', 'reembolso', 'garantia', 'defeito', 'arrependimento', 'lacrado', 'etiqueta'],
  },
  {
    category: 'Segurança',
    keywords: ['seguro', 'segurança', 'confiável', 'golpe', 'fraude', 'criptografia', 'é seguro', 'confiavel', 'cnpj', 'anvisa', 'plié', 'empresa', 'desde quando', 'legítimo'],
  },
  {
    category: 'Uso e Indicações',
    keywords: ['usar', 'dormir', 'cirurgia', 'pós operatório', 'lipo', 'horas', 'tempo', 'dia todo', 'machuca', 'pós cirúrgico', 'indicação', 'abdominoplastia', 'mamoplastia', 'queimadura', 'gestante', 'gravidez', 'médico'],
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
    return 'Olá! 👋 Não entendi sua dúvida, mas posso te ajudar com informações sobre preço, cores, tamanhos, pagamento, frete, trocas e muito mais!\n\nDigite sua pergunta ou clique em "Quero comprar" que um atendente vai te ajudar! 🛒';
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
  { category: 'Como Comprar', response_text: '🛒 Comprar na SILOUETE é super fácil! Navegue pelo nosso site www.silouete.com.br, escolha seus produtos favoritos como a BERMUDA CAROLINA ou o Sutiã Adesivo Magic Up, adicione ao carrinho e siga os passos para finalizar a compra. Se tiver dúvidas, é só chamar no WhatsApp: +55 92 99449-8688! Boas compras! ✨', is_active: true, keywords: ['comprar', 'como funciona', 'passo a passo', 'ajuda para comprar'] },
  { category: 'Rastreamento', response_text: '📦 Assim que seu pedido for despachado, você receberá um código de rastreamento por e-mail! Com ele, poderá acompanhar todo o trajeto da sua compra da SILOUETE, desde a nossa loja até a sua casa. Fique de olho na caixa de entrada e no spam! 👀', is_active: true, keywords: ['rastreio', 'rastrear pedido', 'onde está meu pedido'] },
  { category: 'Preço', response_text: '💰 Nossos preços são incríveis! Temos desde o Tapa Mamilos Adesivo Flower por R$30,00 até o JUMP REDUCE por R$390,00. Aproveite os descontos! O Sutiã Adesivo Push Up está com 50% OFF, saindo por apenas R$49,99! E tem mais: parcelamos suas compras em até 12x SEM JUROS em produtos acima de R$200. Imperdível! 💖', is_active: true, keywords: ['preço', 'valor', 'quanto custa', 'desconto', 'promoção', 'ofertas'] },
  { category: 'Cores', response_text: '🎨 Nossos produtos estão disponíveis em diversas cores para você arrasar! Os sutiãs adesivos geralmente vêm em tons neutros, e nossas cintas e modeladores, como o BODY SYSTEM, em cores variadas para se adequar ao seu estilo. Para saber as cores exatas de um produto, verifique a página dele em nosso site! 🌈', is_active: true, keywords: ['cor', 'cores disponíveis', 'quais cores'] },
  { category: 'Tamanhos', response_text: '📏 Encontrar o tamanho perfeito é super importante! Nossos produtos, como o Perfect Deep Body e a LEGG SHAPE, estão disponíveis em diversos tamanhos. Consulte a tabela de medidas na página de cada produto no nosso site para garantir o ajuste ideal. Se precisar de ajuda, conte com a gente! 😉', is_active: true, keywords: ['tamanho', 'medidas', 'qual tamanho', 'tabela de tamanhos'] },
  { category: 'Pagamento', response_text: '💳 Para sua comodidade, aceitamos diversas formas de pagamento! Você pode parcelar suas compras! Para produtos acima de R$200, como o BODY CONTOUR ou o TOP SUPPORT, parcelamos em até 12x SEM JUROS! Verifique as opções exatas no checkout. 😉', is_active: true, keywords: ['pagamento', 'parcelamento', 'cartão de crédito', 'formas de pagamento'] },
  { category: 'Frete', response_text: '🚚 O valor do frete é calculado automaticamente no checkout, de acordo com o seu CEP. Assim, você garante o melhor preço para a entrega dos seus produtos SILOUETE, como a BLUSA AMANDA ou a CALCINHA CLARIANE! Adicione seus itens ao carrinho e simule o frete! 📦', is_active: true, keywords: ['frete', 'entrega', 'custo de envio', 'valor do frete'] },
  { category: 'Trocas', response_text: '🔄 Queremos que você esteja 100% satisfeita! Se precisar trocar algum produto, como o SUTIÃ ALAIA ou a Bermuda Lilibete, consulte nossa política de trocas e devoluções no rodapé do nosso site. Estamos aqui para ajudar! 💖', is_active: true, keywords: ['troca', 'devolução', 'arrepender', 'insatisfeito'] },
  { category: 'Segurança', response_text: '🔒 Sua segurança é nossa prioridade! A SILOUETE é hospedada na Nuvemshop, uma plataforma robusta e confiável, que garante a proteção dos seus dados e transações. Pode comprar sem preocupação! Suas informações estão seguras conosco! ✅', is_active: true, keywords: ['segurança', 'confiança', 'site seguro', 'dados'] },
  { category: 'Uso e Indicações', response_text: '💡 Nossos produtos têm indicações específicas! Temos a CALCINHA AMÁLIA para gestantes, o SHAPE BRA para pós-cirúrgico e também a Placa Pélvica Pós-Parto 2 em 1. Além disso, a linha masculina conta com JUMP REDUCE e MASTO WAIST. Para uso e indicações detalhadas, verifique a descrição de cada produto em nosso site ou nos chame no WhatsApp: +55 92 99449-8688! 💖', is_active: true, keywords: ['uso', 'indicação', 'como usar', 'para que serve'] },
  { category: 'Outro', response_text: 'Olá! Não encontrei a resposta para sua pergunta em meus templates. Mas não se preocupe! Você pode nos chamar no WhatsApp: +55 92 99449-8688. Nossa equipe está pronta para te ajudar com qualquer dúvida sobre nossas cintas modeladoras, shapewears, lingeries e acessórios! 💖', is_active: true, keywords: ['outra pergunta', 'dúvida geral', 'ajuda'] },
];
