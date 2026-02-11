# 🎯 QUICK START GUIDE - Supabase Migration

## ⚡ 5-MINUTE SETUP

### 1. Install Dependencies (1 min)
```bash
cd backend
npm install
```

Expected output: `added 12 packages, removed 24 packages`

### 2. Create Database Schema (2 min)

1. Go to https://supabase.com/dashboard
2. Open your project: `Online-Dead-Stock-Register`
3. Navigate to: **SQL Editor** (left sidebar)
4. Click: **New Query**
5. Copy entire contents of `backend/supabase-schema.sql`
6. Paste and click **Run**

✅ Success if you see: "Success. No rows returned"

Verify tables created:
- Go to **Table Editor** → You should see all tables (users, assets, vendors, etc.)

### 3. Get Supabase Credentials (1 min)

In Supabase Dashboard:
1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** → e.g., `https://tjevjenlqumjortonceo.supabase.co`
   - **anon public** key (optional for backend)
   - **service_role** key ⚠️ IMPORTANT (full access for backend)

### 4. Configure Environment (1 min)

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
SUPABASE_URL=https://tjevjenlqumjortonceo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...YOUR_KEY
JWT_SECRET=your_random_32plus_character_secret_key_here_make_it_long
ALLOWED_ORIGINS=http://localhost:3000
```

💡 Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🚀 START SERVER

```bash
npm start
```

### ✅ Expected Logs
```
✅ Supabase client initialized successfully
📊 Database: PostgreSQL via Supabase
✅ Database connection test successful
✅ Server running on port 5000
🔍 Supabase connection health monitor started (checks every 60s)
```

### ❌ If You See Errors

**Error: "SUPABASE_URL is not defined"**
```bash
# Fix: Add SUPABASE_URL to .env
```

**Error: "relation 'users' does not exist"**
```bash
# Fix: Run supabase-schema.sql in Supabase SQL Editor
```

**Error: "JWT_SECRET is not set"**
```bash
# Fix: Add JWT_SECRET to .env (min 32 characters)
```

---

## 🧪 TEST AUTHENTICATION

### Register New User
```bash
POST http://localhost:5000/api/v1/auth/register

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Test@1234",
  "department": "IT",
  "role": "ADMIN"
}
```

**Expected Response:**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "john@example.com",
    "role": "ADMIN",
    "name": "John Doe",
    "department": "IT"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6Ik..."
}
```

### Login
```bash
POST http://localhost:5000/api/v1/auth/login

{
  "email": "john@example.com",
  "password": "Test@1234"
}
```

### Test Protected Route (Health Check)
```bash
GET http://localhost:5000/health
```

**Expected Response:**
```json
{
  "uptime": 123.45,
  "status": "OK",
  "checks": {
    "database": {
      "status": "connected",
      "responseTime": "45ms",
      "type": "PostgreSQL (Supabase)"
    }
  }
}
```

---

## 📋 VERIFY SETUP CHECKLIST

- [ ] Dependencies installed (no errors)
- [ ] Supabase schema deployed (tables visible in dashboard)
- [ ] .env file configured (3 required variables)
- [ ] Server starts without errors
- [ ] Health check returns "database: connected"
- [ ] User registration works
- [ ] User login works
- [ ] JWT token generated

---

## 🔄 WHAT'S WORKING NOW

### ✅ Fully Functional
- ✅ Database connection (Supabase PostgreSQL)
- ✅ Server initialization
- ✅ Health monitoring
- ✅ Authentication (signup, login, password reset)
- ✅ JWT token generation and validation
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Request logging
- ✅ Error handling

### ⚠️ Needs Migration (Will Return Errors)
- ❌ Asset management endpoints (`/api/v1/assets/*`)
- ❌ User management endpoints (`/api/v1/users/*`)
- ❌ Dashboard endpoints (`/api/v1/dashboard/*`)
- ❌ All other business logic controllers

These will throw errors like:
```
Cannot read property 'find' of undefined
OR
[ModelName] is not a constructor
```

**Solution:** Follow `MIGRATION_GUIDE.md` to migrate controllers.

---

## 📖 NEXT STEPS AFTER SETUP

### Priority 1: Migrate Core Controllers (Start Here)
1. **userController.js** - Use `userController.EXAMPLE.js` as template
2. **assetController.js** - Critical for application
3. **dashboardController.js** - Homepage stats

### How to Migrate One Controller
1. Open controller file
2. Open `userController.EXAMPLE.js` as reference
3. Replace MongoDB model imports with `getSupabase()`
4. Replace all `.find()`, `.findById()`, `.save()` etc. (see patterns in MIGRATION_GUIDE.md)
5. Test endpoint with Postman/Thunder Client
6. ✅ Mark as complete

---

## 🆘 NEED HELP?

### Documentation Files
- `MIGRATION_STATUS.md` - Overall progress tracker
- `MIGRATION_GUIDE.md` - Detailed conversion patterns
- `userController.EXAMPLE.js` - Complete reference implementation
- `supabase-schema.sql` - Database schema

### Common Issues

**"Why is /api/v1/assets returning 500 error?"**
→ Controller still uses MongoDB models, needs migration

**"Can I use both MongoDB and Supabase temporarily?"**
→ Not recommended. Migrate one feature at a time and test.

**"How do I rollback if something breaks?"**
→ Use git branches: `git checkout mongodb-legacy` to restore old code

**"Where do I see Supabase data?"**
→ Supabase Dashboard → Table Editor

---

## 🎉 SUCCESS!

If you can:
1. ✅ Start server without errors
2. ✅ Register a new user
3. ✅ Login with that user
4. ✅ Get a JWT token

**You're ready to migrate the remaining controllers!**

Use the example controller and migration guide as your blueprint.

---

## 💡 PRO TIPS

1. **Test Each Controller After Migration**
   - Don't migrate all at once
   - Test CRUD operations individually

2. **Use Supabase Dashboard**
   - Inspect data in real-time
   - Run SQL queries directly
   - Monitor logs

3. **Keep Migration Log**
   - Mark controllers as ✅ done in MIGRATION_STATUS.md
   - Note any issues encountered

4. **Backup Before Major Changes**
   ```bash
   git add .
   git commit -m "Checkpoint: [feature] migrated"
   ```

---

**Ready? Start with the server! 🚀**

```bash
npm start
```
