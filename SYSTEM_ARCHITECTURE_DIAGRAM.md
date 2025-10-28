# Online Dead Stock Register - Complete System Architecture

## 📊 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER (Frontend)                           │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Browser    │  │    React     │  │  TypeScript  │  │ Material-UI  │     │
│  │  (Chrome,    │  │    18.x      │  │     5.x      │  │    5.14.x    │     │
│  │  Firefox)    │  │              │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         User Interface Layer                          │  │
│  │                                                                       │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │  │
│  │  │  Login  │  │  Admin  │  │ Auditor │  │Employee │  │ Vendor  │      │  │
│  │  │  Pages  │  │  Pages  │  │  Pages  │  │  Pages  │  │  Pages  │      │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    ↕                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      Component Layer                                  │  │
│  │                                                                       │  │
│  │  Layout Components    │  Feature Components    │  Common Components   │  │
│  │  • DashboardLayout    │  • AssetTable          │  • Modals            │  │
│  │  • Sidebar            │  • AuditList           │  • Forms             │  │
│  │  • Header             │  • ApprovalCards       │  • Charts            │  │
│  │  • Footer             │  • UserManagement      │  • DataGrids         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    ↕                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    State Management Layer                             │  │
│  │                                                                       │  │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐             │  │
│  │  │ AuthContext  │    │ModalContext │    │  Redux Store │              │  │
│  │  │ (User State) │    │(Modal State)│    │ (App State)  │              │  │
│  │  └──────────────┘    └──────────────┘    └──────────────┘             │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    ↕                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      Service Layer (API Calls)                        │  │
│  │                                                                       │  │
│  │  auditorService  │  assetService  │  authService  │  userService      │  │
│  │  vendorService   │  approvalService │  documentService                │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    ↕                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    HTTP Client (Axios)                                │  │
│  │  • JWT Token Management  • Request Interceptors                       │  │
│  │  • Error Handling        • Response Interceptors                      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↕ HTTP/HTTPS
                                     ↕ REST API
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NETWORK LAYER                                     │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    API Gateway (Express Router)                       │  │
│  │                                                                       │  │
│  │  Port 5000 │ CORS Enabled │ Body Parser │ Cookie Parser               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↕
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SERVER LAYER (Backend)                              │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Node.js    │  │   Express    │  │   MongoDB    │  │    Multer    │     │
│  │   v22.18.0   │  │    4.18.2    │  │   Mongoose   │  │  (File Upl.) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         Middleware Layer                              │  │
│  │                                                                       │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │  │
│  │  │ authMiddleware   │  │ uploadMiddleware │  │ errorMiddleware  │     │  │
│  │  │ • JWT Verify     │  │ • File Storage   │  │ • Error Handler  │     │  │
│  │  │ • Role Check     │  │ • File Filter    │  │ • Logger         │     │  │
│  │  │ • Token Refresh  │  │ • Size Limit     │  │ • Status Codes   │     │  │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘     │  │
│  └───────────────────────────────────────────────────────────────────────┘  │  
│                                    ↕                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         Routes Layer                                  │  │
│  │                                                                       │  │
│  │  /auth          │  /assets        │  /users          │  /approvals    │  │
│  │  /auditor       │  /vendors       │  /documents      │  /maintenance  │  │
│  │  /dashboard     │  /transactions  │  /notifications  │  /upload       │  │
│  │  /export-import │  /asset-requests│  /asset-transfers│  /audit-logs   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    ↕                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      Controller Layer                                 │  │
│  │                                                                       │  │
│  │  authController         │  assetController        │  userController   │  │
│  │  auditorController      │  approvalController     │  vendorController │  │
│  │  dashboardController    │  documentController     │  uploadController │  │
│  │  exportImportController │  maintenanceController  │  auditLogCtrl     │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    ↕                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        Model Layer (Mongoose)                         │  │
│  │                                                                       │  │
│  │  User    │  Asset   │  Approval  │  Vendor   │  Document              │  │
│  │  Transaction │  Maintenance │  Notification │  PurchaseOrder          │  │
│  │  AuditLog    │  AssetRequest│  AssetTransfer│  PurchaseRequest        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↕
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                                      │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      MongoDB Atlas (Cloud)                            │  │
│  │                                                                       │  │
│  │  Collections:                                                         │  │
│  │  • users          • assets          • approvals      • vendors        │  │
│  │  • transactions   • maintenances    • notifications  • documents      │  │
│  │  • auditlogs      • assetrequests   • assettransfers                  │  │
│  │  • purchaseorders • purchaserequests                                  │  │
│  │                                                                       │  │
│  │  Features: Auto-backup, Replication, Sharding, Indexes                │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↕
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FILE STORAGE LAYER                                  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      Local File System                                │  │
│  │                                                                       │  │
│  │  uploads/                                                             │  │
│  │  ├── documents/      (User documents, PDFs, contracts)                │  │
│  │  ├── asset-images/   (Asset photos, QR codes)                         │  │
│  │  └── temp/           (Import files - auto-deleted)                    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete User Workflow Diagram

### Workflow 1: User Authentication & Authorization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION WORKFLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

User                Frontend              API Gateway         Controller        Database
  │                    │                      │                   │               │
  │  1. Enter          │                      │                   │               │
  │  credentials       │                      │                   │               │
  ├──────────────────> │                      │                   │               │
  │                    │                      │                   │               │
  │                    │  2. POST /auth/login │                   │               │
  │                    ├─────────────────────>│                   │               │
  │                    │                      │                   │               │
  │                    │                      │  3. Validate      │               │
  │                    │                      │  credentials      │               │
  │                    │                      ├──────────────────>│               │
  │                    │                      │                   │               │
  │                    │                      │                   │  4. Query     │
  │                    │                      │                   │  user         │
  │                    │                      │                   ├──────────────>│
  │                    │                      │                   │               │
  │                    │                      │                   │  5. User data │
  │                    │                      │                   │<──────────────┤
  │                    │                      │                   │               │
  │                    │                      │  6. Generate JWT  │               │
  │                    │                      │  (12hr expiry)    │               │
  │                    │                      │<──────────────────┤               │
  │                    │                      │                   │               │
  │                    │  7. Return token +   │                   │               │
  │                    │  user data           │                   │               │
  │                    │<─────────────────────┤                   │               │
  │                    │                      │                   │               │
  │  8. Store token    │                      │                   │               │
  │  in localStorage   │                      │                   │               │
  │<───────────────────┤                      │                   │               │
  │                    │                      │                   │               │
  │  9. Redirect to    │                      │                   │               │
  │  role-based        │                      │                   │               │
  │  dashboard         │                      │                   │               │
  │<───────────────────┤                      │                   │               │
  │                    │                      │                   │               │

Success: User logged in, token stored, redirected to dashboard
Failure: Invalid credentials → Show error message → Retry
```

### Workflow 2: Asset Audit Process (Auditor Role)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ASSET AUDIT WORKFLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

Auditor           Frontend            Service Layer        Backend API       Database
  │                  │                     │                   │                │
  │  1. Navigate to  │                     │                   │                │
  │  Audit List Page │                     │                   │                │
  ├────────────────> │                     │                   │                │
  │                  │                     │                   │                │
  │                  │  2. Load audit data │                   │                │
  │                  ├────────────────────>│                   │                │
  │                  │                     │                   │                │
  │                  │                     │  3. GET           │                │
  │                  │                     │  /auditor/        │                │
  │                  │                     │  audit-items      │                │
  │                  │                     ├──────────────────>│                │
  │                  │                     │                   │                │
  │                  │                     │                   │  4. Fetch all  │
  │                  │                     │                   │  assets        │
  │                  │                     │                   ├───────────────>│
  │                  │                     │                   │                │
  │                  │                     │                   │  5. Asset list │
  │                  │                     │                   │<───────────────┤
  │                  │                     │                   │                │
  │                  │                     │  6. Format &      │                │
  │                  │                     │  return data      │                │
  │                  │                     │<──────────────────┤                │
  │                  │                     │                   │                │
  │                  │  7. Update state    │                   │                │
  │                  │<────────────────────┤                   │                │
  │                  │                     │                   │                │
  │  8. Display      │                     │                   │                │
  │  audit table     │                     │                   │                │
  │<─────────────────┤                     │                   │                │
  │                  │                     │                   │                │
  │  9. Click Edit   │                     │                   │                │
  │  on asset        │                     │                   │                │
  ├────────────────> │                     │                   │                │
  │                  │                     │                   │                │
  │  10. Edit Dialog │                     │                   │                │
  │  opens           │                     │                   │                │
  │<─────────────────┤                     │                   │                │
  │                  │                     │                   │                │
  │  11. Update      │                     │                   │                │
  │  condition,      │                     │                   │                │
  │  status, notes   │                     │                   │                │
  ├────────────────> │                     │                   │                │
  │                  │                     │                   │                │
  │                  │  12. Submit update  │                   │                │
  │                  ├────────────────────>│                   │                │
  │                  │                     │                   │                │
  │                  │                     │  13. PUT          │                │
  │                  │                     │  /assets/:id      │                │
  │                  │                     ├──────────────────>│                │
  │                  │                     │                   │                │
  │                  │                     │                   │  14. Update    │
  │                  │                     │                   │  asset record  │
  │                  │                     │                   ├───────────────>│
  │                  │                     │                   │                │
  │                  │                     │                   │  15. Confirm   │
  │                  │                     │                   │<───────────────┤
  │                  │                     │                   │                │
  │                  │                     │                   │  16. Create    │
  │                  │                     │                   │  audit log     │
  │                  │                     │                   ├───────────────>│
  │                  │                     │                   │                │
  │                  │                     │  17. Success      │                │
  │                  │                     │<──────────────────┤                │
  │                  │                     │                   │                │
  │                  │  18. Update UI      │                   │                │
  │                  │<────────────────────┤                   │                │
  │                  │                     │                   │                │
  │  19. Show toast  │                     │                   │                │
  │  notification    │                     │                   │                │
  │<─────────────────┤                     │                   │                │
  │                  │                     │                   │                │
  │  20. Refresh     │                     │                   │                │
  │  audit list      │                     │                   │                │
  │<─────────────────┤                     │                   │                │
```

### Workflow 3: CSV Import Process

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CSV IMPORT WORKFLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

Auditor        Frontend        Service Layer    Multer        Controller     Database
  │               │                  │              │              │             │
  │  1. Click     │                  │              │              │             │
  │  Import Data  │                  │              │              │             │
  ├─────────────> │                  │              │              │             │
  │               │                  │              │              │             │
  │  2. Dialog    │                  │              │              │             │
  │  opens        │                  │              │              │             │
  │<──────────────┤                  │              │              │             │
  │               │                  │              │              │             │
  │  3. Select    │                  │              │              │             │
  │  CSV file     │                  │              │              │             │
  ├─────────────> │                  │              │              │             │
  │               │                  │              │              │             │
  │  4. Validate  │                  │              │              │             │
  │  type & size  │                  │              │              │             │
  │  (15MB limit) │                  │              │              │             │
  │<──────────────┤                  │              │              │             │
  │               │                  │              │              │             │
  │  5. Click     │                  │              │              │             │
  │  Import       │                  │              │              │             │
  ├─────────────> │                  │              │              │             │
  │               │                  │              │              │             │
  │  6. Create    │                  │              │              │             │
  │  FormData     │                  │              │              │             │
  │  with file    │                  │              │              │             │
  │               │                  │              │              │             │
  │               │  7. POST         │              │              │             │
  │               │  /import         │              │              │             │
  │               │  (multipart)     │              │              │             │
  │               ├─────────────────>│              │              │             │
  │               │                  │              │              │             │
  │               │                  │  8. Process  │              │             │
  │               │                  │  file upload │              │             │
  │               │                  ├─────────────>│              │             │
  │               │                  │              │              │             │
  │               │                  │  9. Save to  │              │             │
  │               │                  │  uploads/    │              │             │
  │               │                  │  temp/       │              │             │
  │               │                  │<─────────────┤              │             │
  │               │                  │              │              │             │
  │               │                  │  10. Pass to │              │             │
  │               │                  │  controller  │              │             │
  │               │                  ├──────────────┼─────────────>│             │
  │               │                  │              │              │             │
  │               │                  │              │  11. Read    │             │
  │               │                  │              │  file        │             │
  │               │                  │              │  content     │             │
  │               │                  │              │              │             │
  │               │                  │              │  12. Parse   │             │
  │               │                  │              │  CSV to JSON │             │
  │               │                  │              │  (csvToJSON) │             │
  │               │                  │              │              │             │
  │               │                  │              │  13. Validate│             │
  │               │                  │              │  each row    │             │
  │               │                  │              │              │             │
  │               │                  │              │              │  14. Insert │
  │               │                  │              │              │  valid rows │
  │               │                  │              │              ├────────────>│
  │               │                  │              │              │             │
  │               │                  │              │              │  15. Confirm│
  │               │                  │              │              │<────────────┤
  │               │                  │              │              │             │
  │               │                  │              │  16. Delete  │             │
  │               │                  │              │  temp file   │             │
  │               │                  │              │              │             │
  │               │                  │  17. Return  │              │             │
  │               │                  │  results +   │              │             │
  │               │                  │  errors      │              │             │
  │               │                  │<─────────────┼──────────────┤             │
  │               │                  │              │              │             │
  │               │  18. Update UI   │              │              │             │
  │               │<─────────────────┤              │              │             │
  │               │                  │              │              │             │
  │  19. Show     │                  │              │              │             │
  │  success msg  │                  │              │              │             │
  │  + errors     │                  │              │              │             │
  │<──────────────┤                  │              │              │             │
  │               │                  │              │              │             │
  │  20. Refresh  │                  │              │              │             │
  │  audit list   │                  │              │              │             │
  │<──────────────┤                  │              │              │             │
  │               │                  │              │              │             │
  │  21. Auto-    │                  │              │              │             │
  │  close dialog │                  │              │              │             │
  │<──────────────┤                  │              │              │             │
```

### Workflow 4: Asset Request Process (Employee Role)

┌─────────────────────────────────────────────────────────────────────────────┐
│                      ASSET REQUEST WORKFLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

Employee       Frontend        Controller      Approval Ctrl    Database    Admin/Manager
  │               │                │                 │              │             │
  │  1. Request   │                │                 │              │             │
  │  new asset    │                │                 │              │             │
  ├─────────────> │                │                 │              │             │
  │               │                │                 │              │             │
  │  2. Fill      │                │                 │              │             │
  │  request form │                │                 │              │             │
  │<──────────────┤                │                 │              │             │
  │               │                │                 │              │             │
  │  3. Submit    │                │                 │              │             │
  ├─────────────> │                │                 │              │             │
  │               │                │                 │              │             │
  │               │  4. POST       │                 │              │             │
  │               │  /asset-       │                 │              │             │
  │               │  requests      │                 │              │             │
  │               ├───────────────>│                 │              │             │
  │               │                │                 │              │             │
  │               │                │  5. Create      │              │             │
  │               │                │  request record │              │             │
  │               │                ├─────────────────┼─────────────>│             │
  │               │                │                 │              │             │
  │               │                │  6. Create      │              │             │
  │               │                │  approval       │              │             │
  │               │                ├────────────────>│              │             │
  │               │                │                 │              │             │
  │               │                │                 │  7. Insert   │             │
  │               │                │                 │  approval    │             │
  │               │                │                 ├─────────────>│             │
  │               │                │                 │              │             │
  │               │                │                 │  8. Send     │             │
  │               │                │                 │  notification│             │
  │               │                │                 ├──────────────┼────────────>│
  │               │                │                 │              │             │
  │               │  9. Success    │                 │              │             │
  │               │<───────────────┤                 │              │             │
  │               │                │                 │              │             │
  │  10. Confirm  │                │                 │              │             │
  │<──────────────┤                │                 │              │             │
  │               │                │                 │              │             │
  │               │                │                 │              │  11. Review │
  │               │                │                 │              │  request    │
  │               │                │                 │              │<────────────┤
  │               │                │                 │              │             │
  │               │                │                 │  12. Approve │             │
  │               │                │                 │  /Reject     │             │
  │               │                │                 │<─────────────┼─────────────┤
  │               │                │                 │              │             │
  │               │                │                 │  13. Update  │             │
  │               │                │                 │  approval    │             │
  │               │                │                 ├─────────────>│             │
  │               │                │                 │              │             │
  │               │                │                 │  14. Notify  │             │
  │               │                │                 │  employee    │             │
  │  15. Email/   │                │                 ├──────────────┼─────────────┤
  │  Notification │<───────────────┼─────────────────┤              │             │
```

---

## 📦 Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FRONTEND COMPONENT HIERARCHY                             │
└─────────────────────────────────────────────────────────────────────────────┘

                              App.tsx (Root)
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
              AuthContext    ModalContext    Redux Store
                    │              │              │
            ┌───────┴───────┐      │              │
            │               │      │              │
 Protected Routes  Public Routes   │              │
            │               │      │              │
    ┌───────┴───────┐       │      │              │
    │               │       │      │              │
DashboardLayout  Auth Pages │      │              │
    │                       │      │              │
    ├─ Sidebar              │      │              │
    ├─ Header               │      │              │
    ├─ Content Area ────────┼──────┴──────────────┘
    └─ Footer               │
                            │
            ┌───────────────┼─────────────────────────┐
            │               │                         │
      Admin Pages    Auditor Pages             Employee Pages
            │               │                         │
    ┌───────┴───┐    ┌──────┴──────┐              ┌───┴────┐
    │           │    │             │              │        │
UserMgmt   AssetMgmt AuditorDash AuditList     MyAssets MyRequests
    │           │         │           │           │        │
    └─ Tables   └─ Forms  └─ Charts   └─ Table    └─ List  └─ Cards
       Cards       Modals    Stats       Modals      Forms    Dialogs
```

---

## 🔐 Security Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SECURITY & AUTHORIZATION FLOW                       │
└─────────────────────────────────────────────────────────────────────────────┘

Request → JWT Validation → Role Check → Permission Check → Execute → Response
  │              │              │              │             │          │
  │              │              │              │             │          │
  ├─ No Token ───┴─ Invalid ────┴─ No Access  ─┴─ Denied ────┴─  Error ─┘
  │                   │              │              │
  │              401 Unauthorized   403 Forbidden   403 Forbidden
  │
  └─ Valid Token → Decode Payload → Check Role → Check Permission → Allow

JWT Payload:
{
  userId: "...",
  email: "...",
  role: "AUDITOR",
  iat: 1234567890,
  exp: 1234610890  // 12 hours later
}

Role Permissions Matrix:
┌─────────────┬────────┬─────────┬──────────┬──────────┬────────┐
│ Resource    │ ADMIN  │ INV_MGR │ AUDITOR  │ EMPLOYEE │ VENDOR │
├─────────────┼────────┼─────────┼──────────┼──────────┼────────┤
│ Users       │ CRUD   │ R       │ R        │ -        │ -      │
│ Assets      │ CRUD   │ CRUD    │ R        │ R (own)  │ R      │
│ Audits      │ RU     │ RU      │ CRUD     │ -        │ -      │
│ Approvals   │ CRUD   │ CRUD    │ R        │ CR (own) │ -      │
│ Reports     │ RE     │ RE      │ RE       │ -        │ -      │
│ System Logs │ R      │ -       │ R        │ -        │ -      │
│ Vendors     │ CRUD   │ CRUD    │ R        │ R        │ RU     │
└─────────────┴────────┴─────────┴──────────┴──────────┴────────┘
C=Create, R=Read, U=Update, D=Delete, E=Export
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA FLOW ARCHITECTURE                           │
└─────────────────────────────────────────────────────────────────────────────┘

User Input → Frontend Validation → API Call → Backend Validation → Database
    │              │                   │              │               │
    │              │                   │              │               │
    └─ Client-side rules               └─ Server-side rules           └─ ACID
       • Required fields                  • JWT validation              transactions
       • Format check                     • Role check                 
       • Min/Max length                   • Data sanitization          
       • Type validation                  • Business logic             
                                          • Duplicate check            

Response Path:
Database → Controller → Format Response → Service Layer → Update State → UI
    │          │              │                │              │         │
    │          │              │                │              │         │
    └─ Raw data└─ Business    └─ JSON/CSV      └─ Parse       └─ React  └─ Render
                  logic          structure        response       state    components

Error Path:
Error → Catch Block → Log Error → Format Error → Return 4xx/5xx → Display Toast
  │         │            │            │              │               │
  │         │            │            │              │               │
  └─ Any    └─ try/catch └─ Console   └─ Standard    └─ HTTP         └─ User-friendly
    exception   blocks      logger       format         status          message
```

---

## 🎯 Detailed Component Explanations

### 1. **Frontend Layer**

#### **A. User Interface Layer**
**Purpose**: Presents the application to users based on their role

**Components**:
- **Login Pages**: Authentication forms with validation
- **Admin Pages**: User management, asset management, system settings
- **Auditor Pages**: Audit dashboard, audit list, compliance metrics
- **Employee Pages**: My assets, my requests, profile
- **Vendor Pages**: Vendor dashboard, product catalog, purchase orders

**Technology**: React 18, TypeScript, Material-UI

**Key Features**:
- Role-based rendering
- Responsive design (mobile, tablet, desktop)
- Dark/light theme support
- Accessibility (ARIA labels, keyboard navigation)

---

#### **B. Component Layer**

**Layout Components**:
- **DashboardLayout**: Main wrapper with sidebar, header, content area
- **Sidebar**: Navigation menu with role-based links
- **Header**: User info, notifications, logout button
- **Footer**: Copyright, version info, links

**Feature Components**:
- **AssetTable**: Displays assets with sort, filter, pagination
- **AuditList**: Shows audit items with edit capability
- **ApprovalCards**: Displays approval requests with actions
- **UserManagement**: CRUD operations for users

**Common Components**:
- **Modals**: Reusable dialog boxes (confirm, form, info)
- **Forms**: Input components with validation
- **Charts**: Bar, line, doughnut charts (Chart.js)
- **DataGrids**: Advanced tables with inline editing

---

#### **C. State Management Layer**

**AuthContext**:
- Manages user authentication state
- Stores: user data, token, role, permissions
- Methods: login, logout, refreshToken, checkAuth

**ModalContext**:
- Controls modal visibility and content
- Stores: modalType, modalData, isOpen
- Methods: openModal, closeModal, setModalData

**Redux Store**:
- Global application state
- Slices: auth, assets, approvals, notifications
- Middleware: Redux Thunk for async actions

---

#### **D. Service Layer**

**Purpose**: Abstracts API calls from components

**Services**:
- **auditorService**: Audit-related API calls
  - `getAuditorStats()`, `getAuditItems()`, `updateAuditStatus()`
  - `exportAuditReport()`, `importAuditData()`
  
- **assetService**: Asset management APIs
  - `getAssets()`, `createAsset()`, `updateAsset()`, `deleteAsset()`
  
- **authService**: Authentication APIs
  - `login()`, `logout()`, `register()`, `refreshToken()`
  
- **userService**: User management APIs
  - `getUsers()`, `createUser()`, `updateUser()`, `deleteUser()`

**Features**:
- Centralized error handling
- Request/response interceptors
- Token management
- Retry logic for failed requests

---

#### **E. HTTP Client (Axios)**

**Configuration**:
```typescript
axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})
```

**Interceptors**:
- **Request Interceptor**: Adds JWT token to headers
- **Response Interceptor**: Handles errors, refreshes token

---

### 2. **Backend Layer**

#### **A. Middleware Layer**

**authMiddleware**:
- **Purpose**: Validates JWT tokens and checks permissions
- **Functions**:
  - `authMiddleware`: Verifies token, attaches user to request
  - `requireRole(['ADMIN', 'AUDITOR'])`: Checks if user has required role
- **Error Handling**: Returns 401 (Unauthorized) or 403 (Forbidden)

**uploadMiddleware**:
- **Purpose**: Handles file uploads with validation
- **Configurations**:
  - `documentUpload`: PDFs, Word docs, Excel (10MB limit)
  - `assetImageUpload`: Images (5MB limit)
  - `importUpload`: CSV/JSON (15MB limit)
- **Storage**: Multer disk storage with unique filenames
- **Validation**: File type, size, count limits

**errorMiddleware**:
- **Purpose**: Centralized error handling
- **Features**:
  - Logs errors to console/file
  - Formats error responses
  - Hides sensitive info in production
  - Returns appropriate HTTP status codes

---

#### **B. Routes Layer**

**Purpose**: Maps HTTP requests to controller functions

**Key Routes**:
```javascript
/api/auth               // Authentication endpoints
/api/users              // User management
/api/assets             // Asset CRUD operations
/api/auditor            // Auditor-specific endpoints
/api/dashboard          // Dashboard data
/api/approvals          // Approval workflow
/api/export-import      // CSV/JSON export/import
/api/documents          // Document management
/api/vendors            // Vendor management
/api/maintenance        // Maintenance requests
/api/notifications      // Notification system
```

**HTTP Methods**:
- GET: Retrieve data
- POST: Create new records
- PUT: Update existing records
- DELETE: Remove records

---

#### **C. Controller Layer**

**Purpose**: Business logic and request handling

**Key Controllers**:

**authController**:
- `login`: Validates credentials, generates JWT
- `register`: Creates new user account
- `refreshToken`: Issues new token when expired
- `changePassword`: Updates user password

**auditorController** (via dashboardController):
- `getAuditorStats`: Returns audit statistics (assigned, completed, pending, etc.)
- `getAuditItems`: Returns list of assets for auditing
- `getAuditProgressChart`: Returns 6-month audit progress data
- `getConditionChart`: Returns asset condition distribution
- `getComplianceMetrics`: Returns compliance score and breakdown

**assetController**:
- `getAssets`: Returns all assets (with pagination, filtering)
- `getAssetById`: Returns single asset details
- `createAsset`: Creates new asset record
- `updateAsset`: Updates asset information
- `deleteAsset`: Soft deletes asset (marks as deleted)

**exportImportController**:
- `exportData`: Exports data as JSON or CSV
  - Converts data to CSV format using `jsonToCSV` helper
  - Adds proper headers (Content-Type, Content-Disposition)
  - Populates related fields (createdBy, lastAuditedBy)
  
- `importData`: Imports data from CSV or JSON file
  - Receives file via Multer middleware
  - Parses CSV using `csvToJSON` helper
  - Validates each row (required fields, data types)
  - Inserts valid records to database
  - Returns import statistics and errors
  - Cleans up temporary files

---

#### **D. Model Layer (Mongoose)**

**Purpose**: Defines data structure and database operations

**Key Models**:

**User Model**:
```javascript
{
  name: String,
  email: String (unique, required),
  password: String (hashed),
  role: Enum ['ADMIN', 'INVENTORY_MANAGER', 'AUDITOR', 'EMPLOYEE', 'VENDOR'],
  department: String,
  phone: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Asset Model**:
```javascript
{
  assetTag: String (unique, required),
  name: String,
  description: String,
  category: String,
  location: String,
  condition: Enum ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'],
  status: String,
  purchaseDate: Date,
  purchasePrice: Number,
  currentValue: Number,
  department: String,
  assignedTo: ObjectId (User),
  lastAuditedBy: ObjectId (User),
  lastAuditDate: Date,
  qrCode: String,
  images: [String],
  notes: String,
  createdBy: ObjectId (User),
  createdAt: Date,
  updatedAt: Date
}
```

**Approval Model**:
```javascript
{
  requestType: Enum ['ASSET_REQUEST', 'MAINTENANCE', 'TRANSFER'],
  requestId: ObjectId,
  requestedBy: ObjectId (User),
  approver: ObjectId (User),
  status: Enum ['PENDING', 'APPROVED', 'REJECTED'],
  comments: String,
  approvedAt: Date,
  createdAt: Date
}
```

**Features**:
- Mongoose middleware (pre/post hooks)
- Virtual properties
- Instance methods
- Static methods
- Indexing for performance

---

### 3. **Database Layer**

**MongoDB Atlas (Cloud Database)**:

**Collections**:
- **users**: User accounts and authentication
- **assets**: Asset inventory
- **approvals**: Approval workflow
- **transactions**: Asset transactions (transfer, disposal)
- **maintenances**: Maintenance requests and schedules
- **notifications**: User notifications
- **documents**: Document metadata (files stored separately)
- **auditlogs**: System audit trail
- **assetrequests**: Employee asset requests
- **assettransfers**: Asset transfer records
- **purchaseorders**: Purchase orders
- **purchaserequests**: Purchase requests
- **vendors**: Vendor information

**Features**:
- **Replication**: 3-node replica set for high availability
- **Sharding**: Horizontal scaling for large datasets
- **Indexes**: Optimized queries (single, compound, text indexes)
- **Auto-backup**: Daily backups with point-in-time recovery
- **Monitoring**: Real-time performance metrics

**Connection**:
```javascript
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
```

---

### 4. **File Storage Layer**

**Local File System**:

**Directory Structure**:
```
uploads/
├── documents/          // User-uploaded documents (contracts, invoices, manuals)
│   └── [filename]-[timestamp].[ext]
├── asset-images/       // Asset photos and QR codes
│   └── asset-[timestamp].[ext]
└── temp/               // Temporary import files (auto-deleted)
    └── import-[timestamp].[ext]
```

**File Naming Convention**:
- Unique timestamp + random number to prevent conflicts
- Original extension preserved
- Example: `document-1698765432000-123456789.pdf`

**Cleanup Strategy**:
- Temp files deleted after processing (success or error)
- Orphaned files cleaned up by scheduled job (future enhancement)

---

## 📊 Comparison Tables

### Table 1: Role Comparison

| Feature             | ADMIN       | INVENTORY_MANAGER | AUDITOR      | EMPLOYEE     | VENDOR           |
|---------------------|-------------|-------------------|--------------|--------------|------------------|
| **Dashboard Pages** | 5+          | 4+                | 3            | 5            | 3                |
| **Asset Access**    | All (CRUD)  | All (CRUD)        | All (R)      | Own (R)      | Public (R)       |
| **User Management** | Full CRUD   | Read only         | Read only    | None         | None             |
| **Audit Functions** | Read/Update | Read/Update       | Full CRUD    | None         | None             |
| **Approval Rights** | Approve all | Approve dept      | None         | Create own   | None             |
| **Report Export**   | Yes (All)   | Yes (Dept.)       | Yes (Audit)  | No           | No               |
| **System Logs**     | Full access | No access         | Audit logs   | No access    | No access        |
| **Vendor Mgmt**     | Full CRUD   | Full CRUD         | Read only    | Read only    | Update own       |
| **Document Upload** | Yes         | Yes               | Yes          | Yes (limited)| Yes (limited)    |
| **Data Export**     | JSON/CSV    | JSON/CSV          | JSON/CSV     | No           | No               |
| **Data Import**     | JSON/CSV    | JSON/CSV          | JSON/CSV     | No           | No               |
| **Notifications**   | All system  | Department        | AuditRelated | Personal     | Purchase-related |

---

### Table 2: Page Comparison (Auditor vs Employee)

| Aspect                  | Auditor Pages                | Employee Pages              |
|--------------------     |------------------------------|--------------------------   |
| **Number of Pages**     | 3 specialized                | 5 basic                     |
| **Dashboard Stats**     | 6 cards (audit metrics)      | 4 cards (personal assets)   |
| **Charts**              | Yes (Bar, Doughnut)          | No                          |
| **Main Function**       | Audit & Compliance           | Asset usage & requests      |
| **Data Scope**          | System-wide                  | Personal only               |
| **Edit Capability**     | Update audit status          | Create requests only        |
| **Export Features**     | JSON/CSV export              | None                        |
| **Import Features**     | JSON/CSV import              | None                        |
| **Compliance Tracking** | Full metrics & trends        | None                        |
| **Quick Actions**       | View/Start Audit, Export     | Request Asset, Report Issue |

---

### Table 3: API Endpoint Comparison

### Table 3: API Endpoint Comparison

| Endpoint | Method | Auth Required | Roles Allowed | Request Body | Response | Rate Limit | Cache |
|----------|--------|---------------|---------------|--------------|-----------|------------|-------|
| `/auth/login` | POST | No | All | `{email, password}` | `{token, user}` | 5/min | No |
| `/auth/logout` | POST | Yes | All | - | `{success}` | None | No |
| `/auth/refresh` | POST | Yes | All | `{refreshToken}` | `{newToken}` | 20/min | No |
| `/auth/register` | POST | Yes | ADMIN | `{name, email, role}` | `{user}` | 10/min | No |
| `/assets` | GET | Yes | All | - | `[assets]` | 100/min | 5min |
| `/assets` | POST | Yes | ADMIN, INV_MGR | `{assetData}` | `{asset}` | 50/min | No |
| `/assets/:id` | DELETE | Yes | ADMIN | - | `{success}` | 20/min | No |
| `/assets/:id` | GET | Yes | All | - | `{asset}` | 100/min | 5min |
| `/assets/:id` | PUT | Yes | ADMIN, INV_MGR | `{updates}` | `{asset}` | 50/min | No |
| `/audit/items` | GET | Yes | AUDITOR | - | `[items]` | 100/min | 1min |
| `/audit/stats` | GET | Yes | AUDITOR | - | `{stats}` | 100/min | 1min |
| `/audit/:id` | PUT | Yes | AUDITOR | `{status, notes}` | `{audit}` | 50/min | No |
| `/dashboard` | GET | Yes | All | - | `{stats}` | 100/min | 1min |
| `/export` | POST | Yes | ADMIN, AUDITOR | `{type, format}` | File | 10/min | No |
| `/import` | POST | Yes | ADMIN, AUDITOR | CSV/JSON file | `{results}` | 5/min | No |
| `/reports` | GET | Yes | ADMIN, AUDITOR | `{type, dates}` | `{report}` | 50/min | 10min |
| `/users` | GET | Yes | ADMIN | - | `[users]` | 100/min | 5min |
| `/users` | POST | Yes | ADMIN | `{userData}` | `{user}` | 20/min | No |
| `/users/:id` | DELETE | Yes | ADMIN | - | `{success}` | 20/min | No |
| `/users/:id` | PUT | Yes | ADMIN | `{updates}` | `{user}` | 50/min | No |

---

### Table 4: Component Type Comparison

| Component Type        | Purpose            | Examples                     | Reusability  | State Management      |
|----------------------|--------------------|-----------------------------|--------------|---------------------|
| Layout Components    | Page structure     | DashboardLayout, Sidebar    | High         | Context API         |
| Page Components      | Main routes        | AuditorDashboard, AuditList | Low          | Local State+Context |
| Feature Components   | Specific features  | AssetTable, ApprovalCards   | Medium       | Props+Local State   |
| Common Components    | Reusable UI        | Modal, Button, Input        | Very High    | Props only          |
| Chart Components     | Data visualization | AuditChart, ConditionChart  | High         | Props only          |

### Table 5: Data Flow Comparison (Export vs Import)

| Aspect             | Export (JSON/CSV)                  | Import (CSV/JSON)                      |
|-------------------|-----------------------------------|----------------------------------------|
| User Action       | Click "Export CSV" button          | Click "Import Data", select file       |
| Frontend Valid    | None required                      | File type, size (15MB)                 |
| HTTP Method       | POST                               | POST (multipart/form-data)             |
| Request Format    | {type:'assets', format:'csv'}      | FormData with file                     |
| Backend Process   | Query DB → Format → Return         | Upload → Parse → Validate → Insert     |
| Middleware Used   | authMiddleware, requireRole        | authMiddleware, upload, requireRole    |
| Response Type     | Blob (CSV) / JSON                  | JSON (stats + errors)                  |
| File Handling     | Generate on-the-fly                | Save temp → Process → Delete           |
| Error Handling    | 500 error response                 | Row-by-row validation + error list     |
| Success Feedback  | Toast + file download              | Toast + message + auto-refresh         |
| Performance       | O(n) - fast                        | O(n) + DB insert - slower              |

### Table 6: File Upload Middleware Comparison

| Middleware        | Purpose          | File Types                     | Size Limit | Destination          | Used By           |
|------------------|------------------|--------------------------------|------------|---------------------|------------------|
| documentUpload   | User documents   | PDF,DOC,DOCX,XLS,XLSX,TXT,CSV | 10 MB      | uploads/documents/   | Document routes  |
| assetImageUpload | Asset photos     | JPG,JPEG,PNG,GIF,WEBP         | 5 MB       | uploads/asset-images/| Asset routes     |
| importUpload     | Import files     | CSV,JSON                       | 15 MB      | uploads/temp/        | Import route     |

### Tables 7: Authentication Mechanism Comparison

| Mechanism        | Purpose                              | Strengths                                  | Weaknesses                          | Typical Use Cases                        |
|------------------|--------------------------------------|--------------------------------------------|-------------------------------------|------------------------------------------|
| JWT (Stateless)  | Token-based auth for APIs/clients    | Scalable, stateless, easy to use in SPAs   | Token revocation/rotation complexity| Mobile apps, SPAs, microservices         |
| Session Cookies  | Server-side session management       | Easy token revocation, secure with SameSite| Requires sticky sessions for scale  | Traditional web apps, server-rendered UI |
| OAuth2 / OIDC    | Delegated auth / SSO                 | Standardized, third-party login support    | More complex setup                  | SSO, integration with identity providers |
| API Keys         | Simple service-to-service auth       | Simple, lightweight                        | Poor granularity, less secure       | Internal services, service integrations  |
| Refresh Tokens   | Extend short-lived access tokens     | Improved security, reduced exposure window | Requires secure storage & rotation  | Long sessions, token refresh workflows   |


### Table 8: State Management Comparison

| Type                  | Libraries/Tools          | Scope                    | Pros                                       | Cons                                    |
|-----------------------|--------------------------|--------------------------|--------------------------------------------|-----------------------------------------|
| Context + Hooks       | React Context, useReducer| Local/medium app-wide    | Built-in, simple for small apps            | Prop drilling for complex needs         |
| Redux (Toolkit)       | @reduxjs/toolkit         | Global                   | Predictable, devtools, large ecosystem     | Boilerplate (reduced by RTK), learning curve |
| Zustand / Jotai       | Zustand, Jotai           | Global/lightweight       | Minimal boilerplate, fast, flexible        | Smaller ecosystem, patterns vary        |
| React Query / SWR     | react-query, swr         | Server-state / caching   | Data caching, deduping, background sync    | Not for complex client-only state       |
| MobX                  | mobx                     | Global/observable        | Simple reactive patterns                   | Implicit reactivity can be opaque       |


### Table 9: Error Handling Strategies

| Layer           | Strategy                                | Advantages                                | Example Response / Status               |
|-----------------|-----------------------------------------|-------------------------------------------|-----------------------------------------|
| Client (UI)     | User-friendly toasts + retry actions    | Better UX, immediate feedback             | 400/401/403 → show message + retry btn  |
| HTTP Client     | Interceptors (refresh token, retry)     | Centralized handling, automated refresh   | 401 → attempt refresh, then retry       |
| Controller/API  | Validate → try/catch → standardized err | Consistent responses, easier debugging    | 400 Bad Request / 422 Validation errors |
| Middleware/Log  | Central error middleware + structured logs | Mask sensitive info in prod, traceable  | 500 Internal Server Error (generic msg) |
| Background Jobs | Retry with backoff, dead-letter queue   | Resilient processing, failure tracking    | Task moved to DLQ after N retries       |


### Table 10: Performance Optimization Techniques

| Area               | Technique                                | Benefit                                  | Implementation Notes                          |
|--------------------|------------------------------------------|------------------------------------------|-----------------------------------------------|
| Network            | Pagination, filtering, gzip, caching     | Reduced payloads, faster responses       | Use HTTP cache headers, CDN for static assets |
| Database           | Indexing, projection, pagination         | Faster queries, less I/O                 | Add compound indexes for common filters       |
| Backend            | Connection pooling, query optimization   | Improved throughput                      | Monitor slow queries, profile endpoints       |
| Frontend           | Code splitting, lazy loading, memoization| Faster initial load, less re-rendering   | Use React.lazy, useMemo/useCallback           |
| File Handling      | Streams, multipart processing, async ops | Lower memory use, responsive uploads     | Stream large exports, delete temp files       |
| Monitoring         | APM + metrics + alerts                   | Detect regressions early                 | Instrument critical paths, set SLOs           |


---

## 🎯 Summary

This comprehensive diagram covers:

1. **System Architecture**: 4 layers (Client, Network, Server, Database)
2. **User Workflows**: Authentication, Audit, CSV Import, Asset Request
3. **Component Interactions**: Frontend hierarchy and data flow
4. **Security Flow**: JWT validation and role-based access
5. **Data Flow**: Request/response paths with error handling
6. **Component Details**: Purpose and functionality of each part
7. **10 Comparison Tables**: Roles, pages, APIs, components, data flow, middleware, auth, state, errors, performance

**Total Coverage**:
- ✅ Frontend architecture (6 sub-layers)
- ✅ Backend architecture (4 sub-layers)
- ✅ Database layer (12 collections)
- ✅ File storage (3 directories)
- ✅ 4 complete workflows
- ✅ 10 detailed comparison tables
- ✅ Security & authorization flow
- ✅ Error handling strategies
- ✅ Performance metrics

This documentation provides a complete understanding of how the Online Dead Stock Register system works from user interaction to database storage and back.
