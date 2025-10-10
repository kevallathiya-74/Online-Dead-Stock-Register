import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Tooltip,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Assessment as ReportIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TableChart as TableIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  PlayArrow as RunIcon
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { toast } from 'react-toastify';

interface Report {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'table' | 'chart' | 'dashboard';
  lastRun: string;
  createdBy: string;
  status: 'Active' | 'Draft' | 'Scheduled';
  frequency: string;
  recipients: string[];
  fileFormat: string;
  parameters: any;
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
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminReportsPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [reports, setReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [createDialog, setCreateDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [runProgress, setRunProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      // Mock reports data
      const mockReports: Report[] = [
        {
          id: '1',
          name: 'Asset Utilization Report',
          description: 'Comprehensive analysis of asset usage across departments',
          category: 'Assets',
          type: 'table',
          lastRun: '2024-01-20T10:30:00Z',
          createdBy: 'John Smith',
          status: 'Active',
          frequency: 'Weekly',
          recipients: ['admin@company.com', 'manager@company.com'],
          fileFormat: 'PDF',
          parameters: { dateRange: '30days', includeInactive: false }
        },
        {
          id: '2',
          name: 'Financial Summary Dashboard',
          description: 'Monthly financial overview with cost analysis',
          category: 'Financial',
          type: 'dashboard',
          lastRun: '2024-01-19T08:00:00Z',
          createdBy: 'Jane Doe',
          status: 'Active',
          frequency: 'Monthly',
          recipients: ['finance@company.com'],
          fileFormat: 'Excel',
          parameters: { currency: 'USD', includeForecast: true }
        },
        {
          id: '3',
          name: 'User Activity Analysis',
          description: 'Track user engagement and system usage patterns',
          category: 'Users',
          type: 'chart',
          lastRun: '2024-01-18T14:15:00Z',
          createdBy: 'Mike Johnson',
          status: 'Scheduled',
          frequency: 'Daily',
          recipients: ['hr@company.com'],
          fileFormat: 'CSV',
          parameters: { timeframe: 'weekly', activeOnly: true }
        },
        {
          id: '4',
          name: 'Inventory Status Report',
          description: 'Current inventory levels and reorder recommendations',
          category: 'Inventory',
          type: 'table',
          lastRun: '2024-01-17T16:45:00Z',
          createdBy: 'Sarah Wilson',
          status: 'Draft',
          frequency: 'On-demand',
          recipients: ['inventory@company.com'],
          fileFormat: 'PDF',
          parameters: { warehouse: 'all', lowStockAlert: true }
        },
        {
          id: '5',
          name: 'Performance Metrics',
          description: 'KPI dashboard with trending and comparisons',
          category: 'Analytics',
          type: 'dashboard',
          lastRun: '2024-01-16T09:20:00Z',
          createdBy: 'David Brown',
          status: 'Active',
          frequency: 'Weekly',
          recipients: ['executives@company.com'],
          fileFormat: 'Interactive',
          parameters: { metrics: ['efficiency', 'costs', 'satisfaction'] }
        }
      ];
      
      setReports(mockReports);
    } catch (error) {
      toast.error('Failed to load reports');
    }
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'table': return <TableIcon color="primary" />;
      case 'chart': return <BarChartIcon color="success" />;
      case 'dashboard': return <PieChartIcon color="warning" />;
      default: return <ReportIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Scheduled': return 'info';
      case 'Draft': return 'warning';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Assets': return <InventoryIcon />;
      case 'Financial': return <MoneyIcon />;
      case 'Users': return <PeopleIcon />;
      case 'Analytics': return <TrendingUpIcon />;
      default: return <ReportIcon />;
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || report.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const runReport = async (report: Report) => {
    setSelectedReport(report);
    setIsRunning(true);
    setRunProgress(0);

    // Simulate report generation
    const interval = setInterval(() => {
      setRunProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          setSelectedReport(null);
          toast.success(`${report.name} generated successfully!`);
          return 100;
        }
        return prev + 20;
      });
    }, 500);
  };

  const reportsByCategory = [
    { category: 'Assets', count: reports.filter(r => r.category === 'Assets').length },
    { category: 'Financial', count: reports.filter(r => r.category === 'Financial').length },
    { category: 'Users', count: reports.filter(r => r.category === 'Users').length },
    { category: 'Inventory', count: reports.filter(r => r.category === 'Inventory').length },
    { category: 'Analytics', count: reports.filter(r => r.category === 'Analytics').length },
  ];

  return (
    <DashboardLayout>
      <Box sx={{ flexGrow: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Reports
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Generate, manage, and schedule automated reports
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialog(true)}
          >
            Create Report
          </Button>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <ReportIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4">{reports.length}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Reports
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <RunIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4">
                      {reports.filter(r => r.status === 'Active').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Reports
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <ScheduleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4">
                      {reports.filter(r => r.frequency !== 'On-demand').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Scheduled Reports
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <FilterIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4">{reportsByCategory.length}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Categories
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card sx={{ mb: 3 }}>
          <Tabs 
            value={currentTab} 
            onChange={(e, newValue) => setCurrentTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="All Reports" />
            <Tab label="By Category" />
            <Tab label="Scheduled Reports" />
          </Tabs>
        </Card>

        {/* Tab Panels */}
        <TabPanel value={currentTab} index={0}>
          {/* Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Search reports..."
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
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={filterCategory}
                      label="Category"
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      <MenuItem value="all">All Categories</MenuItem>
                      <MenuItem value="Assets">Assets</MenuItem>
                      <MenuItem value="Financial">Financial</MenuItem>
                      <MenuItem value="Users">Users</MenuItem>
                      <MenuItem value="Inventory">Inventory</MenuItem>
                      <MenuItem value="Analytics">Analytics</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={loadReports}
                    fullWidth
                  >
                    Refresh
                  </Button>
                </Grid>
                
                <Grid item xs={12} md={2}>
                  <Typography variant="body2" color="text.secondary">
                    {filteredReports.length} of {reports.length} reports
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Reports Table */}
          <Card>
            <CardContent sx={{ p: 0 }}>
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Report</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Frequency</TableCell>
                      <TableCell>Last Run</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <TableRow key={report.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {getReportIcon(report.type)}
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {report.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {report.description}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            icon={getCategoryIcon(report.category)}
                            label={report.category} 
                            size="small" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>
                          {report.type}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={report.status} 
                            size="small" 
                            color={getStatusColor(report.status) as any}
                          />
                        </TableCell>
                        <TableCell>{report.frequency}</TableCell>
                        <TableCell>
                          {new Date(report.lastRun).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Run Report">
                            <IconButton 
                              size="small"
                              onClick={() => runReport(report)}
                              disabled={isRunning}
                            >
                              <RunIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download">
                            <IconButton size="small">
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <Grid container spacing={3}>
            {reportsByCategory.map((cat) => (
              <Grid item xs={12} sm={6} md={4} key={cat.category}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      {getCategoryIcon(cat.category)}
                      <Typography variant="h6">{cat.category}</Typography>
                    </Box>
                    <Typography variant="h4" sx={{ mb: 1 }}>{cat.count}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Reports available
                    </Typography>
                    <Button 
                      size="small" 
                      sx={{ mt: 2 }}
                      onClick={() => {
                        setFilterCategory(cat.category.toLowerCase());
                        setCurrentTab(0);
                      }}
                    >
                      View Reports
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <List>
            {reports.filter(r => r.frequency !== 'On-demand').map((report) => (
              <Box key={report.id}>
                <ListItem>
                  <ListItemIcon>
                    {getReportIcon(report.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={report.name}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {report.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Runs {report.frequency} • Last: {new Date(report.lastRun).toLocaleDateString()} • 
                          Recipients: {report.recipients.length}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip 
                      label={report.frequency} 
                      size="small" 
                      color="primary" 
                    />
                    <IconButton 
                      size="small"
                      onClick={() => runReport(report)}
                      disabled={isRunning}
                    >
                      <RunIcon />
                    </IconButton>
                  </Box>
                </ListItem>
                <Divider />
              </Box>
            ))}
          </List>
        </TabPanel>

        {/* Progress Dialog */}
        <Dialog open={isRunning} maxWidth="sm" fullWidth>
          <DialogTitle>
            Generating Report
          </DialogTitle>
          <DialogContent>
            <Box sx={{ py: 2 }}>
              <Typography variant="body1" gutterBottom>
                {selectedReport?.name}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={runProgress} 
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                Progress: {runProgress}%
              </Typography>
            </Box>
          </DialogContent>
        </Dialog>

        {/* Create Report Dialog */}
        <Dialog 
          open={createDialog} 
          onClose={() => setCreateDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Create New Report</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              This feature allows you to create custom reports with various data sources and formats.
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Report creation wizard will be implemented here with:
            </Typography>
            <List dense>
              <ListItem>• Data source selection</ListItem>
              <ListItem>• Field configuration</ListItem>
              <ListItem>• Filtering options</ListItem>
              <ListItem>• Output format selection</ListItem>
              <ListItem>• Scheduling configuration</ListItem>
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="contained"
              onClick={() => {
                toast.success('Report creation wizard will be available soon!');
                setCreateDialog(false);
              }}
            >
              Continue
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default AdminReportsPage;