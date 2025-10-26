# Test User Accounts — Login Credentials

This document contains test user accounts for all roles in the Online Dead Stock Register system.

## Quick Reference

| Role | Email | Password | Department |
|------|-------|----------|------------|
| **ADMIN** | admin@test.com | admin123 | ADMIN |
| **INVENTORY_MANAGER** | inventory@test.com | inventory123 | INVENTORY |
| **INVENTORY_MANAGER** | it.manager@test.com | itmanager123 | IT |
| **AUDITOR** | auditor@test.com | auditor123 | ADMIN |
| **EMPLOYEE** | employee1@test.com | employee123 | INVENTORY |
| **EMPLOYEE** | employee2@test.com | employee123 | IT |
| **VENDOR** | vendor@test.com | vendor123 | VENDOR |

## User Roles & Permissions

### 1. ADMIN
**Account:** admin@test.com / admin123

**Permissions:**
- Full system access
- User management (create, read, update, delete)
- Asset management (create, read, update, delete)
- Approval management (create, read, update, delete)
- Report generation and export
- System settings, backup, logs, configuration
- Document management
- Vendor management

**Use Cases:**
- System administration
- User account creation and management
- System configuration
- Full reporting access

---

### 2. INVENTORY_MANAGER
**Accounts:**
- inventory@test.com / inventory123 (Inventory Department)
- it.manager@test.com / itmanager123 (IT Department)

**Permissions:**
- View users (read-only)
- Asset management (create, read, update - no delete)
- Approval management (create, read, update - limited types)
- Report generation and export
- Document management (create, read, update)
- Full vendor management (create, read, update, delete)

**Use Cases:**
- Inventory tracking and management
- Asset assignment and transfers
- Vendor coordination
- Inventory reporting

---

### 3. AUDITOR
**Account:** auditor@test.com / auditor123

**Permissions:**
- View users (read-only)
- View assets (read-only)
- View approvals (read-only)
- Report generation and export
- View system logs
- View documents (read-only)
- View vendor information (read-only)

**Use Cases:**
- Asset auditing
- Compliance verification
- Discrepancy reporting
- Audit trail review

---

### 4. EMPLOYEE
**Accounts:**
- employee1@test.com / employee123 (Inventory Department)
- employee2@test.com / employee123 (IT Department)

**Permissions:**
- View own assets (read-only)
- Create and view own approval requests
- View own documents (read-only)
- View vendor information (read-only)

**Use Cases:**
- Submit asset requests
- View assigned assets
- Track request status

---

### 5. VENDOR
**Account:** vendor@test.com / vendor123

**Permissions:**
- View linked assets (read-only)
- View own documents (read-only)
- View own vendor profile (read-only)

**Use Cases:**
- View purchase orders
- Upload invoices and documents
- Track order status
- View asset information for supplied items

---

## How to Create Additional Users

### Using the Seed Script
```powershell
cd backend
node seed/seedUsers.js
```

### Using the createUser Script
```powershell
cd backend
node createUser.js <email> <password> <name> <role> <department>
```

**Example:**
```powershell
node createUser.js john@test.com password123 "John Doe" EMPLOYEE IT
```

**Valid Roles:**
- ADMIN
- INVENTORY_MANAGER
- EMPLOYEE
- AUDITOR
- VENDOR

**Valid Departments:**
- ADMIN
- INVENTORY
- IT
- VENDOR

---

## Testing Different Scenarios

### Admin Workflows
Login as: `admin@test.com` / `admin123`
- Create new users
- Manage all assets
- Configure system settings
- Generate comprehensive reports

### Inventory Management Workflows
Login as: `inventory@test.com` / `inventory123`
- Create and assign assets
- Process asset requests
- Manage vendors
- Generate inventory reports

### Audit Workflows
Login as: `auditor@test.com` / `auditor123`
- Perform asset audits
- Review compliance metrics
- Check discrepancies
- Export audit reports

### Employee Self-Service
Login as: `employee1@test.com` / `employee123`
- Submit asset requests
- View assigned assets
- Track request approvals

### Vendor Portal
Login as: `vendor@test.com` / `vendor123`
- View purchase orders
- Track order status
- Upload documents

---

## Security Notes

⚠️ **Important:** These are TEST accounts for development/demonstration purposes only.

- **DO NOT** use these credentials in production
- Change default passwords before deploying to production
- Implement proper password policies (complexity, expiration, etc.)
- Enable multi-factor authentication for production environments
- Regularly audit user access and permissions

---

## Resetting All Test Accounts

If you need to recreate all test accounts:

1. Delete existing test users (optional):
```javascript
// In MongoDB shell or backend script
db.users.deleteMany({ email: { $regex: "@test.com$" } });
```

2. Run the seed script again:
```powershell
cd backend
node seed/seedUsers.js
```

---

## Troubleshooting

### "User already exists" error
- Test accounts are already created in the database
- Script will skip existing users automatically
- To recreate, delete the user from MongoDB first

### Login fails
- Verify MongoDB connection is active
- Check backend server is running on port 5000
- Ensure frontend is configured to connect to `http://localhost:5000/api`
- Check browser console for CORS or network errors

### Permission denied errors
- Verify the user's role has the required permissions
- Check `src/utils/permissions.ts` for role configurations
- Ensure JWT token is valid and not expired

---

## Database Connection

Users are stored in MongoDB. Connection string is configured in:
- `backend/.env` → `MONGODB_URI`

Default local connection:
```
mongodb://localhost:27017/dead-stock-register
```

---

## Additional Resources

- User Model: `backend/models/user.js`
- Permissions Config: `src/utils/permissions.ts`
- Role Definitions: `src/types/index.ts`
- Auth Controller: `backend/controllers/authController.js`

---

Last Updated: October 27, 2025
