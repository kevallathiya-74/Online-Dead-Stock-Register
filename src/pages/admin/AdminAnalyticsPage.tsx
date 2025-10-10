import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  LinearProgress,
  CircularProgress,
  Divider,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  ChartLegend,
  ArcElement
);

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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminAnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [dateRange, setDateRange] = useState('30d');
  const [reportDialog, setReportDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState('');

  // Analytics data
  const [assetTrends, setAssetTrends] = useState<any[]>([]);
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const [financialMetrics, setFinancialMetrics] = useState<any[]>([]);
  const [systemPerformance, setSystemPerformance] = useState<any[]>([]);
  const [departmentStats, setDepartmentStats] = useState<any[]>([]);
  const [alertsData, setAlertsData] = useState<any[]>([]);
  const [topAssets, setTopAssets] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>({});

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate comprehensive analytics data
      const mockAssetTrends = [
        { month: 'Jan', active: 120, maintenance: 15, damaged: 8, purchased: 25, retired: 5 },
        { month: 'Feb', active: 125, maintenance: 12, damaged: 6, purchased: 18, retired: 3 },
        { month: 'Mar', active: 130, maintenance: 18, damaged: 10, purchased: 22, retired: 7 },
        { month: 'Apr', active: 135, maintenance: 14, damaged: 5, purchased: 20, retired: 4 },
        { month: 'May', active: 140, maintenance: 16, damaged: 9, purchased: 28, retired: 6 },
        { month: 'Jun', active: 145, maintenance: 11, damaged: 7, purchased: 15, retired: 2 },
        { month: 'Jul', active: 148, maintenance: 20, damaged: 12, purchased: 24, retired: 8 },
        { month: 'Aug', active: 150, maintenance: 19, damaged: 11, purchased: 19, retired: 5 },
        { month: 'Sep', active: 152, maintenance: 17, damaged: 8, purchased: 21, retired: 4 },
        { month: 'Oct', active: 150, maintenance: 28, damaged: 14, purchased: 16, retired: 9 }
      ];

      const mockUserActivity = [
        { day: 'Mon', logins: 45, actions: 230, errors: 3 },
        { day: 'Tue', logins: 52, actions: 280, errors: 1 },
        { day: 'Wed', logins: 48, actions: 250, errors: 2 },
        { day: 'Thu', logins: 55, actions: 320, errors: 4 },
        { day: 'Fri', logins: 60, actions: 340, errors: 2 },
        { day: 'Sat', logins: 25, actions: 120, errors: 1 },
        { day: 'Sun', logins: 20, actions: 90, errors: 0 }
      ];

      const mockFinancialMetrics = [
        { quarter: 'Q1', purchases: 125000, maintenance: 25000, depreciation: 15000, savings: 8000 },
        { quarter: 'Q2', purchases: 98000, maintenance: 32000, depreciation: 18000, savings: 12000 },
        { quarter: 'Q3', purchases: 145000, maintenance: 28000, depreciation: 22000, savings: 15000 },
        { quarter: 'Q4', purchases: 110000, maintenance: 35000, depreciation: 20000, savings: 10000 }
      ];

      const mockSystemPerformance = [
        { time: '00:00', cpu: 25, memory: 45, disk: 60, network: 30 },
        { time: '04:00', cpu: 20, memory: 40, disk: 58, network: 25 },
        { time: '08:00', cpu: 65, memory: 70, disk: 62, network: 80 },
        { time: '12:00', cpu: 80, memory: 75, disk: 65, network: 90 },
        { time: '16:00', cpu: 85, memory: 80, disk: 68, network: 95 },
        { time: '20:00', cpu: 45, memory: 55, disk: 63, network: 40 },
        { time: '24:00', cpu: 30, memory: 48, disk: 61, network: 35 }
      ];

      const mockDepartmentStats = [
        { name: 'IT', assets: 45, value: 180000, utilization: 92 },
        { name: 'Finance', assets: 25, value: 95000, utilization: 78 },
        { name: 'HR', assets: 15, value: 65000, utilization: 85 },
        { name: 'Operations', assets: 35, value: 140000, utilization: 88 },
        { name: 'Marketing', assets: 20, value: 75000, utilization: 72 },
        { name: 'Security', assets: 10, value: 45000, utilization: 95 }
      ];

      const mockAlerts = [
        { type: 'critical', count: 3, trend: 'up' },
        { type: 'warning', count: 8, trend: 'down' },
        { type: 'info', count: 15, trend: 'stable' }
      ];

      const mockTopAssets = [
        { id: 'AST-10001', name: 'Dell Laptop XPS', value: 1200, utilization: 95, status: 'Active' },
        { id: 'AST-10005', name: 'HP Server ProLiant', value: 5500, utilization: 88, status: 'Active' },
        { id: 'AST-10012', name: 'Canon Printer MX', value: 450, utilization: 76, status: 'Active' },
        { id: 'AST-10008', name: 'Apple MacBook Pro', value: 2200, utilization: 92, status: 'Active' },
        { id: 'AST-10015', name: 'Cisco Router 2900', value: 800, utilization: 85, status: 'Active' }
      ];

      setAssetTrends(mockAssetTrends);
      setUserActivity(mockUserActivity);
      setFinancialMetrics(mockFinancialMetrics);
      setSystemPerformance(mockSystemPerformance);
      setDepartmentStats(mockDepartmentStats);
      setAlertsData(mockAlerts);
      setTopAssets(mockTopAssets);
      
      setKpis({
        totalAssets: 150,
        totalValue: 578000,
        avgUtilization: 86,
        monthlyGrowth: 5.2,
        costSavings: 45000,
        maintenanceCost: 120000,
        activeUsers: 24,
        systemUptime: 99.8
      });

    } catch (error) {
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleGenerateReport = (reportType: string) => {
    setSelectedReport(reportType);
    setReportDialog(true);
  };

  const handleExportReport = (format: string) => {
    toast.success(`Exporting ${selectedReport} report as ${format}`);
    setReportDialog(false);
  };

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Analytics & Reports
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Comprehensive data insights and performance analytics
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateRange}
                label="Date Range"
                onChange={(e) => setDateRange(e.target.value as string)}
              >
                <MenuItem value="7d">Last 7 days</MenuItem>
                <MenuItem value="30d">Last 30 days</MenuItem>
                <MenuItem value="90d">Last 90 days</MenuItem>
                <MenuItem value="1y">Last year</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadAnalyticsData}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => handleGenerateReport('comprehensive')}
            >
              Generate Report
            </Button>
          </Box>
        </Box>

        {/* Key Performance Indicators */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4">{kpis.totalAssets}</Typography>
                    <Typography variant="body2">Total Assets</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      <Typography variant="caption">+{kpis.monthlyGrowth}% this month</Typography>
                    </Box>
                  </Box>
                  <InventoryIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4">${(kpis.totalValue / 1000).toFixed(0)}K</Typography>
                    <Typography variant="body2">Total Asset Value</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      <Typography variant="caption">+8% from last quarter</Typography>
                    </Box>
                  </Box>
                  <MoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4">{kpis.avgUtilization}%</Typography>
                    <Typography variant="body2">Avg Utilization</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      <Typography variant="caption">Excellent performance</Typography>
                    </Box>
                  </Box>
                  <AssessmentIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4">{kpis.systemUptime}%</Typography>
                    <Typography variant="body2">System Uptime</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      <Typography variant="caption">All systems operational</Typography>
                    </Box>
                  </Box>
                  <TimelineIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Analytics Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<InventoryIcon />} label="Asset Analytics" />
            <Tab icon={<PeopleIcon />} label="User Activity" />
            <Tab icon={<MoneyIcon />} label="Financial Reports" />
            <Tab icon={<TimelineIcon />} label="Performance" />
            <Tab icon={<AssessmentIcon />} label="Department Stats" />
          </Tabs>
        </Paper>

        {/* Asset Analytics Tab */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Asset Trends Over Time
                  </Typography>
                  <Box sx={{ height: 400 }}>
                    <Line
                      data={{
                        labels: assetTrends?.map((item: any) => item.month) || [],
                        datasets: [
                          {
                            label: 'Active',
                            data: assetTrends?.map((item: any) => item.active) || [],
                            borderColor: '#8884d8',
                            backgroundColor: 'rgba(136, 132, 216, 0.2)',
                            fill: true,
                          },
                          {
                            label: 'Maintenance',
                            data: assetTrends?.map((item: any) => item.maintenance) || [],
                            borderColor: '#82ca9d',
                            backgroundColor: 'rgba(130, 202, 157, 0.2)',
                            fill: true,
                          },
                          {
                            label: 'Damaged',
                            data: assetTrends?.map((item: any) => item.damaged) || [],
                            borderColor: '#ffc658',
                            backgroundColor: 'rgba(255, 198, 88, 0.2)',
                            fill: true,
                          },
                          {
                            label: 'Purchased',
                            data: assetTrends?.map((item: any) => item.purchased) || [],
                            borderColor: '#ff7300',
                            backgroundColor: 'rgba(255, 115, 0, 0.1)',
                            borderWidth: 3,
                            fill: false,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top' as const,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Performing Assets
                  </Typography>
                  <List>
                    {topAssets.map((asset, index) => (
                      <ListItem key={asset.id}>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: colors[index % colors.length], width: 32, height: 32 }}>
                            {index + 1}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={asset.name}
                          secondary={
                            <Box>
                              <Typography variant="caption">
                                Utilization: {asset.utilization}%
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={asset.utilization}
                                sx={{ mt: 0.5 }}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Asset Health Alerts
                  </Typography>
                  {alertsData.map((alert) => (
                    <Box key={alert.type} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {alert.type} Alerts
                        </Typography>
                        <Chip
                          label={alert.count}
                          color={alert.type === 'critical' ? 'error' : alert.type === 'warning' ? 'warning' : 'info'}
                          size="small"
                        />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={alert.count * 4}
                        color={alert.type === 'critical' ? 'error' : alert.type === 'warning' ? 'warning' : 'info'}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* User Activity Tab */}
        <TabPanel value={currentTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Daily User Activity
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Bar
                      data={{
                        labels: userActivity?.map((item: any) => item.day) || [],
                        datasets: [
                          {
                            label: 'Logins',
                            data: userActivity?.map((item: any) => item.logins) || [],
                            backgroundColor: '#8884d8',
                          },
                          {
                            label: 'Actions',
                            data: userActivity?.map((item: any) => item.actions) || [],
                            backgroundColor: '#82ca9d',
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top' as const,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    System Errors
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Line
                      data={{
                        labels: userActivity?.map((item: any) => item.day) || [],
                        datasets: [
                          {
                            label: 'Errors',
                            data: userActivity?.map((item: any) => item.errors) || [],
                            borderColor: '#ff7300',
                            backgroundColor: 'rgba(255, 115, 0, 0.1)',
                            borderWidth: 3,
                            fill: false,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top' as const,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Financial Reports Tab */}
        <TabPanel value={currentTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Financial Metrics by Quarter
                  </Typography>
                  <Box sx={{ height: 400 }}>
                    <Bar
                      data={{
                        labels: financialMetrics?.map((item: any) => item.quarter) || [],
                        datasets: [
                          {
                            label: 'Purchases',
                            data: financialMetrics?.map((item: any) => item.purchases) || [],
                            backgroundColor: '#8884d8',
                          },
                          {
                            label: 'Maintenance',
                            data: financialMetrics?.map((item: any) => item.maintenance) || [],
                            backgroundColor: '#82ca9d',
                          },
                          {
                            label: 'Depreciation',
                            data: financialMetrics?.map((item: any) => item.depreciation) || [],
                            backgroundColor: '#ffc658',
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top' as const,
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context: any) {
                                return `${context.dataset.label}: $${context.raw.toLocaleString()}`;
                              }
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Cost Breakdown
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2">Purchase Costs</Typography>
                    <Typography variant="h5" color="primary.main">
                      ${(kpis.totalValue / 1000).toFixed(0)}K
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2">Maintenance Costs</Typography>
                    <Typography variant="h5" color="warning.main">
                      ${(kpis.maintenanceCost / 1000).toFixed(0)}K
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2">Cost Savings</Typography>
                    <Typography variant="h5" color="success.main">
                      ${(kpis.costSavings / 1000).toFixed(0)}K
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleGenerateReport('financial')}
                  >
                    Generate Financial Report
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Performance Tab */}
        <TabPanel value={currentTab} index={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Performance Metrics (24 Hours)
              </Typography>
              <Box sx={{ height: 400 }}>
                <Line
                  data={{
                    labels: systemPerformance?.map((item: any) => item.time) || [],
                    datasets: [
                      {
                        label: 'CPU',
                        data: systemPerformance?.map((item: any) => item.cpu) || [],
                        borderColor: '#8884d8',
                        backgroundColor: 'rgba(136, 132, 216, 0.1)',
                        borderWidth: 2,
                        fill: false,
                      },
                      {
                        label: 'Memory',
                        data: systemPerformance?.map((item: any) => item.memory) || [],
                        borderColor: '#82ca9d',
                        backgroundColor: 'rgba(130, 202, 157, 0.1)',
                        borderWidth: 2,
                        fill: false,
                      },
                      {
                        label: 'Disk',
                        data: systemPerformance?.map((item: any) => item.disk) || [],
                        borderColor: '#ffc658',
                        backgroundColor: 'rgba(255, 198, 88, 0.1)',
                        borderWidth: 2,
                        fill: false,
                      },
                      {
                        label: 'Network',
                        data: systemPerformance?.map((item: any) => item.network) || [],
                        borderColor: '#ff7300',
                        backgroundColor: 'rgba(255, 115, 0, 0.1)',
                        borderWidth: 2,
                        fill: false,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context: any) {
                            return `${context.dataset.label}: ${context.raw}%`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Department Stats Tab */}
        <TabPanel value={currentTab} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Department</TableCell>
                      <TableCell align="right">Assets</TableCell>
                      <TableCell align="right">Total Value</TableCell>
                      <TableCell align="right">Utilization</TableCell>
                      <TableCell>Performance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {departmentStats.map((dept) => (
                      <TableRow key={dept.name}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                              {dept.name.charAt(0)}
                            </Avatar>
                            {dept.name}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{dept.assets}</TableCell>
                        <TableCell align="right">${dept.value.toLocaleString()}</TableCell>
                        <TableCell align="right">{dept.utilization}%</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LinearProgress
                              variant="determinate"
                              value={dept.utilization}
                              sx={{ width: 100, mr: 1 }}
                            />
                            <Chip
                              label={dept.utilization >= 90 ? 'Excellent' : dept.utilization >= 80 ? 'Good' : 'Fair'}
                              color={dept.utilization >= 90 ? 'success' : dept.utilization >= 80 ? 'primary' : 'warning'}
                              size="small"
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Department Distribution
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Pie
                      data={{
                        labels: departmentStats?.map((item: any) => item.name) || [],
                        datasets: [
                          {
                            data: departmentStats?.map((item: any) => item.assets) || [],
                            backgroundColor: departmentStats?.map((item: any, index: number) => {
                              const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f'];
                              return colors[index % colors.length];
                            }) || [],
                            borderWidth: 1,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom' as const,
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context: any) {
                                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                                const percentage = ((context.raw / total) * 100).toFixed(0);
                                return `${context.label}: ${percentage}%`;
                              }
                            }
                          }
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Report Generation Dialog */}
        <Dialog open={reportDialog} onClose={() => setReportDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Generate {selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} Report
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Choose the format for your analytics report:
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExportReport('PDF')}
                >
                  PDF
                </Button>
              </Grid>
              <Grid item xs={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExportReport('Excel')}
                >
                  Excel
                </Button>
              </Grid>
              <Grid item xs={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<EmailIcon />}
                  onClick={() => handleExportReport('Email')}
                >
                  Email
                </Button>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReportDialog(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default AdminAnalyticsPage;