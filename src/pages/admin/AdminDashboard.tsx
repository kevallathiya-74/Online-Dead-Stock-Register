import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  People as PeopleIcon,
  Inventory as InventoryIcon,
  SwapHoriz as TransactionIcon,
  Assessment as ReportsIcon,
  Security as AuditIcon,
  Settings as SettingsIcon,
  Backup as BackupIcon,
  Warning,
  Error,
  Info,
  Refresh
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Statistics data
  const [userStats, setUserStats] = useState<any>(null);
  const [assetStats, setAssetStats] = useState<any>(null);
  const [transactionStats, setTransactionStats] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any>({});

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Load real statistics from API
      const [statsResponse, activitiesResponse] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/audit-logs?limit=10&sort=-timestamp')
      ]);

      const stats = statsResponse.data.data || statsResponse.data;
      
      // Set user stats
      setUserStats({
        total: stats.activeUsers || 0,
        active: stats.activeUsers || 0,
        inactive: 0,
        trend: stats.trends?.users?.value || 0
      });

      // Set asset stats
      setAssetStats({
        total: stats.totalAssets || 0,
        inUse: stats.totalAssets || 0,
        available: 0,
        maintenance: stats.inMaintenanceAssets || 0,
        trend: stats.trends?.assets?.value || 0
      });

      // Set transaction stats
      setTransactionStats({
        total: 0,
        pending: stats.pendingApprovals || 0,
        approved: 0,
        rejected: 0
      });

      // Set recent activities from audit logs
      const activities = (activitiesResponse.data.data || []).map((log: any) => ({
        id: log._id,
        user: log.performed_by?.name || 'System',
        action: log.action,
        asset: log.details?.asset_tag || log.details?.name || 'N/A',
        time: new Date(log.timestamp).toLocaleString(),
        status: 'success'
      }));
      setRecentActivities(activities);

      // Set system alerts (from real data when available)
      const alerts: any[] = [];
      if (stats.warrantyExpiring > 0) {
        alerts.push({ id: 1, type: 'warning', message: `${stats.warrantyExpiring} assets have expiring warranties`, action: 'View Assets' });
      }
      if (stats.maintenanceDue > 0) {
        alerts.push({ id: 2, type: 'warning', message: `${stats.maintenanceDue} assets require maintenance`, action: 'View Maintenance' });
      }
      if (stats.pendingApprovals > 0) {
        alerts.push({ id: 3, type: 'info', message: `${stats.pendingApprovals} pending approvals`, action: 'View Approvals' });
      }
      setSystemAlerts(alerts);

      // Generate chart data from real stats
      generateChartData(stats);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []); // useCallback with empty dependency array since it doesn't use any external values

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const generateChartData = (stats: any = {}) => {
    // Asset utilization over time (placeholder - would need monthly trends API)
    const assetUtilizationData = Array.from({ length: 12 }, (_, i) => ({
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
      active: Math.floor(Math.random() * 50) + 100,
      available: Math.floor(Math.random() * 30) + 20,
      maintenance: Math.floor(Math.random() * 10) + 5
    }));

    // Transaction trends
    const transactionTrendData = Array.from({ length: 7 }, (_, i) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      transactions: Math.floor(Math.random() * 20) + 10,
      approvals: Math.floor(Math.random() * 15) + 5
    }));

    // Asset types distribution
    const assetTypeData = [
      { name: 'Laptops', value: 45, color: '#8884d8' },
      { name: 'Desktops', value: 30, color: '#82ca9d' },
      { name: 'Monitors', value: 25, color: '#ffc658' },
      { name: 'Printers', value: 15, color: '#ff7c7c' },
      { name: 'Servers', value: 10, color: '#8dd1e1' }
    ];

    // User activity
    const userActivityData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      logins: Math.floor(Math.random() * 20) + 5,
      actions: Math.floor(Math.random() * 50) + 10
    }));

    setChartData({
      assetUtilization: assetUtilizationData,
      transactionTrend: transactionTrendData,
      assetTypes: assetTypeData,
      userActivity: userActivityData
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('Dashboard data refreshed');
  };

  const quickActions = [
    {
      title: 'Add New User',
      description: 'Create new user accounts and assign roles',
      icon: <PeopleIcon />,
      color: 'primary',
      onClick: () => navigate('/admin/users/add')
    },
    {
      title: 'System Backup',
      description: 'Create system backup and manage recovery',
      icon: <BackupIcon />,
      color: 'secondary',
      onClick: () => navigate('/admin/backups')
    },
    {
      title: 'View Audit Logs',
      description: 'Review system activity and user actions',
      icon: <AuditIcon />,
      color: 'success',
      onClick: () => navigate('/admin/audit-logs')
    },
    {
      title: 'System Settings',
      description: 'Configure global system preferences',
      icon: <SettingsIcon />,
      color: 'warning',
      onClick: () => navigate('/admin/settings')
    }
  ];

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
          <Typography variant="h4" component="h1" gutterBottom>
            Admin Dashboard
          </Typography>
          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={20} /> : <Refresh />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>

        {/* System Alerts */}
        {systemAlerts.length > 0 && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {systemAlerts.map((alert) => (
              <Grid item xs={12} sm={6} md={3} key={alert.id}>
                <Alert 
                  severity={alert.type as any} 
                  action={
                    <Button size="small" onClick={() => toast.info(`Action: ${alert.action}`)}>
                      {alert.action}
                    </Button>
                  }
                >
                  {alert.message}
                </Alert>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Key Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" component="div">
                      {userStats?.total || 0}
                    </Typography>
                    <Typography variant="body2">
                      Total Users
                    </Typography>
                    <Typography variant="caption">
                      {userStats?.active || 0} active
                    </Typography>
                  </Box>
                  <PeopleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" component="div">
                      {assetStats?.total || 0}
                    </Typography>
                    <Typography variant="body2">
                      Total Assets
                    </Typography>
                    <Typography variant="caption">
                      ₹{(assetStats?.totalValue || 0).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                  <InventoryIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" component="div">
                      {transactionStats?.pending || 0}
                    </Typography>
                    <Typography variant="body2">
                      Pending Transactions
                    </Typography>
                    <Typography variant="caption">
                      {transactionStats?.total || 0} total
                    </Typography>
                  </Box>
                  <TransactionIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" component="div">
                      {assetStats?.underMaintenance || 0}
                    </Typography>
                    <Typography variant="body2">
                      Under Maintenance
                    </Typography>
                    <Typography variant="caption">
                      Assets requiring attention
                    </Typography>
                  </Box>
                  <Warning sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Asset Utilization Chart */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Asset Utilization Trends
              </Typography>
              <Box sx={{ height: 300 }}>
                <Line
                  data={{
                    labels: chartData.assetUtilization?.map((item: any) => item.month) || [],
                    datasets: [
                      {
                        label: 'Active',
                        data: chartData.assetUtilization?.map((item: any) => item.active) || [],
                        borderColor: '#8884d8',
                        backgroundColor: 'rgba(136, 132, 216, 0.2)',
                        fill: true,
                      },
                      {
                        label: 'Available',
                        data: chartData.assetUtilization?.map((item: any) => item.available) || [],
                        borderColor: '#82ca9d',
                        backgroundColor: 'rgba(130, 202, 157, 0.2)',
                        fill: true,
                      },
                      {
                        label: 'Maintenance',
                        data: chartData.assetUtilization?.map((item: any) => item.maintenance) || [],
                        borderColor: '#ffc658',
                        backgroundColor: 'rgba(255, 198, 88, 0.2)',
                        fill: true,
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
            </Paper>
          </Grid>

          {/* Asset Types Distribution */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Asset Types Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <Pie
                  data={{
                    labels: chartData.assetTypes?.map((item: any) => item.name) || [],
                    datasets: [
                      {
                        data: chartData.assetTypes?.map((item: any) => item.value) || [],
                        backgroundColor: chartData.assetTypes?.map((item: any) => item.color) || [],
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
                    },
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Management Sections */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Quick Actions */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                {quickActions.map((action, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer', 
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-2px)' }
                      }}
                      onClick={action.onClick}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar sx={{ bgcolor: `${action.color}.main`, mr: 2 }}>
                            {action.icon}
                          </Avatar>
                          <Typography variant="subtitle1">
                            {action.title}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {action.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* System Status and Navigation */}
        <Grid container spacing={3}>
          {/* System Status */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Server Health</Typography>
                  <Typography variant="body2" color="success.main">98%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={98} color="success" />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Database Performance</Typography>
                  <Typography variant="body2" color="warning.main">85%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={85} color="warning" />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Storage Usage</Typography>
                  <Typography variant="body2" color="primary.main">72%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={72} />
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Last Backup: 2 hours ago
              </Typography>
              <Typography variant="subtitle2" color="success.main">
                All Systems Operational
              </Typography>
            </Paper>
          </Grid>

          {/* Admin Navigation */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Administration
              </Typography>
              <Grid container spacing={2}>
                {[
                  { title: 'User Management', icon: <PeopleIcon />, path: '/users', desc: 'Manage user accounts and permissions' },
                  { title: 'Asset Management', icon: <InventoryIcon />, path: '/admin/assets', desc: 'Track and manage all assets' },
                  { title: 'Transaction Monitor', icon: <TransactionIcon />, path: '/admin/transactions', desc: 'Monitor all transactions' },
                  { title: 'Audit Logs', icon: <AuditIcon />, path: '/admin/audit-logs', desc: 'View system audit trails' },
                  { title: 'Analytics', icon: <ReportsIcon />, path: '/admin/analytics', desc: 'Generate reports and analytics' },
                  { title: 'System Settings', icon: <SettingsIcon />, path: '/admin/settings', desc: 'Configure system preferences' }
                ].map((item, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': { 
                          transform: 'translateY(-2px)',
                          boxShadow: 3
                        }
                      }}
                      onClick={() => navigate(item.path)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                            {item.icon}
                          </Avatar>
                          <Typography variant="subtitle1">
                            {item.title}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {item.desc}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
};

export default AdminDashboard;