import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { theme } from './config/theme';
import { initializeDemoData } from './utils/demoData';
import { UserRole } from './types';

// Auth Pages
import Landing from './pages/auth/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminRegister from './pages/auth/AdminRegister';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';

// Documents Pages
import Documents from './pages/documents/Documents';

// Admin Pages
import UsersPage from './pages/users/UsersPage';

// Inventory Manager Pages
import AssetsPage from './pages/assets/AssetsPage';

// Protected Route Component
import ProtectedRoute from './components/auth/ProtectedRoute';

const App = () => {
  // Initialize demo data on app startup
  useEffect(() => {
    initializeDemoData();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin-register" element={<AdminRegister />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/*" element={<Dashboard />} />
              <Route path="/documents" element={<Documents />} />
            </Route>
              
            {/* Admin Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
              <Route path="/users" element={<UsersPage />} />
              <Route path="/users/*" element={<UsersPage />} />
            </Route>
              
            {/* Inventory Manager Routes */}
            <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.INVENTORY_MANAGER]} />}>
              <Route path="/assets" element={<AssetsPage />} />
              <Route path="/assets/*" element={<AssetsPage />} />
            </Route>

            {/* Default Routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        
        {/* Toast Container for notifications */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
