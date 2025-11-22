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
  IconButton,
  Chip,
  Stack,
  MenuItem
} from '@mui/material';
import { 
  Save, 
  Visibility, 
  VisibilityOff, 
  Lock, 
  Email,
  Phone,
  Badge,
  Business,
  CalendarToday,
  AccessTime
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  employee_id: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login: string;
}

const AdminProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

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
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // Fetch profile data from API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get('/users/profile');
        const data = response.data.user;
        
        setProfileData(data);
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
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-()]{10,}$/.test(formData.phone)) {
      errors.phone = 'Invalid phone number format';
    }

    if (!formData.department) {
      errors.department = 'Department is required';
    }

    if (!formData.employee_id.trim()) {
      errors.employee_id = 'Employee ID is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!validateForm()) {
        toast.error('Please fix validation errors');
        return;
      }
      
      const response = await api.put('/users/profile', {
        name: formData.name,
        phone: formData.phone,
        department: formData.department,
        employee_id: formData.employee_id
      });
      
      // Update profile data with response
      if (response.data.user) {
        setProfileData(response.data.user);
      }
      
      await refreshUser();
      toast.success('Profile updated successfully');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to update profile';
      setError(errorMsg);
      toast.error(errorMsg);
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

      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
        setPasswordError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: { xs: '100%', sm: '100%', md: 1400 }, mx: 'auto' }}>
        {/* Header Section */}
        <Paper sx={{ p: { xs: 2, sm: 3, md: 4 }, mb: { xs: 2, sm: 3 }, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar 
                sx={{ 
                  width: { xs: 60, sm: 70, md: 80 }, 
                  height: { xs: 60, sm: 70, md: 80 }, 
                  bgcolor: 'rgba(255, 255, 255, 0.3)', 
                  mr: { xs: 2, sm: 3 },
                  fontSize: { xs: 24, sm: 28, md: 32 },
                  fontWeight: 'bold',
                  color: 'white',
                  border: '3px solid white'
                }}
              >
                {formData.name?.[0]?.toUpperCase() || 'A'}
              </Avatar>
              <Box>
                <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 'bold', mb: 0.5 }}>
                  {formData.name || 'Administrator'}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  <Chip 
                    label={profileData?.role || 'ADMIN'} 
                    size="small" 
                    sx={{ 
                      bgcolor: 'rgba(255, 255, 255, 0.9)', 
                      color: '#667eea',
                      fontWeight: 'bold'
                    }} 
                  />
                  <Chip 
                    label={profileData?.is_active ? 'Active' : 'Inactive'} 
                    size="small" 
                    color={profileData?.is_active ? 'success' : 'default'}
                    sx={{ bgcolor: 'rgba(14, 0, 0, 0.9)' }}
                  />
                </Stack>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  {formData.email}
                </Typography>
              </Box>
            </Box>
            {profileData && (
              <Box sx={{ textAlign: 'right', color: 'white' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 1 }}>
                  <CalendarToday sx={{ fontSize: 16, mr: 0.5 }} />
                  <Typography variant="caption">
                    Joined: {formatDate(profileData.created_at)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <AccessTime sx={{ fontSize: 16, mr: 0.5 }} />
                  <Typography variant="caption">
                    Last Login: {formatDate(profileData.last_login)}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Personal Information */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Badge sx={{ mr: 1, color: 'primary.main' }} />
                Personal Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    error={!!validationErrors.name}
                    helperText={validationErrors.name || 'Your full legal name'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Badge />
                        </InputAdornment>
                      ),
                    }}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    disabled
                    helperText="Email cannot be changed"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    error={!!validationErrors.phone}
                    helperText={validationErrors.phone || 'Contact phone number'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone />
                        </InputAdornment>
                      ),
                    }}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Department"
                    value={formData.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                    error={!!validationErrors.department}
                    helperText={validationErrors.department || 'Select your department'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Business />
                        </InputAdornment>
                      ),
                    }}
                    required
                  >
                    <MenuItem value="ADMIN">Admin</MenuItem>
                    <MenuItem value="INVENTORY">Inventory</MenuItem>
                    <MenuItem value="IT">IT</MenuItem>
                    <MenuItem value="VENDOR">Vendor</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Employee ID"
                    value={formData.employee_id}
                    onChange={(e) => handleChange('employee_id', e.target.value)}
                    error={!!validationErrors.employee_id}
                    helperText={validationErrors.employee_id || 'Your unique employee identifier'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Badge />
                        </InputAdornment>
                      ),
                    }}
                    placeholder="EMP-XXXX"
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Role"
                    value={profileData?.role || 'ADMIN'}
                    disabled
                    helperText="Role is assigned by system administrators"
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                  onClick={handleSave}
                  disabled={saving || loading}
                  sx={{ minWidth: 150 }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Quick Stats Sidebar */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Account Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Account Status
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip 
                      label={profileData?.is_active ? 'Active' : 'Inactive'} 
                      color={profileData?.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    User ID
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, fontFamily: 'monospace' }}>
                    {profileData?.id || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Member Since
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {profileData ? formatDate(profileData.created_at) : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Last Login
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {profileData ? formatDate(profileData.last_login) : 'N/A'}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            <Paper sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'info.light' }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                💡 Admin Privileges
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                As an administrator, you have full access to update your profile information including department and employee ID.
              </Typography>
            </Paper>
          </Grid>

          {/* Change Password Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Lock sx={{ mr: 1, color: 'primary.main' }} />
                Security & Password
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              {passwordError && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setPasswordError(null)}>
                  {passwordError}
                </Alert>
              )}

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
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
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type={showPassword.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    helperText="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
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
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type={showPassword.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    helperText="Re-enter new password"
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

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={changingPassword ? <CircularProgress size={20} /> : <Lock />}
                  onClick={handlePasswordChange}
                  disabled={changingPassword}
                  sx={{ minWidth: 180 }}
                >
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
};

export default AdminProfilePage;
