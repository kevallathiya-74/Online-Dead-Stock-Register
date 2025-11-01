import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Tabs,
  Tab,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,

} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  FileDownload as DownloadIcon,
  Assignment as AssignmentIcon,
  Build as MaintenanceIcon,
  SwapHoriz as TransferIcon,
  Add as AddIcon,
  CheckCircle as CheckIcon,

  Visibility as ViewIcon,
  Computer as ComputerIcon,
  Laptop as LaptopIcon,
  Smartphone as PhoneIcon,
  Print as PrinterIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/Layout';

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
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

const HistoryPage = () => {
  const location = useLocation();
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [activityDetailDialogOpen, setActivityDetailDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assetHistory, setAssetHistory] = useState<any[]>([]);

  // Fetch activity history on mount
  React.useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/audit-logs/my-activity?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Transform audit logs to history format
        const transformedHistory = (data.data || []).map((log: any) => ({
          id: log._id,
          type: log.entity_type?.toLowerCase() || 'system',
          asset_id: log.entity_id,
          asset_name: log.entity_type,
          action: log.action,
          description: log.description,
          timestamp: log.timestamp,
          status: 'completed',
          details: log.metadata || {}
        }));
        setAssetHistory(transformedHistory);
      } else {
        toast.error('Failed to load activity history');
      }
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Error loading history');
    } finally {
      setLoading(false);
    }
  };

  const [requestHistory, setRequestHistory] = useState<any[]>([]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getAssetIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'laptop': return <LaptopIcon />;
      case 'mobile': return <PhoneIcon />;
      case 'monitor': return <ComputerIcon />;
      case 'printer': return <PrinterIcon />;
      default: return <ComputerIcon />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'assignment': return <AssignmentIcon />;
      case 'maintenance': return <MaintenanceIcon />;
      case 'transfer': return <TransferIcon />;
      case 'request': return <AddIcon />;
      case 'audit': return <CheckIcon />;
      default: return <AssignmentIcon />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'assignment': return 'primary';
      case 'maintenance': return 'warning';
      case 'transfer': return 'info';
      case 'request': return 'secondary';
      case 'audit': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const handleViewDetails = (activity: any) => {
    setSelectedActivity(activity);
    setActivityDetailDialogOpen(true);
  };

  const handleExportHistory = () => {
    toast.info('Export functionality coming soon!');
  };

  const filteredAssetHistory = assetHistory.filter(item =>
    item.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRequestHistory = requestHistory.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if we were passed a specific asset ID to filter by
  React.useEffect(() => {
    if (location.state?.assetId) {
      setSearchTerm(location.state.assetId);
    }
  }, [location.state]);

  return (
    <DashboardLayout title="Activity History">
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Activity History
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track all your asset-related activities and requests
          </Typography>
        </Box>

        {/* Search and Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Time Period"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">This Week</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                  <MenuItem value="quarter">This Quarter</MenuItem>
                  <MenuItem value="year">This Year</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={5}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    onClick={() => toast.info('Advanced filters coming soon!')}
                  >
                    Filters
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportHistory}
                  >
                    Export
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label={`Asset History (${filteredAssetHistory.length})`} />
            <Tab label={`Request History (${filteredRequestHistory.length})`} />
            <Tab label="Timeline View" />
          </Tabs>
        </Box>

        {/* Asset History Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Asset</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAssetHistory.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {getAssetIcon(activity.asset_category)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {activity.asset_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {activity.asset_id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          sx={{
                            mr: 2,
                            width: 32,
                            height: 32,
                            bgcolor: `${getActivityColor(activity.type)}.main`,
                          }}
                        >
                          {getActivityIcon(activity.type)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {activity.action}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {activity.description}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={activity.status}
                        color={getStatusColor(activity.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleViewDetails(activity)}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Request History Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {filteredRequestHistory.map((request) => (
              <Grid item xs={12} key={request.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {request.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {request.description}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {request.priority && (
                          <Chip
                            label={request.priority}
                            color={getPriorityColor(request.priority) as any}
                            size="small"
                          />
                        )}
                        <Chip
                          label={request.status}
                          color={getStatusColor(request.status) as any}
                          size="small"
                        />
                      </Box>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Type:</strong> {request.type.replace('_', ' ').toUpperCase()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Submitted:</strong> {new Date(request.submitted_date).toLocaleDateString()}
                        </Typography>
                        {request.approval_date && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Approved:</strong> {new Date(request.approval_date).toLocaleDateString()}
                          </Typography>
                        )}
                      </Grid>
                      <Grid item xs={12} md={6}>
                        {request.estimated_cost && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Estimated Cost:</strong> ₹{request.estimated_cost.toLocaleString('en-IN')}
                          </Typography>
                        )}
                        {request.assigned_to && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Assigned To:</strong> {request.assigned_to}
                          </Typography>
                        )}
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Timeline View Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ position: 'relative' }}>
            {/* Timeline line */}
            <Box
              sx={{
                position: 'absolute',
                left: 40,
                top: 0,
                bottom: 0,
                width: 2,
                bgcolor: 'divider',
                zIndex: 0,
              }}
            />
            
            {filteredAssetHistory.slice(0, 10).map((activity, index) => (
              <Box key={activity.id} sx={{ position: 'relative', mb: 4 }}>
                {/* Timeline dot */}
                <Avatar
                  sx={{
                    position: 'absolute',
                    left: 24,
                    top: 16,
                    width: 32,
                    height: 32,
                    bgcolor: `${getActivityColor(activity.type)}.main`,
                    zIndex: 1,
                  }}
                >
                  {getActivityIcon(activity.type)}
                </Avatar>
                
                {/* Content */}
                <Box sx={{ ml: 10 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                      {new Date(activity.timestamp).toLocaleDateString()} {new Date(activity.timestamp).toLocaleTimeString()}
                    </Typography>
                    <Chip
                      label={activity.status}
                      color={getStatusColor(activity.status) as any}
                      size="small"
                    />
                  </Box>
                  
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {activity.action}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {activity.asset_name} ({activity.asset_id})
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        {activity.description}
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleViewDetails(activity)}
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            ))}
          </Box>
        </TabPanel>

        {/* Activity Detail Dialog */}
        <Dialog
          open={activityDetailDialogOpen}
          onClose={() => setActivityDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Activity Details
          </DialogTitle>
          <DialogContent>
            {selectedActivity && (
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          mr: 2,
                          bgcolor: `${getActivityColor(selectedActivity.type)}.main`,
                        }}
                      >
                        {getActivityIcon(selectedActivity.type)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {selectedActivity.action}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedActivity.asset_name} ({selectedActivity.asset_id})
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Basic Information
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell><strong>Type</strong></TableCell>
                            <TableCell>{selectedActivity.type}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell>
                              <Chip
                                label={selectedActivity.status}
                                color={getStatusColor(selectedActivity.status) as any}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Date & Time</strong></TableCell>
                            <TableCell>
                              {new Date(selectedActivity.timestamp).toLocaleString()}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Description</strong></TableCell>
                            <TableCell>{selectedActivity.description}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Additional Details
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableBody>
                          {Object.entries(selectedActivity.details || {}).map(([key, value]) => (
                            <TableRow key={key}>
                              <TableCell>
                                <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong>
                              </TableCell>
                              <TableCell>{String(value)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActivityDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default HistoryPage;