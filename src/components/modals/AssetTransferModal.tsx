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

interface AssetTransferModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (transferData: any) => void;
}

const AssetTransferModal: React.FC<AssetTransferModalProps> = ({ open, onClose, onSubmit }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    asset_id: '',
    from_location: '',
    to_location: '',
    from_user: '',
    to_user: '',
    transfer_reason: '',
    transfer_date: new Date().toISOString().split('T')[0],
    notes: '',
    requires_approval: false,
    condition_before: 'Good',
    condition_after: 'Good',
  });

  const [loading, setLoading] = useState(false);

  const steps = ['Select Asset', 'Transfer Details', 'Confirmation'];

  const assets = [
    { id: 'AST-001', name: 'Dell XPS 15 Laptop', location: 'IT Department - Floor 2', user: 'John Employee' },
    { id: 'AST-002', name: 'HP LaserJet Printer', location: 'Admin Office', user: 'Unassigned' },
    { id: 'AST-003', name: 'iPhone 14 Pro', location: 'Sales Department', user: 'Sarah Manager' },
    { id: 'AST-004', name: 'Ergonomic Office Chair', location: 'Maintenance Room', user: 'Unassigned' },
    { id: 'AST-005', name: 'Network Switch', location: 'Server Room', user: 'IT Admin' },
    { id: 'AST-006', name: 'Conference Projector', location: 'Meeting Room A', user: 'Unassigned' },
  ];

  const locations = [
    'IT Department - Floor 2',
    'Admin Office',
    'Sales Department',
    'HR Department',
    'Finance Department',
    'Warehouse',
    'Meeting Room A',
    'Meeting Room B',
    'Reception',
    'Server Room',
    'Maintenance Room',
  ];

  const users = [
    'John Employee - IT Specialist',
    'Sarah Manager - Sales Manager',
    'Raj Patel - HR Manager',
    'Priya Singh - Finance Analyst',
    'Amit Sharma - Admin Officer',
    'Neha Gupta - Marketing Executive',
    'Vikram Joshi - Operations Manager',
    'Unassigned',
  ];

  const transferReasons = [
    'Employee Transfer',
    'Department Relocation',
    'Equipment Upgrade',
    'Maintenance Required',
    'Temporary Assignment',
    'Project Requirement',
    'Office Reorganization',
    'Asset Retirement',
    'Other',
  ];

  const conditions = [
    'Excellent',
    'Good',
    'Fair',
    'Poor',
    'Damaged',
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-populate from/to data when asset is selected
    if (field === 'asset_id') {
      const selectedAsset = assets.find(asset => asset.id === value);
      if (selectedAsset) {
        setFormData(prev => ({
          ...prev,
          from_location: selectedAsset.location,
          from_user: selectedAsset.user,
        }));
      }
    }
  };

  const generateTransferId = () => {
    const prefix = 'TXN';
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
  };

  const handleNext = () => {
    if (activeStep === 0 && !formData.asset_id) {
      toast.error('Please select an asset to transfer');
      return;
    }
    if (activeStep === 1) {
      if (!formData.to_location || !formData.transfer_reason) {
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
      const transferId = generateTransferId();
      const transferData = {
        ...formData,
        id: Date.now().toString(),
        transfer_id: transferId,
        status: formData.requires_approval ? 'pending_approval' : 'completed',
        created_date: new Date().toISOString().split('T')[0],
        transfer_date: formData.transfer_date,
      };

      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      onSubmit(transferData);
      
      const statusMessage = formData.requires_approval 
        ? `Asset transfer request submitted for approval! ID: ${transferId}`
        : `Asset transferred successfully! ID: ${transferId}`;
      
      toast.success(statusMessage);
      
      // Reset form
      setFormData({
        asset_id: '',
        from_location: '',
        to_location: '',
        from_user: '',
        to_user: '',
        transfer_reason: '',
        transfer_date: new Date().toISOString().split('T')[0],
        notes: '',
        requires_approval: false,
        condition_before: 'Good',
        condition_after: 'Good',
      });
      setActiveStep(0);
      onClose();
    } catch (error) {
      toast.error('Failed to process asset transfer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
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
                options={assets.map(asset => asset.id)}
                getOptionLabel={(option) => {
                  const asset = assets.find(a => a.id === option);
                  return asset ? `${asset.id} - ${asset.name}` : option;
                }}
                value={formData.asset_id}
                onChange={(_, newValue) => handleInputChange('asset_id', newValue || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Asset"
                    required
                    placeholder="Search for an asset to transfer..."
                  />
                )}
                renderOption={(props, option) => {
                  const asset = assets.find(a => a.id === option);
                  return (
                    <Box component="li" {...props}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        <AssetIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">{asset?.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {option} • {asset?.location} • {asset?.user}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
              />
            </Grid>

            {formData.asset_id && (
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
                          secondary={formData.from_location}
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
                          secondary={formData.from_user}
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
              <FormControl fullWidth required>
                <InputLabel>Transfer To Location</InputLabel>
                <Select
                  value={formData.to_location}
                  label="Transfer To Location"
                  onChange={(e) => handleInputChange('to_location', e.target.value)}
                >
                  {locations.filter(loc => loc !== formData.from_location).map((location) => (
                    <MenuItem key={location} value={location}>
                      {location}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <Autocomplete
                options={users}
                value={formData.to_user}
                onChange={(_, newValue) => handleInputChange('to_user', newValue || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Transfer To User"
                    placeholder="Select user..."
                  />
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
                    <MenuItem key={reason} value={reason}>
                      {reason}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Transfer Date"
                type="date"
                value={formData.transfer_date}
                onChange={(e) => handleInputChange('transfer_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Condition Before Transfer</InputLabel>
                <Select
                  value={formData.condition_before}
                  label="Condition Before Transfer"
                  onChange={(e) => handleInputChange('condition_before', e.target.value)}
                >
                  {conditions.map((condition) => (
                    <MenuItem key={condition} value={condition}>
                      {condition}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Expected Condition After</InputLabel>
                <Select
                  value={formData.condition_after}
                  label="Expected Condition After"
                  onChange={(e) => handleInputChange('condition_after', e.target.value)}
                >
                  {conditions.map((condition) => (
                    <MenuItem key={condition} value={condition}>
                      {condition}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Transfer Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes about the transfer..."
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckIcon />
              Transfer Confirmation
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Please review the transfer details before confirming.
            </Alert>

            <Card>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Asset Information
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Asset:</Typography>
                    <Typography variant="body1">{formData.asset_id}</Typography>
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
                    <Typography variant="body1">{formData.from_user}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">To User:</Typography>
                    <Typography variant="body1">{formData.to_user || 'Unassigned'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Reason:</Typography>
                    <Typography variant="body1">{formData.transfer_reason}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Transfer Date:</Typography>
                    <Typography variant="body1">{new Date(formData.transfer_date).toLocaleDateString()}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Transfer ID will be: <strong>{generateTransferId()}</strong>
              </Typography>
            </Box>
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