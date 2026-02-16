# 🚀 Complete Deployment Guide - LeadFlow Backend

**Status**: ✅ Ready for Production  
**Options**: Railway (recommended) | Render | Docker  
**Time**: 15-30 minutes

---

## 🎯 Quickest Path to Production

```
1. Escolher plataforma (Railway recomendado)
2. Conectar GitHub
3. Configurar variáveis
4. Deploy automático
5. Atualizar webhook em Meta Manager
6. Testar em produção
✅ LIVE!
```

---

## 📋 Platform Comparison

| Feature | Railway | Render | Self-hosted |
|---------|---------|--------|------------|
| **Setup Time** | 5 min | 10 min | 30+ min |
| **Cost** | $3-8/mo | $7+/mo | Variável |
| **Deploy** | Automático | Automático | Manual |
| **Scaling** | Fácil | Moderado | Complexo |
| **Support** | Bom | Bom | DIY |
| **Recommended** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |

---

## 🚂 Railway (Recommended)

### Step 1: Create Account
1. Go to https://railway.app
2. Click "Start Free"
3. Login with GitHub
4. Authorize Railway

### Step 2: Deploy
1. Dashboard → New Project
2. Select "Deploy from GitHub"
3. Choose `lead-flow-master` repo
4. Select `main` branch
5. Click "Deploy"

**Time**: 2-3 minutes (first build)

### Step 3: Configure Environment
```bash
# Railway Dashboard → backend → Variables

NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Supabase
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# WhatsApp
WHATSAPP_ACCESS_TOKEN=EABa...
WHATSAPP_PHONE_ID=102...
WHATSAPP_APP_SECRET=abc...
WHATSAPP_WEBHOOK_VERIFY_TOKEN=random_token

# Rate Limit
RATE_LIMIT_WINDOW=60
RATE_LIMIT_MAX_REQUESTS=1
DEBOUNCE_WINDOW=3000
ENABLE_RATE_LIMITING=true
ENABLE_DEBOUNCE=true

# Frontend
FRONTEND_URL=https://seu-frontend.com
CORS_ORIGIN=https://seu-frontend.com

# Redis (auto-added after plugin)
REDIS_URL=${{ Redis.REDIS_URL }}

# Monitoring
SENTRY_DSN=https://...
```

**Time**: 5 minutes

### Step 4: Add Services
1. Dashboard → Project → + New → Service
2. Add "Redis" plugin
3. Wait for deployment
4. REDIS_URL auto-added to variables!

**Time**: 2-3 minutes

### Step 5: Get Production URL
1. Dashboard → backend
2. Deployments tab
3. Copy URL: `https://leadflow-backend-prod.railway.app`

### Step 6: Configure Meta Manager
```
Meta Manager → WhatsApp → Configuration

Callback URL: https://leadflow-backend-prod.railway.app/webhooks/whatsapp
Verify Token: [Your WHATSAPP_WEBHOOK_VERIFY_TOKEN]

Click "Verify and Save"
Wait for ✅ "Verified"
```

### Step 7: Test Production
```bash
# Health check
curl https://leadflow-backend-prod.railway.app/health

# Stats
curl https://leadflow-backend-prod.railway.app/health/stats

# Send test message
curl -X POST "https://graph.instagram.com/v18.0/PHONE_ID/messages" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"messaging_product":"whatsapp","to":"551199999999",...}'
```

### Step 8: Monitor Logs
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Tail logs
railway logs -f
```

---

## 🎨 Render (Alternative)

### Step 1: Create Account
1. Go to https://render.com
2. Click "Get Started"
3. GitHub login
4. Authorize Render

### Step 2: Create Service
1. Dashboard → New → Web Service
2. Connect GitHub repo
3. Branch: `main`
4. Name: `leadflow-backend`
5. Region: São Paulo (sa-east-1)
6. Runtime: Node
7. Build: `npm run build`
8. Start: `npm run start`

### Step 3: Environment Variables
Settings → Environment → Add:
```
NODE_ENV=production
PORT=3000
... (same as Railway)
```

### Step 4: Create Redis
1. Dashboard → New → Redis
2. Name: `leadflow-redis`
3. Region: São Paulo
4. Deployment: Starter
5. Create

Connection URL auto-fills in backend service!

### Step 5: Deploy
- Auto-deploys on `git push origin main`
- Or click "Redeploy"

### Step 6: Get URL
Dashboard → leadflow-backend → Live URL

---

## 🐳 Docker (Self-hosted)

### Step 1: Build Image
```bash
cd backend
docker build -t leadflow-backend:latest .
```

### Step 2: Create docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - SUPABASE_URL=${SUPABASE_URL}
      - WHATSAPP_ACCESS_TOKEN=${WHATSAPP_ACCESS_TOKEN}
      # ... todas as variáveis
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  redis_data:
```

### Step 3: Deploy
```bash
# Local
docker-compose up -d

# On server (VPS/EC2/DigitalOcean)
scp -r backend user@server:/app/
ssh user@server
cd /app
docker-compose up -d

# Check
docker-compose logs -f backend
```

---

## ✅ Production Checklist

### Before Going Live
- [ ] Code deployed successfully
- [ ] Environment variables configured
- [ ] Health check returns 200 OK
- [ ] Redis connected
- [ ] Supabase connected
- [ ] HTTPS enabled
- [ ] Webhook URL points to production
- [ ] Meta Manager webhook verified (✅)
- [ ] Test message sent and received
- [ ] Logs visible in production
- [ ] Monitoring enabled

### Monitoring Setup
```bash
# View logs
railway logs -f

# Stats endpoint
curl https://your-url/health/stats

# Expected output:
{
  "status": "ok",
  "uptime": 1234.56,
  "memory": {
    "rss": 128,
    "heapUsed": 45,
    "heapTotal": 64
  },
  "rateLimit": {
    "inMemoryRateLimit": 0,
    "inMemoryDebounce": 0,
    "config": {
      "RATE_LIMIT_WINDOW": 60,
      "ENABLE_RATE_LIMITING": true,
      "ENABLE_DEBOUNCE": true
    }
  }
}
```

### Performance Targets
- ⏱️ Response time: < 200ms
- 💾 Memory: < 50% of available
- 🚀 CPU: < 20% idle
- 📊 Error rate: < 0.1%
- 🚦 Rate limiting: 1 msg/60s per user

---

## 🔄 CI/CD Automation

### GitHub Actions (Automatic Deploy)
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway deploy
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### How to get RAILWAY_TOKEN:
1. Railway Dashboard → Account → Tokens
2. Create new token
3. Add to GitHub → Settings → Secrets → RAILWAY_TOKEN

---

## 🔒 Security Checklist

- [ ] `.env` file in `.gitignore`
- [ ] No credentials in code
- [ ] HTTPS enabled
- [ ] CORS restricted to frontend domain
- [ ] Webhook signature verified
- [ ] Rate limiting enabled
- [ ] Debounce enabled
- [ ] Error messages don't expose secrets
- [ ] Logs don't contain sensitive data
- [ ] Database backups enabled

---

## 📊 Scaling in Production

### If Getting High Traffic

**Option 1: Increase Replicas (Railway)**
```
Railway Dashboard → backend → Settings
Number of Replicas: 1 → 2 → 3
```

**Option 2: Increase Memory**
```
Settings → Compute → RAM: 512MB → 1GB → 2GB
```

**Option 3: Add Redis Cluster**
For distributed rate limiting:
```
Railway → Services → Add Redis Cluster
```

**Option 4: Multi-region**
Create duplicate services in different regions for HA.

---

## 🐛 Troubleshooting

### ❌ Build Failed
```
Error: Cannot find module 'cors'
```
Fix: Run `npm install` locally first, commit package-lock.json

### ❌ Port Already in Use
```
Error: EADDRINUSE: Port 3000 already in use
```
Fix: Change PORT in variables or check for zombie processes

### ❌ Redis Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
Fix: Add Redis plugin to project

### ❌ Webhook Returns 404
```
Error: /webhooks/whatsapp not found
```
Fix: Verify webhook route, check logs for typos

### ❌ Rate Limit Too Strict
```
Error: 429 Too many requests
```
Fix: Increase `RATE_LIMIT_MAX_REQUESTS` or `RATE_LIMIT_WINDOW`

### ❌ WhatsApp Signature Invalid
```
Error: Invalid webhook signature
```
Fix: Verify `WHATSAPP_APP_SECRET` matches Meta Manager

---

## 📞 Quick Links

### Railway
- Dashboard: https://railway.app/dashboard
- Docs: https://docs.railway.app
- Pricing: https://railway.app/pricing

### Render
- Dashboard: https://dashboard.render.com
- Docs: https://render.com/docs

### Meta Manager
- WhatsApp Setup: https://developers.facebook.com/docs/whatsapp
- Webhook Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks

---

## 🎓 Deployment Best Practices

1. **Test locally first** - Use ngrok
2. **Gradual rollout** - Monitor closely after deploy
3. **Keep backups** - Automatic Supabase backups
4. **Monitor performance** - Use /health/stats endpoint
5. **Log everything** - Set LOG_LEVEL=info for production
6. **Alert on errors** - Use Sentry or Railway alerts
7. **Rotate secrets** - Regularly rotate tokens
8. **Update dependencies** - Keep packages current

---

## 🚀 Deployment Timeline

```
Week 1: Local testing + ngrok
        ↓
Week 2: Deploy to Railway/Render
        ↓
Week 3: Production monitoring
        ↓
Week 4+: Optimization & scaling
```

---

## ✨ Next Steps After Deploy

1. ✅ Monitor first 100 messages
2. ✅ Check rate limiting works
3. ✅ Verify leads created in DB
4. ✅ Test button interactions
5. ✅ Gather metrics
6. ✅ Optimize templates based on data
7. ✅ Scale if needed

---

**Status**: ✅ Production Ready  
**Recommended**: Railway (fastest, best support)  
**Estimated Cost**: $3-8/month  
**Time to Live**: 15-30 minutes

---

*Ready to launch? Let's go! 🚀*
