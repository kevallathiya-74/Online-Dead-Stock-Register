import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ShoppingCart,
  Inventory,
  AttachMoney,
  Assessment,
  Visibility,
  TrendingUp
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getVendorStats, getRecentOrders } from '../../services/vendorPortal.service';
import type { VendorStats, VendorOrder } from '../../types';
import { format } from 'date-fns';
import DashboardLayout from '../../components/layout/DashboardLayout';

const VendorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, ordersData] = await Promise.all([
        getVendorStats(),
        getRecentOrders()
      ]);
      
      setStats(statsData);
      setRecentOrders(ordersData);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
      case 'acknowledged':
        return 'primary';
      case 'pending_approval':
      case 'approved':
        return 'warning';
      case 'cancelled':
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h4" gutterBottom>
        Vendor Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Welcome back! Here's an overview of your business with us.
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Orders
                  </Typography>
                  <Typography variant="h4">
                    {stats?.totalOrders || 0}
                  </Typography>
                </Box>
                <ShoppingCart sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Pending Orders
                  </Typography>
                  <Typography variant="h4">
                    {stats?.pendingOrders || 0}
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: 'warning.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(stats?.totalRevenue || 0)}
                  </Typography>
                </Box>
                <AttachMoney sx={{ fontSize: 40, color: 'success.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Performance Score
                  </Typography>
                  <Typography variant="h4">
                    {stats?.performanceScore || 0}%
                  </Typography>
                </Box>
                <Assessment sx={{ fontSize: 40, color: 'info.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Action Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{ p: 3, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
            onClick={() => navigate('/vendor/products')}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6">Active Products</Typography>
                <Typography variant="h3" color="primary">
                  {stats?.activeProducts || 0}
                </Typography>
              </Box>
              <Inventory sx={{ fontSize: 60, color: 'primary.main', opacity: 0.2 }} />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            sx={{ p: 3, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
            onClick={() => navigate('/vendor/orders')}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6">Completed Orders</Typography>
                <Typography variant="h3" color="success.main">
                  {stats?.completedOrders || 0}
                </Typography>
              </Box>
              <ShoppingCart sx={{ fontSize: 60, color: 'success.main', opacity: 0.2 }} />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            sx={{ p: 3, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
            onClick={() => navigate('/vendor/invoices')}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6">Pending Invoices</Typography>
                <Typography variant="h3" color="warning.main">
                  {stats?.pendingInvoices || 0}
                </Typography>
              </Box>
              <AttachMoney sx={{ fontSize: 60, color: 'warning.main', opacity: 0.2 }} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Orders Table */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Recent Orders
          </Typography>
          <Typography
            variant="body2"
            color="primary"
            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            onClick={() => navigate('/vendor/orders')}
          >
            View All Orders →
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order Number</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <TableRow key={order._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {order.po_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.order_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{order.items_count}</TableCell>
                    <TableCell>
                      {formatCurrency(order.total_amount)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.status.replace('_', ' ')}
                        size="small"
                        color={getStatusColor(order.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.priority}
                        size="small"
                        color={getPriorityColor(order.priority)}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/vendor/orders`)}
                        title="View Details"
                      >
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No recent orders found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      </Box>
    </DashboardLayout>
  );
};

export default VendorDashboard;
