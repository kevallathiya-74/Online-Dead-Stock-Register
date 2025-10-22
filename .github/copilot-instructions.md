# Online Dead Stock Register - AI Coding Instructions

## Project Overview

A comprehensive dead stock management system for tracking and managing organizational assets. The system features QR code-based asset tracking, role-based access control, real-time asset monitoring, and detailed reporting capabilities.

## Architecture Overview

This is a full-stack asset management system using React/TypeScript frontend with Express.js/MongoDB backend, featuring role-based access control and integrated authentication.

### Technology Stack Overview

**Frontend Core**:
- React 18 with TypeScript
- Material-UI v5 for UI components
- Redux Toolkit for state management
- React Hook Form + Yup for form handling
- React Router v6 for routing
- Chart.js + Recharts for visualizations
- QR code integration (qrcode.react, react-qr-scanner)

**Backend Core**:
- Express.js for API server
- MongoDB with Mongoose ODM
- JWT authentication
- Multer for file uploads
- bcryptjs for security
- Node.js background jobs

### Key Architecture Patterns

**Frontend Stack**: React 18 + TypeScript + Material-UI + Redux Toolkit + Tailwind CSS  
**Backend Stack**: Express.js + MongoDB/Mongoose + JWT authentication  
**Project Structure**: Monorepo with `/src` (React client) and `/backend` (Express API)

## Critical Development Workflows

### Environment Setup
```bash
# Frontend dependencies (root directory)
npm install
# Backend dependencies
cd backend && npm install
# Start both servers
npm start  # React dev server (port 3000)
cd backend && node server.js  # Express API (port 5000)
```

### Authentication Architecture
- **JWT-based authentication**: Token-based authentication using `jsonwebtoken` library
- Frontend stores JWT tokens and includes them in API requests via `Authorization: Bearer <token>`
- Backend JWT middleware (`backend/middleware/authMiddleware.js`) validates tokens and attaches user to `req.user`
- User roles: `ADMIN`, `INVENTORY_MANAGER`, `AUDITOR`, `EMPLOYEE` (see `src/types/index.ts`)
- Token signing uses `JWT_SECRET` from environment variables with HS256 algorithm

### Database Patterns
- **MongoDB** with Mongoose ODM for all data (assets, users, transactions, auth)
- Models follow strict schema patterns with refs: `assigned_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }`
- All models include `timestamps: true` for audit trails
- User authentication data stored in MongoDB with bcrypt password hashing

## Project-Specific Conventions

### API Structure
- **REST endpoints** follow `/api/{resource}` pattern (see `backend/server.js`)
- **Centralized API config** in `src/config/api.config.ts` with typed endpoints
- **Controller pattern**: Separate controllers for each resource (`backend/controllers/`)
- **Population pattern**: Always populate refs in GET operations: `.populate('assigned_user', 'name email')`

### Frontend Patterns
- **Route protection**: Nested `ProtectedRoute` components with role-based access in `App.tsx`
- **State management**: Redux Toolkit for auth state and JWT token storage
- **Component structure**: `/components/{domain}` pattern (auth, dashboard, layout)
- **Type definitions**: Comprehensive types in `src/types/` with enums for status values

### Authentication Flow
1. User login → Backend validates credentials and signs JWT token
2. Frontend stores JWT token (localStorage/sessionStorage)
3. API calls include `Authorization: Bearer <token>` headers
4. Backend middleware (`authMiddleware.js`) validates JWT and attaches `req.user`
5. Role-based access via `requireRole(['admin'])` middleware wrapper

### Asset Management Specifics
- **Unique asset IDs**: `unique_asset_id` field with business logic generation
- **Status tracking**: Enum-based status with audit trails (`AssetStatus` enum)
- **QR code integration**: Assets have QR codes for scanning workflows
- **Maintenance tracking**: Linked maintenance records with vendor management

### Error Handling Patterns
- **React Toast notifications**: `react-toastify` for user feedback
- **API error responses**: Consistent `{ message: string }` format
- **JWT validation**: Handles `TokenExpiredError`, `JsonWebTokenError`, and invalid signatures

## Integration Points

### JWT Token Management
- **Token signing**: Uses HS256 algorithm with `JWT_SECRET` from environment
- **Token payload**: Contains user ID, email, role, and expiration time
- **Middleware validation**: Automatic token verification and user attachment to requests
- **Security**: Tokens expire after configurable time periods for security

### File Upload Patterns
- **Multer middleware** for document uploads (backend)
- **React Dropzone** for frontend file handling
- **Document types**: Enum-based categorization (`DocumentType` enum)

### Database Seeding
- Seed scripts in `backend/seed/` directory (currently empty `seedAssets.js`)
- Use MongoDB connection patterns from `backend/config/db.js`

## Development Notes

- **Material-UI theming**: Custom theme in `src/config/theme.ts` with primary/secondary colors
- **Tailwind integration**: Extended with custom color palette matching MUI theme
- **Form handling**: React Hook Form with Yup validation throughout
- **Chart integration**: Chart.js with React wrapper for analytics/dashboards
- **Date handling**: `date-fns` library for consistent date operations

### Common Gotchas
- Backend requires `JWT_SECRET` in `.env` - auth middleware fails without it
- JWT tokens must be included in `Authorization: Bearer <token>` header format
- Asset updates have ownership validation - only assigned user or admin can modify
- All API responses should be consistent JSON format with error handling

## Testing and Quality Assurance

### Unit Testing
- Frontend: Jest + React Testing Library
- Backend: Jest + Supertest
- Models: Mongoose model testing
- Services: Mocked dependencies

### Integration Testing
- API endpoint testing
- Authentication flow testing
- Asset management workflows
- File upload testing

### End-to-End Testing
- User journeys
- Asset lifecycle testing
- Role-based access testing
- QR code workflows

## Deployment Guidelines

### Production Build
```bash
# Frontend build
npm run build

# Backend preparation
cd backend
npm install --production
```

### Environment Variables
```bash
# Frontend (.env)
REACT_APP_API_URL=http://api.example.com
REACT_APP_VERSION=1.0.0

# Backend (.env)
NODE_ENV=production
MONGODB_URI=mongodb://...
JWT_SECRET=secure-secret
PORT=5000
```

### Security Checklist
- [ ] Environment variables configured
- [ ] JWT secret properly set
- [ ] CORS settings reviewed
- [ ] MongoDB authentication enabled
- [ ] API rate limiting configured
- [ ] File upload limits set
- [ ] Error handling sanitized
- [ ] SSL/TLS certificates installed

## Performance Optimization

### Frontend Optimization
1. Code splitting and lazy loading
2. Image optimization
3. Bundle size analysis
4. Caching strategies
5. Performance monitoring

### Backend Optimization
1. Database indexing
2. Query optimization
3. Response caching
4. Connection pooling
5. Load balancing

## Maintenance and Updates

### Regular Tasks
1. Dependency updates
2. Security patches
3. Database backups
4. Log rotation
5. Performance monitoring

### Emergency Procedures
1. Rollback procedures
2. Database recovery
3. SSL certificate renewal
4. Security incident response
5. Service outage handling