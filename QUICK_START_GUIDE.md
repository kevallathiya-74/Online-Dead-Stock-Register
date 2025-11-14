# Online Dead Stock Register - Quick Start Guide

## 🚀 Project Overview
Enterprise-grade MERN stack application for managing organizational asset inventory with comprehensive tracking, approval workflows, and analytics.

**Current Status:** Production-Ready (90/100 score)

---

## 📋 Prerequisites

- Node.js >= 16.0.0
- MongoDB 7.6.3+
- Redis (optional, has in-memory fallback)
- npm or yarn

---

## 🛠️ Local Development Setup

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd Online-Dead-Stock-Register
```

### 2. Backend Setup
```bash
cd backend
npm install

# Copy environment template
copy .env.example .env

# Edit .env with your values:
# - MONGODB_URI (from MongoDB Atlas)
# - JWT_SECRET (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
# - ALLOWED_ORIGINS=http://localhost:3000

# Start backend
npm run dev
```

Backend runs on: http://localhost:5000

### 3. Frontend Setup
```bash
# From root directory
npm install

# Start frontend
npm run dev
```

Frontend runs on: http://localhost:3000

---

## 🧪 Running Tests

### Backend Tests
```bash
cd backend

# Run all tests
npm test

# Watch mode (TDD)
npm run test:watch

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# With coverage
npm test -- --coverage
```

### Frontend Tests
```bash
# From root
npm test
```

---

## 📁 Project Structure

```
Online-Dead-Stock-Register/
├── backend/
│   ├── config/          # Configuration files
│   │   ├── db.js           # MongoDB connection
│   │   ├── redis.js        # Redis with fallback
│   │   ├── sentry.js       # Error tracking
│   │   └── validateEnv.js  # Startup validation
│   ├── controllers/     # HTTP request handlers (thin layer)
│   ├── services/        # Business logic layer ⭐
│   │   ├── assetService.js
│   │   ├── userService.js
│   │   ├── vendorService.js
│   │   ├── approvalService.js
│   │   └── notificationService.js
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routes
│   ├── middleware/      # Auth, caching, logging
│   ├── utils/           # Helper functions
│   ├── __tests__/       # Jest tests
│   └── server.js        # Entry point
│
├── src/
│   ├── components/      # React components
│   ├── hooks/          # Custom React hooks ⭐
│   │   ├── useAssets.ts   # React Query for assets
│   │   └── useUsers.ts    # React Query for users
│   ├── pages/          # Route pages
│   ├── services/       # API calls
│   ├── types/          # TypeScript definitions
│   └── store.ts        # Redux store
│
└── .github/
    └── workflows/      # CI/CD pipelines ⭐
        ├── ci-cd.yml       # Main pipeline
        ├── code-quality.yml
        ├── backup.yml
        └── health-check.yml
```

---

## 🔑 Key Features Implemented

### Service Layer Architecture
- **assetService**: Asset CRUD with transactions
- **userService**: User management with RBAC
- **vendorService**: Vendor operations with metrics
- **approvalService**: Multi-level approval workflows
- **notificationService**: Real-time alerts system

### Performance Optimizations
- ✅ Redis caching (automatic fallback to in-memory)
- ✅ Database indexes on critical queries
- ✅ Image optimization (Sharp, 60% reduction)
- ✅ Response compression (gzip)
- ✅ Aggregation pipelines (no N+1 queries)

### Security Features
- ✅ Environment-driven CORS
- ✅ Rate limiting (500 req/15min)
- ✅ NoSQL injection protection
- ✅ JWT authentication
- ✅ Helmet security headers
- ✅ Request tracing with UUIDs

### Monitoring & CI/CD
- ✅ Sentry error tracking
- ✅ Winston logging with rotation
- ✅ Enhanced health checks
- ✅ GitHub Actions workflows
- ✅ Automated testing on PRs
- ✅ Daily database backups

---

## 🔧 Common Commands

### Development
```bash
# Backend dev mode (with nodemon)
cd backend && npm run dev

# Frontend dev mode (with hot reload)
npm run dev

# Build frontend for production
npm run build

# Preview production build
npm run preview
```

### Testing
```bash
# Run all backend tests
cd backend && npm test

# Run specific test file
cd backend && npm test -- assetService.test.js

# Generate coverage report
cd backend && npm test -- --coverage
```

### Database
```bash
# Seed approval and maintenance data
cd backend && node seedApprovalsAndMaintenance.js
```

---

## 🌐 API Documentation

### Base URL
- **Local:** http://localhost:5000/api/v1
- **Production:** https://your-backend.onrender.com/api/v1

### Swagger Documentation
Visit: http://localhost:5000/api-docs

### Key Endpoints

#### Authentication
```
POST /auth/register  - Register new user
POST /auth/login     - Login and get JWT token
GET  /auth/profile   - Get current user profile
```

#### Assets
```
GET    /assets              - Get all assets (with filters)
GET    /assets/:id          - Get single asset
POST   /assets              - Create new asset
PUT    /assets/:id          - Update asset
DELETE /assets/:id          - Delete asset (soft delete)
GET    /assets/stats        - Get asset statistics
```

#### Approvals
```
GET    /approvals           - Get approval requests
GET    /approvals/:id       - Get approval details
POST   /approvals           - Create approval request
POST   /approvals/:id/approve  - Approve request
POST   /approvals/:id/reject   - Reject request
GET    /approvals/pending   - Get pending approvals for user
```

#### Vendors
```
GET    /vendors             - Get all vendors
GET    /vendors/:id         - Get vendor details
POST   /vendors             - Create vendor
PUT    /vendors/:id         - Update vendor
DELETE /vendors/:id         - Delete vendor
GET    /vendors/:id/performance - Get vendor metrics
```

---

## 📊 Environment Variables

### Backend (.env)

#### Required
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/database
JWT_SECRET=your_32_character_minimum_secret_here
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
NODE_ENV=development
PORT=5000
```

#### Email (Required for notifications)
```bash
BREVO_API_KEY=your_brevo_api_key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Dead Stock Register
```

#### Optional (Recommended for production)
```bash
SENTRY_DSN=your_sentry_dsn
REDIS_HOST=your_redis_host
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

### Frontend (.env)
```bash
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_SENTRY_DSN=your_frontend_sentry_dsn
```

---

## 🚢 Deployment

### Backend (Render)
1. Create new Web Service on Render
2. Connect GitHub repository
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && node server.js`
5. Add environment variables from `.env.example`
6. Deploy!

### Frontend (Vercel)
1. Import project from GitHub
2. Set environment variable: `VITE_API_BASE_URL`
3. Deploy automatically on push to main

### CI/CD Setup
See `CI_CD_SETUP.txt` for complete instructions on:
- GitHub secrets configuration
- Deployment automation
- Health monitoring
- Database backups

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check environment variables
cd backend
node -e "require('./config/validateEnv')()"

# Check MongoDB connection
# Ensure IP is whitelisted in MongoDB Atlas (0.0.0.0/0 for cloud deployments)
```

### Frontend can't connect to backend
```bash
# Check CORS settings
# Ensure frontend URL is in ALLOWED_ORIGINS

# Check backend is running
curl http://localhost:5000/health
```

### Tests failing
```bash
# Install all dependencies
cd backend && npm install

# Clear Jest cache
cd backend && npx jest --clearCache

# Run specific test with verbose output
cd backend && npm test -- --verbose assetService.test.js
```

### Redis not connecting
Don't worry! The system automatically falls back to in-memory caching if Redis is unavailable.

---

## 📚 Additional Documentation

- **TRANSFORMATION_REPORT.txt** - Complete journey from 73/100 to 90/100
- **IMPROVEMENT_SUMMARY.txt** - Detailed phase-by-phase progress
- **CI_CD_SETUP.txt** - CI/CD pipeline configuration guide
- **SYSTEM_ARCHITECTURE_DIAGRAM.md** - Architecture overview
- **README.md** - Original project README

---

## 👥 Default Login Credentials

See `LOGIN_CREDENTIALS.txt` for test accounts.

---

## 🔄 Development Workflow

### Feature Development
1. Create feature branch from `main`
2. Implement feature with tests
3. Run tests locally: `npm test`
4. Push branch and create Pull Request
5. GitHub Actions runs automated tests
6. Review and merge to `main`
7. Auto-deploy to production

### Adding a New Service
1. Create service file in `backend/services/`
2. Implement business logic with transactions
3. Add error handling and logging
4. Create unit tests in `backend/__tests__/services/`
5. Update controller to use service
6. Add integration tests
7. Update API documentation

### Adding a New API Hook
1. Create hook file in `src/hooks/`
2. Use @tanstack/react-query
3. Implement optimistic updates
4. Add error handling
5. Export hook for use in components

---

## 📈 Performance Monitoring

### Health Check
```bash
curl http://localhost:5000/health
```

Returns:
- Database status
- Memory usage
- Redis status
- Response time

### Logs
Backend logs are in `backend/logs/`:
- `combined.log` - All logs
- `error.log` - Errors only
- Rotated daily

### Sentry
Production errors tracked at: https://sentry.io/your-project

---

## 🎯 Next Steps

To reach 95/100 score:
1. Increase test coverage to 70%+ (currently 35%)
2. Complete remaining service layers
3. Refactor large controllers (user, report, maintenance)
4. Add E2E tests with Playwright
5. Implement database migrations

---

## 💡 Tips & Best Practices

1. **Always use services** - Controllers should be thin
2. **Write tests first** - TDD for critical paths
3. **Use transactions** - For multi-step operations
4. **Log everything** - Use logger, not console.log
5. **Cache wisely** - Use cache middleware on read-heavy endpoints
6. **Validate inputs** - Use validationMiddleware
7. **Handle errors** - Use try-catch and next(error)
8. **Document APIs** - Update Swagger annotations

---

## 🆘 Need Help?

1. Check documentation files in root directory
2. Review test files for usage examples
3. Check Swagger docs at /api-docs
4. Review commit history for implementation patterns

---

## ⚡ Quick Reference

| Task | Command |
|------|---------|
| Start backend | `cd backend && npm run dev` |
| Start frontend | `npm run dev` |
| Run tests | `cd backend && npm test` |
| Build production | `npm run build` |
| Check health | `curl localhost:5000/health` |
| View logs | `cat backend/logs/combined.log` |
| Clear cache | Redis: `redis-cli FLUSHALL` |

---

**Status:** Production-Ready ✅
**Score:** 90/100 (Enterprise-Grade)
**Last Updated:** 2024

Happy coding! 🚀
