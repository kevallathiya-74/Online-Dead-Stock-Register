import React, { useState } from 'react';
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
  IconButton,
  Button,
  Chip,
  Avatar,
} from '@mui/material';
import {

  People as UsersIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Layout from '../../layout/Layout';
import StatCard from '../StatCard';
import ChartComponent from '../ChartComponent';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    totalAssets: 1450,
    totalValue: 2500000,
    activeAssets: 1250,
    scrapReadyAssets: 15,
    openApprovals: 8,
    totalUsers: 124,
    activeUsers: 118,
    systemAlerts: 3,
  });

  const [recentAuditLogs, setRecentAuditLogs] = useState([
    {
      id: 1,
      action: 'Asset Created',
      user: 'John Smith',
      entity: 'Laptop Dell XPS 15',
      timestamp: new Date().toISOString(),
      status: 'success'
    },
    {
      id: 2,
      action: 'User Role Changed',
      user: 'Admin',
      entity: 'Jane Doe -> Inventory Manager',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'warning'
    },
    {
      id: 3,
      action: 'Asset Transfer',
      user: 'Mike Johnson',
      entity: 'Monitor Samsung 24" -> IT Dept',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      status: 'info'
    },
  ]);

  const [notificationFailures, setNotificationFailures] = useState([
    {
      id: 1,
      type: 'Email Failed',
      recipient: 'user@company.com',
      reason: 'SMTP Connection Failed',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 2,
      type: 'SMS Failed', 
      recipient: '+1234567890',
      reason: 'Invalid Phone Number',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
  ]);

  // Sample chart data for admin overview
  const assetTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Total Assets',
        data: [1200, 1250, 1300, 1350, 1400, 1450],
        borderColor: '#2196f3',
        backgroundColor: '#2196f320',
      },
      {
        label: 'Asset Value ($)',
        data: [2200000, 2250000, 2300000, 2400000, 2450000, 2500000],
        borderColor: '#4caf50',
        backgroundColor: '#4caf5020',
        yAxisID: 'y1',
      },
    ],
  };

  const userActivityData = {
    labels: ['Active', 'Inactive', 'Pending', 'Suspended'],
    datasets: [
      {
        label: 'User Status Distribution',
        data: [118, 6, 3, 2],
        backgroundColor: ['#4caf50', '#ff9800', '#2196f3', '#f44336'],
      },
    ],
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#4caf50';
      case 'warning': return '#ff9800';
      case 'error': return '#f44336';
      default: return '#2196f3';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckIcon sx={{ fontSize: 16 }} />;
      case 'warning': return <WarningIcon sx={{ fontSize: 16 }} />;
      case 'error': return <ErrorIcon sx={{ fontSize: 16 }} />;
      default: return <NotificationsIcon sx={{ fontSize: 16 }} />;
    }
  };

  return (
    <Layout title="Admin Dashboard">
      <Grid container spacing={3}>
        {/* KPI Cards Row */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Assets"
            value={dashboardData.totalAssets.toLocaleString()}
            subtitle={`${dashboardData.activeAssets} active, ${dashboardData.scrapReadyAssets} ready for scrap`}
            progress={Math.round((dashboardData.activeAssets / dashboardData.totalAssets) * 100)}
            progressColor="primary"
            icon={<TrendingUpIcon />}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Asset Value"
            value={`₹${(dashboardData.totalValue / 1000000).toFixed(1)}M`}
            subtitle="15% increase from last month"
            progress={85}
            progressColor="success"
            icon={<TrendingUpIcon />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="System Users"
            value={dashboardData.totalUsers}
            subtitle={`${dashboardData.activeUsers} active users`}
            progress={Math.round((dashboardData.activeUsers / dashboardData.totalUsers) * 100)}
            progressColor="info"
            icon={<UsersIcon />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Approvals"
            value={dashboardData.openApprovals}
            subtitle="3 urgent, 5 normal priority"
            progress={dashboardData.openApprovals > 10 ? 90 : (dashboardData.openApprovals * 10)}
            progressColor={dashboardData.openApprovals > 10 ? "error" : "warning"}
            icon={<WarningIcon />}
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
                  onClick={() => navigate('/users')}
                  sx={{ py: 1.5 }}
                >
                  User Management
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={() => navigate('/settings')}
                  sx={{ py: 1.5 }}
                >
                  System Settings
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SecurityIcon />}
                  onClick={() => navigate('/audit')}
                  sx={{ py: 1.5 }}
                >
                  Security Audit
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<NotificationsIcon />}
                  onClick={() => navigate('/notifications')}
                  sx={{ py: 1.5 }}
                >
                  Notifications
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Charts Row */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <ChartComponent
              title="Asset & Value Trends"
              type="line"
              data={assetTrendData}
              height={350}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <ChartComponent
              title="User Status Distribution"
              type="bar"
              data={userActivityData}
              height={350}
            />
          </Paper>
        </Grid>

        {/* Audit Logs Section */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Audit Logs</Typography>
                <Button size="small" onClick={() => navigate('/audit')}>
                  View All
                </Button>
              </Box>
              <List>
                {recentAuditLogs.map((log) => (
                  <ListItem key={log.id} divider>
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          bgcolor: getStatusColor(log.status) + '20',
                          color: getStatusColor(log.status),
                          width: 32,
                          height: 32,
                        }}
                      >
                        {getStatusIcon(log.status)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={log.action}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {log.entity}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            by {log.user} • {new Date(log.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Failures Section */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Notification Failures</Typography>
                <Chip 
                  label={notificationFailures.length} 
                  color="error" 
                  size="small"
                />
              </Box>
              <List>
                {notificationFailures.map((failure) => (
                  <ListItem key={failure.id} divider>
                    <ListItemText
                      primary={failure.type}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {failure.recipient}
                          </Typography>
                          <Typography variant="caption" color="error">
                            {failure.reason}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {new Date(failure.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <IconButton size="small">
                      <MoreVertIcon />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
              {notificationFailures.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                  No recent notification failures
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* System Health Row */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              System Health Status
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography variant="h6">Database</Typography>
                  <Typography variant="body2" color="success.main">Operational</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography variant="h6">API Services</Typography>
                  <Typography variant="body2" color="success.main">Healthy</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <WarningIcon sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h6">Email Service</Typography>
                  <Typography variant="body2" color="warning.main">Degraded</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography variant="h6">File Storage</Typography>
                  <Typography variant="body2" color="success.main">Available</Typography>
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