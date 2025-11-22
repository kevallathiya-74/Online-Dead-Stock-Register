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
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  SwapHoriz as TransferIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Computer as AssetIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

interface AssetTransferFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (transferData: any) => void;
  selectedAsset?: any;
}

const AssetTransferForm: React.FC<AssetTransferFormProps> = ({ 
  open, 
  onClose, 
  onSubmit,
  selectedAsset 
}) => {
  const [formData, setFormData] = useState({
    assetId: selectedAsset?.id || '',
    fromLocation: selectedAsset?.location || '',
    toLocation: '',
    fromUser: selectedAsset?.assigned_user || '',
    toUser: '',
    transferDate: new Date().toISOString().split('T')[0],
    reason: '',
    notes: '',
    priority: 'Medium',
  });

  const locations = [
    'IT Department - Floor 2',
    'Admin Office',
    'Sales Department',
    'Maintenance Room',
    'Storage Room',
    'Warehouse A',
    'Warehouse B',
    'Reception',
    'Floor 2',
    'Floor 3',
    'Main Office',
    'Branch Office 2',
  ];

  const users = [
    'John Employee',
    'Sarah Manager',
    'Mike Admin',
    'Lisa Brown',
    'David Wilson',
    'Jane Smith',
    'Unassigned',
  ];

  const transferReasons = [
    'Employee Transfer',
    'Department Restructuring',
    'Equipment Upgrade',
    'Maintenance Requirements',
    'Office Relocation',
    'Temporary Assignment',
    'Asset Consolidation',
    'Other',
  ];

  const priorities = ['Low', 'Medium', 'High', 'Urgent'];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.toLocation || !formData.reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.fromLocation === formData.toLocation && formData.fromUser === formData.toUser) {
      toast.error('Transfer location or user must be different');
      return;
    }

    const transferData = {
      id: Date.now().toString(),
      ...formData,
      transferId: `TRF-${Math.floor(Math.random() * 9000) + 1000}`,
      status: 'Pending Approval',
      requestedBy: 'Current User',
      requestDate: new Date().toISOString(),
    };

    onSubmit(transferData);
    toast.success(`Transfer request ${transferData.transferId} submitted successfully!`);
    
    // Reset form
    setFormData({
      assetId: '',
      fromLocation: '',
      toLocation: '',
      fromUser: '',
      toUser: '',
      transferDate: new Date().toISOString().split('T')[0],
      reason: '',
      notes: '',
      priority: 'Medium',
    });
    
    onClose();
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
          <Box display="flex" alignItems="center" gap={1}>
            <TransferIcon color="primary" />
            <Typography variant="h6">Asset Transfer Request</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Asset Information */}
          {selectedAsset && (
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom color="primary">
                    Asset Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <AssetIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={selectedAsset.name}
                        secondary={`${selectedAsset.unique_asset_id} • ${selectedAsset.asset_type}`}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Transfer Details */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom color="primary">
              Transfer Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          {/* From Location/User */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="From Location"
              value={formData.fromLocation}
              InputProps={{ readOnly: true }}
              variant="filled"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="From User"
              value={formData.fromUser || 'Unassigned'}
              InputProps={{ readOnly: true }}
              variant="filled"
            />
          </Grid>

          {/* To Location/User */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>To Location</InputLabel>
              <Select
                value={formData.toLocation}
                onChange={(e) => handleInputChange('toLocation', e.target.value)}
                label="To Location"
              >
                {locations.filter(loc => loc !== formData.fromLocation).map((location) => (
                  <MenuItem key={location} value={location}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocationIcon fontSize="small" />
                      {location}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>To User</InputLabel>
              <Select
                value={formData.toUser}
                onChange={(e) => handleInputChange('toUser', e.target.value)}
                label="To User"
              >
                {users.filter(user => user !== formData.fromUser).map((user) => (
                  <MenuItem key={user} value={user}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonIcon fontSize="small" />
                      {user}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Transfer Information */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Transfer Date"
              value={formData.transferDate}
              onChange={(e) => handleInputChange('transferDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                label="Priority"
              >
                {priorities.map((priority) => (
                  <MenuItem key={priority} value={priority}>
                    <Chip 
                      label={priority} 
                      size="small"
                      color={
                        priority === 'Urgent' ? 'error' :
                        priority === 'High' ? 'warning' :
                        priority === 'Medium' ? 'primary' : 'default'
                      }
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Transfer Reason</InputLabel>
              <Select
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                label="Transfer Reason"
              >
                {transferReasons.map((reason) => (
                  <MenuItem key={reason} value={reason}>
                    {reason}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Additional Notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional information about this transfer..."
            />
          </Grid>

          {/* Preview Section */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom color="primary" sx={{ mt: 2 }}>
              Transfer Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Card variant="outlined">
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">From:</Typography>
                    <Typography variant="body1">
                      📍 {formData.fromLocation}
                      {formData.fromUser && (
                        <><br />👤 {formData.fromUser}</>
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">To:</Typography>
                    <Typography variant="body1">
                      📍 {formData.toLocation || 'Please select location'}
                      {formData.toUser && (
                        <><br />👤 {formData.toUser}</>
                      )}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Submit Transfer Request
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssetTransferForm;