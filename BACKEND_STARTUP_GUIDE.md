# Starting Project IDA Backend Services

**Date**: 2026-01-27  
**Status**: ⚠️ Docker Desktop Required

---

## ⚠️ **IMPORTANT: Docker Desktop Must Be Running**

Before starting backend services, you need to:

### 1. **Start Docker Desktop Manually**
   - Open the **Docker Desktop** application
   - Wait for it to fully start (Docker icon in system tray should be green)
   - This usually takes 30-60 seconds

### 2. **Verify Docker is Running**
   ```powershell
   docker ps
   ```
   You should see a table header (even if no containers are running)

---

## 🚀 **Step-by-Step Backend Startup**

### **Step 1: Start Infrastructure Services**

Once Docker Desktop is running:

```powershell
# Navigate to project directory
cd c:\Users\hp\Downloads\antigrav-ai

# Start PostgreSQL, MinIO, and Redis
docker-compose up -d

# Verify containers are running
docker ps
```

**Expected Output**: 3 containers running
- `project-ida-postgres-1` (PostgreSQL on port 5432)
- `project-ida-minio-1` (MinIO on ports 9000, 9001)
- `project-ida-redis-1` (Redis on port 6379)

---

### **Step 2: Setup Database**

```powershell
# Generate Prisma client
npm run generate

# Push database schema to PostgreSQL
npm run db:push
```

**Expected Output**: 
- Prisma client generated successfully
- Database schema synchronized

---

### **Step 3: Start All Services**

```powershell
# This will start ALL services including frontend
npm run dev
```

This command starts:
- ✅ **Frontend** (already running on port 5173)
- 🔄 **Gateway Service** (port 8000)
- 🔄 **Auth Service** (port 8006)
- 🔄 **Tenant Service** (port 8001)
- 🔄 **Upload Service** (port 8002)
- 🔄 **Parser Service** (port 8003)
- 🔄 **EDA Service** (port 8004)

---

## 🎯 **Alternative: Start Services Individually**

If you prefer to start services one by one:

### **Frontend** (Already Running ✅)
```powershell
npm run dev -w @project-ida/web
```
**URL**: http://localhost:5173

### **Gateway Service**
```powershell
npm run dev -w gateway-service
```
**URL**: http://localhost:8000

### **Auth Service**
```powershell
npm run dev -w auth-service
```
**URL**: http://localhost:8006

### **Tenant Service**
```powershell
npm run dev -w tenant-service
```
**URL**: http://localhost:8001

### **Upload Service**
```powershell
npm run dev -w upload-service
```
**URL**: http://localhost:8002

### **Parser Service**
```powershell
npm run dev -w parser-service
```
**URL**: http://localhost:8003

### **EDA Service**
```powershell
npm run dev -w eda-service
```
**URL**: http://localhost:8004

---

## 🔍 **Verification Checklist**

### **Infrastructure Services**
```powershell
# Check Docker containers
docker ps

# Check PostgreSQL
docker logs project-ida-postgres-1

# Check MinIO
docker logs project-ida-minio-1

# Check Redis
docker logs project-ida-redis-1
```

### **Backend Services**
- [ ] Gateway responding on http://localhost:8000
- [ ] Auth service responding on http://localhost:8006
- [ ] Can register a new user
- [ ] Can login successfully
- [ ] Can create a project
- [ ] Can upload a dataset

---

## 🌐 **Access Points After Startup**

### **Frontend**
- Main App: http://localhost:5173
- Login: http://localhost:5173/login
- Register: http://localhost:5173/register
- Dashboard: http://localhost:5173/dashboard

### **Backend APIs**
- API Gateway: http://localhost:8000/api/v1
- Auth API: http://localhost:8006
- Health Check: http://localhost:8000/health

### **Infrastructure**
- MinIO Console: http://localhost:9001
  - Username: `test`
  - Password: `password`
- PostgreSQL: localhost:5432
  - Database: `project_ida`
  - Username: `admin`
  - Password: `password`

---

## 🐛 **Troubleshooting**

### **Docker Desktop Not Starting**
**Error**: `The system cannot find the file specified`

**Solution**:
1. Open Docker Desktop application
2. Wait for it to fully start
3. Check system tray for Docker icon (should be green)
4. Retry `docker ps`

### **Port Already in Use**
**Error**: `Port XXXX is already in use`

**Solution**:
```powershell
# Find process using the port
netstat -ano | findstr :XXXX

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

### **Database Connection Failed**
**Error**: `Can't reach database server`

**Solution**:
1. Ensure Docker containers are running: `docker ps`
2. Check PostgreSQL logs: `docker logs project-ida-postgres-1`
3. Verify DATABASE_URL in .env file

### **Prisma Client Not Found**
**Error**: `Cannot find module '@prisma/client'`

**Solution**:
```powershell
npm run generate
```

### **Services Won't Start**
**Error**: Various errors

**Solution**:
```powershell
# Clean install
npm install

# Generate Prisma client
npm run generate

# Push database schema
npm run db:push

# Restart services
npm run dev
```

---

## 📝 **Environment Variables**

Ensure `.env` file exists in project root with:

```env
# Database
DATABASE_URL="postgresql://admin:password@localhost:5432/project_ida"

# JWT
JWT_SECRET="your-secret-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-change-in-production"

# S3 (MinIO)
S3_BUCKET_NAME="project-ida-uploads"
AWS_S3_ENDPOINT="http://localhost:9000"
AWS_ACCESS_KEY_ID="test"
AWS_SECRET_ACCESS_KEY="password"

# Redis
REDIS_URL="redis://localhost:6379"

# Service Ports
GATEWAY_PORT=8000
AUTH_SERVICE_PORT=8006
TENANT_SERVICE_PORT=8001
UPLOAD_SERVICE_PORT=8002
PARSER_SERVICE_PORT=8003
EDA_SERVICE_PORT=8004
JOB_ORCHESTRATOR_PORT=8005
```

---

## 🎯 **Quick Start Commands**

```powershell
# 1. Start Docker Desktop (manually)

# 2. Start infrastructure
docker-compose up -d

# 3. Setup database
npm run generate && npm run db:push

# 4. Start all services
npm run dev

# 5. Open browser
# http://localhost:5173
```

---

## 📊 **Expected Terminal Output**

When all services are running, you should see:

```
[web] VITE v7.3.1 ready in XXXms
[web] ➜ Local: http://localhost:5173/

[gateway-service] Gateway Service listening on port 8000
[auth-service] Auth Service listening on port 8006
[tenant-service] Tenant Service listening on port 8001
[upload-service] Upload Service listening on port 8002
[parser-service] Parser Service listening on port 8003
[eda-service] EDA Service listening on port 8004
```

---

## ✅ **Success Indicators**

You'll know everything is working when:
- ✅ Docker shows 3 running containers
- ✅ All service ports are listening
- ✅ Frontend loads at http://localhost:5173
- ✅ You can register a new account
- ✅ You can login successfully
- ✅ Dashboard loads with data
- ✅ You can create projects
- ✅ You can upload datasets

---

**Current Status**: Frontend ✅ Running | Backend ⏳ Waiting for Docker Desktop

**Next Step**: Start Docker Desktop, then run the commands above!
