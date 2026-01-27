# Project IDA - Running the Application

**Date**: 2026-01-27  
**Status**: Frontend Running ✅ | Backend Setup Required ⏳

---

## 🚀 Current Status

### ✅ Frontend Running
- **URL**: http://localhost:5173
- **Status**: Running successfully
- **Features**: New redesigned UI with professional design system

### ⏳ Backend Services
- **Status**: Requires Docker Desktop to be running
- **Services Needed**: PostgreSQL, MinIO, Redis, Gateway, Auth, Tenant, Upload, Parser, EDA

---

## 📋 Quick Start Guide

### Step 1: Start Docker Desktop
**Docker Desktop must be running before starting backend services.**

1. Open Docker Desktop application
2. Wait for it to fully start (Docker icon in system tray should be green)
3. Verify Docker is running:
   ```powershell
   docker ps
   ```

### Step 2: Start Infrastructure Services
Once Docker Desktop is running:

```powershell
# Navigate to project directory
cd c:\Users\hp\Downloads\antigrav-ai

# Start PostgreSQL, MinIO, and Redis
docker-compose up -d

# Verify services are running
docker ps
```

You should see 3 containers running:
- `postgres:15-alpine` on port 5432
- `minio/minio` on ports 9000, 9001
- `redis:alpine` on port 6379

### Step 3: Setup Database
```powershell
# Generate Prisma client
npm run generate

# Push database schema
npm run db:push
```

### Step 4: Start All Services
```powershell
# Start frontend + all backend services
npm run dev
```

This will start:
- **Frontend** (React + Vite): http://localhost:5173
- **Gateway Service**: http://localhost:8000
- **Auth Service**: http://localhost:8006
- **Tenant Service**: http://localhost:8001
- **Upload Service**: http://localhost:8002
- **Parser Service**: http://localhost:8003
- **EDA Service**: http://localhost:8004
- **Job Orchestrator**: http://localhost:8005

---

## 🔧 Alternative: Start Services Individually

### Frontend Only (Currently Running)
```powershell
npm run dev -w @project-ida/web
```
**URL**: http://localhost:5173

### Backend Services
```powershell
# Gateway
npm run dev -w gateway-service

# Auth
npm run dev -w auth-service

# Tenant
npm run dev -w tenant-service

# Upload
npm run dev -w upload-service

# Parser
npm run dev -w parser-service

# EDA
npm run dev -w eda-service
```

---

## 🌐 Access Points

### Frontend
- **Main App**: http://localhost:5173
- **Login**: http://localhost:5173/login
- **Register**: http://localhost:5173/register
- **Dashboard**: http://localhost:5173/dashboard (requires login)

### Backend APIs
- **API Gateway**: http://localhost:8000/api/v1
- **Auth API**: http://localhost:8006
- **Swagger Docs**: http://localhost:8000/docs (if available)

### Infrastructure
- **MinIO Console**: http://localhost:9001
  - Username: `test`
  - Password: `password`
- **PostgreSQL**: localhost:5432
  - Database: `project_ida`
  - Username: `admin`
  - Password: `password`

---

## 🎨 New Frontend Features

The redesigned frontend includes:

### ✅ Completed Pages
1. **Login Page** - Professional authentication with gradient background
2. **Register Page** - Multi-step registration with password strength
3. **Dashboard** - Stats overview, recent activity, quick actions
4. **Projects** - Grid layout with search and create dialog

### 🎨 Design System
- **Professional Color Palette** - Indigo primary, Slate neutral
- **Typography** - Inter font with complete scale
- **Components** - 14+ reusable components
- **Dark Mode** - Full support throughout
- **Responsive** - Mobile-first design

### 🧩 New Components
- `PageHeader` - Consistent page layouts
- `EmptyState` - Contextual empty states
- `LoadingState` - Professional loading indicators
- `StatusIndicator` - Status badges
- `StatCard` - Dashboard metrics
- `ProjectCard` - Project grid cards
- And more...

---

## 🐛 Troubleshooting

### Docker Desktop Not Running
**Error**: `The system cannot find the file specified`

**Solution**:
1. Open Docker Desktop
2. Wait for it to start completely
3. Retry `docker-compose up -d`

### Port Already in Use
**Error**: `Port 5173 is already in use`

**Solution**:
```powershell
# Find process using port
netstat -ano | findstr :5173

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

### Database Connection Failed
**Error**: `Can't reach database server`

**Solution**:
1. Ensure Docker containers are running: `docker ps`
2. Check PostgreSQL is healthy: `docker logs <postgres-container-id>`
3. Verify connection string in `.env` file

### Prisma Client Not Generated
**Error**: `Cannot find module '@prisma/client'`

**Solution**:
```powershell
npm run generate
```

### Services Won't Start
**Error**: Various service errors

**Solution**:
```powershell
# Install dependencies
npm install

# Generate Prisma client
npm run generate

# Push database schema
npm run db:push

# Restart services
npm run dev
```

---

## 📝 Environment Variables

Check `.env` file in project root:

```env
# Database
DATABASE_URL="postgresql://admin:password@localhost:5432/project_ida"

# JWT
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"

# S3 (MinIO)
S3_BUCKET_NAME="project-ida-uploads"
AWS_S3_ENDPOINT="http://localhost:9000"
AWS_ACCESS_KEY_ID="test"
AWS_SECRET_ACCESS_KEY="password"

# Services
GATEWAY_PORT=8000
AUTH_SERVICE_PORT=8006
TENANT_SERVICE_PORT=8001
UPLOAD_SERVICE_PORT=8002
PARSER_SERVICE_PORT=8003
EDA_SERVICE_PORT=8004
JOB_ORCHESTRATOR_PORT=8005
```

---

## 🔄 Development Workflow

### 1. Start Infrastructure
```powershell
docker-compose up -d
```

### 2. Start Development Servers
```powershell
npm run dev
```

### 3. Make Changes
- Frontend changes auto-reload (Vite HMR)
- Backend changes auto-reload (nodemon)

### 4. Test Changes
- Open http://localhost:5173
- Test new features
- Check console for errors

### 5. Stop Services
```powershell
# Stop all services (Ctrl+C in terminal)

# Stop Docker containers
docker-compose down
```

---

## 📚 Next Steps

### To Test the New Frontend:
1. **Start Docker Desktop**
2. **Run**: `docker-compose up -d`
3. **Run**: `npm run generate && npm run db:push`
4. **Run**: `npm run dev`
5. **Open**: http://localhost:5173

### To Continue Development:
1. Review `IMPLEMENTATION_SUMMARY.md` for completed work
2. Check `REDESIGN_PROGRESS.md` for remaining tasks
3. Use `DESIGN_SYSTEM_GUIDE.md` for component reference
4. Continue with Dataset pages and analysis tabs

---

## 🎯 Testing Checklist

### Frontend
- [ ] Login page loads correctly
- [ ] Registration works
- [ ] Dashboard displays stats
- [ ] Projects page shows grid
- [ ] Create project dialog works
- [ ] Dark mode toggle works
- [ ] Responsive on mobile

### Backend
- [ ] Can register new user
- [ ] Can login successfully
- [ ] Can create project
- [ ] Can upload dataset
- [ ] Can view EDA results
- [ ] API endpoints respond

---

## 📞 Support

### Documentation
- `README.md` - Project overview
- `FRONTEND_REDESIGN_PLAN.md` - Redesign strategy
- `IMPLEMENTATION_SUMMARY.md` - What's been done
- `DESIGN_SYSTEM_GUIDE.md` - Component reference

### Common Commands
```powershell
# Install dependencies
npm install

# Generate Prisma client
npm run generate

# Push database schema
npm run db:push

# Start all services
npm run dev

# Start frontend only
npm run dev -w @project-ida/web

# Start specific service
npm run dev -w gateway-service
```

---

**Last Updated**: 2026-01-27  
**Frontend Status**: ✅ Running on http://localhost:5173  
**Backend Status**: ⏳ Awaiting Docker Desktop startup
