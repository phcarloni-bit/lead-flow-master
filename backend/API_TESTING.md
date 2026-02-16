# 🧪 API Testing Guide - WhatsApp Webhooks

Complete guia de testes para validar integração WhatsApp no LeadFlow backend.

---

## 📋 Índice

1. [Health Check](#health-check)
2. [Webhook Verification](#webhook-verification)
3. [Enviar Mensagens Teste](#enviar-mensagens-teste)
4. [Testar Button Clicks](#testar-button-clicks)
5. [Validar Logs](#validar-logs)
6. [Postman Collection](#postman-collection)

---

## Health Check

### Endpoint
```
GET /health
```

### Request
```bash
curl -X GET "http://localhost:3000/health" \
  -H "Content-Type: application/json"
```

### Response esperada
```json
{
  "status": "healthy",
  "uptime": 45.2,
  "timestamp": "2026-02-15T10:30:00Z",
  "services": {
    "redis": "connected",
    "supabase": "connected",
    "nodejs": "v20.10.0"
  }
}
```

---

## Webhook Verification

### GET /webhooks/whatsapp (Meta verification)

When Meta registers webhook, sends GET with query params:

```bash
curl -X GET "http://localhost:3000/webhooks/whatsapp" \
  -G \
  -d "hub.mode=subscribe" \
  -d "hub.challenge=test_challenge_123" \
  -d "hub.verify_token=my_random_token_123"
```

### Expected Response
```
test_challenge_123
```

**Status**: 200 OK (server echoes back the challenge)

---

## Enviar Mensagens Teste

### 1️⃣ Mensagem de Texto Simples

```bash
curl -X POST "https://graph.instagram.com/v18.0/PHONE_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "5511999999999",
    "type": "text",
    "text": {
      "body": "Qual é o preço do produto?"
    }
  }'
```

**Variáveis a substituir:**
- `PHONE_ID`: Seu phone number ID (ex: 102123456789000)
- `ACCESS_TOKEN`: Seu token permanente (ex: EABa1234...)
- `5511999999999`: Seu número WhatsApp (código país + DDD + número, sem +)

**Response esperada:**
```json
{
  "messages": [
    {
      "id": "wamid.HBEUGVFQaFBBSlpxjLqIqVNRWt8"
    }
  ]
}
```

---

### 2️⃣ Mensagem com Botão "Quero Comprar"

```bash
curl -X POST "https://graph.instagram.com/v18.0/PHONE_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "5511999999999",
    "type": "interactive",
    "interactive": {
      "type": "button",
      "body": {
        "text": "O valor do nosso produto é R$ 99,90. Temos condições especiais! 💰"
      },
      "action": {
        "buttons": [
          {
            "type": "reply",
            "reply": {
              "id": "buy_now",
              "title": "Quero comprar! 🛒"
            }
          }
        ]
      }
    }
  }'
```

**Bot deve enviar isso automaticamente após classificar mensagem**

---

### 3️⃣ Mensagem com Link

```bash
curl -X POST "https://graph.instagram.com/v18.0/PHONE_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "5511999999999",
    "type": "text",
    "text": {
      "body": "Consulte o catálogo: https://seu-loja.com"
    }
  }'
```

---

### 4️⃣ Mensagem com Imagem

```bash
curl -X POST "https://graph.instagram.com/v18.0/PHONE_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "5511999999999",
    "type": "image",
    "image": {
      "link": "https://seu-site.com/produto.jpg"
    }
  }'
```

---

## Testar Button Clicks

### POST /webhooks/whatsapp (Button reply)

Quando usuário clica no botão "Quero comprar!", Meta envia:

```bash
curl -X POST "http://localhost:3000/webhooks/whatsapp" \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=abc123..." \
  -d '{
    "entry": [
      {
        "id": "123456789",
        "changes": [
          {
            "value": {
              "messaging_product": "whatsapp",
              "metadata": {
                "display_phone_number": "5511988770000",
                "phone_number_id": "102123456789000"
              },
              "messages": [
                {
                  "from": "5511999999999",
                  "id": "wamid.xxx",
                  "timestamp": "1676385619",
                  "type": "button",
                  "button": {
                    "payload": "buy_now",
                    "text": "Quero comprar! 🛒"
                  }
                }
              ],
              "contacts": [
                {
                  "profile": {
                    "name": "João Silva"
                  },
                  "wa_id": "5511999999999"
                }
              ]
            },
            "field": "messages"
          }
        ]
      }
    ]
  }'
```

**Backend deve:**
1. ✅ Verificar assinatura HMAC
2. ✅ Extrair button payload (`buy_now`)
3. ✅ Criar novo lead em `qualified_leads`
4. ✅ Logar em `interaction_logs` com `clicked_buy = true`
5. ✅ Retornar 200 OK

---

## Validar Logs

### Verificar no Supabase

1. Abrir Supabase Dashboard
2. Database → `interaction_logs`

**Coluna esperadas:**
```
| id | contact_name | message_received | category_assigned | response_sent | clicked_buy | created_at |
|----|-------------|------------------|-------------------|---------------|------------|----------|
| 1  | 5511999999999 | "Qual é o preço?" | "Preço" | "O valor é..." | false | ... |
| 2  | 5511999999999 | "Quero comprar!" | "Compra" | "Lead criado" | true | ... |
```

### Verificar Qualified Leads

Database → `qualified_leads`

```
| id | contact_phone | contact_name | status | source | created_at |
|----|---------------|-------------|--------|--------|----------|
| 1  | 5511999999999 | João Silva | "waiting" | "whatsapp_button" | ... |
```

---

## Postman Collection

### Importar no Postman

1. File → Import
2. Copy-paste este JSON

```json
{
  "info": {
    "name": "LeadFlow Backend",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "🏥 Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/health",
          "host": ["{{base_url}}"],
          "path": ["health"]
        }
      }
    },
    {
      "name": "🔗 Webhook Verification",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=test_challenge_123&hub.verify_token={{verify_token}}",
          "host": ["{{base_url}}"],
          "path": ["webhooks", "whatsapp"],
          "query": [
            {
              "key": "hub.mode",
              "value": "subscribe"
            },
            {
              "key": "hub.challenge",
              "value": "test_challenge_123"
            },
            {
              "key": "hub.verify_token",
              "value": "{{verify_token}}"
            }
          ]
        }
      }
    },
    {
      "name": "📱 Send Text Message",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{whatsapp_token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"messaging_product\":\"whatsapp\",\"to\":\"{{phone_number}}\",\"type\":\"text\",\"text\":{\"body\":\"Qual é o preço?\"}}"
        },
        "url": {
          "raw": "https://graph.instagram.com/v18.0/{{phone_id}}/messages",
          "protocol": "https",
          "host": ["graph.instagram.com"],
          "path": ["v18.0", "{{phone_id}}", "messages"]
        }
      }
    },
    {
      "name": "🛒 Send Message with Button",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{whatsapp_token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"messaging_product\":\"whatsapp\",\"to\":\"{{phone_number}}\",\"type\":\"interactive\",\"interactive\":{\"type\":\"button\",\"body\":{\"text\":\"O valor do nosso produto é R$ 99,90. Temos condições especiais! 💰\"},\"action\":{\"buttons\":[{\"type\":\"reply\",\"reply\":{\"id\":\"buy_now\",\"title\":\"Quero comprar! 🛒\"}}]}}}"
        },
        "url": {
          "raw": "https://graph.instagram.com/v18.0/{{phone_id}}/messages",
          "protocol": "https",
          "host": ["graph.instagram.com"],
          "path": ["v18.0", "{{phone_id}}", "messages"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000"
    },
    {
      "key": "whatsapp_token",
      "value": "YOUR_ACCESS_TOKEN_HERE"
    },
    {
      "key": "phone_id",
      "value": "YOUR_PHONE_ID_HERE"
    },
    {
      "key": "phone_number",
      "value": "5511999999999"
    },
    {
      "key": "verify_token",
      "value": "my_random_token_123"
    }
  ]
}
```

### Usar Collection

1. Em Postman → Collections → LeadFlow Backend
2. Click em "Variables" tab
3. Preencher:
   - `base_url`: http://localhost:3000 (local) ou sua URL produção
   - `whatsapp_token`: seu ACCESS_TOKEN
   - `phone_id`: seu PHONE_ID
   - `phone_number`: seu número WhatsApp
   - `verify_token`: seu WEBHOOK_VERIFY_TOKEN

---

## Scripts Automáticos

### Testar Tudo de Uma Vez

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
PHONE_ID="102123456789000"
TOKEN="EABa1234..."
PHONE="5511999999999"
VERIFY_TOKEN="my_random_token_123"

echo "1️⃣ Testing Health Check..."
curl -X GET "$BASE_URL/health"

echo -e "\n\n2️⃣ Testing Webhook Verification..."
curl -X GET "$BASE_URL/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=$VERIFY_TOKEN"

echo -e "\n\n3️⃣ Sending Test Message..."
curl -X POST "https://graph.instagram.com/v18.0/$PHONE_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"messaging_product\":\"whatsapp\",
    \"to\":\"$PHONE\",
    \"type\":\"text\",
    \"text\":{\"body\":\"Teste automático\"}
  }"

echo -e "\n✅ All tests completed!"
```

Salvar como `test-api.sh` e executar:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 🔄 Request Flow Diagram

```
Cliente WhatsApp                Meta API                   LeadFlow Backend
     │                           │                              │
     ├─ Envia mensagem ────────▶ │                              │
     │                           ├─ POST webhook ─────────────▶ │
     │                           │                 {"body":...} │
     │                           │ ◀─ 200 OK ───────────────────┤
     │                           │                              │
     │                           │ ◀─ POST /messages ───────────┤
     │ ◀─ Recebe resposta ────── ┤ (resposta automática)       │
     │                           │                              │
```

---

## ✅ Checklist de Testes

```
🔷 Ambiente
- [ ] Backend rodando em localhost:3000
- [ ] ngrok expondo corretamente
- [ ] .env preenchido com credenciais reais

🔷 Backend
- [ ] GET /health retorna 200
- [ ] GET /webhooks/whatsapp?hub.challenge=xxx retorna challenge
- [ ] POST /webhooks/whatsapp ativa sem erros de signature

🔷 Meta API
- [ ] curl com texto simples envia OK
- [ ] curl com botão envia OK
- [ ] resposta chega em seu WhatsApp

🔷 Supabase
- [ ] interaction_logs recebe novo registro
- [ ] qualified_leads criado ao clicar button
- [ ] timestamp correto (UTC+0)

🔷 Integração E2E
- [ ] Mensagem → Classificação → Response → Button → Lead
```

---

**Última atualização**: Feb 15, 2026
