# 🎯 AÇÕES PRIORITÁRIAS: LeadFlow - Do MVP para Produção

**Data**: 16 Fevereiro 2026  
**Objetivo**: De 65-70% → 100% em 2-3 semanas  

---

## 🚨 TOP 5 AÇÕES CRÍTICAS (Fazer HOJE)

### 1️⃣ DEPLOY BACKEND PARA RAILWAY ⏱️ 30 min
**Status**: Pronto (99%)  
**Arquivo**: `backend/DEPLOY_CHECKLIST.md`

**Steps**:
```bash
1. Criar conta Railway: https://railway.app
2. Conectar GitHub
3. Deploy automático
4. Configurar Redis + PostgreSQL
5. Adicionar variáveis de ambiente
6. Testar: curl https://seu-backend/health
```

**Checklist**:
- [ ] Backend respondendo em HTTPS
- [ ] /health endpoint retorna 200
- [ ] /health/stats mostra métricas
- [ ] Logs visíveis no Railway dashboard
- [ ] Rate limiting funcional

**Output Esperado**:
```
GET https://backend-xxx.railway.app/health
{
  "status": "healthy",
  "services": {
    "redis": "connected",
    "supabase": "connected"
  }
}
```

**Tempo Estimado**: 30 min

---

### 2️⃣ VALIDAR INTEGRAÇÃO WHATSAPP REAL ⏱️ 1-2 horas

**Etapa 1: Setup credenciais**
```
1. Meta Developer: https://developers.facebook.com
2. Criar app WhatsApp Business
3. Gerar access token (válido por 6 meses)
4. Copiar phone_id e app_secret
5. Configurar .env no Railway:
   WHATSAPP_ACCESS_TOKEN=EABa...
   WHATSAPP_PHONE_ID=102...
   WHATSAPP_APP_SECRET=abc...
```

**Etapa 2: Validar webhook (CRÍTICO)**
```
POST /webhook/whatsapp {
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "ENTRY_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "messages": [{
          "from": "5511987654321",
          "id": "msg_id",
          "timestamp": "1234567890",
          "text": { "body": "Quanto custa?" },
          "type": "text"
        }]
      }
    }]
  }]
}
```

**Verificação**:
- [ ] Webhook recebe mensagem
- [ ] Classifica corretamente
- [ ] Resposta é enviada
- [ ] Status é salvo em interaction_logs
- [ ] Button "Quero comprar" aparece

**Erro Comum**:
```
❌ HMAC verification falha
→ Verificar X-Hub-Signature header
  Calculate: sha256(payload, app_secret)
  Compare com header
```

**Arquivo para validar**: `backend/src/middleware/verifyWebhook.ts`

---

### 3️⃣ CORRIGIR BUTTON FORMAT WHATSAPP ⏱️ 30 min

**Problema**: Button simples não é suportado pelo WhatsApp  
**Solução**: Interactive message com reply buttons

**Código a adicionar** em `backend/src/services/whatsappService.ts`:

```typescript
// ❌ ERRADO (não funciona no WhatsApp)
const wrongFormat = {
  messaging_product: "whatsapp",
  to: userPhoneNumber,
  type: "text",
  text: { body: "Quero comprar" }
};

// ✅ CORRETO (interactive message)
const correctFormat = {
  messaging_product: "whatsapp",
  to: userPhoneNumber,
  type: "interactive",
  interactive: {
    type: "button",
    body: {
      text: "Você gosta deste produto?" // ou resposta do template
    },
    action: {
      buttons: [
        {
          type: "reply",
          reply: {
            id: "buy_now",
            title: "Quero comprar"
          }
        },
        {
          type: "reply",
          reply: {
            id: "say_no",
            title: "Não obrigado"
          }
        }
      ]
    }
  }
};
```

**Validação**:
```
1. Enviar mensagem com button
2. Ver no WhatsApp: deve mostrar 2 botões
3. Clicar em "Quero comprar"
4. Backend recebe:
   - message.type = "button"
   - button.payload = "buy_now"
```

**Referência**: https://developers.facebook.com/docs/whatsapp/cloud-api/messages/interactive-messages

---

### 4️⃣ IMPLEMENTAR NOTIFICAÇÕES PUSH ⏱️ 2-3 horas

**Objetivo**: Browser notifica quando lead clica "Quero comprar"

**Passo 1: Service Worker + Manifest**

Criar `public/sw.js`:
```javascript
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification('LeadFlow', {
    body: `Novo lead pronto! ${data.phone}`,
    icon: '/logo.png',
    badge: '/badge.png',
    tag: 'leadflow-notification'
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        if (windowClients[i].url === '/') {
          return windowClients[i].focus();
        }
      }
      return clients.openWindow('/');
    })
  );
});
```

**Passo 2: Frontend - Registrar service worker**

Em `src/main.tsx` ou novo hook `useNotifications.ts`:
```typescript
export function useNotifications() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registered'))
        .catch(err => console.error('SW error', err));
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Browser não suporta notificações');
      return;
    }

    if (Notification.permission === 'granted') {
      return;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notificações habilitadas');
      }
    }
  };

  return { requestPermission };
}
```

**Passo 3: Backend - Enviar notificação**

Em `backend/src/routes/leads.ts`:
```typescript
// Quando lead clica "Quero comprar"
const pushMessage = JSON.stringify({
  phone: qualifier.contact_name,
  category: lead.category,
  timestamp: new Date().toISOString()
});

// Broadcast para todos os clientes (via Supabase Realtime)
await supabase
  .from('qualified_leads')
  .on('INSERT', { event: 'INSERT' }, (payload) => {
    // Frontend listener
  })
  .subscribe();
```

**Teste**:
```
1. Abrir LeadFlow em 2 abas
2. Em uma aba: enviar "Quero comprar"
3. Na outra aba: deve aparecer notificação push
4. Clicar em notificação: volta para /leads
```

---

### 5️⃣ CRIAR TESTE END-TO-END COM CLIENTE REAL ⏱️ 1-2 horas

**Setup**: 
```
1. Criar número de teste para receber mensagens
   Opção 1: Meta Test Account
   Opção 2: Telegram para testar webhook
   Opção 3: Simulador + registrar video

2. Configurar webhook em Production
   Meta Dashboard → Webhook Settings
   URL: https://seu-backend.railway.app/webhook/whatsapp

3. Validar token
   GET /webhook/whatsapp?hub.mode=subscribe&hub.challenge=...
   → deve retornar hub.challenge

4. Testar flow completo:
```

**Fluxo de teste**:
```
Usuário (WhatsApp)     →  Servidor (LeadFlow)  →  Admin UI
─────────────────────────────────────────────────────────
"Quanto custa?"
                       ←  Classifica: Preço
                       ←  Gera resposta
                       ←  Envia button
                                              → Toast notificação
"Quero comprar" (clica) →  Recebe clique
                       ←  Marca like qualified
                                              → Lead aparece em fila
                                              + Notificação push
```

**Verificações**:
- [ ] Mensagem chega no backend
- [ ] Classificação correta
- [ ] Resposta segue template
- [ ] Button renderiza no WhatsApp
- [ ] Clique é registrado
- [ ] Lead aparece na fila
- [ ] Log criado com toda informação
- [ ] Timestamp correto
- [ ] User isolation funciona (RLS)

---

## 📋 AÇÕES SEMANA 1 (Sprint 1)

### Dia 1: Deploy + Validação
```
AM (2-3h):
  ✅ Deploy Railway
  ⚠️ Validar credenciais WhatsApp
  ⚠️ Teste webhook simples

PM (2-3h):
  ⚠️ Corrigir button format
  ⚠️ Teste end-to-end com simulador
  📊 Registrar resultados
```

### Dia 2-3: Notificações + Testes
```
  ✅ Implementar push notifications
  ✅ Service worker setup
  ⚠️ Teste com cliente real (se disponível)
  🧪 Testes unitários basics
```

### Dia 4-5: Feedback + Ajustes
```
  📊 Coletar feedback
  🔧 Corrigir bugs encontrados
  📈 Melhorar classificador
  📝 Documentar issues
```

---

## 🎨 AÇÕES SEMANA 2 (Sprint 2)

### Animações e Polish
```
Time: 4-6h
Priority: Medium (não bloqueia MVP)

Implementar (Framer Motion):
1. Entrada de mensagem (slide-up)
2. Typing indicator pulsante
3. Button pulso leve
4. Toast reordenação
5. Skeleton shimmer for loading

Biblioteca: framer-motion
```

**Exemplo**:
```tsx
import { motion } from "framer-motion";

export function ChatMessage({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {message}
    </motion.div>
  );
}

export function BuyButton() {
  return (
    <motion.button
      animate={{ scale: [1, 1.06, 1] }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        repeatDelay: 6,
        ease: "easeInOut"
      }}
    >
      Quero comprar
    </motion.button>
  );
}
```

### Dashboard Analítico
```
Time: 6-8h
Priority: Medium (nice-to-have)

Implementar:
1. Gráfico de interações (últimos 7 dias)
2. Taxa de clique "Quero comprar" (%)
3. Conversão clique → venda (%)
4. Distribuição por categoria
5. Tendência de volume

Biblioteca: recharts ou chart.js
```

---

## 🔍 AÇÕES SEMANA 3 (Sprint 3)

### Melhorias no Classificador
```
Time: 6-8h
Priority: Medium

Opção 1: Modelo ML leve (fastText)
- Treinar com exemplos reais
- Melhor que apenas regex
- Rápido (<10ms)

Opção 2: Embeddings (OpenAI)
- Mais contexto
- Mais caro ($)
- Deixar para Fase 2

Opção 3: Feedback loop
- Usuário marca classificação errada
- Sistema aprende
- Menos invasivo
- Gradual
```

### Multi-canal (Início)
```
Time: 8-12h
Priority: Low (Fase 2)

Setup inicial para Instagram:
1. Criar rota /webhook/instagram
2. Parsear payload diferente
3. Rouear para classificador mesmo
4. Responder no canal correto
5. Testar com Facebook Messenger API
```

---

## 🐛 BUGS CONHECIDOS + FIXES

### Bug #1: RLS não isolando dados entre usuários
**Status**: 🔴 CRÍTICO

**Problema**: Usuário A vê dados de Usuário B  
**Fix**:
```sql
-- Verificar política RLS
SELECT * FROM pg_policies WHERE tablename = 'interaction_logs';

-- Recriar se necessário
CREATE POLICY "Users see own logs"
  ON public.interaction_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

**Tempo**: 15 min

---

### Bug #2: Classificação não funciona com acentos
**Status**: 🟡 MÉDIO

**Problema**: "preço" vs "preco" causa miss  
**Fix**: Já implementado em `classification-engine.ts`
```typescript
const normalized = message
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');
```

**Teste**: "Qual é o preço?" → deve funcionar

**Tempo**: Já feito ✅

---

### Bug #3: Rate limiting muito agressivo
**Status**: 🟡 MÉDIO

**Problema**: 1 msg/60s é muito restritivo  
**Fix**: Fazer configurável por tier de usuário

```env
# Desenvolvimento
RATE_LIMIT_WINDOW=5
RATE_LIMIT_MAX_REQUESTS=10

# Produção
RATE_LIMIT_WINDOW=60
RATE_LIMIT_MAX_REQUESTS=1

# Premium (depois)
RATE_LIMIT_WINDOW=30
RATE_LIMIT_MAX_REQUESTS=5
```

**Tempo**: 30 min

---

## 🧪 TESTES A IMPLEMENTAR

### Frontend (Vitest)
```
Target: 60% coverage
Time: 6-8h

Tests:
1. ChatSimulator.tsx - envio de mensagem
2. LeadQueue.tsx - filtro de leads
3. Templates.tsx - edição de template
4. classifyMessage() - classificação
5. buildResponse() - construção de resposta
```

**Setup**:
```bash
npm install -D vitest @testing-library/react @testing-library/react-hooks
```

**Exemplo**:
```typescript
import { describe, it, expect } from 'vitest';
import { classifyMessage } from '@/lib/classification-engine';

describe('Classification', () => {
  it('classifies price questions', () => {
    const result = classifyMessage('Quanto custa?');
    expect(result.category).toBe('Preço');
    expect(result.matched).toBe(true);
  });

  it('returns null for unknown', () => {
    const result = classifyMessage('xyz abc');
    expect(result.category).toBeNull();
  });
});
```

### Backend (Jest)
```
Target: 70% coverage
Time: 6-8h

Tests:
1. Rate limiter middleware
2. Webhook verification
3. Message classification
4. Template building
5. Lead creation flow
```

---

## 📊 MÉTRICAS DE SUCESSO

### Semana 1
```
✅ Deploy production: feito
✅ Webhook real: testado
✅ Button format: funcional
✅ End-to-end: validado
🎯 Meta semana 1: 0% downtime, 100% acertos
```

### Semana 2
```
✅ Notificações push: ativas
✅ Validação com 3+ clientes
✅ Taxa conversão: >50%
✅ Atendimentos manuais: <5/dia
🎯 Meta semana 2: Aprovar MVP
```

### Semana 3
```
✅ Dashboard: online
✅ Animações: polish completo
✅ Classificador: melhorado
✅ Zero bugs críticos
🎯 Meta semana 3: Pronto para escala
```

---

## 🚀 CHECKLIST FINAL PRÉ-PRODUÇÃO

### Funcionalidades
- [ ] Webhook real funcionando
- [ ] Button format correto
- [ ] Notificações push
- [ ] End-to-end validado
- [ ] Rate limiting funcional
- [ ] Debounce ativo
- [ ] RLS isolando usuários
- [ ] Logs completos

### Infraestrutura
- [ ] Backend em Railway
- [ ] Database com backups
- [ ] Redis conectado
- [ ] Health checks passando
- [ ] HTTPS (Railway auto)
- [ ] Logs centralizados
- [ ] Monitoring ativo

### Segurança
- [ ] HMAC verification
- [ ] CORS correto
- [ ] Helmet headers
- [ ] Tokens rotados
- [ ] Environment vars seguras
- [ ] RLS policies testadas
- [ ] LGPD notice adicionado

### Performance
- [ ] Classificação <5ms
- [ ] Webhook <1s
- [ ] Response <2s
- [ ] Memory under 256MB
- [ ] Throughput >100msgs/min

### Testes
- [ ] Testes unitários 60%+
- [ ] End-to-end com cliente real
- [ ] Load testing (100+ msgs)
- [ ] Erro handling validado
- [ ] Edge cases cobertos

### Documentação
- [ ] README atualizado
- [ ] API docs completos
- [ ] Setup guide para novo dev
- [ ] Troubleshooting guide
- [ ] Runbook de produção

---

## 💰 ESTIMATIVA DE ESFORÇO

| Tarefa | Esforço | Priority | Status |
|--------|---------|----------|--------|
| Deploy Railway | 0.5h | 🔴 | ⏳ Today |
| WhatsApp real | 2h | 🔴 | ⏳ Today |
| Fix buttons | 0.5h | 🔴 | ⏳ Today |
| Push notifications | 3h | 🔴 | ⏳ Today |
| E2E testing | 2h | 🔴 | ⏳ Today |
| Framer animations | 6h | 🟡 | Week 2 |
| Dashboard | 8h | 🟡 | Week 2 |
| ML classifier | 8h | 🟡 | Week 3 |
| Testes | 12h | 🟡 | Week 1-2 |
| Polish/bugs | 8h | 🟡 | Week 3 |
| **TOTAL** | **~50h** | | |

---

## 🎓 Risco Assessment

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| WhatsApp rate limits | 40% | 🔴 | Adicionar backoff/retry |
| Database performance | 20% | 🟡 | Índices, query optimization |
| Notification flakiness | 30% | 🟡 | Fallback para in-app |
| False positives classificação | 60% | 🟡 | Feedback loop, ML |
| Escalabilidade | 25% | 🟡 | Auto-scale Railway |

---

## 🎯 PRÓXIMO PASSO

**Começar por**: Deploy + WhatsApp Real Validation (30-60 min)

Quer que eu detalhe alguma ação específica?
