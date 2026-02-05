# 🔐 Admin Login Credentials

## Your Admin Account

**Email:** `sujaan1919@gmail.com`  
**Password:** `sujan.sujan`  
**Role:** ADMIN  
**Organization:** Sujan's Organization  
**Plan:** ENTERPRISE

## What You Have Access To

### ✅ Full Admin Panel Features
- **User Management** - Create, edit, delete users
- **Feature Flags** - Enable/disable all 15+ features
- **Quotas Management** - Manage resource limits
- **System Statistics** - Real-time metrics dashboard
- **Audit Logs** - Complete activity tracking
- **Organization Settings** - Tenant configuration

### ✅ Enterprise Plan Benefits
Your account has been set up with the **ENTERPRISE** plan, which includes:

**Quotas:**
- 100 projects
- 100GB storage
- 5,000 uploads per month
- 100,000 API calls per month
- 5,000,000 AI tokens per month

**All Features Enabled:**
- ✅ Auto-EDA
- ✅ Statistical Distributions
- ✅ Correlation Analysis
- ✅ Outlier Detection
- ✅ Data Quality Scores
- ✅ Advanced Data Cleansing (AI-powered)
- ✅ AI Analytics Assistant
- ✅ API Access
- ✅ Custom Branding
- ✅ SSO Authentication
- ✅ Audit Logging
- ✅ Data Export
- ✅ Scheduled Reports
- ✅ Webhooks
- ✅ Advanced Analytics

## How to Login

1. Navigate to your application (usually `http://localhost:5173` or `http://localhost:3000`)
2. Click on **Login** or **Sign In**
3. Enter:
   - Email: `sujaan1919@gmail.com`
   - Password: `sujan.sujan`
4. Click **Login**

## Accessing the Admin Panel

Once logged in:
1. Navigate to `/admin` in your browser
2. You'll see the full admin dashboard with 6 tabs:
   - **Statistics** - System overview
   - **Users** - User management
   - **Features** - Feature flags
   - **Quotas** - Resource limits
   - **Audit Logs** - Activity tracking
   - **Settings** - Organization settings

## Re-running the Seed Script

If you need to verify your account or create it again:

```bash
npm run seed:admin
```

This script is **idempotent** - it will:
- ✅ Create the user if it doesn't exist
- ✅ Show existing credentials if the user already exists
- ✅ Not create duplicates

## Security Notes

⚠️ **Important:** This is a development setup. In production:
1. Use strong, unique passwords
2. Enable two-factor authentication
3. Implement proper password hashing (bcrypt)
4. Use environment variables for sensitive data
5. Enable IP whitelisting for admin access
6. Regularly rotate credentials

## Troubleshooting

### Can't login?
1. Verify the auth service is running (port 8006)
2. Check that the database is accessible
3. Ensure the password hashing method matches in auth service
4. Check browser console for errors

### Admin panel not showing?
1. Verify your role is ADMIN or OWNER
2. Check that admin-service is running (port 8009)
3. Verify gateway is proxying to admin service
4. Clear browser cache and cookies

### Need to reset password?
Run the seed script again or manually update in database:
```bash
npm run seed:admin
```

---

**Created:** 2026-02-05  
**Status:** ✅ Active and Ready to Use
