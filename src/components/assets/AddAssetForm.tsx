import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Divider,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  QrCode as QrCodeIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

interface AddAssetFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (assetData: any) => void;
}

const AddAssetForm: React.FC<AddAssetFormProps> = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    manufacturer: '',
    model: '',
    serial_number: '',
    location: '',
    assigned_user: '',
    purchase_date: '',
    purchase_cost: '',
    warranty_expiry: '',
    condition: 'Good',
    status: 'Active',
    description: '',
  });

  const categories = [
    'IT Equipment',
    'Office Equipment', 
    'Furniture',
    'Machinery',
    'Vehicles',
    'Building & Infrastructure',
    'Mobile Device',
  ];

  const locations = [
    'IT Department - Floor 2',
    'Admin Office',
    'Sales Department',
    'Maintenance Room',
    'Storage Room',
    'Warehouse A',
    'Warehouse B',
    'Reception',
  ];

  const conditions = ['excellent', 'good', 'fair', 'poor', 'damaged'];
  const statuses = ['Active', 'Inactive', 'Maintenance'];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.name || !formData.category || !formData.manufacturer) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Generate unique asset ID
    const assetId = `AST-${Math.floor(Math.random() * 9000) + 1000}`;

    const assetData = {
      id: Date.now().toString(),
      unique_asset_id: assetId,
      ...formData,
      purchase_value: parseFloat(formData.purchase_cost) || 0,
      last_audit_date: new Date().toISOString().split('T')[0],
    };

    onSubmit(assetData);
    toast.success(`Asset ${assetId} created successfully!`);
    
    // Reset form
    setFormData({
      name: '',
      category: '',
      manufacturer: '',
      model: '',
      serial_number: '',
      location: '',
      assigned_user: '',
      purchase_date: '',
      purchase_cost: '',
      warranty_expiry: '',
      condition: 'Good',
      status: 'Active',
      description: '',
    });
    
    onClose();
  };

  const generateQRCode = () => {
    toast.info('QR Code generation will be implemented in next update');
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: { xs: '400px', sm: '500px', md: '600px' } }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Add New Asset</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom color="primary">
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Asset Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Dell XPS 15 Laptop"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                label="Category"
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Manufacturer"
              value={formData.manufacturer}
              onChange={(e) => handleInputChange('manufacturer', e.target.value)}
              placeholder="e.g., Dell, HP, Apple"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Model"
              value={formData.model}
              onChange={(e) => handleInputChange('model', e.target.value)}
              placeholder="e.g., XPS 15, MacBook Pro"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Serial Number"
              value={formData.serial_number}
              onChange={(e) => handleInputChange('serial_number', e.target.value)}
              placeholder="Enter serial number"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box display="flex" gap={1} alignItems="center">
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Additional details"
              />
              <IconButton onClick={generateQRCode} color="primary">
                <QrCodeIcon />
              </IconButton>
            </Box>
          </Grid>

          {/* Location & Assignment */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom color="primary" sx={{ mt: 2 }}>
              Location & Assignment
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                label="Location"
              >
                {locations.map((location) => (
                  <MenuItem key={location} value={location}>
                    {location}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Assigned User"
              value={formData.assigned_user}
              onChange={(e) => handleInputChange('assigned_user', e.target.value)}
              placeholder="Employee name or ID"
            />
          </Grid>

          {/* Financial Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom color="primary" sx={{ mt: 2 }}>
              Financial Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Purchase Date"
              value={formData.purchase_date}
              onChange={(e) => handleInputChange('purchase_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Purchase Value (₹)"
              value={formData.purchase_cost}
              onChange={(e) => handleInputChange('purchase_cost', e.target.value)}
              placeholder="0"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Warranty Expiry"
              value={formData.warranty_expiry}
              onChange={(e) => handleInputChange('warranty_expiry', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Status Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom color="primary" sx={{ mt: 2 }}>
              Status Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Condition</InputLabel>
              <Select
                value={formData.condition}
                onChange={(e) => handleInputChange('condition', e.target.value)}
                label="Condition"
              >
                {conditions.map((condition) => (
                  <MenuItem key={condition} value={condition}>
                    <Chip 
                      label={condition.charAt(0).toUpperCase() + condition.slice(1)} 
                      size="small"
                      color={
                        condition === 'excellent' ? 'success' :
                        condition === 'good' ? 'primary' :
                        condition === 'fair' ? 'warning' : 'error'
                      }
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                label="Status"
              >
                {statuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    <Chip 
                      label={status} 
                      size="small"
                      color={
                        status === 'Active' ? 'success' :
                        status === 'Maintenance' ? 'warning' : 'default'
                      }
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Create Asset
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddAssetForm;