# 🎯 Deployment Architecture - Unified API

## Problem Solved
**Before:** Multiple microservices on different ports (incompatible with Vercel/Railway)  
**After:** Single unified API server (compatible with all platforms)

---

## 📊 Architecture Comparison

### Old Architecture (Microservices)
```
┌─────────────────────────────────────────┐
│  Gateway Service (Port 8000)            │
│  ├─> Auth Service (Port 8001)           │
│  ├─> Admin Service (Port 8009)          │
│  ├─> AI Service (Port 8003)             │
│  ├─> Billing Service (Port 8004)        │
│  ├─> Upload Service (Port 8005)         │
│  ├─> Tenant Service (Port 8006)         │
│  ├─> EDA Service (Port 8007)            │
│  ├─> Job Orchestrator (Port 8008)       │
│  └─> Parser Service (Port 8002)         │
└─────────────────────────────────────────┘

❌ Issues:
- Multiple ports required
- Complex deployment
- Not compatible with Vercel
- Difficult to scale
- Higher infrastructure costs
```

### New Architecture (Unified API)
```
┌─────────────────────────────────────────┐
│  Unified API Server (Port 3000)         │
│  ├─> /api/v1/auth/*                     │
│  ├─> /api/v1/admin/*                    │
│  ├─> /api/v1/ai/*                       │
│  ├─> /api/v1/billing/*                  │
│  ├─> /api/v1/upload/*                   │
│  ├─> /api/v1/tenant/*                   │
│  ├─> /api/v1/eda/*                      │
│  ├─> /api/v1/jobs/*                     │
│  └─> /api/v1/parser/*                   │
└─────────────────────────────────────────┘

✅ Benefits:
- Single port (3000 or env PORT)
- Simple deployment
- Vercel/Railway compatible
- Easy to scale
- Lower costs
- Serverless ready
```

---

## 🗂️ New File Structure

```
project-ida/
├── api/                          # ✨ NEW - Unified API
│   ├── index.ts                  # Main server file
│   ├── package.json              # API dependencies
│   ├── tsconfig.json             # TypeScript config
│   └── routes/                   # All route handlers
│       ├── auth.ts               # Authentication
│       ├── admin.ts              # Admin panel
│       ├── projects.ts           # Projects
│       ├── datasets.ts           # Datasets
│       ├── jobs.ts               # Job orchestration
│       ├── ai.ts                 # AI services
│       ├── billing.ts            # Billing/Stripe
│       ├── upload.ts             # File uploads
│       ├── tenant.ts             # Tenant management
│       ├── eda.ts                # EDA operations
│       └── parser.ts             # Data parsing
│
├── apps/
│   └── web/                      # Frontend (unchanged)
│       ├── src/
│       ├── package.json
│       └── vite.config.ts
│
├── packages/                     # Shared packages
│   ├── auth/                     # Auth utilities
│   ├── db/                       # Prisma client
│   └── types/                    # Shared types
│
├── services/                     # ⚠️ OLD - Can be removed after migration
│   ├── auth-service/
│   ├── admin-service/
│   ├── ai-service/
│   └── ... (other services)
│
├── scripts/
│   ├── consolidate-routes.js    # ✨ NEW - Helper script
│   └── seed-admin.js
│
├── vercel.json                   # ✨ NEW - Vercel config
├── DEPLOYMENT.md                 # ✨ NEW - Deployment guide
└── package.json                  # Root package.json
```

---

## 🚀 Deployment Platforms

### ✅ Vercel (Serverless)
**Best for:**
- Automatic deployments
- Global CDN
- Serverless functions
- Free tier available

**Configuration:**
- `vercel.json` ✅ Created
- API: `/api/*` → `api/index.ts`
- Frontend: `/*` → `apps/web/dist`
- Max duration: 60s

**Deploy:**
```bash
vercel --prod
```

---

### ✅ Railway (Traditional Hosting)
**Best for:**
- Long-running processes
- WebSocket support
- Background jobs
- PostgreSQL included

**Configuration:**
- Auto-detected from `package.json`
- Build: `cd api && npm install && npm run build`
- Start: `cd api && npm start`

**Deploy:**
```bash
railway up
# or push to GitHub (auto-deploy)
```

---

### ✅ Other Platforms

**Render:**
- Similar to Railway
- Free tier available
- Auto-deploy from Git

**Heroku:**
- Traditional PaaS
- Requires Procfile
- Paid plans only

**AWS/GCP/Azure:**
- Full control
- More complex setup
- Higher costs

---

## 📝 Migration Checklist

### Phase 1: Setup Unified API ✅
- [x] Create `api/` directory
- [x] Create `api/index.ts` (main server)
- [x] Create `api/package.json`
- [x] Create `api/routes/` templates
- [x] Create `vercel.json`
- [x] Create deployment guide

### Phase 2: Consolidate Routes
- [ ] Copy auth routes from `services/auth-service`
- [ ] Copy admin routes from `services/admin-service`
- [ ] Copy AI routes from `services/ai-service`
- [ ] Copy billing routes from `services/billing-service`
- [ ] Copy upload routes from `services/upload-service`
- [ ] Copy tenant routes from `services/tenant-service`
- [ ] Copy EDA routes from `services/eda-service`
- [ ] Copy job routes from `services/job-orchestrator-service`
- [ ] Copy parser routes from `services/parser-service`

### Phase 3: Update Frontend
- [ ] Update API base URL to `/api/v1`
- [ ] Remove service-specific URLs
- [ ] Test all API calls
- [ ] Update environment variables

### Phase 4: Testing
- [ ] Test authentication flow
- [ ] Test admin panel
- [ ] Test project creation
- [ ] Test dataset upload
- [ ] Test AI chat
- [ ] Test billing (if enabled)
- [ ] Test all CRUD operations

### Phase 5: Deployment
- [ ] Set up database (Supabase/Neon/PlanetScale)
- [ ] Configure environment variables
- [ ] Run database migrations
- [ ] Deploy to Vercel/Railway
- [ ] Verify deployment
- [ ] Run smoke tests

---

## 🔧 Quick Start Guide

### 1. Install Dependencies
```bash
# Install API dependencies
cd api
npm install

# Install frontend dependencies
cd ../apps/web
npm install
```

### 2. Run Consolidation Helper
```bash
# From project root
node scripts/consolidate-routes.js
```

### 3. Copy Routes
Manually copy route handlers from `services/*/src/` to `api/routes/`

Example:
```bash
# Copy auth routes
cp services/auth-service/src/routes/auth.ts api/routes/auth.ts

# Update imports and remove service-specific code
```

### 4. Test Locally
```bash
# Start unified API
cd api
npm run dev

# In another terminal, start frontend
cd apps/web
npm run dev
```

### 5. Deploy
```bash
# Vercel
vercel --prod

# Railway
railway up
```

---

## 🌐 API Endpoints

All endpoints now under `/api/v1/`:

### Authentication (`/api/v1/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /refresh` - Refresh token
- `POST /logout` - Logout
- `POST /forgot-password` - Password reset request
- `POST /reset-password` - Password reset

### Admin (`/api/v1/admin`)
- `GET /users` - List users
- `POST /users` - Create user
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `GET /statistics` - System statistics
- `GET /audit-logs` - Audit logs
- `GET /feature-flags` - Feature flags
- `PUT /feature-flags` - Update feature flags
- `GET /quotas` - Quotas
- `PUT /quotas` - Update quotas

### Projects (`/api/v1/projects`)
- `GET /` - List projects
- `POST /` - Create project
- `GET /:id` - Get project
- `PATCH /:id` - Update project
- `DELETE /:id` - Delete project

### Datasets (`/api/v1/datasets`)
- `GET /` - List datasets
- `POST /` - Create dataset
- `GET /:id` - Get dataset
- `GET /:id/preview` - Preview data
- `GET /:id/statistics` - Dataset statistics
- `DELETE /:id` - Delete dataset

### AI (`/api/v1/ai`)
- `POST /chat` - Chat with AI
- `GET /sessions` - Get chat sessions
- `GET /sessions/:id` - Get session details
- `DELETE /sessions/:id` - Delete session
- `GET /usage` - Get AI usage

### Billing (`/api/v1/billing`)
- `GET /plans` - List plans
- `POST /checkout` - Create checkout session
- `POST /webhook` - Stripe webhook
- `GET /subscription` - Get subscription
- `POST /cancel` - Cancel subscription

### Upload (`/api/v1/upload`)
- `POST /` - Upload file
- `GET /:id` - Get upload status
- `DELETE /:id` - Delete upload

### Jobs (`/api/v1/jobs`)
- `GET /` - List jobs
- `POST /` - Create job
- `GET /:id` - Get job status
- `DELETE /:id` - Cancel job

---

## 🔐 Environment Variables

### Required
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
FRONTEND_URL="https://your-app.vercel.app"
NODE_ENV="production"
```

### Optional (based on features)
```env
# AI Services
GEMINI_API_KEY="your-gemini-key"
OPENAI_API_KEY="your-openai-key"

# Billing
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Storage
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_BUCKET_NAME="..."
```

---

## 📊 Performance Considerations

### Database
- Use connection pooling
- Add indexes on frequently queried fields
- Optimize N+1 queries
- Use Prisma query optimization

### API
- Enable response compression
- Implement caching (Redis)
- Use CDN for static assets
- Optimize payload sizes

### Serverless (Vercel)
- Keep functions small
- Minimize cold starts
- Use edge functions where possible
- Optimize bundle size

---

## 🎯 Success Metrics

Your deployment is successful when:
- ✅ Single API server running
- ✅ All routes accessible under `/api/v1/*`
- ✅ Frontend connects successfully
- ✅ Database queries work
- ✅ Authentication flows work
- ✅ File uploads function
- ✅ AI chat operates
- ✅ Admin panel accessible

---

## 📞 Next Steps

1. **Run consolidation script:**
   ```bash
   node scripts/consolidate-routes.js
   ```

2. **Copy routes from services:**
   - Manually copy route handlers
   - Update imports
   - Remove service-specific middleware

3. **Test locally:**
   ```bash
   cd api && npm run dev
   ```

4. **Deploy:**
   ```bash
   vercel --prod
   # or
   railway up
   ```

5. **Verify:**
   - Test all endpoints
   - Check logs
   - Monitor performance

---

## 🎉 Benefits Summary

### Before (Microservices)
- ❌ 10 separate services
- ❌ 10 different ports
- ❌ Complex deployment
- ❌ Not Vercel compatible
- ❌ Higher costs

### After (Unified API)
- ✅ 1 unified service
- ✅ 1 port (3000)
- ✅ Simple deployment
- ✅ Vercel/Railway compatible
- ✅ Lower costs
- ✅ Easier to maintain
- ✅ Better performance
- ✅ Serverless ready

---

**🚀 Ready to deploy to Vercel or Railway!**

See `DEPLOYMENT.md` for detailed deployment instructions.
