import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  AccountBalance as ValueIcon,
  Approval as ApprovalIcon,
  Delete as ScrapIcon,
  ShoppingCart as PurchaseIcon,
  PersonAdd,
  Backup,
  Assessment,
  Settings,
  Visibility,
  Edit,
  Refresh,
  Security,
  CloudDownload,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { dashboardDataService } from '../../services/dashboardData.service';
import { UserRole } from '../../types';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, color = 'primary' }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="overline">
            {title}
          </Typography>
          <Typography variant="h4" component="h2" sx={{ mb: 1 }}>
            {value}
          </Typography>
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {trend.isPositive ? (
                <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} />
              ) : (
                <TrendingDown sx={{ color: 'error.main', mr: 0.5 }} />
              )}
              <Typography
                variant="body2"
                sx={{
                  color: trend.isPositive ? 'success.main' : 'error.main',
                }}
              >
                {trend.value}%
              </Typography>
            </Box>
          )}
        </Box>
        <Avatar
          sx={{
            backgroundColor: `${color}.main`,
            height: 56,
            width: 56,
          }}
        >
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

const QuickActionCard: React.FC<QuickActionProps> = ({ title, description, icon, onClick, color = 'primary' }) => (
  <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={onClick}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
        <Avatar
          sx={{
            backgroundColor: `${color}.main`,
            mr: 2,
            mt: 0.5,
          }}
        >
          {icon}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // State for dynamic data
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalValue: '₹0',
    activeUsers: 0,
    pendingApprovals: 0,
    scrapAssets: 0,
    monthlyPurchase: '₹0'
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  
  const handleApprovalAction = (approvalId: number, action: 'approve' | 'reject') => {
    // In a real app, this would make an API call
    toast.success(`Approval ${action}d successfully!`);
    // Refresh the pending approvals data
    loadDashboardData();
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load dashboard statistics
      const dashboardStats = await dashboardDataService.getDashboardStats(UserRole.ADMIN);
      
      setStats({
        totalAssets: dashboardStats.totalAssets,
        totalValue: `₹${dashboardStats.totalValue.toLocaleString()}`,
        activeUsers: dashboardStats.activeUsers,
        pendingApprovals: dashboardStats.pendingApprovals,
        scrapAssets: 15,
        monthlyPurchase: `₹${dashboardStats.purchaseOrders?.toLocaleString() || '2,45,000'}`
      });

      setRecentActivities([
        {
          user: 'John Smith',
          action: 'Added new asset',
          asset: 'Laptop Dell XPS 13',
          time: '2 hours ago',
          type: 'create',
        },
        {
          user: 'Sarah Johnson',
          action: 'Approved purchase request',
          asset: 'Office Chair x5',
          time: '4 hours ago',
          type: 'approve',
        },
        {
          user: 'Mike Brown',
          action: 'Updated asset location',
          asset: 'Printer HP LaserJet',
          time: '6 hours ago',
          type: 'update',
        },
        {
          user: 'Admin',
          action: 'System backup completed',
          asset: 'Database',
          time: '1 day ago',
          type: 'system',
        },
      ]);

      setPendingApprovals([
        {
          id: 1,
          type: 'Asset Purchase',
          requestor: 'Emma Wilson',
          amount: '₹45,000',
          status: 'pending',
          priority: 'high',
        },
        {
          id: 2,
          type: 'Asset Transfer',
          requestor: 'James Davis',
          amount: '₹15,000',
          status: 'pending',
          priority: 'medium',
        },
        {
          id: 3,
          type: 'Scrap Request',
          requestor: 'Lisa Anderson',
          amount: '₹8,000',
          status: 'pending',
          priority: 'low',
        },
      ]);

    } catch (error) {
      console.error('Error loading admin dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 300000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    toast.info('Refreshing dashboard data...');
    dashboardDataService.refreshCache();
    loadDashboardData();
  };

  const quickActions = [
    {
      title: 'Add New User',
      description: 'Create new user accounts and assign roles',
      icon: <PersonAdd />,
      onClick: () => navigate('/admin/users/add'),
      color: 'primary' as const,
    },
    {
      title: 'System Backup',
      description: 'Create system backup and manage recovery',
      icon: <Backup />,
      onClick: () => navigate('/admin/backups'),
      color: 'secondary' as const,
    },
    {
      title: 'View Audit Logs',
      description: 'Review system activity and user actions',
      icon: <Assessment />,
      onClick: () => navigate('/admin/audit-logs'),
      color: 'success' as const,
    },
    {
      title: 'System Settings',
      description: 'Configure global system preferences',
      icon: <Settings />,
      onClick: () => navigate('/admin/settings'),
      color: 'warning' as const,
    },
    {
      title: 'Export Data',
      description: 'Download system data and generate reports',
      icon: <CloudDownload />,
      onClick: () => {
        toast.info('Preparing data export...');
        // In real app, would trigger data export API
      },
      color: 'primary' as const,
    },
    {
      title: 'Security Audit',
      description: 'Review security logs and user permissions',
      icon: <Security />,
      onClick: () => navigate('/admin/security'),
      color: 'error' as const,
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Admin Dashboard - System Overview
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

        {stats.pendingApprovals > 20 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            You have {stats.pendingApprovals} pending approvals that require attention.
          </Alert>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Total Assets"
              value={stats.totalAssets}
              icon={<InventoryIcon />}
              trend={{ value: 12, isPositive: true }}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Total Asset Value"
              value={stats.totalValue}
              icon={<ValueIcon />}
              trend={{ value: 8, isPositive: true }}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Active Users"
              value={stats.activeUsers}
              icon={<PeopleIcon />}
              trend={{ value: 5, isPositive: true }}
              color="secondary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Pending Approvals"
              value={stats.pendingApprovals}
              icon={<ApprovalIcon />}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Assets Ready for Scrap"
              value={stats.scrapAssets}
              icon={<ScrapIcon />}
              color="error"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Monthly Purchase Value"
              value={stats.monthlyPurchase}
              icon={<PurchaseIcon />}
              trend={{ value: 15, isPositive: true }}
              color="primary"
            />
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
              <QuickActionCard {...action} />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Recent Activities */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent System Activities
              </Typography>
              <List>
                {recentActivities.map((activity, index) => (
                  <ListItem key={index} divider={index < recentActivities.length - 1}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {activity.user[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box>
                          <Typography component="span" sx={{ fontWeight: 'medium' }}>
                            {activity.user}
                          </Typography>
                          {' '}{activity.action}{' '}
                          <Typography component="span" sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                            {activity.asset}
                          </Typography>
                        </Box>
                      }
                      secondary={activity.time}
                    />
                    <Chip
                      label={activity.type}
                      size="small"
                      color={
                        activity.type === 'create' ? 'success' :
                        activity.type === 'approve' ? 'primary' :
                        activity.type === 'update' ? 'warning' : 'default'
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Pending Approvals */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Pending Approvals
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingApprovals.map((approval) => (
                      <TableRow key={approval.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {approval.type}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {approval.requestor}
                          </Typography>
                        </TableCell>
                        <TableCell>{approval.amount}</TableCell>
                        <TableCell>
                          <Chip
                            label={approval.priority}
                            size="small"
                            color={
                              approval.priority === 'high' ? 'error' :
                              approval.priority === 'medium' ? 'warning' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => navigate(`/approvals/${approval.id}`)}
                          >
                            <Visibility />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="success"
                            onClick={() => handleApprovalAction(approval.id, 'approve')}
                          >
                            <Edit />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => navigate('/approvals')}
              >
                View All Approvals
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
};

export default AdminDashboard;