import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import AssetQRCodeDialog from '../../components/AssetQRCodeDialog';

const AddAssetPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [createdAssetForQr, setCreatedAssetForQr] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    unique_asset_id: '',
    asset_type: '',
    category: '',
    manufacturer: '',
    model: '',
    serial_number: '',
    purchase_date: '',
    purchase_cost: '',  // ✅ Fixed: Changed from purchase_value
    warranty_expiry: '',
    status: 'Available',
    condition: 'Excellent',
    location: '',
    department: '',
    description: '',
  });

  const assetTypes = ['IT Equipment', 'Office Equipment', 'Mobile Device', 'Furniture', 'Machinery', 'Vehicle', 'Other'];
  const departments = ['INVENTORY', 'IT', 'ADMIN', 'VENDOR'];
  const conditions = ['Excellent', 'Good', 'Fair', 'Poor'];
  const statuses = ['Available', 'Active', 'Under Maintenance', 'Damaged', 'Ready for Scrap'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.unique_asset_id || !formData.asset_type) {
      toast.error('Please fill in all required fields (Name, Asset ID, Type)');
      return;
    }

    try {
      setLoading(true);
      
      // Transform data for backend
      const payload = {
        ...formData,
        purchase_cost: parseFloat(formData.purchase_cost) || 0,  // ✅ Fixed
      };

  const response = await api.post('/assets', payload);
  const createdAsset = response.data.data || response.data;

  // Open QR dialog for created asset
  setCreatedAssetForQr(createdAsset);
  setQrOpen(true);
  toast.success(`Asset "${formData.name}" created successfully!`);
    } catch (error: any) {
      console.error('Failed to create asset:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create asset';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/assets');
  };

  return (
    <DashboardLayout>
      <Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Add New Asset
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Register a new asset in the inventory system
          </Typography>
        </Box>

        <Card>

        <AssetQRCodeDialog
          open={qrOpen}
          asset={createdAssetForQr}
          onClose={() => {
            setQrOpen(false);
            setCreatedAssetForQr(null);
            navigate('/assets');
          }}
        />
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Basic Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Asset Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Dell XPS 15 Laptop"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Unique Asset ID"
                    name="unique_asset_id"
                    value={formData.unique_asset_id}
                    onChange={handleChange}
                    placeholder="e.g., AST-001"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Asset Type</InputLabel>
                    <Select
                      name="asset_type"
                      value={formData.asset_type}
                      label="Asset Type"
                      onChange={handleChange}
                    >
                      {assetTypes.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="e.g., Laptop, Desktop, Printer"
                  />
                </Grid>

                {/* Manufacturer Details */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Manufacturer Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Manufacturer"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleChange}
                    placeholder="e.g., Dell, HP, Apple"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Model"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="e.g., XPS 15, ThinkPad X1"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Serial Number"
                    name="serial_number"
                    value={formData.serial_number}
                    onChange={handleChange}
                    placeholder="e.g., SN123456789"
                  />
                </Grid>

                {/* Purchase Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Purchase Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Purchase Date"
                    name="purchase_date"
                    value={formData.purchase_date}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Purchase Value (₹)"
                    name="purchase_cost"
                    value={formData.purchase_cost}
                    onChange={handleChange}
                    placeholder="e.g., 50000"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Warranty Expiry"
                    name="warranty_expiry"
                    value={formData.warranty_expiry}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* Status and Location */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Status and Location
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      label="Status"
                      onChange={handleChange}
                    >
                      {statuses.map(status => (
                        <MenuItem key={status} value={status}>{status}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Condition</InputLabel>
                    <Select
                      name="condition"
                      value={formData.condition}
                      label="Condition"
                      onChange={handleChange}
                    >
                      {conditions.map(condition => (
                        <MenuItem key={condition} value={condition}>{condition}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., IT Department - Floor 2"
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Department</InputLabel>
                    <Select
                      name="department"
                      value={formData.department}
                      label="Department"
                      onChange={handleChange}
                    >
                      {departments.map(dept => (
                        <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Description */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Additional details about the asset..."
                  />
                </Grid>

                {/* Action Buttons */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<SaveIcon />}
                      disabled={loading}
                    >
                      {loading ? 'Creating...' : 'Create Asset'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
};

export default AddAssetPage;
