# SERVICE STATUS CHECK

Run these commands to check which services are running:

```bash
# Check Gateway
curl http://localhost:8000/health

# Check Auth
curl http://localhost:8006/health

# Check Tenant
curl http://localhost:8001/health

# Check Upload
curl http://localhost:8002/health

# Check Parser
curl http://localhost:8003/health

# Check EDA
curl http://localhost:8004/health
```

## ISSUE: Login Request Pending

The login request is stuck because the auth service (port 8006) is likely not running or crashed.

## SOLUTION:

The auth service probably crashed due to missing dependencies. We need to:

1. Install uuid for gateway-service
2. Restart services

Run:
```bash
npm install uuid -w gateway-service
npm run dev
```

## QUICK FIX:

Since you're seeing the login page, the frontend is working. The backend services just need to be restarted properly.

**The most likely issue:** Parser service needs papaparse and xlsx dependencies installed.

Run this:
```bash
npm install papaparse xlsx @types/papaparse -w parser-service
npm run dev
```

Then try logging in again.
