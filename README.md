# Online Dead Stock Register
- ✅ Default password: `Password@123`
A comprehensive, **production-ready** asset management system for tracking, auditing, and managing organizational assets.

## 🎉 Status: 100% Complete & Production Ready

This system is fully implemented with enterprise-grade features including professional logging, API documentation, and comprehensive deployment guides.

## ✨ Features

### Core Features
- **Multi-Role Authentication System** - Admin, Inventory Manager, Auditor, Employee, and Vendor roles
- **Asset Management** - Track assets throughout their lifecycle with QR codes
- **Approval Workflows** - Request and approve asset assignments, transfers, and maintenance
- **Audit Tools** - Comprehensive auditing with scheduled cron jobs and email notifications
- **Vendor Portal** - Dedicated vendor access for order tracking and document management
- **Reporting** - Generate detailed reports and export data (JSON & CSV)
- **Document Management** - Upload and manage asset-related documents with photo gallery

### Production Features ⭐ NEW
- **Professional Logging** - Winston logger with daily rotating files and retention policies
- **HTTP Request Logging** - Morgan middleware with user tracking and performance metrics
- **Interactive API Documentation** - Swagger UI at `/api-docs` with OpenAPI 3.0 spec
- **Production Configuration** - Complete .env templates with strong cryptographic secrets
- **Comprehensive Deployment Guide** - Step-by-step production deployment with PM2, Nginx, SSL
- **Automated Backups** - Daily MongoDB backups with 30-day retention
- **Security Hardening** - Firewall, Fail2Ban, SSL/TLS, security headers

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (running on localhost:27017)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/kevallathiya-74/Online-Dead-Stock-Register.git
cd Online-Dead-Stock-Register
```

2. **Install dependencies**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

3. **Configure environment variables**
```bash
# Backend configuration
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and other settings
```

4. **Create test user accounts**
```bash
cd backend
node seed/seedUsers.js
```

5. **Start the application**
```bash
# Terminal 1 - Start backend (from backend folder)
cd backend
npm start

# Terminal 2 - Start frontend (from root folder)
npm run dev
```

6. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- **API Documentation: http://localhost:5000/api-docs** ⭐ NEW

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

## User Roles

### ADMIN
- Full system access
- User management
- System configuration
- All reporting capabilities

### INVENTORY_MANAGER
- Asset and inventory management
- Vendor management
- Approval processing
- Inventory reporting

### AUDITOR
- Asset auditing
- Compliance verification
- Read-only access to system data
- Audit report generation

### EMPLOYEE
- View assigned assets
- Submit asset requests
- Track request status
- Basic self-service

### VENDOR
- View purchase orders
- Upload documents and invoices
- Track order status
- View linked assets

## Departments

- **INVENTORY** - Main department for stock management
- **IT** - Technology asset management
- **ADMIN** - Administrative operations
- **VENDOR** - Vendor-related operations

## Technology Stack

### Frontend
- React 18
- TypeScript
- Material-UI v5
- Redux Toolkit
- React Router v6
- Axios
- Recharts

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing

## Project Structure

```
Online-Dead-Stock-Register/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── services/          # API service layer
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── backend/               # Backend source code
│   ├── controllers/       # Route controllers
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   └── seed/             # Database seed scripts
└── public/               # Static assets
```

## Available Scripts

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend
```bash
npm start            # Start backend server
node seed/seedUsers.js    # Create test user accounts
node createUser.js <email> <password> <name> <role> <department>  # Create single user
```

## API Documentation

See [API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md) for complete API documentation.

## Additional Documentation

- [Test Accounts Guide](./TEST_ACCOUNTS.md) - Complete credentials and permissions
- [Vendor Portal Guide](./VENDOR_PORTAL_COMPLETE.md) - Vendor-specific features
- [Architecture Overview](./ARCHITECTURE.md) - System architecture details
- [Enhanced Features](./ENHANCED_FEATURES_IMPLEMENTATION.md) - QR scanning, photo capture, etc.

## Security Notes

⚠️ **Important:** The provided test accounts are for development only.

- Change all default passwords before production deployment
- Use strong passwords and implement password policies
- Enable HTTPS in production
- Configure CORS properly for your domain
- Implement rate limiting and other security measures

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod`
- Check connection string in `backend/.env`
- Default: `mongodb://localhost:27017/dead-stock-register`

### Login Issues
- Verify test accounts are created: `cd backend && node seed/seedUsers.js`
- Check backend is running on port 5000
- Check frontend is running on port 3000
- Verify CORS settings in `backend/server.js`

### Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear build cache: `npm run build` (fresh build)
- Check TypeScript errors: `tsc --noEmit`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Contact

For issues and questions, please open an issue on GitHub.