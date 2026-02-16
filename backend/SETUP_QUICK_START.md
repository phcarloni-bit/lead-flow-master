# ⚡ Quick Start - WhatsApp Integration Setup

Complete este guia em **15 minutos** para ter o backend rodando com webhooks WhatsApp!

---

## 📋 Pré-requisitos

- [ ] Backend Node.js criado (já feito!)
- [ ] WhatsApp Business Account (de um número teste seu)
- [ ] Meta Developer Account
- [ ] ngrok instalado (para local testing)

---

## Step 1: Preparar Backend (2 min)

### 1.1 Instalar dependências
```bash
cd backend
bun install  # ou npm install
```

### 1.2 Criar arquivo .env
```bash
cp .env.example .env
```

Editar `.env` com seus valores. Por enquanto, use placeholders:
```env
NODE_ENV=development
PORT=3000

SUPABASE_URL=https://vcohruqzjjijjqsknsua.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...

WHATSAPP_ACCESS_TOKEN=temp
WHATSAPP_PHONE_ID=temp
WHATSAPP_APP_SECRET=temp
WHATSAPP_WEBHOOK_VERIFY_TOKEN=my_random_token_123

REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:5173
```

### 1.3 Build TypeScript
```bash
bun run build
# ou: npm run build
```

Esperado:
```
✅ Successfully compiled!
```

---

## Step 2: Obter Credenciais WhatsApp (5 min)

### 2.1 Criar App na Meta
1. Ir para https://developers.facebook.com
2. My Apps → Create App
3. Select "Business" type
4. App Name: `LeadFlow` → Continue
5. Complete setup wizard

### 2.2 Adicionar Produto WhatsApp
1. No dashboard → Add Products
2. Buscar "WhatsApp" 
3. Click "Set Up"
4. Completar onboarding WhatsApp

### 2.3 Obter Phone ID
1. WhatsApp Manager → Phone Numbers
2. Copiar seu número phone_id (começa com 102...)
3. Salvar em `.env` como `WHATSAPP_PHONE_ID=102...`

### 2.4 Gerar Access Token
1. Meta Business Platform → Settings → Users
2. Add New User → System User
3. Nome: `leadflow-bot` → Create
4. Choose App Role → Admin
5. Generate Token (selecionar webhooks + messaging)
6. Salvar em `.env` como `WHATSAPP_ACCESS_TOKEN=EABa...`

### 2.5 Copiar App Secret
1. App Dashboard → Settings → Basic
2. Copiar "App Secret"
3. Salvar em `.env` como `WHATSAPP_APP_SECRET=abc...`

---

## Step 3: Iniciar Backend + ngrok (3 min)

### 3.1 Terminal 1 - Iniciar Backend
```bash
cd backend
bun run dev
```

Esperado:
```
╔════════════════════════════════════════╗
║     LeadFlow Backend Server Running    ║
╚════════════════════════════════════════╝

📍 PORT: 3000
🌐 URL: http://localhost:3000
📡 Webhooks: http://localhost:3000/webhooks/whatsapp
❤️ Health: http://localhost:3000/health
```

### 3.2 Terminal 2 - Iniciar ngrok
```bash
ngrok http 3000
```

Copia a URL HTTPS:
```
Forwarding    https://abc123def456.ngrok.io -> http://localhost:3000
```

Anote: `https://abc123def456.ngrok.io`

### 3.3 Testar Health
```bash
curl https://abc123def456.ngrok.io/health
```

Deve retornar:
```json
{"status":"healthy","uptime":X.X,...}
```

---

## Step 4: Configurar Webhook em Meta (2 min)

### 4.1 Abrir Meta Manager
1. Meta for Developers → Your Apps → [Seu App]
2. WhatsApp → Configuration

### 4.2 Adicionar Callback URL
1. Click "Edit Callback URL"
2. Callback URL: `https://abc123def456.ngrok.io/webhooks/whatsapp`
3. Verify Token: copie seu `WHATSAPP_WEBHOOK_VERIFY_TOKEN` do `.env`
4. Click "Verify and Save"

Meta vai fazer uma requisição GET para validar. Se sucesso, ✅!

### 4.3 Ativar Webhooks
1. Em "Webhook fields", selecionar:
   - ✅ messages
   - ✅ message_template_status_update
2. Click "Update"

---

## Step 5: Testar Fluxo Completo (3 min)

### 5.1 Enviar Mensagem Teste
```bash
curl -X POST "https://graph.instagram.com/v18.0/PHONE_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "551199999999",
    "type": "text",
    "text": { "body": "Qual é o preço?" }
  }'
```

Substituir:
- `PHONE_ID` → seu phone ID
- `ACCESS_TOKEN` → seu access token
- `551199999999` → seu número WhatsApp

### 5.2 Verificar Backend
Terminal 1 deve mostrar:
```
📨 Processing message from 551199999999: "Qual é o preço?"
✅ Classification: "Preço"
📝 Logged interaction
✅ Response sent via WhatsApp API
```

### 5.3 Verificar WhatsApp
No seu telefone, você deve receber:
```
O valor do nosso produto é R$ 99,90. Temos condições especiais! 💰

[ Quero comprar! 🛒 ]
```

### 5.4 Clicar no Botão
Clicar em "Quero comprar!" deve:
1. Logar em `qualified_leads`
2. Ser visível no Frontend em "Conversas"

---

## ✅ Checklist Rápido

```
🔷 Backend
- [ ] npm install / bun install rodou
- [ ] .env preenchido
- [ ] bun run build sem erros
- [ ] bun run dev rodando

🔷 Meta Manager
- [ ] App criado
- [ ] WhatsApp adicionado
- [ ] Phone ID obtido
- [ ] Token gerado
- [ ] App Secret copiado

🔷 Webhook
- [ ] ngrok rodando
- [ ] Callback URL em Meta Manager
- [ ] Verify Token correto
- [ ] Meta confirmou verificação

🔷 Testes
- [ ] curl para health check: ✓
- [ ] Enviar mensagem teste via API: ✓
- [ ] Receber no WhatsApp: ✓
- [ ] Clicar botão "Quero comprar": ✓
- [ ] Ver lead em qualified_leads: ✓
```

---

## 🐛 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| "Invalid signature" | Verificar WHATSAPP_APP_SECRET correto |
| "No store config" | Ir ao app → Settings → WhatsApp → preencher Phone ID |
| Webhook não recebe | ngrok parou? Restartar / Meta URL desatualizada? |
| "Rate limit" | Aguardar 60s, ou desativar em .env |
| CORS error | CORS_ORIGIN em .env engloba seu frontend |

---

## 🚀 Próximas Fases

1. **Deploy em Produção**: Railway/Render (10 min)
2. **Configurar CD/CI**: GitHub Actions (5 min)
3. **Monitoramento**: Sentry alerts (5 min)
4. **Testes Automáticos**: Jest suite (20 min)

---

**Status**: Backend pronto! Webhooks configurados! 🎉
