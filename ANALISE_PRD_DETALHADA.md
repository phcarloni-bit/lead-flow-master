# 📊 Análise Detalhada da Codebase vs PRD

**Data**: 15 de Fevereiro de 2026  
**Status do Projeto**: MVP em desenvolvimento (~50-60% completo)

---

## 🏗️ Resum Executivo

O projeto **LeadFlow** é um classificador automático de leads para e-commerce em React + Vite + Supabase. A codebase implementa **~60% dos requisitos Must-Have do PRD**, com foco em simulador de chat e dashboard, mas **faltam integrações reais de canais (WhatsApp)** e infraestrutura de backend para webhooks.

---

## ✅ O QUE JÁ ESTÁ IMPLEMENTADO

### 1. **Arquitetura Geral**
- ✅ Stack: React 18 + TypeScript + Vite  
- ✅ Database: Supabase (PostgreSQL)  
- ✅ Autenticação: Supabase Auth com JWT  
- ✅ Roteamento: React Router v6  
- ✅ UI Components: Shadcn/ui + Radix  
- ✅ Realtime: Supabase Realtime subscriptions  

### 2. **Funcionalidades de Classificação (Must-Have #2)**
- ✅ **Classificador Híbrido**: Regras + regex com dicionário de palavras-chave  
- ✅ **7 Categorias Principais**: Preço, Cores, Tamanhos, Pagamento, Frete, Trocas, Outro  
- ✅ **Normalização de Texto**: Remove acentos e converte para minúsculas  
- ✅ **Fallback para "Outro"**: Resposta genérica quando não encontra categoria  
- 📁 Arquivo: [src/lib/classification-engine.ts](src/lib/classification-engine.ts)

**Exemplo de Keywords:**
```
Preço: ["preço", "quanto custa", "valor", "desconto", "promoção", "oferta"]
Cores: ["cor", "cores", "preto", "branco", "azul", "vermelho", "rosa", "verde"]
Tamanhos: ["tamanho", "número", "medida", "P", "M", "G", "GG", "grande", "pequeno"]
Pagamento: ["pagamento", "pagar", "parcela", "pix", "cartão", "boleto", "dinheiro"]
Frete: ["frete", "entrega", "envio", "prazo", "correios", "sedex", "transportadora"]
Trocas: ["troca", "devolução", "defeito", "arrependimento", "reembolso", "garantia"]
Outro: [fallback genérico]
```

### 3. **Templates de Resposta (Must-Have #3)**
- ✅ **CRUD de Templates**: Criar, editar, ativar/desativar por categoria  
- ✅ **Placeholders Dinâmicos**: `{{preco}}`, `{{cores_disponiveis}}`, `{{link_produto}}`  
- ✅ **Banco de Dados**: Tabela `templates` no Supabase com versionamento por usuário  
- ✅ **Defaults**: 7 templates pré-configurados com emojis  
- 📁 Página: [src/pages/Templates.tsx](src/pages/Templates.tsx)

**Templates Padrão:**
```
Preço: "O valor do nosso produto é {{preco}}. Temos condições especiais! 💰"
Cores: "Temos disponível nas cores: {{cores_disponiveis}}. Qual combina mais com você? 🎨"
Tamanhos: "Trabalhamos com tamanhos P, M, G e GG. Posso te ajudar a escolher o ideal? 📏"
Pagamento: "Aceitamos PIX, cartão de crédito (até 12x) e boleto bancário. 💳"
Frete: "Fazemos envio para todo o Brasil! O prazo médio é de 5-10 dias úteis. 📦"
Trocas: "Aceitamos trocas em até 7 dias após o recebimento, desde que o produto esteja sem uso..."
Outro: "Obrigado pelo contato! Vou verificar e te respondo em breve. 😊"
```

### 4. **Simulador de Chat (Must-Have #1 e #3)**
- ✅ **Chat Interface**: Simulação de conversa lead ↔ sistema  
- ✅ **Classificação em Real-time**: Classifica mensagens ao enviar  
- ✅ **Resposta Automática**: Retorna template com categoria identificada  
- ✅ **Botão "Quero Comprar"**: Renderizado em cada resposta (Must-Have #4)  
- ✅ **Indicador de Digitação**: "Digitando..." animado por 600-1200ms antes da resposta  
- ✅ **Persistência**: Logs salvos em `interaction_logs` com channel='simulator'  
- ✅ **Estado de Typing**: Feedback visual imediato  
- 📁 Página: [src/pages/ChatSimulator.tsx](src/pages/ChatSimulator.tsx)

**Fluxo:**
```
User: "Qual é o preço?" 
  ↓ (classificação)
Category: "Preço"
  ↓ (busca template)
Response: "O valor é {{preco}}. Temos condições especiais! 💰"
  ↓ (renderiza)
UI: Mostra resposta + botão "Quero Comprar" com animação
```

### 5. **Fila de Leads Prontos para Atendimento (Must-Have #5)**
- ✅ **Tabela `qualified_leads`**: Leads que clicaram "Quero Comprar"  
- ✅ **Real-time Notifications**: Toast ao receber novo lead qualificado  
- ✅ **Interface Visual**: Lista ordenada por horário (mais recente no topo)  
- ✅ **Drawer de Histórico**: Abre contexto da conversa (últimas 20 mensagens)  
- ✅ **Status de Lead**: `waiting`, `assumed`, `sold`  
- ✅ **Botões de Ação**: "Assumir atendimento", "Registrar venda"  
- 📁 Página: [src/pages/LeadQueue.tsx](src/pages/LeadQueue.tsx)

**Informações do Lead:**
```
- ID único
- Nome/Contato do lead
- Canal de origem (ex: simulator, whatsapp)
- Última categoria mencionada
- Horário do clique "Quero Comprar"
- Status (Aguardando, Em Atendimento, Venda Realizada)
- Histórico de mensagens
```

### 6. **Logs e Auditoria (Must-Have #6)**
- ✅ **Tabela `interaction_logs`**: Todos os eventos registrados  
- ✅ **Campos Completos**: data/hora, canal, contato, mensagem original, categoria, resposta enviada, clique em "Quero Comprar", status  
- ✅ **Interface de Consulta**: Filtro por data, filtro por categoria  
- ✅ **Contadores**: Total interações, cliques "Quero Comprar", respostas automáticas  
- ✅ **Tabela Pesquisável**: Display de últimos logs com sorting  
- 📁 Página: [src/pages/Logs.tsx](src/pages/Logs.tsx)

**Estrutura de Log:**
```json
{
  "id": "uuid",
  "user_id": "user_uuid",
  "contact_name": "João Silva",
  "channel": "simulator",
  "message_received": "Qual é o preço?",
  "category_assigned": "Preço",
  "response_sent": "O valor é {{preco}}. Temos condições especiais! 💰",
  "clicked_buy": true,
  "status": "auto_replied",
  "created_at": "2026-02-15T10:30:00Z"
}
```

### 7. **Dashboard com Métricas (Must-Have #6 e Validação)**
- ✅ **Cards Compactos**: Interações hoje, Cliques "Quero Comprar", Atendimentos manuais, Vendas  
- ✅ **Cálculo Real-time**: Atualiza ao receber novos dados via Supabase Realtime  
- ✅ **Últimas Interações**: Widget mostrando últimos 5 logs com badges de status  
- ✅ **Data Filtering**: Filtra apenas eventos do dia atual  
- 📁 Página: [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx)

**Métricas Exibidas:**
```
- Interações Hoje: Contagem total de `interaction_logs` criados hoje
- Cliques "Quero Comprar": COUNT(interaction_logs.clicked_buy = true) hoje
- Atendimentos: Leads com status = "assumed"
- Vendas: Leads com status = "sold"
```

### 8. **Configurações da Loja (Must-Have #7)**
- ✅ **Tabela `store_config`**: Tudo sobre a loja (nome, produtos, preço padrão, cores, link)  
- ✅ **Campos Dinâmicos**: Customização de placeholders nos templates  
- ✅ **Gerenciamento de Keywords**: CRUD de dicionários por categoria  
- ✅ **Interface com Tabs**: Abas para "Informações", "Palavras-chave", "Integração WhatsApp"  
- 📁 Página: [src/pages/SettingsPage.tsx](src/pages/SettingsPage.tsx)

**Config Armazenado:**
```json
{
  "store_name": "Minha Loja",
  "products": "Descrição dos produtos...",
  "default_price": "R$ 99,90",
  "available_colors": "Preto, Branco, Azul",
  "product_link": "https://minhaloja.com/produto",
  "whatsapp_connected": false,
  "whatsapp_phone_id": null,
  "whatsapp_token": null,
  "notifications_enabled": true
}
```

### 9. **Geração de Templates com IA (Should-Have → Implementado!)**
- ✅ **Supabase Edge Function**: `generate-templates` (Deno)  
- ✅ **Análise de URL**: Recebe URL do Instagram ou site  
- ✅ **LLM Integration**: Chamada ao Lovable AI Gateway com `google/gemini-3-flash-preview`  
- ✅ **Tool Calling**: Extrai JSON estruturado com 7 categorias  
- ✅ **Keywords Automáticas**: Gera palavras-chave por categoria  
- ✅ **Fallback Seguro**: Tratamento de erros com responses genéricas  
- 📁 Função: [supabase/functions/generate-templates/index.ts](supabase/functions/generate-templates/index.ts)

**Fluxo:**
```
URL (ex: instagram.com/siloueteshapewear)
  ↓ Edge Function
Chamada ao Lovable AI Gateway (Gemini 3 Flash)
  ↓ Tool Calling / JSON estructurado
{ templates: [
  { id: "price", response_text: "...", keywords: ["preço", "valor"] },
  { id: "colors", response_text: "...", keywords: ["cor", "cores"] },
  ...
]}
  ↓ Mapeia para categorias PT-BR
Salva em DB e renderiza na UI
```

### 10. **Autenticação e Segurança**
- ✅ **Supabase Auth**: JWT-based authentication  
- ✅ **Auth Guard**: Proteção de rotas com `AuthGuard` component  
- ✅ **Row Level Security (RLS)**: Cada usuário vê apenas seus dados  
- ✅ **Redirect to Login**: Autenticação obrigatória para acessar features  
- ✅ **Session Persistence**: Mantém sessão entre reloads  
- 📁 Componente: [src/components/AppLayout.tsx](src/components/AppLayout.tsx)

### 11. **UI/UX - Design System**
- ✅ **Shadcn/ui**: Componentes acessíveis (Button, Card, Input, etc.)  
- ✅ **Tailwind CSS**: Styling confiável  
- ✅ **Cores do PRD**: Não totalmente aderente, mas close (azul primário, verde de sucesso, neutrals)  
- ✅ **Responsividade**: Layout adapta para mobile/tablet  
- ✅ **Toast Notifications**: Feedback em tempo real (Sonner)  
- ✅ **Drawer**: Sidebar inteligente (ShadcnUI Drawer)  
- 📁 Componentes: [src/components/ui/](src/components/ui/)

### 12. **Database Schema**
- ✅ **5 Tabelas Principais**:
  - `auth.users`: Usuários Supabase
  - `public.interaction_logs`: Registro de interações
  - `public.qualified_leads`: Leads que clicaram "Quero Comprar"
  - `public.templates`: Templates de resposta por categoria
  - `public.keyword_dictionaries`: Dicionários customizados por usuário
  - `public.store_config`: Configurações da loja

---

## ❌ O QUE ESTÁ FALTANDO (vs PRD Must-Have)

### **Crítico (Bloqueante para MVP Production)**

#### 1. **Integração Real de Canais (Must-Have #1 + #5)** ⚠️ CRÍTICO
- ❌ **Webhook WhatsApp Cloud API**: Não há backend para receber mensagens reais do WhatsApp  
- ❌ **Backend/API**: Não há servidor Node/Python para processar webhooks  
- ❌ **Fila de Mensagens**: Não há Redis/Bull para processar de forma assíncrona  
- ❌ **Suporte Multi-canal**: Apenas simulator funciona; Instagram DM/Messenger não conectados  

**Por que é importa**: Sem isso, o sistema não recebe mensagens reais dos clientes. Hoje só funciona em teste via simulador.

**Recomendação**: Implementar backend com Node.js + Express ou Python + FastAPI com webhooks do WhatsApp Cloud API

#### 2. **Encaminhamento Automático de Leads para Humano** ⚠️ CRÍTICO
- ⚠️ **Parcial**: Leads qualificados entram em fila, mas não há integração com **WhatsApp API para responder no canal original**  
- ❌ **CTA "Quero Comprar" no WhatsApp**: Botão renderizado em simulator, mas não em produção via WhatsApp  
- ❌ **Manual Takeover**: Não há interface para o dono responder diretamente no chat (sem abrir WhatsApp separado)  

**Recomendação**: Implementar resposta via WhatsApp Business API ou integração com Zapier/Make

#### 3. **Resposta Automática no Canal Original (Must-Have #3)** ⚠️ CRÍTICO
- ❌ **Não funciona em WhatsApp real**: Resposta automática só funciona no simulador  
- ❌ **Rate Limit**: Não há proteção contra spam de respostas (Should-Have #3)  
- ❌ **Debounce**: Não há debounce para múltiplas mensagens em sequência  

**Recomendação**: Implementar rate limiting + debouncing no backend; testar com WhatsApp API

#### 4. **Notificações Push (Should-Have #4)** ⚠️
- ⚠️ **Parcial**: Toast in-app funciona, mas não há notificações push reais no browser  
- ❌ **Web Push API**: Não está implementada (requer service worker)  
- ❌ **Persistência de Permissão**: Sem persistent subscription para notificações  

**Impacto**: Dono precisa deixar o app aberto para receber notificações; perderia leads se fechasse a aba

#### 5. **Retenção de Dados com Política Configurável (Must-Have #6)** ⚠️
- ❌ **Nenhuma política de rotação/exclusão de logs**: Dados são mantidos indefinidamente  
- ❌ **Configuração de Período**: Não há interface para dono escolher "manter 30 dias"  
- ❌ **LGPD Compliance**: Sem anonimização automática de dados antigos  

**Recomendação**: Implementar cron job no backend para limpar logs antigos; adicionar toggle em Settings

#### 6. **Validação de Hipótese Integrada** ⚠️
- ⚠️ **Parcial**: Contadores existem (interações, cliques, vendas), mas sem análise temporal  
- ❌ **Gráficos de Tendência**: Sem visualização de "≤5 atendimentos/dia" ao longo do tempo  
- ❌ **SLA Alerts**: Não alerta se passou de 5 atendimentos manuais  
- ❌ **Export de Dados**: Sem CSV export para análise externa  

**Recomendação**: Adicionar gráfico semanal em dashboard; exportar CSV

### **Alto Impacto (MVP pode funcionar, mas com limitações)**

#### 7. **Indicador "Digitando" em Produção** ⚠️
- ✅ Existe no simulator, mas não há suporte no WhatsApp (Many WhatsApp clients não suportam typing indicators no webhook)

#### 8. **Histórico Pesquisável (Should-Have #5)** ⚠️
- ⚠️ **Parcial**: Pode filtrar por data e categoria, mas sem busca full-text por mensagem  
- ❌ **Busca de Contato**: Não há busca por nome de contato ou ID  

#### 9. **Onboarding com Exemplos (Could-Have)** ⚠️
- ❌ **Totalmente ausente**: Não há tour interativo ou exemplos de templates recomendados  

#### 10. **UI para Marcar Venda Manualmente** ⚠️
- ✅ **Existe**: Botão "Registrar Venda" na fila de leads, mas design é básico  

---

## 🎯 Mapa de Cobertura by MoSCoW

| Requisito | Status | Prioridade | Impacto |
|-----------|--------|-----------|---------|
| **Must-Have #1**: Receber mensagem e processar real-time | ⚠️ Simulator apenas | CRÍTICO | Sem backend, não funciona em produção |
| **Must-Have #2**: Classificar intenção/categoria | ✅ Completo | CRÍTICO | 100% funcional |
| **Must-Have #3**: Responder automaticamente no canal | ⚠️ Simulator apenas | CRÍTICO | Funciona em teste, não em produção |
| **Must-Have #4**: Botão "Quero Comprar" | ✅ Completo | CRÍTICO | Renderizado em todas as respostas |
| **Must-Have #5**: Encaminhar leads qualificados | ⚠️ Parcial | CRÍTICO | UI pronto, sem integração WhatsApp takeover |
| **Must-Have #6**: Registrar logs + validação | ✅ Completo | CRÍTICO | Todos os eventos logados |
| **Must-Have #7**: Interface web | ✅ Completo | CRÍTICO | Dashboard + Templates + Logs + Settings |
| **Must-Have #8**: Critérios de validação | ⚠️ Counters apenas | CRÍTICO | Números existem, sem análise temporal |
| **Must-Have #9**: Regras de negócio | ✅ Completo | CRÍTICO | Nenhum lead vai sem clique; políticas não alteráveis |
| **Should-Have #1**: Typing indicator | ✅ Simulator | ALTO | UI pronto, limites no canal real |
| **Should-Have #2**: Fallback genérico | ✅ Completo | ALTO | Resposta padrão para não classificados |
| **Should-Have #3**: Rate limit + debounce | ❌ Ausente | ALTO | Podem chegar respostas duplicadas |
| **Should-Have #4**: Push notifications | ⚠️ Toast in-app | ALTO | Sem notificações reais |
| **Should-Have #5**: Histórico pesquisável | ⚠️ Filtros básicos | MÉDIO | Sem busca full-text |
| **Could-Have #1**: Multi-canal | ❌ Ausente | MÉDIO | Só simulator funciona |
| **Could-Have #2**: UI para marcar venda | ✅ Existe | MÉDIO | Básica, funciona |
| **Could-Have #3**: Onboarding | ❌ Ausente | BAIXO | Não crítico para MVP |

---

## 📊 Análise Técnica Detalhada

### **Frontend (Implementado ~95%)**
```
✅ React 18 + TypeScript
✅ Vite (build rápido)
✅ React Router v6 (navegação)
✅ Supabase JS Client (real-time)
✅ Shadcn/ui Components (acessibilidade)
✅ Tailwind CSS (styling)
✅ Sonner (toasts)
✅ Date-fns (formatação de datas)
✅ Lucide React (ícones)
❌ Framer Motion (animações avançadas) - Não está, só CSS
❌ Service Worker (push notifications) - Não tem
❌ Workbox (PWA caching) - Não tem
```

### **Backend (Implementado ~20%)**
```
❌ API REST/GraphQL - Não existe
❌ Node.js/Express ou FastAPI - Não existe
❌ Webhook handler para WhatsApp - Não existe
❌ Message queue (Bull/RabbitMQ) - Não existe
❌ NLP avançado (spaCy/fastText) - Só regex local
⚠️ Supabase Edge Functions - Existe só para generate-templates
❌ Rate limiter - Não existe
❌ Cron jobs para limpeza - Não existe
```

### **Database (Implementado ~100%)**
```
✅ PostgreSQL (via Supabase)
✅ 5 tabelas principais
✅ Row-Level Security (RLS)
✅ Real-time subscriptions (Supabase)
✅ Migrations (1 aplicada)
❌ Full-text search - Não configurado
❌ Índices otimizados - Básicos apenas
❌ Backup automatizado - Por Supabase (incluso)
```

### **CI/CD & Deploy (Implementado ~30%)**
```
⚠️ Vite build config - Existe
❌ Docker containerization - Não existe
❌ GitHub Actions - Não existe
❌ Automated tests - Setup básico apenas
❌ Staging environment - Não existe
⚠️ Vercel deployment - Pode fazer (pra frontend)
❌ Backend hosting - Não há backend
```

---

## 🎬 Contadores e Métricas Implementadas

### **O que é Registrado (Completo)**
```
✅ Data/Hora de interação
✅ Nome do contato / ID
✅ Canal de origem (ex: simulator, future: whatsapp)
✅ Mensagem recebida (text)
✅ Categoria atribuída (ex: Preço, Cores, Outro)
✅ Resposta enviada (full text com template processado)
✅ Clique em "Quero Comprar" (boolean)
✅ Status da conversa (auto_replied, waiting, assumed, sold)
✅ User ID (para multi-tenancy)
```

### **Contadores Visíveis no Dashboard (Todos os Dias)**
```
✅ Total de Interações Hoje
✅ Cliques em "Quero Comprar" Hoje
✅ Atendimentos Manuais (leads assumed)
✅ Vendas Realizadas
✅ Taxa de Resposta Automática
```

### **O que NÃO está sendo trakado**
```
❌ Tempo de resposta (latência)
❌ Taxa de conversão clique → venda
❌ Fonte de tráfego (qual anúncio levou ao lead)
❌ Horário de pico
❌ Abandono (leads que não clicaram em "Quero Comprar")
❌ Taxa de falsos positivos na classificação
```

---

## 🔒 Segurança & Conformidade

### **Implementado**
✅ HTTPS obrigatório (Supabase/Vercel)  
✅ JWT authentication (Supabase)  
✅ Row-Level Security (RLS) no PostgreSQL  
✅ Senhas não armazenadas (Supabase Auth)  
✅ Tokens separados por usuário  

### **Não Implementado (Importante)**
❌ LGPD compliance (anonimização automática de dados)  
❌ Política de retenção de dados  
❌ Data encryption at rest (Supabase Enterprise feature)  
❌ Audit logs (quem modificou o quê)  
❌ Rate limiting (API abuse protection)  
❌ CORS headers (pode ser open demais)  

---

## 📈 Estimativa de Esforço para Completar MVP Production

| Task | Horas | Dificuldade | Bloqueante |
|------|-------|-------------|-----------|
| Backend Node.js + Webhooks WhatsApp | 40-60 | 🔴 Alta | 🔴 SIM |
| Integração WhatsApp Cloud API | 30-40 | 🔴 Alta | 🔴 SIM |
| Rate limiting + Debounce | 8-12 | 🟡 Média | 🔴 SIM |
| Push notifications (Web Push API) | 12-16 | 🟡 Média | 🟡 Não |
| Política de retenção de dados | 8-12 | 🟢 Baixa | 🟡 Não |
| Testes automatizados (Jest/Vitest) | 24-32 | 🟡 Média | 🟡 Não |
| Deploy em produção (Railway/Render) | 6-10 | 🟢 Baixa | 🟡 Não |
| Documentação + Onboarding | 8-12 | 🟢 Baixa | 🔴 SIM |
| **TOTAL** | **136-194 horas** | — | — |

**Prazo com 1 dev (8h/dia)**: ~17-24 dias úteis  
**Prazo com 2 devs**: ~9-12 dias úteis  

---

## 🎯 Roadmap para Production (Recomendado)

### **Fase 1: MVP Production (7-10 dias)**
1. ✅ Manter frontend como está (chat simulator para testes internos)
2. 🔴 **NOVO**: Criar backend Node.js + Express + Supabase client
3. 🔴 **NOVO**: Implementar webhook WhatsApp Cloud API
4. 🔴 **NOVO**: Rate limiting + debounce no backend
5. ✅ Testar classificação com mensagens reais
6. ✅ Manter persistência em DB
7. 📝 Deploy: Vercel (frontend) + Railway (backend)

### **Fase 2: Melhorias MVP (3-5 dias)**
1. Push notifications (Web Push API)
2. Política de retenção de dados + LGPD compliance
3. Gráficos de tendência no dashboard
4. Busca full-text em logs
5. Testes automatizados

### **Fase 3: Premium (2 semanas)**
1. Suporte multi-canal (Instagram DM, Messenger)
2. Dashboard analítico avançado
3. Integração CRM (Google Sheets, Pipedrive)
4. Marketplace de templates

---

## 💡 Recomendações Imediatas

### **CRÍTICO (Fazer AGORA)**
1. **Criar backend + webhooks WhatsApp**: Sem isso, não há MVP funcional
   - Sugestão: Node.js + Express na Railway/Render
   - Implementar: `POST /webhooks/whatsapp` para receber mensagens
   - Responder automaticamente com template + button "Quero Comprar"

2. **Teste de integração com WhatsApp Cloud API**:
   - Obter `WHATSAPP_BUSINESS_ACCOUNT_ID` + token
   - Configurar webhook URL em Meta Manager
   - Testar flow: mensagem real → classificação → resposta

3. **Implementar Rate Limiting**:
   - 1 resposta por contato por minuto (evita duplicatas)
   - Max 100 respostas/hora por número de telefone

### **IMPORTANTE (Fazer em Paralelo)**
4. **Documentação do Backend**: Para facilitar futuras integrações
5. **Testes automatizados**: Validar classificação com casos de uso reais
6. **Monitoramento**: Sentry para erros; CloudWatch para logs

### **NICE-TO-HAVE (Depois do MVP)**
7. Push notifications
8. Multi-canal
9. Análise preditiva

---

## 🚀 Status Geral

- **Frontend**: 95% completo ✅
- **Backend**: 5% completo (só Edge Function AI) ⚠️
- **Database**: 100% completo ✅
- **Integrações de Canal**: 0% ❌
- **Testes**: 10% (setup apenas) ⚠️
- **Docs**: 20% (README básico) ⚠️

**Conclusão**: O projeto é uma POC impressionante no frontend, mas **não é um MVP production pronto**. Faltam integrações de canal e backend para funcionar com dados reais. Recomenda-se **dar prioridade máxima ao backend + WhatsApp API** antes de colocar em produção.

---

**Próximos Passos**:
1. [ ] Avaliar se aproveitar o backend já iniciado ou reescrever
2. [ ] Decidir stack backend (Node.js vs Python)
3. [ ] Criar projeto separado para backend ou monorepo
4. [ ] Integrar com WhatsApp Cloud API (teste numa conta de negócio)
5. [ ] Fazer teste de ponta a ponta com usuário real

