# LeadFlow Backend

API backend Node.js + Express para o classificador automático de leads.

## Setup Rápido

### 1. Instalar dependências
```bash
cd backend
npm install
# ou com bun:
bun install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
```

Edite `.env` com:
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_ID`
- `WHATSAPP_APP_SECRET`
- `REDIS_URL` (se usar Redis remoto)

### 3. Desenvolvimento
```bash
npm run dev
```

Servidor rodará em `http://localhost:3000`

### 4. Build para produção
```bash
npm run build
npm start
```

## Arquitetura

```
src/
├── index.ts               # Entry point
├── routes/
│   ├── webhooks.ts       # WhatsApp webhook routes
│   └── health.ts         # Health check
├── controllers/
│   └── whatsappController.ts  # Message handling logic
├── services/
│   ├── whatsappService.ts     # WhatsApp API calls
│   ├── classificationService.ts   # Message classification
│   └── templateService.ts      # Template management
├── middleware/
│   ├── verifyWebhook.ts   # Signature verification
│   ├── rateLimiter.ts     # Rate limiting
│   └── errorHandler.ts    # Error handling
├── config/
│   ├── supabase.ts       # Supabase client
│   └── redis.ts          # Redis client
├── types/
│   └── whatsapp.ts       # TypeScript types
└── utils/
    └── logger.ts         # Winston logger
```

## Endpoints

### Health Check
```
GET /health
```

Retorna status do servidor e conexões.

### WhatsApp Webhook
```
GET /webhooks/whatsapp
POST /webhooks/whatsapp
```

Recebe mensagens do WhatsApp Cloud API.

## Fluxo de Mensagem

```
1. Cliente envia mensagem no WhatsApp
   ↓
2. Meta envia webhook POST para /webhooks/whatsapp
   ↓
3. Middleware verifica assinatura
   ↓
4. Rate limiter valida frequência
   ↓
5. classifyMessage() → categoria
   ↓
6. getTemplate() → resposta padrão
   ↓
7. buildResponse() → preço/cores/etc
   ↓
8. sendWhatsAppMessage() → envia resposta
   ↓
9. interaction_logs → registra em DB
   ↓
10. Se clicou CTA → qualified_leads
```

## Desenvolvimento

### Rodar testes
```bash
npm run test
npm run test:watch
```

### Verificar tipos
```bash
npm run type-check
```

### Lint
```bash
npm run lint
```

## Deploy

### Railway (Recomendado)
```bash
npx railway link
npx railway up
```

Configure variáveis de ambiente no Railway dashboard.

### Docker
```bash
docker build -t lead-flow-backend .
docker run -p 3000:3000 --env-file .env lead-flow-backend
```

### Vercel (Serverless)
```bash
vercel deploy
```

Crie `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "functions": {
    "src/index.ts": {
      "runtime": "nodejs20.x"
    }
  }
}
```

## Monitoramento

### Logs
```bash
tail -f logs/combined.log
tail -f logs/error.log
```

### Health check
```bash
curl http://localhost:3000/health
```

## Troubleshooting

### "Invalid signature"
- Verifique `WHATSAPP_APP_SECRET` está correto
- Valide que o webhook foi configurado no Meta Manager

### "No store config found"
- Verifique que `WHATSAPP_PHONE_ID` foi salvo no Supabase
- Confirme na página Settings do frontend

### Redis connection failed
- Se usando Redis local: `redis-server`
- Se usando Railway: copie URL do Redis add-on

## Referências

- [WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Express.js](https://expressjs.com/)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [Redis Node Client](https://github.com/redis/node-redis)

---

Version: 0.1.0  
Last updated: Feb 15, 2026
