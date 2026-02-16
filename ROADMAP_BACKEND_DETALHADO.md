# 🗺️ Plano Detalhado de Implementação - Backend

## Objetivo
Transformar o projeto de POC frontend em um MVP production-ready com suporte real a WhatsApp.

---

## Fase 1: Backend Setup (2 dias)

### 1.1 Criar estrutura do backend
```
lead-flow-backend/
├── src/
│   ├── index.ts (entry point)
│   ├── routes/
│   │   ├── webhooks.ts (WhatsApp webhook)
│   │   ├── messages.ts (CRUD de mensagens)
│   │   └── health.ts (health check)
│   ├── controllers/
│   │   ├── whatsappController.ts
│   │   ├── messageController.ts
│   │   └── classificationController.ts
│   ├── services/
│   │   ├── whatsappService.ts (integração API Meta)
│   │   ├── classificationService.ts (chama classifier do frontend)
│   │   ├── templateService.ts (busca template no Supabase)
│   │   └── rateLimiterService.ts (cache Redis)
│   ├── middleware/
│   │   ├── rateLimiter.ts
│   │   ├── verify-webhook.ts (valida token Meta)
│   │   └── errorHandler.ts
│   ├── config/
│   │   ├── env.ts (variables)
│   │   └── supabase.ts (client)
│   └── types/
│       ├── whatsapp.ts
│       └── message.ts
├── .env (local)
├── .env.example
├── package.json
├── tsconfig.json
└── Dockerfile (para deploy)
```

### 1.2 Stack Recomendado
```json
{
  "runtime": "Node.js 20 LTS",
  "framework": "Express.js 4.18+",
  "language": "TypeScript 5.x",
  "database": "Supabase PostgreSQL (já existe)",
  "cache": "Redis (Railway add-on, $7/mês)",
  "deployment": "Railway ou Render",
  "monitoring": "Sentry (free tier)",
  "logging": "Winston + Supabase"
}
```

### 1.3 Dependências Principais
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "typescript": "^5.0.0",
    "@supabase/supabase-js": "^2.38.0",
    "redis": "^4.6.0",
    "axios": "^1.4.0",
    "dotenv": "^16.0.3",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "uuid": "^9.0.0",
    "winston": "^3.8.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0",
    "tsx": "^3.12.0",
    "jest": "^29.5.0",
    "@types/jest": "^29.5.0"
  }
}
```

---

## Fase 2: Webhook WhatsApp (3-4 dias)

### 2.1 Estrutura de Webhook
```typescript
// POST /webhooks/whatsapp
// Recebe: { entry: [{ changes: [{ value: { messages: [...] } }] }] }

interface WhatsAppWebhookPayload {
  entry: Array<{
    changes: Array<{
      value: {
        messaging_product: "whatsapp",
        messages: Array<{
          from: string,        // Número do cliente
          id: string,
          timestamp: string,
          type: "text",
          text: { body: string }
        }>,
        metadata: {
          phone_number_id: string,
          display_phone_number: string
        }
      }
    }>
  }>
}
```

### 2.2 Fluxo de Processamento
```
1. Receber POST /webhooks/whatsapp
   ↓
2. Validar token (header Authorization)
   ↓
3. Verificar assinatura webhook (SHA256)
   ↓
4. Extrair dados: número, mensagem, timestamp
   ↓
5. Buscar store_config no Supabase
   ↓
6. Chamar serviço de classificação (local ou chamada HTTP ao frontend)
   ↓
7. Buscar template na DB
   ↓
8. Verificar rate limiter (Redis)
   ↓
9. Enviar resposta via WhatsApp API
   ↓
10. Registrar em interaction_logs
    ↓
11. Se clicou CTA → registrar em qualified_leads
    ↓
12. Responder 200 OK ao Meta webhook
```

### 2.3 Implementação do Controller
```typescript
// src/controllers/whatsappController.ts

export async function handleWhatsAppMessage(req: Express.Request, res: Express.Response) {
  try {
    // 1. Validar assinatura
    const signature = req.headers['x-hub-signature-256'] as string;
    if (!verifyWebhookSignature(req.body, signature)) {
      return res.status(403).json({ error: 'Invalid signature' });
    }

    // 2. Extrair mensagem
    const messages = extractMessages(req.body);
    
    for (const msg of messages) {
      await processMessage(msg);
    }

    // 3. Responder ao Meta imediatamente
    return res.status(200).json({ success: true });
    
  } catch (err) {
    logger.error('Webhook error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function processMessage(msg: WhatsAppMessage) {
  // 1. Classificar
  const category = classifyMessage(msg.text);
  
  // 2. Buscar template
  const template = await getTemplate(msg.userId, category);
  
  // 3. Rate limiter
  const canRespond = await checkRateLimit(msg.from);
  if (!canRespond) {
    logger.warn(`Rate limit exceeded for ${msg.from}`);
    return;
  }
  
  // 4. Enviar resposta
  const responseText = buildResponse(template, storeConfig);
  await sendWhatsAppMessage(msg.from, responseText, msg.phoneId);
  
  // 5. Log em interaction_logs
  await logInteraction({
    contact_name: msg.from,
    message_received: msg.text,
    category_assigned: category,
    response_sent: responseText,
    channel: 'whatsapp',
    clicked_buy: false,
    user_id: msg.userId
  });
}
```

### 2.4 Envio de Resposta via Meta API
```typescript
// src/services/whatsappService.ts

export async function sendWhatsAppMessage(
  phoneNumber: string,
  text: string,
  phoneId: string,
  withCTA: boolean = true
) {
  const url = `https://graph.instagram.com/v18.0/${phoneId}/messages`;
  
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phoneNumber,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: text },
      action: {
        buttons: [
          {
            type: "reply",
            reply: {
              id: "buy_now",
              title: "Quero comprar! 🛒"
            }
          }
        ]
      }
    }
  };

  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data;
}
```

---

## Fase 3: Rate Limiting & Debounce (1 dia)

### 3.1 Estratégia de Rate Limiting
```typescript
// src/services/rateLimiterService.ts

import Redis from 'redis';

const redis = Redis.createClient({
  url: process.env.REDIS_URL // Railway Redis
});

export async function checkRateLimit(phoneNumber: string): Promise<boolean> {
  const key = `rate_limit:${phoneNumber}`;
  
  // Max 1 resposta por 60 segundos por número
  const current = await redis.get(key);
  if (current) {
    return false; // Rate limit atingido
  }
  
  // Registrar tentativa
  await redis.setex(key, 60, '1');
  return true;
}

export async function debounceMessages(
  phoneNumber: string,
  messages: string[]
): Promise<string[]> {
  // Se múltiplas mensagens em 3 segundos,
  // responder apenas à última (melhor contexto)
  
  const key = `debounce:${phoneNumber}`;
  const last = await redis.get(key);
  
  if (last) {
    // Aguardar 3s e retornar só a última
    return [messages[messages.length - 1]];
  }
  
  await redis.setex(key, 3, '1');
  return messages;
}
```

### 3.2 Middleware Express
```typescript
// src/middleware/rateLimiter.ts

import { Request, Response, NextFunction } from 'express';
import { checkRateLimit } from '../services/rateLimiterService';

export async function rateLimiterMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const phoneNumber = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;
  
  if (!phoneNumber) {
    return next(); // Skip se não houver número
  }
  
  const allowed = await checkRateLimit(phoneNumber);
  if (!allowed) {
    logger.warn(`Rate limited: ${phoneNumber}`);
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  next();
}
```

---

## Fase 4: Integração com Classificação (1 dia)

### 4.1 Opções de NLP

**Opção 1: Usar classificador do frontend (Recomendado para MVP)**
```typescript
// Importar classification-engine.ts do frontend ou copiar para backend
import { classifyMessage } from '../lib/classification-engine';

const result = classifyMessage(messageText, customKeywords);
// { category: "Preço", matched: true }
```

**Opção 2: Melhorar com fastText (Fase 2)**
```bash
# Instalar fastText
pip install fasttext

# Treinar modelo com histórico de mensagens
# ~/models/classification.bin
```

**Opção 3: Usar API externa (OpenAI/Azure)**
```typescript
// Mais caro, mas mais robusto
const { data } = await openai.completions.create({
  model: "gpt-3.5-turbo",
  prompt: `Classifique em categoria: ${messageText}`,
  // ...
});
```

### 4.2 Implementação Recomendada
```typescript
// src/services/classificationService.ts

import { classifyMessage, DEFAULT_DICTIONARIES } from '../lib/classification-engine';

export async function classifyMessageService(
  text: string,
  userId: string
): Promise<string | null> {
  try {
    // 1. Buscar keywords customizadas do usuário
    const customKeywords = await supabase
      .from('keyword_dictionaries')
      .select('*')
      .eq('user_id', userId);
    
    // 2. Classificar
    const result = classifyMessage(text, customKeywords?.data);
    
    // 3. Retornar categoria ou null
    return result.matched ? result.category : null;
    
  } catch (err) {
    logger.error('Classification error:', err);
    return null; // Fallback
  }
}
```

---

## Fase 5: Persistência em DB (1 dia)

### 5.1 Logs de Interação (Já existe tabela)
```typescript
// Inserir em interaction_logs

await supabase.from('interaction_logs').insert({
  user_id: userId,
  contact_name: phoneNumber,
  channel: 'whatsapp',
  message_received: messageText,
  category_assigned: category,
  response_sent: responseText,
  status: 'auto_replied',
  clicked_buy: false, // Será atualizado se clicar CTA
  created_at: new Date().toISOString()
});
```

### 5.2 Leads Qualificados (Quando clica CTA)
```typescript
// Inserir em qualified_leads quando receber resposta do botão

// Em handleWhatsAppMessage:
if (msg.type === 'interactive' && msg.interactive.button_reply.id === 'buy_now') {
  // Marcar como clicou
  await supabase.from('interaction_logs')
    .update({ clicked_buy: true })
    .eq('contact_name', msg.from);
  
  // Criar lead qualificado
  await supabase.from('qualified_leads').insert({
    user_id: userId,
    contact_name: msg.from,
    channel: 'whatsapp',
    category: lastCategory,
    status: 'waiting',
    clicked_at: new Date().toISOString()
  });
}
```

---

## Fase 6: Validação de Webhooks (1 dia)

### 6.1 Verificar Assinatura Meta
```typescript
// src/middleware/verify-webhook.ts

import crypto from 'crypto';

export function verifyWebhookSignature(
  payload: any,
  signature: string
): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET as string;
  
  const hash = crypto
    .createHmac('sha256', appSecret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return `sha256=${hash}` === signature;
}
```

### 6.2 Health Check
```typescript
// GET /health

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    whatsappConnected: !!process.env.WHATSAPP_ACCESS_TOKEN,
    redisConnected: redis.isOpen,
    supabaseConnected: true
  });
});
```

---

## Fase 7: Deploy (1 dia)

### 7.1 Configurar Railway
1. Criar projeto em railway.app
2. Conectar repo GitHub
3. Adicionar variáveis de ambiente:
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_PHONE_ID`
   - `WHATSAPP_APP_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `REDIS_URL` (adicionar Redis add-on)
   - `SENTRY_DSN` (monitoring)

### 7.2 Variáveis de Ambiente
```bash
# .env.production
NODE_ENV=production
PORT=3000

# Supabase
SUPABASE_URL=https://vcohruqzjjijjqsknsua.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIs...

# WhatsApp Meta
WHATSAPP_ACCESS_TOKEN="EAB..."
WHATSAPP_PHONE_ID="102..."
WHATSAPP_APP_SECRET="abc123..."

# Redis
REDIS_URL="redis://..."

# Monitoring
SENTRY_DSN="https://..."

# Logging
LOG_LEVEL=info
```

### 7.3 Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### 7.4 GitHub Actions CI/CD
```yaml
# .github/workflows/deploy.yml

name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - run: npm test
      - name: Deploy to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: railway up
```

---

## Fase 8: Testes (2-3 dias)

### 8.1 Testes Unitários
```typescript
// src/__tests__/classification.test.ts

describe('classifyMessage', () => {
  it('should classify price questions', () => {
    const result = classifyMessage('Qual é o preço?');
    expect(result.category).toBe('Preço');
  });
  
  it('should classify size questions', () => {
    const result = classifyMessage('Qual tamanho vocês têm?');
    expect(result.category).toBe('Tamanhos');
  });
  
  it('should fall back to null for unknowns', () => {
    const result = classifyMessage('zzzzz xyz abc');
    expect(result.category).toBeNull();
  });
});
```

### 8.2 Testes de Integração
```typescript
// src/__tests__/webhook.integration.test.ts

describe('WhatsApp Webhook', () => {
  it('should process incoming message', async () => {
    const payload = {
      entry: [{
        changes: [{
          value: {
            messages: [{
              from: '5511999999999',
              text: { body: 'Qual é o preço?' },
              // ...
            }]
          }
        }]
      }]
    };
    
    const response = await request(app)
      .post('/webhooks/whatsapp')
      .send(payload)
      .set('x-hub-signature-256', signature);
    
    expect(response.status).toBe(200);
    
    // Verificar se foi logado
    const logs = await supabase
      .from('interaction_logs')
      .select('*')
      .eq('contact_name', '5511999999999');
    
    expect(logs.data?.length).toBeGreaterThan(0);
  });
});
```

---

## Fase 9: Monitoramento (Contínuo)

### 9.1 Sentry Integration
```typescript
// src/index.ts

import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.errorHandler());
```

### 9.2 Logging com Winston
```typescript
// src/logger.ts

import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 9.3 Metricas Via CloudWatch
```typescript
// Enviar métricas customizadas
// Interações por hora
// Taxa de erro
// Latência de resposta
```

---

## Timeline Realista

| Fase | Descricão | Dias | Acumulado |
|------|-----------|------|-----------|
| 1 | Backend setup | 2 | 2 |
| 2 | Webhook WhatsApp | 3-4 | 5-6 |
| 3 | Rate limiting | 1 | 6-7 |
| 4 | Classificação | 1 | 7-8 |
| 5 | DB persistência | 1 | 8-9 |
| 6 | Webhook validation | 1 | 9-10 |
| 7 | Deploy | 1 | 10-11 |
| 8 | Testes | 2-3 | 12-14 |
| **TOTAL** | — | **12-14 dias** | — |

*Com 1 dev em 8h/dia*

---

## Checklist de Implementação

```markdown
### Sprint Backend Setup
- [ ] Criar repo backend (GitHub)
- [ ] Setup Express + TypeScript
- [ ] Conectar Supabase client
- [ ] Estrutura de pastas

### Sprint WhatsApp Integration
- [ ] Webhook receiver
- [ ] Assinatura validation
- [ ] Envio de resposta via Meta API
- [ ] Integração com classificação

### Sprint Rate Limiting
- [ ] Redis setup
- [ ] Rate limiter middleware
- [ ] Debounce de mensagens
- [ ] Testes de limite

### Sprint Database
- [ ] Logging de interações
- [ ] Lead qualificado em DB
- [ ] Queries otimizadas
- [ ] Índices criados

### Sprint Deployment
- [ ] Dockerfile
- [ ] GitHub Actions
- [ ] Railway setup
- [ ] Variáveis de ambiente

### Sprint Testes
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Teste com usuário real
- [ ] Ajustes finais

### Sprint Monitoramento
- [ ] Sentry integrado
- [ ] Logging estruturado
- [ ] CloudWatch metrics
- [ ] Alertas configurados
```

---

## Próximas Fases (Phase 2+)

P**Fase 2 (Semana 3-4)**:
- [ ] Push notifications (Web Push API)
- [ ] Dashboard melhorado com gráficos
- [ ] Analytics de conversão
- [ ] LGPD compliance

**Fase 3 (Semana 5-6)**:
- [ ] Multi-canal (Instagram DM, Messenger)
- [ ] ML melhorado (fastText training)
- [ ] Integração CRM (Google Sheets)
- [ ] Marketplace de templates

**Roadmap Longo**:
- [ ] SaaS multi-tenant
- [ ] Embeddings avançados
- [ ] Checkout conversacional
- [ ] API pública

---

*Plano prático e realista. Ajustar conforme progresso real.*
