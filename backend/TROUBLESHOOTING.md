# 🔧 Troubleshooting Guide - WebHook Issues

Soluções práticas para problemas comuns na integração WhatsApp.

---

## 📋 Common Issues & Solutions

### 1. Invalid Signature / Webhook Verification Failed

#### Problema
```
❌ Error: Invalid webhook signature
❌ Signature verification failed
```

#### Causas Possíveis
- `WHATSAPP_APP_SECRET` incorreto
- Body foi modificado durante transmissão
- URL não está registrada corretamente no Meta Manager

#### Solução
```bash
# 1. Verificar no Meta Manager
#    App Dashboard → Settings → Basic → App Secret
#    Copiar exatamente como está (sem espaços)

# 2. Atualizar .env
echo "WHATSAPP_APP_SECRET=abc123def456..." >> backend/.env

# 3. Reiniciar backend
cd backend
bun run dev

# 4. Testar verificação
curl -X GET "http://localhost:3000/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=test&hub.verify_token=MY_TOKEN"
# Deve retornar: test
```

---

### 2. Webhook Verification Not Responding

#### Problema
```
❌ Meta Manager: "Webhook verification failed"
❌ URL returned invalid response
```

#### Causas Possíveis
- Backend NÃO está rodando
- ngrok parou
- URL errada em Meta Manager
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN` não bate

#### Solução

**Step 1: Verificar Backend**
```bash
# Terminal 1
cd backend
bun run dev
# Deve aparecer: LeadFlow Backend Server Running
```

**Step 2: Verificar ngrok (se local)**
```bash
# Terminal 2
ngrok http 3000
# Copiar URL HTTPS de "Forwarding"
```

**Step 3: Testar URL**
```bash
# Terminal 3
curl -i https://seu-ngrok-url/webhooks/whatsapp
# Deve retornar 400 (missing query params) não 404 ou 502
```

**Step 4: Revalidar em Meta Manager**
1. Settings → Webhooks
2. Callback URL: cole a URL HTTPS de forma exata
3. Verify Token: deve ser IDÊNTICO a `.env`
4. Click "Verify and Save"

---

### 3. No Store Config Found for Phone_ID

#### Problema
```json
{
  "error": "No store config found for phone_id: 102..."
}
```

#### Causa
Backend encontrou uma mensagem mas não consegue encontrar a configuração da loja no `store_config`

#### Solução

**A. Verificar Supabase**
```sql
-- No Supabase SQL Editor
SELECT * FROM store_config;
```

Se vazio, **inserir manualmente**:
```sql
INSERT INTO store_config (
  user_id,
  store_name,
  phone_id,
  access_token,
  webhook_verify_token,
  default_price,
  colors_available,
  product_link
) VALUES (
  'user-uuid-aqui',
  'Minha Loja',
  '102123456789000',
  'seu-token',
  'verify-token',
  '99.90',
  'Verde,Azul,Vermelho',
  'https://seu-site.com'
);
```

**B. Ou fazer via Frontend**
1. App → Settings (ícone engrenagem)
2. Seção "WhatsApp Integration"
3. Preencher todos os campos:
   - Phone ID
   - Store Name
   - Default Price
   - Colors Available
   - Product Link
4. Click Save

---

### 4. Rate Limit Exceeded

#### Problema
```
❌ Too many requests from this number
❌ Please wait 60 seconds before sending another message
```

#### Causa
Apenas 1 resposta por minuto por número (proteção contra spam)

#### Solução

**Opção A: Aguardar 60 segundos**
```bash
# Aguarde 1 minuto e tente novamente
sleep 60
```

**Opção B: Usar número diferente**
```bash
# Testar com outro número WhatsApp
curl -X POST "..." \
  -d '{"to":"551198887766",...}'
```

**Opção C: Desativar Rate Limiting (desenvolvimento)**
```env
# backend/.env
ENABLE_RATE_LIMITING=false
```

**Opção D: Redis não respondendo**
```
⚠️ Redis connection failed, rate limiting disabled
```
Se ver isso, instalar redis ou ajustar `REDIS_URL`

---

### 5. Messages Not Being Received/Processed

#### Problema
```
Nenhuma mensagem chega no backend
Supabase não cria interaction_logs
```

#### Causas Possíveis
1. Webhook não está verificado em Meta ("Webhook verification failed")
2. Subscription para `messages` não está ativa
3. ngrok expirou ou parou
4. Firewall bloqueando conexão

#### Solução - Verificar em Ordem

**Step 1: Webhook Verificado?**
```bash
# Meta Manager → WhatsApp Configuration
# Badge ao lado de Callback URL deve estar VERDE ✅
```

**Step 2: Subscriptions Ativas?**
```
Meta Manager → Webhooks
Em "Subscribe to fields":
  ✅ messages
  ✅ message_template_status_update
```

**Step 3: ngrok ainda rodando?**
```bash
# Verificar Terminal 2
ngrok http 3000
# Se parou, reiniciar

# Se URL mudou, atualizar em Meta Manager
```

**Step 4: Firewall?**
```bash
# Windows Defender pode bloquear
# Abrir Windows Defender → Firewall
# Allow ngrok.exe ou seu app
```

**Step 5: Debug Logs**
```bash
# No backend, ver qual função está sendo chamada
NODE_ENV=development LOG_LEVEL=debug npm run dev

# Deve aparecer:
# [DEBUG] Webhook event received
# [DEBUG] HMAC signature: abc...
# [DEBUG] Signature valid
```

---

### 6. Response Not Sending Back to WhatsApp

#### Problema
```
✅ Mensagem chega no backend
✅ Classificação funciona
❌ Resposta não aparece no WhatsApp
```

#### Causas Possíveis
- Token expirado ou sem permissão
- Número incorreto no `to` field
- API quota atingida (limite de mensagens/dia)

#### Solução

**Step 1: Verificar Token**
```bash
# Testar se token é válido
curl -X GET "https://graph.instagram.com/me?access_token=YOUR_TOKEN"

# Deve retornar:
# {"name":"LeadFlow Bot","id":"xxx"}
```

**Step 2: Verificar Permissões**
```
Meta Business Platform → Users → [seu system user]
Roles deve ter:
  ✅ whatsapp_business_messaging
  ✅ whatsapp_business_management
```

**Step 3: Gerar Novo Token**
```
Se token expirou:
1. Meta Business Platform → Users
2. Click no seu system user
3. Generate new token
4. Copiar em WHATSAPP_ACCESS_TOKEN
5. Reiniciar backend
```

**Step 4: Verificar Quota**
```
Meta Manager → API Setup → Usage
Ver se atingiu limite de mensagens
```

---

### 7. Button Click Not Creating Lead

#### Problema
```
✅ Usuário clica no botão "Quero comprar!"
✅ Logs aparecem no backend
❌ Nenhum novo lead em qualified_leads
```

#### Solução

**Step 1: Verificar Botão foi enviado**
```sql
-- Supabase SQL
SELECT * FROM interaction_logs 
WHERE message_received LIKE '%button%' 
ORDER BY created_at DESC LIMIT 1;
```

**Step 2: Verificar payload**
Backend deve receber tipo "button" não "text"

```typescript
// Em whatsappController.ts
console.log(message.button);  // Deve ter: {text, payload}
```

**Step 3: Verificar qualified_leads insert**
```sql
SELECT * FROM qualified_leads 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

**Step 4: Se vazio, verificar erro**
```bash
# No backend terminal, procurar por ERRORs
# Se vir "failed to create qualified lead"
# Verificar permissões Supabase RLS
```

**Step 5: RLS Policy**
```sql
-- Supabase → Authentication → Policies
-- qualified_leads table deve ter:
-- ✅ INSERT policy para users
-- ✅ SELECT policy para users
```

---

### 8. Template Not Being Applied

#### Problema
```
Mensagem recebida, classificada
Mas resposta padrão não vem (ou vem vazia)
```

#### Solução

**Step 1: Verificar Templates no Supabase**
```sql
SELECT * FROM templates
WHERE category IN ('Preço', 'Cores', 'Tamanhos', 'Frete');
```

Se vazio, usar default:
```bash
# Backend tem templates padrão caso DB vazio
```

**Step 2: Verificar Classificação**
```sql
SELECT * FROM interaction_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Ver coluna "category_assigned"
-- Deve matchear com templates
```

**Step 3: Se category não bate**
```sql
-- Adicionar novo template
INSERT INTO templates (
  category,
  template_text,
  user_id
) VALUES (
  'Sua Categoria',
  'Resposta aqui',
  'user-uuid'
);
```

---

### 9. "Invalid JSON in Request Body"

#### Problema
```
❌ Webhook error: Invalid JSON in request body
```

#### Causa
JSON mal formado sendo enviado para webhook

#### Solução

**Validar JSON antes de enviar**
```bash
# Usar jq para validar
echo '{"key":"value"}' | jq .
# Se retornar JSON, está válido

# Se error, corrigir quotes
```

**Common JSON errors:**
```javascript
// ❌ ERRADO - single quotes
{"text": 'hello'}

// ✅ CERTO - double quotes
{"text": "hello"}

// ❌ ERRADO - comentários
{"text": "hello"} // comentário

// ✅ CERTO - sem comentários
{"text": "hello"}
```

---

### 10. HMAC Signature Mismatch When Testing

#### Problema
```
❌ Signature verification failed
❌ HMAC mismatch
```

Ao testar webhook com curl, a assinatura pode estar errada porque:
- Corpo não foi exatamente como enviado
- App Secret incorreto

#### Solução - Gerar Signature Correta

```bash
#!/bin/bash

BODY='{"entry":[{"value":"test"}]}'
SECRET="seu_app_secret"

# Calcular HMAC-SHA256
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -hex | tr -d "'")

# Enviar com header correto
curl -X POST "http://localhost:3000/webhooks/whatsapp" \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=$SIGNATURE" \
  -d "$BODY"
```

---

## 🔍 Debug Mode

### Habilitar Logs Detalhados

```bash
# backend/.env
LOG_LEVEL=debug
NODE_ENV=development
```

```bash
# Terminal
npm run dev
```

Deve exibir:
```
[DEBUG] Webhook received
[DEBUG] Payload size: 1234 bytes
[DEBUG] HMAC: sha256=abc...
[DEBUG] Classification: Preço
[DEBUG] Template found: "O valor é..."
[DEBUG] Response sent back
```

---

## 🆘 Emergency Checklist

Quando nada funciona, seguir nesta ordem:

```
1. [ ] Backend está rodando? (npm run dev)
   └─ Se não: cd backend && npm run dev

2. [ ] ngrok está rodando? (ngrok http 3000)
   └─ Se não: ngrok http 3000

3. [ ] URL no Meta Manager está certa?
   └─ Se não: Copiar URL HTTPS de ngrok

4. [ ] Webhook está verificado (✅ badge verde)?
   └─ Se não: Click em "Verify and Save"

5. [ ] .env preenchido?
   └─ Se não: Copiar arquivo exemplo e preencher

6. [ ] Reduzir para teste minimal:
   └─ Remover Redis, Rate limiting, DB queries
   └─ Só retornar 200 OK
   └─ Incrementar complexidade gradualmente
```

---

## 📞 Resources

- [Meta WhatsApp API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Webhook Reference](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components)
- [Error Codes](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/phone-numbers/request-code)

---

**Última atualização**: Feb 15, 2026
