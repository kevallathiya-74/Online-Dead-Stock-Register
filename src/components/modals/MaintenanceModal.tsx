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
  FormControlLabel,
  Checkbox,
  Autocomplete,
} from '@mui/material';
import {
  Close as CloseIcon,
  Build as BuildIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

interface MaintenanceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (maintenanceData: any) => void;
}

const MaintenanceModal: React.FC<MaintenanceModalProps> = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    asset_id: '',
    maintenance_type: '',
    priority: 'Medium',
    scheduled_date: '',
    estimated_hours: 2,
    technician: '',
    description: '',
    required_parts: [] as string[],
    cost_estimate: '',
    is_recurring: false,
    recurring_frequency: '',
    notes: '',
  });

  const [partInput, setPartInput] = useState('');
  const [loading, setLoading] = useState(false);

  const maintenanceTypes = [
    'Preventive Maintenance',
    'Corrective Maintenance',
    'Predictive Maintenance',
    'Emergency Repair',
    'Software Update',
    'Hardware Upgrade',
    'Cleaning & Inspection',
    'Calibration',
  ];

  const priorities = [
    { value: 'Low', color: 'success' },
    { value: 'Medium', color: 'warning' },
    { value: 'High', color: 'error' },
    { value: 'Critical', color: 'error' },
  ];

  const technicians = [
    'Rajesh Kumar - IT Specialist',
    'Priya Singh - Hardware Tech',
    'Amit Sharma - Network Admin',
    'Neha Patel - Software Tech',
    'Vikram Joshi - Field Technician',
    'Anita Reddy - Senior Technician',
  ];

  const assets = [
    'AST-001 - Dell XPS 15 Laptop',
    'AST-002 - HP LaserJet Printer',
    'AST-003 - iPhone 14 Pro',
    'AST-004 - Ergonomic Office Chair',
    'AST-005 - Network Switch',
    'AST-006 - Conference Room Projector',
  ];

  const recurringFrequencies = [
    'Weekly',
    'Monthly',
    'Quarterly',
    'Semi-annually',
    'Annually',
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addPart = () => {
    if (partInput.trim() && !formData.required_parts.includes(partInput.trim())) {
      setFormData(prev => ({
        ...prev,
        required_parts: [...prev.required_parts, partInput.trim()]
      }));
      setPartInput('');
    }
  };

  const removePart = (partToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      required_parts: prev.required_parts.filter(part => part !== partToRemove)
    }));
  };

  const generateMaintenanceId = () => {
    const prefix = 'MNT';
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
  };

  const calculateScheduledTime = () => {
    if (!formData.scheduled_date) return '';
    
    const date = new Date(formData.scheduled_date);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-IN', options);
  };

  const handleSubmit = async () => {
    if (!formData.asset_id || !formData.maintenance_type || !formData.scheduled_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const maintenanceId = generateMaintenanceId();
      const maintenanceData = {
        ...formData,
        id: Date.now().toString(),
        maintenance_id: maintenanceId,
        status: 'scheduled',
        created_date: new Date().toISOString().split('T')[0],
        cost_estimate: parseFloat(formData.cost_estimate) || 0,
      };

      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      onSubmit(maintenanceData);
      toast.success(`Maintenance scheduled successfully! ID: ${maintenanceId}`);
      
      // Reset form
      setFormData({
        asset_id: '',
        maintenance_type: '',
        priority: 'Medium',
        scheduled_date: '',
        estimated_hours: 2,
        technician: '',
        description: '',
        required_parts: [],
        cost_estimate: '',
        is_recurring: false,
        recurring_frequency: '',
        notes: '',
      });
      onClose();
    } catch (error) {
      toast.error('Failed to schedule maintenance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BuildIcon color="primary" />
            <Typography variant="h6">Schedule Maintenance</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Asset & Maintenance Type */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon />
                  Basic Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Autocomplete
                      options={assets}
                      value={formData.asset_id}
                      onChange={(_, newValue) => handleInputChange('asset_id', newValue || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Asset"
                          required
                          placeholder="Search for an asset..."
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Maintenance Type</InputLabel>
                      <Select
                        value={formData.maintenance_type}
                        label="Maintenance Type"
                        onChange={(e) => handleInputChange('maintenance_type', e.target.value)}
                      >
                        {maintenanceTypes.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        value={formData.priority}
                        label="Priority"
                        onChange={(e) => handleInputChange('priority', e.target.value)}
                      >
                        {priorities.map((priority) => (
                          <MenuItem key={priority.value} value={priority.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: 1,
                                  bgcolor: `${priority.color}.main`,
                                }}
                              />
                              {priority.value}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Scheduling & Assignment */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon />
                  Scheduling & Assignment
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Scheduled Date"
                      type="date"
                      value={formData.scheduled_date}
                      onChange={(e) => handleInputChange('scheduled_date', e.target.value)}
                      required
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Estimated Hours"
                      type="number"
                      value={formData.estimated_hours}
                      onChange={(e) => handleInputChange('estimated_hours', parseInt(e.target.value) || 1)}
                      inputProps={{ min: 1, max: 24 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Autocomplete
                      options={technicians}
                      value={formData.technician}
                      onChange={(_, newValue) => handleInputChange('technician', newValue || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Assigned Technician"
                          placeholder="Select technician..."
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the maintenance work to be performed..."
            />
          </Grid>

          {/* Required Parts */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Required Parts</Typography>
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Add Part"
                    value={partInput}
                    onChange={(e) => setPartInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addPart()}
                    placeholder="Type part name and press Enter"
                  />
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.required_parts.map((part, index) => (
                    <Button
                      key={index}
                      variant="outlined"
                      size="small"
                      onClick={() => removePart(part)}
                      sx={{ textTransform: 'none' }}
                    >
                      {part} ×
                    </Button>
                  ))}
                  {formData.required_parts.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No parts required
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Cost & Recurring */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Cost & Recurring</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Cost Estimate"
                      type="number"
                      value={formData.cost_estimate}
                      onChange={(e) => handleInputChange('cost_estimate', e.target.value)}
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>,
                      }}
                      placeholder="0"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.is_recurring}
                          onChange={(e) => handleInputChange('is_recurring', e.target.checked)}
                        />
                      }
                      label="Recurring Maintenance"
                    />
                  </Grid>
                  {formData.is_recurring && (
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Frequency</InputLabel>
                        <Select
                          value={formData.recurring_frequency}
                          label="Frequency"
                          onChange={(e) => handleInputChange('recurring_frequency', e.target.value)}
                        >
                          {recurringFrequencies.map((freq) => (
                            <MenuItem key={freq} value={freq}>
                              {freq}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Additional Notes"
              multiline
              rows={2}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional instructions or notes..."
            />
          </Grid>

          {/* Preview */}
          {formData.scheduled_date && (
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Maintenance Summary:</strong> {formData.maintenance_type} for {formData.asset_id} 
                  scheduled on {calculateScheduledTime()} 
                  {formData.technician && ` - Assigned to ${formData.technician.split(' - ')[0]}`}
                  {formData.cost_estimate && ` - Estimated cost: ₹${parseFloat(formData.cost_estimate).toLocaleString()}`}
                </Typography>
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={<ScheduleIcon />}
        >
          {loading ? 'Scheduling...' : 'Schedule Maintenance'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MaintenanceModal;