# MongoDB to Supabase Migration Guide

## ✅ COMPLETED MIGRATIONS

### 1. **Database Connection & Configuration**
- ✅ Replaced `backend/config/db.js` - MongoDB → Supabase client
- ✅ Updated `backend/utils/dbUtils.js` - PostgreSQL utilities
- ✅ Updated `backend/middleware/objectIdValidator.js` - UUID validation
- ✅ Removed `express-mongo-sanitize` dependency
- ✅ Added `@supabase/supabase-js` and `uuid` packages

### 2. **Server Configuration**
- ✅ Updated `backend/server.js`:
  - Removed all Mongoose/MongoDB imports
  - Replaced MongoDB health checks with Supabase
  - Updated connection monitoring
  - Updated graceful shutdown
  - Removed NoSQL injection middleware

### 3. **Authentication**
- ✅ Migrated `backend/controllers/authController.js`:
  - Signup with Supabase
  - Login with Supabase
  - Password reset flows
  - Token validation

### 4. **Database Schema**
- ✅ Created `backend/supabase-schema.sql` with complete PostgreSQL schema
- ✅ All tables with proper indexes and constraints
- ✅ Row Level Security (RLS) enabled
- ✅ Triggers for updated_at timestamps

### 5. **Models**
- ✅ Deleted all Mongoose models from `backend/models/`
- Schema now lives in Supabase (PostgreSQL)

---

## 🚀 SETUP INSTRUCTIONS

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```env
SUPABASE_URL=https://tjevjenlqumjortonceo.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_secure_jwt_secret_at_least_32_chars
```

### Step 3: Create Database Schema
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `backend/supabase-schema.sql`
3. Run the SQL script
4. Verify all tables were created

### Step 4: Test Connection
```bash
npm start
```

Check logs for: "✅ Supabase client initialized successfully"

---

## 📋 REMAINING CONTROLLER MIGRATIONS

The following controllers need to be migrated from MongoDB to Supabase patterns:

### Priority 1 (Critical - User Facing)
1. **assetController.js** - Asset CRUD operations
2. **userController.js** - User management
3. **dashboardController.js** - Dashboard statistics

### Priority 2 (Important)
4. **transactionController.js** - Asset transactions
5. **vendorController.js** - Vendor management
6. **maintenanceController.js** - Maintenance records
7. **approvalController.js** - Approval workflows
8. **notificationController.js** - Notifications

### Priority 3 (Supporting Features)
9. **assetRequestController.js**
10. **assetTransferController.js**
11. **assetIssueController.js**
12. **auditLogController.js**
13. **documentController.js**
14. **invoiceController.js**
15. **purchaseManagementController.js**
16. **reportsController.js**
17. **inventoryController.js**
18. **bulkOperationsController.js**
19. **settingsController.js**
20. **uploadController.js**
21. **exportImportController.js**
22. **scheduledAuditsController.js**
23. **qrScanController.js**
24. **photoController.js**
25. **backupController.js**
26. **automationController.js**
27. **vendorPortalController.js**
28. **userManagementController.js**
29. **vendorManagementController.js**
30. **customFiltersController.js**

---

## 🔄 MIGRATION PATTERN

### MongoDB → Supabase Conversion Guide

#### **Import Changes**
```javascript
// ❌ OLD (MongoDB)
const Asset = require('../models/asset');
const mongoose = require('mongoose');

// ✅ NEW (Supabase)
const getSupabase = require('../config/db');
```

#### **CREATE Operation**
```javascript
// ❌ OLD (MongoDB)
const asset = new Asset(assetData);
const saved = await asset.save();

// ✅ NEW (Supabase)
const supabase = getSupabase();
const { data: saved, error } = await supabase
  .from('assets')
  .insert([assetData])
  .select()
  .single();

if (error) throw error;
```

#### **READ Operations**
```javascript
// ❌ OLD (MongoDB)
// Find all
const assets = await Asset.find({ department: 'IT' });

// Find one by ID
const asset = await Asset.findById(id);

// Find one with conditions
const asset = await Asset.findOne({ unique_asset_id: assetId });

// ✅ NEW (Supabase)
const supabase = getSupabase();

// Find all with filter
const { data: assets, error } = await supabase
  .from('assets')
  .select('*')
  .eq('department', 'IT');

// Find one by ID
const { data: asset, error } = await supabase
  .from('assets')
  .select('*')
  .eq('id', id)
  .single();

// Find one with conditions
const { data: asset, error } = await supabase
  .from('assets')
  .select('*')
  .eq('unique_asset_id', assetId)
  .single();
```

#### **UPDATE Operation**
```javascript
// ❌ OLD (MongoDB)
const updated = await Asset.findByIdAndUpdate(
  id,
  { status: 'Active' },
  { new: true }
);

// ✅ NEW (Supabase)
const supabase = getSupabase();
const { data: updated, error } = await supabase
  .from('assets')
  .update({ status: 'Active' })
  .eq('id', id)
  .select()
  .single();
```

#### **DELETE Operation**
```javascript
// ❌ OLD (MongoDB)
await Asset.findByIdAndDelete(id);

// ✅ NEW (Supabase)
const supabase = getSupabase();
const { error } = await supabase
  .from('assets')
  .delete()
  .eq('id', id);
```

#### **Filtering & Querying**
```javascript
// ❌ OLD (MongoDB)
const assets = await Asset.find({
  status: 'Active',
  department: 'IT',
  purchase_cost: { $gte: 10000 }
}).sort({ created_at: -1 }).limit(10);

// ✅ NEW (Supabase)
const supabase = getSupabase();
const { data: assets, error } = await supabase
  .from('assets')
  .select('*')
  .eq('status', 'Active')
  .eq('department', 'IT')
  .gte('purchase_cost', 10000)
  .order('created_at', { ascending: false })
  .limit(10);
```

#### **Joins / Relations**
```javascript
// ❌ OLD (MongoDB)
const assets = await Asset.find()
  .populate('assigned_user')
  .populate('vendor');

// ✅ NEW (Supabase)
const supabase = getSupabase();
const { data: assets, error } = await supabase
  .from('assets')
  .select(`
    *,
    assigned_user:users!assigned_user(*),
    vendor:vendors(*)
  `);
```

#### **Aggregations**
```javascript
// ❌ OLD (MongoDB)
const count = await Asset.countDocuments({ status: 'Active' });

// ✅ NEW (Supabase)
const supabase = getSupabase();
const { count, error } = await supabase
  .from('assets')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'Active');
```

#### **Transactions** (when needed)
```javascript
// For complex multi-table operations, use RPC calls or handle in application logic
// Supabase supports PostgreSQL transactions through RPC functions
```

---

## 🔐 AUTHENTICATION NOTES

- JWT tokens remain the same
- Password hashing uses bcryptjs (unchanged)
- User IDs changed from MongoDB ObjectId to UUID
- Update any hardcoded ID references in frontend

---

## ⚠️ IMPORTANT CHANGES

1. **IDs**: MongoDB ObjectId (24 chars hex) → PostgreSQL UUID (36 chars)
2. **Timestamps**: 
   - MongoDB: `createdAt`, `updatedAt` (camelCase)
   - PostgreSQL: `created_at`, `updated_at` (snake_case)
3. **References**: Foreign keys are explicit in PostgreSQL schema
4. **Validation**: Moved from Mongoose schemas to PostgreSQL constraints
5. **Text Search**: MongoDB text indexes → PostgreSQL full-text search (if needed)

---

## 🧪 TESTING

After migrating each controller:
1. Test CREATE operation
2. Test READ operations (single & list)
3. Test UPDATE operation
4. Test DELETE operation
5. Test error handling
6. Test with invalid data
7. Verify audit logs (if applicable)

---

## 📞 TROUBLESHOOTING

### Error: "relation does not exist"
- Run the `supabase-schema.sql` script in Supabase SQL Editor

### Error: "role anon does not have permission"
- Use `SUPABASE_SERVICE_ROLE_KEY` instead of `SUPABASE_ANON_KEY`
- Check RLS policies in Supabase dashboard

### Error: "JWT malformed"
- Verify `JWT_SECRET` is set correctly in `.env`
- Check token format in Authorization header

### Error: "Failed to fetch"
- Verify `SUPABASE_URL` is correct
- Check network connectivity
- Verify Supabase project is active

---

## 🎯 MIGRATION CHECKLIST

- [x] Database connection migrated
- [x] Server.js updated
- [x] Auth controller migrated
- [x] Middleware updated
- [x] Schema created in Supabase
- [x] Environment variables configured
- [ ] Asset controller migrated
- [ ] User controller migrated
- [ ] Dashboard controller migrated
- [ ] All other controllers migrated
- [ ] Frontend API calls updated (if needed)
- [ ] Integration testing completed
- [ ] Production deployment ready

---

## 📚 REFERENCES

- [Supabase JS Client Docs](https://supabase.com/docs/reference/javascript/introduction)
- [PostgreSQL Data Types](https://www.postgresql.org/docs/current/datatype.html)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
