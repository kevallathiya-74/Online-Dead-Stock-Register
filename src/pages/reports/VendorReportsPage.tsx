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
  LinearProgress,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Assessment as ReportIcon,
  Business as VendorIcon,
  TrendingUp as PerformanceIcon,
  AttachMoney as CostIcon,
  ShoppingCart as OrderIcon,
  Star as RatingIcon,
  CheckCircle as ComplianceIcon,
  Warning as IssueIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { toast } from 'react-toastify';

interface VendorReport {
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

const VendorReportsPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [reports, setReports] = useState<VendorReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<VendorReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(),
  });

  useEffect(() => {
    loadVendorReports();
  }, []);

  const loadVendorReports = () => {
    // Demo vendor reports data
    const vendorReportsData: VendorReport[] = [
      {
        id: 'VR-001',
        name: 'Vendor Performance Dashboard',
        category: 'Performance',
        description: 'Comprehensive analysis of vendor performance metrics and KPIs',
        type: 'Analytics',
        frequency: 'Monthly',
        lastGenerated: '2024-01-20',
        parameters: ['Date Range', 'Vendor Category', 'Performance Metrics'],
        size: '4.2 MB',
        icon: <PerformanceIcon />,
      },
      {
        id: 'VR-002',
        name: 'Purchase Order Analysis',
        category: 'Procurement',
        description: 'Detailed breakdown of purchase orders by vendor and category',
        type: 'Summary',
        frequency: 'Weekly',
        lastGenerated: '2024-01-19',
        parameters: ['Date Range', 'PO Status', 'Vendor Type'],
        size: '2.8 MB',
        icon: <OrderIcon />,
      },
      {
        id: 'VR-003',
        name: 'Vendor Compliance Report',
        category: 'Compliance',
        description: 'Track vendor compliance with contracts, certifications, and standards',
        type: 'Compliance',
        frequency: 'Quarterly',
        lastGenerated: '2024-01-15',
        parameters: ['Compliance Type', 'Vendor Category', 'Status'],
        size: '1.9 MB',
        icon: <ComplianceIcon />,
      },
      {
        id: 'VR-004',
        name: 'Cost Comparison Analysis',
        category: 'Financial',
        description: 'Compare costs across vendors for similar products and services',
        type: 'Analytics',
        frequency: 'Monthly',
        lastGenerated: '2024-01-18',
        parameters: ['Product Category', 'Date Range', 'Vendor List'],
        size: '3.5 MB',
        icon: <CostIcon />,
      },
      {
        id: 'VR-005',
        name: 'Vendor Rating & Feedback',
        category: 'Quality',
        description: 'Consolidated vendor ratings and feedback from different departments',
        type: 'Summary',
        frequency: 'Monthly',
        lastGenerated: '2024-01-17',
        parameters: ['Rating Period', 'Department', 'Vendor Category'],
        size: '1.4 MB',
        icon: <RatingIcon />,
      },
      {
        id: 'VR-006',
        name: 'Issue Tracking Report',
        category: 'Quality',
        description: 'Track and analyze vendor-related issues and resolution times',
        type: 'Operational',
        frequency: 'Weekly',
        lastGenerated: '2024-01-19',
        parameters: ['Issue Type', 'Severity', 'Status'],
        size: '2.1 MB',
        icon: <IssueIcon />,
      },
      {
        id: 'VR-007',
        name: 'Vendor Onboarding Report',
        category: 'Operations',
        description: 'Status and progress of new vendor onboarding processes',
        type: 'Process',
        frequency: 'Weekly',
        lastGenerated: '2024-01-18',
        parameters: ['Onboarding Stage', 'Date Range', 'Vendor Type'],
        size: '1.6 MB',
        icon: <VendorIcon />,
      },
      {
        id: 'VR-008',
        name: 'Payment Terms Analysis',
        category: 'Financial',
        description: 'Analysis of payment terms, delays, and cash flow impact',
        type: 'Financial',
        frequency: 'Monthly',
        lastGenerated: '2024-01-16',
        parameters: ['Payment Terms', 'Vendor Category', 'Amount Range'],
        size: '2.3 MB',
        icon: <CostIcon />,
      },
    ];

    setReports(vendorReportsData);
    setFilteredReports(vendorReportsData);
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

  const handleGenerateReport = (report: VendorReport) => {
    toast.success(`Generating ${report.name}...`);
    // In real implementation, this would trigger report generation
  };

  const handleDownloadReport = (report: VendorReport) => {
    toast.info(`Downloading ${report.name}`);
    // In real implementation, this would download the report file
  };

  const handleViewReport = (report: VendorReport) => {
    toast.info(`Opening ${report.name} preview`);
    // In real implementation, this would open report preview
  };

  const getTabLabel = (index: number) => {
    switch (index) {
      case 0: return 'All Reports';
      case 1: return 'Performance & Quality';
      case 2: return 'Financial Analysis';
      case 3: return 'Compliance & Operations';
      default: return 'Reports';
    }
  };

  const getFilteredReportsByTab = () => {
    let filtered = filteredReports;
    
    switch (currentTab) {
      case 1: // Performance & Quality
        filtered = filtered.filter(report => 
          report.category === 'Performance' || report.category === 'Quality'
        );
        break;
      case 2: // Financial Analysis
        filtered = filtered.filter(report => 
          report.category === 'Financial' || report.category === 'Procurement'
        );
        break;
      case 3: // Compliance & Operations
        filtered = filtered.filter(report => 
          report.category === 'Compliance' || report.category === 'Operations'
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

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'performance': return 'success';
      case 'financial': return 'primary';
      case 'compliance': return 'warning';
      case 'quality': return 'info';
      case 'operations': return 'secondary';
      case 'procurement': return 'error';
      default: return 'default';
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Vendor Reports
          </Typography>
          <Button
            variant="contained"
            startIcon={<ReportIcon />}
            onClick={() => toast.info('Custom vendor report builder coming soon')}
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
                    <MenuItem value="Performance">Performance</MenuItem>
                    <MenuItem value="Financial">Financial</MenuItem>
                    <MenuItem value="Compliance">Compliance</MenuItem>
                    <MenuItem value="Quality">Quality</MenuItem>
                    <MenuItem value="Operations">Operations</MenuItem>
                    <MenuItem value="Procurement">Procurement</MenuItem>
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
                    No vendor reports found matching your criteria.
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
                                color={getCategoryColor(report.category) as any}
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
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="success.main">
                      {reports.filter(r => r.category === 'Performance' || r.category === 'Quality').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Performance & Quality
                    </Typography>
                  </Box>
                  <PerformanceIcon color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="primary.main">
                      {reports.filter(r => r.category === 'Financial' || r.category === 'Procurement').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Financial Analysis
                    </Typography>
                  </Box>
                  <CostIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="warning.main">
                      {reports.filter(r => r.category === 'Compliance' || r.category === 'Operations').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Compliance & Operations
                    </Typography>
                  </Box>
                  <ComplianceIcon color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Vendor Categories by Report Volume
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { category: 'Performance', count: 15, color: 'success' },
                    { category: 'Financial', count: 12, color: 'primary' },
                    { category: 'Compliance', count: 8, color: 'warning' },
                    { category: 'Quality', count: 6, color: 'info' },
                  ].map((item) => (
                    <Grid item xs={12} sm={6} md={3} key={item.category}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h5" color={`${item.color}.main`}>
                          {item.count}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.category} Reports
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(item.count / 15) * 100}
                          color={item.color as any}
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
};

export default VendorReportsPage;