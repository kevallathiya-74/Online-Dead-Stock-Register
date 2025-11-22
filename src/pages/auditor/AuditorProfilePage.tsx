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
  Card,
  CardContent
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
  AccessTime,
  Assessment,
  VerifiedUser
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

const AuditorProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
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
          phone: data.phone || ''
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

    if (formData.phone && !/^\+?[\d\s-()]{10,}$/.test(formData.phone)) {
      errors.phone = 'Invalid phone number format';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      // Only send name and phone for auditor users
      const payload = {
        name: formData.name,
        phone: formData.phone
      };
      
      await api.put('/users/profile', payload);
      
      // Refresh profile data
      const response = await api.get('/users/profile');
      setProfileData(response.data.user);
      
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

      // Strong password validation
      const hasUpperCase = /[A-Z]/.test(passwordData.newPassword);
      const hasLowerCase = /[a-z]/.test(passwordData.newPassword);
      const hasNumber = /[0-9]/.test(passwordData.newPassword);

      if (!hasUpperCase || !hasLowerCase || !hasNumber) {
        setPasswordError('Password must contain uppercase, lowercase, and number');
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

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress size={60} />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: { xs: '100%', sm: '100%', md: 1400 }, mx: 'auto', p: { xs: 2, sm: 3 } }}>
        {/* Header Section with Gradient */}
        <Paper
          elevation={3}
          sx={{
            background: 'linear-gradient(135deg, #636cc4ff 0%, #6e5ae2ff 100%)',
            color: 'white',
            p: { xs: 2, sm: 3, md: 4 },
            mb: 3,
            borderRadius: 2
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  fontSize: 40,
                  border: '4px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <Assessment sx={{ fontSize: 50 }} />
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Auditor Profile
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
                {profileData?.name || 'Auditor User'}
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Chip
                  icon={<VerifiedUser />}
                  label={profileData?.role?.replace('_', ' ') || 'AUDITOR'}
                  sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white', fontWeight: 'bold' }}
                />
                <Chip
                  icon={<Assessment />}
                  label={profileData?.is_active ? 'Active' : 'Inactive'}
                  sx={{ bgcolor: profileData?.is_active ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)', color: 'white' }}
                />
              </Stack>
              <Stack direction="row" spacing={3} mt={2}>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Member Since
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatDate(profileData?.created_at || '')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Last Login
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatDate(profileData?.last_login || '')}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Main Content - Profile Information */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VerifiedUser color="primary" />
                Personal Information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Update your personal details and contact information
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
                    helperText={validationErrors.name || 'Your full name as per official records'}
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
                    helperText={validationErrors.phone || 'Your contact number with country code'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone />
                        </InputAdornment>
                      ),
                    }}
                    placeholder="+91 98765 43210"
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Department"
                    value={profileData?.department || ''}
                    disabled
                    helperText="Department is managed by administrators"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Business />
                        </InputAdornment>
                      ),
                    }}
                    placeholder="Not assigned"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Employee ID"
                    value={profileData?.employee_id || ''}
                    disabled
                    helperText="Employee ID is managed by administrators"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Badge />
                        </InputAdornment>
                      ),
                    }}
                    placeholder="Not assigned"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Role"
                    value={profileData?.role?.replace('_', ' ') || 'AUDITOR'}
                    disabled
                    helperText="Role cannot be changed"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <VerifiedUser />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                  onClick={handleSave}
                  disabled={saving}
                  sx={{ minWidth: 150 }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Sidebar - Account Information */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ mb: 3, bgcolor: 'background.default' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Assessment color="primary" />
                  Account Information
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Badge fontSize="small" />
                      User ID
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {profileData?.id || 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarToday fontSize="small" />
                      Account Created
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatDate(profileData?.created_at || '')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTime fontSize="small" />
                      Last Login
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatDate(profileData?.last_login || '')}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VerifiedUser />
                  Auditor Role
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  As an Auditor, you have specialized access to:
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    ✓ Asset auditing and verification
                  </Typography>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    ✓ Compliance reporting and reviews
                  </Typography>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    ✓ Audit trail access and analysis
                  </Typography>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    ✓ Asset verification workflows
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="caption">
                <strong>Note:</strong> Contact system administrators to update department, employee ID, or role information.
              </Typography>
            </Alert>
          </Grid>

          {/* Security Section - Password Change */}
          <Grid item xs={12}>
            <Paper sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Lock color="error" />
                Security & Password
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Change your password to keep your account secure
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
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock />
                        </InputAdornment>
                      ),
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
                    required
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type={showPassword.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    helperText="Min 8 chars, include uppercase, lowercase & number"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock />
                        </InputAdornment>
                      ),
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
                    required
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type={showPassword.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    helperText="Re-enter your new password"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock />
                        </InputAdornment>
                      ),
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
                    required
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="outlined"
                  color="error"
                  size="large"
                  startIcon={changingPassword ? <CircularProgress size={20} color="inherit" /> : <Lock />}
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

export default AuditorProfilePage;
