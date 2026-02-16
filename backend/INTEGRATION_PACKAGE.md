# 🎯 LeadFlow Backend - Complete Integration Package

**Status**: ✅ Backend 100% ready for WhatsApp integration
**Date**: February 15, 2026
**Version**: 1.0.0 MVP

---

## 📚 Documentation Overview

This package contains everything needed to integrate WhatsApp Cloud API with LeadFlow backend.

### 📖 Available Guides

1. **[SETUP_QUICK_START.md](./SETUP_QUICK_START.md)** ⭐ START HERE
   - 15-minute setup guide
   - Step-by-step credential configuration  
   - Quick testing checklist
   - Best for: Getting it working quickly

2. **[WHATSAPP_INTEGRATION.md](./WHATSAPP_INTEGRATION.md)** 📚 COMPREHENSIVE
   - Complete integration documentation
   - Meta Manager configuration
   - Webhook setup details
   - Production deployment guide
   - Best for: Understanding the full process

3. **[API_TESTING.md](./API_TESTING.md)** 🧪 TESTING
   - Detailed curl examples
   - Postman collection
   - Testing scripts
   - Request/response examples
   - Best for: Validating integration works

4. **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** 🔧 PROBLEMS
   - 10 common issues with solutions
   - Debug mode setup
   - Emergency checklist
   - Best for: When something breaks

5. **[README.md](./README.md)** 📋 PROJECT
   - Project structure overview
   - File descriptions
   - Architecture explanation
   - Best for: Understanding codebase

6. **[DEPLOY.md](./DEPLOY.md)** 🚀 PRODUCTION
   - Railway deployment
   - Render deployment
   - Docker setup
   - Environment variables
   - Best for: Going live

---

## 🚀 Quick Navigation

### I Just Want It Working (Next 15 min!)
1. Follow [SETUP_QUICK_START.md](./SETUP_QUICK_START.md)
2. Run commands exactly as shown
3. Test with [API_TESTING.md](./API_TESTING.md) curl examples
4. Done! 🎉

### I Want to Understand Everything (30-45 min)
1. Start with [README.md](./README.md) - architecture overview
2. Read [WHATSAPP_INTEGRATION.md](./WHATSAPP_INTEGRATION.md) - full technical details
3. Review [API_TESTING.md](./API_TESTING.md) - see all possible API calls
4. Skim [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - know where to look if issues

### Something is Broken (Help!)
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - find your error
2. Follow solution steps
3. Test with [API_TESTING.md](./API_TESTING.md) examples
4. If still stuck, check debug logs

### I'm Ready for Production
1. Follow [DEPLOY.md](./DEPLOY.md)
2. Configure environment in Railway/Render
3. Update webhook URL in Meta Manager
4. Run [API_TESTING.md](./API_TESTING.md) tests on production URL
5. Launch! 🚀

---

## ⚙️ What's Included

### Backend Code (11 files, ~800 LOC)
```
├── src/
│   ├── index.ts                      # Main Express app
│   ├── types/whatsapp.ts            # TypeScript interfaces
│   ├── utils/logger.ts              # Winston logging
│   ├── config/
│   │   ├── supabase.ts              # Supabase client
│   │   └── redis.ts                 # Redis client
│   ├── middleware/
│   │   ├── verifyWebhook.ts         # HMAC signature verification
│   │   ├── rateLimiter.ts           # Redis-based rate limiting
│   │   └── errorHandler.ts          # Express error handler
│   ├── routes/
│   │   └── webhooks.ts              # GET (verify) + POST (receive)
│   ├── controllers/
│   │   └── whatsappController.ts    # Message processing logic
│   └── services/
│       ├── whatsappService.ts       # Meta API calls
│       ├── classificationService.ts # ML classification
│       └── templateService.ts       # Response templates
├── jest.config.js                   # Test configuration
├── tsconfig.json                    # TypeScript config
├── package.json                     # Dependencies
└── Dockerfile                       # Container image
```

### Infrastructure
```
✅ Express.js server (v4.18)
✅ TypeScript compilation
✅ npm/bun package managers
✅ Jest testing framework
✅ Docker containerization
✅ Environment variable management
```

### Integrations
```
✅ WhatsApp Cloud API (Meta)
✅ Supabase PostgreSQL
✅ Redis (caching/rate limiting)
✅ Winston logging
✅ UUID generation
✅ Date/time utilities
```

---

## 🔐 Security Features

### ✅ Implemented
- HMAC-SHA256 webhook signature verification
- Rate limiting (1 response/min per phone)
- Environment variable isolation
- CORS configuration
- Helmet.js security headers
- Input validation for all endpoints

### 🔄 Configuration Ready
- JWT token authentication
- RLS policies in Supabase
- API key rotation mechanism
- Audit logging

---

## 📊 Data Flow

```
WhatsApp User
    ↓
sends message via WhatsApp app
    ↓
Meta Cloud API
    ↓
POST /webhooks/whatsapp (webhook event)
    ↓
Backend (Node.js)
    ├─ verifyWebhook middleware (HMAC check)
    ├─ rateLimiter middleware (rate check)
    ├─ whatsappController.handleWebhookEvent()
    │  ├─ Extract message text
    │  ├─ classificationService.classify()
    │  ├─ templateService.getTemplate()
    │  ├─ Log to interaction_logs table
    │  └─ Send response via Meta API
    └─ Return 200 OK
    ↓
Meta Cloud API
    ↓
sends message back to WhatsApp user
    ↓
User receives automated response with button
    ↓
User clicks "Quero comprar!" button
    ↓
webhook event (button payload = "buy_now")
    ↓
Backend creates lead in qualified_leads
    ↓
Frontend updates in real-time (Supabase subscription)
    ↓
Lead appears in "Conversas" section
```

---

## 🧪 Testing Coverage

### Unit Tests
- Classification engine (test/example.test.ts)
- Template formatting 
- Webhook signature verification

### Integration Tests
- End-to-end message flow
- Database insert/update operations
- Rate limiting logic

### Manual Tests
- Use [API_TESTING.md](./API_TESTING.md) curl commands
- Postman collection available
- Test scripts provided

---

## 📋 Checklist Before Launch

### Backend Setup
- [ ] `npm install` or `bun install` completed
- [ ] `.env` file created and filled
- [ ] `npm run build` shows no errors
- [ ] `npm run dev` server starts successfully

### Meta Manager Configuration  
- [ ] WhatsApp app created
- [ ] Phone ID obtained
- [ ] Access Token generated (System User)
- [ ] App Secret copied
- [ ] Webhook URL configured
- [ ] Verify Token set
- [ ] Webhooks verified (✅ green badge)
- [ ] Subscriptions activated (messages, template_status)

### Local Testing
- [ ] ngrok running (`ngrok http 3000`)
- [ ] Backend receives test messages
- [ ] Responses appear in WhatsApp
- [ ] Button clicks create leads
- [ ] Logs appear in interaction_logs table

### Production Ready
- [ ] Backend deployed (Railway/Render)
- [ ] Domain configured with HTTPS
- [ ] Webhook URL updated in Meta Manager
- [ ] Environment variables set in platform
- [ ] Database backups configured
- [ ] Monitoring alerts enabled

---

## 🚨 Common First Steps

### Terminal 1 - Start Backend
```bash
cd backend
npm install  # first time only
npm run dev
```

Expected output:
```
╔════════════════════════════════════════╗
║     LeadFlow Backend Server Running    ║
╚════════════════════════════════════════╝
```

### Terminal 2 - Expose to Internet
```bash
ngrok http 3000
# Copy HTTPS URL from "Forwarding"
```

### Terminal 3 - Configure & Test
```bash
# Go to Meta Manager
# Set Callback URL to ngrok HTTPS URL
# Click "Verify and Save"

# Then test:
curl http://localhost:3000/health
```

---

## 📖 File Reference

| File | Purpose | Start Reading |
|------|---------|---|
| SETUP_QUICK_START.md | 15-min setup | If you want quick start |
| WHATSAPP_INTEGRATION.md | Full details | If you want deep understanding |
| API_TESTING.md | Test examples | When testing webhook |
| TROUBLESHOOTING.md | Problem solving | When something breaks |
| README.md | Architecture | To understand code |
| DEPLOY.md | Production | When going live |

---

## 🎯 Success Criteria

You'll know it's working when:

✅ Backend starts without errors
```bash
npm run dev
# Shows: "LeadFlow Backend Server Running"
```

✅ Webhook verifies with Meta
```
Meta Manager: Callback URL status = ✅ Verified
```

✅ Test message sends from API
```bash
curl -X POST "https://graph.instagram.com/..." ...
# Returns: {"messages": [{"id": "wamid.xxx"}]}
```

✅ Webhook receives the message  
```
Backend logs: "📨 Processing message from 5511999999999"
```

✅ Response appears in WhatsApp
```
WhatsApp shows: "O valor é R$ 99,90... [Quero comprar! 🛒]"
```

✅ Lead created in database
```
Supabase qualified_leads table shows new row
```

✅ Lead visible in frontend
```
App "Conversas" tab shows new lead
```

🎉 **YOU'RE LIVE!**

---

## 🆘 Need Help?

1. **Quick answer?** → [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. **How do I X?** → Use search in the guide files
3. **Example API call?** → [API_TESTING.md](./API_TESTING.md)
4. **Deployment?** → [DEPLOY.md](./DEPLOY.md)
5. **Understanding code?** → [README.md](./README.md)

---

## 📞 Resources

- [Meta WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Express.js Documentation](https://expressjs.com)
- [Supabase Docs](https://supabase.com/docs)
- [Redis Documentation](https://redis.io/docs/)

---

## 🎓 Next Steps

1. ✅ Read this file
2. ✅ Follow [SETUP_QUICK_START.md](./SETUP_QUICK_START.md)
3. ✅ Test with [API_TESTING.md](./API_TESTING.md)
4. ✅ Deploy with [DEPLOY.md](./DEPLOY.md)
5. ✅ Monitor and scale

---

**Backend Version**: 1.0.0 MVP
**Last Updated**: February 15, 2026
**Status**: Production Ready ✅

---

💡 **Pro Tip**: Bookmark this file and the TROUBLESHOOTING guide for quick reference during setup!
