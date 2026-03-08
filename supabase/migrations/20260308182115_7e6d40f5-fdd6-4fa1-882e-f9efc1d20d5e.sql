
-- Update existing templates with Silouete-specific content
UPDATE public.templates SET response_text = 'Nossos preços variam conforme a linha (Feminina, Gestante, Plus Size). Confira as ofertas exclusivas e combos diretamente no site: {{link_produto}}. O valor final e promoções vigentes aparecem no carrinho. 💰' WHERE category = 'Preço' AND user_id = '7d17bc97-b143-4cd1-a3c8-c31abaeaaf0a';

UPDATE public.templates SET response_text = 'Trabalhamos com uma paleta de cores variada incluindo tons neutros como Preto, Nude e Chocolate. A disponibilidade exata de cores varia por modelo e coleção e pode ser conferida no seletor de produtos do site: {{link_produto}} 🎨' WHERE category = 'Cores' AND user_id = '7d17bc97-b143-4cd1-a3c8-c31abaeaaf0a';

UPDATE public.templates SET response_text = 'Cada produto possui uma tabela de medidas na página. Recomendamos medir busto, cintura e quadril antes da compra. Se estiver entre dois tamanhos, siga a tabela de medidas do produto e priorize conforto. Trabalhamos do P ao 3G! 📏' WHERE category = 'Tamanhos' AND user_id = '7d17bc97-b143-4cd1-a3c8-c31abaeaaf0a';

UPDATE public.templates SET response_text = 'As compras podem ser parceladas em até 12x, dependendo do valor total. Aceitamos cartão de crédito, PIX (com 10% de desconto!), e boleto bancário. As opções aparecem no checkout. 💳' WHERE category = 'Pagamento' AND user_id = '7d17bc97-b143-4cd1-a3c8-c31abaeaaf0a';

UPDATE public.templates SET response_text = 'Enviamos para todo o Brasil! O prazo total inclui o tempo de processamento do pedido e o prazo da transportadora. Frete grátis para compras acima de R$ 249,90. Essas informações aparecem no checkout antes da confirmação. 📦' WHERE category = 'Frete' AND user_id = '7d17bc97-b143-4cd1-a3c8-c31abaeaaf0a';

UPDATE public.templates SET response_text = 'Sim, você pode trocar se errar o tamanho, desde que o produto não tenha sido usado, esteja com etiquetas e dentro do prazo da política. Entre em contato para iniciar o processo! 🔄' WHERE category = 'Trocas' AND user_id = '7d17bc97-b143-4cd1-a3c8-c31abaeaaf0a';

UPDATE public.templates SET response_text = 'Olá! Bem-vinda à Silouete 👋 Sou sua especialista virtual. Posso te ajudar com dúvidas sobre tamanhos, como comprar no site ou rastrear seu pedido. Como posso ajudar hoje?' WHERE category = 'Outro' AND user_id = '7d17bc97-b143-4cd1-a3c8-c31abaeaaf0a';

-- Add 4 new categories
INSERT INTO public.templates (user_id, category, response_text, is_active) VALUES
('7d17bc97-b143-4cd1-a3c8-c31abaeaaf0a', 'Como Comprar', 'As compras são realizadas exclusivamente pelo nosso site: {{link_produto}}. Basta escolher o produto, selecionar o tamanho correto e finalizar o pagamento no checkout. Não realizamos vendas por WhatsApp ou Instagram — esses canais são apenas para orientações e acompanhamento. Trabalhamos com lingerie feminina, lingerie gestante e lingerie plus size. 🛍️', true),
('7d17bc97-b143-4cd1-a3c8-c31abaeaaf0a', 'Rastreamento', 'Para acompanhar seu pedido, acesse a página "Acompanhar Pedido" no site e informe o número do pedido ou CPF. O código de rastreio fica disponível após o envio. 📍', true),
('7d17bc97-b143-4cd1-a3c8-c31abaeaaf0a', 'Segurança', 'Sim, nosso site é 100% seguro! Utilizamos plataformas de pagamento criptografadas e certificado SSL. Pode comprar tranquila! 🔒', true),
('7d17bc97-b143-4cd1-a3c8-c31abaeaaf0a', 'Uso e Indicações', 'Nossas peças são indicadas para uso estético e funcional. Verifique na descrição de cada produto se é indicado para pós-cirúrgico ou uso diário. Priorize sempre o conforto! 💪', true);

-- Add new keyword dictionaries for new categories
INSERT INTO public.keyword_dictionaries (user_id, category, keywords) VALUES
('7d17bc97-b143-4cd1-a3c8-c31abaeaaf0a', 'Como Comprar', ARRAY['comprar', 'compra', 'pedido', 'whatsapp', 'instagram', 'vende por aqui', 'faz pedido', 'linha', 'gestante', 'plus size', 'como faço', 'onde compro', 'site']),
('7d17bc97-b143-4cd1-a3c8-c31abaeaaf0a', 'Rastreamento', ARRAY['rastreio', 'rastrear', 'acompanhar', 'onde está', 'chegou', 'código', 'status do pedido', 'cpf', 'meu pedido']),
('7d17bc97-b143-4cd1-a3c8-c31abaeaaf0a', 'Segurança', ARRAY['seguro', 'segurança', 'confiável', 'golpe', 'fraude', 'criptografia', 'é seguro', 'confiavel']),
('7d17bc97-b143-4cd1-a3c8-c31abaeaaf0a', 'Uso e Indicações', ARRAY['usar', 'dormir', 'cirurgia', 'pós operatório', 'lipo', 'horas', 'tempo', 'dia todo', 'machuca', 'pós cirúrgico', 'indicação']);

-- Update existing keyword dictionaries with richer Silouete keywords
UPDATE public.keyword_dictionaries SET keywords = ARRAY['preço', 'valor', 'custa', 'quanto', 'sale', 'promoção', 'desconto', 'oferta', 'barato', 'caro', 'quanto é', 'quanto tá'] WHERE category = 'Preço' AND user_id = '7d17bc97-b143-4cd1-a3c8-c31abaeaaf0a';

UPDATE public.keyword_dictionaries SET keywords = ARRAY['cor', 'cores', 'disponível', 'tem preto', 'tem nude', 'tem bege', 'chocolate', 'preto', 'branco', 'rosa', 'nude'] WHERE category = 'Cores' AND user_id = '7d17bc97-b143-4cd1-a3c8-c31abaeaaf0a';

UPDATE public.keyword_dictionaries SET keywords = ARRAY['tamanho', 'medida', 'serve', 'veste', 'gg', 'pp', 'plus size', 'xgg', 'cintura', 'busto', 'quadril', 'ficou grande', 'apertado', 'escolher tamanho', 'entre dois tamanhos', '3g', 'tabela'] WHERE category = 'Tamanhos' AND user_id = '7d17bc97-b143-4cd1-a3c8-c31abaeaaf0a';

UPDATE public.keyword_dictionaries SET keywords = ARRAY['pagamento', 'pagar', 'cartão', 'pix', 'boleto', 'parcela', 'juros', '12x', 'parcelamento', 'forma de pagamento', 'à vista'] WHERE category = 'Pagamento' AND user_id = '7d17bc97-b143-4cd1-a3c8-c31abaeaaf0a';

UPDATE public.keyword_dictionaries SET keywords = ARRAY['frete', 'envio', 'correio', 'prazo', 'chega', 'entrega', 'cep', 'grátis', 'transportadora', 'para onde', 'enviam para', 'dias úteis'] WHERE category = 'Frete' AND user_id = '7d17bc97-b143-4cd1-a3c8-c31abaeaaf0a';

UPDATE public.keyword_dictionaries SET keywords = ARRAY['troca', 'devolução', 'devolver', 'trocar', 'não serviu', 'errado', 'política', 'reembolso', 'garantia', 'defeito'] WHERE category = 'Trocas' AND user_id = '7d17bc97-b143-4cd1-a3c8-c31abaeaaf0a';
