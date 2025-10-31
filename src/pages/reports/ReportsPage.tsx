
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
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
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Skeleton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Assessment as ReportIcon,
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
  Inventory as InventoryIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  Share as ShareIcon,
  Category as CategoryIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
// Date picker removed for now - can use regular date inputs
import DashboardLayout from '../../components/layout/DashboardLayout';
import { toast } from 'react-toastify';

interface ReportTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  type: 'Table' | 'Chart' | 'Summary' | 'Analytics';
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly' | 'On-demand';
  lastGenerated?: string;
  parameters: string[];
  size: string;
  icon: React.ReactNode;
}

interface GeneratedReport {
  id: string;
  name: string;
  type: string;
  generatedDate: string;
  generatedBy: string;
  format: 'PDF' | 'Excel' | 'CSV';
  size: string;
  status: 'Generated' | 'Generating' | 'Failed';
  downloadCount: number;
}

interface DisposalRecord {
  id: string;
  asset_id: string;
  asset_name: string;
  category: string;
  disposal_date: string;
  disposal_method: string;
  disposal_value: number;
  approved_by: string;
  document_reference: string;
  status: string;
}

// Typed helper for Chip colors
const statusToColor = (status: string): 'success' | 'warning' | 'default' => {
  const lowerStatus = status?.toLowerCase();
  if (lowerStatus === 'approved' || lowerStatus === 'completed') return 'success';
  if (lowerStatus === 'pending') return 'warning';
  return 'default';
};

const ReportsPage = () => {
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [disposalLoading, setDisposalLoading] = useState(false);
  const [disposalRecords, setDisposalRecords] = useState<DisposalRecord[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const location = useLocation();
  const navigate = useNavigate();

  // Sync tab selection with URL path (e.g., /reports/disposal -> Disposal Reports tab)
  useEffect(() => {
    if (location.pathname.startsWith('/reports')) {
      if (location.pathname === '/reports' || location.pathname === '/reports/assets') {
        setTabValue(0);
      } else if (location.pathname === '/reports/disposal') {
        setTabValue(1);
      } else if (location.pathname === '/reports/generated') {
        setTabValue(2);
      } else if (location.pathname === '/reports/scheduled') {
        setTabValue(3);
      } else if (location.pathname === '/reports/analytics') {
        setTabValue(4);
      }
    }
  }, [location.pathname]);
  const [customReportOpen, setCustomReportOpen] = useState(false);
  const [scheduleReportOpen, setScheduleReportOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [dateRange, setDateRange] = useState<{start: Date | null, end: Date | null}>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date()
  });

  const generateReportTemplates = (): ReportTemplate[] => {
    return [
      {
        id: 'RPT-001',
        name: 'Asset Inventory Summary',
        category: 'Inventory',
        description: 'Complete overview of all assets with current status, location, and value',
        type: 'Table',
        frequency: 'Monthly',
        lastGenerated: '2024-01-15',
        parameters: ['Date Range', 'Location', 'Category', 'Status'],
        size: '2.4 MB',
        icon: <InventoryIcon />,
      },
      {
        id: 'RPT-002',
        name: 'Asset Utilization Analytics',
        category: 'Analytics',
        description: 'Analysis of asset usage patterns and efficiency metrics',
        type: 'Chart',
        frequency: 'Weekly',
        lastGenerated: '2024-01-20',
        parameters: ['Date Range', 'Department', 'Asset Type'],
        size: '1.8 MB',
        icon: <TrendingUpIcon />,
      },
      {
        id: 'RPT-003',
        name: 'Maintenance Cost Analysis',
        category: 'Maintenance',
        description: 'Breakdown of maintenance expenses by asset, type, and period',
        type: 'Analytics',
        frequency: 'Monthly',
        lastGenerated: '2024-01-18',
        parameters: ['Date Range', 'Asset Category', 'Maintenance Type'],
        size: '3.1 MB',
        icon: <MoneyIcon />,
      },
      {
        id: 'RPT-004',
        name: 'Vendor Performance Report',
        category: 'Vendors',
        description: 'Evaluation of vendor performance, ratings, and procurement metrics',
        type: 'Summary',
        frequency: 'Quarterly',
        lastGenerated: '2024-01-10',
        parameters: ['Date Range', 'Vendor Category', 'Performance Metrics'],
        size: '1.5 MB',
        icon: <BusinessIcon />,
      },
      {
        id: 'RPT-005',
        name: 'Asset Depreciation Schedule',
        category: 'Financial',
        description: 'Detailed depreciation calculations and schedules for all assets',
        type: 'Table',
        frequency: 'Yearly',
        lastGenerated: '2024-01-01',
        parameters: ['Date Range', 'Depreciation Method', 'Asset Category'],
        size: '4.2 MB',
        icon: <TimelineIcon />,
      },
      {
        id: 'RPT-006',
        name: 'Compliance Audit Report',
        category: 'Compliance',
        description: 'Asset compliance status and audit trail documentation',
        type: 'Summary',
        frequency: 'Monthly',
        lastGenerated: '2024-01-22',
        parameters: ['Date Range', 'Compliance Type', 'Department'],
        size: '2.7 MB',
        icon: <ReportIcon />,
      },
      {
        id: 'RPT-007',
        name: 'Asset Movement Tracking',
        category: 'Operations',
        description: 'Track asset transfers, relocations, and assignment changes',
        type: 'Table',
        frequency: 'Weekly',
        lastGenerated: '2024-01-21',
        parameters: ['Date Range', 'Location', 'Movement Type'],
        size: '1.9 MB',
        icon: <CategoryIcon />,
      },
      {
        id: 'RPT-008',
        name: 'User Activity Dashboard',
        category: 'Operations',
        description: 'System usage analytics and user activity patterns',
        type: 'Chart',
        frequency: 'Daily',
        lastGenerated: '2024-01-23',
        parameters: ['Date Range', 'User Role', 'Activity Type'],
        size: '1.2 MB',
        icon: <PersonIcon />,
      },
    ];
  };

  const generateReportHistory = (): GeneratedReport[] => {
    const reportNames = [
      'Monthly Asset Summary - January 2024',
      'Vendor Performance Q4 2023',
      'Maintenance Cost Analysis - December 2023',
      'Asset Utilization Report - Week 3',
      'Compliance Audit - January 2024',
      'Depreciation Schedule 2024',
      'Asset Movement Report - January',
      'User Activity Dashboard - Daily',
    ];

    const users = ['John Smith', 'Sarah Johnson', 'Mike Chen', 'Lisa Brown', 'David Wilson'];
    const formats: ('PDF' | 'Excel' | 'CSV')[] = ['PDF', 'Excel', 'CSV'];
    const statuses: ('Generated' | 'Generating' | 'Failed')[] = ['Generated', 'Generated', 'Generated', 'Generating', 'Failed'];

    return Array.from({ length: 15 }, (_, index) => ({
      id: `GEN-${(index + 1).toString().padStart(3, '0')}`,
      name: reportNames[index % reportNames.length],
      type: ['Summary', 'Analytics', 'Table', 'Chart'][index % 4],
      generatedDate: new Date(2024, 0, 23 - index).toISOString().split('T')[0],
      generatedBy: users[index % users.length],
      format: formats[index % formats.length],
      size: `${(Math.random() * 5 + 0.5).toFixed(1)} MB`,
      status: statuses[index % statuses.length],
      downloadCount: Math.floor(Math.random() * 50) + 1,
    }));
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Try to fetch from API, but use mock data as fallback
        const [templatesRes, historyRes] = await Promise.all([
          api.get('/reports/templates').catch(() => ({ data: { data: null } })),
          api.get('/reports/history').catch(() => ({ data: { data: null } }))
        ]);
        
        // Use API data if available, otherwise use generated mock data
        setReportTemplates(templatesRes.data.data || generateReportTemplates());
        setGeneratedReports(historyRes.data.data || generateReportHistory());
      } catch (error) {
        console.error('Error loading reports:', error);
        // Fallback to mock data on error
        setReportTemplates(generateReportTemplates());
        setGeneratedReports(generateReportHistory());
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Lazy-load disposal records when needed with server-side pagination
  useEffect(() => {
    const needsDisposal = tabValue === 1 || location.pathname === '/reports/disposal';
    if (!needsDisposal) return;
    
    // Skip if already loaded or currently loading
    if (disposalRecords.length > 0 || disposalLoading) return;
    
    const abortController = new AbortController();
    
    (async () => {
      try {
        setDisposalLoading(true);
        const res = await api.get('/inventory/disposal-records', {
          params: {
            page: 1,
            limit: 100,
          },
          signal: abortController.signal,
        });
        const data: DisposalRecord[] = Array.isArray(res.data?.data) ? res.data.data : [];
        setDisposalRecords(data);
      } catch (e: any) {
        if (e.name === 'AbortError' || e.name === 'CanceledError') {
          return; // Request was cancelled
        }
        console.error('Error loading disposal records:', e);
      } finally {
        setDisposalLoading(false);
      }
    })();
    
    return () => abortController.abort();
  }, [tabValue, location.pathname]); // Removed disposalLoading from dependencies

  const categories = Array.from(new Set(reportTemplates.map(r => r.category)));

  const filteredTemplates = reportTemplates.filter(
    template => selectedCategory === 'all' || template.category === selectedCategory
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Table': return 'primary';
      case 'Chart': return 'secondary';
      case 'Summary': return 'info';
      case 'Analytics': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Generated': return 'success';
      case 'Generating': return 'warning';
      case 'Failed': return 'error';
      default: return 'default';
    }
  };

  const handleGenerateReport = async (template: ReportTemplate) => {
    try {
      setSelectedTemplate(template);
      toast.info(`Generating ${template.name}...`);
      
      // Call API to generate report
      const response = await api.post('/reports/generate', {
        template_id: template.id,
        format: 'PDF',
        parameters: {}
      });

      if (response.data.success) {
        toast.success(`Report "${template.name}" generated successfully!`);
        
        // Refresh reports list - reload from API
        try {
          const historyRes = await api.get('/reports/history');
          if (historyRes.data.data) {
            setGeneratedReports(historyRes.data.data);
          }
        } catch (error) {
          console.error('Failed to refresh reports:', error);
        }
        
        // Optionally download immediately
        if (response.data.data.download_url) {
          window.open(response.data.data.download_url, '_blank');
        }
      }
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      const errorMsg = error.response?.data?.message || 'Failed to generate report';
      toast.error(errorMsg);
    }
  };

  const handleDownloadReport = async (report: GeneratedReport) => {
    try {
      // Call API to download report
      const response = await api.get(`/reports/${report.id}/download`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${report.name}.${report.format.toLowerCase()}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Downloaded ${report.name}`);
    } catch (error: any) {
      console.error('Failed to download report:', error);
      toast.error('Failed to download report');
    }
  };

  const stats = {
    totalTemplates: reportTemplates.length,
    generatedThisMonth: generatedReports.filter(r => 
      new Date(r.generatedDate).getMonth() === new Date().getMonth()
    ).length,
    scheduledReports: reportTemplates.filter(r => r.frequency !== 'On-demand').length,
    totalDownloads: generatedReports.reduce((sum, r) => sum + r.downloadCount, 0),
  };

  return (
    <DashboardLayout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Reports & Analytics
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Generate, schedule, and manage comprehensive business reports
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ScheduleIcon />}
              onClick={() => setScheduleReportOpen(true)}
            >
              Schedule Report
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCustomReportOpen(true)}
            >
              Custom Report
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Report Templates
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={40} height={32} />
                    ) : (
                      <Typography variant="h4">{stats.totalTemplates}</Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'primary.main' }}>
                    <ReportIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Generated This Month
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={40} height={32} />
                    ) : (
                      <Typography variant="h4">{stats.generatedThisMonth}</Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'success.main' }}>
                    <TrendingUpIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Scheduled Reports
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={40} height={32} />
                    ) : (
                      <Typography variant="h4">{stats.scheduledReports}</Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'info.main' }}>
                    <ScheduleIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Total Downloads
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={40} height={32} />
                    ) : (
                      <Typography variant="h4">{stats.totalDownloads}</Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'warning.main' }}>
                    <DownloadIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => {
              setTabValue(newValue);
              // Optional: update URL when switching tabs for deep-linkability
              const paths = ['/reports', '/reports/disposal', '/reports/generated', '/reports/scheduled', '/reports/analytics'];
              if (paths[newValue]) navigate(paths[newValue]);
            }}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Report Templates" />
            <Tab label="Disposal Reports" />
            <Tab label="Generated Reports" />
            <Tab label="Scheduled Reports" />
            <Tab label="Analytics Dashboard" />
          </Tabs>
        </Card>

        {tabValue === 0 && (
          <Box>
            {/* Category Filter */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={selectedCategory}
                        label="Category"
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        <MenuItem value="all">All Categories</MenuItem>
                        {categories.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={9}>
                    <Typography variant="body2" color="text.secondary">
                      Showing {filteredTemplates.length} of {reportTemplates.length} report templates
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Report Templates Grid */}
            <Grid container spacing={3}>
              {loading ? (
                [1, 2, 3, 4, 5, 6].map((item) => (
                  <Grid item xs={12} md={6} lg={4} key={item}>
                    <Card>
                      <CardContent>
                        <Skeleton variant="circular" width={40} height={40} sx={{ mb: 2 }} />
                        <Skeleton variant="text" width="80%" height={24} />
                        <Skeleton variant="text" width="60%" height={20} />
                        <Skeleton variant="text" width="100%" height={60} />
                        <Skeleton variant="rectangular" width="100%" height={36} sx={{ mt: 2 }} />
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              ) : (
                filteredTemplates.map((template) => (
                  <Grid item xs={12} md={6} lg={4} key={template.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            {template.icon}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" component="div">
                              {template.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {template.id} • {template.category}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {template.description}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                          <Chip
                            label={template.type}
                            color={getTypeColor(template.type) as any}
                            size="small"
                          />
                          <Chip
                            label={template.frequency}
                            variant="outlined"
                            size="small"
                          />
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Parameters: {(template.parameters || []).join(', ')}
                          </Typography>
                        </Box>

                        {template.lastGenerated && (
                          <Typography variant="caption" color="text.secondary">
                            Last generated: {new Date(template.lastGenerated).toLocaleDateString()}
                          </Typography>
                        )}
                      </CardContent>
                      
                      <Box sx={{ p: 2, pt: 0 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<ViewIcon />}
                          onClick={() => handleGenerateReport(template)}
                        >
                          Generate Report
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Total Disposals
                    </Typography>
                    {disposalLoading ? (
                      <Skeleton variant="text" width={60} height={32} />
                    ) : (
                      <Typography variant="h4">{disposalRecords.length}</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      This Month
                    </Typography>
                    {disposalLoading ? (
                      <Skeleton variant="text" width={60} height={32} />
                    ) : (
                      <Typography variant="h4">{
                        disposalRecords.filter(r => {
                          const d = new Date(r.disposal_date);
                          const now = new Date();
                          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                        }).length
                      }</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Total Value
                    </Typography>
                    {disposalLoading ? (
                      <Skeleton variant="text" width={120} height={32} />
                    ) : (
                      <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MoneyIcon fontSize="small" />
                        {disposalRecords.reduce((sum, r) => sum + (Number(r.disposal_value) || 0), 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Methods Used
                    </Typography>
                    {disposalLoading ? (
                      <Skeleton variant="text" width={80} height={32} />
                    ) : (
                      <Typography variant="h5">{
                        Array.from(new Set(disposalRecords.map(r => r.disposal_method))).length
                      }</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Disposal Records
                </Typography>
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Asset</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Method</TableCell>
                        <TableCell align="right">Value</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {disposalLoading ? (
                        [1,2,3,4,5,6,7].map(k => (
                          <TableRow key={k}>
                            <TableCell colSpan={6}>
                              <Skeleton variant="rectangular" height={28} />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : disposalRecords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <Typography variant="body2" color="text.secondary">
                              No disposal records found.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        disposalRecords.slice(0, 25).map((rec) => (
                          <TableRow key={rec.id}>
                            <TableCell>
                              <Typography variant="subtitle2">{rec.asset_name || rec.asset_id}</Typography>
                              <Typography variant="caption" color="text.secondary">{rec.asset_id}</Typography>
                            </TableCell>
                            <TableCell>{rec.category}</TableCell>
                            <TableCell>{rec.disposal_method}</TableCell>
                            <TableCell align="right">{(Number(rec.disposal_value) || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</TableCell>
                            <TableCell>{new Date(rec.disposal_date).toLocaleDateString('en-IN')}</TableCell>
                            <TableCell>
                              <Chip size="small" label={rec.status} color={statusToColor(rec.status)} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        )}

        {tabValue === 2 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Generated Reports History
              </Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Report Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Generated Date</TableCell>
                      <TableCell>Generated By</TableCell>
                      <TableCell>Format</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Downloads</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {generatedReports.slice(0, 10).map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <Typography variant="subtitle2">{report.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {report.id}
                          </Typography>
                        </TableCell>
                        <TableCell>{report.type}</TableCell>
                        <TableCell>
                          {new Date(report.generatedDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{report.generatedBy}</TableCell>
                        <TableCell>
                          <Chip label={report.format} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{report.size}</TableCell>
                        <TableCell>
                          <Chip
                            label={report.status}
                            color={getStatusColor(report.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{report.downloadCount}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleDownloadReport(report)}
                            disabled={report.status !== 'Generated'}
                          >
                            <DownloadIcon />
                          </IconButton>
                          <IconButton size="small" color="info">
                            <ShareIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {tabValue === 3 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Scheduled Reports
              </Typography>
              <List>
                {reportTemplates
                  .filter(t => t.frequency !== 'On-demand')
                  .map((template, index) => (
                    <React.Fragment key={template.id}>
                      <ListItem>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: 'secondary.main' }}>
                            {template.icon}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={template.name}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {template.description}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Frequency: {template.frequency} • Last: {template.lastGenerated ? new Date(template.lastGenerated).toLocaleDateString() : 'Never'}
                              </Typography>
                            </Box>
                          }
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" color="primary">
                            <ViewIcon />
                          </IconButton>
                          <IconButton size="small" color="info">
                            <EditIcon />
                          </IconButton>
                        </Box>
                      </ListItem>
                      {index < reportTemplates.filter(t => t.frequency !== 'On-demand').length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
              </List>
            </CardContent>
          </Card>
        )}

        {tabValue === 4 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PieChartIcon />
                    Report Usage Analytics
                  </Typography>
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Interactive charts showing report generation trends, popular templates, and usage patterns would be displayed here.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BarChartIcon />
                    Performance Metrics
                  </Typography>
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Performance dashboards showing report generation times, system load, and optimization recommendations.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Custom Report Dialog */}
        <Dialog open={customReportOpen} onClose={() => setCustomReportOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedTemplate ? `Generate: ${selectedTemplate.name}` : 'Create Custom Report'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={dateRange.start ? dateRange.start.toISOString().split('T')[0] : ''}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: new Date(e.target.value) }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={dateRange.end ? dateRange.end.toISOString().split('T')[0] : ''}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: new Date(e.target.value) }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Output Format</InputLabel>
                  <Select defaultValue="PDF" label="Output Format">
                    <MenuItem value="PDF">PDF</MenuItem>
                    <MenuItem value="Excel">Excel</MenuItem>
                    <MenuItem value="CSV">CSV</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCustomReportOpen(false)}>Cancel</Button>
            <Button variant="contained" startIcon={<ViewIcon />}>
              Generate Report
            </Button>
          </DialogActions>
        </Dialog>

        {/* Schedule Report Dialog */}
        <Dialog open={scheduleReportOpen} onClose={() => setScheduleReportOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Schedule Automatic Report</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Set up automatic report generation and delivery schedules.
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Report Template</InputLabel>
                  <Select defaultValue="" label="Report Template">
                    {reportTemplates.map((template) => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Frequency</InputLabel>
                  <Select defaultValue="Monthly" label="Frequency">
                    <MenuItem value="Daily">Daily</MenuItem>
                    <MenuItem value="Weekly">Weekly</MenuItem>
                    <MenuItem value="Monthly">Monthly</MenuItem>
                    <MenuItem value="Quarterly">Quarterly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setScheduleReportOpen(false)}>Cancel</Button>
            <Button variant="contained" startIcon={<ScheduleIcon />}>
              Schedule Report
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default ReportsPage;