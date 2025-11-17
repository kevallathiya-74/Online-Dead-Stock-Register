import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  Tabs,
  Tab,
  Badge,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Build as MaintenanceIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CompletedIcon,
  Engineering as TechnicianIcon,
  Assignment as TaskIcon,
  Timeline as TimelineIcon,
  Notifications as NotificationIcon,
  CurrencyRupee as CostIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import MaintenanceModal from '../../components/modals/MaintenanceModal';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { usePolling } from '../../hooks/usePolling';
import { useAuth } from '../../context/AuthContext';

interface MaintenanceRecord {
  id: string;
  asset_id: string;
  asset_name: string;
  type: 'Preventive' | 'Corrective' | 'Predictive' | 'Emergency' | 'Inspection' | 'Calibration' | 'Cleaning';
  description: string;
  scheduled_date: string; // This is from backend transformation (maintenance_date)
  completed_date?: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assigned_technician: string; // This is from backend transformation (performed_by)
  estimated_cost: number;
  actual_cost?: number;
  estimated_duration: number; // in hours
  actual_duration?: number;
  next_maintenance_date?: string;
  notes?: string;
  downtime_impact: 'Low' | 'Medium' | 'High';
}

interface Technician {
  id: string;
  name: string;
  specialization: string[];
  current_workload: number;
  rating: number;
  total_completed: number;
}

const MaintenancePage = () => {
  const { user } = useAuth();
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [tabValue, setTabValue] = useState(0);
  const [scheduleMaintenanceOpen, setScheduleMaintenanceOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);

  const loadData = async () => {
    try {
      const [maintenanceResponse, techniciansResponse] = await Promise.all([
        api.get('/maintenance'),
        api.get('/maintenance/technicians').catch(() => ({ data: { data: [] } }))
      ]);
      
      const maintenanceData = maintenanceResponse.data.data || maintenanceResponse.data;
      const technicianData = techniciansResponse.data.data || techniciansResponse.data;
      
      setMaintenanceRecords(Array.isArray(maintenanceData) ? maintenanceData : []);
      setTechnicians(Array.isArray(technicianData) ? technicianData : []);
    } catch (error) {
      console.error('Failed to load maintenance data:', error);
      toast.error('Failed to load maintenance data');
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    };
    loadInitialData();
  }, []);

  // Real-time polling every 30 seconds
  usePolling(async () => {
    await loadData();
  }, 30000, true);

  const filteredRecords = maintenanceRecords.filter((record) => {
    const matchesSearch = 
      record.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.assigned_technician.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || record.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || record.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || record.priority === selectedPriority;
    
    // Tab-based filtering
    let matchesTab = true;
    if (tabValue === 1) { // My Tasks
      const currentUserName = user?.full_name || user?.name || '';
      matchesTab = record.assigned_technician === currentUserName;
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesPriority && matchesTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'info';
      case 'Scheduled':
        return 'default';
      case 'Overdue':
        return 'error';
      case 'Cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'error';
      case 'High':
        return 'warning';
      case 'Medium':
        return 'info';
      case 'Low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Preventive':
        return <ScheduleIcon />;
      case 'Corrective':
        return <MaintenanceIcon />;
      case 'Predictive':
        return <TimelineIcon />;
      case 'Emergency':
        return <WarningIcon />;
      default:
        return <TaskIcon />;
    }
  };

  const stats = {
    totalRecords: maintenanceRecords.length,
    scheduled: maintenanceRecords.filter(r => r.status === 'Scheduled').length,
    inProgress: maintenanceRecords.filter(r => r.status === 'In Progress').length,
    overdue: maintenanceRecords.filter(r => r.status === 'Overdue').length,
    completed: maintenanceRecords.filter(r => r.status === 'Completed').length,
    totalCost: maintenanceRecords.reduce((sum, record) => sum + (record.actual_cost || record.estimated_cost), 0),
    avgDuration: maintenanceRecords.length > 0 ? 
      maintenanceRecords.reduce((sum, record) => sum + (record.actual_duration || record.estimated_duration), 0) / maintenanceRecords.length : 0,
  };

  const upcomingMaintenance = maintenanceRecords
    .filter(r => r.status === 'Scheduled' && new Date(r.scheduled_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
    .slice(0, 5);

  const handleViewRecord = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };

  const handleEditRecord = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
    setEditDialogOpen(true);
  };

  const handleUpdateStatus = async (recordId: string, newStatus: string) => {
    try {
      await api.put(`/maintenance/${recordId}`, { status: newStatus });
      await loadData(); // Reload data instead of making another GET call
      toast.success('Maintenance status updated successfully');
      setEditDialogOpen(false);
      setSelectedRecord(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update maintenance status');
    }
  };

  const handleMaintenanceScheduled = async () => {
    await loadData(); // Reload data after scheduling new maintenance
    setScheduleMaintenanceOpen(false);
  };

  return (
    <DashboardLayout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Maintenance Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Schedule, track, and manage asset maintenance activities
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setScheduleMaintenanceOpen(true)}
          >
            Schedule Maintenance
          </Button>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Total
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={40} height={32} />
                    ) : (
                      <Typography variant="h5">{stats.totalRecords}</Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'primary.main' }}>
                    <TaskIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Scheduled
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={40} height={32} />
                    ) : (
                      <Typography variant="h5">{stats.scheduled}</Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'info.main' }}>
                    <ScheduleIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      In Progress
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={40} height={32} />
                    ) : (
                      <Typography variant="h5">{stats.inProgress}</Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'warning.main' }}>
                    <MaintenanceIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Overdue
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={40} height={32} />
                    ) : (
                      <Badge badgeContent={stats.overdue} color="error">
                        <Typography variant="h5">{stats.overdue}</Typography>
                      </Badge>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'error.main' }}>
                    <WarningIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Completed
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={40} height={32} />
                    ) : (
                      <Typography variant="h5">{stats.completed}</Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'success.main' }}>
                    <CompletedIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Total Cost
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={60} height={32} />
                    ) : (
                      <Typography variant="h6">₹{(stats.totalCost / 100000).toFixed(1)}L</Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'secondary.main' }}>
                    <CostIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            {/* Tabs */}
            <Card sx={{ mb: 3 }}>
              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="All Maintenance" />
                <Tab label="My Tasks" />
                <Tab label="Calendar View" />
                <Tab label="Reports" />
              </Tabs>
            </Card>

            {/* Filters */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Search maintenance records..."
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
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth>
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={selectedType}
                        label="Type"
                        onChange={(e) => setSelectedType(e.target.value)}
                      >
                        <MenuItem value="all">All Types</MenuItem>
                        <MenuItem value="Preventive">Preventive</MenuItem>
                        <MenuItem value="Corrective">Corrective</MenuItem>
                        <MenuItem value="Predictive">Predictive</MenuItem>
                        <MenuItem value="Emergency">Emergency</MenuItem>
                        <MenuItem value="Inspection">Inspection</MenuItem>
                        <MenuItem value="Calibration">Calibration</MenuItem>
                        <MenuItem value="Cleaning">Cleaning</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={selectedStatus}
                        label="Status"
                        onChange={(e) => setSelectedStatus(e.target.value)}
                      >
                        <MenuItem value="all">All Status</MenuItem>
                        <MenuItem value="Scheduled">Scheduled</MenuItem>
                        <MenuItem value="In Progress">In Progress</MenuItem>
                        <MenuItem value="Completed">Completed</MenuItem>
                        <MenuItem value="Overdue">Overdue</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        value={selectedPriority}
                        label="Priority"
                        onChange={(e) => setSelectedPriority(e.target.value)}
                      >
                        <MenuItem value="all">All Priority</MenuItem>
                        <MenuItem value="Critical">Critical</MenuItem>
                        <MenuItem value="High">High</MenuItem>
                        <MenuItem value="Medium">Medium</MenuItem>
                        <MenuItem value="Low">Low</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Typography variant="body2" color="text.secondary">
                      {filteredRecords.length} records
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Tab Content */}
            {tabValue === 0 || tabValue === 1 ? (
              // All Maintenance & My Tasks Tab
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {tabValue === 0 ? 'Maintenance Schedule' : 'My Assigned Tasks'} ({filteredRecords.length})
                  </Typography>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Asset</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Technician</TableCell>
                        <TableCell>Scheduled Date</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Cost</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        [1, 2, 3, 4, 5].map((item) => (
                          <TableRow key={item}>
                            <TableCell><Skeleton variant="text" width={150} /></TableCell>
                            <TableCell><Skeleton variant="text" width={100} /></TableCell>
                            <TableCell><Skeleton variant="rectangular" width={80} height={24} /></TableCell>
                            <TableCell><Skeleton variant="rectangular" width={80} height={24} /></TableCell>
                            <TableCell><Skeleton variant="text" width={120} /></TableCell>
                            <TableCell><Skeleton variant="text" width={100} /></TableCell>
                            <TableCell><Skeleton variant="text" width={80} /></TableCell>
                            <TableCell><Skeleton variant="text" width={80} /></TableCell>
                            <TableCell><Skeleton variant="text" width={100} /></TableCell>
                          </TableRow>
                        ))
                      ) : filteredRecords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9}>
                            <Box sx={{ p: 4, textAlign: 'center' }}>
                              <TaskIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                              <Typography variant="h6" gutterBottom>
                                {tabValue === 1 ? 'No tasks assigned to you' : 'No maintenance records found'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {tabValue === 1 
                                  ? 'You have no maintenance tasks assigned at the moment.'
                                  : searchTerm || selectedType !== 'all' || selectedStatus !== 'all' || selectedPriority !== 'all'
                                  ? 'Try adjusting your filters to see more results.'
                                  : 'Click "Schedule Maintenance" to create your first maintenance task.'}
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRecords.slice(0, 10).map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                                  {record.asset_name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {record.id} • {record.asset_id}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getTypeIcon(record.type)}
                                <Typography variant="body2">{record.type}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={record.status}
                                color={getStatusColor(record.status) as any}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={record.priority}
                                color={getPriorityColor(record.priority) as any}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                  {record.assigned_technician.charAt(0)}
                                </Avatar>
                                <Typography variant="body2">{record.assigned_technician}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {new Date(record.scheduled_date).toLocaleDateString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {record.actual_duration || record.estimated_duration}h
                                {record.actual_duration && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    Est: {record.estimated_duration}h
                                  </Typography>
                                )}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                ₹{((record.actual_cost || record.estimated_cost) / 1000).toFixed(1)}K
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <IconButton size="small" color="primary" onClick={() => handleViewRecord(record)}>
                                <ViewIcon />
                              </IconButton>
                              <IconButton size="small" color="success" onClick={() => handleEditRecord(record)}>
                                <EditIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
            ) : tabValue === 2 ? (
              // Calendar View Tab
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Calendar View
                  </Typography>
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <ScheduleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Calendar View Coming Soon
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      View maintenance schedule in a calendar format with drag-and-drop functionality.
                    </Typography>
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="body2" gutterBottom>
                        <strong>Upcoming Maintenance:</strong>
                      </Typography>
                      {upcomingMaintenance.map((record) => (
                        <Chip
                          key={record.id}
                          label={`${record.asset_name} - ${new Date(record.scheduled_date).toLocaleDateString()}`}
                          sx={{ m: 0.5 }}
                          onClick={() => handleViewRecord(record)}
                        />
                      ))}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              // Reports Tab
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Maintenance Reports
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            <TimelineIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                            Maintenance Trends
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            View maintenance frequency and cost trends over time
                          </Typography>
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="h4">{stats.totalRecords}</Typography>
                            <Typography variant="caption" color="text.secondary">Total Records</Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            <TechnicianIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                            Technician Performance
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Compare technician efficiency and completion rates
                          </Typography>
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="h4">{stats.completed}</Typography>
                            <Typography variant="caption" color="text.secondary">Completed Tasks</Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            <CostIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                            Cost Analysis
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Breakdown of maintenance costs by asset type and department
                          </Typography>
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="h4">₹{(stats.totalCost / 100000).toFixed(1)}L</Typography>
                            <Typography variant="caption" color="text.secondary">Total Cost</Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            <WarningIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                            Overdue Tasks
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Track overdue maintenance tasks and their impact
                          </Typography>
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="h4" color="error">{stats.overdue}</Typography>
                            <Typography variant="caption" color="text.secondary">Overdue Items</Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Grid>

          <Grid item xs={12} lg={4}>
            {/* Upcoming Maintenance */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotificationIcon />
                  Upcoming This Week
                </Typography>
                {loading ? (
                  [1, 2, 3].map((item) => (
                    <Box key={item} sx={{ mb: 2 }}>
                      <Skeleton variant="text" width="100%" />
                      <Skeleton variant="text" width="80%" />
                    </Box>
                  ))
                ) : upcomingMaintenance.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <NotificationIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No maintenance scheduled for this week
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {upcomingMaintenance.map((record, index) => (
                      <React.Fragment key={record.id}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: getPriorityColor(record.priority) + '.main' }}>
                              {getTypeIcon(record.type)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={record.asset_name}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {record.description}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(record.scheduled_date).toLocaleDateString()} • {record.assigned_technician}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < upcomingMaintenance.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>

            {/* Technicians Workload */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TechnicianIcon />
                  Technician Workload
                </Typography>
                {loading ? (
                  [1, 2, 3].map((item) => (
                    <Box key={item} sx={{ mb: 2 }}>
                      <Skeleton variant="text" width="100%" />
                      <Skeleton variant="rectangular" height={6} />
                    </Box>
                  ))
                ) : technicians.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <TechnicianIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No technicians available
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    {technicians.map((tech) => (
                      <Box key={tech.id} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2">{tech.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {tech.current_workload} tasks
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min((tech.current_workload / 15) * 100, 100)}
                          color={tech.current_workload > 10 ? 'error' : tech.current_workload > 5 ? 'warning' : 'success'}
                          sx={{ height: 6, borderRadius: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {tech.specialization.join(', ')} • ⭐ {tech.rating}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Schedule Maintenance Dialog */}
        <MaintenanceModal
          open={scheduleMaintenanceOpen}
          onClose={() => setScheduleMaintenanceOpen(false)}
          onSubmit={handleMaintenanceScheduled}
        />

        {/* View Details Dialog */}
        <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Typography variant="h6">Maintenance Record Details</Typography>
          </DialogTitle>
          <DialogContent>
            {selectedRecord && (
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Asset Name</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>{selectedRecord.asset_name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Asset ID</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>{selectedRecord.asset_id}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Maintenance Type</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      {getTypeIcon(selectedRecord.type)}
                      <Typography variant="body1">{selectedRecord.type}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    <Chip
                      label={selectedRecord.status}
                      color={getStatusColor(selectedRecord.status) as any}
                      size="small"
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                    <Chip
                      label={selectedRecord.priority}
                      color={getPriorityColor(selectedRecord.priority) as any}
                      size="small"
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Assigned Technician</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>{selectedRecord.assigned_technician}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Scheduled Date</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {new Date(selectedRecord.scheduled_date).toLocaleString()}
                    </Typography>
                  </Grid>
                  {selectedRecord.completed_date && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Completed Date</Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {new Date(selectedRecord.completed_date).toLocaleString()}
                      </Typography>
                    </Grid>
                  )}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Estimated Duration</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>{selectedRecord.estimated_duration} hours</Typography>
                  </Grid>
                  {selectedRecord.actual_duration && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Actual Duration</Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>{selectedRecord.actual_duration} hours</Typography>
                    </Grid>
                  )}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Estimated Cost</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>₹{selectedRecord.estimated_cost.toLocaleString()}</Typography>
                  </Grid>
                  {selectedRecord.actual_cost && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Actual Cost</Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>₹{selectedRecord.actual_cost.toLocaleString()}</Typography>
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>{selectedRecord.description}</Typography>
                  </Grid>
                  {selectedRecord.notes && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>{selectedRecord.notes}</Typography>
                    </Grid>
                  )}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Downtime Impact</Typography>
                    <Chip
                      label={selectedRecord.downtime_impact}
                      color={selectedRecord.downtime_impact === 'High' ? 'error' : selectedRecord.downtime_impact === 'Medium' ? 'warning' : 'success'}
                      size="small"
                    />
                  </Grid>
                  {selectedRecord.next_maintenance_date && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Next Maintenance</Typography>
                      <Typography variant="body1">
                        {new Date(selectedRecord.next_maintenance_date).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Status Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Typography variant="h6">Update Maintenance Status</Typography>
          </DialogTitle>
          <DialogContent>
            {selectedRecord && (
              <Box sx={{ pt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Asset: {selectedRecord.asset_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Current Status: {selectedRecord.status}
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Update Status
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                  <Button
                    variant="outlined"
                    color="info"
                    onClick={() => handleUpdateStatus(selectedRecord.id, 'In Progress')}
                    disabled={selectedRecord.status === 'In Progress'}
                    fullWidth
                  >
                    Mark as In Progress
                  </Button>
                  <Button
                    variant="outlined"
                    color="success"
                    onClick={() => handleUpdateStatus(selectedRecord.id, 'Completed')}
                    disabled={selectedRecord.status === 'Completed'}
                    fullWidth
                  >
                    Mark as Completed
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleUpdateStatus(selectedRecord.id, 'Cancelled')}
                    disabled={selectedRecord.status === 'Cancelled'}
                    fullWidth
                  >
                    Cancel Maintenance
                  </Button>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default MaintenancePage;