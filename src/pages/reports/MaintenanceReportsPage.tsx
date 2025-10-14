import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Alert,
  TextField,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Assessment as ReportIcon,
  Build as MaintenanceIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CompletedIcon,
  AttachMoney as CostIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { toast } from 'react-toastify';

interface MaintenanceReport {
  id: string;
  name: string;
  category: string;
  description: string;
  type: string;
  frequency: string;
  lastGenerated: string;
  parameters: string[];
  size: string;
  icon: React.ReactElement;
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

const MaintenanceReportsPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [reports, setReports] = useState<MaintenanceReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<MaintenanceReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(),
  });

  useEffect(() => {
    loadMaintenanceReports();
  }, []);

  const loadMaintenanceReports = () => {
    // Demo maintenance reports data
    const maintenanceReportsData: MaintenanceReport[] = [
      {
        id: 'MR-001',
        name: 'Preventive Maintenance Schedule',
        category: 'Scheduled',
        description: 'Comprehensive list of upcoming preventive maintenance activities',
        type: 'Operational',
        frequency: 'Weekly',
        lastGenerated: '2024-01-20',
        parameters: ['Asset Category', 'Location', 'Date Range'],
        size: '2.3 MB',
        icon: <ScheduleIcon />,
      },
      {
        id: 'MR-002',
        name: 'Maintenance Cost Analysis',
        category: 'Financial',
        description: 'Breakdown of maintenance expenses by asset type and category',
        type: 'Analytics',
        frequency: 'Monthly',
        lastGenerated: '2024-01-18',
        parameters: ['Date Range', 'Asset Category', 'Cost Type'],
        size: '3.1 MB',
        icon: <CostIcon />,
      },
      {
        id: 'MR-003',
        name: 'Equipment Downtime Report',
        category: 'Performance',
        description: 'Analysis of equipment downtime and its impact on operations',
        type: 'Analytics',
        frequency: 'Weekly',
        lastGenerated: '2024-01-19',
        parameters: ['Date Range', 'Equipment Type', 'Department'],
        size: '1.8 MB',
        icon: <WarningIcon />,
      },
      {
        id: 'MR-004',
        name: 'Maintenance Completion Report',
        category: 'Performance',
        description: 'Status and completion rate of maintenance activities',
        type: 'Summary',
        frequency: 'Weekly',
        lastGenerated: '2024-01-17',
        parameters: ['Date Range', 'Maintenance Type', 'Technician'],
        size: '1.2 MB',
        icon: <CompletedIcon />,
      },
      {
        id: 'MR-005',
        name: 'Warranty Expiration Tracker',
        category: 'Compliance',
        description: 'Track assets with expiring warranties and maintenance contracts',
        type: 'Alert',
        frequency: 'Monthly',
        lastGenerated: '2024-01-15',
        parameters: ['Date Range', 'Warranty Type', 'Asset Category'],
        size: '0.8 MB',
        icon: <WarningIcon />,
      },
      {
        id: 'MR-006',
        name: 'Service Provider Performance',
        category: 'Vendor',
        description: 'Evaluation of external maintenance service providers',
        type: 'Analytics',
        frequency: 'Quarterly',
        lastGenerated: '2024-01-10',
        parameters: ['Date Range', 'Service Provider', 'Service Type'],
        size: '2.5 MB',
        icon: <ReportIcon />,
      },
    ];

    setReports(maintenanceReportsData);
    setFilteredReports(maintenanceReportsData);
  };

  useEffect(() => {
    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(report => report.category === filterCategory);
    }

    setFilteredReports(filtered);
  }, [reports, searchTerm, filterCategory]);

  const handleGenerateReport = (report: MaintenanceReport) => {
    toast.success(`Generating ${report.name}...`);
    // In real implementation, this would trigger report generation
  };

  const handleDownloadReport = (report: MaintenanceReport) => {
    toast.info(`Downloading ${report.name}`);
    // In real implementation, this would download the report file
  };

  const handleViewReport = (report: MaintenanceReport) => {
    toast.info(`Opening ${report.name} preview`);
    // In real implementation, this would open report preview
  };

  const getTabLabel = (index: number) => {
    switch (index) {
      case 0: return 'All Reports';
      case 1: return 'Scheduled Maintenance';
      case 2: return 'Cost Analysis';
      case 3: return 'Performance Metrics';
      default: return 'Reports';
    }
  };

  const getFilteredReportsByTab = () => {
    let filtered = filteredReports;
    
    switch (currentTab) {
      case 1: // Scheduled Maintenance
        filtered = filtered.filter(report => 
          report.category === 'Scheduled' || report.category === 'Compliance'
        );
        break;
      case 2: // Cost Analysis
        filtered = filtered.filter(report => report.category === 'Financial');
        break;
      case 3: // Performance Metrics
        filtered = filtered.filter(report => 
          report.category === 'Performance' || report.category === 'Vendor'
        );
        break;
      default: // All Reports
        break;
    }
    
    return filtered;
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency.toLowerCase()) {
      case 'daily': return 'error';
      case 'weekly': return 'warning';
      case 'monthly': return 'info';
      case 'quarterly': return 'success';
      default: return 'default';
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Maintenance Reports
          </Typography>
          <Button
            variant="contained"
            startIcon={<ReportIcon />}
            onClick={() => toast.info('Custom maintenance report builder coming soon')}
          >
            Create Custom Report
          </Button>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Search Reports"
                  variant="outlined"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, description, or category"
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
                    <MenuItem value="Scheduled">Scheduled</MenuItem>
                    <MenuItem value="Financial">Financial</MenuItem>
                    <MenuItem value="Performance">Performance</MenuItem>
                    <MenuItem value="Compliance">Compliance</MenuItem>
                    <MenuItem value="Vendor">Vendor</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={selectedDateRange.startDate ? selectedDateRange.startDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setSelectedDateRange(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  label="End Date"
                  type="date"
                  value={selectedDateRange.endDate ? selectedDateRange.endDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setSelectedDateRange(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            {/* Tabs */}
            <Tabs
              value={currentTab}
              onChange={(_, newValue) => setCurrentTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
              {[0, 1, 2, 3].map((index) => (
                <Tab key={index} label={getTabLabel(index)} />
              ))}
            </Tabs>

            {/* Tab Content */}
            {[0, 1, 2, 3].map((index) => (
              <TabPanel key={index} value={currentTab} index={index}>
                {getFilteredReportsByTab().length === 0 ? (
                  <Alert severity="info">
                    No maintenance reports found matching your criteria.
                  </Alert>
                ) : (
                  <TableContainer component={Paper} elevation={0}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Report Name</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Frequency</TableCell>
                          <TableCell>Last Generated</TableCell>
                          <TableCell>Size</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {getFilteredReportsByTab().map((report) => (
                          <TableRow key={report.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {report.icon}
                                <Box>
                                  <Typography variant="subtitle2" fontWeight="medium">
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
                                label={report.category}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                            </TableCell>
                            <TableCell>{report.type}</TableCell>
                            <TableCell>
                              <Chip
                                label={report.frequency}
                                size="small"
                                color={getFrequencyColor(report.frequency) as any}
                              />
                            </TableCell>
                            <TableCell>{report.lastGenerated}</TableCell>
                            <TableCell>{report.size}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="View Report">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleViewReport(report)}
                                    color="primary"
                                  >
                                    <ViewIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Download Report">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDownloadReport(report)}
                                  >
                                    <DownloadIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Generate New">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleGenerateReport(report)}
                                    color="success"
                                  >
                                    <ReportIcon />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </TabPanel>
            ))}
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="primary.main">
                      {reports.filter(r => r.category === 'Scheduled').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Scheduled Reports
                    </Typography>
                  </Box>
                  <ScheduleIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="info.main">
                      {reports.filter(r => r.category === 'Financial').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cost Analysis
                    </Typography>
                  </Box>
                  <CostIcon color="info" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="warning.main">
                      {reports.filter(r => r.category === 'Performance').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Performance Reports
                    </Typography>
                  </Box>
                  <MaintenanceIcon color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="success.main">
                      {reports.filter(r => r.category === 'Compliance').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Compliance Reports
                    </Typography>
                  </Box>
                  <CompletedIcon color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
};

export default MaintenanceReportsPage;