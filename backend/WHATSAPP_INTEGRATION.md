# 🔗 Guia de Integração - WhatsApp Cloud API

## Visão Geral

Este guia detalha como conectar o backend LeadFlow ao WhatsApp Cloud API da Meta, configurar webhooks e testar o fluxo completo de mensagens.

---

## 1️⃣ Requisitos Iniciais

### O que você precisa:
- [ ] Uma conta Facebook com acesso a Meta Business Platform
- [ ] Um número de telefone para teste (com WhatsApp)
- [ ] Conta de negócio WhatsApp (Business Account)
- [ ] Backend rodando localmente ou em produção
- [ ] Ferramenta para testar API (curl, Postman, insomnia)

### Domínios aceitos:
- Local: `http://localhost:3000/webhooks/whatsapp`
- Produção: `https://seu-dominio.com/webhooks/whatsapp`
- Webhook deve ser acessível publicamente para produção

---

## 2️⃣ Criar Aplicação na Meta

### Step 1: Acessar Meta for Developers
1. Ir para https://developers.facebook.com
2. Login com conta Facebook
3. Criar novo app

### Step 2: Configuração Básica
```
App Type: Business
App Name: LeadFlow
Category: Commerce
```

### Step 3: Adicionar Produto WhatsApp
1. No dashboard do app → Add Products
2. Buscar "WhatsApp"
3. Clicar "Set Up"
4. Completar onboarding

---

## 3️⃣ Configurar Conta de Negócio WhatsApp

### Obter Credenciais

#### A. Business Account ID
```
Meta Business Platform → Settings → Business Account ID
Exemplo: 100000000000000
```

#### B. Phone Number ID
```
WhatsApp Manager → API Setup → Phone Number ID
Exemplo: 102000000000000
```

#### C. Access Token (Permanent)
```
Step 1: Meta Business Platform → Users
Step 2: Add User → System User → User Role: Admin
Step 3: Choose App Roles → WhatsApp Business Account
Step 4: Generate Token (com permissões: whatsapp_business_messaging, whatsapp_business_management)
```

**IMPORTANTE**: Guardar em local seguro! Não commitar no Git.

#### D. App Secret
```
App Dashboard → Settings → Basic → App Secret
(necessário para verificar webhooks)
```

---

## 4️⃣ Configurar Webhook no Meta Manager

### Passo 1: Adicionar Webhook URL
```
WhatsApp Manager → API Setup → Webhooks

Callback URL: https://seu-dominio.com/webhooks/whatsapp
(ou http://localhost:3000/webhooks/whatsapp para local)
```

### Passo 2: Definir Verify Token
```
Generate unique token (ex: '92a8c0f2d4e9')
Guardar como WHATSAPP_WEBHOOK_VERIFY_TOKEN
```

### Passo 3: Subscriptions
No Meta Manager, ativar eventos:
- ✅ messages
- ✅ message_template_status_update
- ✅ message_template_change
- ✅ whatsapp_business_account_update

---

## 5️⃣ Configurar Variáveis de Ambiente

### Arquivo `.env` local:
```bash
# Backend
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Supabase
SUPABASE_URL=https://vcohruqzjjijjqsknsua.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# WhatsApp Cloud API (obtidas do Meta Manager)
WHATSAPP_ACCESS_TOKEN=EAB... (token permanente)
WHATSAPP_PHONE_ID=102... (seu número phone ID)
WHATSAPP_APP_SECRET=abc123... (app secret do dashboard)
WHATSAPP_WEBHOOK_VERIFY_TOKEN=92a8c0f2d4e9 (seu token único)

# Redis
REDIS_URL=redis://localhost:6379

# Frontend
FRONTEND_URL=http://localhost:5173
```

---

## 6️⃣ Testar Webhook Localmente

### Usar Ngrok para expor localhost

#### Install ngrok:
```bash
# Windows
choco install ngrok
# ou download: https://ngrok.com/download

# Mac
brew install ngrok

# Linux
curl https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.zip -o ngrok.zip
unzip ngrok.zip
```

#### Executar ngrok:
```bash
ngrok http 3000
```

Output:
```
Forwarding                    https://abc123def456.ngrok.io -> http://localhost:3000
```

Copy a URL: `https://abc123def456.ngrok.io`

### Configurar em Meta Manager

1. WhatsApp Manager → API Setup → Webhooks
2. Callback URL: `https://abc123def456.ngrok.io/webhooks/whatsapp`
3. Verify Token: `92a8c0f2d4e9`
4. Salvar

### Testar Verificação de Webhook

```bash
# No terminal:
curl -X GET "https://abc123def456.ngrok.io/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=92a8c0f2d4e9"

# Resposta esperada:
test123
```

Se retornou o challenge, ✅ webhook está verificado!

---

## 7️⃣ Servidor Backend

### Iniciar o servidor:

```bash
cd backend
npm run dev
# ou
bun run dev
```

Deve exibir:
```
╔════════════════════════════════════════╗
║     LeadFlow Backend Server Running    ║
╚════════════════════════════════════════╝

📍 PORT: 3000
🌐 URL: http://localhost:3000
📡 Webhooks: http://localhost:3000/webhooks/whatsapp
❤️  Health: http://localhost:3000/health
```

### Verificar Health Check:

```bash
curl http://localhost:3000/health
```

Resposta:
```json
{
  "status": "healthy",
  "uptime": 35.2,
  "timestamp": "2026-02-15T10:30:00Z",
  "services": {
    "redis": "connected",
    "supabase": "connected",
    "nodejs": "v20.10.0"
  }
}
```

---

## 8️⃣ Enviar Mensagem de Teste

### Via cURL (WhatsApp para seu número):
```bash
curl -X POST "https://graph.instagram.com/v18.0/PHONE_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "5511999999999",
    "type": "text",
    "text": { "body": "Qual é o preço?" }
  }'
```

Substituir:
- `PHONE_ID`: seu número phone ID
- `ACCESS_TOKEN`: token permanente
- `5511999999999`: seu número WhatsApp (com código país)

### Resposta esperada:
```json
{
  "messages": [
    {
      "id": "wamid.xxx"
    }
  ]
}
```

---

## 9️⃣ Receber Mensagem (Webhook)

### Enviar mensagem via WhatsApp

1. Abrir WhatsApp no seu celular
2. Enviar mensagem para o número configurado
3. Verificar backend - deve logar:

```
📨 Processing message from 5511999999999: "Qual é o preço?"
✅ Classification: "Qual é o preço?" → "Preço" (matched keyword: "preço")
📝 Logged interaction
```

### Verificar no Supabase

1. Ir para Supabase Dashboard
2. Database → `interaction_logs`
3. Deve ter novo registro com:
   - `contact_name`: seu número
   - `message_received`: "Qual é o preço?"
   - `category_assigned`: "Preço"
   - `response_sent`: "O valor do nosso produto é R$ 99,90..."
   - `status`: "auto_replied"

---

## 🔟 Resposta Automática Verificar

### Backend deve ter respondido automaticamente:

1. Abra WhatsApp no celular
2. Da conta do bot, você deve receber:

```
O valor do nosso produto é R$ 99,90. Temos condições especiais! 💰

[ Quero comprar! 🛒 ]
```

---

## 1️⃣1️⃣ Clicar no Botão "Quero Comprar"

### Fluxo esperado:

1. Clicar no botão no WhatsApp
2. Backend recebe event com `button_reply.id = "buy_now"`
3. Logs atualizado: `clicked_buy = true`
4. Nova linha criada em `qualified_leads`

### Verificar resultado

Supabase:
- `interaction_logs` → `clicked_buy: true`
- `qualified_leads` → novo lead com `status: "waiting"`

Frontend (App):
- Abrir "Conversas" → novo lead deve aparecer lá
- Notificação: "🔔 Novo lead!"

---

## 🆙 Deploy em Produção

### Usar Railway ou Render

#### Railway:
```bash
cd backend
npx railway login
npx railway up
```

#### Ou Render:
1. Conectar GitHub
2. Deploy automático
3. Copiar URL: `https://seu-app.render.com`

### Atualizar em Meta Manager

1. WhatsApp Manager → API Setup → Webhooks
2. Callback URL: `https://seu-app.render.com/webhooks/whatsapp`
3. Testar com curl:

```bash
curl -X GET "https://seu-app.render.com/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=92a8c0f2d4e9"
```

---

## 🐛 Troubleshooting

### ❌ "Invalid signature"
- Verificar `WHATSAPP_APP_SECRET` correto
- Body não foi alterado durante transmissão
- Verificar se URL está na whitelist do Meta

### ❌ "No store config found for phone_id"
- Ir ao app frontend
- Settings → Integração WhatsApp
- Preencher `Phone ID` e ativar
- Salvar

### ❌ "Webhook verification failed"
- Verificar `WHATSAPP_WEBHOOK_VERIFY_TOKEN` correto
- Certificar que URL é acessível
- Testar healthcheck: `curl https://seu-url/health`

### ❌ "Rate limit exceeded"
- Uma resposta por minuto por número
- Aguardar 60s entre mensagens de mesmo número
- Ou desativar rate limit em `.env`

### ❌ Não recebe mensagens
- [ ] Webhook URL cadastrada?
- [ ] Webhook verificado? (`hub.challenge` respondido)
- [ ] Token e Phone ID corretos?
- [ ] Número foi adicionado ao whitelist?

---

## 📋 Checklist de Setup Completo

```markdown
### Meta Business Platform
- [ ] Conta criada
- [ ] App WhatsApp adicionado
- [ ] Business Account criado
- [ ] Número de telefone adicionado

### Credenciais
- [ ] WHATSAPP_ACCESS_TOKEN obtido
- [ ] WHATSAPP_PHONE_ID anotado
- [ ] WHATSAPP_APP_SECRET copiado
- [ ] WHATSAPP_WEBHOOK_VERIFY_TOKEN gerado

### Backend
- [ ] .env configurado
- [ ] npm install rodado
- [ ] npm run build sem erros
- [ ] npm run dev funcionando

### Webhook
- [ ] Ngrok rodando (local) OU URL produção pronta
- [ ] Callback URL configurada em Meta Manager
- [ ] Verify Token configurado
- [ ] GET /webhooks/whatsapp retorna challenge

### Testes
- [ ] Enviar mensagem via cURL ✓
- [ ] Receber escuta no webhook ✓
- [ ] Resposta automática no WhatsApp ✓
- [ ] Clicar botão "Quero Comprar" ✓
- [ ] Lead criado em `qualified_leads` ✓
- [ ] Frontend mostra novo lead ✓

### Produção
- [ ] App deploiado (Railway/Render)
- [ ] URLs atualizadas em Meta Manager
- [ ] Certificados HTTPS válidos
- [ ] Monitoramento ativo (Sentry/Logs)
- [ ] Alertas configurados
```

---

## 📞 Suporte Meta

- [Documentação](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [API Reference](https://developers.facebook.com/docs/whatsapp/cloud-api/reference)
- [Postman Collection](https://www.postman.com/collections/62305330-eda8f15f-e00d-491c-b998-e468193efbb9)

---

**Status**: ✅ Backend pronto para integração  
**Data**: Feb 15, 2026  
**Próximo passo**: Executar Fase 8 - Testes de Integração
