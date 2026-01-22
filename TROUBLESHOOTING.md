# Project IDA - Quick Start Guide

## Current Issue: Backend Services Not Starting

The error `ERR_CONNECTION_REFUSED` on port 8000 means the Gateway service (and other backend services) aren't running.

### Quick Fix Steps:

1. **Check if packages are built:**
```bash
npm run build -w packages/logger -w packages/db -w packages/shared-types -w packages/auth-middleware
```

2. **Generate Prisma client:**
```bash
npm run generate
```

3. **Start services individually to see errors:**

```bash
# Terminal 1: Gateway
npm run dev -w gateway-service

# Terminal 2: Auth
npm run dev -w auth-service

# Terminal 3: Tenant
npm run dev -w tenant-service

# Terminal 4: Frontend
npm run dev -w @project-ida/web
```

### Common Issues:

1. **Missing dependencies in auth-service:**
   - Need to install: `bcrypt`, `jsonwebtoken`, `uuid`
   - Run: `npm install bcrypt jsonwebtoken uuid @types/bcrypt @types/jsonwebtoken -w services/auth-service`

2. **TypeScript errors:**
   - Check: `npx tsc --noEmit -p services/auth-service/tsconfig.json`
   - Check: `npx tsc --noEmit -p services/gateway-service/tsconfig.json`

3. **Prisma client not generated:**
   - Run: `npm run generate`

4. **Database not running:**
   - Start: `docker-compose up -d`
   - Check: `docker ps`

### Expected Output When Working:

```
[0] VITE ready in 500ms
[0] ➜ Local: http://localhost:5173
[1] Gateway Service running on port 8000
[2] Auth Service running on port 8006
[3] Tenant Service running on port 8001
[4] Upload Service running on port 8002
[5] Parser Service running on port 8003
[6] EDA Service running on port 8004
```

### Test Backend is Running:

```bash
# Test Gateway
curl http://localhost:8000/health

# Test Auth
curl http://localhost:8006/health

# Should return: {"status":"ok","service":"auth"}
```

### If Still Not Working:

1. Kill all node processes
2. Clear node_modules and reinstall:
```bash
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf services/*/node_modules
rm -rf packages/*/node_modules
npm install
```

3. Rebuild everything:
```bash
npm run generate
npm run build --workspaces
npm run dev
```

### Current Status:
- ✅ Frontend building successfully
- ❌ Backend services not starting
- **Next Step:** Check individual service logs for errors
