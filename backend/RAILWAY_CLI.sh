#!/usr/bin/env bash

# ============================================================
# 🚀 Railway CLI Commands - Quick Reference
# ============================================================
# Use estes comandos para gerenciar seu deploy no Railway

# ============================================================
# 1️⃣ SETUP INICIAL
# ============================================================

# Instalar Railway CLI
npm install -g @railway/cli

# Login no Railway
railway login

# Ver projetos
railway list

# ============================================================
# 2️⃣ DEPLOY
# ============================================================

# Deploy branch atual
railway deploy

# Deploy com mensagem
railway deploy --message "Create rate limiting and deploy"

# Link com projeto existente
railway link

# ============================================================
# 3️⃣ VARIÁVEIS DE AMBIENTE
# ============================================================

# Ver variáveis
railway variables

# Adicionar variável
railway variables set RATE_LIMIT_WINDOW=60

# Remover variável
railway variables delete RATE_LIMIT_WINDOW

# Exportar para .env local
railway variables export > .env.local

# ============================================================
# 4️⃣ LOGS
# ============================================================

# Ver logs em tempo real
railway logs

# Últimos 100 linhas
railway logs -n 100

# Follow logs
railway logs -f

# Logs do serviço específico
railway logs -s backend

# ============================================================
# 5️⃣ MONITORAMENTO
# ============================================================

# Ver status do serviço
railway status

# Ver métricas
railway metrics

# Health check
curl https://seu-url.railway.app/health

# Stats endpoint
curl https://seu-url.railway.app/health/stats

# ============================================================
# 6️⃣ GERENCIAMENTO
# ============================================================

# Redeploar
railway redeploy

# Cancel deploy atual
railway deploy --cancel

# Remove serviço
railway services:remove

# ============================================================
# 7️⃣ TROUBLESHOOTING
# ============================================================

# Debug mode
railway logs --debug

# Ver configuração
railway config

# Ver plano
railway plan

# ============================================================
# 📝 EXEMPLOS COMPLETOS
# ============================================================

# --- Deploy e configurar ---
railway deploy
railway variables set NODE_ENV=production
railway variables set LOG_LEVEL=info
railway logs -f

# --- Setup variáveis automaticamente ---
railway variables set WHATSAPP_ACCESS_TOKEN=$WHATSAPP_TOKEN
railway variables set WHATSAPP_PHONE_ID=$PHONE_ID
railway variables set RATE_LIMIT_WINDOW=60
railway variables set ENABLE_RATE_LIMITING=true
railway variables set ENABLE_DEBOUNCE=true

# --- Backup de variáveis ---
railway variables export > railway-vars-backup.env

# --- Monitorar em produção ---
watch -n 5 railway logs

# ============================================================
# 🔧 ADVANCED
# ============================================================

# Executar comando no Railway
railway run npm test

# SSH into container (se disponível)
railway shell

# Ver environments
railway env list

# Switch environment
railway env switch

# ============================================================
# 📱 WEBHOOK TESTING
# ============================================================

# Testar webhook verification
RAILWAY_URL=$(railway domains | grep https)
curl -X GET "${RAILWAY_URL}/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=test&hub.verify_token=TOKEN"

# Testar health
curl https://seu-url.railway.app/health
curl https://seu-url.railway.app/health/stats

# Enviar teste mensagem
curl -X POST "https://seu-url.railway.app/webhooks/whatsapp" \
  -H "Content-Type: application/json" \
  -d '{"entry":[...]}'

# ============================================================
# 📊 MONITORAMENTO CONTÍNUO
# ============================================================

# Criar alert de erro
railway alert create --service backend --condition "error > 5 in 5m"

# Criar alert de CPU
railway alert create --service backend --condition "cpu > 80%"

# Ver alerts
railway alerts

# ============================================================
# 🗑️ CLEANUP
# ============================================================

# Remover projeto
railway projects:remove

# Remover banco de dados
railway services:remove redis

# Limpar cache
railway cache:clear

# ============================================================
# 💡 DICAS
# ============================================================

# Auto-complete
railway completion install

# Verbose output
railway -v deploy

# JSON output (para scripts)
railway domains --json
railway services --json

# ============================================================
# 🔗 ÚTIL LINKS
# ============================================================

# Documentação: https://docs.railway.app
# CLI Reference: https://docs.railway.app/cli/command-reference
# Environment: https://docs.railway.app/guides/variables
# Deployment: https://docs.railway.app/deploy

# ============================================================
# 📞 EMERGENCY COMMANDS
# ============================================================

# Se falhar deploy
railway redeploy --force

# Se precisa resetar
railway services:remove backend
railway deploy

  # Ver tudo
railway status --json | jq

# ============================================================
# 🟢 READY FOR PRODUCTION!
# ============================================================

# Execute estes comandos em ordem:
# 1. npm run build (local)
# 2. git push origin main (deploystrigger)
# 3. railway logs -f (watch deploy)
# 4. curl https://sua-url/health (verify)
# 5. railroad logs -f (monitor)

# ============================================================
