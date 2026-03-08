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
  { category: 'Como Comprar', response_text: 'Olá! 🛍️ As compras na Silouete são feitas exclusivamente pelo nosso site: {{link_produto}}\n\n📌 Passo a passo:\n1. Acesse o site e escolha o produto desejado\n2. Selecione a cor e o tamanho correto (consulte nossa tabela de medidas!)\n3. Adicione ao carrinho\n4. Escolha a forma de pagamento e finalize\n\nTrabalhamos com malhas compressivas pós-cirúrgicas, modeladores, cintas gestantes, linha plus size e muito mais! Se precisar de ajuda para escolher, é só perguntar 😊', is_active: true },
  { category: 'Rastreamento', response_text: 'Para acompanhar seu pedido, acesse a página "Acompanhar Pedido" no nosso site e informe o número do pedido ou CPF cadastrado 📍\n\nO código de rastreio é enviado por e-mail e WhatsApp assim que seu pedido é despachado. Se ainda não recebeu, aguarde até 2 dias úteis após a confirmação do pagamento.\n\n📦 Dica: verifique também sua caixa de spam!', is_active: true },
  { category: 'Preço', response_text: 'Nossos preços variam conforme o modelo e a linha! 💰\n\n🔹 Cintas modeladoras: a partir de {{preco}}\n🔹 Malhas pós-cirúrgicas (marca Plié): consulte no site\n🔹 Linha gestante e plus size: preços especiais\n\n🎉 Fique de olho nas nossas promoções no Instagram @siloueteshapewear!\n\nConfira todos os produtos e valores em: {{link_produto}}', is_active: true },
  { category: 'Cores', response_text: 'Trabalhamos com as cores: {{cores_disponiveis}} 🎨\n\nA disponibilidade pode variar por modelo. Para ver quais cores estão disponíveis no produto desejado, acesse: {{link_produto}}\n\n💡 Dica: Preto e Nude são as cores mais versáteis e combinam com qualquer roupa!', is_active: true },
  { category: 'Tamanhos', response_text: 'Cada produto da Silouete possui uma tabela de medidas específica na página! 📏\n\n📐 Como medir corretamente:\n1. Use uma fita métrica flexível\n2. Meça busto, cintura e quadril na parte mais larga\n3. Compare com a tabela do produto escolhido\n\nTrabalhamos do PP ao 3G (Plus Size)! Se você estiver entre dois tamanhos, recomendamos o maior para maior conforto.\n\n❓ Ficou em dúvida? Me diga suas medidas que te ajudo a escolher!', is_active: true },
  { category: 'Pagamento', response_text: 'Aceitamos diversas formas de pagamento! 💳\n\n✅ PIX — com 10% de desconto!\n✅ Cartão de crédito — em até 12x sem juros\n✅ Boleto bancário\n✅ Cartão de débito\n\nTodas as transações são 100% seguras com criptografia de dados. Compre com tranquilidade! 🔒', is_active: true },
  { category: 'Frete', response_text: 'Enviamos para todo o Brasil! 📦\n\n🚚 Frete grátis para compras acima de R$ 249,90\n⏰ Prazo de entrega: 5 a 15 dias úteis (varia conforme a região)\n📍 Estamos em processo de mudança de Manaus/AM para Goiás, o que vai agilizar ainda mais nossas entregas!\n\nPara calcular o frete do seu CEP, adicione o produto ao carrinho no site: {{link_produto}}', is_active: true },
  { category: 'Trocas', response_text: 'Aceitamos trocas e devoluções! 🔄\n\n📋 Condições:\n• O produto deve estar sem uso, com etiquetas originais\n• Prazo de até 7 dias após o recebimento\n• A primeira troca por tamanho é gratuita!\n\n📩 Para solicitar, entre em contato por WhatsApp ou pelo e-mail informado na nota fiscal. Enviaremos as instruções de envio.\n\n⚠️ Produtos de uso íntimo só podem ser trocados se estiverem lacrados.', is_active: true },
  { category: 'Segurança', response_text: 'Sua compra na Silouete é 100% segura! 🔒\n\n✅ Site com certificado SSL (cadeado verde)\n✅ Plataforma de pagamento criptografada\n✅ Empresa registrada com CNPJ ativo\n✅ Autorização ANVISA nº 8.12.028-4\n✅ Distribuidora exclusiva da marca Plié no Amazonas\n✅ Empresa familiar desde 2012\n\nSua segurança e satisfação são nossa prioridade! 💜', is_active: true },
  { category: 'Uso e Indicações', response_text: 'Nossas peças têm diferentes indicações! 💪\n\n🩺 Pós-cirúrgico (lipo, abdominoplastia, mamoplastia): use conforme orientação médica, geralmente 24h/dia nos primeiros 30-60 dias\n🤰 Gestante: cintas específicas para suporte lombar durante a gravidez\n👗 Uso diário/estético: modeladores para o dia a dia, pode usar por até 8-10 horas\n🔥 Pós-queimadura: malhas compressivas especializadas\n\n⚠️ Sempre consulte seu médico para indicações pós-cirúrgicas!\n\n📌 Veja a descrição completa de cada produto em: {{link_produto}}', is_active: true },
  { category: 'Outro', response_text: 'Olá! Bem-vinda à Silouete Shapewear! 👋💜\n\nSou sua assistente virtual e posso te ajudar com:\n\n🛍️ Como comprar no site\n📏 Escolha de tamanho\n💰 Preços e promoções\n🎨 Cores disponíveis\n💳 Formas de pagamento\n📦 Frete e prazo de entrega\n📍 Rastreamento de pedido\n🔄 Trocas e devoluções\n🩺 Uso e indicações dos produtos\n\nDigite sua dúvida que vou te ajudar! 😊', is_active: true },
];
