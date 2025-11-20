import React, { useState, useEffect } from 'react';
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
  IconButton,
  Card,
  CardContent,
  Alert,
  Autocomplete,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  SwapHoriz as TransferIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Inventory as AssetIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';

interface AssetTransferModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  preselectedAssetId?: string;
}

const AssetTransferModal: React.FC<AssetTransferModalProps> = ({ open, onClose, onSubmit, preselectedAssetId }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    asset: '',
    from_location: '',
    to_location: '',
    from_user: '',
    to_user: '',
    transfer_reason: 'employee_relocation',
    description: '',
    expected_transfer_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  });

  const [assets, setAssets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const steps = ['Select Asset', 'Transfer Details', 'Confirmation'];

  // Load real data from APIs
  useEffect(() => {
    if (open) {
      loadFormData();
    }
  }, [open]);

  useEffect(() => {
    if (preselectedAssetId && assets.length > 0) {
      const asset = assets.find(a => a._id === preselectedAssetId || a.id === preselectedAssetId);
      if (asset) {
        handleInputChange('asset', asset._id || asset.id);
      }
    }
  }, [preselectedAssetId, assets]);

  const loadFormData = async () => {
    try {
      setLoadingData(true);
      const [assetsRes, usersRes] = await Promise.all([
        api.get('/assets'),
        api.get('/users'),
      ]);

      const assetsData = assetsRes.data.data || assetsRes.data.assets || assetsRes.data;
      const usersData = usersRes.data.data || usersRes.data.users || usersRes.data;

      const assetsArray = Array.isArray(assetsData) ? assetsData : [];
      const usersArray = Array.isArray(usersData) ? usersData : [];

      setAssets(assetsArray);
      setUsers(usersArray);

      // Extract unique locations from assets
      if (assetsArray.length > 0) {
        const uniqueLocations = [...new Set(assetsArray.map((a: any) => a.location).filter(Boolean))];
        setLocations(uniqueLocations);
      } else {
        setLocations([]);
      }
    } catch (error) {
      console.error('Failed to load form data:', error);
      toast.error('Failed to load assets and users');
      setAssets([]);
      setUsers([]);
      setLocations([]);
    } finally {
      setLoadingData(false);
    }
  };

  const transferReasons = [
    { value: 'employee_relocation', label: 'Employee Relocation' },
    { value: 'department_change', label: 'Department Change' },
    { value: 'temporary_assignment', label: 'Temporary Assignment' },
    { value: 'permanent_assignment', label: 'Permanent Assignment' },
    { value: 'maintenance_transfer', label: 'Maintenance Transfer' },
    { value: 'office_relocation', label: 'Office Relocation' },
    { value: 'project_requirement', label: 'Project Requirement' },
    { value: 'other', label: 'Other' },
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-populate from location and user when asset is selected
    if (field === 'asset') {
      const selectedAsset = assets.find(asset => asset._id === value || asset.id === value);
      if (selectedAsset) {
        setFormData(prev => ({
          ...prev,
          from_location: selectedAsset.location || '',
          from_user: selectedAsset.assigned_user || '',
        }));
      }
    }
  };

const handleNext = () => {
    if (activeStep === 0 && !formData.asset) {
      toast.error('Please select an asset to transfer');
      return;
    }
    if (activeStep === 1) {
      if (!formData.to_location || !formData.transfer_reason || !formData.description) {
        toast.error('Please fill in all required transfer details');
        return;
      }
    }
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        asset: formData.asset,
        from_user: formData.from_user || undefined,
        to_user: formData.to_user || undefined,
        from_location: formData.from_location,
        to_location: formData.to_location,
        transfer_reason: formData.transfer_reason,
        description: formData.description,
        expected_transfer_date: formData.expected_transfer_date,
        priority: formData.priority,
      };

      const response = await api.post('/asset-transfers', payload);
      const createdTransfer = response.data.data || response.data.transfer || response.data;
      
      toast.success(`Asset transfer request submitted successfully! ID: ${createdTransfer.transfer_id || 'Generated'}`);
      
      // Reset form
      setFormData({
        asset: '',
        from_location: '',
        to_location: '',
        from_user: '',
        to_user: '',
        transfer_reason: 'employee_relocation',
        description: '',
        expected_transfer_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'medium',
      });
      setActiveStep(0);
      onSubmit();
      onClose();
    } catch (error: any) {
      console.error('Failed to create transfer:', error);
      toast.error(error.response?.data?.message || 'Failed to process asset transfer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    if (loadingData) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress />
        </Box>
      );
    }

    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssetIcon />
                Select Asset to Transfer
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={assets}
                getOptionLabel={(option: any) => {
                  const assetName = option.name || `${option.manufacturer} ${option.model}` || 'Unknown Asset';
                  return `${option.unique_asset_id} - ${assetName}`;
                }}
                value={assets.find(a => (a._id || a.id) === formData.asset) || null}
                onChange={(_, newValue) => handleInputChange('asset', newValue ? (newValue._id || newValue.id) : '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Asset"
                    required
                    placeholder="Search for an asset to transfer..."
                  />
                )}
                renderOption={(props, option: any) => (
                  <Box component="li" {...props}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      <AssetIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {option.name || `${option.manufacturer} ${option.model}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.unique_asset_id} • {option.location} • {option.assigned_user || 'Unassigned'}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            </Grid>

            {formData.asset && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Current Asset Details</Typography>
                    <List>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'info.main' }}>
                            <LocationIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary="Current Location"
                          secondary={formData.from_location || 'Not specified'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'success.main' }}>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary="Current User"
                          secondary={formData.from_user || 'Unassigned'}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TransferIcon />
                Transfer Details
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={locations}
                value={formData.to_location}
                onChange={(_, newValue) => handleInputChange('to_location', newValue || '')}
                freeSolo
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Transfer To Location"
                    required
                    placeholder="Select or type location..."
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Autocomplete
                options={users}
                getOptionLabel={(option: any) => {
                  if (typeof option === 'string') return option;
                  return option.name || option.email || 'Unknown';
                }}
                value={users.find(u => (u._id || u.id) === formData.to_user) || null}
                onChange={(_, newValue) => handleInputChange('to_user', newValue ? (newValue._id || newValue.id) : '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Transfer To User"
                    placeholder="Select user or leave empty..."
                  />
                )}
                renderOption={(props, option: any) => (
                  <Box component="li" {...props}>
                    <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.email} {option.role && `• ${option.role}`}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Transfer Reason</InputLabel>
                <Select
                  value={formData.transfer_reason}
                  label="Transfer Reason"
                  onChange={(e) => handleInputChange('transfer_reason', e.target.value)}
                >
                  {transferReasons.map((reason) => (
                    <MenuItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Expected Transfer Date"
                type="date"
                required
                value={formData.expected_transfer_date}
                onChange={(e) => handleInputChange('expected_transfer_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: new Date().toISOString().split('T')[0] }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priority"
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                >
                  {priorities.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                required
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Provide details about the transfer reason, conditions, or special requirements..."
                inputProps={{ maxLength: 500 }}
                helperText={`${formData.description.length}/500 characters`}
              />
            </Grid>
          </Grid>
        );

      case 2:
        const selectedAsset = assets.find(a => (a._id || a.id) === formData.asset);
        const selectedToUser = users.find(u => (u._id || u.id) === formData.to_user);
        const reasonLabel = transferReasons.find(r => r.value === formData.transfer_reason)?.label || formData.transfer_reason;
        const priorityLabel = priorities.find(p => p.value === formData.priority)?.label || formData.priority;

        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckIcon />
              Transfer Confirmation
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Please review the transfer details before confirming. The transfer request will be created with status "Pending" and require approval.
            </Alert>

            <Card>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Asset Information
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Asset:</Typography>
                    <Typography variant="body1">
                      {selectedAsset?.unique_asset_id} - {selectedAsset?.name || `${selectedAsset?.manufacturer} ${selectedAsset?.model}`}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Transfer Details
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">From Location:</Typography>
                    <Typography variant="body1">{formData.from_location}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">To Location:</Typography>
                    <Typography variant="body1">{formData.to_location}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">From User:</Typography>
                    <Typography variant="body1">{formData.from_user || 'Unassigned'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">To User:</Typography>
                    <Typography variant="body1">{selectedToUser?.name || 'Unassigned'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Reason:</Typography>
                    <Typography variant="body1">{reasonLabel}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Expected Date:</Typography>
                    <Typography variant="body1">{new Date(formData.expected_transfer_date).toLocaleDateString()}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Priority:</Typography>
                    <Typography variant="body1">{priorityLabel}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Description:</Typography>
                    <Typography variant="body1">{formData.description}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Asset Transfer</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {renderStepContent(activeStep)}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Back
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button 
            onClick={handleNext}
            variant="contained"
            disabled={loading}
          >
            Next
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={<TransferIcon />}
          >
            {loading ? 'Processing Transfer...' : 'Confirm Transfer'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AssetTransferModal;