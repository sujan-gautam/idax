# 🚀 Quick Deploy Guide - Project IDA

## ⚡ 5-Minute Deployment

### Option 1: Vercel (Serverless)
```bash
# 1. Install & Login
npm install -g vercel
vercel login

# 2. Deploy
vercel --prod

# 3. Set Environment Variables (in Vercel Dashboard)
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
FRONTEND_URL=https://your-app.vercel.app
GEMINI_API_KEY=your-key
```

### Option 2: Railway (Traditional)
```bash
# 1. Push to GitHub
git add .
git commit -m "Deploy"
git push

# 2. Connect Railway to GitHub
# (Railway auto-deploys)

# 3. Add PostgreSQL in Railway Dashboard
# 4. Set environment variables in Railway
```

---

## 📋 Pre-Deployment Checklist

### Required Files ✅
- [x] `api/index.ts` - Unified API server
- [x] `api/package.json` - Dependencies
- [x] `vercel.json` - Vercel config
- [x] `railway.json` - Railway config

### Required Environment Variables
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="generate-with-openssl-rand-base64-32"
JWT_REFRESH_SECRET="generate-with-openssl-rand-base64-32"
FRONTEND_URL="https://your-app.vercel.app"
NODE_ENV="production"
```

### Optional (based on features)
```env
GEMINI_API_KEY="..."
OPENAI_API_KEY="..."
STRIPE_SECRET_KEY="sk_..."
```

---

## 🔧 Migration Steps

### 1. Copy Routes (Required)
```bash
# Run helper script
node scripts/consolidate-routes.js

# Manually copy routes from services to api/routes/
# Example:
cp services/auth-service/src/routes/* api/routes/auth.ts
```

### 2. Update Imports
```typescript
// Change this:
import { PrismaClient } from '../../../packages/db';

// To this:
import { PrismaClient } from '@prisma/client';
```

### 3. Test Locally
```bash
cd api
npm install
npm run dev

# Should see:
# 🚀 Server running on port 3000
```

---

## 🌐 API Structure

### All Endpoints Under `/api/v1/`
```
POST   /api/v1/auth/login
POST   /api/v1/auth/register
GET    /api/v1/admin/users
GET    /api/v1/projects
GET    /api/v1/datasets
POST   /api/v1/ai/chat
GET    /api/v1/billing/plans
POST   /api/v1/upload
```

---

## 🎯 Deployment Commands

### Vercel
```bash
# Deploy
vercel --prod

# View logs
vercel logs

# Set env variable
vercel env add DATABASE_URL
```

### Railway
```bash
# Deploy
railway up

# View logs
railway logs

# Run command
railway run npx prisma migrate deploy
```

---

## ✅ Verification

### After Deployment
```bash
# 1. Check health
curl https://your-app.vercel.app/health

# 2. Test login
curl -X POST https://your-app.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# 3. Check frontend
# Open https://your-app.vercel.app in browser
```

---

## 🐛 Common Issues

### Issue: "Module not found"
**Solution:** Run `npm install` in `api/` directory

### Issue: "Database connection failed"
**Solution:** Check `DATABASE_URL` is correct

### Issue: "CORS error"
**Solution:** Update `FRONTEND_URL` in environment variables

### Issue: "Timeout"
**Solution:** Optimize database queries or upgrade plan

---

## 📞 Quick Links

- **Deployment Guide:** `DEPLOYMENT.md`
- **Architecture Docs:** `UNIFIED_API.md`
- **Complete Summary:** `COMPLETE_SUMMARY.md`

---

## 🎉 Success!

Your app is deployed when:
- ✅ `/health` returns 200
- ✅ Frontend loads
- ✅ Login works
- ✅ Admin panel accessible
- ✅ API calls succeed

**🚀 You're live!**
