import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Assessment as ReportIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as ComplianceIcon,
  AttachMoney as FinancialIcon,
  Schedule as ScheduleIcon,
  Visibility as ViewIcon,
  GetApp as DownloadIcon,
  Print as PrintIcon,
  PieChart as ChartIcon,
  Security as SecurityIcon,
  Assignment as TaskIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { toast } from 'react-toastify';

interface AuditReport {
  id: string;
  title: string;
  type: 'compliance' | 'financial' | 'operational' | 'security';
  status: 'completed' | 'in_progress' | 'scheduled' | 'overdue';
  created_date: string;
  completion_date?: string;
  auditor: string;
  findings: number;
  recommendations: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  compliance_score: number;
}

interface ComplianceItem {
  id: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_assessed';
  last_review: string;
  next_review: string;
  responsible_party: string;
  notes?: string;
}

interface FinancialAuditItem {
  id: string;
  category: string;
  budgeted_amount: number;
  actual_amount: number;
  variance: number;
  variance_percentage: number;
  status: 'within_budget' | 'over_budget' | 'under_budget';
  notes?: string;
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

const AuditorReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [auditReports, setAuditReports] = useState<AuditReport[]>([]);
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [financialItems, setFinancialItems] = useState<FinancialAuditItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<AuditReport | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      
      // Demo audit reports data
      const reportsData: AuditReport[] = [
        {
          id: '1',
          title: 'Q4 2023 Asset Compliance Audit',
          type: 'compliance',
          status: 'completed',
          created_date: '2023-12-01',
          completion_date: '2023-12-15',
          auditor: 'Current User',
          findings: 12,
          recommendations: 8,
          priority: 'high',
          compliance_score: 85,
        },
        {
          id: '2',
          title: 'Financial Asset Valuation Review',
          type: 'financial',
          status: 'in_progress',
          created_date: '2024-01-05',
          auditor: 'Current User',
          findings: 5,
          recommendations: 3,
          priority: 'medium',
          compliance_score: 92,
        },
        {
          id: '3',
          title: 'IT Security Assets Assessment',
          type: 'security',
          status: 'scheduled',
          created_date: '2024-01-20',
          auditor: 'Sarah Wilson',
          findings: 0,
          recommendations: 0,
          priority: 'critical',
          compliance_score: 0,
        },
        {
          id: '4',
          title: 'Operational Efficiency Review',
          type: 'operational',
          status: 'overdue',
          created_date: '2023-11-15',
          auditor: 'Mike Johnson',
          findings: 18,
          recommendations: 12,
          priority: 'high',
          compliance_score: 78,
        },
        {
          id: '5',
          title: 'Annual Compliance Assessment',
          type: 'compliance',
          status: 'completed',
          created_date: '2023-12-20',
          completion_date: '2024-01-10',
          auditor: 'Current User',
          findings: 6,
          recommendations: 4,
          priority: 'medium',
          compliance_score: 94,
        },
      ];

      // Demo compliance data
      const complianceData: ComplianceItem[] = [
        {
          id: '1',
          requirement: 'ISO 27001 Information Security Management',
          status: 'compliant',
          last_review: '2023-12-15',
          next_review: '2024-06-15',
          responsible_party: 'IT Security Team',
          notes: 'All security controls in place and functioning',
        },
        {
          id: '2',
          requirement: 'GDPR Data Protection Compliance',
          status: 'partial',
          last_review: '2023-11-20',
          next_review: '2024-05-20',
          responsible_party: 'Legal Department',
          notes: 'Some data processing agreements require updates',
        },
        {
          id: '3',
          requirement: 'Financial Reporting Standards (IFRS)',
          status: 'compliant',
          last_review: '2024-01-05',
          next_review: '2024-07-05',
          responsible_party: 'Finance Team',
        },
        {
          id: '4',
          requirement: 'Environmental Safety Regulations',
          status: 'non_compliant',
          last_review: '2023-10-10',
          next_review: '2024-04-10',
          responsible_party: 'Facilities Management',
          notes: 'Asset disposal procedures need immediate attention',
        },
        {
          id: '5',
          requirement: 'Internal Audit Standards (IIA)',
          status: 'compliant',
          last_review: '2023-12-01',
          next_review: '2024-12-01',
          responsible_party: 'Internal Audit Team',
        },
      ];

      // Demo financial audit data
      const financialData: FinancialAuditItem[] = [
        {
          id: '1',
          category: 'IT Equipment',
          budgeted_amount: 500000,
          actual_amount: 485000,
          variance: -15000,
          variance_percentage: -3.0,
          status: 'under_budget',
          notes: 'Favorable variance due to bulk purchase discounts',
        },
        {
          id: '2',
          category: 'Office Furniture',
          budgeted_amount: 100000,
          actual_amount: 115000,
          variance: 15000,
          variance_percentage: 15.0,
          status: 'over_budget',
          notes: 'Additional expenses for ergonomic workstations',
        },
        {
          id: '3',
          category: 'Vehicles',
          budgeted_amount: 200000,
          actual_amount: 195000,
          variance: -5000,
          variance_percentage: -2.5,
          status: 'under_budget',
        },
        {
          id: '4',
          category: 'Manufacturing Equipment',
          budgeted_amount: 800000,
          actual_amount: 820000,
          variance: 20000,
          variance_percentage: 2.5,
          status: 'over_budget',
          notes: 'Increased costs due to supply chain disruptions',
        },
        {
          id: '5',
          category: 'Software Licenses',
          budgeted_amount: 150000,
          actual_amount: 145000,
          variance: -5000,
          variance_percentage: -3.3,
          status: 'under_budget',
        },
      ];

      setAuditReports(reportsData);
      setComplianceItems(complianceData);
      setFinancialItems(financialData);
    } catch (error) {
      toast.error('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = auditReports.filter(report => {
    const matchesType = filterType === 'all' || report.type === filterType;
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesDateRange = (!dateFrom || report.created_date >= dateFrom) &&
                            (!dateTo || report.created_date <= dateTo);
    
    return matchesType && matchesStatus && matchesDateRange;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'scheduled': return 'warning';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'compliance': return <ComplianceIcon />;
      case 'financial': return <FinancialIcon />;
      case 'operational': return <ReportIcon />;
      case 'security': return <SecurityIcon />;
      default: return <TaskIcon />;
    }
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'success';
      case 'partial': return 'warning';
      case 'non_compliant': return 'error';
      case 'not_assessed': return 'default';
      default: return 'default';
    }
  };

  const getBudgetStatusColor = (status: string) => {
    switch (status) {
      case 'within_budget': return 'success';
      case 'under_budget': return 'info';
      case 'over_budget': return 'error';
      default: return 'default';
    }
  };

  const handleViewReport = (report: AuditReport) => {
    setSelectedReport(report);
    setReportDialogOpen(true);
  };

  const handleDownloadReport = (report: AuditReport) => {
    toast.success(`Downloading ${report.title}`);
  };

  const handlePrintReport = (report: AuditReport) => {
    toast.success(`Printing ${report.title}`);
  };

  const handleGenerateReport = () => {
    toast.success('New audit report generation started');
  };

  const reportStats = {
    totalReports: auditReports.length,
    completed: auditReports.filter(r => r.status === 'completed').length,
    inProgress: auditReports.filter(r => r.status === 'in_progress').length,
    overdue: auditReports.filter(r => r.status === 'overdue').length,
    avgComplianceScore: Math.round(auditReports.reduce((sum, r) => sum + r.compliance_score, 0) / auditReports.length),
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Audit Reports & Compliance
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ChartIcon />}
              onClick={() => navigate('/auditor/assets')}
            >
              View Assets
            </Button>
            <Button
              variant="contained"
              startIcon={<ReportIcon />}
              onClick={handleGenerateReport}
            >
              Generate Report
            </Button>
          </Box>
        </Box>

        {/* Report Statistics */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="primary.main">
                      {reportStats.totalReports}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Reports
                    </Typography>
                  </Box>
                  <ReportIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="success.main">
                      {reportStats.completed}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed
                    </Typography>
                  </Box>
                  <ComplianceIcon color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="info.main">
                      {reportStats.inProgress}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      In Progress
                    </Typography>
                  </Box>
                  <ScheduleIcon color="info" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="error.main">
                      {reportStats.overdue}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Overdue
                    </Typography>
                  </Box>
                  <WarningIcon color="error" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="primary.main">
                      {reportStats.avgComplianceScore}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Compliance
                    </Typography>
                  </Box>
                  <TrendingUpIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={(_, newValue) => setCurrentTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Audit Reports" />
            <Tab label="Compliance Tracking" />
            <Tab label="Financial Audit" />
          </Tabs>
        </Card>

        {/* Tab Content */}
        <TabPanel value={currentTab} index={0}>
          {/* Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Report Type</InputLabel>
                    <Select
                      value={filterType}
                      label="Report Type"
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <MenuItem value="all">All Types</MenuItem>
                      <MenuItem value="compliance">Compliance</MenuItem>
                      <MenuItem value="financial">Financial</MenuItem>
                      <MenuItem value="operational">Operational</MenuItem>
                      <MenuItem value="security">Security</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filterStatus}
                      label="Status"
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="in_progress">In Progress</MenuItem>
                      <MenuItem value="scheduled">Scheduled</MenuItem>
                      <MenuItem value="overdue">Overdue</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="From Date"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="To Date"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<PrintIcon />}
                      onClick={() => toast.success('Printing reports summary')}
                    >
                      Print
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => toast.success('Exporting reports data')}
                    >
                      Export
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Reports Table */}
          <Card>
            <CardContent>
              {loading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <LinearProgress />
                  <Typography sx={{ mt: 2 }}>Loading reports...</Typography>
                </Box>
              ) : filteredReports.length === 0 ? (
                <Alert severity="info">
                  No reports found matching your criteria.
                </Alert>
              ) : (
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Report Title</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Auditor</TableCell>
                        <TableCell>Findings</TableCell>
                        <TableCell>Compliance</TableCell>
                        <TableCell>Created Date</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredReports.map((report) => (
                        <TableRow key={report.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getTypeIcon(report.type)}
                              <Box>
                                <Typography variant="subtitle2">{report.title}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Priority: {report.priority.charAt(0).toUpperCase() + report.priority.slice(1)}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={report.status.charAt(0).toUpperCase() + report.status.slice(1).replace('_', ' ')}
                              size="small"
                              color={getStatusColor(report.status) as any}
                            />
                          </TableCell>
                          <TableCell>{report.auditor}</TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">
                                {report.findings} findings
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {report.recommendations} recommendations
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">{report.compliance_score}%</Typography>
                              <LinearProgress
                                variant="determinate"
                                value={report.compliance_score}
                                sx={{ width: 60, height: 4 }}
                                color={report.compliance_score >= 90 ? 'success' : 
                                       report.compliance_score >= 70 ? 'warning' : 'error'}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>{report.created_date}</TableCell>
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
                              <Tooltip title="Download">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDownloadReport(report)}
                                  color="success"
                                >
                                  <DownloadIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Print">
                                <IconButton
                                  size="small"
                                  onClick={() => handlePrintReport(report)}
                                  color="info"
                                >
                                  <PrintIcon />
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
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Compliance Requirements Tracking
              </Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Requirement</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Responsible Party</TableCell>
                      <TableCell>Last Review</TableCell>
                      <TableCell>Next Review</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {complianceItems.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2">{item.requirement}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' ')}
                            size="small"
                            color={getComplianceStatusColor(item.status) as any}
                          />
                        </TableCell>
                        <TableCell>{item.responsible_party}</TableCell>
                        <TableCell>{item.last_review}</TableCell>
                        <TableCell>{item.next_review}</TableCell>
                        <TableCell>{item.notes || 'No notes'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Financial Audit Summary
              </Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell>Budgeted</TableCell>
                      <TableCell>Actual</TableCell>
                      <TableCell>Variance</TableCell>
                      <TableCell>Variance %</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {financialItems.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2">{item.category}</Typography>
                        </TableCell>
                        <TableCell>${item.budgeted_amount.toLocaleString()}</TableCell>
                        <TableCell>${item.actual_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Typography 
                            color={item.variance < 0 ? 'success.main' : 'error.main'}
                          >
                            ${item.variance.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography 
                            color={item.variance_percentage < 0 ? 'success.main' : 'error.main'}
                          >
                            {item.variance_percentage}%
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' ')}
                            size="small"
                            color={getBudgetStatusColor(item.status) as any}
                          />
                        </TableCell>
                        <TableCell>{item.notes || 'No notes'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Report Details Dialog */}
        <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Report Details: {selectedReport?.title}
          </DialogTitle>
          <DialogContent>
            {selectedReport && (
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Report Type
                  </Typography>
                  <Typography variant="body1">
                    {selectedReport.type.charAt(0).toUpperCase() + selectedReport.type.slice(1)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Status
                  </Typography>
                  <Chip
                    label={selectedReport.status.charAt(0).toUpperCase() + selectedReport.status.slice(1).replace('_', ' ')}
                    color={getStatusColor(selectedReport.status) as any}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Auditor
                  </Typography>
                  <Typography variant="body1">{selectedReport.auditor}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Compliance Score
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">{selectedReport.compliance_score}%</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={selectedReport.compliance_score}
                      sx={{ width: 100, height: 6 }}
                      color={selectedReport.compliance_score >= 90 ? 'success' : 
                             selectedReport.compliance_score >= 70 ? 'warning' : 'error'}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Findings
                  </Typography>
                  <Typography variant="body1">{selectedReport.findings}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Recommendations
                  </Typography>
                  <Typography variant="body1">{selectedReport.recommendations}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Summary
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This audit report provides comprehensive analysis of {selectedReport.type} aspects 
                    with {selectedReport.findings} key findings and {selectedReport.recommendations} actionable recommendations. 
                    The overall compliance score is {selectedReport.compliance_score}%.
                  </Typography>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReportDialogOpen(false)}>Close</Button>
            <Button onClick={() => selectedReport && handleDownloadReport(selectedReport)} variant="outlined">
              Download
            </Button>
            <Button onClick={() => selectedReport && handlePrintReport(selectedReport)} variant="contained">
              Print
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default AuditorReportsPage;