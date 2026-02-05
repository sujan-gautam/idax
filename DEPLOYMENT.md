# 🚀 Deployment Guide - Project IDA

## Overview
This guide covers deploying Project IDA to **Vercel** or **Railway** with the unified API architecture.

---

## 📦 Architecture Change

### Before (Microservices)
```
❌ Multiple services on different ports:
- auth-service: 8001
- admin-service: 8009
- ai-service: 8003
- billing-service: 8004
- upload-service: 8005
- gateway-service: 8000
```

### After (Unified API)
```
✅ Single API server:
- Unified API: 3000 (or PORT env variable)
- All routes under /api/v1/*
- Compatible with serverless platforms
```

---

## 🎯 Deployment Options

### Option 1: Vercel (Recommended for Serverless)

#### Prerequisites
- Vercel account
- GitHub repository
- PostgreSQL database (Supabase, Neon, or PlanetScale)

#### Steps

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Configure Environment Variables**
Create a `.env.production` file:
```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"

# Frontend URL
FRONTEND_URL="https://your-app.vercel.app"

# AI APIs
GEMINI_API_KEY="your-gemini-api-key"
OPENAI_API_KEY="your-openai-api-key"

# Stripe (if using billing)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Node Environment
NODE_ENV="production"
```

4. **Deploy to Vercel**
```bash
# From project root
vercel

# Or deploy directly
vercel --prod
```

5. **Set Environment Variables in Vercel Dashboard**
```bash
# Or use CLI
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add JWT_REFRESH_SECRET
# ... add all environment variables
```

6. **Run Database Migrations**
```bash
# After deployment, run migrations
npx prisma migrate deploy
npx prisma generate
```

#### Vercel Configuration
The `vercel.json` file is already configured:
- API routes: `/api/*` → `api/index.ts`
- Frontend: `/*` → `apps/web/dist`
- Max duration: 60 seconds
- Region: US East (iad1)

---

### Option 2: Railway (Recommended for Traditional Hosting)

#### Prerequisites
- Railway account
- GitHub repository
- PostgreSQL database (Railway provides this)

#### Steps

1. **Create Railway Project**
- Go to [railway.app](https://railway.app)
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose your repository

2. **Add PostgreSQL Database**
- In your Railway project
- Click "New" → "Database" → "PostgreSQL"
- Railway will automatically set `DATABASE_URL`

3. **Configure Environment Variables**
In Railway dashboard, add:
```
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
FRONTEND_URL=https://your-app.up.railway.app
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
NODE_ENV=production
PORT=3000
```

4. **Configure Build Settings**
Railway will auto-detect, but you can customize:
- **Build Command**: `cd api && npm install && npm run build`
- **Start Command**: `cd api && npm start`
- **Root Directory**: `/`

5. **Deploy**
- Push to GitHub
- Railway auto-deploys on push
- Monitor logs in Railway dashboard

6. **Run Migrations**
```bash
# Connect to Railway shell
railway run npx prisma migrate deploy
railway run npx prisma generate
```

---

## 📋 Pre-Deployment Checklist

### 1. Database Setup
- [ ] PostgreSQL database created
- [ ] `DATABASE_URL` environment variable set
- [ ] Prisma schema up to date
- [ ] Migrations ready to run

### 2. Environment Variables
- [ ] `JWT_SECRET` set (generate with `openssl rand -base64 32`)
- [ ] `JWT_REFRESH_SECRET` set
- [ ] `FRONTEND_URL` set to production URL
- [ ] `GEMINI_API_KEY` set (if using Gemini)
- [ ] `OPENAI_API_KEY` set (if using OpenAI)
- [ ] `STRIPE_SECRET_KEY` set (if using billing)
- [ ] `NODE_ENV=production`

### 3. Code Preparation
- [ ] All services consolidated in `api/` directory
- [ ] Routes properly imported in `api/index.ts`
- [ ] CORS configured with production URL
- [ ] Error handling implemented
- [ ] Logging configured

### 4. Frontend Build
- [ ] Frontend builds successfully (`npm run build`)
- [ ] API base URL updated to production
- [ ] Environment variables configured
- [ ] Static assets optimized

---

## 🔧 Unified API Structure

```
api/
├── index.ts                 # Main server file
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
└── routes/                 # All route handlers
    ├── auth.ts             # Authentication routes
    ├── admin.ts            # Admin panel routes
    ├── projects.ts         # Project management
    ├── datasets.ts         # Dataset management
    ├── jobs.ts             # Job orchestration
    ├── ai.ts               # AI chat & analysis
    ├── billing.ts          # Stripe billing
    ├── upload.ts           # File uploads
    ├── tenant.ts           # Tenant management
    └── eda.ts              # EDA operations
```

---

## 🌐 API Endpoints

All endpoints are now under `/api/v1/`:

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout

### Admin
- `GET /api/v1/admin/users` - List users
- `POST /api/v1/admin/users` - Create user
- `PATCH /api/v1/admin/users/:id` - Update user
- `DELETE /api/v1/admin/users/:id` - Delete user
- `GET /api/v1/admin/statistics` - System stats
- `GET /api/v1/admin/audit-logs` - Audit logs

### Projects
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/:id` - Get project
- `PATCH /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project

### Datasets
- `GET /api/v1/datasets` - List datasets
- `POST /api/v1/datasets` - Create dataset
- `GET /api/v1/datasets/:id` - Get dataset
- `DELETE /api/v1/datasets/:id` - Delete dataset

### AI
- `POST /api/v1/ai/chat` - Chat with AI
- `GET /api/v1/ai/sessions` - Get chat sessions
- `GET /api/v1/ai/usage` - Get AI usage

### Billing
- `GET /api/v1/billing/plans` - List plans
- `POST /api/v1/billing/checkout` - Create checkout
- `POST /api/v1/billing/webhook` - Stripe webhook

### Upload
- `POST /api/v1/upload` - Upload file
- `GET /api/v1/upload/:id` - Get upload status

---

## 🔐 Security Considerations

### Production Checklist
- [ ] Change all default secrets
- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable Helmet security headers
- [ ] Use environment variables for secrets
- [ ] Set up monitoring and alerts
- [ ] Configure database connection pooling
- [ ] Enable request logging
- [ ] Set up error tracking (Sentry)

### Environment Variables Security
**Never commit these to Git:**
- JWT secrets
- Database URLs
- API keys
- Stripe keys

**Use platform secret management:**
- Vercel: Environment Variables (encrypted)
- Railway: Environment Variables (encrypted)

---

## 📊 Monitoring & Logs

### Vercel
- View logs: `vercel logs`
- Monitor: Vercel Dashboard → Your Project → Logs
- Analytics: Built-in analytics available

### Railway
- View logs: Railway Dashboard → Your Service → Logs
- Monitor: Real-time log streaming
- Metrics: CPU, Memory, Network usage

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```
Error: Can't reach database server
```
**Solution:**
- Check `DATABASE_URL` is correct
- Ensure database is accessible from deployment platform
- Verify SSL mode if required

#### 2. CORS Errors
```
Access to fetch blocked by CORS policy
```
**Solution:**
- Update `FRONTEND_URL` in environment variables
- Check CORS configuration in `api/index.ts`
- Ensure origin is in `allowedOrigins` array

#### 3. Build Failures
```
Module not found
```
**Solution:**
- Run `npm install` in `api/` directory
- Check all imports are correct
- Verify `package.json` has all dependencies

#### 4. Timeout Errors (Vercel)
```
Function execution timeout
```
**Solution:**
- Optimize database queries
- Add indexes to frequently queried fields
- Consider upgrading Vercel plan for longer timeouts
- Use background jobs for long-running tasks

---

## 🚀 Quick Deploy Commands

### Vercel
```bash
# Install dependencies
cd api && npm install
cd ../apps/web && npm install

# Build frontend
cd apps/web && npm run build

# Deploy
vercel --prod
```

### Railway
```bash
# Push to GitHub (Railway auto-deploys)
git add .
git commit -m "Deploy unified API"
git push origin main

# Or use Railway CLI
railway up
```

---

## 📈 Performance Optimization

### Database
- [ ] Add indexes on frequently queried fields
- [ ] Use connection pooling
- [ ] Enable query caching
- [ ] Optimize N+1 queries

### API
- [ ] Enable response compression
- [ ] Implement caching (Redis)
- [ ] Use CDN for static assets
- [ ] Optimize payload sizes

### Frontend
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Image optimization
- [ ] Bundle size optimization

---

## 🎉 Post-Deployment

### 1. Verify Deployment
```bash
# Check health endpoint
curl https://your-app.vercel.app/health

# Test API
curl https://your-app.vercel.app/api/v1/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 2. Run Migrations
```bash
# Vercel
vercel env pull
npx prisma migrate deploy

# Railway
railway run npx prisma migrate deploy
```

### 3. Seed Admin User
```bash
# Run seed script
node scripts/seed-admin.js
```

### 4. Test All Features
- [ ] User registration/login
- [ ] Admin panel access
- [ ] Project creation
- [ ] Dataset upload
- [ ] AI chat
- [ ] Billing (if enabled)

---

## 📞 Support

If you encounter issues:
1. Check logs in platform dashboard
2. Verify environment variables
3. Test locally first
4. Check database connectivity
5. Review CORS configuration

---

## ✅ Success Criteria

Your deployment is successful when:
- [ ] Health endpoint returns 200
- [ ] Frontend loads without errors
- [ ] Users can register and login
- [ ] Admin panel is accessible
- [ ] API endpoints respond correctly
- [ ] Database queries work
- [ ] File uploads function
- [ ] AI chat operates properly

---

**🎊 Congratulations! Your Project IDA is now deployed!**
