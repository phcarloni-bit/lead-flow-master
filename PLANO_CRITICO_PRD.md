# 🚨 PLANO CRÍTICO - Completar PRD para Produção

**Data**: 19 de Fevereiro de 2026  
**Status Atual**: MVP ~65% completo (0% em produção)  
**Objetivo**: Ir de Simulador para EE-commerce Real  

---

## 🎯 Roadmap Executivo (4 Fases)

```mermaid
graph LR
    A["FASE 1: Backend Live<br/>5-7 dias"] --> B["FASE 2: WhatsApp Real<br/>3-5 dias"]
    B --> C["FASE 3: Push Notifications<br/>2-3 dias"]
    C --> D["✅ PRODUÇÃO<br/>Semana próxima"]
    
    style D fill:#00ff00,stroke:#000,color:#000
```

---

# 🔴 FASE 1: Colocar Backend em Produção (CRÍTICO)

**Prazo**: 5-7 dias  
**Esforço**: 30-40 horas  
**Bloqueador**: TUDO depende disso

## 1.1 ✅ Infraestrutura Pronta (JÁ EXISTE)
```
✅ Express.js server
✅ TypeScript + ESLint
✅ Routes definidas
✅ Middleware: cors, helmet, error handler
✅ Supabase client configurado
✅ Redis client configurado
✅ Logger Winston
✅ Rate limiter implementado
✅ Debounce implementado
✅ Tests com Jest
```

## 1.2 ⚠️ O que falta (7 tarefas)

### Tarefa 1.2.1: Deploy no Railway  
**Status**: Bloqueado (falta executar)  
**Tempo**: 20-30 min  
**Referência**: [COMPLETE_DEPLOY.md](backend/COMPLETE_DEPLOY.md) Path: Railway

**Checklist**:
- [ ] Criar conta Railway (railway.app)
- [ ] Conectar repo lead-flow-master
- [ ] Configurar variáveis de ambiente:
  ```env
  NODE_ENV=production
  SUPABASE_URL=<SEU_URL>
  SUPABASE_ANON_KEY=<SEU_KEY>
  SUPABASE_SERVICE_KEY=<SEU_SERV_KEY>
  REDIS_URL=${{ Redis.REDIS_URL }}
  FRONTEND_URL=http://localhost:5173  # Update depois
  ```
- [ ] Adicionar Redis add-on (Railway)
- [ ] Deploy automático
- [ ] Copiar URL em produção: `https://lead-flow-backend-xxx.railway.app`

**Referência Code**: [backend/package.json](backend/package.json#L1-L20)

---

### Tarefa 1.2.2: Testar Backend Localmente  
**Status**: Não testado  
**Tempo**: 15-20 min  
**Referência**: [SETUP_QUICK_START.md](backend/SETUP_QUICK_START.md)

**Checklist**:
- [ ] `cd backend && npm install`
- [ ] `npm run dev` (deve iniciar em localhost:3000)
- [ ] Testar health check: `curl http://localhost:3000/health`
- [ ] Testar webhook simulado com Postman/curl
- [ ] Verificar logs da aplicação

**Expected Output**:
```
✅ Express server running on port 3000
✅ Supabase connected
✅ Redis connected
✅ /health returns 200 OK
```

---

### Tarefa 1.2.3: Criar .env.production  
**Status**: Template existe, falta configurar  
**Tempo**: 10-15 min  

**Arquivo**: `backend/.env.production`
```bash
# Core
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Supabase (copiar de Settings > API)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...

# Redis (do Railway auto-injected)
REDIS_URL=redis://default:pass@host:port

# Frontend
FRONTEND_URL=https://seu-frontend-domain.com
CORS_ORIGIN=https://seu-frontend-domain.com

# WhatsApp (deixar em branco temporário)
WHATSAPP_ACCESS_TOKEN=EAAv...
WHATSAPP_PHONE_ID=102...
WHATSAPP_APP_SECRET=xxxxx
WHATSAPP_WEBHOOK_VERIFY_TOKEN=random_verify_token

# Rate limiting
RATE_LIMIT_WINDOW=60
RATE_LIMIT_MAX_REQUESTS=1
DEBOUNCE_WINDOW=3000
ENABLE_RATE_LIMITING=true
ENABLE_DEBOUNCE=true
```

**⚠️ NÃO COMITAR** credenciais no Git. Railway injeta via dashboard.

---

### Tarefa 1.2.4: Validar Supabase RLS e Permissões  
**Status**: Provavelmente configurado, mas verificar  
**Tempo**: 15-20 min  

**Checklist**:
- [ ] Tabelas que precisam RLS:
  - `interaction_logs` ✅
  - `qualified_leads` ✅
  - `templates` ✅
  - `store_config` ✅
  - `rate_limit_cache` ✅ (se existir)
  
- [ ] Verificar políticas RLS:
  ```sql
  SELECT * FROM auth.jwt();  -- Deve retornar user_id
  SELECT * FROM information_schema.role_table_grants 
  WHERE table_name = 'interaction_logs';
  ```

- [ ] Testar acesso não-autenticado (deve falhar):
  ```bash
  curl -X GET "https://your-project.supabase.co/rest/v1/interaction_logs" \
    -H "Authorization: Bearer INVALID"
  # Esperado: 401 Unauthorized
  ```

**Referência**: [backend/config/supabase.ts](backend/src/config/supabase.ts)

---

### Tarefa 1.2.5: Executar Testes Automatizados  
**Status**: Jest configurado, testes básicos existem  
**Tempo**: 15-20 min  

**Checklist**:
- [ ] `cd backend && npm test`
- [ ] Verificar cobertura (aim: >80%)
- [ ] `npm run type-check` (TypeScript)
- [ ] `npm run lint` (ESLint)

**Arquivos de teste**:
- [backend/__tests__/classification.test.ts](backend/src/__tests__/classification.test.ts)
- [backend/__tests__/setup.ts](backend/src/__tests__/setup.ts)

**Expected Output**:
```
PASS  src/__tests__/classification.test.ts
  Classification Engine
    ✓ classifies preço correctly
    ✓ classifies cores correctly
    ✓ handles empty input
    
Test Suites: 1 passed, 1 total
Tests: 10 passed, 10 total
Coverage: 85%
```

---

### Tarefa 1.2.6: Setup Monitoramento (Logs)  
**Status**: Winston logger configurado  
**Tempo**: 10-15 min  

**Verificar**:
- [ ] Logger em [backend/src/utils/logger.ts](backend/src/utils/logger.ts)
- [ ] Level de log: `info` em prod, `debug` em dev
- [ ] Integrar com Railway logs (já automático)
- [ ] Testar: `npm run dev` e verificar logs

**Exemplo de uso**:
```typescript
import { logger } from "./utils/logger.js";

logger.info("Message received");
logger.warn("Rate limit approaching");
logger.error("Failed to save interaction");
```

---

### Tarefa 1.2.7: Documentar Endpoints Ativos  
**Status**: Falta listar  
**Tempo**: 15 min  

#### Endpoints disponíveis:

| Método | Path | Descrição | Status |
|--------|------|-----------|--------|
| GET | `/health` | Health check | ✅ Pronto |
| GET | `/health/stats` | Estatísticas da aplicação | ✅ Pronto |
| POST | `/webhooks/whatsapp` | Receber mensagens WhatsApp | ✅ Pronto (sem secret) |
| POST | `/api/messages` | Enviar mensagem manual | ❌ Falta codificar |
| GET | `/api/messages` | Listar mensagens | ❌ Falta codificar |
| GET | `/api/leads` | Listar leads qualificados | ❌ Falta codificar |
| PUT | `/api/leads/:id` | Atualizar status do lead | ❌ Falta codificar |

**Referência**: [backend/src/routes/](backend/src/routes/)

---

## 1.3 📊 Checklist Completo FASE 1

```markdown
INFRAESTRUTURA:
- [ ] Railway account criado
- [ ] Repo conectado a Railway  
- [ ] Variáveis de ambiente configuradas
- [ ] Redis add-on adicionado
- [ ] Deploy sucesso em produção

TESTES LOCAIS:
- [ ] `npm install` sucesso
- [ ] `npm run dev` inicia sem erros
- [ ] Health check retorna 200
- [ ] `npm test` passa todos
- [ ] `npm run lint` sem erros
- [ ] `npm run type-check` sem erros

PRODUÇÃO:
- [ ] URL Railway ativa
- [ ] Logs aparecendo em Railway dashboard
- [ ] Health check em prod: https://xxxx.railway.app/health
- [ ] Supabase conectado (verificar logs)
- [ ] Redis conectado (verificar logs)

DOCUMENTAÇÃO:
- [ ] .env.example atualizado
- [ ] README.md com instruções Railway
- [ ] Endpoints documentados
- [ ] Troubleshooting atualizado
```

---

---

# 🟠 FASE 2: Integração WhatsApp Real (CRÍTICO)

**Prazo**: 3-5 dias  
**Esforço**: 25-35 horas  
**Dependência**: FASE 1 deve estar completa  
**Bloqueador**: Sem isto, não há mensagens reais

## 2.1 Meta/WhatsApp Setup (Fora da codebase)

**Tempo**: 30-60 min (manual no Meta Manager)

### Tarefa 2.1.1: Criar App Meta Business  
**Referência**: [backend/WHATSAPP_INTEGRATION.md](backend/WHATSAPP_INTEGRATION.md#2️⃣-criar-aplicação-na-meta)

**Checklist**:
- [ ] Ir para https://developers.facebook.com
- [ ] Login com conta Facebook pessoal
- [ ] Criar novo app (Business type)
- [ ] Nomear: "LeadFlow"
- [ ] Adicionar produto "WhatsApp"
- [ ] Completar onboarding WhatsApp

**Resultado esperado**: App criado com ID

---

### Tarefa 2.1.2: Obter Credenciais WhatsApp  
**Tempo**: 20-30 min  
**Referência**: [backend/WHATSAPP_INTEGRATION.md](backend/WHATSAPP_INTEGRATION.md#3️⃣-configurar-conta-de-negócio-whatsapp)

**Credenciais necessárias**:
```
🔑 Business Account ID: 100000000000000
🔑 Phone Number ID: 102000000000000
🔑 Access Token: EAAv0lZBXXXX...XXXX
🔑 App Secret: abc123def456...
🔑 Verify Token: random_92a8c0f2d4e9
```

**Guardar em**:
```
1. Arquivo seguro (1password, LastPass)
2. Railway environment variables (NÃO em Git)
3. Agarrado em um papel com cadeado 🔐
```

---

### Tarefa 2.1.3: Configurar Webhook no Meta Manager  
**Tempo**: 15-20 min  
**Referência**: [backend/WHATSAPP_INTEGRATION.md](backend/WHATSAPP_INTEGRATION.md#4️⃣-configurar-webhook-no-meta-manager)

**Passo a passo**:
1. Meta Business Platform → WhatsApp → Configuration
2. Webhook URL: `https://lead-flow-backend-xxx.railway.app/webhooks/whatsapp`
3. Verify Token: `[WHATSAPP_WEBHOOK_VERIFY_TOKEN]`
4. Clicar "Verify and Save"
5. Esperar mensagem ✅ "Verified"
6. Ativar subscriptions:
   - ✅ messages
   - ✅ message_template_status_update

**Resultado**: Webhook está ouvindo mensagens reais

---

## 2.2 Código Backend (Implementação)

### Tarefa 2.2.1: Validar Webhook Handler  
**Status**: [backend/src/routes/webhooks.ts](backend/src/routes/webhooks.ts) existe  
**Tempo**: 20-30 min (review + testes)

**Checklist**:
```typescript
✅ Verifica GET /webhooks/whatsapp (challenge do Meta)
✅ Valida HMAC assinatura (App Secret)
✅ Processa POST /webhooks/whatsapp
✅ Processa eventos:
   - message received
   - message_template_status_update
   - read/delivered (opcional)
✅ Rate limiting ativo
✅ Debounce ativo
```

**Validação**:
- [ ] GET /webhooks/whatsapp?hub.challenge=test → retorna 200 com token
- [ ] POST com HMAC inválida → 401 Unauthorized
- [ ] POST com HMAC válida → 200 OK

**Referência**: [backend/src/middleware/verifyWebhook.ts](backend/src/middleware/verifyWebhook.ts)

---

### Tarefa 2.2.2: Implementar whatsappService.ts  
**Status**: [backend/src/services/whatsappService.ts](backend/src/services/whatsappService.ts) existe  
**Tempo**: 30-40 min  

**Checklist** (o que deve existir):
- [ ] `sendMessage(phoneId, to, message)` - Enviar mensagem
- [ ] `sendTemplateMessage(phoneId, to, template, params)` - Enviar template
- [ ] `sendButtonMessage(phoneId, to, message, buttons)` - Enviar com botões
- [ ] `handleIncomingMessage(webhook)` - Processar entrada
- [ ] `logInteraction(user_id, contact, channel, msg, category, response)` - Registrar

**Exemplo de sendMessage**:
```typescript
async sendMessage(
  phoneId: string,
  to: string,
  message: string,
  token: string
): Promise<Response> {
  const url = `https://graph.instagram.com/v18.0/${phoneId}/messages`;
  
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,  // ex: 551199999999
    type: "text",
    text: { body: message }
  };
  
  return axios.post(url, payload, {
    headers: { "Authorization": `Bearer ${token}` }
  });
}
```

**Referência**: [backend/src/services/whatsappService.ts](backend/src/services/whatsappService.ts)

---

### Tarefa 2.2.3: Implementar Message Queue com Redis  
**Status**: Redis client existe, queue não  
**Tempo**: 25-30 min  

**Checklist**:
- [ ] Criar `backend/src/services/queueService.ts`
- [ ] Implementar producer: `queue.enqueue(message)`
- [ ] Implementar consumer: `queue.process()`
- [ ] Reprocessar mensagens em caso de falha (3x retry)
- [ ] TTL: 24h para mensagens antigas

**Exemplo**:
```typescript
// Produtor (ao receber webhook)
await messageQueue.enqueue({
  phoneId,
  to,
  message,
  timestamp: Date.now(),
  retries: 0
});

// Consumidor
const consumer = new MessageQueueConsumer(redis);
await consumer.start();  // Processa na ordem FIFO
```

**Benefícios**:
- Evita perda de mensagens (timeout do webhook)
- Desacoplamento (webhook rápido, processamento assíncrono)
- Retry automático em caso de falha
- Visibilidade do que está na fila

---

### Tarefa 2.2.4: Implementar Response com Botão  
**Status**: Simulador tem, WhatsApp não  
**Tempo**: 15-20 min  

**O que é**: Enviar resposta com botão "Quero Comprar" via Quick Reply

**Código WhatsApp API**:
```json
{
  "messaging_product": "whatsapp",
  "to": "551199999999",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": {
      "text": "Temos esse produto em estoque! 🎉\n\nDeseja fazer uma compra?"
    },
    "action": {
      "buttons": [
        {
          "type": "reply",
          "reply": {
            "id": "btn_buy_1",
            "title": "Quero Comprar"
          }
        },
        {
          "type": "reply",
          "reply": {
            "id": "btn_more_info",
            "title": "Mais informações"
          }
        }
      ]
    }
  }
}
```

**Implementar**:
- [ ] `sendButtonMessage(phoneId, to, message, buttons)`
- [ ] Usar em response automática (ao invés de textMessage)
- [ ] Capturar clique do botão no webhook

**Resultado**: Lead clica botão → vai para `qualified_leads` automaticamente

---

### Tarefa 2.2.5: Testar Fluxo End-to-End  
**Tempo**: 30-40 min  

**Setup de teste**:
```bash
# 1. Terminal 1: Backend em produção Railway
# (já deve estar rodando)

# 2. Terminal 2: Tail dos logs
railway logs -f

# 3. Testar com webhooks simulados (Postman)
# Arquivo: postman_collection.json já existe
```

**Fluxo de teste**:
```
1. Enviar mensagem via nó real do WhatsApp
   "Qual é o preço?"
   
2. Webhook chega em Railway → verifica HMAC ✅
   
3. classificationService processa
   → Category: "Preço" ✅
   
4. templateService busca response
   → "O valor é {{preco}}..." ✅
   
5. whatsappService envia via Meta API
   → com botão "Quero Comprar" ✅
   
6. Clique no botão
   → webhook chega com reply ✅
   
7. Lead vai para qualified_leads
   → notificação aparece no Dashboard ✅
   
8. Gerente acessa LeadQueue
   → vê lead pronto ✅
   → clica "Assumir atendimento" ✅
   → status muda para "assumed" ✅
```

**Verificar logs** (em Railway):
```
✅ Webhook received
✅ HMAC verified
✅ Message classified
✅ Response sent
✅ Lead qualified
```

**Referência teste**: [backend/API_TESTING.md](backend/API_TESTING.md)

---

## 2.3 📊 Checklist Completo FASE 2

```markdown
META SETUP:
- [ ] App Business criado em developers.facebook.com
- [ ] WhatsApp produto adicionado
- [ ] Credenciais obtidas (5 tokens)
- [ ] Business Account verificado

WEBHOOK:
- [ ] Webhook URL configurado em Meta Manager
- [ ] Verify token configurado
- [ ] Subscriptions ativadas (messages + status)
- [ ] Meta mostra ✅ "Verified"

CÓDIGO:
- [ ] Webhook handler valida HMAC
- [ ] whatsappService implementado completo
- [ ] Message queue + retry (Redis) ✅
- [ ] Response com botão implementada
- [ ] Templates dinâmicos com placeholders ✅

TESTES:
- [ ] Menssagem de teste chega ao webhook
- [ ] Classificação funciona
- [ ] Response enviada para cliente
- [ ] Botão "Quero Comprar" renderiza
- [ ] Lead aparece em qualified_leads
- [ ] pode assumir atendimento
- [ ] Status muda para "assumed" → "sold"

PRODUÇÃO:
- [ ] Railway logs mostram tráfego
- [ ] Sem erros 500 em produção
- [ ] Rate limiting ativo
- [ ] Debounce filtrando duplicatas
```

---

# 🟡 FASE 3: Push Notifications (IMPORTANTE)

**Prazo**: 2-3 dias  
**Esforço**: 15-20 horas  
**Dependência**: FASE 1 + 2  
**Impacto**: ~70% melhoria em UX (notifica gerente quando novo lead)

## 3.1 Objetivo

Quando novo lead clica "Quero Comprar", o gerente recebe notificação mesmo com aba fechada:
- 🔔 Browser push notification
- 📱 Mobile push (se tenha app)
- 💬 Slack/Email como fallback

## 3.2 Stack

```
Frontend: Web Push API + Service Worker
Backend: web-push npm package
Database: subscriptions table
Provider: Firebase Cloud Messaging (FCM) ou Web Push genérico
```

## 3.3 Tarefas

### Tarefa 3.3.1: Setup Web Push no Frontend  
**Arquivo**: [src/components/PushManager.tsx](src/components/PushManager.tsx) (criar)  
**Tempo**: 30-40 min

**Checklist**:
- [ ] Gerar VAPID keys: `web-push generate-vapid-keys`
- [ ] Guardar chaves em .env (backend)
- [ ] Registrar Service Worker
- [ ] Solicitar permissão de notificação
- [ ] Salvar subscription em Supabase (`push_subscriptions` table)

---

### Tarefa 3.3.2: Implementar Backend Push  
**Arquivo**: [backend/src/services/pushService.ts](backend/src/services/pushService.ts) (criar)  
**Tempo**: 25-30 min

**Checklist**:
- [ ] `npm install web-push`
- [ ] Implementar `sendNotification(to, title, body)`
- [ ] Chamar quando lead qualificado: `await pushService.notify(...)`
- [ ] Retry em caso de falha

---

### Tarefa 3.3.3: Integração com Qualified Leads  
**Tempo**: 15-20 min

**Fluxo**:
```typescript
// Em whatsappController.ts, quando lead clica "Quero Comprar":
1. Salvar em qualified_leads
2. Buscar subscriptions do usuário (push_subscriptions)
3. pushService.notify(subscriptions, {
     title: "🎉 Novo lead qualificado!",
     body: "João Silva quer comprar",
     icon: "/icon.png",
     badge: "/badge.png",
     data: { leadId, leadName }
   })
```

---

### Tarefa 3.3.4: Slack Integration (Opcional mas recomendado)  
**Tempo**: 15-20 min

**Alternativa simples**:
```bash
npm install axios
```

```typescript
// Em qualified_leads handler:
const slackWebhook = process.env.SLACK_WEBHOOK_URL;
await axios.post(slackWebhook, {
  text: `🎉 Novo lead qualificado: ${leadName}`,
  channel: "#leads",
  attachments: [{
    color: "good",
    fields: [
      { title: "Nome", value: leadName },
      { title: "Categoria", value: category },
      { title: "Mensagem", value: message }
    ]
  }]
});
```

---

## 3.4 📊 Checklist Completo FASE 3

```markdown
SETUP:
- [ ] VAPID keys geradas
- [ ] Service Worker registrado
- [ ] Permissão de notificação solicitada

FRONTEND:
- [ ] PushManager.tsx implementado
- [ ] Subscription salva em DB
- [ ] Notification recebida quando chega lead

BACKEND:
- [ ] pushService.ts implementado
- [ ] web-push npm instalado
- [ ] Notificação dispara ao new qualified_lead

INTEGRAÇÃO:
- [ ] Teste: novo lead → notification dispara ✅
- [ ] Teste: clicar notification → abre LeadQueue ✅
- [ ] Slack webhook integrado (opcional)

Resultado: Gerente notificado em tempo real ✅
```

---

---

# 🟢 FASE 4: Produção Final (POLISH)

**Prazo**: 1-2 dias  
**Esforço**: 10-15 horas  
**Dependência**: FASE 1-3 deve estar completa

## 4.1 Tarefas

| # | Tarefa | Tempo | Prioridade |
|---|--------|-------|-----------|
| 4.1.1 | Validar GDPR/Privacy (RLS, encriptação) | 20 min | 🔴 CRÍTICO |
| 4.1.2 | Testar com múltiplos usuários | 1 hora | 🔴 CRÍTICO |
| 4.1.3 | Setup SSL/HTTPS (automatizado Railway) | 10 min | 🔴 CRÍTICO |
| 4.1.4 | Performance testing (load test) | 1 hora | 🟠 ALTO |
| 4.1.5 | Documentação final (setup guide) | 1 hora | 🟠 ALTO |
| 4.1.6 | Backup + disaster recovery plan | 30 min | 🟠 ALTO |
| 4.1.7 | Monitoring + alertas (Sentry/Graham) | 30 min | 🟡 MÉDIO |
| 4.1.8 | Onboarding para client | 1 hora | 🟡 MÉDIO |

---

## 4.2 Processo de Release

```markdown
✅ PHASE 1: Backend Live (5-7 dias)
   └─ daily tests + logs monitoring

✅ PHASE 2: WhatsApp Real (3-5 dias)
   └─ teste com número real
   └─ stress test (100 mensagens/hora)

✅ PHASE 3: Push Notifications (2-3 dias)
   └─ teste permissões
   └─ teste retry failed subscriptions

✅ PHASE 4: Production Release (1-2 dias)
   └─ run checklist completo
   └─ client sign-off
   └─ go live!
```

---

---

# 📅 Timeline Realista

## Cenário Otimista (Tudo Paralelo)
```
Hoje:         FASE 1 day 1-2 (setup Railway)
Dia 2-3:      FASE 2 day 1 (meta setup)
Dia 3-4:      FASE 1.2 (tests) + FASE 2 parallel
Dia 4-5:      FASE 2 testes + FASE 3 start
Dia 5-6:      FASE 3 + polish
Dia 6-7:      Testing + go-live

TOTAL: 6-7 dias para PRODUÇÃO
```

## Cenário Realista (Bloqueios Meta/Bugs)
```
Dia 1-2:      FASE 1 (setup + testes) ✅
Dia 2-3:      FASE 2 meta setup (lento) ⏳
Dia 3-4:      FASE 2 webhooks debug (bugs)
Dia 4-5:      FASE 2 full flow validate
Dia 5-6:      FASE 3 + polish
Dia 6-7:      Produção ou extend 2 dias

TOTAL: 7-9 dias para PRODUÇÃO
```

---

---

# 🚨 Riscos e Contingências

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Meta demora verificar app | 40% | Alto | Aplicar expedited (24-48h) |
| HMAC signature diff mismatch | 30% | Alto | Testar assinatura isoladamente |
| Redis não conecta Railway | 20% | Alto | Usar fallback (in-memory cache) |
| Rate limit muito apertado | 30% | Médio | Ajustar limites via env var |
| Push permissions bloqueadas | 50% | Baixo | Fallback para toast in-app |
| Client não testa com real número | 20% | Médio | Fornecer número test |

---

---

# 📋 Recomendações Imediatas (HOJE)

## 1️⃣ AGORA (PRÓXIMAS 2 HORAS)
```bash
# 1. Criar conta Railway
# 2. Conectar repo
# 3. Configurar de environment variables
# 4. Deploy automático
# Resultado: Backend rodando em https://xxx.railway.app/health
```

## 2️⃣ HOJE À NOITE (PRÓXIMAS 6 HORAS)
```bash
# 1. Testar localmente: npm run dev + npm test
# 2. Validar Supabase RLS
# 3. Criar conta Meta/WhatsApp
# 4. Obter credenciais (5 tokens)
# Resultado: Tudo pronto para integração
```

## 3️⃣ AMANHÃ (FASE 1+2 START)
```bash
# 1. Webhook handler functional tests
# 2. HMAC signature validation
# 3. Message queue setup
# 4. End-to-end test com número real
# Resultado: Primeira mensagem real processada
```

---

# 🎯 Sucesso = Quando...

```markdown
✅ Cliente recebe no WhatsApp: "Qual é o preço?"
✅ Backend classifica como "Preço"
✅ Cliente recebe resposta automática + botão
✅ Cliente clica "Quero Comprar"
✅ Gerente recebe notificação 🔔
✅ Gerente vê lead em LeadQueue
✅ Gerente clica "Assumir atendimento"
✅ Status muda para "assumed" → "sold"
✅ Log registrado em 100% ausência de erro

SISTEMA EM PRODUÇÃO ✅
```

---

# 📞 Resources

- Railway Docs: https://docs.railway.app
- Meta API Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- Web Push API: https://developer.mozilla.org/en-US/docs/Web/API/Push_API
- Redis Queue: https://github.com/OptimalBits/bull (Bull queue library)

---

**Próximo passo**: Confirmar se iniciamos FASE 1 agora ou se alguma questão?
