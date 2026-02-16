# 🚀 Deploy em Railway - Guia Completo

**Tempo**: ~15 minutos de setup  
**Custo**: Grátis (primeiros $5 crédito)  
**Status**: Production-ready  

---

## O Que Você Vai Fazer

```
1. Criar conta Railway (2 min)
2. Conectar GitHub (1 min)
3. Deploy automático (2 min)
4. Configurar variáveis (3 min)
5. Adicionar Redis + Postgres (2 min)
6. Testar webhook (2 min)
7. Monitorar em produção (1 min)
```

---

## 1️⃣ Criar Conta Railway

### Passo A: Registrar
1. Ir para https://railway.app
2. Click "Start Free"
3. Login com GitHub (recomendado)
4. Autorizar Railway

### Passo B: Criar Novo Projeto
1. Dashboard → New Project
2. Selecionar "Deploy from GitHub"
3. Buscar seu repositório LeadFlow
4. Click "Deploy"

---

## 2️⃣ Conectar GitHub

### Passo A: Autorizar Repositório
1. Selecionar: `lead-flow-master`
2. Selecionar branch: `main`
3. Click "Deploy"

### Passo B: Configurar Build
Railway detectará automaticamente:
- Node.js (package.json)
- Build: `npm run build`
- Start: `npm run start`

Se não detectar, configure em:
Project → Services → backend → Settings

---

## 3️⃣ Deploy Automático

### Primeira Build
```
✅ Install dependencies
✅ Build TypeScript
✅ Start server
✅ Health check
```

**Tempo**: ~3-5 minutos

Você verá:
```
Deploying...
Building...
Starting...
✅ Deployed at https://leadflow-backend-prod.railway.app
```

---

## 4️⃣ Configurar Variáveis de Ambiente

### No Railway Dashboard

1. **Projeto** → **backend** (seu serviço)
2. **Variables** tab
3. Adicionar cada variável:

```env
# App
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Supabase
SUPABASE_URL=https://vcohruqzjjijjqsknsua.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# WhatsApp
WHATSAPP_ACCESS_TOKEN=EABa...
WHATSAPP_PHONE_ID=102...
WHATSAPP_APP_SECRET=abc123...
WHATSAPP_WEBHOOK_VERIFY_TOKEN=my_random_token_123

# Rate Limiting & Debounce
RATE_LIMIT_WINDOW=60
RATE_LIMIT_MAX_REQUESTS=1
DEBOUNCE_WINDOW=3000
ENABLE_RATE_LIMITING=true
ENABLE_DEBOUNCE=true

# Frontend
FRONTEND_URL=https://seu-frontend.tech
CORS_ORIGIN=https://seu-frontend.tech

# Redis (será auto-preenchido)
REDIS_URL=${{ Redis.REDIS_URL }}

# Sentry
SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz
```

4. Click Save

---

## 5️⃣ Adicionar Redis + Postgres

### Adicionar Redis

1. **Project** → **+ New** → **Service** → **Add Plugin**
2. Buscar e selecionar **Redis**
3. Click "Deploy"

Railway automaticamente adiciona `REDIS_URL` ao backend!

### Adicionar PostgreSQL (Opcional - Use Supabase)

Se não estiver usando Supabase, adicione PostgreSQL também.

---

## 6️⃣ Configurar Webhook em Meta Manager

Após deploy bem-sucedido:

### Passo A: Obter URL
```
Railway Dashboard → backend → Deployments
Copiar URL: https://leadflow-backend-prod.railway.app
```

### Passo B: Configurar Meta
1. Meta Manager → WhatsApp → Configuration
2. **Callback URL**: `https://seu-url.railway.app/webhooks/whatsapp`
3. **Verify Token**: Cole seu token de `.env`
4. Click "Verify and Save"

Aguarde até ver ✅ "Verified"

---

## 7️⃣ Testar Webhook em Produção

### Verify Token
```bash
curl -X GET "https://seu-url.railway.app/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=test&hub.verify_token=MY_TOKEN"

# Response esperado:
test
```

### Health Check
```bash
curl -X GET "https://seu-url.railway.app/health"

# Response esperado:
{"status":"healthy",...}
```

### Enviar Mensagem Teste
```bash
curl -X POST "https://graph.instagram.com/v18.0/PHONE_ID/messages" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"messaging_product":"whatsapp","to":"551199999999","type":"text","text":{"body":"Teste Railway"}}'
```

Verifique nos logs do Railway se recebeu!

---

## 📊 Monitorar em Produção

### Logs em Tempo Real
1. Railway Dashboard → backend
2. Tab **Logs**
3. Ver mensagens:
```
INFO  ✅ Message processed
WARN  ⚠️  Rate limit exceeded
ERROR ❌ Error sending response
```

### Logs Permanentes
```bash
# Ver últimos 100 logs
railway logs -n 100

# Follow (tail)
railway logs -f
```

### Métricas
💬 **CPU**: Deve estar < 20%  
💾 **Memory**: Deve estar < 50%  
🚀 **Build Time**: ~3-5 min  
⏱️ **Response Time**: < 200ms  

---

## 🔄 Deploy Automático (CI/CD)

Cada push para `main` redeploya automaticamente!

### Para Desabilitar
Project → Settings → Auto Deploy → **OFF**

### Deploy Manual
```bash
# Via CLI
railway deploy

# Ou push para Git
git push origin main
```

---

## 🆘 Troubleshooting Railway

### ❌ Build falhs
```
Error: Cannot find module 'cors'
```
**Solução**: Verificar package.json, rodar `npm install` localmente primeiro

### ❌ Port não responde
```
Error: EADDRINUSE: Port 3000 already in use
```
**Solução**: Mudar PORT em variáveis para 8080 ou 3001

### ❌ Webhook não recebe
```
404 Not Found on /webhooks/whatsapp
```
**Solução**: Verificar URL em Meta Manager, certificar webhook path correto

### ❌ Rate limit sempre atinge
```
Too many requests (429)
```
**Solução**: 
- Aumentar `RATE_LIMIT_MAX_REQUESTS`
- Ou não enviar mensagens tão rápido

### ❌ Redis não conecta
```
Error: Redis connection failed
```
**Solução**: 
- Verificar se plugin Redis foi criado
- Copiar `REDIS_URL` correto
- Redeploar

### ❌ Variáveis não carregando
```
undefined WHATSAPP_ACCESS_TOKEN
```
**Solução**:
- Railway → Variables → Verificar typo
- Redeploar após salvar

---

## 📈 Escalando em Railway

### Aumentar Replicas (Load Balancing)
1. Project → backend → Settings
2. **Number of Replicas**: 1 → 2 (ou mais)
3. Salvar
4. Railway redeploya automaticamente

### Aumentar Memória
1. Settings → Compute
2. RAM: 512MB → 1GB → 2GB
3. Salvar

### Multi-region Deploy
Railway oferece regiões:
- 🇺🇸 us-west
- 🇺🇸 us-east
- 🇪🇺 eu-west
- 🇧🇷 sa-east

Para alta disponibilidade, copiar serviço para múltiplas regiões.

---

## 💎 Pricing Railway

| Tier | Crédito/Mês | Ideal Para |
|------|------------|----------|
| **Free** | $5 | Teste/Dev |
| **Pro** | + Usage | Produção baixo volume |
| **Teams** | Customizado | Enterprise |

**Custo Estimado Por Mês**:
- Node.js: ~$0.50-$2
- Redis: ~$0.30-$1
- PostgreSQL: ~$2-$5

Total: ~$3-$8 por mês

---

## ✅ Success Checklist

```
SETUP
- [ ] Conta Railway criada
- [ ] GitHub conectado
- [ ] Deploy bem-sucedido (✅ green)

CONFIGURATION
- [ ] Variáveis de ambiente preenchidas
- [ ] Redis adicionado
- [ ] PostgreSQL adicionado (opcional)

WEBHOOK
- [ ] URL configurada em Meta Manager
- [ ] Webhook verificado (✅ badge)
- [ ] Health check retorna 200

TESTING
- [ ] Mensagem chega no backend
- [ ] Resposta aparece no WhatsApp
- [ ] Logs visíveis no Railway
- [ ] Rate limit funciona

MONITORING
- [ ] CPU < 20%
- [ ] Memory < 50%
- [ ] Errors < 1%
- [ ] Response time < 200ms
```

---

## 🎓 Pro Tips

1. **Preview Deployments**: Ativar para testar em branch
2. **Webhooks**: Usar ngrok localmente, Railway em produção
3. **Logs**: Ativar debug com `LOG_LEVEL=debug`
4. **Backups**: Railway faz backup automático
5. **Scaling**: Começar com 1 replica, aumentar conforme necessário
6. **Monitoring**: Ativar Sentry para alertas de erro

---

## 🔗 Links Úteis

- [Railway Docs](https://docs.railway.app)
- [Railway CLI](https://docs.railway.app/cli/command-reference)
- [Node.js Deployment](https://docs.railway.app/deploy/runtimes/nodejs)
- [Environment Variables](https://docs.railway.app/guides/variables)

---

## 📞 Next Steps

1. ✅ Criar conta Railway
2. ✅ Deploy código
3. ✅ Configurar variáveis
4. ✅ Testar webhook
5. ✅ Monitorar em produção
6. ✅ Ficar rico com leads! 💰

---

**Status**: ✅ Production Ready  
**Próximo**: Configurar CI/CD + Monitoring

---

*Ready to go live? Let's ship it! 🚀*
