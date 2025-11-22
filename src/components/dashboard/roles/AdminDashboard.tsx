import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  People as UsersIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  CurrencyRupee as MoneyIcon,
  Assignment as ApprovalIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-toastify';
import Layout from '../../layout/Layout';
import StatCard from '../StatCard';
import ChartComponent from '../ChartComponent';
import api from '../../../services/api';

// TypeScript interfaces
interface DashboardStats {
  totalAssets: number;
  totalValue: number;
  activeUsers: number;
  pendingApprovals: number;
  scrapAssets: number;
  monthlyPurchase: number;
  trends: {
    assets: { value: number; isPositive: boolean };
    value: { value: number; isPositive: boolean };
    users: { value: number; isPositive: boolean };
    purchase: { value: number; isPositive: boolean };
  };
  systemHealth: {
    serverHealth: number;
    databasePerformance: number;
    storageUsage: number;
    lastBackup: string;
  };
}

interface RecentActivity {
  _id: string;
  action: string;
  user: { name: string; email: string };
  entity_type: string;
  description: string;
  severity: string;
  timestamp: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  // RBAC: Verify user has ADMIN role
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      toast.error('Access denied. Admin privileges required.');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch all dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch stats and activities in parallel
        const [statsResponse, activitiesResponse] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/activities').catch(() => ({ data: { success: false, data: [] } }))
        ]);

        if (statsResponse.data.success) {
          setStats(statsResponse.data.data);
        } else {
          throw new Error('Failed to fetch dashboard statistics');
        }

        if (activitiesResponse.data.success) {
          setRecentActivities(activitiesResponse.data.data.slice(0, 5));
        }

      } catch (err: unknown) {
        setError((err as any).response?.data?.error || 'Failed to load dashboard data');
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Helper functions for UI
  const getSeverityColor = (severity: string): 'error' | 'warning' | 'info' | 'success' => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'success';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'error':
        return <ErrorIcon sx={{ fontSize: 16 }} />;
      case 'warning':
        return <WarningIcon sx={{ fontSize: 16 }} />;
      default:
        return <CheckIcon sx={{ fontSize: 16 }} />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <Layout title="Admin Dashboard">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Layout>
    );
  }

  // Error state
  if (error || !stats) {
    return (
      <Layout title="Admin Dashboard">
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Failed to load dashboard data'}
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Dashboard">
      <Grid container spacing={3}>
        {/* KPI Cards Row */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Assets"
            value={stats.totalAssets.toLocaleString('en-IN')}
            subtitle={`${stats.scrapAssets} ready for disposal`}
            progress={stats.totalAssets > 0 ? Math.min(100, (stats.totalAssets / 2000) * 100) : 0}
            progressColor="primary"
            icon={<InventoryIcon />}
            trend={stats.trends.assets}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Asset Value"
            value={`₹${stats.totalValue.toLocaleString('en-IN')}`}
            subtitle={`₹${stats.monthlyPurchase.toLocaleString('en-IN')} this month`}
            progress={stats.totalValue > 0 ? Math.min(100, (stats.totalValue / 100000000) * 100) : 0}
            progressColor="success"
            icon={<MoneyIcon />}
            trend={stats.trends.value}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Users"
            value={stats.activeUsers.toLocaleString('en-IN')}
            subtitle="Registered in system"
            progress={stats.activeUsers > 0 ? Math.min(100, (stats.activeUsers / 200) * 100) : 0}
            progressColor="info"
            icon={<UsersIcon />}
            trend={stats.trends.users}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            subtitle="Awaiting action"
            progress={stats.pendingApprovals > 0 ? Math.min(100, stats.pendingApprovals * 10) : 0}
            progressColor={stats.pendingApprovals > 10 ? "error" : "warning"}
            icon={<ApprovalIcon />}
          />
        </Grid>

        {/* Quick Actions Row */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<UsersIcon />}
                  onClick={() => navigate('/admin/users')}
                  sx={{ py: 1.5 }}
                >
                  User Management
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<InventoryIcon />}
                  onClick={() => navigate('/assets')}
                  sx={{ py: 1.5 }}
                >
                  Asset Overview
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SecurityIcon />}
                  onClick={() => navigate('/admin/audit-logs')}
                  sx={{ py: 1.5 }}
                >
                  Audit Logs
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={() => navigate('/admin/settings')}
                  sx={{ py: 1.5 }}
                >
                  System Settings
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Recent Activities Section */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent System Activities</Typography>
                <Button size="small" onClick={() => navigate('/admin/audit-logs')}>
                  View All
                </Button>
              </Box>
              {recentActivities.length > 0 ? (
                <List>
                  {recentActivities.map((activity) => (
                    <ListItem key={activity._id} divider>
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            bgcolor: `${getSeverityColor(activity.severity)}.light`,
                            color: `${getSeverityColor(activity.severity)}.main`,
                            width: 32,
                            height: 32,
                          }}
                        >
                          {getSeverityIcon(activity.severity)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.action}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" component="div">
                              {activity.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" component="div">
                              by {activity.user?.name || 'System'} • {new Date(activity.timestamp).toLocaleString('en-IN')}
                            </Typography>
                          </Box>
                        }
                        primaryTypographyProps={{ component: 'div' }}
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                      <Chip
                        label={activity.severity}
                        color={getSeverityColor(activity.severity)}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                  No recent activities
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* System Health Section */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Health
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">Server Status</Typography>
                  <Chip
                    label={stats.systemHealth.serverHealth === 100 ? 'Healthy' : 'Degraded'}
                    color={stats.systemHealth.serverHealth === 100 ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">Database</Typography>
                  <Chip
                    label={stats.systemHealth.databasePerformance === 100 ? 'Connected' : 'Disconnected'}
                    color={stats.systemHealth.databasePerformance === 100 ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">Storage Usage</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.systemHealth.storageUsage}%
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Last Backup</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.systemHealth.lastBackup}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Monthly Performance Trends
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2}>
                  <Typography variant="h4" color="primary.main">
                    {stats.trends.assets.isPositive ? '+' : '-'}{stats.trends.assets.value}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Asset Growth
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2}>
                  <Typography variant="h4" color="success.main">
                    {stats.trends.value.isPositive ? '+' : '-'}{stats.trends.value.value}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Value Growth
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2}>
                  <Typography variant="h4" color="info.main">
                    {stats.trends.users.isPositive ? '+' : '-'}{stats.trends.users.value}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    User Growth
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2}>
                  <Typography variant="h4" color="warning.main">
                    ₹{stats.monthlyPurchase.toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monthly Purchases
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Layout>
  );
};

export default AdminDashboard;
