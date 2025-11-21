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
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Build as BuildIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';
import maintenanceService from '../../services/maintenance.service';

interface MaintenanceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (maintenanceData: any) => void;
}

interface Asset {
  _id: string;
  name: string;
  unique_asset_id: string;
  asset_type: string;
  status: string;
}

interface Technician {
  id: string;
  name: string;
  email: string;
  specialization: string[];
  current_workload: number;
}

const MaintenanceModal: React.FC<MaintenanceModalProps> = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    asset_id: '',
    maintenance_type: '',
    priority: 'Medium',
    maintenance_date: '',
    estimated_duration: 2,
    performed_by: '',
    description: '',
    cost: 0,
    downtime_impact: 'Low',
    status: 'Scheduled',
  });

  const [assets, setAssets] = useState<Asset[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Load assets and technicians when modal opens
  useEffect(() => {
    if (open) {
      loadFormData();
    }
  }, [open]);

  const loadFormData = async () => {
    setLoadingData(true);
    try {
      const [assetsRes, techniciansRes] = await Promise.all([
        api.get('/assets'),
        maintenanceService.getTechnicians()
      ]);

      const assetsData = assetsRes.data.data || assetsRes.data || [];
      const techniciansData = techniciansRes.data || [];

      setAssets(Array.isArray(assetsData) ? assetsData : []);
      setTechnicians(Array.isArray(techniciansData) ? techniciansData : []);
    } catch (error) {
      console.error('Failed to load form data:', error);
      toast.error('Failed to load assets and technicians');
    } finally {
      setLoadingData(false);
    }
  };

  const maintenanceTypes = [
    'Preventive',
    'Corrective',
    'Predictive',
    'Emergency',
    'Inspection',
    'Calibration',
    'Cleaning',
  ];

  const priorities = [
    { value: 'Low', color: 'success' },
    { value: 'Medium', color: 'warning' },
    { value: 'High', color: 'error' },
    { value: 'Critical', color: 'error' },
  ];

  const downtimeImpacts = ['Low', 'Medium', 'High'];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.asset_id) {
      toast.error('Please select an asset');
      return;
    }
    
    if (!formData.maintenance_type) {
      toast.error('Please select maintenance type');
      return;
    }
    
    if (!formData.maintenance_date) {
      toast.error('Please select maintenance date');
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(formData.maintenance_date);
    const now = new Date();
    if (selectedDate < now) {
      toast.error('Maintenance date cannot be in the past');
      return;
    }

    setLoading(true);
    try {
      const result = await maintenanceService.createMaintenance({
        asset_id: formData.asset_id,
        maintenance_type: formData.maintenance_type,
        description: formData.description,
        cost: formData.cost,
        maintenance_date: formData.maintenance_date,
        performed_by: formData.performed_by,
        priority: formData.priority,
        status: 'Scheduled',
        estimated_duration: formData.estimated_duration,
        downtime_impact: formData.downtime_impact,
      });
      
      toast.success(result.message || 'Maintenance scheduled successfully!');
      onSubmit(result.data);
      
      // Reset form
      setFormData({
        asset_id: '',
        maintenance_type: '',
        priority: 'Medium',
        maintenance_date: '',
        estimated_duration: 2,
        performed_by: '',
        description: '',
        cost: 0,
        downtime_impact: 'Low',
        status: 'Scheduled',
      });
      onClose();
    } catch (error: any) {
      console.error('Failed to schedule maintenance:', error);
      const errorMessage = error.response?.data?.message || 'Failed to schedule maintenance';
      toast.error(errorMessage);
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
        {loadingData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <CircularProgress />
          </Box>
        ) : (
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
                        getOptionLabel={(option) => typeof option === 'string' ? option : `${option.unique_asset_id} - ${option.name}`}
                        value={assets.find(a => a._id === formData.asset_id) || null}
                        onChange={(_, newValue) => handleInputChange('asset_id', newValue?._id || '')}
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
                        label="Maintenance Date"
                        type="datetime-local"
                        value={formData.maintenance_date}
                        onChange={(e) => handleInputChange('maintenance_date', e.target.value)}
                        required
                        InputLabelProps={{ shrink: true }}
                        inputProps={{
                          min: new Date().toISOString().slice(0, 16)
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Estimated Duration (hours)"
                        type="number"
                        value={formData.estimated_duration}
                        onChange={(e) => handleInputChange('estimated_duration', parseInt(e.target.value) || 1)}
                        inputProps={{ min: 0.5, max: 24, step: 0.5 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Autocomplete
                        options={technicians}
                        getOptionLabel={(option) => typeof option === 'string' ? option : `${option.name} (${option.current_workload} tasks)`}
                        value={technicians.find(t => t.name === formData.performed_by) || null}
                        onChange={(_, newValue) => handleInputChange('performed_by', newValue?.name || '')}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Assigned Technician"
                            placeholder="Select technician..."
                          />
                        )}
                        renderOption={(props, option) => (
                          <Box component="li" {...props}>
                            <Box>
                              <Typography variant="body2">{option.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {option.specialization.join(', ')} • {option.current_workload} active tasks
                              </Typography>
                            </Box>
                          </Box>
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

            {/* Cost & Downtime */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Cost Estimate</Typography>
                  <TextField
                    fullWidth
                    label="Estimated Cost"
                    type="number"
                    value={formData.cost}
                    onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>,
                    }}
                    inputProps={{ min: 0, step: 100 }}
                    placeholder="0"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Downtime Impact</Typography>
                  <FormControl fullWidth>
                    <InputLabel>Impact Level</InputLabel>
                    <Select
                      value={formData.downtime_impact}
                      label="Impact Level"
                      onChange={(e) => handleInputChange('downtime_impact', e.target.value)}
                    >
                      {downtimeImpacts.map((impact) => (
                        <MenuItem key={impact} value={impact}>
                          {impact}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>

            {/* Preview */}
            {formData.asset_id && formData.maintenance_type && formData.maintenance_date && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Maintenance Summary:</strong> {formData.maintenance_type} maintenance for{' '}
                    {assets.find(a => a._id === formData.asset_id)?.name || 'selected asset'}{' '}
                    scheduled on {new Date(formData.maintenance_date).toLocaleString()}{' '}
                    {formData.performed_by && ` - Assigned to ${formData.performed_by}`}
                    {formData.cost > 0 && ` - Estimated cost: ₹${formData.cost.toLocaleString()}`}
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        )}
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