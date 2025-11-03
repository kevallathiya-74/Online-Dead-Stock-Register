<div align="center">

# 🏢 Online Dead Stock Register

> A modern, production-ready enterprise asset management system built with the MERN stack (MongoDB, Express, React, Node.js) and TypeScript.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18.2.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-4.9.5-blue)](https://www.typescriptlang.org/)

</div>

## ✨ Features

### Core Functionality

- 🔐 **Role-Based Access Control** - 7 user roles (Admin, Inventory Manager, IT Manager, Auditor, Employee, Vendor)
- 📦 **Asset Lifecycle Management** - Track assets from purchase to disposal
- 📱 **QR Code System** - Generate and scan QR codes with camera integration
- ✅ **Multi-Level Approvals** - Approval workflows for requests and transfers
- 🔍 **Comprehensive Audit Logging** - Track all user actions and changes
- � **Role-Specific Dashboards** - Customized views for each user role
- 🔔 **Real-Time Notifications** - In-app and email notifications
- 📄 **Export & Reporting** - Generate reports in JSON, CSV, and PDF formats
- 👥 **Vendor Portal** - Dedicated interface for vendor management
- 🛠️ **Maintenance Tracking** - Schedule and track asset maintenance

### Technical Highlights

- 🔒 **JWT Authentication** - Secure token-based authentication
- 🌐 **RESTful API** - Clean, versioned API architecture
- 📸 **Photo Management** - Upload and manage asset photos
- 🔎 **Advanced Search & Filtering** - Find assets quickly with multiple filters
- 📱 **Responsive Design** - Works seamlessly on mobile, tablet, and desktop
- 🚀 **Production Ready** - Configured for Vercel (frontend) and Render (backend) deployment

## 🚀 Quick Start

### Prerequisites

- Node.js (v14.0.0 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/kevallathiya-74/Online-Dead-Stock-Register.git
cd Online-Dead-Stock-Register
```

2. **Install dependencies**

```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

3. **Configure environment variables**

```bash
# Backend: Create .env file in backend directory
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

4. **Seed database with test data**

```bash
cd backend
node seed/seedUsers.js
```

5. **Start the application**

```bash
# Terminal 1 - Backend (from backend directory)
npm start

# Terminal 2 - Frontend (from root directory)
npm run dev
```

6. **Access the application**

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Docs: http://localhost:5000/api-docs

### Default Login Credentials

| Role              | Email              | Password     |
| ----------------- | ------------------ | ------------ |
| Admin             | admin@test.com     | admin123     |
| Inventory Manager | inventory@test.com | inventory123 |
| IT Manager        | itmanager@test.com | itmanager123 |
| Auditor           | auditor@test.com   | auditor123   |
| Employee          | employee1@test.com | employee123  |
| Vendor            | vendor@test.com    | vendor123    |

> ⚠️ **Security Note**: Change these passwords before deploying to production!

## 🛠️ Tech Stack

**Frontend**

- React 18.2 with TypeScript
- Material-UI v5 (Component Library)
- Redux Toolkit (State Management)
- React Router v6 (Routing)
- Axios (HTTP Client)
- Recharts (Data Visualization)
- Vite (Build Tool)

**Backend**

- Node.js & Express.js
- MongoDB & Mongoose
- JWT (Authentication)
- Multer (File Uploads)
- Winston (Logging)
- Swagger (API Documentation)
- Nodemailer (Email Service)

## 📁 Project Structure

```
Online-Dead-Stock-Register/
├── src/                          # Frontend React application
│   ├── components/               # Reusable UI components
│   ├── pages/                    # Page components (dashboards, auth)
│   ├── services/                 # API service layer
│   ├── types/                    # TypeScript definitions
│   ├── utils/                    # Utility functions
│   └── App.tsx                   # Main app component
│
├── backend/                      # Backend Express application
│   ├── config/                   # Configuration (DB, Swagger)
│   ├── controllers/              # Route controllers
│   ├── models/                   # MongoDB schemas
│   ├── routes/                   # API routes
│   ├── middleware/               # Custom middleware
│   ├── services/                 # Business logic
│   ├── seed/                     # Database seed scripts
│   └── server.js                 # Express server entry point
│
├── public/                       # Static assets
├── .env.example                  # Environment template
└── vercel.json                   # Vercel deployment config
```

## 📜 Available Scripts

**Frontend**

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
```

**Backend**

```bash
npm start                # Start Express server
node seed/seedUsers.js   # Seed test user accounts
```

## 📡 API Overview

The backend provides a comprehensive REST API with the following endpoints:

**Authentication**: `/api/v1/auth` - Login, signup, password reset  
**Assets**: `/api/v1/assets` - CRUD operations, QR generation/scanning, bulk operations  
**Users**: `/api/v1/users` - User management, profile operations  
**Vendors**: `/api/v1/vendors` - Vendor management, purchase orders  
**Dashboard**: `/api/v1/dashboard` - Statistics, analytics, reports  
**Approvals**: `/api/v1/approvals` - Approval workflows  
**Audit Logs**: `/api/v1/audit-logs` - System audit trail  
**QR Scanning**: `/api/v1/qr` - QR code scanning operations

**Interactive Documentation**: Access Swagger UI at `http://localhost:5000/api-docs` for complete API reference with try-it-out functionality.

## 🔒 Security

The application implements enterprise-grade security features:

- 🔐 **JWT Authentication** with secure token management
- � **Password Hashing** using bcryptjs
- 🛡️ **CORS Protection** with origin whitelisting
- 🚫 **Rate Limiting** to prevent abuse
- 🔒 **Security Headers** via Helmet.js
- ✅ **Input Validation** and sanitization
- 📝 **Comprehensive Audit Logging**
- 🔐 **Role-Based Access Control (RBAC)**

## 🚀 Deployment

This project is configured for automatic deployment to:

**Frontend**: [Vercel](https://vercel.com) (recommended)

- Configuration: `vercel.json`
- Auto-deploy on git push
- Free tier available

**Backend**: [Render](https://render.com) (recommended)

- Configuration: `backend/render.yaml`
- Auto-deploy on git push
- Free tier available

**Database**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

- Managed MongoDB hosting
- Free tier available (512MB)

### Quick Deploy Steps

1. **Create MongoDB Atlas cluster**
   - Get connection string
2. **Deploy Backend to Render**

   - Connect GitHub repository
   - Set environment variables (MONGODB_URI, JWT_SECRET, etc.)
   - Render auto-detects `render.yaml`

3. **Deploy Frontend to Vercel**
   - Connect GitHub repository
   - Set `VITE_API_BASE_URL` to your Render backend URL
   - Vercel auto-detects `vercel.json`

### Environment Variables

**Backend** (`backend/.env`)

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_generated_secret_key
FRONTEND_URL=https://your-app.vercel.app
```

**Frontend** (Vercel dashboard)

```env
VITE_API_BASE_URL=https://your-backend.onrender.com
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Commit Message Format**: Use conventional commits (feat, fix, docs, style, refactor, test, chore)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 👨‍💻 Author

**Keval Lathiya**

- GitHub: [@kevallathiya-74](https://github.com/kevallathiya-74)

---

## ⭐ Support

If you find this project helpful, please consider giving it a ⭐ on GitHub!

For issues or questions:

- Check existing [GitHub Issues](https://github.com/kevallathiya-74/Online-Dead-Stock-Register/issues)
- Open a new issue for bugs or feature requests

---

<div align="center">

**Built with ❤️ using the MERN Stack**

[⬆ Back to Top](#-online-dead-stock-register)

</div>
