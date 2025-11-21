import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Avatar,
  Divider,
  Chip
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Security as SecurityIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const steps = ['Basic Information', 'Role & Department', 'Permissions & Access'];

const AdminAddUserPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    employee_id: '',
    role: 'Auditor',
    department: '',
    location: '',
    manager: '',
    is_active: true,
    permissions: {
      assets: { read: true, write: false, delete: false },
      users: { read: false, write: false, delete: false },
      reports: { read: true, write: false, delete: false },
      settings: { read: false, write: false, delete: false }
    }
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateStep = (step: number) => {
    const newErrors: { [key: string]: string } = {};

    switch (step) {
      case 0:
        if (!newUser.name) newErrors.name = 'Name is required';
        if (!newUser.email) newErrors.email = 'Email is required';
        if (!newUser.email.includes('@')) newErrors.email = 'Valid email is required';
        break;
      case 1:
        if (!newUser.department) newErrors.department = 'Department is required';
        if (!newUser.role) newErrors.role = 'Role is required';
        break;
      case 2:
        // No validation needed for permissions step
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleRoleChange = (role: string) => {
    setNewUser(prev => {
      // Auto-set permissions based on role
      let permissions = { ...prev.permissions };
    
      switch (role) {
        case 'Admin':
          permissions = {
            assets: { read: true, write: true, delete: true },
            users: { read: true, write: true, delete: true },
            reports: { read: true, write: true, delete: true },
            settings: { read: true, write: true, delete: true }
          };
          break;
        case 'Inventory_Manager':
          permissions = {
            assets: { read: true, write: true, delete: false },
            users: { read: true, write: false, delete: false },
            reports: { read: true, write: true, delete: false },
            settings: { read: true, write: false, delete: false }
          };
          break;
        case 'Auditor':
          permissions = {
            assets: { read: true, write: false, delete: false },
            users: { read: true, write: false, delete: false },
            reports: { read: true, write: false, delete: false },
            settings: { read: true, write: false, delete: false }
          };
          break;
        default: // Other roles
          permissions = {
            assets: { read: true, write: false, delete: false },
            users: { read: false, write: false, delete: false },
            reports: { read: true, write: false, delete: false },
            settings: { read: false, write: false, delete: false }
          };
      }
      
      return { ...prev, role, permissions };
    });
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    try {
      const userData = {
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        employee_id: newUser.employee_id || undefined, // Let backend auto-generate if empty
        role: newUser.role,
        department: newUser.department,
        location: newUser.location,
        manager: newUser.manager,
        is_active: newUser.is_active,
        password: 'Password@123' // Default password
      };

      console.log('Creating user via API:', userData);
      
      // Call API to create user
      const response = await api.post('/users', userData);
      
      console.log('User created successfully:', response.data);
      toast.success(`User created successfully! Employee ID: ${response.data.data.employee_id}`);
      navigate('/users');
    } catch (error: any) {
      console.error('Failed to create user:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create user';
      toast.error(errorMsg);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Enter the user's basic personal and contact information
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Full Name"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Email Address"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={newUser.phone}
                onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Employee ID"
                value={newUser.employee_id}
                onChange={(e) => setNewUser(prev => ({ ...prev, employee_id: e.target.value }))}
                helperText="Leave blank to auto-generate"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={newUser.location}
                onChange={(e) => setNewUser(prev => ({ ...prev, location: e.target.value }))}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Role & Department
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Assign the user's role and department within the organization
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.role}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={newUser.role}
                  label="Role"
                  onChange={(e) => handleRoleChange(e.target.value)}
                >
                  <MenuItem value="ADMIN">Admin</MenuItem>
                  <MenuItem value="INVENTORY_MANAGER">Inventory Manager</MenuItem>
                  <MenuItem value="AUDITOR">Auditor</MenuItem>
                  <MenuItem value="VENDOR">Vendor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.department}>
                <InputLabel>Department</InputLabel>
                <Select
                  value={newUser.department}
                  label="Department"
                  onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                >
                  <MenuItem value="INVENTORY">Inventory</MenuItem>
                  <MenuItem value="IT">IT</MenuItem>
                  <MenuItem value="ADMIN">Admin</MenuItem>
                  <MenuItem value="VENDOR">Vendor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Manager"
                value={newUser.manager}
                onChange={(e) => setNewUser(prev => ({ ...prev, manager: e.target.value }))}
                helperText="Enter the name of the user's direct manager"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newUser.is_active}
                    onChange={(e) => setNewUser(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                }
                label="Active User"
              />
            </Grid>

            {/* Role Description */}
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>
                  {newUser.role.replace('_', ' ')} Role Description:
                </Typography>
                <Typography variant="body2">
                  {newUser.role === 'Admin' && 'Full system access with user management, settings, and all permissions.'}
                  {newUser.role === 'Inventory_Manager' && 'Manage assets, inventory, purchase orders, and generate reports.'}
                  {newUser.role === 'Auditor' && 'Read-only access to all data for auditing and compliance purposes.'}
                  {newUser.role === 'Vendor' && 'Access to vendor portal for purchase orders and invoices.'}
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Permissions & Access
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Review and customize user permissions (auto-configured based on role)
              </Typography>
            </Grid>

            {Object.entries(newUser.permissions).map(([module, perms]) => (
              <Grid item xs={12} sm={6} key={module}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ textTransform: 'capitalize' }}>
                      {module} Module
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={perms.read}
                            onChange={(e) => setNewUser(prev => ({
                              ...prev,
                              permissions: {
                                ...prev.permissions,
                                [module]: { ...perms, read: e.target.checked }
                              }
                            }))}
                          />
                        }
                        label="Read Access"
                      />
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={perms.write}
                            onChange={(e) => setNewUser(prev => ({
                              ...prev,
                              permissions: {
                                ...prev.permissions,
                                [module]: { ...perms, write: e.target.checked }
                              }
                            }))}
                          />
                        }
                        label="Write Access"
                      />
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={perms.delete}
                            onChange={(e) => setNewUser(prev => ({
                              ...prev,
                              permissions: {
                                ...prev.permissions,
                                [module]: { ...perms, delete: e.target.checked }
                              }
                            }))}
                          />
                        }
                        label="Delete Access"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}

            {/* User Summary */}
            <Grid item xs={12}>
              <Card sx={{ bgcolor: 'grey.50' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    User Summary
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                      <PersonIcon fontSize="large" />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{newUser.name || 'New User'}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {newUser.email}
                      </Typography>
                      <Chip 
                        label={newUser.role.replace('_', ' ')} 
                        color="primary" 
                        size="small" 
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Department</Typography>
                      <Typography variant="body1">{newUser.department || 'Not specified'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Manager</Typography>
                      <Typography variant="body1">{newUser.manager || 'Not specified'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Location</Typography>
                      <Typography variant="body1">{newUser.location || 'Not specified'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Status</Typography>
                      <Chip 
                        label={newUser.is_active ? 'Active' : 'Inactive'} 
                        color={newUser.is_active ? 'success' : 'default'} 
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ flexGrow: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Add New User
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create a new user account with appropriate role and permissions
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/users')}
          >
            Back to Users
          </Button>
        </Box>

        <Paper sx={{ p: 4 }}>
          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel
                  StepIconComponent={({ active, completed }) => (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: completed ? 'success.main' : active ? 'primary.main' : 'grey.300',
                        color: 'white'
                      }}
                    >
                      {completed ? (
                        <CheckIcon />
                      ) : index === 0 ? (
                        <PersonIcon />
                      ) : index === 1 ? (
                        <WorkIcon />
                      ) : (
                        <SecurityIcon />
                      )}
                    </Box>
                  )}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step Content */}
          <Box sx={{ mb: 4 }}>
            {getStepContent(activeStep)}
          </Box>

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              Back
            </Button>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/users')}
              >
                Cancel
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSubmit}
                >
                  Create User
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </DashboardLayout>
  );
};

export default AdminAddUserPage;