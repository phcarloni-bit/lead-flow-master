# 🚀 Guia de Deployment - LeadFlow Backend

## Preparação Local

### 1. Instalar dependências
```bash
cd backend
npm install
# ou bun
bun install
```

### 2. Testar localmente
```bash
npm run dev
```

Acesse: `http://localhost:3000`

### 3. Build
```bash
npm run build
```

---

## Deployment Railway (Recomendado para MVP)

### 1. Criar conta no Railway
https://railway.app

### 2. Conectar GitHub
```bash
npx railway login
```

### 3. Criar projeto
```bash
cd backend
npx railway init
# seguir prompts
```

### 4. Configurar variáveis de ambiente
No dashboard do Railway, adicionar:

```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

SUPABASE_URL=https://vcohruqzjjijjqsknsua.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIs...

WHATSAPP_ACCESS_TOKEN=EAB...
WHATSAPP_PHONE_ID=102...
WHATSAPP_APP_SECRET=abc123...
WHATSAPP_WEBHOOK_VERIFY_TOKEN=seu_token_aqui

REDIS_URL=redis://...  # Adicionar via Railway Redis add-on
FRONTEND_URL=https://seu-dominio.vercel.app
```

### 5. Adicionar Redis (Ad-on)
No Railway dashboard:
- Plugins → Redis
- Conecta automaticamente via `REDIS_URL`

### 6. Deploy
```bash
npx railway up
```

Ou confira na UI do Railway o status do deploy.

---

## Deployment Vercel (Serverless)

**Nota**: WhatsApp webhooks precisam ser "sempre online", serverless pode ter delays. Considere Railway ou outro provider.

### 1. Setup
```bash
npm install -g vercel
vercel login
cd backend
```

### 2. Criar `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "functions": {
    "src/index.ts": {
      "runtime": "nodejs20.x"
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 3. Deploy
```bash
vercel deploy --prod
```

### 4. Variáveis de ambiente
No dashboard Vercel:
Settings → Environment Variables → adicionar todas as vars do `.env`

---

## Deployment Render.com (Alternativa)

### 1. Criar conta e conectar GitHub
https://render.com

### 2. Criar novo Web Service
- Selecionar repo do backend
- Runtime: Node
- Build: `npm install && npm run build`
- Start: `npm start`

### 3. Configurar environment
Adicionar vars no dashboard Render

### 4. Deploy automático
Cada push para `main` faz deploy automático

---

## Deployment Docker (VPS/Self-hosted)

### 1. Build imagen
```bash
docker build -t lead-flow-backend:latest .
```

### 2. Run contêiner
```bash
docker run -d \
  -p 3000:3000 \
  --name lead-flow-backend \
  --env-file .env \
  lead-flow-backend:latest
```

### 3. Usar Docker Compose
```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
      - WHATSAPP_ACCESS_TOKEN=${WHATSAPP_ACCESS_TOKEN}
      - WHATSAPP_PHONE_ID=${WHATSAPP_PHONE_ID}
      - WHATSAPP_APP_SECRET=${WHATSAPP_APP_SECRET}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    restart: always

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: always
```

Run:
```bash
docker-compose up -d
```

---

## Configurar Webhook no Meta Manager

### 1. Acessar Meta Business Platform
https://business.facebook.com

### 2. Criar app (se não tiver)
- App Center → Create App → Business → WhatsApp

### 3. Configurar webhook
WhatsApp > API Setup:

**Callback URL**:
```
https://seu-dominio.com/webhooks/whatsapp
```

**Verify Token**: 
Use o valor de `WHATSAPP_WEBHOOK_VERIFY_TOKEN` local

**Subscribe to Messages**: Enable

### 4. Testar webhook
```bash
curl -X GET "https://seu-dominio.com/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=test&hub.verify_token=seu_token"
```

Deve retornar: `test`

---

## Monitoramento em Produção

### Logs
```bash
# Railway
railway logs

# Docker
docker logs lead-flow-backend
```

### Health Check
```bash
curl https://seu-dominio.com/health
```

Esperado:
```json
{
  "status": "healthy",
  "uptime": 3600,
  "timestamp": "2026-02-15T10:30:00Z",
  "services": {
    "redis": "connected",
    "supabase": "connected"
  }
}
```

### Error Tracking (Optional - Sentry)
```bash
npm install @sentry/node @sentry/tracing
```

Adicionar ao `src/index.ts`:
```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

---

## Troubleshooting

### Webhook não recebe mensagens
- [ ] Verify token correto em Meta Manager
- [ ] URL acessível (não localhost)
- [ ] Método POST ativado
- [ ] Testar: `curl -X POST https://seu-dominio/webhooks/whatsapp -d '{"test": true}'`

### "Invalid signature"
- [ ] `WHATSAPP_APP_SECRET` está correto
- [ ] Body não foi modificado

### Redis connection failed
- Verificar `REDIS_URL` está correto
- Se local: `redis-server` rodando
- Se Railway: add-on de Redis ativado

### Rate limit errors
- Verificar concorrência de requisições
- Aumentar `RATE_LIMIT_WINDOW` se necessário

---

## Performance & Scaling

### Inicial (MVP)
- 1 instância Node.js
- 1 Redis (cache)
- Supabase (autoescala)

### Crescimento
- Load balancer (nginx/Railway)
- Múltiplas instâncias Node.js
- Redis cluster (se necessário)
- Database replication (Supabase Pro)

### Monitoring recomendado
- New Relic / Datadog (APM)
- PagerDuty (alertas)
- Uptime robot (ping externo)

---

## Rollback em caso de erro

### Railway
Dashboard → Deployments → selecionar versão anterior

### Docker
```bash
docker rollback lead-flow-backend
```

### Vercel
Vercel Dashboard → Deployments → redeploy versão anterior

---

## Checklist Deployment

- [ ] Build local OK: `npm run build`
- [ ] Testes passando: `npm test`
- [ ] Variables configuradas
- [ ] Webhook URL adicionada em Meta Manager
- [ ] Health check respondendo 200
- [ ] Primeira mensagem de teste enviada
- [ ] Log registrado em DB
- [ ] Resposta automática chegou no WhatsApp
- [ ] Botão "Quero Comprar" clicável
- [ ] Lead criado em `qualified_leads`
- [ ] Notificação chegou no app frontend

---

Version: 0.1.0  
Date: Feb 15, 2026
