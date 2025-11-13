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
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  ShoppingCart as PurchaseIcon,
  Build as MaintenanceIcon,
  Store as VendorIcon,
  CurrencyRupee as MoneyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Layout from '../../layout/Layout';
import StatCard from '../StatCard';
import ChartComponent from '../ChartComponent';
import api from '../../../services/api';
import { toast } from 'react-toastify';

// TypeScript interfaces for API responses
interface InventoryStats {
  totalAssets: number;
  activeAssets: number;
  inMaintenanceAssets: number;
  disposedAssets: number;
  totalValue: number;
  locationCount: number;
  warrantyExpiring: number;
  maintenanceDue: number;
  monthlyPurchases: number;
  topVendorsCount: number;
  trends: {
    assets: { value: number; isPositive: boolean };
    purchases: { value: number; isPositive: boolean };
  };
}

interface LocationData {
  location: string;
  count: number;
  percentage: number;
  assets: string[];
}

interface WarrantyExpiring {
  id: string;
  asset: string;
  assetId: string;
  category: string;
  expiryDate: string;
  daysLeft: number;
  priority: 'high' | 'medium' | 'low';
  assignedUser?: string;
}

interface MaintenanceSchedule {
  id: string;
  asset: string;
  assetId: string;
  type: string;
  scheduledDate: string;
  technician: string;
  status: string;
}

interface VendorPerformance {
  id: string;
  name: string;
  orders: number;
  value: number;
  rating: number;
  categories: string[];
  activeContracts: number;
}

interface PendingApproval {
  id: string;
  type: string;
  requestor: string;
  requestorId: string;
  priority: string;
  daysAgo: number;
  amount?: number;
  description?: string;
  assetId?: string;
}

interface InventoryOverview {
  stats: InventoryStats;
  assetsByLocation: LocationData[];
  warrantyExpiring: WarrantyExpiring[];
  maintenanceSchedule: MaintenanceSchedule[];
  topVendors: VendorPerformance[];
  pendingApprovals: PendingApproval[];
}

const InventoryManagerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<InventoryOverview | null>(null);

  // RBAC: Verify user has INVENTORY_MANAGER role
  useEffect(() => {
    if (user && user.role !== 'INVENTORY_MANAGER' && user.role !== 'ADMIN') {
      toast.error('Access denied. You do not have permission to view this dashboard.');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch all dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Call the comprehensive inventory overview endpoint
        const response = await api.get('/dashboard/inventory-overview');
        
        if (response.data.success) {
          setDashboardData(response.data.data);
        } else {
          throw new Error('Failed to fetch dashboard data');
        }
      } catch (err: any) {
        console.error('Error fetching inventory dashboard:', err);
        setError(err.response?.data?.error || 'Failed to load dashboard data');
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
  const getPriorityColor = (priority: string): 'error' | 'warning' | 'info' | 'default' => {
    const p = priority.toLowerCase();
    if (p === 'high' || p === 'critical') return 'error';
    if (p === 'medium') return 'warning';
    if (p === 'low') return 'info';
    return 'default';
  };

  const getExpiryColor = (daysLeft: number): 'error' | 'warning' | 'success' => {
    if (daysLeft <= 7) return 'error';
    if (daysLeft <= 30) return 'warning';
    return 'success';
  };

  // Generate chart data from real API data
  const generateVendorPerformanceChart = () => {
    if (!dashboardData?.topVendors || dashboardData.topVendors.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          label: 'Purchase Value (₹)',
          data: [0],
          backgroundColor: ['#ccc']
        }]
      };
    }

    const topVendors = dashboardData.topVendors.slice(0, 6);
    return {
      labels: topVendors.map(v => v.name),
      datasets: [{
        label: 'Purchase Value (₹)',
        data: topVendors.map(v => v.value),
        backgroundColor: [
          '#2196f3',
          '#4caf50',
          '#ff9800',
          '#f44336',
          '#9c27b0',
          '#607d8b',
        ],
      }]
    };
  };

  // Loading state
  if (loading) {
    return (
      <Layout title="Inventory Manager Dashboard">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Layout>
    );
  }

  // Error state
  if (error || !dashboardData) {
    return (
      <Layout title="Inventory Manager Dashboard">
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Failed to load dashboard data'}
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Layout>
    );
  }

  const { stats, assetsByLocation, warrantyExpiring, maintenanceSchedule, topVendors, pendingApprovals } = dashboardData;

  return (
    <Layout title="Inventory Manager Dashboard">
      <Grid container spacing={3}>
        {/* KPI Cards Row */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Assets"
            value={stats.totalAssets.toLocaleString('en-IN')}
            subtitle={`${stats.activeAssets} active, ${stats.inMaintenanceAssets} in maintenance`}
            progress={stats.totalAssets > 0 ? Math.round((stats.activeAssets / stats.totalAssets) * 100) : 0}
            progressColor="primary"
            icon={<InventoryIcon />}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Approvals"
            value={pendingApprovals.length}
            subtitle={`${pendingApprovals.filter(a => a.priority.toLowerCase() === 'high').length} high priority`}
            progress={pendingApprovals.length > 10 ? 80 : (pendingApprovals.length * 8)}
            progressColor="warning"
            icon={<AssignmentIcon />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Expiring Soon"
            value={stats.warrantyExpiring}
            subtitle="Warranties & AMCs"
            progress={75}
            progressColor="error"
            icon={<WarningIcon />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Value"
            value={`₹${(stats.totalValue / 10000000).toFixed(1)}Cr`}
            subtitle={`${stats.locationCount} locations`}
            progress={65}
            progressColor="info"
            icon={<MoneyIcon />}
          />
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PurchaseIcon />}
                  onClick={() => navigate('/assets/add')}
                  sx={{ py: 1.5 }}
                >
                  Add Asset
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AssignmentIcon />}
                  onClick={() => navigate('/approvals')}
                  sx={{ py: 1.5 }}
                >
                  Approvals
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<MaintenanceIcon />}
                  onClick={() => navigate('/maintenance')}
                  sx={{ py: 1.5 }}
                >
                  Maintenance
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<VendorIcon />}
                  onClick={() => navigate('/vendors')}
                  sx={{ py: 1.5 }}
                >
                  Vendors
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<LocationIcon />}
                  onClick={() => navigate('/assets?view=location')}
                  sx={{ py: 1.5 }}
                >
                  Locations
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<TrendingUpIcon />}
                  onClick={() => navigate('/reports')}
                  sx={{ py: 1.5 }}
                >
                  Reports
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Stock Levels by Location */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Stock Levels by Location
              </Typography>
              {assetsByLocation.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No location data available
                </Typography>
              ) : (
                assetsByLocation.slice(0, 5).map((location, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">{location.location}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {location.count} assets ({location.percentage}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={location.percentage}
                      sx={{ mt: 0.5, height: 8, borderRadius: 4 }}
                      color={location.percentage > 80 ? 'success' : location.percentage > 50 ? 'warning' : 'error'}
                    />
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Approvals */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Pending Approvals</Typography>
                <Button size="small" onClick={() => navigate('/approvals')}>
                  View All
                </Button>
              </Box>
              {pendingApprovals.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No pending approvals
                </Typography>
              ) : (
                <List>
                  {pendingApprovals.slice(0, 3).map((approval) => (
                    <ListItem key={approval.id} divider>
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            bgcolor: getPriorityColor(approval.priority) + '.light',
                            color: getPriorityColor(approval.priority) + '.main',
                            width: 32,
                            height: 32,
                          }}
                        >
                          <AssignmentIcon fontSize="small" />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2">{approval.type}</Typography>
                            <Chip 
                              label={approval.priority} 
                              size="small" 
                              color={getPriorityColor(approval.priority)}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {approval.description || 'No description'} 
                              {approval.amount ? ` • ₹${approval.amount.toLocaleString('en-IN')}` : ''}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              by {approval.requestor} • {approval.daysAgo} days ago
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Charts Row */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Vendor Performance
            </Typography>
            <ChartComponent
              title=""
              type="bar"
              data={generateVendorPerformanceChart()}
              height={300}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Vendors
              </Typography>
              {topVendors.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No vendor data available
                </Typography>
              ) : (
                <List>
                  {topVendors.slice(0, 5).map((vendor) => (
                    <ListItem key={vendor.id} divider>
                      <ListItemText
                        primary={vendor.name}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              Orders: {vendor.orders} • Value: ₹{(vendor.value / 100000).toFixed(1)}L
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Rating: {vendor.rating}/5 ⭐
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Warranty & AMC Expiring */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Warranty & AMC Expiring Soon
              </Typography>
              {warrantyExpiring.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No expiring warranties
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Asset</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Days Left</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {warrantyExpiring.slice(0, 5).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Typography variant="body2">{item.asset}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.assignedUser || 'Unassigned'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.category}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={`${item.daysLeft} days`} 
                              size="small" 
                              color={getExpiryColor(item.daysLeft)}
                            />
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="small" 
                              variant="outlined"
                              onClick={() => navigate(`/assets/${item.assetId}`)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Maintenance Schedule */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upcoming Maintenance
              </Typography>
              {maintenanceSchedule.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No scheduled maintenance
                </Typography>
              ) : (
                <List>
                  {maintenanceSchedule.slice(0, 5).map((item) => (
                    <ListItem key={item.id} divider>
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            bgcolor: item.status === 'pending' ? 'warning.light' : 'success.light',
                            color: item.status === 'pending' ? 'warning.main' : 'success.main',
                            width: 32,
                            height: 32,
                          }}
                        >
                          <MaintenanceIcon fontSize="small" />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2">{item.asset}</Typography>
                            <Chip 
                              label={item.type} 
                              size="small" 
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              Scheduled: {new Date(item.scheduledDate).toLocaleDateString('en-IN')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Technician: {item.technician}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Layout>
  );
};

export default InventoryManagerDashboard;