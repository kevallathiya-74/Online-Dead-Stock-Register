import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  CloudUpload as CloudUploadIcon,
  Storage as StorageIcon,
  Security as SecurityIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';

interface BackupInfo {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  size: string;
  createdAt: string;
  status: 'completed' | 'failed' | 'in-progress';
  location: 'local' | 'cloud';
  description?: string;
}

interface BackupJob {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  schedule: string;
  enabled: boolean;
  lastRun?: string;
  nextRun: string;
  status: 'active' | 'paused' | 'failed';
}

const AdminBackupPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [restoreInProgress, setRestoreInProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
  
  // Dialog states
  const [createBackupOpen, setCreateBackupOpen] = useState(false);
  const [restoreBackupOpen, setRestoreBackupOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(null);
  
  // Form states
  const [backupName, setBackupName] = useState('');
  const [backupType, setBackupType] = useState<'full' | 'incremental' | 'differential'>('full');
  const [backupDescription, setBackupDescription] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      setBackups([
        {
          id: '1',
          name: 'Daily_Backup_2024_10_10',
          type: 'full',
          size: '2.3 GB',
          createdAt: '2024-10-10T08:00:00Z',
          status: 'completed',
          location: 'local',
          description: 'Daily automated full backup'
        },
        {
          id: '2',
          name: 'Weekly_Backup_2024_10_07',
          type: 'full',
          size: '2.1 GB',
          createdAt: '2024-10-07T02:00:00Z',
          status: 'completed',
          location: 'cloud',
          description: 'Weekly scheduled backup'
        },
        {
          id: '3',
          name: 'Emergency_Backup_2024_10_09',
          type: 'incremental',
          size: '450 MB',
          createdAt: '2024-10-09T14:30:00Z',
          status: 'completed',
          location: 'local',
          description: 'Emergency backup before system update'
        }
      ]);

      setBackupJobs([
        {
          id: '1',
          name: 'Daily Full Backup',
          type: 'full',
          schedule: 'Daily at 2:00 AM',
          enabled: true,
          lastRun: '2024-10-10T02:00:00Z',
          nextRun: '2024-10-11T02:00:00Z',
          status: 'active'
        },
        {
          id: '2',
          name: 'Hourly Incremental',
          type: 'incremental',
          schedule: 'Every hour',
          enabled: true,
          lastRun: '2024-10-10T16:00:00Z',
          nextRun: '2024-10-10T17:00:00Z',
          status: 'active'
        }
      ]);
    } catch (error) {
      toast.error('Failed to load backup data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!backupName.trim()) {
      toast.error('Please enter a backup name');
      return;
    }

    setBackupInProgress(true);
    setProgress(0);
    
    try {
      // Simulate backup progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 500);

      // Simulate backup completion
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const newBackup: BackupInfo = {
        id: Date.now().toString(),
        name: backupName,
        type: backupType,
        size: '1.8 GB',
        createdAt: new Date().toISOString(),
        status: 'completed',
        location: 'local',
        description: backupDescription
      };

      setBackups(prev => [newBackup, ...prev]);
      setCreateBackupOpen(false);
      setBackupName('');
      setBackupDescription('');
      toast.success('Backup created successfully!');
    } catch (error) {
      toast.error('Failed to create backup');
    } finally {
      setBackupInProgress(false);
      setProgress(0);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;

    setRestoreInProgress(true);
    setProgress(0);

    try {
      // Simulate restore progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + Math.random() * 10;
        });
      }, 800);

      // Simulate restore completion
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      setRestoreBackupOpen(false);
      setSelectedBackup(null);
      toast.success('System restored successfully!');
    } catch (error) {
      toast.error('Failed to restore backup');
    } finally {
      setRestoreInProgress(false);
      setProgress(0);
    }
  };

  const handleDownloadBackup = async (backup: BackupInfo) => {
    try {
      toast.info(`Downloading ${backup.name}...`);
      
      // Simulate download process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, this would initiate a file download
      const blob = new Blob(['Mock backup data'], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${backup.name}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Backup downloaded successfully');
    } catch (error) {
      toast.error('Failed to download backup');
    }
  };

  const handleUploadToCloud = () => {
    toast.info('Uploading backups to cloud storage...');
    // In a real app, this would initiate cloud upload
    setTimeout(() => {
      toast.success('Backups uploaded to cloud successfully');
    }, 3000);
  };

  const handleManageSchedule = () => {
    toast.info('Opening backup schedule manager...');
    // In a real app, this would open a schedule management dialog
  };

  const handleBackupSettings = () => {
    toast.info('Opening backup settings...');
    // In a real app, this would open backup configuration settings
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (window.confirm('Are you sure you want to delete this backup?')) {
      try {
        setBackups(prev => prev.filter(b => b.id !== backupId));
        toast.success('Backup deleted successfully');
      } catch (error) {
        toast.error('Failed to delete backup');
      }
    }
  };

  const getStatusIcon = (status: BackupInfo['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'in-progress':
        return <CircularProgress size={20} />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getStatusColor = (status: BackupInfo['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'in-progress':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            System Backups
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadData}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<BackupIcon />}
              onClick={() => setCreateBackupOpen(true)}
              disabled={backupInProgress}
            >
              Create Backup
            </Button>
          </Box>
        </Box>

        {/* Backup Progress */}
        {(backupInProgress || restoreInProgress) && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {backupInProgress ? 'Creating Backup...' : 'Restoring System...'}
              </Typography>
              <LinearProgress variant="determinate" value={progress} sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                {Math.round(progress)}% complete
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* System Status */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <StorageIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Storage Used</Typography>
                </Box>
                <Typography variant="h4">8.2 GB</Typography>
                <Typography variant="body2" color="text.secondary">
                  of 100 GB available
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BackupIcon sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="h6">Total Backups</Typography>
                </Box>
                <Typography variant="h4">{backups.length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Available for restore
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckCircleIcon sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="h6">Last Backup</Typography>
                </Box>
                <Typography variant="h4">2 hours ago</Typography>
                <Typography variant="body2" color="text.secondary">
                  Successful
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ScheduleIcon sx={{ mr: 1, color: 'info.main' }} />
                  <Typography variant="h6">Next Backup</Typography>
                </Box>
                <Typography variant="h4">22 hours</Typography>
                <Typography variant="body2" color="text.secondary">
                  Scheduled
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Available Backups */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Available Backups
                </Typography>
                <List>
                  {backups.map((backup, index) => (
                    <React.Fragment key={backup.id}>
                      <ListItem>
                        <ListItemIcon>
                          {getStatusIcon(backup.status)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1">{backup.name}</Typography>
                              <Chip 
                                label={backup.type} 
                                size="small" 
                                variant="outlined" 
                              />
                              <Chip 
                                label={backup.location} 
                                size="small" 
                                color={backup.location === 'cloud' ? 'primary' : 'default'}
                              />
                              <Chip 
                                label={backup.status} 
                                size="small" 
                                color={getStatusColor(backup.status) as any}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Size: {backup.size} • Created: {new Date(backup.createdAt).toLocaleString()}
                              </Typography>
                              {backup.description && (
                                <Typography variant="body2" color="text.secondary">
                                  {backup.description}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedBackup(backup);
                                setRestoreBackupOpen(true);
                              }}
                              disabled={restoreInProgress || backup.status !== 'completed'}
                            >
                              <RestoreIcon />
                            </IconButton>
                            <IconButton 
                              size="small"
                              onClick={() => handleDownloadBackup(backup)}
                            >
                              <DownloadIcon />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteBackup(backup.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < backups.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Backup Jobs */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Scheduled Jobs
                </Typography>
                <List>
                  {backupJobs.map((job, index) => (
                    <React.Fragment key={job.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2">{job.name}</Typography>
                              <Chip 
                                label={job.status} 
                                size="small" 
                                color={job.status === 'active' ? 'success' : 'default'}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {job.schedule}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Next: {new Date(job.nextRun).toLocaleString()}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < backupJobs.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                    onClick={handleUploadToCloud}
                  >
                    Upload to Cloud
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ScheduleIcon />}
                    fullWidth
                    onClick={handleManageSchedule}
                  >
                    Manage Schedule
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<SecurityIcon />}
                    fullWidth
                    onClick={handleBackupSettings}
                  >
                    Backup Settings
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Create Backup Dialog */}
        <Dialog open={createBackupOpen} onClose={() => setCreateBackupOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Backup</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Backup Name"
                value={backupName}
                onChange={(e) => setBackupName(e.target.value)}
                sx={{ mb: 2 }}
                placeholder="e.g., Manual_Backup_2024_10_10"
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Backup Type</InputLabel>
                <Select
                  value={backupType}
                  onChange={(e) => setBackupType(e.target.value as any)}
                  label="Backup Type"
                >
                  <MenuItem value="full">Full Backup</MenuItem>
                  <MenuItem value="incremental">Incremental Backup</MenuItem>
                  <MenuItem value="differential">Differential Backup</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Description (Optional)"
                value={backupDescription}
                onChange={(e) => setBackupDescription(e.target.value)}
                multiline
                rows={3}
                placeholder="Enter backup description or notes..."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateBackupOpen(false)} disabled={backupInProgress}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateBackup} 
              variant="contained" 
              disabled={backupInProgress || !backupName.trim()}
            >
              {backupInProgress ? 'Creating...' : 'Create Backup'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Restore Backup Dialog */}
        <Dialog open={restoreBackupOpen} onClose={() => setRestoreBackupOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Restore System</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              This will restore the system to the state when this backup was created. All current data changes will be lost.
            </Alert>
            {selectedBackup && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Backup Details:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Name: {selectedBackup.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Type: {selectedBackup.type}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Size: {selectedBackup.size}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Created: {new Date(selectedBackup.createdAt).toLocaleString()}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRestoreBackupOpen(false)} disabled={restoreInProgress}>
              Cancel
            </Button>
            <Button 
              onClick={handleRestoreBackup} 
              variant="contained" 
              color="warning"
              disabled={restoreInProgress}
            >
              {restoreInProgress ? 'Restoring...' : 'Restore System'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default AdminBackupPage;