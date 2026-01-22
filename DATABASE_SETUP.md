# URGENT: Database Not Running

## Problem
The registration is failing because PostgreSQL database is not running. Docker Desktop is not started.

## Quick Fix Options

### Option 1: Start Docker Desktop (RECOMMENDED)
1. **Open Docker Desktop** application on Windows
2. **Wait** for it to fully start (whale icon should be steady in system tray)
3. **Run** in terminal:
   ```bash
   docker-compose up -d
   ```
4. **Wait** 10 seconds for containers to start
5. **Run database migration**:
   ```bash
   npm run db:push
   ```
6. **Refresh** browser and try registration again

### Option 2: Use Cloud Database (If Docker won't start)
If Docker Desktop won't start, you can use a free cloud PostgreSQL database:

1. **Go to** https://neon.tech or https://supabase.com
2. **Create free account** and new database
3. **Copy** the connection string (looks like: `postgresql://user:pass@host:5432/dbname`)
4. **Update** `.env` file:
   ```
   DATABASE_URL="postgresql://your-connection-string-here"
   ```
5. **Run migration**:
   ```bash
   npm run db:push
   ```
6. **Restart services**:
   ```bash
   # Kill current terminal (Ctrl+C)
   npm run dev
   ```

### Option 3: Install PostgreSQL Locally
1. **Download** PostgreSQL from https://www.postgresql.org/download/windows/
2. **Install** with default settings
3. **Remember** the password you set for postgres user
4. **Update** `.env`:
   ```
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/project_ida"
   ```
5. **Create database**:
   ```bash
   psql -U postgres
   CREATE DATABASE project_ida;
   \q
   ```
6. **Run migration**:
   ```bash
   npm run db:push
   ```

## Verify Database is Working

After starting database, test connection:
```bash
npx prisma studio
```

This should open a browser window showing your database tables. If it works, close it and try registration again.

## Current Error Details

The auth service is showing:
```
PrismaClientInitializationError
Please make sure your database server is running
```

This means Prisma can't connect to PostgreSQL at `localhost:5432`.

## Next Steps After Database is Running

1. ✅ Database running
2. ✅ Run `npm run db:push` to create tables
3. ✅ Restart `npm run dev`
4. ✅ Try registration again
5. ✅ Should work!

---

**IMPORTANT:** The application REQUIRES a PostgreSQL database to function. Choose one of the options above to proceed.
