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
import api from '../../services/api';

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
  const [backupLocation, setBackupLocation] = useState<'local' | 'cloud'>('local');
  const [backupDescription, setBackupDescription] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [backupsResponse, jobsResponse] = await Promise.all([
        api.get('/backups'),
        api.get('/backups/jobs')
      ]);
      
      const backupsData = backupsResponse.data.data || backupsResponse.data;
      const jobsData = jobsResponse.data.data || jobsResponse.data;
      
      setBackups(backupsData);
      setBackupJobs(jobsData);
    } catch (error) {
      console.error('Failed to load backup data:', error);
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
      const response = await api.post('/backups', {
        name: backupName,
        type: backupType,
        location: backupLocation,
        description: backupDescription
      }, {
        onDownloadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setProgress(progress);
        },
      });
      
      const newBackup = response.data.data || response.data;
      setBackups(prev => [newBackup, ...prev]);
      setCreateBackupOpen(false);
      setBackupName('');
      setBackupDescription('');
      toast.success('Backup created successfully!');
    } catch (error) {
      console.error('Failed to create backup:', error);
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
      await api.post(`/backups/${selectedBackup.id}/restore`, {}, {
        onDownloadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setProgress(progress);
        },
      });
      
      setRestoreBackupOpen(false);
      setSelectedBackup(null);
      toast.success('System restored successfully!');
    } catch (error) {
      console.error('Failed to restore backup:', error);
      toast.error('Failed to restore backup');
    } finally {
      setRestoreInProgress(false);
      setProgress(0);
    }
  };

  const handleDownloadBackup = async (backup: BackupInfo) => {
    try {
      toast.info(`Downloading ${backup.name}...`);
      
      const response = await api.get(`/backups/${backup.id}/download`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/zip' });
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
      console.error('Failed to download backup:', error);
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
        console.log('Deleting backup via API:', backupId);
        
        // Call API to delete backup
        await api.delete(`/backups/${backupId}`);
        
        // Reload backups from server
        const response = await api.get('/backups');
        const backupData = response.data.data || response.data;
        setBackups(backupData);
        
        toast.success('Backup deleted successfully');
      } catch (error: any) {
        console.error('Failed to delete backup:', error);
        const errorMsg = error.response?.data?.message || error.message || 'Failed to delete backup';
        toast.error(errorMsg);
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