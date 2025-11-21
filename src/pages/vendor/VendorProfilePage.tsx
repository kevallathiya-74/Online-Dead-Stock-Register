import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { Save, Star } from '@mui/icons-material';
import { getProfile, updateProfile } from '../../services/vendorPortal.service';
import type { VendorProfile } from '../../types';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';

const VendorProfilePage: React.FC = () => {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<any>({
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

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const profileData = await getProfile();
      setProfile(profileData);
      
      // Initialize form data
      setFormData({
        company_name: profileData.company_name || '',
        contact_person: profileData.contact_person || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        address: {
          street: profileData.address?.street || '',
          city: profileData.address?.city || '',
          state: profileData.address?.state || '',
          zip_code: profileData.address?.zip_code || '',
          country: profileData.address?.country || ''
        },
        gst_number: profileData.gst_number || '',
        pan_number: profileData.pan_number || '',
        bank_details: {
          bank_name: profileData.bank_details?.bank_name || '',
          account_number: profileData.bank_details?.account_number || '',
          ifsc_code: profileData.bank_details?.ifsc_code || ''
        }
      });
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const updatedProfile = await updateProfile(formData);
      setProfile(updatedProfile);
      // Refresh global user state after profile update
      await refreshUser();
      toast.success('Profile updated successfully');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
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
      <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Company Profile
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        View and update your company information
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Performance Metrics */}
        {profile?.performance && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Metrics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Orders
                      </Typography>
                      <Typography variant="h4">
                        {profile.performance.total_orders}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        On-Time Delivery Rate
                      </Typography>
                      <Typography variant="h4" color="success.main">
                        {profile.performance.on_time_delivery_rate}%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Rating
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="h4" sx={{ mr: 1 }}>
                          {profile.performance.rating}
                        </Typography>
                        <Star sx={{ color: 'warning.main', fontSize: 30 }} />
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Company Information */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Company Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={formData.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contact Person"
                  value={formData.contact_person}
                  onChange={(e) => handleChange('contact_person', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Address Details */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Address Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Street Address"
                  value={formData.address.street}
                  onChange={(e) => handleNestedChange('address', 'street', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={formData.address.city}
                  onChange={(e) => handleNestedChange('address', 'city', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="State"
                  value={formData.address.state}
                  onChange={(e) => handleNestedChange('address', 'state', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="ZIP Code"
                  value={formData.address.zip_code}
                  onChange={(e) => handleNestedChange('address', 'zip_code', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Country"
                  value={formData.address.country}
                  onChange={(e) => handleNestedChange('address', 'country', e.target.value)}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Tax Information */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tax Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="GST Number"
                  value={formData.gst_number}
                  onChange={(e) => handleChange('gst_number', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="PAN Number"
                  value={formData.pan_number}
                  onChange={(e) => handleChange('pan_number', e.target.value)}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Banking Details */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Banking Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bank Name"
                  value={formData.bank_details.bank_name}
                  onChange={(e) => handleNestedChange('bank_details', 'bank_name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Account Number"
                  value={formData.bank_details.account_number}
                  onChange={(e) => handleNestedChange('bank_details', 'account_number', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="IFSC Code"
                  value={formData.bank_details.ifsc_code}
                  onChange={(e) => handleNestedChange('bank_details', 'ifsc_code', e.target.value)}
                />
              </Grid>
            </Grid>
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

export default VendorProfilePage;
