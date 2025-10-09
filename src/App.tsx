import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { theme } from './config/theme';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Protected Route Component
import ProtectedRoute from './components/auth/ProtectedRoute';
import { UserRole } from './types';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              {/* Admin Routes */}
              <Route
                element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}
              >
                <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/users/*" element={<Navigate to="/users/list" replace />} />
                <Route path="/settings/*" element={<Navigate to="/settings/general" replace />} />
              </Route>

              {/* Inventory Manager Routes */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={[UserRole.ADMIN, UserRole.INVENTORY_MANAGER]}
                  />
                }
              >
                <Route path="/assets/*" element={<Navigate to="/assets/list" replace />} />
                <Route path="/vendors/*" element={<Navigate to="/vendors/list" replace />} />
                <Route path="/maintenance/*" element={<Navigate to="/maintenance/schedule" replace />} />
              </Route>

              {/* Auditor Routes */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      UserRole.ADMIN,
                      UserRole.INVENTORY_MANAGER,
                      UserRole.AUDITOR,
                    ]}
                  />
                }
              >
                <Route path="/audit/*" element={<Navigate to="/audit/logs" replace />} />
                <Route path="/reports/*" element={<Navigate to="/reports/overview" replace />} />
              </Route>

              {/* Common Protected Routes */}
              <Route path="/dashboard/*" element={<Navigate to="/dashboard/overview" replace />} />
              <Route path="/profile/*" element={<Navigate to="/profile/details" replace />} />
            </Route>

            {/* Default Routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
        <ToastContainer position="top-right" autoClose={5000} />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
