/**
 * VENDOR DASHBOARD - Real-Time Integration
 * 
 * Data Sources (100% Real API):
 * - GET /api/v1/vendor/dashboard/stats - Vendor performance statistics
 * - GET /api/v1/vendor/dashboard/recent-orders - Latest 5 purchase orders
 * 
 * Real-Time Strategy:
 * - Manual refresh for on-demand updates
 * - Vendor data scoped by vendor_id from JWT token (req.user.vendor_id)
 * 
 * Field Mappings:
 * - Backend stats: totalOrders, pendingOrders, completedOrders, totalRevenue, activeProducts, pendingInvoices, performanceScore
 * - Orders: _id, po_number, status, total_amount, expected_delivery_date, order_date, items_count, priority
 * - Status Colors: completed=success, in_progress/acknowledged=primary, pending_approval/approved=warning, cancelled/rejected=error
 * - Priority Colors: urgent=error, high=warning, medium=info, low=default
 * - Currency: All amounts formatted as ₹ (Indian Rupee)
 * 
 * Role Access: VENDOR role only (enforced by requireRole(['VENDOR']) middleware)
 * Authentication: Bearer token from localStorage (key: 'token')
 * No Mock Data: Purchase orders filtered server-side by vendor ID
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
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
  Alert,
  Button,
  Avatar,
} from '@mui/material';
import {
  ShoppingCart,
  Inventory,
  CurrencyRupee as AttachMoney,
  Assessment,
  Visibility,
  TrendingUp,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getVendorStats, getRecentOrders } from '../../services/vendorPortal.service';
import type { VendorStats, VendorOrder } from '../../types';
import { format } from 'date-fns';
import DashboardLayout from '../../components/layout/DashboardLayout';

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "info";
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = "primary", onClick }) => (
  <Card 
    sx={{ 
      height: "100%",
      cursor: onClick ? "pointer" : "default",
      transition: "all 0.2s",
      "&:hover": onClick ? { transform: "translateY(-2px)", boxShadow: 3 } : {}
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="overline">
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
        </Box>
        <Avatar sx={{ backgroundColor: `${color}.main`, height: 56, width: 56 }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const VendorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const errorMessage = err.response?.data?.message || 'Failed to load dashboard data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

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
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <CircularProgress size={60} />
        </Box>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Box sx={{ p: 3 }}>
          <Alert 
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={loadDashboardData}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Vendor Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome back! Here's an overview of your business with us.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadDashboardData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Orders"
              value={stats?.totalOrders || 0}
              icon={<ShoppingCart />}
              color="primary"
              onClick={() => navigate('/vendor/orders')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pending Orders"
              value={stats?.pendingOrders || 0}
              icon={<TrendingUp />}
              color="warning"
              onClick={() => navigate('/vendor/orders?status=pending')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats?.totalRevenue || 0)}
              icon={<AttachMoney />}
              color="success"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Performance Score"
              value={`${stats?.performanceScore || 0}%`}
              icon={<Assessment />}
              color="info"
            />
          </Grid>
        </Grid>

        {/* Quick Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Paper
              sx={{ p: 3, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { bgcolor: 'action.hover' } }}
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
              sx={{ p: 3, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { bgcolor: 'action.hover' } }}
              onClick={() => navigate('/vendor/orders?status=completed')}
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
              sx={{ p: 3, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { bgcolor: 'action.hover' } }}
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
            <Button
              variant="text"
              onClick={() => navigate('/vendor/orders')}
            >
              View All Orders →
            </Button>
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
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
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
