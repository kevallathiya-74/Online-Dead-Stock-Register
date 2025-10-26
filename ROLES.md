# Role-Based Access Control Documentation

## Overview
The Online Dead Stock Register implements a three-tier role-based access control (RBAC) system with comprehensive authentication and authorization features.

## User Roles

### 1. ADMIN
**Full System Access** - Complete control over all aspects of the system

#### Permissions:
- **User Management**: Create, edit, delete users; manage roles and departments
- **Asset Management**: Full CRUD operations on all assets
- **System Configuration**: Modify system settings, backup/restore data
- **Audit & Compliance**: View audit logs, generate compliance reports
- **Analytics**: Access all reports and analytics dashboards
- **Approvals**: Override or manage all approval workflows
- **Vendor Management**: Full vendor CRUD operations
- **Maintenance**: View and manage all maintenance schedules
- **Purchase Orders**: View all purchase orders and budgets

#### Navigation Menu:
```
- Dashboard
- User Management
  - All Users
  - Add User
- Asset Management
  - All Assets
  - Add Asset
  - Categories
- Dead Stock
  - Dead Stock Items
  - Disposal Records
- Reports & Analytics
  - Asset Reports
  - Disposal Reports
  - Audit Logs
- System Settings
```

#### Protected Routes:
- `/admin/*` - All admin routes
- `/admin/users` - User management
- `/admin/audit-logs` - Audit logs
- `/admin/analytics` - Advanced analytics
- `/admin/settings` - System settings
- `/admin/backups` - Backup management
- All Inventory Manager routes (inherited)
- All Employee routes (inherited)

---

### 2. INVENTORY_MANAGER
**Asset & Inventory Management** - Manages assets, vendors, maintenance, and purchase orders

#### Permissions:
- **Asset Management**: Create, edit, view assets; manage transfers
- **Maintenance**: Schedule and track maintenance activities
- **Vendor Management**: Manage vendor relationships and contracts
- **Purchase Orders**: Create and track purchase orders, manage invoices
- **Reports**: Generate asset, maintenance, and vendor reports
- **Approvals**: Approve asset transfers, purchase requests, maintenance requests
- **Labels & QR Codes**: Generate and print asset labels
- **Bulk Operations**: Import/export asset data

#### Navigation Menu:
```
- Dashboard
- Asset Management
  - View Assets
  - Add Asset
  - Transfers
  - Labels
  - Bulk Import
  - Maintenance
- Purchase Orders
  - Orders
  - Vendors
  - Invoices
- Maintenance
  - Schedule
  - Warranty
  - Scrap Management
- Reports
  - All Reports
  - Asset Reports
  - Maintenance Reports
  - Vendor Reports
- My Approvals
```

#### Protected Routes:
- `/assets/*` - Asset management pages
- `/vendors/*` - Vendor management
- `/maintenance/*` - Maintenance scheduling
- `/reports/*` - Report generation
- `/purchase-orders/*` - Purchase order management
- `/locations/*` - Location management
- `/approvals/*` - Approval management
- All Employee routes (inherited)

---

### 3. EMPLOYEE
**Personal Asset Management** - View assigned assets and submit requests

#### Permissions:
- **My Assets**: View assets assigned to them
- **Requests**: Submit asset requests, maintenance requests
- **Profile**: View and edit personal profile
- **History**: View personal transaction history
- **Help**: Access help documentation and support

#### Navigation Menu:
```
- Dashboard
- My Assets
- My Requests
  - New Request
  - View Requests
- My Profile
- Help & Support
```

#### Protected Routes:
- `/dashboard` - Personal dashboard
- `/employee/my-assets` - View assigned assets
- `/employee/requests` - Submit and view requests
- `/employee/profile` - Personal profile
- `/employee/help` - Help and support

---

## Role Hierarchy

```
ADMIN (Full Access)
  ├── All Admin-only features
  ├── INVENTORY_MANAGER features (inherited)
  └── EMPLOYEE features (inherited)

INVENTORY_MANAGER (Asset Management)
  ├── Asset & Inventory Management
  ├── Vendor & Purchase Management
  ├── Maintenance & Reports
  └── EMPLOYEE features (inherited)

EMPLOYEE (Basic Access)
  └── View personal assets and submit requests
```

---

## Departments

The system supports three departments:
1. **INVENTORY** - Inventory and asset management staff
2. **IT** - Information technology department
3. **ADMIN** - Administrative staff

Note: Departments are informational and do not affect access permissions (role determines access).

---

## Authentication Flow

### 1. Registration
```typescript
POST /api/auth/signup
Body: {
  email: string,
  password: string,
  full_name: string,
  role: "ADMIN" | "INVENTORY_MANAGER" | "EMPLOYEE",
  department: "INVENTORY" | "IT" | "ADMIN"
}
Response: {
  user: { id, email, role, name, department },
  token: string (JWT, 8-hour expiration)
}
```

### 2. Login
```typescript
POST /api/auth/login
Body: {
  email: string,
  password: string
}
Response: {
  user: { id, email, role, name, department },
  token: string (JWT, 8-hour expiration)
}
```

### 3. Token Management
- JWT tokens stored in localStorage
- Token includes: user ID, email, role
- Token expiration: 8 hours
- Auto-logout on token expiration
- Token included in all API requests via `Authorization: Bearer <token>` header

### 4. Route Protection
```typescript
// Public routes (no authentication)
/ (home)
/login
/register
/forgot-password
/reset-password/:token

// Protected routes (authenticated users)
/dashboard - All authenticated users
/employee/* - All authenticated users

// Role-specific routes
/admin/* - ADMIN only
/assets/* - ADMIN, INVENTORY_MANAGER
/vendors/* - ADMIN, INVENTORY_MANAGER
/maintenance/* - ADMIN, INVENTORY_MANAGER
/reports/* - ADMIN, INVENTORY_MANAGER
/purchase-orders/* - ADMIN, INVENTORY_MANAGER
/approvals/* - ADMIN, INVENTORY_MANAGER
```

---

## Backend Middleware

### Authentication Middleware (`authMiddleware.js`)
```javascript
const protect = async (req, res, next) => {
  // Validates JWT token from Authorization header
  // Attaches user object to req.user
  // Returns 401 if token invalid or expired
}

const requireRole = (roles) => {
  // Checks if req.user.role is in allowed roles array
  // Returns 403 if user doesn't have required role
}
```

### Usage Example:
```javascript
// Protect route with authentication
router.get('/api/assets', protect, getAssets);

// Protect route with role requirement
router.post('/api/users', protect, requireRole(['ADMIN']), createUser);

// Multiple roles allowed
router.get('/api/reports', protect, requireRole(['ADMIN', 'INVENTORY_MANAGER']), getReports);
```

---

## Frontend Route Protection

### ProtectedRoute Component
```tsx
<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />
```

**Behavior:**
1. Checks if user is authenticated
2. Shows loading spinner while verifying
3. Redirects to `/login` if not authenticated
4. Checks if user role matches allowedRoles (if specified)
5. Redirects to `/dashboard` if role doesn't match
6. Renders protected route if authorized

---

## Navigation System

### Implementation (`src/utils/navigation.ts`)
```typescript
export const getNavigationForRole = (role: UserRole): NavigationItem[] => {
  switch (role) {
    case UserRole.ADMIN:
      return adminNavigation;
    case UserRole.INVENTORY_MANAGER:
      return inventoryManagerNavigation;
    case UserRole.EMPLOYEE:
      return employeeNavigation;
    default:
      return employeeNavigation;
  }
};
```

### Navigation Item Structure:
```typescript
interface NavigationItem {
  id: string;
  title: string;
  path: string;
  icon: MaterialUIIcon;
  children?: NavigationItem[];
}
```

---

## Dashboard Components

### Admin Dashboard (`AdminDashboard.tsx`)
**Features:**
- System statistics overview
- User management quick actions
- Recent activity feed
- Pending approvals summary
- Quick access to admin functions

### Inventory Manager Dashboard (`InventoryManagerDashboard.tsx`)
**Features:**
- Asset statistics by location
- Warranty expiration alerts
- Maintenance schedule overview
- Top vendors performance
- Pending approvals for inventory actions

### Employee Dashboard (`EmployeeDashboard.tsx`)
**Features:**
- My assigned assets
- Recent asset history
- Maintenance request status
- Quick actions for asset requests
- Personal notifications

---

## Security Best Practices

### Backend Security:
1. **Password Hashing**: bcryptjs with 10 salt rounds
2. **JWT Signing**: HS256 algorithm with secure secret
3. **Input Sanitization**: Custom middleware for XSS prevention
4. **Rate Limiting**: 100 requests per 15 minutes per IP
5. **CORS**: Configured for frontend origin only
6. **Helmet**: Security headers middleware
7. **MongoDB**: Connection with TLS/SSL encryption

### Frontend Security:
1. **Token Storage**: JWT stored securely in localStorage
2. **Auto-logout**: On token expiration
3. **Route Guards**: ProtectedRoute component with role checking
4. **API Calls**: All requests include Authorization header
5. **Error Handling**: Sanitized error messages to users

---

## Testing Role-Based Access

### Create Test Users:

#### 1. Create ADMIN user:
```bash
cd backend
node createUser.js admin@company.com Admin@123 "System Admin" ADMIN ADMIN
```

#### 2. Create INVENTORY_MANAGER user:
```bash
node createUser.js manager@company.com Manager@123 "Inventory Manager" INVENTORY_MANAGER INVENTORY
```

#### 3. Create EMPLOYEE user:
```bash
node createUser.js employee@company.com Employee@123 "John Employee" EMPLOYEE INVENTORY
```

### Test Scenarios:

#### Test 1: EMPLOYEE Access
1. Login as employee@company.com
2. Verify dashboard shows only employee features
3. Verify navigation menu shows: Dashboard, My Assets, My Requests, My Profile, Help
4. Try accessing `/admin/users` → Should redirect to `/dashboard`
5. Try accessing `/assets` → Should redirect to `/dashboard`

#### Test 2: INVENTORY_MANAGER Access
1. Login as manager@company.com
2. Verify dashboard shows asset management features
3. Verify navigation menu includes: Assets, Vendors, Maintenance, Reports, Approvals
4. Try accessing `/admin/users` → Should redirect to `/dashboard`
5. Verify can access `/assets` → Should work

#### Test 3: ADMIN Access
1. Login as admin@company.com
2. Verify dashboard shows all system statistics
3. Verify navigation menu includes all items (User Management, System Settings, Audit Logs)
4. Verify can access `/admin/users` → Should work
5. Verify can access `/assets` → Should work
6. Verify can access `/employee/my-assets` → Should work

---

## Troubleshooting

### Common Issues:

#### 1. "Role mismatch between backend and frontend"
**Problem**: Backend returns lowercase role, frontend expects uppercase
**Solution**: Backend updated to return uppercase roles (ADMIN, INVENTORY_MANAGER, EMPLOYEE)

#### 2. "User redirected to dashboard after login but no content shown"
**Problem**: Role-based dashboard routing not working
**Solution**: Verify Dashboard.tsx has proper switch statement for user.role

#### 3. "Navigation menu shows all items regardless of role"
**Problem**: DashboardLayout not calling getNavigationForRole()
**Solution**: Verify DashboardLayout.tsx calls `getNavigationForRole(user.role)`

#### 4. "Token expired but user not logged out"
**Problem**: AuthContext not checking token expiration
**Solution**: Backend returns 401 for expired tokens, frontend should catch and logout

#### 5. "Duplicate keys in React components"
**Problem**: Navigation items have duplicate IDs
**Solution**: Fixed in navigation.ts - ensured unique IDs for all navigation items

---

## API Endpoints & Permissions

### Authentication (Public):
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password

### Users (ADMIN only):
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Assets (ADMIN, INVENTORY_MANAGER):
- `GET /api/assets` - List assets
- `POST /api/assets` - Create asset
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Delete asset
- `POST /api/assets/transfer` - Transfer asset

### Vendors (ADMIN, INVENTORY_MANAGER):
- `GET /api/vendors` - List vendors
- `POST /api/vendors` - Create vendor
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Delete vendor

### Maintenance (ADMIN, INVENTORY_MANAGER):
- `GET /api/maintenance` - List maintenance records
- `POST /api/maintenance` - Create maintenance record
- `PUT /api/maintenance/:id` - Update maintenance record

### Reports (ADMIN, INVENTORY_MANAGER):
- `GET /api/reports/assets` - Asset reports
- `GET /api/reports/maintenance` - Maintenance reports
- `GET /api/reports/vendors` - Vendor reports

### Purchase Orders (ADMIN, INVENTORY_MANAGER):
- `GET /api/purchase-orders` - List purchase orders
- `POST /api/purchase-orders` - Create purchase order
- `PUT /api/purchase-orders/:id` - Update purchase order

### Approvals (ADMIN, INVENTORY_MANAGER):
- `GET /api/approvals` - List pending approvals
- `POST /api/approvals/:id/approve` - Approve request
- `POST /api/approvals/:id/reject` - Reject request

### Employee Requests (All authenticated users):
- `GET /api/employee/my-assets` - Get my assigned assets
- `POST /api/employee/requests` - Submit asset request
- `GET /api/employee/requests` - Get my requests

### Audit Logs (ADMIN only):
- `GET /api/admin/audit-logs` - View all audit logs
- `GET /api/admin/audit-logs/user/:userId` - View user-specific logs

---

## Development Notes

### Adding New Roles:
1. Update `src/types/index.ts` - Add role to UserRole enum
2. Update `backend/models/user.js` - Add role to enum validation
3. Update `src/utils/navigation.ts` - Create navigation array for new role
4. Update `getNavigationForRole()` function with new case
5. Create dashboard component for new role
6. Update `src/pages/dashboard/Dashboard.tsx` with new case
7. Add protected routes in `src/App.tsx`
8. Update this documentation

### Adding New Permissions:
1. Identify the feature/resource
2. Update navigation.ts to add menu items to appropriate role(s)
3. Create React component/page for the feature
4. Add route in App.tsx with appropriate allowedRoles
5. Create backend API endpoint with protect + requireRole middleware
6. Test with users of each role

---

## Version History

### v1.0.0 (Current)
- Initial role-based access control implementation
- Three roles: ADMIN, INVENTORY_MANAGER, EMPLOYEE
- JWT authentication with 8-hour expiration
- Role-based navigation menus
- Protected routes with role checking
- Backend authorization middleware

### Changes from Previous Version:
- Removed AUDITOR role (deprecated)
- Fixed duplicate navigation keys
- Updated employee navigation to use /employee/* paths
- Consolidated asset management menu items
- Fixed async/await issues in dashboard data loading
- Updated authentication to return uppercase roles

---

## Contact & Support

For issues related to role-based access control:
1. Check this documentation first
2. Review console logs for authentication errors
3. Verify JWT token is valid and not expired
4. Check backend logs for authorization failures
5. Ensure user role matches route requirements

---

**Last Updated**: January 2025
**Maintained By**: Development Team
**Version**: 1.0.0
