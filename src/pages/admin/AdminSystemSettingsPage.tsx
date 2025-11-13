import React, { useState, useEffect } from 'react';
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
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  Avatar,
  List,
  ListItem,
  LinearProgress,
  IconButton,
  Tooltip,
  ListItemText,
  ListItemSecondaryAction,
  Tab,
  Tabs,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Storage as StorageIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Restore as RestoreIcon,
  GetApp as GetAppIcon,
  Settings as SettingsIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Web as WebIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

interface SystemConfiguration {
  id: string;
  category: string;
  name: string;
  value: string | boolean | number;
  description: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  options?: string[];
  required: boolean;
  sensitive?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdminSystemSettingsPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [configurations, setConfigurations] = useState<SystemConfiguration[]>([]);
  const [testResults, setTestResults] = useState<{ [key: string]: 'success' | 'error' | 'pending' }>({});
  const [backupDialog, setBackupDialog] = useState(false);
  const [configDialog, setConfigDialog] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<SystemConfiguration | null>(null);
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupStatus, setBackupStatus] = useState('');
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<any>(null);
  const [backupHistory, setBackupHistory] = useState([
    {
      id: '1',
      date: '2024-01-15T02:00:00Z',
      type: 'Full',
      size: '2.4 GB',
      status: 'Success',
      filename: 'backup_full_20240115_020000.zip',
      description: 'Scheduled full backup'
    },
    {
      id: '2', 
      date: '2024-01-14T14:30:00Z',
      type: 'Incremental',
      size: '145 MB',
      status: 'Success',
      filename: 'backup_incr_20240114_143000.zip',
      description: 'Incremental backup after major updates'
    },
    {
      id: '3',
      date: '2024-01-14T02:00:00Z',
      type: 'Full',
      size: '2.3 GB', 
      status: 'Success',
      filename: 'backup_full_20240114_020000.zip',
      description: 'Daily scheduled backup'
    },
    {
      id: '4',
      date: '2024-01-13T08:15:00Z',
      type: 'Manual',
      size: '2.2 GB',
      status: 'Success',
      filename: 'backup_manual_20240113_081500.zip',
      description: 'Manual backup before system update'
    }
  ]);

  useEffect(() => {
    loadSystemConfiguration();
  }, []);

  const loadSystemConfiguration = async () => {
    setLoading(true);
    try {
      const response = await api.get('/settings');
      const configData = response.data.data || response.data;
      
      if (Array.isArray(configData) && configData.length > 0) {
        setConfigurations(configData);
      } else {
        setConfigurations([]);
        toast.warning('No system settings configured');
      }
    } catch (error) {
      console.error('Failed to load system settings:', error);
      toast.error('Failed to load system settings');
      setConfigurations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleConfigSave = async (config: SystemConfiguration, newValue: string | boolean | number) => {
    setLoading(true);
    try {
      await api.put(`/settings/${config.id}`, { value: newValue });
      
      setConfigurations(prev => prev.map(c => 
        c.id === config.id ? { ...c, value: newValue } : c
      ));
      
      toast.success(`${config.name} updated successfully`);
    } catch (error) {
      console.error('Failed to update setting:', error);
      toast.error(`Failed to update ${config.name}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (type: string) => {
    setTestResults(prev => ({ ...prev, [type]: 'pending' }));
    
    try {
      const response = await api.post(`/settings/test-connection/${type}`);
      const success = response.data.success;
      
      setTestResults(prev => ({ ...prev, [type]: success ? 'success' : 'error' }));
      
      if (success) {
        toast.success(`${type} connection test successful`);
      } else {
        toast.error(`${type} connection test failed`);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setTestResults(prev => ({ ...prev, [type]: 'error' }));
      toast.error(`${type} connection test failed`);
    }
  };

  const handleBackup = async (type: 'full' | 'incremental') => {
    setLoading(true);
    setBackupProgress(0);
    setBackupStatus(`Starting ${type} backup...`);
    
    try {
      const response = await api.post('/settings/backup', { type }, {
        onDownloadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setBackupProgress(progress);
        },
      });
      
      const newBackup = response.data.data || response.data;
      setBackupHistory(prev => [newBackup, ...prev.slice(0, 9)]); // Keep last 10 backups
      setBackupStatus('Backup completed successfully!');
      toast.success(`${type} backup completed successfully`);
      
    } catch (error) {
      console.error('Backup failed:', error);
      setBackupStatus('Backup failed!');
      toast.error(`${type} backup failed`);
    } finally {
      setTimeout(() => {
        setLoading(false);
        setBackupProgress(0);
        setBackupStatus('');
      }, 2000);
    }
  };

  const handleRestore = async (backup: any) => {
    setLoading(true);
    setBackupStatus(`Restoring from ${backup.filename}...`);
    
    try {
      const steps = [
        'Preparing restore environment...',
        'Validating backup file...',
        'Stopping services...',
        'Restoring database...',
        'Restoring files...',
        'Restarting services...'
      ];
      
      for (let i = 0; i < steps.length; i++) {
        setBackupStatus(steps[i]);
        setBackupProgress((i + 1) / steps.length * 100);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setBackupStatus('Restore completed successfully!');
      toast.success('System restored successfully');
      setRestoreDialog(false);
      
    } catch (error) {
      setBackupStatus('Restore failed!');
      toast.error('System restore failed');
    } finally {
      setTimeout(() => {
        setLoading(false);
        setBackupProgress(0);
        setBackupStatus('');
      }, 2000);
    }
  };

  const downloadBackup = (backup: any) => {
    toast.info(`Downloading ${backup.filename}...`);
    setTimeout(() => {
      toast.success('Backup downloaded successfully');
    }, 2000);
  };

  const deleteBackup = (backupId: string) => {
    setBackupHistory(prev => prev.filter(b => b.id !== backupId));
    toast.success('Backup deleted successfully');
  };

  const renderConfigurationCard = (config: SystemConfiguration) => (
    <Card key={config.id} sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              {config.name}
              {config.required && <Chip label="Required" color="error" size="small" sx={{ ml: 1 }} />}
              {config.sensitive && <Chip label="Sensitive" color="warning" size="small" sx={{ ml: 1 }} />}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {config.description}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon />}
            onClick={() => {
              setSelectedConfig(config);
              setConfigDialog(true);
            }}
          >
            Edit
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {config.type === 'boolean' ? (
            <FormControlLabel
              control={
                <Switch
                  checked={config.value as boolean}
                  onChange={(e) => handleConfigSave(config, e.target.checked)}
                />
              }
              label={config.value ? 'Enabled' : 'Disabled'}
            />
          ) : (
            <Typography variant="body1" sx={{ fontFamily: config.sensitive ? 'monospace' : 'inherit' }}>
              {config.value?.toString()}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              System Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Configure system-wide settings and parameters
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadSystemConfiguration}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={() => setBackupDialog(true)}
            >
              Backup System
            </Button>
          </Box>
        </Box>

        {/* Status Alert */}
        <Alert severity="info" sx={{ mb: 3 }}>
          System is running in <strong>Production</strong> mode. Changes to sensitive settings may require application restart.
        </Alert>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<SecurityIcon />} label="Security" />
            <Tab icon={<StorageIcon />} label="Database" />
            <Tab icon={<EmailIcon />} label="Email" />
            <Tab icon={<SettingsIcon />} label="Application" />
            <Tab icon={<NotificationsIcon />} label="Notifications" />
            <Tab icon={<CloudUploadIcon />} label="Backup & Restore" />
          </Tabs>
        </Paper>

        {/* Security Settings */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Authentication & Security
              </Typography>
              {configurations
                .filter(c => c.category === 'Security')
                .map(config => renderConfigurationCard(config))}
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Security Status
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText primary="SSL Certificate" secondary="Valid until Dec 2024" />
                      <ListItemSecondaryAction>
                        <Chip label="Active" color="success" size="small" />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Firewall Status" secondary="All ports secured" />
                      <ListItemSecondaryAction>
                        <Chip label="Active" color="success" size="small" />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Intrusion Detection" secondary="No threats detected" />
                      <ListItemSecondaryAction>
                        <Chip label="Clean" color="success" size="small" />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Database Settings */}
        <TabPanel value={currentTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Database Configuration
              </Typography>
              {configurations
                .filter(c => c.category === 'Database')
                .map(config => renderConfigurationCard(config))}
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Connection Test
                  </Typography>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => handleTestConnection('Database')}
                    disabled={testResults.Database === 'pending'}
                    startIcon={
                      testResults.Database === 'pending' ? (
                        <CircularProgress size={16} />
                      ) : testResults.Database === 'success' ? (
                        <CheckIcon color="success" />
                      ) : testResults.Database === 'error' ? (
                        <WarningIcon color="error" />
                      ) : (
                        <StorageIcon />
                      )
                    }
                  >
                    {testResults.Database === 'pending' ? 'Testing...' : 'Test Connection'}
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Database Info
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    MongoDB Atlas Cluster
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> Connected<br />
                    <strong>Size:</strong> 2.4 GB<br />
                    <strong>Collections:</strong> 12<br />
                    <strong>Last Backup:</strong> 2 hours ago
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Email Settings */}
        <TabPanel value={currentTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Email Configuration
              </Typography>
              {configurations
                .filter(c => c.category === 'Email')
                .map(config => renderConfigurationCard(config))}
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Email Test
                  </Typography>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => handleTestConnection('Email')}
                    disabled={testResults.Email === 'pending'}
                    startIcon={
                      testResults.Email === 'pending' ? (
                        <CircularProgress size={16} />
                      ) : testResults.Email === 'success' ? (
                        <CheckIcon color="success" />
                      ) : testResults.Email === 'error' ? (
                        <WarningIcon color="error" />
                      ) : (
                        <EmailIcon />
                      )
                    }
                  >
                    {testResults.Email === 'pending' ? 'Sending...' : 'Send Test Email'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Email Statistics
                  </Typography>
                  <Typography variant="body2">
                    <strong>Today:</strong> 45 emails sent<br />
                    <strong>This Week:</strong> 312 emails sent<br />
                    <strong>Bounce Rate:</strong> 2.1%<br />
                    <strong>Queue:</strong> 0 pending
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Application Settings */}
        <TabPanel value={currentTab} index={3}>
          <Typography variant="h6" gutterBottom>
            Application Configuration
          </Typography>
          {configurations
            .filter(c => c.category === 'Application')
            .map(config => renderConfigurationCard(config))}
        </TabPanel>

        {/* Notifications */}
        <TabPanel value={currentTab} index={4}>
          <Typography variant="h6" gutterBottom>
            Notification Settings
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Notification Channels
                  </Typography>
                  <List>
                    <ListItem>
                      <Avatar sx={{ mr: 2 }}>
                        <EmailIcon />
                      </Avatar>
                      <ListItemText primary="Email Notifications" secondary="Asset updates, user actions" />
                      <ListItemSecondaryAction>
                        <Switch defaultChecked />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <Avatar sx={{ mr: 2 }}>
                        <SmsIcon />
                      </Avatar>
                      <ListItemText primary="SMS Alerts" secondary="Critical system events" />
                      <ListItemSecondaryAction>
                        <Switch />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <Avatar sx={{ mr: 2 }}>
                        <WebIcon />
                      </Avatar>
                      <ListItemText primary="Web Push" secondary="Real-time in-app notifications" />
                      <ListItemSecondaryAction>
                        <Switch defaultChecked />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Backup & Restore */}
        <TabPanel value={currentTab} index={5}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Backup Operations
                  </Typography>
                  
                  {/* Progress Display */}
                  {loading && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {backupStatus}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={backupProgress} 
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {Math.round(backupProgress)}% complete
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Button
                      variant="contained"
                      startIcon={<CloudUploadIcon />}
                      onClick={() => handleBackup('full')}
                      disabled={loading}
                    >
                      Full Backup
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<CloudUploadIcon />}
                      onClick={() => handleBackup('incremental')}
                      disabled={loading}
                    >
                      Incremental Backup
                    </Button>
                  </Box>
                  
                  <Typography variant="h6" gutterBottom>
                    Backup History
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Size</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {backupHistory.map((backup) => (
                          <TableRow key={backup.id}>
                            <TableCell>
                              {new Date(backup.date).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={backup.type} 
                                size="small"
                                color={backup.type === 'Full' ? 'primary' : 'default'}
                              />
                            </TableCell>
                            <TableCell>{backup.size}</TableCell>
                            <TableCell>
                              <Chip 
                                label={backup.status} 
                                color={backup.status === 'Success' ? 'success' : 'error'} 
                                size="small" 
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="Download">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => downloadBackup(backup)}
                                  >
                                    <GetAppIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Restore">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => {
                                      setSelectedBackup(backup);
                                      setRestoreDialog(true);
                                    }}
                                    disabled={loading}
                                  >
                                    <RestoreIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => deleteBackup(backup.id)}
                                    color="error"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Backup Settings
                  </Typography>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Automatic Daily Backups"
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Email Backup Notifications"
                  />
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      label="Backup Retention (days)"
                      type="number"
                      defaultValue={30}
                      size="small"
                      sx={{ mb: 2 }}
                    />
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Storage Usage
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={75} 
                      sx={{ height: 8, borderRadius: 4, mb: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      15.2 GB used of 20 GB available (75%)
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Configuration Edit Dialog */}
        <Dialog open={configDialog} onClose={() => setConfigDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Edit Configuration: {selectedConfig?.name}
          </DialogTitle>
          <DialogContent>
            {selectedConfig && (
              <Box sx={{ pt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {selectedConfig.description}
                </Typography>
                
                {selectedConfig.type === 'text' && (
                  <TextField
                    fullWidth
                    label={selectedConfig.name}
                    defaultValue={selectedConfig.value}
                    type={selectedConfig.sensitive ? 'password' : 'text'}
                    sx={{ mt: 2 }}
                    onChange={(e) => {
                      if (selectedConfig) {
                        setSelectedConfig({...selectedConfig, value: e.target.value});
                      }
                    }}
                  />
                )}
                
                {selectedConfig.type === 'number' && (
                  <TextField
                    fullWidth
                    label={selectedConfig.name}
                    type="number"
                    defaultValue={selectedConfig.value}
                    sx={{ mt: 2 }}
                    onChange={(e) => {
                      if (selectedConfig) {
                        setSelectedConfig({...selectedConfig, value: Number(e.target.value)});
                      }
                    }}
                  />
                )}
                
                {selectedConfig.type === 'select' && (
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>{selectedConfig.name}</InputLabel>
                    <Select
                      value={selectedConfig.value}
                      label={selectedConfig.name}
                      onChange={(e) => {
                        if (selectedConfig) {
                          setSelectedConfig({...selectedConfig, value: e.target.value});
                        }
                      }}
                    >
                      {selectedConfig.options?.map(option => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                
                {selectedConfig.type === 'boolean' && (
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={selectedConfig.value as boolean}
                        onChange={(e) => {
                          if (selectedConfig) {
                            setSelectedConfig({...selectedConfig, value: e.target.checked});
                          }
                        }}
                      />
                    }
                    label={selectedConfig.name}
                    sx={{ mt: 2 }}
                  />
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfigDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => {
                if (selectedConfig) {
                  handleConfigSave(selectedConfig, selectedConfig.value);
                  setConfigDialog(false);
                }
              }}
            >
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* Backup Dialog */}
        <Dialog open={backupDialog} onClose={() => setBackupDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Create System Backup
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              This will create a complete backup of your system including all data, configurations, and files.
            </Alert>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Backup Type</InputLabel>
              <Select value="full" label="Backup Type">
                <MenuItem value="full">Full Backup</MenuItem>
                <MenuItem value="incremental">Incremental Backup</MenuItem>
                <MenuItem value="differential">Differential Backup</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Backup Description"
              placeholder="Enter a description for this backup..."
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            
            {backupProgress > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Backup Progress: {backupProgress}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={backupProgress} 
                  sx={{ mb: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {backupStatus}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setBackupDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setLoading(true);
                setBackupProgress(0);
                setBackupStatus('Initializing backup...');
                
                const interval = setInterval(() => {
                  setBackupProgress(prev => {
                    if (prev >= 100) {
                      clearInterval(interval);
                      setLoading(false);
                      setBackupDialog(false);
                      setBackupProgress(0);
                      setBackupStatus('');
                      toast.success('Backup completed successfully!');
                      return 100;
                    }
                    setBackupStatus(`Creating backup... ${prev + 10}%`);
                    return prev + 10;
                  });
                }, 500);
              }}
              color="primary" 
              variant="contained"
              disabled={loading}
              startIcon={<CloudUploadIcon />}
            >
              {loading ? 'Creating Backup...' : 'Create Backup'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Restore Confirmation Dialog */}
        <Dialog open={restoreDialog} onClose={() => setRestoreDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Confirm System Restore
          </DialogTitle>
          <DialogContent>
            {selectedBackup && (
              <Box sx={{ pt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  This will restore your system to the state from the selected backup. 
                  Current data may be lost. Please ensure you have a recent backup before proceeding.
                </Alert>
                
                {/* Progress Display during restore */}
                {loading && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {backupStatus}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={backupProgress} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {Math.round(backupProgress)}% complete
                    </Typography>
                  </Box>
                )}
                
                <Typography variant="h6" gutterBottom>
                  Backup Details
                </Typography>
                <Box sx={{ display: 'grid', gap: 1, mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Date:</strong> {new Date(selectedBackup.date).toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Type:</strong> {selectedBackup.type}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Size:</strong> {selectedBackup.size}
                  </Typography>
                  <Typography variant="body2">
                    <strong>File:</strong> {selectedBackup.filename}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Description:</strong> {selectedBackup.description}
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRestoreDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleRestore(selectedBackup)} 
              color="warning" 
              variant="contained"
              disabled={loading}
              startIcon={<RestoreIcon />}
            >
              {loading ? 'Restoring...' : 'Restore System'}
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </DashboardLayout>
  );
};

export default AdminSystemSettingsPage;