

# Meraki — Classificador Automático de Leads

## Visão Geral
Sistema web que classifica mensagens de leads automaticamente, responde dúvidas repetitivas e encaminha apenas leads com intenção de compra para atendimento humano. Inclui simulador de chat integrado para validação imediata e estrutura preparada para WhatsApp Cloud API.

---

## Página 1: Dashboard / Visão Geral
Cards com métricas do dia:
- **Interações hoje** — total de mensagens recebidas
- **Cliques "Quero comprar"** — leads com intenção clara
- **Atendimentos manuais** — conversas assumidas pelo dono
- **Vendas registradas** — fechamentos do dia

Lista das últimas interações com status (respondida automaticamente / aguardando humano / venda registrada).

Paleta: azul escuro (#0B5FFF) primária, verde (#00B894) sucesso, fundo claro (#F5F7FA).

---

## Página 2: Fila de Leads Prontos
Lista de leads que clicaram "Quero comprar", ordenados por mais recente:
- Nome/contato, categoria da dúvida, tempo desde o clique
- Badge verde "Quero comprar"
- Drawer com histórico completo da conversa ao clicar
- Botões "Assumir atendimento" e "Registrar venda"
- Toast animado quando novo lead entra na fila

---

## Página 3: Simulador de Chat
Chat embutido para testar o fluxo sem precisar do WhatsApp:
- Bolhas de mensagem (lead à esquerda, sistema à direita)
- Indicador "digitando..." antes da resposta
- Classificação automática por palavras-chave
- Resposta baseada nos templates configurados
- Botão "Quero comprar" em todas as respostas
- Ao clicar, lead aparece na fila de atendimento

---

## Página 4: Templates de Resposta
Configuração por categoria (Preço, Cores, Tamanhos, Pagamento, Frete, Outro):
- Campo de texto com resposta padrão para cada categoria
- Variáveis: `{{preco}}`, `{{cores_disponiveis}}`, `{{link_produto}}`
- Toggle ativar/desativar por categoria
- Botão para testar no simulador

---

## Página 5: Logs / Histórico
Tabela com todas as interações:
- Data/hora, contato, mensagem, categoria, resposta enviada, clicou "Quero comprar"
- Filtros por data e categoria
- Contadores agregados para validação da hipótese

---

## Página 6: Configurações e Integração
- **Dados da loja**: nome, produtos, valores para templates
- **Dicionário de palavras-chave**: palavras que ativam cada categoria
- **WhatsApp Cloud API**: guia passo a passo, campos para token e phone ID, status de conexão
- **Notificações**: toggle para notificações do navegador

---

## Motor de Classificação
- Dicionário configurável de palavras-chave por categoria
- Matching parcial, case-insensitive
- Fallback para mensagens não reconhecidas com pedido de clarificação + CTA
- Toda resposta termina com botão "Quero comprar"

---

## Backend (Supabase)
- Tabelas: templates, interaction_logs, qualified_leads, store_config, keyword_dictionaries
- Edge function para classificação e resposta automática
- Edge function preparada para webhook do WhatsApp (conexão futura)

---

## Fluxo do Usuário
1. Configura templates e palavras-chave
2. Testa no simulador de chat
3. (Futuro) Conecta WhatsApp Cloud API
4. Recebe notificação quando lead clica "Quero comprar"
5. Abre conversa, vê histórico, assume atendimento
6. Registra venda manualmente

