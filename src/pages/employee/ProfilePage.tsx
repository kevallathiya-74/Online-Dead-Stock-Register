import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Avatar,
  Divider,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  Edit as EditIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  History as HistoryIcon,
  Badge as BadgeIcon,
  Key as KeyIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/Layout';

const ProfilePage = () => {
  const [editMode, setEditMode] = useState(false);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  
  // User profile data
  const [profile, setProfile] = useState({
    firstName: 'John',
    lastName: 'Employee',
    email: 'employee@company.com',
    phone: '+1 (555) 123-4567',
    department: 'Information Technology',
    jobTitle: 'Software Developer',
    employeeId: 'EMP-001',
    location: 'Floor 2, Building A',
    manager: 'Jane Manager',
    startDate: '2023-01-15',
    avatar: '',
  });

  // Settings
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    maintenanceAlerts: true,
    warrantyAlerts: true,
    requestUpdates: true,
    weeklyReports: false,
  });

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Activity log sample data
  const [activityLog] = useState([
    {
      id: '1',
      action: 'Asset Request Submitted',
      description: 'Requested new MacBook Pro',
      timestamp: '2024-01-15T10:30:00Z',
      status: 'pending',
    },
    {
      id: '2',
      action: 'Maintenance Report',
      description: 'Reported battery issue for Dell XPS 15',
      timestamp: '2024-01-14T14:22:00Z',
      status: 'completed',
    },
    {
      id: '3',
      action: 'Profile Updated',
      description: 'Updated phone number',
      timestamp: '2024-01-10T09:15:00Z',
      status: 'completed',
    },
    {
      id: '4',
      action: 'Asset Check-in',
      description: 'Checked in HP Monitor 24"',
      timestamp: '2024-01-08T16:45:00Z',
      status: 'completed',
    },
  ]);

  const handleSaveProfile = () => {
    toast.success('Profile updated successfully!');
    setEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    // Reset form values if needed
  };

  const handleChangePassword = () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    toast.success('Password changed successfully!');
    setChangePasswordDialogOpen(false);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handleSettingChange = (setting: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      [setting]: event.target.checked,
    });
    toast.info(`${setting} setting updated`);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  return (
    <DashboardLayout title="My Profile">
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            My Profile
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your personal information and account settings
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Profile Information */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">
                    Personal Information
                  </Typography>
                  <Button
                    startIcon={editMode ? <CancelIcon /> : <EditIcon />}
                    onClick={() => editMode ? handleCancelEdit() : setEditMode(true)}
                  >
                    {editMode ? 'Cancel' : 'Edit'}
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mr: 3,
                      bgcolor: 'primary.main',
                      fontSize: '2rem',
                    }}
                  >
                    {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      {profile.firstName} {profile.lastName}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      {profile.jobTitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {profile.department}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      disabled={!editMode}
                      InputProps={{
                        startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      disabled={!editMode}
                      InputProps={{
                        startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      disabled={!editMode}
                      type="email"
                      InputProps={{
                        startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      disabled={!editMode}
                      InputProps={{
                        startAdornment: <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Department"
                      value={profile.department}
                      disabled
                      InputProps={{
                        startAdornment: <WorkIcon sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Employee ID"
                      value={profile.employeeId}
                      disabled
                      InputProps={{
                        startAdornment: <BadgeIcon sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Location"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      disabled={!editMode}
                      InputProps={{
                        startAdornment: <LocationIcon sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                    />
                  </Grid>
                </Grid>

                {editMode && (
                  <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveProfile}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Info & Actions */}
          <Grid item xs={12} md={4}>
            <Grid container spacing={3}>
              {/* Quick Info */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Quick Info
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <WorkIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Manager"
                          secondary={profile.manager}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <BadgeIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Start Date"
                          secondary={new Date(profile.startDate).toLocaleDateString()}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <LocationIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Office Location"
                          secondary={profile.location}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Security Actions */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Security & Privacy
                    </Typography>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<KeyIcon />}
                      onClick={() => setChangePasswordDialogOpen(true)}
                      sx={{ mb: 2 }}
                    >
                      Change Password
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<SecurityIcon />}
                      onClick={() => toast.info('Two-factor authentication setup coming soon!')}
                    >
                      Setup 2FA
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          {/* Notification Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Notification Settings
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.emailNotifications}
                        onChange={handleSettingChange('emailNotifications')}
                      />
                    }
                    label="Email Notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.smsNotifications}
                        onChange={handleSettingChange('smsNotifications')}
                      />
                    }
                    label="SMS Notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.maintenanceAlerts}
                        onChange={handleSettingChange('maintenanceAlerts')}
                      />
                    }
                    label="Maintenance Alerts"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.warrantyAlerts}
                        onChange={handleSettingChange('warrantyAlerts')}
                      />
                    }
                    label="Warranty Expiry Alerts"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.requestUpdates}
                        onChange={handleSettingChange('requestUpdates')}
                      />
                    }
                    label="Request Status Updates"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.weeklyReports}
                        onChange={handleSettingChange('weeklyReports')}
                      />
                    }
                    label="Weekly Reports"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Recent Activity
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Action</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activityLog.slice(0, 5).map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {activity.action}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {activity.description}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {new Date(activity.timestamp).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={activity.status}
                              color={getStatusColor(activity.status) as any}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Button
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() => toast.info('Full activity log coming soon!')}
                >
                  View All Activity
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Change Password Dialog */}
        <Dialog
          open={changePasswordDialogOpen}
          onClose={() => setChangePasswordDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Change Password</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Current Password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                margin="normal"
                helperText="Password must be at least 8 characters long"
              />
              <TextField
                fullWidth
                label="Confirm New Password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                margin="normal"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setChangePasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleChangePassword}
            >
              Change Password
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default ProfilePage;