# ✅ Deploy Checklist - Railway Edition

**Tempo Total**: ~30 minutos  
**Custo**: Grátis (primeiros $5 crédito)  
**Resultado**: Backend 24/7 em produção

---

## 📋 PRÉ-DEPLOY (5 min)

### Code Quality
- [ ] `npm run build` sem erros
- [ ] `npm run lint` passou
- [ ] Sem console.log's desnecessários
- [ ] Sem console.error's de teste
- [ ] `.env` NOT committed
- [ ] `.gitignore` atualizado

### Credenciais
- [ ] WhatsApp token obtido
- [ ] Phone ID anotado
- [ ] App secret copiado
- [ ] Verify token gerado
- [ ] Supabase credenciais prontas

### Git
- [ ] Código commitado: `git add .`
- [ ] Commit message: `git commit -m "Add rate limiting + deploy to Railway"`
- [ ] Push: `git push origin main`

---

## 🚀 DEPLOYMENT (15 min)

### Passo 1: Criar Conta Railway (2 min)
- [ ] Ir para https://railway.app
- [ ] Click "Start Free"
- [ ] GitHub login + autorizar
- [ ] Criar novo projeto

### Passo 2: Deploy Código (3 min)
- [ ] New Project → "Deploy from GitHub"
- [ ] Selecionar `lead-flow-master`
- [ ] Branch: `main`
- [ ] Click "Deploy"
- [ ] ⏳ Aguardar build (2-3 min)

### Passo 3: Copiar Domain
- [ ] Railway Dashboard → backend
- [ ] Deployments → Latest
- [ ] Copiar URL HTTPS: `https://leadflow-backend-prod-xxx.railway.app`

### Passo 4: Configurar Rate Limit (3 min)
- [ ] Railway Dashboard → backend
- [ ] Variables tab
- [ ] Adicionar:
  ```
  RATE_LIMIT_WINDOW=60
  RATE_LIMIT_MAX_REQUESTS=1
  DEBOUNCE_WINDOW=3000
  ENABLE_RATE_LIMITING=true
  ENABLE_DEBOUNCE=true
  ```
- [ ] Click Save (auto-redeploy)

### Passo 5: Adicionar WhatsApp Vars (3 min)
- [ ] Variables → Add
- [ ] `WHATSAPP_ACCESS_TOKEN=EABa...`
- [ ] `WHATSAPP_PHONE_ID=102...`
- [ ] `WHATSAPP_APP_SECRET=abc...`
- [ ] `WHATSAPP_WEBHOOK_VERIFY_TOKEN=random_token`
- [ ] Click Save (redeploy)

### Passo 6: Adicionar Supabase Vars (2 min)
- [ ] `SUPABASE_URL=https://...`
- [ ] `SUPABASE_ANON_KEY=eyJhbGc...`
- [ ] `SUPABASE_SERVICE_KEY=eyJhbGc...`
- [ ] Click Save (redeploy)

### Passo 7: Adicionar Redis (2 min)
- [ ] Railway Dashboard → + New Service
- [ ] Search "Redis"
- [ ] Click "Redis"
- [ ] Create
- [ ] ⏳ Aguardar deploy (~2 min)
- [ ] ✅ REDIS_URL auto-added!

---

## 🧪 TESTING (5 min)

### Health Check
```bash
curl https://seu-url/health
# Esperado: {"status":"healthy",...}
```
- [ ] Response: 200 OK

### Stats Endpoint
```bash
curl https://seu-url/health/stats
# Esperado: memory, uptime, rate limit config
```
- [ ] Response: 200 OK
- [ ] Memory < 128MB
- [ ] ENABLE_RATE_LIMITING = true
- [ ] ENABLE_DEBOUNCE = true

### Webhook Verification
```bash
curl -X GET "https://seu-url/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=random_token"
# Esperado: test123
```
- [ ] Response: `test123`

---

## 🔧 META manager (3 min)

### Configurar Webhook
1. [ ] Meta for Developers → Apps → [Your App]
2. [ ] WhatsApp → Configuration
3. [ ] Callback URL: Cole sua URL Railway
4. [ ] Verify Token: Cole seu token
5. [ ] Click "Verify and Save"
6. [ ] ✅ Aguarde badge verde

### Verificar Subscriptions
1. [ ] Webhook fields → Selecionar:
   - [ ] ✅ messages
   - [ ] ✅ message_template_status_update
2. [ ] Click "Update"

---

## 📱 INTEGRATION TEST (3 min)

### Enviar Mensagem Teste
```bash
curl -X POST "https://graph.instagram.com/v18.0/PHONE_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "5511999999999",
    "type": "text",
    "text": {"body": "Teste Railway deployment"}
  }'
```
- [ ] Response: message ID
- [ ] Backend log: "📨 Processing message"

### Verificar Response no WhatsApp
- [ ] Recebeu resposta automática
- [ ] Botão "Quero comprar!" aparece
- [ ] Clicou botão

### Verificar no Supabase
- [ ] Novo registro em `interaction_logs`
- [ ] Categoria classificação correta
- [ ] Response text preenchido
- [ ] Novo lead em `qualified_leads` (clicked_buy=true)

### Verificar nos Logs Railway
```bash
# Instalar Railway CLI
npm install -g @railway/cli
railway login
railway logs -f

# Procurar por:
# [INFO] ✅ Message processed
# [INFO] 📨 Processing message
# [INFO] 💾 Lead created
```
- [ ] Logins visíveis
- [ ] Sem erros (ERROR/Exception)

---

## 📊 MONITORING (2 min)

### Ativar Logs Contínuos
```bash
railway logs -f
```
- [ ] Terminal aberto com logs em tempo real

### Verificar Stats Periodicament
```bash
while true; do
  curl https://seu-url/health/stats | jq .
  sleep 30
done
```
- [ ] Memory uso estável
- [ ] Uptime crescendo
- [ ] Rate limits incrementando

### Configurar Sentry (Opcional)
- [ ] Sentry Account: https://sentry.io
- [ ] Criar projeto Node.js
- [ ] Copiar DSN
- [ ] Railway Variables: `SENTRY_DSN=https://...`
- [ ] Redeploy

---

## 🚨 ALERT Setup (2 min)

### Railway Alerts (Optional)
```bash
railway alert create --service backend --condition "error > 5 in 5m"
railway alert create --service backend --condition "cpu > 80%"
railway alert create --service backend --condition "memory > 256MB"
```
- [ ] Alertas criados

---

## 📋 FINAL CHECKLIST

### Código & Deploy
- [ ] Código deployado ✅
- [ ] Build bem-sucedido ✅
- [ ] Servidor respondendo ✅
- [ ] Logs visíveis ✅

### Rate Limiting
- [ ] RATE_LIMIT_WINDOW=60 ✅
- [ ] RATE_LIMIT_MAX_REQUESTS=1 ✅
- [ ] ENABLE_RATE_LIMITING=true ✅
- [ ] Testado com múltiplas mensagens ✅

### Debounce
- [ ] DEBOUNCE_WINDOW=3000 ✅
- [ ] ENABLE_DEBOUNCE=true ✅
- [ ] Duplicatas bloqueadas ✅

### WhatsApp Integration
- [ ] Webhook URL configurada ✅
- [ ] Verificado em Meta Manager ✅
- [ ] Mensagens chegam backend ✅
- [ ] Respostas saem para WhatsApp ✅
- [ ] Botão funciona ✅

### Database
- [ ] Supabase conectado ✅
- [ ] Logs inseridos ✅
- [ ] Leads criados ✅
- [ ] Dados corretos ✅

### Monitoring
- [ ] Logs acessíveis ✅
- [ ] Stats endpoint funciona ✅
- [ ] CPU/Memory normais ✅
- [ ] Sem erros críticos ✅

### Security
- [ ] `.env` não commitado ✅
- [ ] HTTPS ativado ✅
- [ ] CORS configurado ✅
- [ ] Rate limiting ativo ✅

---

## ✅ GO LIVE!

```
┌─────────────────────────────────────┐
│  🚀 PRODUCTION BACKEND DEPLOYED!   │
│                                     │
│  URL: https://seu-url.railway.app  │
│  Rate Limiting: ✅ ACTIVE          │
│  Debounce: ✅ ACTIVE               │
│  WhatsApp: ✅ CONNECTED            │
│  Supabase: ✅ CONNECTED            │
│  Redis: ✅ CONNECTED               │
│                                     │
│  Status: READY FOR PRODUCTION 🟢   │
└─────────────────────────────────────┘
```

---

## 🔄 ROLLBACK (Se Necessário)

```bash
# Railway Dashboard → backend → Deployments
# Click na deployment antiga → Click "Rollback"
```

- [ ] Rollback em 1 minuto
- [ ] Logs mostram versão antiga

---

## 📞 SUPPORT

| Problema | Solução |
|----------|---------|
| Build falha | Ver logs: `railway logs` |
| Webhook não recebe | Verificar URL / token em Meta |
| Rate limit muito rigoroso | Aumentar RATE_LIMIT_MAX_REQUESTS |
| Memory alta | Scale up platform |
| Redis não conecta | Adicionar plugin Redis |

---

## 🎓 Après Deploy (Next Week)

- [ ] Analisar primeiras mensagens
- [ ] Verificar rates de resposta
- [ ] Testar com múltiplos usuários
- [ ] Ajustar templates
- [ ] Monitorar performance
- [ ] Escalar se necessário
- [ ] Adicionar analytics
- [ ] Iterar com feedback

---

**Total Time: 30 minutes**  
**Difficulty: Easy**  
**Cost: Free (first $5)**  

**You're ready to go live!** 🚀

---

*Salve este checklist para futuras deploys!*
