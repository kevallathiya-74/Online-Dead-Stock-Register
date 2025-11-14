import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Skeleton,
  Alert,
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  Assessment as ReportIcon,
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
  CurrencyRupee as MoneyIcon,
  Timeline as TimelineIcon,
  Category as CategoryIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { toast } from 'react-toastify';

interface ReportTemplate {
  _id: string;
  name: string;
  category: string;
  description: string;
  type: string;
  frequency: string;
  lastGenerated?: string;
  parameters: string[];
  format: string;
  status: string;
  generationCount: number;
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

const ReportsPage = () => {
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [assetSummary, setAssetSummary] = useState<AssetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date()
  });
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch templates and asset summary from real APIs
        const [templatesRes, summaryRes] = await Promise.all([
          api.get('/reports/templates'),
          api.get('/reports/asset-summary')
        ]);
        
        setReportTemplates(templatesRes.data.data || []);
        setAssetSummary(summaryRes.data.data || summaryRes.data || null);
      } catch (error) {
        console.error('Error loading reports:', error);
        toast.error('Failed to load report data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const categories = Array.from(new Set(reportTemplates.map(r => r.category)));

  const filteredTemplates = reportTemplates.filter(
    template => selectedCategory === 'all' || template.category === selectedCategory
  );

  const getTypeColor = (type: string) => {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('table') || lowerType.includes('detailed')) return 'primary';
    if (lowerType.includes('chart') || lowerType.includes('analytics')) return 'secondary';
    if (lowerType.includes('summary')) return 'info';
    return 'default';
  };

  const handleGenerateReport = async (template: ReportTemplate) => {
    try {
      toast.info(`Generating ${template.name}...`);
      
      const response = await api.post('/reports/generate', {
        template_id: template._id,
        format: template.format || 'PDF',
        parameters: {
          startDate: selectedDateRange.startDate,
          endDate: selectedDateRange.endDate
        }
      });

      if (response.data.success) {
        // Refresh templates to update last generated time
        const templatesRes = await api.get('/reports/templates');
        setReportTemplates(templatesRes.data.data || []);
        
        // Download the report using authenticated API call
        if (response.data.data?.report_id) {
          try {
            const downloadResponse = await api.get(
              `/reports/${response.data.data.report_id}/download`,
              { responseType: 'blob' }
            );
            
            // Create blob URL and trigger download
            const blob = new Blob([downloadResponse.data], { type: 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${template.name.replace(/\s+/g, '-')}-${response.data.data.report_id}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            // Show single success message for both generation and download
            toast.success(`Report "${template.name}" generated and downloaded successfully!`);
          } catch (downloadError) {
            console.error('Download error:', downloadError);
            toast.error('Failed to download report');
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      toast.error(error.response?.data?.message || 'Failed to generate report');
    }
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'Inventory': return <InventoryIcon />;
      case 'Analytics': return <TrendingUpIcon />;
      case 'Financial': return <MoneyIcon />;
      case 'Tracking': return <CategoryIcon />;
      case 'Compliance': return <ReportIcon />;
      default: return <ReportIcon />;
    }
  };

  const stats = {
    totalTemplates: reportTemplates.length,
    activeTemplates: reportTemplates.filter(r => r.status === 'active').length,
    totalAssets: assetSummary?.totalAssets || 0,
    totalValue: assetSummary?.totalValue || 0,
  };

  return (
    <DashboardLayout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Asset Reports & Analytics
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Generate comprehensive asset reports with real-time data
            </Typography>
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
                      <Typography variant="h4">{stats.activeTemplates}</Typography>
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
                      Total Assets
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={40} height={32} />
                    ) : (
                      <Typography variant="h4">{stats.totalAssets}</Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'success.main' }}>
                    <InventoryIcon />
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
                      Total Value
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={60} height={32} />
                    ) : (
                      <Typography variant="h5">
                        ₹{(stats.totalValue / 10000000).toFixed(1)}Cr
                      </Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'info.main' }}>
                    <MoneyIcon />
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
                      Active Assets
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={40} height={32} />
                    ) : (
                      <Typography variant="h4">{assetSummary?.activeAssets || 0}</Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'warning.main' }}>
                    <TrendingUpIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

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
              <Grid item xs={12} md={3}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={selectedDateRange.startDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDateRange(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="End Date"
                  type="date"
                  value={selectedDateRange.endDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDateRange(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Showing {filteredTemplates.length} of {reportTemplates.length} templates
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Report Templates Grid */}
        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
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
            ))}
          </Grid>
        ) : filteredTemplates.length === 0 ? (
          <Alert severity="info">
            No report templates found. {selectedCategory !== 'all' && 'Try changing the category filter.'}
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {filteredTemplates.map((template) => (
              <Grid item xs={12} md={6} lg={4} key={template._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {getIcon(template.category)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" component="div">
                          {template.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {template.category}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
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
                      <Chip
                        label={template.format}
                        variant="outlined"
                        size="small"
                        color="info"
                      />
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
                      startIcon={<ReportIcon />}
                      onClick={() => handleGenerateReport(template)}
                    >
                      Generate Report
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Asset Summary Section */}
        {assetSummary && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              Asset Summary
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CategoryIcon />
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
                          {assetSummary.byCategory?.map((item) => (
                            <TableRow key={item.category}>
                              <TableCell>{item.category}</TableCell>
                              <TableCell align="right">{item.count}</TableCell>
                              <TableCell align="right">
                                ₹{(item.value / 100000).toFixed(1)}L
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationIcon />
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
                          {assetSummary.byLocation?.map((item) => (
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
            </Grid>
          </Box>
        )}
      </Box>
    </DashboardLayout>
  );
};

export default ReportsPage;
