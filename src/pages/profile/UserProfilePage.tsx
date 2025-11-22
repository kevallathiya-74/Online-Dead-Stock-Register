import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Save, Visibility, VisibilityOff, Lock } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const UserProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    employee_id: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  // Fetch profile data from API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get('/users/profile');
        const data = response.data.user;
        
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          department: data.department || '',
          employee_id: data.employee_id || ''
        });
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Failed to load profile';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Only send name and phone (non-admin users cannot change department/employee_id)
      const payload = {
        name: formData.name,
        phone: formData.phone
      };
      
      await api.put('/users/profile', payload);
      
      await refreshUser();
      toast.success('Profile updated successfully');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to update profile';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      setPasswordError(null);

      // Validation
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        setPasswordError('All password fields are required');
        return;
      }

      if (passwordData.newPassword.length < 8) {
        setPasswordError('New password must be at least 8 characters long');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError('New passwords do not match');
        return;
      }

      setChangingPassword(true);

      await api.post('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      toast.success('Password changed successfully');
      
      // Clear password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to change password';
      setPasswordError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', mr: 2, fontSize: 32 }}>
            {(user?.name || user?.full_name || user?.email)?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom>
              My Profile
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your personal information
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {/* Personal Information */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={formData.email}
                    disabled
                    helperText="Email cannot be changed"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Department"
                    value={formData.department}
                    placeholder="Not assigned"
                    disabled
                    helperText="Only admins can change this field"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Employee ID"
                    value={formData.employee_id}
                    placeholder="Not assigned"
                    disabled
                    helperText="Only admins can change this field"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Role"
                    value={user?.role || ''}
                    disabled
                    helperText="Role cannot be changed"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Change Password Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                <Lock sx={{ verticalAlign: 'middle', mr: 1 }} />
                Change Password
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {passwordError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPasswordError(null)}>
                  {passwordError}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    type={showPassword.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                            edge="end"
                          >
                            {showPassword.current ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type={showPassword.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    helperText="Minimum 8 characters"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                            edge="end"
                          >
                            {showPassword.new ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type={showPassword.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                            edge="end"
                          >
                            {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={changingPassword ? <CircularProgress size={20} /> : <Lock />}
                  onClick={handlePasswordChange}
                  disabled={changingPassword}
                >
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Save Button */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
};

export default UserProfilePage;
