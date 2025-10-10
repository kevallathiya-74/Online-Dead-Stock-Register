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
  AttachMoney as CostIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { toast } from 'react-toastify';

interface MaintenanceRecord {
  id: string;
  asset_id: string;
  asset_name: string;
  type: 'Preventive' | 'Corrective' | 'Predictive' | 'Emergency';
  description: string;
  scheduled_date: string;
  completed_date?: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assigned_technician: string;
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
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [tabValue, setTabValue] = useState(0);
  const [scheduleMaintenanceOpen, setScheduleMaintenanceOpen] = useState(false);

  // Generate dynamic maintenance data
  const generateMaintenanceData = (): MaintenanceRecord[] => {
    const assetNames = [
      'Dell OptiPlex 7090', 'HP LaserJet Pro', 'Cisco Switch 2960', 'UPS APC 1500VA',
      'MacBook Pro 16"', 'Samsung Monitor 27"', 'Canon Printer MF445dw', 'Projector Epson',
      'Server Dell PowerEdge', 'Router Netgear Pro', 'Laptop Lenovo ThinkPad', 'Tablet iPad Air',
      'Phone System Avaya', 'Scanner Fujitsu', 'Workstation HP Z4', 'NAS Synology DS920+',
    ];

    const types: ('Preventive' | 'Corrective' | 'Predictive' | 'Emergency')[] = 
      ['Preventive', 'Corrective', 'Predictive', 'Emergency'];
    const statuses: ('Scheduled' | 'In Progress' | 'Completed' | 'Overdue' | 'Cancelled')[] = 
      ['Scheduled', 'In Progress', 'Completed', 'Overdue', 'Cancelled'];
    const priorities: ('Low' | 'Medium' | 'High' | 'Critical')[] = ['Low', 'Medium', 'High', 'Critical'];
    const downtime: ('Low' | 'Medium' | 'High')[] = ['Low', 'Medium', 'High'];
    
    const technicians = ['Rajesh Kumar', 'Priya Singh', 'Amit Sharma', 'Neha Patel', 'Vikram Joshi'];

    return Array.from({ length: 50 }, (_, index) => {
      const scheduledDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const isCompleted = status === 'Completed';
      
      return {
        id: `MNT-${(index + 1).toString().padStart(4, '0')}`,
        asset_id: `AST-${Math.floor(Math.random() * 500) + 1}`,
        asset_name: assetNames[index % assetNames.length],
        type: types[Math.floor(Math.random() * types.length)],
        description: [
          'Regular cleaning and inspection',
          'Hardware component replacement',
          'Software update and configuration',
          'Performance optimization',
          'Security patch installation',
          'Calibration and testing',
          'Filter replacement',
          'Cooling system maintenance',
          'Network connectivity check',
          'Backup system verification',
        ][Math.floor(Math.random() * 10)],
        scheduled_date: scheduledDate.toISOString().split('T')[0],
        completed_date: isCompleted ? 
          new Date(scheduledDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
          undefined,
        status,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        assigned_technician: technicians[Math.floor(Math.random() * technicians.length)],
        estimated_cost: Math.floor(Math.random() * 50000) + 5000,
        actual_cost: isCompleted ? Math.floor(Math.random() * 60000) + 4000 : undefined,
        estimated_duration: Math.floor(Math.random() * 8) + 1,
        actual_duration: isCompleted ? Math.floor(Math.random() * 10) + 1 : undefined,
        next_maintenance_date: isCompleted ? 
          new Date(scheduledDate.getTime() + (90 + Math.random() * 180) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
          undefined,
        notes: Math.random() > 0.5 ? 'Additional notes and observations' : undefined,
        downtime_impact: downtime[Math.floor(Math.random() * downtime.length)],
      };
    });
  };

  const generateTechnicianData = (): Technician[] => {
    const techNames = ['Rajesh Kumar', 'Priya Singh', 'Amit Sharma', 'Neha Patel', 'Vikram Joshi'];
    const specializations = [
      ['Hardware', 'Networking', 'Servers'],
      ['Software', 'OS', 'Applications'],
      ['Electronics', 'Components', 'Repair'],
      ['IT Support', 'Troubleshooting', 'Maintenance'],
      ['Systems', 'Infrastructure', 'Security'],
    ];

    return techNames.map((name, index) => ({
      id: `TCH-${(index + 1).toString().padStart(3, '0')}`,
      name,
      specialization: specializations[index],
      current_workload: Math.floor(Math.random() * 10) + 1,
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
      total_completed: Math.floor(Math.random() * 200) + 50,
    }));
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const maintenanceData = generateMaintenanceData();
        const technicianData = generateTechnicianData();
        setMaintenanceRecords(maintenanceData);
        setTechnicians(technicianData);
      } catch (error) {
        toast.error('Failed to load maintenance data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredRecords = maintenanceRecords.filter((record) => {
    const matchesSearch = 
      record.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.assigned_technician.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || record.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || record.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || record.priority === selectedPriority;
    
    return matchesSearch && matchesType && matchesStatus && matchesPriority;
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

            {/* Maintenance Records Table */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Maintenance Schedule ({filteredRecords.length})
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
                              <IconButton size="small" color="primary">
                                <ViewIcon />
                              </IconButton>
                              <IconButton size="small" color="success">
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
        <Dialog open={scheduleMaintenanceOpen} onClose={() => setScheduleMaintenanceOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Schedule New Maintenance</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Maintenance scheduling form would be implemented here with asset selection, technician assignment, and scheduling options.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setScheduleMaintenanceOpen(false)}>Cancel</Button>
            <Button variant="contained">Schedule</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default MaintenancePage;