import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControlLabel,
  Switch,
  Box,
  Typography,
} from '@mui/material';
import { toast } from 'react-toastify';

interface VendorFormData {
  vendor_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  payment_terms: string;
  is_active: boolean;
}

interface VendorFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: VendorFormData) => Promise<void>;
  initialData?: Partial<VendorFormData>;
  isEdit?: boolean;
}

const VendorFormDialog: React.FC<VendorFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState<VendorFormData>({
    vendor_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip_code: '',
      country: '',
    },
    payment_terms: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        // Edit mode - populate with existing data
        setFormData({
          vendor_name: initialData.vendor_name || '',
          contact_person: initialData.contact_person || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          address: {
            street: initialData.address?.street || '',
            city: initialData.address?.city || '',
            state: initialData.address?.state || '',
            zip_code: initialData.address?.zip_code || '',
            country: initialData.address?.country || '',
          },
          payment_terms: initialData.payment_terms || '',
          is_active: initialData.is_active ?? true,
        });
      } else {
        // Add mode - reset to empty
        setFormData({
          vendor_name: '',
          contact_person: '',
          email: '',
          phone: '',
          address: {
            street: '',
            city: '',
            state: '',
            zip_code: '',
            country: '',
          },
          payment_terms: '',
          is_active: true,
        });
      }
      // Clear any previous errors
      setErrors({});
    }
  }, [open, initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.vendor_name.trim()) {
      newErrors.vendor_name = 'Vendor name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.phone && !/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      vendor_name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zip_code: '',
        country: '',
      },
      payment_terms: '',
      is_active: true,
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5">
          {isEdit ? 'Edit Vendor' : 'Add New Vendor'}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary">
              Basic Information
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Vendor Name"
              value={formData.vendor_name}
              onChange={(e) => handleChange('vendor_name', e.target.value)}
              error={!!errors.vendor_name}
              helperText={errors.vendor_name}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Contact Person"
              value={formData.contact_person}
              onChange={(e) => handleChange('contact_person', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="email"
              label="Email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              error={!!errors.phone}
              helperText={errors.phone}
            />
          </Grid>

          {/* Address Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
              Address Information
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Street Address"
              value={formData.address.street}
              onChange={(e) => handleAddressChange('street', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="City"
              value={formData.address.city}
              onChange={(e) => handleAddressChange('city', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="State"
              value={formData.address.state}
              onChange={(e) => handleAddressChange('state', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="ZIP Code"
              value={formData.address.zip_code}
              onChange={(e) => handleAddressChange('zip_code', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Country"
              value={formData.address.country}
              onChange={(e) => handleAddressChange('country', e.target.value)}
            />
          </Grid>

          {/* Business Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
              Business Information
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Payment Terms"
              placeholder="e.g., Net 30, Net 45"
              value={formData.payment_terms}
              onChange={(e) => handleChange('payment_terms', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                    color="success"
                  />
                }
                label="Active"
              />
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
        >
          {submitting ? 'Saving...' : isEdit ? 'Update Vendor' : 'Add Vendor'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VendorFormDialog;
