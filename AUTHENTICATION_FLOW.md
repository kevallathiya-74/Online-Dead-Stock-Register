# Authentication Flow Test Guide

## Overview
This Dead Stock Register application implements a complete authentication flow with role-based access control. The system supports both demo mode and backend authentication.

## Authentication Flow

### 1. Project Startup
- **Landing Page (`/`)**: First page shown to users
- Beautiful gradient design with hero section
- Features overview and call-to-action buttons
- Sign In and Get Started buttons for navigation

### 2. Sign In/Sign Up Process
- **Login Page (`/login`)**: Accessible from landing page "Sign In" button
- **Register Page (`/register`)**: Accessible from landing page "Get Started" button
- Form validation with React Hook Form and Yup
- Demo users available for testing (any password works)

### 3. Role-Based Dashboard Redirection
After successful authentication, users are redirected to `/dashboard` where they see different views based on their role:

- **ADMIN**: Advanced dashboard with full system access
- **INVENTORY_MANAGER**: Manager dashboard with inventory controls
- **AUDITOR**: Auditor dashboard with audit tools and reports
- **EMPLOYEE**: Employee dashboard with limited access

## Demo Users
The application includes pre-configured demo users for testing:

| Role | Email | Password | Department |
|------|-------|----------|------------|
| Admin | admin@demo.com | any | Administration |
| Inventory Manager | manager@demo.com | any | Operations |
| Auditor | auditor@demo.com | any | Finance |
| Employee | employee@demo.com | any | IT |

## Testing the Authentication Flow

### Step 1: Start the Application
```bash
npm start
```

### Step 2: Test Complete Flow
1. **Landing Page**: Navigate to `http://localhost:3000`
   - Should show landing page with hero section
   - Verify "Sign In" and "Get Started" buttons work

2. **Registration Flow**: Click "Get Started"
   - Should navigate to `/register`
   - Fill form and submit (or use existing demo users)

3. **Login Flow**: Click "Sign In" or navigate to `/login`
   - Use demo credentials (e.g., `admin@demo.com` with any password)
   - Should redirect to `/dashboard` after successful login

4. **Role-Based Dashboard**: Verify correct dashboard loads
   - Admin users should see admin dashboard
   - Auditor users should see auditor dashboard
   - Employee users should see employee dashboard

5. **Protected Routes**: Try accessing `/documents`
   - Should work for authenticated users
   - Should redirect to login for unauthenticated users

6. **Logout**: Test logout functionality
   - Should clear authentication and redirect to landing page

## Features Verified

✅ **Landing Page Display**: Professional landing page with gradient design  
✅ **Authentication Required**: Protected routes redirect to login when not authenticated  
✅ **Role-Based Access**: Different dashboard views based on user role  
✅ **Demo Mode**: Demo users work with localStorage for testing  
✅ **Form Validation**: Proper validation on login/register forms  
✅ **Navigation Flow**: Smooth transitions between pages  
✅ **Responsive Design**: Works on different screen sizes  
✅ **Toast Notifications**: User feedback for login/logout actions  

## Architecture Notes

- **React Router v6**: Modern routing with protected routes
- **Material-UI**: Consistent design system
- **Context API**: Global authentication state management
- **localStorage**: Demo mode and token storage
- **TypeScript**: Type safety throughout the application
- **React Hook Form**: Form handling with validation

This authentication flow provides a complete user experience from project startup through authenticated dashboard access with proper role-based routing.