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
  Business,
  LocationOn,
  AccountBalance,
  Description,
  Star,
  TrendingUp,
  CalendarToday,
  AccessTime,
  Store,
  LocalShipping
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getProfile, updateProfile } from '../../services/vendorPortal.service';
import type { VendorProfile } from '../../types';
import api from '../../services/api';

const VendorProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<VendorProfile | null>(null);

  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip_code: '',
      country: ''
    },
    gst_number: '',
    pan_number: '',
    bank_details: {
      bank_name: '',
      account_number: '',
      ifsc_code: ''
    }
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
        const profileResponse = await getProfile();
        
        setProfileData(profileResponse);
        setFormData({
          company_name: profileResponse.company_name || '',
          contact_person: profileResponse.contact_person || '',
          email: profileResponse.email || '',
          phone: profileResponse.phone || '',
          address: {
            street: profileResponse.address?.street || '',
            city: profileResponse.address?.city || '',
            state: profileResponse.address?.state || '',
            zip_code: profileResponse.address?.zip_code || '',
            country: profileResponse.address?.country || ''
          },
          gst_number: profileResponse.gst_number || '',
          pan_number: profileResponse.pan_number || '',
          bank_details: {
            bank_name: profileResponse.bank_details?.bank_name || '',
            account_number: profileResponse.bank_details?.account_number || '',
            ifsc_code: profileResponse.bank_details?.ifsc_code || ''
          }
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

  const handleNestedChange = (parent: 'address' | 'bank_details', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as Record<string, string>),
        [field]: value
      }
    }));
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.company_name.trim()) {
      errors.company_name = 'Company name is required';
    }

    if (!formData.contact_person.trim()) {
      errors.contact_person = 'Contact person is required';
    }

    if (formData.phone && !/^\+?[\d\s-()]{10,}$/.test(formData.phone)) {
      errors.phone = 'Invalid phone number format';
    }

    if (formData.gst_number && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gst_number)) {
      errors.gst_number = 'Invalid GST number format';
    }

    if (formData.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_number)) {
      errors.pan_number = 'Invalid PAN number format';
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
      
      const updatedProfile = await updateProfile(formData);
      setProfileData(updatedProfile);
      
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
      <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, sm: 3 } }}>
        {/* Header Section with Gradient */}
        <Paper
          elevation={3}
          sx={{
            background: 'linear-gradient(135deg, #525bcfff 0%, #525bcfff 100%)',
            color: 'white',
            p: { xs: 2, sm: 3, md: 4 },
            mb: { xs: 2, sm: 3 },
            borderRadius: 2
          }}
        >
          <Grid container spacing={{ xs: 2, sm: 3 }} alignItems="center">
            <Grid item>
              <Avatar
                sx={{
                  width: { xs: 70, sm: 85, md: 100 },
                  height: { xs: 70, sm: 85, md: 100 },
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  fontSize: { xs: 30, sm: 35, md: 40 },
                  border: { xs: '3px solid rgba(255, 255, 255, 0.3)', md: '4px solid rgba(255, 255, 255, 0.3)' }
                }}
              >
                <Store sx={{ fontSize: { xs: 35, sm: 42, md: 50 } }} />
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
                Vendor Profile
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
                {profileData?.company_name || 'Vendor Company'}
              </Typography>
              <Stack direction="row" spacing={{ xs: 1, sm: 2 }} flexWrap="wrap" gap={{ xs: 1, sm: 0 }}>
                <Chip
                  icon={<Business />}
                  label="VENDOR"
                  sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white', fontWeight: 'bold' }}
                />
                <Chip
                  icon={<Star />}
                  label={profileData?.is_active ? 'Active' : 'Inactive'}
                  sx={{ bgcolor: profileData?.is_active ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)', color: 'white' }}
                />
                {profileData?.rating && (
                  <Chip
                    icon={<Star />}
                    label={`${profileData.rating}/5`}
                    sx={{ bgcolor: 'rgba(255, 230, 0, 1)', color: 'white', fontWeight: 'bold' }}
                  />
                )}
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 3 }} mt={{ xs: 1.5, sm: 2 }}>
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
                    Last Updated
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatDate(profileData?.updated_at || '')}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: { xs: 2, sm: 3 } }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Performance Metrics */}
        {profileData?.performance && (
          <Card sx={{ mb: { xs: 2, sm: 3 }, bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp color="primary" />
                Performance Metrics
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 }, borderRadius: 2, bgcolor: 'primary.light' }}>
                    <LocalShipping sx={{ fontSize: { xs: 32, sm: 40 }, color: 'primary.main', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Total Orders
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
                      {profileData.performance.total_orders}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 }, borderRadius: 2, bgcolor: 'success.light' }}>
                    <AccessTime sx={{ fontSize: { xs: 32, sm: 40 }, color: 'success.main', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      On-Time Delivery
                    </Typography>
                    <Typography variant="h4" color="success.main" fontWeight="bold" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
                      {profileData.performance.on_time_delivery_rate}%
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={12} md={4}>
                  <Box sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 }, borderRadius: 2, bgcolor: 'warning.light' }}>
                    <Star sx={{ fontSize: { xs: 32, sm: 40 }, color: 'warning.main', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Rating
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="h4" fontWeight="bold" sx={{ mr: 1, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
                        {profileData.performance.rating}
                      </Typography>
                      <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                        / 5
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {/* Main Content - Company Information */}
          <Grid item xs={12} lg={8}>
            {/* Company Information */}
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Business color="primary" />
                Company Information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Update your company details and contact information
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    value={formData.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    error={!!validationErrors.company_name}
                    helperText={validationErrors.company_name || 'Official registered company name'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Business />
                        </InputAdornment>
                      ),
                    }}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Contact Person"
                    value={formData.contact_person}
                    onChange={(e) => handleChange('contact_person', e.target.value)}
                    error={!!validationErrors.contact_person}
                    helperText={validationErrors.contact_person || 'Primary contact person name'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Store />
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
                    helperText={validationErrors.phone || 'Contact number with country code'}
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
              </Grid>
            </Paper>

            {/* Address Details */}
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn color="primary" />
                Address Details
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Complete business address for correspondence
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    value={formData.address.street}
                    onChange={(e) => handleNestedChange('address', 'street', e.target.value)}
                    helperText="Complete street address including building/plot number"
                    placeholder="123 Business Street, Building Name"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="City"
                    value={formData.address.city}
                    onChange={(e) => handleNestedChange('address', 'city', e.target.value)}
                    placeholder="Mumbai"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="State"
                    value={formData.address.state}
                    onChange={(e) => handleNestedChange('address', 'state', e.target.value)}
                    placeholder="Maharashtra"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="ZIP / Postal Code"
                    value={formData.address.zip_code}
                    onChange={(e) => handleNestedChange('address', 'zip_code', e.target.value)}
                    placeholder="400001"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={formData.address.country}
                    onChange={(e) => handleNestedChange('address', 'country', e.target.value)}
                    placeholder="India"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Tax Information */}
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Description color="primary" />
                Tax Information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                GST and PAN details for tax compliance
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="GST Number"
                    value={formData.gst_number}
                    onChange={(e) => handleChange('gst_number', e.target.value.toUpperCase())}
                    error={!!validationErrors.gst_number}
                    helperText={validationErrors.gst_number || 'Format: 22AAAAA0000A1Z5'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Description />
                        </InputAdornment>
                      ),
                    }}
                    placeholder="22AAAAA0000A1Z5"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="PAN Number"
                    value={formData.pan_number}
                    onChange={(e) => handleChange('pan_number', e.target.value.toUpperCase())}
                    error={!!validationErrors.pan_number}
                    helperText={validationErrors.pan_number || 'Format: ABCDE1234F'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Description />
                        </InputAdornment>
                      ),
                    }}
                    placeholder="ABCDE1234F"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Banking Details */}
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountBalance color="primary" />
                Banking Details
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Bank account information for payments
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bank Name"
                    value={formData.bank_details.bank_name}
                    onChange={(e) => handleNestedChange('bank_details', 'bank_name', e.target.value)}
                    helperText="Official name of your bank"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccountBalance />
                        </InputAdornment>
                      ),
                    }}
                    placeholder="State Bank of India"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Account Number"
                    value={formData.bank_details.account_number}
                    onChange={(e) => handleNestedChange('bank_details', 'account_number', e.target.value)}
                    helperText="Your bank account number"
                    placeholder="1234567890"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="IFSC Code"
                    value={formData.bank_details.ifsc_code}
                    onChange={(e) => handleNestedChange('bank_details', 'ifsc_code', e.target.value.toUpperCase())}
                    helperText="Bank IFSC code"
                    placeholder="SBIN0001234"
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, mt: { xs: 2, sm: 3 } }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                  onClick={handleSave}
                  disabled={saving}
                  sx={{ minWidth: { sm: 150 }, width: { xs: '100%', sm: 'auto' } }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Sidebar - Account Information */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ mb: { xs: 2, sm: 3 }, bgcolor: 'background.default' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Store color="primary" />
                  Vendor Information
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Business fontSize="small" />
                      Vendor ID
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {profileData?._id || 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarToday fontSize="small" />
                      Registered Since
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatDate(profileData?.created_at || '')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTime fontSize="small" />
                      Last Updated
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatDate(profileData?.updated_at || '')}
                    </Typography>
                  </Box>
                  {profileData?.rating && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Star fontSize="small" />
                        Rating
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" fontWeight="bold" color="warning.main">
                          {profileData.rating}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          / 5.0
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ bgcolor: 'warning.light' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Store />
                  Vendor Portal
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  As a Vendor, you have access to:
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    ✓ View and manage orders
                  </Typography>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    ✓ Track order status and delivery
                  </Typography>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    ✓ Manage product catalog
                  </Typography>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    ✓ Invoice management
                  </Typography>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    ✓ Performance metrics
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            <Alert severity="info" sx={{ mt: { xs: 2, sm: 3 } }}>
              <Typography variant="caption">
                <strong>Note:</strong> Contact system administrators for any changes to email, category, or account status.
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
                <Alert severity="error" sx={{ mb: { xs: 2, sm: 3 } }} onClose={() => setPasswordError(null)}>
                  {passwordError}
                </Alert>
              )}

              <Grid container spacing={{ xs: 2, sm: 3 }}>
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

              <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, mt: { xs: 2, sm: 3 } }}>
                <Button
                  variant="outlined"
                  color="error"
                  size="large"
                  startIcon={changingPassword ? <CircularProgress size={20} color="inherit" /> : <Lock />}
                  onClick={handlePasswordChange}
                  disabled={changingPassword}
                  sx={{ minWidth: { sm: 180 }, width: { xs: '100%', sm: 'auto' } }}
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

export default VendorProfilePage;
