<div align="center">

# 🏢 Online Dead Stock Register

> A comprehensive, **production-ready** enterprise asset management system built with React, TypeScript, Node.js, and MongoDB.

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/Version-2.0.0-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

</div>

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-18.2.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-4.9.5-blue)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/mongodb-latest-green)](https://www.mongodb.com/)

---

## 📑 Table of Contents

- [Status](#-status-production-ready-)
- [Recent Updates](#-recent-updates-v200---october-2025)
- [Key Features](#-key-features)
- [Quick Start](#-quick-start)
- [User Roles & Permissions](#-user-roles--permissions)
- [Technology Stack](#️-technology-stack)
- [Project Structure](#-project-structure)
- [Available Scripts](#-available-scripts)
- [API Endpoints](#-api-endpoints)
- [Documentation](#-documentation)
- [Troubleshooting](#-troubleshooting)
- [Security](#-security-best-practices)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## 🎉 Status: Production Ready ✅

This enterprise-grade system is fully implemented with real-time profile synchronization, role-based access control, QR code scanning, bulk operations, and comprehensive audit logging.

---

## 🆕 Recent Updates (v2.0.0 - October 2025)

### ✨ New Features
- ✅ **Real-Time Profile Synchronization** - Profile updates reflect instantly across all components
- ✅ **IT Manager Role** - New IT_MANAGER role with full route integration
- ✅ **Bulk Asset Operations** - Multi-select with checkboxes and bulk delete
- ✅ **QR Code System** - Generate, download, and scan QR codes with camera
- ✅ **Indian Rupee (₹)** - Changed from USD to ₹ across entire application
- ✅ **Enhanced Dashboards** - All 7 role-specific dashboards working perfectly

### 🐛 Bug Fixes
- ✅ Fixed vendor-performance 404 error
- ✅ Removed infinite render loop (150+ console logs)
- ✅ Fixed asset value calculation (₹58.2L displaying correctly)
- ✅ Fixed profile sync issues (removed all mock data)
- ✅ Fixed TypeScript errors (0 errors now)

### 📦 Build Status
- ✅ **Production Build**: 571.05 kB
- ✅ **TypeScript Errors**: 0
- ✅ **Vulnerabilities**: 0 (frontend), 1 (backend - xlsx, no fix)

---

## ✨ Key Features

### 🔐 Authentication & Authorization
- **7 User Roles**: Admin, Inventory Manager, IT Manager, Auditor, Employee, Vendor
- **JWT-based Authentication** with secure token management
- **Role-Based Access Control** (RBAC) with 21+ protected routes
- **Real-Time Profile Synchronization** across all components
- **Department-Based Filtering** (Inventory, IT, Admin, Vendor)

### 📦 Asset Management
- **Complete Asset Lifecycle Tracking** (Purchase → Assignment → Maintenance → Disposal)
- **QR Code Generation & Scanning** with camera integration
- **Bulk Operations** - Select and delete multiple assets
- **Asset Transfer Workflows** with approval chains
- **Real-Time Asset Status Updates** (Available, In Use, Under Maintenance, Disposed)
- **Purchase Cost Tracking** in ₹ (Indian Rupee)
- **Photo Gallery** with upload and management
- **Asset Categories** with custom field support

### 🔄 Workflow & Approvals
- **Multi-Level Approval System** for asset requests, transfers, and maintenance
- **Email Notifications** for approval requests and status updates
- **Automated Status Tracking** with audit trail
- **Request Management** with priority levels
- **Approval History** with timestamps and user tracking

### 🔍 Audit & Compliance
- **Comprehensive Audit Logging** - Track all user actions
- **Scheduled Audits** with cron job automation
- **Compliance Verification** tools for auditors
- **Asset Verification** with QR code scanning
- **Audit Reports** with export capabilities (JSON, CSV, PDF)
- **Activity Timeline** for each asset

### 👥 User & Vendor Management
- **User Directory** with advanced search and filtering
- **Vendor Portal** with dedicated dashboard
- **Purchase Order Management** for vendors
- **Vendor Performance Tracking** with metrics
- **Document Upload & Management** for vendors
- **Invoice Processing** system

### 📊 Dashboard & Analytics
- **Role-Specific Dashboards** (7 different dashboard views)
- **Real-Time KPIs** - Total Assets, Asset Value, Active Users, Pending Approvals
- **Asset Distribution Charts** (by status, category, department, location)
- **Trend Analysis** with historical data
- **Performance Metrics** for vendors
- **Custom Widgets** per role

### 📄 Reports & Export
- **Customizable Report Generation** (Asset, User, Audit, Vendor reports)
- **Multiple Export Formats** (JSON, CSV, PDF)
- **Scheduled Reports** with email delivery
- **Advanced Filters** with saved filter presets
- **Data Visualization** with charts and graphs

### 🔔 Notifications & Alerts
- **Real-Time Notifications** with toast messages
- **Email Notifications** for critical events
- **In-App Notification Center** with read/unread tracking
- **Alert Management** for maintenance due dates
- **Configurable Notification Preferences**

### 🛠️ Maintenance & Support
- **Maintenance Request System** with scheduling
- **Recurring Maintenance** with cron jobs
- **Maintenance History** tracking
- **Cost Tracking** for repairs and servicing
- **Vendor Assignment** for maintenance tasks

### 🔒 Security Features
- **Password Hashing** with bcryptjs
- **JWT Token Expiration** (24h default)
- **CORS Protection** with whitelist
- **Input Validation** with middleware
- **SQL Injection Prevention** with parameterized queries
- **XSS Protection** with sanitization
- **Rate Limiting** on API endpoints
- **Security Headers** (Helmet.js)

### 📱 Modern UI/UX
- **Material-UI v5** design system
- **Responsive Layout** (Mobile, Tablet, Desktop)
- **Dark/Light Theme** support (coming soon)
- **Intuitive Navigation** with breadcrumbs
- **Search & Filter** on all list views
- **Pagination** for large datasets
- **Loading States** with skeletons
- **Error Handling** with user-friendly messages

### 🚀 Production Features
- **Professional Logging** - Winston with daily rotating files
- **HTTP Request Logging** - Morgan with user tracking
- **API Documentation** - Swagger UI at `/api-docs`
- **Environment Configuration** - Secure .env templates
- **MongoDB Backups** - Automated daily backups with 30-day retention
- **PM2 Process Manager** - Production deployment with clustering
- **Nginx Reverse Proxy** - Load balancing and SSL/TLS
- **SSL Certificate** - Let's Encrypt integration

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14.0.0 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** (v6 or higher) or **yarn** (v1.22 or higher)
- **Git** - [Download](https://git-scm.com/downloads)

### Installation

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/kevallathiya-74/Online-Dead-Stock-Register.git
cd Online-Dead-Stock-Register
```

#### 2️⃣ Install Dependencies

```bash
# Install frontend dependencies (from root directory)
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

#### 3️⃣ Configure Environment Variables

```bash
# Navigate to backend directory
cd backend

# Copy example environment file
cp .env.example .env

# Edit .env file with your configuration
# Required variables:
# - MONGODB_URI=mongodb://localhost:27017/dead-stock-register
# - JWT_SECRET=your-secret-key-here
# - PORT=5000
# - FRONTEND_URL=http://localhost:5173
```

#### 4️⃣ Start MongoDB

```bash
# Windows (if installed as service)
net start MongoDB

# macOS/Linux
sudo systemctl start mongod

# Or using MongoDB Compass - just open the application
```

#### 5️⃣ Seed Test Data

```bash
# Navigate to backend directory
cd backend

# Create test user accounts
node seed/seedUsers.js

# (Optional) Seed sample assets and data
node seed/seedAssets.js
```

#### 6️⃣ Start the Application

```bash
# Terminal 1 - Start Backend (from backend directory)
cd backend
npm start
# Backend will run on http://localhost:5000

# Terminal 2 - Start Frontend (from root directory)
npm run dev
# Frontend will run on http://localhost:5173
```

#### 7️⃣ Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | React application |
| **Backend API** | http://localhost:5000 | Express REST API |
| **API Docs** | http://localhost:5000/api-docs | Swagger UI documentation |
| **MongoDB** | mongodb://localhost:27017 | Database connection |

### 🔑 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@test.com | admin123 |
| **Inventory Manager** | inventory@test.com | inventory123 |
| **IT Manager** | itmanager@test.com | itmanager123 |
| **Auditor** | auditor@test.com | auditor123 |
| **Employee #1** | employee1@test.com | employee123 |
| **Employee #2** | employee2@test.com | employee123 |
| **Vendor** | vendor@test.com | vendor123 |

> ⚠️ **Important**: Change these passwords before deploying to production!

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** | Quick commands and troubleshooting |
| **[PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md)** | Complete production deployment guide |
| **[FINAL_IMPLEMENTATION_COMPLETE.md](./FINAL_IMPLEMENTATION_COMPLETE.md)** | Implementation summary and status |
| **[COMPREHENSIVE_PROJECT_STATUS.md](./COMPREHENSIVE_PROJECT_STATUS.md)** | Feature status and architecture |
| **[TEST_ACCOUNTS.md](./TEST_ACCOUNTS.md)** | All test account credentials |

## 🔍 View Logs

### Development
```bash
# Application logs
tail -f backend/logs/application-YYYY-MM-DD.log

# Error logs only
tail -f backend/logs/error-YYYY-MM-DD.log
```

### Production
```bash
# PM2 logs
pm2 logs asset-management-api

# Nginx logs
sudo tail -f /var/log/nginx/assetmanagement-error.log
```

## Test Accounts

After running the seed script, you can login with these test accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | admin123 |
| Inventory Manager | inventory@test.com | inventory123 |
| Auditor | auditor@test.com | auditor123 |
| Employee | employee1@test.com | employee123 |
| Vendor | vendor@test.com | vendor123 |

📖 **See [TEST_ACCOUNTS.md](./TEST_ACCOUNTS.md) for complete credentials and permission details**

## 👥 User Roles & Permissions

### 🔴 ADMIN (Super User)
**Full system access and control**
- ✅ User management (Create, Update, Delete users)
- ✅ System configuration and settings
- ✅ All asset operations (CRUD)
- ✅ Approve/Reject all requests
- ✅ Access all reports and analytics
- ✅ Vendor management
- ✅ Department management
- ✅ Audit log access
- ✅ System-wide visibility

**Dashboard Features:**
- Total assets, users, pending approvals
- Asset distribution charts
- Recent transactions
- System activity overview

---

### 🟠 INVENTORY_MANAGER
**Asset and inventory operations**
- ✅ Asset management (Create, Update, Delete)
- ✅ Vendor management
- ✅ Approve asset requests and transfers
- ✅ Maintenance scheduling
- ✅ Inventory reporting
- ✅ Purchase order management
- ✅ Document management
- ✅ Department: INVENTORY

**Dashboard Features:**
- Asset statistics by category
- Low stock alerts
- Pending approvals
- Vendor performance metrics

---

### 🟡 IT_MANAGER
**Technology asset management**
- ✅ IT asset management (computers, servers, network equipment)
- ✅ Asset assignments to employees
- ✅ Approve IT-related requests
- ✅ Maintenance scheduling for IT assets
- ✅ IT inventory reporting
- ✅ Software license tracking
- ✅ Department: IT

**Dashboard Features:**
- IT asset distribution
- Software license expiry
- Hardware maintenance schedule
- IT asset utilization

---

### 🟢 AUDITOR
**Compliance and verification**
- ✅ View all assets (Read-only)
- ✅ Audit log access
- ✅ Asset verification via QR scanning
- ✅ Generate audit reports
- ✅ Schedule audits
- ✅ Compliance verification
- ✅ Export audit data
- ❌ Cannot modify assets

**Dashboard Features:**
- Audit compliance status
- Asset verification progress
- Discrepancy reports
- Audit history

---

### 🔵 EMPLOYEE
**Self-service asset management**
- ✅ View assigned assets
- ✅ Submit asset requests
- ✅ Track request status
- ✅ Update profile
- ✅ View maintenance history
- ✅ Request asset transfers
- ❌ Limited visibility (own assets only)

**Dashboard Features:**
- My assigned assets
- My pending requests
- Maintenance schedule
- Profile information

---

### 🟣 VENDOR
**Vendor portal access**
- ✅ View purchase orders
- ✅ Upload invoices and documents
- ✅ Track order status
- ✅ View linked assets
- ✅ Update company profile
- ✅ Performance metrics
- ✅ Department: VENDOR

**Dashboard Features:**
- Active purchase orders
- Revenue statistics
- Order fulfillment rate
- Document repository

---

## 🏢 Departments

| Department | Description | Roles |
|------------|-------------|-------|
| **INVENTORY** | Main stock management | Admin, Inventory Manager |
| **IT** | Technology assets | Admin, IT Manager |
| **ADMIN** | Administrative operations | Admin |
| **VENDOR** | Vendor operations | Vendor |

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | UI framework |
| **TypeScript** | 4.9.5 | Type safety |
| **Material-UI (MUI)** | 5.14.18 | Component library |
| **React Router** | 6.20.0 | Routing |
| **Redux Toolkit** | 1.9.7 | State management |
| **Axios** | 1.6.2 | HTTP client |
| **Recharts** | 2.10.3 | Data visualization |
| **QR Code Generator** | 1.4.4 | QR code creation |
| **React Toastify** | 9.1.3 | Notifications |
| **Vite** | 5.0.0 | Build tool |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 14+ | Runtime environment |
| **Express.js** | 4.18.2 | Web framework |
| **MongoDB** | 4.4+ | Database |
| **Mongoose** | 8.0.3 | ODM |
| **JWT** | 9.0.2 | Authentication |
| **bcryptjs** | 2.4.3 | Password hashing |
| **Multer** | 1.4.5-lts.1 | File uploads |
| **Winston** | 3.11.0 | Logging |
| **Morgan** | 1.10.0 | HTTP logging |
| **Swagger** | 6.2.8 | API documentation |
| **Nodemailer** | 6.9.16 | Email service |
| **Node-Cron** | 3.0.3 | Scheduled tasks |

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Postman** - API testing
- **MongoDB Compass** - Database GUI
- **VS Code** - Recommended IDE

## 📁 Project Structure

```
Online-Dead-Stock-Register/
│
├── 📂 src/                           # Frontend source code
│   ├── 📂 components/                # Reusable React components
│   │   ├── 📂 assets/                # Asset-specific components
│   │   │   ├── AssetQRCodeDialog.tsx # QR code generation dialog
│   │   │   ├── BulkOperationsPanel.tsx # Bulk selection UI
│   │   │   └── FilterResultsPreview.tsx # Filter preview
│   │   ├── 📂 layout/                # Layout components
│   │   │   ├── DashboardLayout.tsx   # Main dashboard layout
│   │   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   │   └── Navbar.tsx            # Top navigation bar
│   │   ├── 📂 dashboard/             # Dashboard widgets
│   │   └── 📂 common/                # Common UI components
│   │
│   ├── 📂 pages/                     # Page components
│   │   ├── 📂 admin/                 # Admin pages
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminAssetPage.tsx
│   │   │   ├── AdminUserPage.tsx
│   │   │   └── AdminTransactionPage.tsx
│   │   ├── 📂 employee/              # Employee pages
│   │   │   ├── EmployeeDashboard.tsx
│   │   │   └── ProfilePage.tsx
│   │   ├── 📂 vendor/                # Vendor pages
│   │   │   ├── VendorDashboard.tsx
│   │   │   └── VendorProfilePage.tsx
│   │   ├── 📂 assets/                # Asset management pages
│   │   ├── 📂 qr/                    # QR code pages
│   │   │   └── QRScannerPage.tsx
│   │   └── 📂 auth/                  # Authentication pages
│   │       ├── LoginPage.tsx
│   │       └── SignupPage.tsx
│   │
│   ├── 📂 services/                  # API service layer
│   │   ├── api.ts                    # Axios configuration
│   │   ├── auth.service.ts           # Authentication API
│   │   ├── asset.service.ts          # Asset API
│   │   ├── user.service.ts           # User API
│   │   ├── vendor.service.ts         # Vendor API
│   │   ├── dashboard.service.ts      # Dashboard API
│   │   └── qr.service.ts             # QR code API
│   │
│   ├── 📂 context/                   # React Context
│   │   └── AuthContext.tsx           # Authentication context
│   │
│   ├── 📂 types/                     # TypeScript definitions
│   │   ├── index.ts                  # Main type exports
│   │   ├── user.types.ts             # User types
│   │   ├── asset.types.ts            # Asset types
│   │   └── vendor.types.ts           # Vendor types
│   │
│   ├── 📂 utils/                     # Utility functions
│   │   ├── navigation.ts             # Navigation utilities
│   │   ├── formatters.ts             # Data formatters
│   │   └── validators.ts             # Input validators
│   │
│   ├── App.tsx                       # Main app component
│   ├── main.tsx                      # App entry point
│   └── store.ts                      # Redux store
│
├── 📂 backend/                       # Backend source code
│   ├── 📂 config/                    # Configuration files
│   │   ├── db.js                     # MongoDB connection
│   │   └── swagger.js                # Swagger API docs config
│   │
│   ├── 📂 controllers/               # Route controllers (20+ files)
│   │   ├── authController.js         # Authentication
│   │   ├── assetController.js        # Asset management
│   │   ├── userController.js         # User management
│   │   ├── vendorController.js       # Vendor operations
│   │   ├── dashboardController.js    # Dashboard data
│   │   ├── approvalController.js     # Approval workflows
│   │   ├── auditLogController.js     # Audit logging
│   │   └── ...                       # And more
│   │
│   ├── 📂 models/                    # MongoDB models
│   │   ├── user.js                   # User schema
│   │   ├── asset.js                  # Asset schema
│   │   ├── vendor.js                 # Vendor schema
│   │   ├── transaction.js            # Transaction schema
│   │   ├── approval.js               # Approval schema
│   │   ├── auditLog.js              # Audit log schema
│   │   └── ...                       # And more
│   │
│   ├── 📂 routes/                    # API routes (20+ files)
│   │   ├── auth.js                   # /api/auth
│   │   ├── assets.js                 # /api/assets
│   │   ├── users.js                  # /api/users
│   │   ├── vendors.js                # /api/vendors
│   │   ├── dashboard.js              # /api/dashboard
│   │   └── ...                       # And more
│   │
│   ├── 📂 middleware/                # Custom middleware
│   │   ├── authMiddleware.js         # JWT verification
│   │   ├── errorHandler.js           # Error handling
│   │   ├── requestLogger.js          # Request logging
│   │   ├── uploadMiddleware.js       # File upload
│   │   └── validationMiddleware.js   # Input validation
│   │
│   ├── 📂 services/                  # Business logic
│   │   ├── emailService.js           # Email notifications
│   │   ├── qrService.js              # QR code generation
│   │   └── auditService.js           # Audit logging
│   │
│   ├── 📂 utils/                     # Utility functions
│   │   ├── logger.js                 # Winston logger
│   │   └── validators.js             # Data validators
│   │
│   ├── 📂 seed/                      # Database seed scripts
│   │   ├── seedUsers.js              # Seed test users
│   │   └── seedAssets.js             # Seed test assets
│   │
│   ├── 📂 uploads/                   # File uploads storage
│   │   ├── documents/                # Document uploads
│   │   ├── photos/                   # Photo uploads
│   │   └── qrcodes/                  # Generated QR codes
│   │
│   ├── 📂 logs/                      # Application logs
│   │   ├── application-YYYY-MM-DD.log
│   │   ├── error-YYYY-MM-DD.log
│   │   └── http-YYYY-MM-DD.log
│   │
│   ├── server.js                     # Express server
│   ├── createUser.js                 # CLI user creation
│   └── package.json                  # Backend dependencies
│
├── 📂 public/                        # Static assets
│   ├── manifest.json                 # PWA manifest
│   └── robots.txt                    # SEO robots file
│
├── 📄 package.json                   # Frontend dependencies
├── 📄 tsconfig.json                  # TypeScript config
├── 📄 vite.config.ts                 # Vite configuration
├── 📄 tailwind.config.js             # Tailwind CSS config
├── 📄 .env.example                   # Environment template
├── 📄 README.md                      # This file
└── 📄 LICENSE                        # MIT License
```

## 📜 Available Scripts

### Frontend Scripts

```bash
# Development
npm run dev                # Start Vite dev server (http://localhost:5173)
npm run build              # Build for production (dist/)
npm run preview            # Preview production build
npm run lint               # Run ESLint

# TypeScript
npm run type-check         # Check TypeScript types
```

### Backend Scripts

```bash
# Development
npm start                  # Start Express server (http://localhost:5000)
npm run dev                # Start with nodemon (auto-restart)

# Database
node seed/seedUsers.js     # Create test user accounts
node seed/seedAssets.js    # Seed sample assets
node createUser.js <email> <password> <name> <role> <department>  # Create single user

# Example: Create an admin user
node createUser.js admin@company.com SecurePass123 "John Admin" ADMIN ADMIN

# Maintenance
npm run backup             # Create MongoDB backup
npm run restore            # Restore from backup
```

### Production Scripts

```bash
# Using PM2
pm2 start backend/server.js --name asset-management-api
pm2 logs asset-management-api
pm2 restart asset-management-api
pm2 stop asset-management-api
pm2 delete asset-management-api

# View PM2 status
pm2 status
pm2 monit
```

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/login              # User login
POST   /api/auth/signup             # User registration
POST   /api/auth/logout             # User logout
POST   /api/auth/forgot-password    # Password reset request
POST   /api/auth/reset-password     # Reset password
```

### Users
```
GET    /api/users                   # Get all users (Admin only)
GET    /api/users/profile           # Get current user profile
GET    /api/users/:id               # Get user by ID
POST   /api/users                   # Create new user (Admin only)
PUT    /api/users/:id               # Update user
DELETE /api/users/:id               # Delete user (Admin only)
```

### Assets
```
GET    /api/assets                  # Get all assets (with filters)
GET    /api/assets/:id              # Get asset by ID
POST   /api/assets                  # Create new asset
PUT    /api/assets/:id              # Update asset
DELETE /api/assets/:id              # Delete asset
DELETE /api/assets/bulk             # Bulk delete assets
POST   /api/assets/:id/qr           # Generate QR code
GET    /api/assets/qr/:assetId      # Get QR code
POST   /api/assets/scan             # Scan QR code
```

### Dashboard
```
GET    /api/dashboard/stats         # Get dashboard statistics
GET    /api/dashboard/assets        # Get asset distribution
GET    /api/dashboard/transactions  # Get recent transactions
GET    /api/dashboard/vendor-performance  # Vendor metrics
```

### Approvals
```
GET    /api/approvals               # Get all approvals
GET    /api/approvals/:id           # Get approval by ID
POST   /api/approvals               # Create approval request
PUT    /api/approvals/:id/approve   # Approve request
PUT    /api/approvals/:id/reject    # Reject request
```

### Vendors
```
GET    /api/vendors                 # Get all vendors
GET    /api/vendors/:id             # Get vendor by ID
POST   /api/vendors                 # Create vendor
PUT    /api/vendors/:id             # Update vendor
DELETE /api/vendors/:id             # Delete vendor
GET    /api/vendor-portal/profile   # Vendor profile
PUT    /api/vendor-portal/profile   # Update vendor profile
GET    /api/vendor-portal/orders    # Vendor orders
```

### Audit Logs
```
GET    /api/audit-logs              # Get all audit logs
GET    /api/audit-logs/:id          # Get audit log by ID
POST   /api/audit-logs              # Create audit log entry
```

### 📖 Interactive API Documentation

Access the complete Swagger UI documentation at:
**http://localhost:5000/api-docs**

Features:
- Try out API endpoints directly from browser
- View request/response schemas
- Authentication testing
- Example payloads

## Additional Documentation

- [Test Accounts Guide](./TEST_ACCOUNTS.md) - Complete credentials and permissions
- [Vendor Portal Guide](./VENDOR_PORTAL_COMPLETE.md) - Vendor-specific features
- [Architecture Overview](./ARCHITECTURE.md) - System architecture details
- [Enhanced Features](./ENHANCED_FEATURES_IMPLEMENTATION.md) - QR scanning, photo capture, etc.

## 🔒 Security Best Practices

### ⚠️ Before Production Deployment

#### 1. Change Default Passwords
```bash
# All test accounts use weak passwords
# Change them immediately before going live
# Use strong passwords: min 12 chars, uppercase, lowercase, numbers, symbols
```

#### 2. Environment Variables Security
```bash
# Generate strong JWT secret (32+ characters)
JWT_SECRET=$(openssl rand -base64 32)

# Use strong database credentials
MONGODB_URI=mongodb://username:password@localhost:27017/production-db

# Never commit .env file to version control
echo ".env" >> .gitignore
```

#### 3. Enable HTTPS/SSL
```bash
# Use Let's Encrypt for free SSL certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Force HTTPS redirect in nginx
return 301 https://$server_name$request_uri;
```

#### 4. Configure CORS Properly
```javascript
// Only allow your production domain
const corsOptions = {
  origin: 'https://yourdomain.com',
  credentials: true,
  optionsSuccessStatus: 200
};
```

#### 5. Implement Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

#### 6. Database Security
```bash
# Enable MongoDB authentication
mongo
use admin
db.createUser({
  user: "admin",
  pwd: "strong-password",
  roles: ["root"]
})

# Bind to localhost only
# In /etc/mongod.conf
net:
  bindIp: 127.0.0.1
```

#### 7. Security Headers
```javascript
// Already implemented with Helmet.js
const helmet = require('helmet');
app.use(helmet());
```

#### 8. Input Validation
```javascript
// Always validate and sanitize user input
// Use express-validator or joi
const { body, validationResult } = require('express-validator');
```

#### 9. Regular Updates
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

#### 10. Backup Strategy
```bash
# Automated daily backups
# See PRODUCTION_DEPLOYMENT_GUIDE.md for backup scripts
0 2 * * * /path/to/backup-script.sh
```

### 🛡️ Security Features Implemented

✅ **Password Hashing** - bcryptjs with salt rounds  
✅ **JWT Authentication** - Token-based auth with expiration  
✅ **CORS Protection** - Whitelist origin configuration  
✅ **Input Validation** - Middleware validation on all inputs  
✅ **SQL Injection Prevention** - Mongoose parameterized queries  
✅ **XSS Protection** - Input sanitization  
✅ **Security Headers** - Helmet.js implementation  
✅ **File Upload Validation** - File type and size restrictions  
✅ **Error Handling** - No sensitive data in error messages  
✅ **Audit Logging** - Track all user actions  

### 📋 Security Checklist

- [ ] Changed all default passwords
- [ ] Generated strong JWT_SECRET
- [ ] Enabled MongoDB authentication
- [ ] Configured firewall (UFW/Windows Firewall)
- [ ] Enabled HTTPS/SSL
- [ ] Configured CORS for production domain
- [ ] Implemented rate limiting
- [ ] Set up automated backups
- [ ] Configured log rotation
- [ ] Enabled Fail2Ban (Linux)
- [ ] Removed development/debug code
- [ ] Updated all dependencies
- [ ] Ran security audit (`npm audit`)
- [ ] Set NODE_ENV=production
- [ ] Configured reverse proxy (Nginx)
- [ ] Set up monitoring/alerting

## 🐛 Troubleshooting

### MongoDB Connection Issues

**Problem**: Cannot connect to MongoDB

```bash
# Check if MongoDB is running
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl status mongod

# Start MongoDB if not running
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

**Solution**:
1. Verify MongoDB is installed and running
2. Check connection string in `backend/.env`
3. Default: `mongodb://localhost:27017/dead-stock-register`
4. Try connecting with MongoDB Compass to verify connection

---

### Login Issues

**Problem**: Cannot login with test credentials

**Solution**:
```bash
# Re-run seed script to create test accounts
cd backend
node seed/seedUsers.js

# Verify users in MongoDB
mongo
use dead-stock-register
db.users.find()
```

**Common causes**:
- Backend not running on port 5000
- Frontend not running on port 5173
- CORS configuration issue
- JWT_SECRET not set in .env
- Database connection failure

---

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Windows - Find and kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

---

### Build Errors

**Problem**: TypeScript or build errors

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite node_modules/.vite

# Check TypeScript errors
npm run type-check

# Fresh build
npm run build
```

---

### CORS Errors

**Problem**: `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution**:
1. Check `FRONTEND_URL` in `backend/.env` matches your frontend URL
2. Verify CORS configuration in `backend/server.js`
3. Make sure both frontend and backend are running

```javascript
// backend/server.js
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
};
```

---

### File Upload Issues

**Problem**: Cannot upload files/photos

**Solution**:
1. Check `backend/uploads/` directory exists and has write permissions
2. Verify `multer` is configured correctly
3. Check file size limits in middleware
4. Ensure proper file types are allowed

```bash
# Create uploads directories
cd backend
mkdir -p uploads/documents uploads/photos uploads/qrcodes
```

---

### JWT Token Expired

**Problem**: Getting "Token expired" errors

**Solution**:
1. Login again to get a new token
2. Adjust token expiration in `backend/.env`: `JWT_EXPIRES_IN=24h`
3. Clear browser localStorage and cookies

---

### QR Code Scanner Not Working

**Problem**: Camera not accessible for QR scanning

**Solution**:
1. Grant camera permissions in browser
2. Use HTTPS in production (camera requires secure context)
3. Check browser compatibility (Chrome/Edge/Safari recommended)
4. Ensure camera is not being used by another application

---

### Performance Issues

**Problem**: Application is slow

**Solution**:
1. Check MongoDB indexes are created
2. Enable pagination for large datasets
3. Optimize database queries with `.lean()` and `.select()`
4. Use Redis for caching (optional)
5. Monitor logs in `backend/logs/`

```bash
# Check MongoDB performance
mongo
use dead-stock-register
db.assets.getIndexes()
db.currentOp()
```

---

### Email Notifications Not Sending

**Problem**: Email notifications not working

**Solution**:
1. Configure email settings in `backend/.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```
2. For Gmail, enable "Less secure app access" or use App Passwords
3. Check email service logs
4. Verify nodemailer configuration

---

### Need More Help?

1. Check the logs:
```bash
# Application logs
tail -f backend/logs/application-*.log

# Error logs
tail -f backend/logs/error-*.log
```

2. Enable debug mode:
```bash
# In backend/.env
DEBUG=true
NODE_ENV=development
```

3. Open an issue on GitHub with:
   - Error message
   - Steps to reproduce
   - Environment details (OS, Node version, MongoDB version)
   - Relevant log excerpts

## 🚀 Deployment

### Quick Deploy (Recommended) 🌟

Deploy your application in **10 minutes** using these cloud platforms:

1. **Backend** → [Render](https://render.com) (Free tier available)
2. **Frontend** → [Vercel](https://vercel.com) (Free tier available)
3. **Database** → [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Free tier available)

📖 **[Read the Quick Deployment Guide →](./DEPLOY.md)**

#### Pre-Deployment Verification
```bash
# Run verification script
node verify-deployment.js
```

#### Deployment Files Included
- ✅ `vercel.json` - Vercel configuration for frontend
- ✅ `backend/render.yaml` - Render configuration for backend
- ✅ `.env.production.example` - Production environment template
- ✅ `DEPLOY.md` - Quick start guide
- ✅ `DEPLOYMENT_GUIDE.md` - Comprehensive deployment instructions
- ✅ `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist

### Development Deployment
```bash
# Frontend (Vite dev server - Port 3000)
npm run dev

# Backend (Node.js - Port 5000)
cd backend
npm run dev
```

### Production Deployment Options

#### ✨ Option 1: Render + Vercel (Recommended)
**Best for**: Quick deployment, automatic scaling, zero DevOps
- **Backend**: Deploy to Render using `backend/render.yaml`
- **Frontend**: Deploy to Vercel using `vercel.json`
- **Time**: ~10 minutes
- **Cost**: FREE tier available
- **Guide**: See [DEPLOY.md](./DEPLOY.md)

#### Option 2: Traditional Server (Linux/VPS)
**Best for**: Full control, existing infrastructure

```bash
# 1. Install dependencies
npm install --production

# 2. Build frontend
npm run build

# 3. Serve frontend with Nginx
sudo cp -r build/* /var/www/html/

# 4. Start backend with PM2
cd backend
pm2 start server.js --name dead-stock-api
pm2 save
pm2 startup

# 5. Configure Nginx reverse proxy
# See DEPLOYMENT_GUIDE.md for complete nginx config
```

#### Option 3: Docker (Coming Soon)

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

#### Option 4: Other Cloud Platforms

**Railway**
- Similar to Render
- Good alternative with free tier

**Heroku**
```bash
heroku create your-app-name
git push heroku main
heroku config:set JWT_SECRET=your-secret
```

**AWS / DigitalOcean / Linode**
- See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed VPS setup

### Environment Variables

Create `.env` file in backend directory:

```env
# Server
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourdomain.com

# Database
MONGODB_URI=mongodb://localhost:27017/dead-stock-register

# Authentication
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# File Upload
MAX_FILE_SIZE=10485760

# Logging
LOG_LEVEL=info
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

### 1. Fork the Repository
```bash
# Click the "Fork" button on GitHub
# Clone your fork
git clone https://github.com/YOUR-USERNAME/Online-Dead-Stock-Register.git
cd Online-Dead-Stock-Register
```

### 2. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 3. Make Your Changes
- Write clean, readable code
- Follow existing code style
- Add comments where necessary
- Update documentation if needed

### 4. Test Your Changes
```bash
# Run frontend
npm run dev

# Run backend
cd backend
npm start

# Check for TypeScript errors
npm run type-check

# Run linter
npm run lint
```

### 5. Commit Your Changes
```bash
git add .
git commit -m "feat: add new feature description"

# Commit message format:
# feat: new feature
# fix: bug fix
# docs: documentation changes
# style: formatting, missing semicolons, etc.
# refactor: code restructuring
# test: adding tests
# chore: maintenance tasks
```

### 6. Push to Your Fork
```bash
git push origin feature/your-feature-name
```

### 7. Create a Pull Request
- Go to the original repository on GitHub
- Click "New Pull Request"
- Select your fork and branch
- Describe your changes
- Submit the PR

### Code Style Guidelines
- Use **TypeScript** for frontend code
- Use **ESLint** for linting
- Follow **Material-UI** design patterns
- Write **meaningful variable names**
- Add **JSDoc comments** for functions
- Keep functions **small and focused**
- Use **async/await** over promises

### Reporting Issues
When reporting issues, please include:
- Description of the problem
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details (OS, Node version, browser)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

### MIT License Summary
- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use
- ⚠️ Liability: No warranty
- ⚠️ Must include copyright notice

---

## 👨‍💻 Author

**Keval Lathiya**
- GitHub: [@kevallathiya-74](https://github.com/kevallathiya-74)
- Repository: [Online-Dead-Stock-Register](https://github.com/kevallathiya-74/Online-Dead-Stock-Register)

---

## 📞 Support

### Need Help?

1. **Check Documentation**
   - [Quick Reference](./QUICK_REFERENCE.md)
   - [Production Deployment Guide](./PRODUCTION_DEPLOYMENT_GUIDE.md)
   - [API Testing Guide](./API_TESTING_GUIDE.md)

2. **Search Issues**
   - Check [existing issues](https://github.com/kevallathiya-74/Online-Dead-Stock-Register/issues)
   - Someone might have solved your problem

3. **Create New Issue**
   - [Report a bug](https://github.com/kevallathiya-74/Online-Dead-Stock-Register/issues/new)
   - [Request a feature](https://github.com/kevallathiya-74/Online-Dead-Stock-Register/issues/new)

4. **Contact**
   - For business inquiries or collaboration
   - Open an issue on GitHub

---

## ⭐ Show Your Support

If you find this project helpful, please consider:
- ⭐ **Star this repository** on GitHub
- 🍴 **Fork it** and contribute
- 📢 **Share it** with others
- 🐛 **Report issues** you find
- 💡 **Suggest features** you'd like

---

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/kevallathiya-74/Online-Dead-Stock-Register?style=social)
![GitHub forks](https://img.shields.io/github/forks/kevallathiya-74/Online-Dead-Stock-Register?style=social)
![GitHub issues](https://img.shields.io/github/issues/kevallathiya-74/Online-Dead-Stock-Register)
![GitHub pull requests](https://img.shields.io/github/issues-pr/kevallathiya-74/Online-Dead-Stock-Register)

**Built with ❤️ by the development team**

---

## 🙏 Acknowledgments

- **React Team** - For the amazing frontend framework
- **Material-UI** - For the beautiful component library
- **MongoDB** - For the flexible database
- **Express.js** - For the robust backend framework
- **Open Source Community** - For countless libraries and tools

---

<div align="center">
  
**Made with ❤️ in India 🇮🇳**

*Last Updated: October 31, 2025*

[⬆ Back to Top](#-online-dead-stock-register)

</div>