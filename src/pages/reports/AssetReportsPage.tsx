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
} from '@mui/material';
// DatePicker imports removed due to compatibility issues
import {
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  Assessment as ReportIcon,
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { format, parseISO, subMonths } from 'date-fns';
import { toast } from 'react-toastify';
import api from '../../services/api';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Asset Tracking' | 'Financial' | 'Utilization' | 'Compliance' | 'Maintenance';
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annual' | 'On-Demand';
  lastGenerated?: string;
  format: 'PDF' | 'Excel' | 'CSV';
  status: 'Active' | 'Draft' | 'Archived';
}

interface AssetSummary {
  totalAssets: number;
  activeAssets: number;
  inactiveAssets: number;
  underMaintenance: number;
  totalValue: number;
  depreciatedValue: number;
  byCategory: { category: string; count: number; value: number }[];
  byLocation: { location: string; count: number; percentage: number }[];
  byStatus: { status: string; count: number; percentage: number }[];
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
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AssetReportsPage = () => {
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [assetSummary, setAssetSummary] = useState<AssetSummary | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: subMonths(new Date(), 1),
    endDate: new Date(),
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      const [templatesResponse, summaryResponse] = await Promise.all([
        api.get('/reports/templates'),
        api.get('/reports/asset-summary')
      ]);
      
      const templates = templatesResponse.data.data || templatesResponse.data;
      const summary = summaryResponse.data.data || summaryResponse.data;
      
      setReportTemplates(templates);
      setAssetSummary(summary);
    } catch (error) {
      console.error('Error loading report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Asset Tracking':
        return 'primary';
      case 'Financial':
        return 'success';
      case 'Utilization':
        return 'info';
      case 'Compliance':
        return 'warning';
      case 'Maintenance':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Draft':
        return 'warning';
      case 'Archived':
        return 'default';
      default:
        return 'default';
    }
  };

  const handleGenerateReport = (template: ReportTemplate) => {
    toast.success(`Generating ${template.name} report in ${template.format} format`);
    // In real implementation, this would trigger report generation
    setReportTemplates(prev => prev.map(t => 
      t.id === template.id 
        ? { ...t, lastGenerated: new Date().toISOString().split('T')[0] }
        : t
    ));
  };

  const handleDownloadReport = (template: ReportTemplate) => {
    toast.info(`Downloading ${template.name} report`);
    // In real implementation, this would download the report file
  };

  return (
    <DashboardLayout>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              Asset Reports
            </Typography>
            <Button
              variant="contained"
              startIcon={<ReportIcon />}
              onClick={() => toast.info('Custom report builder coming soon')}
            >
              Create Custom Report
            </Button>
          </Box>

          {/* Summary Cards */}
          {assetSummary && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          Total Assets
                        </Typography>
                        <Typography variant="h4">
                          {assetSummary.totalAssets.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Value: ₹{(assetSummary.totalValue / 10000000).toFixed(1)}Cr
                        </Typography>
                      </Box>
                      <InventoryIcon color="primary" sx={{ fontSize: 40 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          Active Assets
                        </Typography>
                        <Typography variant="h4" color="success.main">
                          {assetSummary.activeAssets.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {((assetSummary.activeAssets / assetSummary.totalAssets) * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                      <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          Under Maintenance
                        </Typography>
                        <Typography variant="h4" color="warning.main">
                          {assetSummary.underMaintenance}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {((assetSummary.underMaintenance / assetSummary.totalAssets) * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                      <CategoryIcon color="warning" sx={{ fontSize: 40 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          Book Value
                        </Typography>
                        <Typography variant="h4" color="info.main">
                          ₹{(assetSummary.depreciatedValue / 10000000).toFixed(1)}Cr
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Depreciated from ₹{(assetSummary.totalValue / 10000000).toFixed(1)}Cr
                        </Typography>
                      </Box>
                      <LocationIcon color="info" sx={{ fontSize: 40 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Tabs */}
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                <Tab label="Report Templates" />
                <Tab label="Asset Summary" />
                <Tab label="Quick Reports" />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <Typography variant="h6" gutterBottom>
                Available Report Templates
              </Typography>
              <Grid container spacing={3}>
                {loading ? (
                  <Grid item xs={12}>
                    <Typography align="center">Loading report templates...</Typography>
                  </Grid>
                ) : (
                  reportTemplates.map((template) => (
                    <Grid item xs={12} md={6} key={template.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" gutterBottom>
                                {template.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" paragraph>
                                {template.description}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <Chip
                                  label={template.category}
                                  color={getCategoryColor(template.category) as any}
                                  size="small"
                                />
                                <Chip
                                  label={template.frequency}
                                  size="small"
                                  variant="outlined"
                                />
                                <Chip
                                  label={template.format}
                                  size="small"
                                  variant="outlined"
                                />
                                <Chip
                                  label={template.status}
                                  color={getStatusColor(template.status) as any}
                                  size="small"
                                />
                              </Box>
                              {template.lastGenerated && (
                                <Typography variant="caption" color="text.secondary">
                                  Last generated: {format(parseISO(template.lastGenerated), 'MMM dd, yyyy')}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<ReportIcon />}
                              onClick={() => handleGenerateReport(template)}
                            >
                              Generate
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<DownloadIcon />}
                              onClick={() => handleDownloadReport(template)}
                              disabled={!template.lastGenerated}
                            >
                              Download
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<ViewIcon />}
                              onClick={() => toast.info('Report preview coming soon')}
                            >
                              Preview
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                )}
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {/* Asset Summary Tables */}
              {assetSummary && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Assets by Category
                        </Typography>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Category</TableCell>
                                <TableCell align="right">Count</TableCell>
                                <TableCell align="right">Value</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {assetSummary.byCategory.map((item) => (
                                <TableRow key={item.category}>
                                  <TableCell>{item.category}</TableCell>
                                  <TableCell align="right">{item.count}</TableCell>
                                  <TableCell align="right">₹{(item.value / 1000000).toFixed(1)}M</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Assets by Location
                        </Typography>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Location</TableCell>
                                <TableCell align="right">Count</TableCell>
                                <TableCell align="right">%</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {assetSummary.byLocation.map((item) => (
                                <TableRow key={item.location}>
                                  <TableCell>{item.location}</TableCell>
                                  <TableCell align="right">{item.count}</TableCell>
                                  <TableCell align="right">{item.percentage}%</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Assets by Status
                        </Typography>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Count</TableCell>
                                <TableCell align="right">%</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {assetSummary.byStatus.map((item) => (
                                <TableRow key={item.status}>
                                  <TableCell>
                                    <Chip
                                      label={item.status}
                                      size="small"
                                      color={
                                        item.status === 'Active' ? 'success' :
                                        item.status === 'Under Maintenance' ? 'warning' : 'default'
                                      }
                                    />
                                  </TableCell>
                                  <TableCell align="right">{item.count}</TableCell>
                                  <TableCell align="right">{item.percentage}%</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" gutterBottom>
                Generate Quick Reports
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                Use the filters below to generate custom reports for specific date ranges, categories, or locations.
              </Alert>

              {/* Quick Report Filters */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
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
                <Grid item xs={12} md={3}>
                  <TextField
                    label="End Date"
                    type="date"
                    value={selectedDateRange.endDate ? selectedDateRange.endDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setSelectedDateRange(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={selectedCategory}
                      label="Category"
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <MenuItem value="All">All Categories</MenuItem>
                      <MenuItem value="IT Equipment">IT Equipment</MenuItem>
                      <MenuItem value="Office Equipment">Office Equipment</MenuItem>
                      <MenuItem value="Furniture">Furniture</MenuItem>
                      <MenuItem value="Machinery">Machinery</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Location</InputLabel>
                    <Select
                      value={selectedLocation}
                      label="Location"
                      onChange={(e) => setSelectedLocation(e.target.value)}
                    >
                      <MenuItem value="All">All Locations</MenuItem>
                      <MenuItem value="Main Office - Floor 1">Main Office - Floor 1</MenuItem>
                      <MenuItem value="Main Office - Floor 2">Main Office - Floor 2</MenuItem>
                      <MenuItem value="Branch Office - Mumbai">Branch Office - Mumbai</MenuItem>
                      <MenuItem value="Warehouse - Pune">Warehouse - Pune</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Quick Report Actions */}
              <Grid container spacing={2}>
                <Grid item>
                  <Button
                    variant="contained"
                    startIcon={<ReportIcon />}
                    onClick={() => toast.success('Asset inventory report generated')}
                  >
                    Asset Inventory Report
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => toast.success('Asset utilization report generated')}
                  >
                    Utilization Report
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    onClick={() => toast.success('Financial summary report generated')}
                  >
                    Financial Summary
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    variant="outlined"
                    startIcon={<ViewIcon />}
                    onClick={() => toast.success('Location audit report generated')}
                  >
                    Location Audit
                  </Button>
                </Grid>
              </Grid>
            </TabPanel>
          </Card>
        </Box>
    </DashboardLayout>
  );
};

export default AssetReportsPage;