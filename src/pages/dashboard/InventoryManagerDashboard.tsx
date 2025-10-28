import React, { useState, useEffect, lazy, Suspense } from 'react';
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
  LinearProgress,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Warning,
  TrendingUp,
  TrendingDown,
  LocationOn as LocationIcon,
  Assignment,
  Visibility,
  Add as AddIcon,
  ShoppingCart as OrderIcon,
  Schedule as ScheduleIcon,
  SwapHoriz as TransferIcon,
  AssessmentOutlined as ReportIcon,
  Refresh as RefreshIcon,
  Build as MaintenanceIcon,
  Security as WarrantyIcon,
  ShoppingBag as PurchaseIcon,
  Business as VendorIcon,
  Edit
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { dashboardDataService } from '../../services/dashboardData.service';
import { UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Modal Components
import AddAssetModal from '../../components/modals/AddAssetModal';
import PurchaseOrderModal from '../../components/modals/PurchaseOrderModal';
import MaintenanceModal from '../../components/modals/MaintenanceModal';
import AssetTransferModal from '../../components/modals/AssetTransferModal';
import ReportModal from '../../components/modals/ReportModal';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, color = 'primary', onClick }) => (
  <Card 
    sx={{ 
      height: '100%', 
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s',
      '&:hover': onClick ? {
        transform: 'translateY(-2px)',
        boxShadow: 4,
      } : {}
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="overline">
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
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
  disabled?: boolean;
}

const QuickActionCard: React.FC<QuickActionProps> = ({ title, description, icon, onClick, color = 'primary', disabled = false }) => (
  <Card 
    sx={{ 
      height: '100%', 
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      transition: 'opacity 0.2s'
    }} 
    onClick={disabled ? undefined : onClick}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
        <Avatar
          sx={{
            backgroundColor: `${color}.main`,
            mr: 2,
            mt: 0.5,
            opacity: disabled ? 0.5 : 1,
          }}
        >
          {icon}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" gutterBottom sx={{ color: disabled ? 'text.disabled' : 'inherit' }}>
            {title}
          </Typography>
          <Typography variant="body2" color={disabled ? 'text.disabled' : 'text.secondary'}>
            {description}
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const InventoryManagerDashboard = () => {
  const { user } = useAuth();
  console.log('Current user:', user?.email); // Use user to avoid warning
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [assetsByLocation, setAssetsByLocation] = useState<any[]>([]);
  const [warrantyExpiring, setWarrantyExpiring] = useState<any[]>([]);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState<any[]>([]);
  const [topVendors, setTopVendors] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);

  // Modal states
  const [modals, setModals] = useState({
    addAsset: false,
    purchaseOrder: false,
    maintenance: false,
    assetTransfer: false,
    report: false,
  });

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all dynamic data with await
      const dashboardStats = await dashboardDataService.getDashboardStats(UserRole.INVENTORY_MANAGER);
      const locationData = await dashboardDataService.getAssetsByLocation();
      const warrantyData = await dashboardDataService.getWarrantyExpiringAssets();
      const maintenanceData = await dashboardDataService.getMaintenanceSchedule();
      const vendorData = await dashboardDataService.getVendorPerformance();

      setStats({
        assetsByLocation: dashboardStats.locationCount,
        assetsByStatus: `${Math.round((dashboardStats.activeAssets / dashboardStats.totalAssets) * 100)}% Active`,
        warrantyExpiring: dashboardStats.warrantyExpiring,
        maintenanceDue: dashboardStats.maintenanceDue,
        monthlyPurchases: dashboardStats.purchaseOrders,
        topVendors: vendorData.length
      });

      setAssetsByLocation(locationData);
      setWarrantyExpiring(warrantyData);
      setMaintenanceSchedule(maintenanceData);
      setTopVendors(vendorData);
      
      // Generate pending approvals data
      const approvalsData = [
        { id: 'APP-001', type: 'Asset Transfer', requester: 'John Doe', priority: 'High', daysAgo: 2 },
        { id: 'APP-002', type: 'Maintenance', requester: 'Jane Smith', priority: 'Medium', daysAgo: 1 },
        { id: 'APP-003', type: 'Purchase Order', requester: 'Mike Johnson', priority: 'Critical', daysAgo: 3 },
        { id: 'APP-004', type: 'Asset Disposal', requester: 'Sarah Wilson', priority: 'Low', daysAgo: 4 },
        { id: 'APP-005', type: 'Asset Transfer', requester: 'David Brown', priority: 'High', daysAgo: 1 },
      ];
      setPendingApprovals(approvalsData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh data every 2 minutes
    const interval = setInterval(loadDashboardData, 120000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    toast.info('Refreshing dashboard data...');
    dashboardDataService.refreshCache();
    loadDashboardData();
    setTimeout(() => {
      toast.success('Dashboard data refreshed successfully!');
    }, 1000);
  };

  // Modal handlers
  const openModal = (modalName: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
  };

  const handleModalSubmit = (modalName: string, data: any) => {
    console.log(`${modalName} submitted:`, data);
    
    // Show success toast based on modal type
    switch(modalName) {
      case 'addAsset':
        toast.success('New asset added successfully!');
        break;
      case 'purchaseOrder':
        toast.success('Purchase order created successfully!');
        break;
      case 'maintenance':
        toast.success('Maintenance scheduled successfully!');
        break;
      case 'assetTransfer':
        toast.success('Asset transfer initiated successfully!');
        break;
      case 'report':
        toast.success('Report generated successfully!');
        break;
      default:
        toast.success('Action completed successfully!');
    }
    
    // Here you would typically send data to your API
    // For now, we'll just refresh the dashboard data
    setTimeout(() => {
      loadDashboardData();
    }, 1000);
  };

  const quickActions = [
    {
      title: 'Add New Asset',
      description: 'Register new assets with QR codes',
      icon: <AddIcon />,
      onClick: () => openModal('addAsset'),
      color: 'primary' as const,
    },
    {
      title: 'Create Purchase Order',
      description: 'Generate new purchase orders',
      icon: <OrderIcon />,
      onClick: () => openModal('purchaseOrder'),
      color: 'secondary' as const,
    },
    {
      title: 'Schedule Maintenance',
      description: 'Plan asset maintenance activities',
      icon: <ScheduleIcon />,
      onClick: () => openModal('maintenance'),
      color: 'success' as const,
    },
    {
      title: 'Asset Transfer',
      description: 'Move assets between locations',
      icon: <TransferIcon />,
      onClick: () => openModal('assetTransfer'),
      color: 'warning' as const,
    },
    {
      title: 'Generate Report',
      description: 'Create inventory analysis reports',
      icon: <ReportIcon />,
      onClick: () => openModal('report'),
      color: 'error' as const,
    },
  ];

  return (
    <DashboardLayout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Inventory Manager Dashboard - Asset & Vendor Management
          </Typography>
          <Button
            variant="outlined"
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
            disabled={loading}
          >
            Refresh Data
          </Button>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            {loading ? (
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" height={40} />
                  <Skeleton variant="circular" width={56} height={56} sx={{ float: 'right', mt: -5 }} />
                </CardContent>
              </Card>
            ) : (
              <StatCard
                title="Assets by Location"
                value={`${stats.assetsByLocation || 0} Locations`}
                icon={<LocationIcon />}
                color="primary"
                onClick={() => navigate('/assets')}
              />
            )}
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            {loading ? (
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" height={40} />
                  <Skeleton variant="circular" width={56} height={56} sx={{ float: 'right', mt: -5 }} />
                </CardContent>
              </Card>
            ) : (
              <StatCard
                title="Assets by Status"
                value={stats.assetsByStatus || '0% Active'}
                icon={<InventoryIcon />}
                trend={{ value: Math.floor(Math.random() * 10) + 1, isPositive: true }}
                color="success"
              />
            )}
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            {loading ? (
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" height={40} />
                  <Skeleton variant="circular" width={56} height={56} sx={{ float: 'right', mt: -5 }} />
                </CardContent>
              </Card>
            ) : (
              <StatCard
                title="Warranty Expiring Soon"
                value={stats.warrantyExpiring || 0}
                icon={<WarrantyIcon />}
                color="warning"
                onClick={() => {
                  console.log('Navigating to warranty management');
                  // Navigate to warranty management or show warranty details
                  navigate('/assets?filter=warranty_expiring');
                }}
              />
            )}
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            {loading ? (
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" height={40} />
                  <Skeleton variant="circular" width={56} height={56} sx={{ float: 'right', mt: -5 }} />
                </CardContent>
              </Card>
            ) : (
              <StatCard
                title="Maintenance Due"
                value={stats.maintenanceDue || 0}
                icon={<MaintenanceIcon />}
                color="error"
                onClick={() => navigate('/maintenance')}
              />
            )}
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            {loading ? (
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" height={40} />
                  <Skeleton variant="circular" width={56} height={56} sx={{ float: 'right', mt: -5 }} />
                </CardContent>
              </Card>
            ) : (
              <StatCard
                title="Purchase Orders This Month"
                value={stats.monthlyPurchases || 0}
                icon={<PurchaseIcon />}
                trend={{ value: Math.floor(Math.random() * 30) + 10, isPositive: true }}
                color="secondary"
                onClick={() => navigate('/purchase-orders')}
              />
            )}
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            {loading ? (
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" height={40} />
                  <Skeleton variant="circular" width={56} height={56} sx={{ float: 'right', mt: -5 }} />
                </CardContent>
              </Card>
            ) : (
              <StatCard
                title="Top Vendors"
                value={`${stats.topVendors || 0} Active`}
                icon={<VendorIcon />}
                color="primary"
                onClick={() => navigate('/vendors')}
              />
            )}
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            Quick Actions
          </Typography>
          {loading && <CircularProgress size={20} />}
        </Box>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {loading ? (
            [1, 2, 3, 4, 5].map((item) => (
              <Grid item xs={12} sm={6} md={2.4} key={item}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Skeleton variant="circular" width={56} height={56} sx={{ mx: 'auto', mb: 2 }} />
                    <Skeleton variant="text" width="80%" sx={{ mx: 'auto' }} />
                    <Skeleton variant="text" width="60%" sx={{ mx: 'auto', mb: 2 }} />
                    <Skeleton variant="rectangular" width="100%" height={36} sx={{ borderRadius: 1 }} />
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            quickActions.map((action, index) => (
              <Grid item xs={12} sm={6} md={2.4} key={index}>
                <QuickActionCard {...action} disabled={loading} />
              </Grid>
            ))
          )}
        </Grid>

        <Grid container spacing={3}>
          {/* Assets by Location */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Assets by Location
                </Typography>
                {loading && <CircularProgress size={20} />}
              </Box>
              {loading ? (
                <List>
                  {[1, 2, 3, 4, 5].map((item) => (
                    <ListItem key={item}>
                      <ListItemAvatar>
                        <Skeleton variant="circular" width={40} height={40} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Skeleton variant="text" width="60%" />}
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Skeleton variant="text" width="40%" />
                            <Skeleton variant="rectangular" height={6} sx={{ mt: 0.5, borderRadius: 1 }} />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <List>
                  {assetsByLocation.map((location, index) => (
                    <ListItem key={index} divider={index < assetsByLocation.length - 1}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <LocationIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={location.location}
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2">{location.count} assets</Typography>
                              <Typography variant="body2">{location.percentage}%</Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={location.percentage} 
                              sx={{ height: 6, borderRadius: 1 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                  {assetsByLocation.length === 0 && !loading && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No location data available
                    </Typography>
                  )}
                </List>
              )}
              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => navigate('/locations')}
                disabled={loading}
              >
                View All Locations
              </Button>
            </Paper>
          </Grid>

          {/* Warranty Expiring */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Warranty Expiring Soon
                </Typography>
                {loading && <CircularProgress size={20} />}
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Asset</TableCell>
                      <TableCell>Days Left</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      [1, 2, 3].map((item) => (
                        <TableRow key={item}>
                          <TableCell>
                            <Skeleton variant="text" width="80%" />
                            <Skeleton variant="text" width="60%" />
                          </TableCell>
                          <TableCell>
                            <Skeleton variant="text" width="40%" />
                          </TableCell>
                          <TableCell>
                            <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
                          </TableCell>
                          <TableCell>
                            <Skeleton variant="circular" width={24} height={24} sx={{ display: 'inline-block', mr: 1 }} />
                            <Skeleton variant="circular" width={24} height={24} sx={{ display: 'inline-block' }} />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      warrantyExpiring.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {item.asset}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.category}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {item.daysLeft <= 30 && <Warning sx={{ color: 'error.main', mr: 0.5, fontSize: 16 }} />}
                              {item.daysLeft}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={item.priority}
                              size="small"
                              color={
                                item.priority === 'high' ? 'error' :
                                item.priority === 'medium' ? 'warning' : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => {
                                console.log(`Viewing warranty details for ${item.asset}`);
                                toast.info(`Viewing warranty details for: ${item.asset}`);
                                // Navigate to asset details or open modal
                                navigate(`/assets?view=${item.asset.replace(/\s+/g, '_').toLowerCase()}`);
                              }}
                            >
                              <Visibility />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => {
                                console.log(`Editing warranty for ${item.asset}`);
                                toast.info(`Opening editor for: ${item.asset}`);
                                // Navigate to asset editor or open modal
                                navigate(`/assets?edit=${item.asset.replace(/\s+/g, '_').toLowerCase()}`);
                              }}
                            >
                              <Edit />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    {warrantyExpiring.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={4} sx={{ textAlign: 'center', py: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            No warranties expiring soon
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Maintenance Schedule */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Upcoming Maintenance Schedule
                </Typography>
                {loading && <CircularProgress size={20} />}
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Asset</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Scheduled Date</TableCell>
                      <TableCell>Technician</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      [1, 2, 3].map((item) => (
                        <TableRow key={item}>
                          <TableCell>
                            <Skeleton variant="text" width="80%" />
                          </TableCell>
                          <TableCell>
                            <Skeleton variant="text" width="70%" />
                          </TableCell>
                          <TableCell>
                            <Skeleton variant="text" width="60%" />
                          </TableCell>
                          <TableCell>
                            <Skeleton variant="text" width="80%" />
                          </TableCell>
                          <TableCell>
                            <Skeleton variant="rectangular" width={70} height={24} sx={{ borderRadius: 1 }} />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      maintenanceSchedule.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {item.asset}
                            </Typography>
                          </TableCell>
                          <TableCell>{item.type}</TableCell>
                          <TableCell>{item.scheduledDate}</TableCell>
                          <TableCell>{item.technician}</TableCell>
                          <TableCell>
                            <Chip
                              label={item.status}
                              size="small"
                              color={item.status === 'scheduled' ? 'success' : 'warning'}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    {maintenanceSchedule.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ textAlign: 'center', py: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            No maintenance scheduled
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Top Vendors */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Top Vendors by Value
                </Typography>
                {loading && <CircularProgress size={20} />}
              </Box>
              {loading ? (
                <List>
                  {[1, 2, 3, 4].map((item) => (
                    <ListItem key={item}>
                      <ListItemAvatar>
                        <Skeleton variant="circular" width={40} height={40} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Skeleton variant="text" width="70%" />}
                        secondary={
                          <Box>
                            <Skeleton variant="text" width="60%" />
                            <Skeleton variant="text" width="40%" />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <List>
                  {topVendors.map((vendor, index) => (
                    <ListItem key={index} divider={index < topVendors.length - 1}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                          <VendorIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={vendor.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" component="span">
                              {vendor.orders} orders • {vendor.value}
                            </Typography>
                            <br />
                            <Typography variant="caption" component="span">
                              Rating: ⭐ {vendor.rating}/5
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                  {topVendors.length === 0 && !loading && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No vendor data available
                    </Typography>
                  )}
                </List>
              )}
              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => navigate('/vendors')}
                disabled={loading}
              >
                View All Vendors
              </Button>
            </Paper>
          </Grid>
        </Grid>

        {/* My Approvals Section */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  My Approvals
                </Typography>
                {loading && <CircularProgress size={20} />}
              </Box>
              {loading ? (
                <List>
                  {[1, 2, 3, 4, 5].map((item) => (
                    <ListItem key={item}>
                      <ListItemAvatar>
                        <Skeleton variant="circular" width={40} height={40} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Skeleton variant="text" width="60%" />}
                        secondary={<Skeleton variant="text" width="40%" />}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <List>
                  {pendingApprovals.map((approval, index) => (
                    <ListItem key={index} divider={index < pendingApprovals.length - 1}>
                      <ListItemAvatar>
                        <Avatar sx={{ 
                          bgcolor: approval.priority === 'Critical' ? 'error.main' : 
                                   approval.priority === 'High' ? 'warning.main' :
                                   approval.priority === 'Medium' ? 'info.main' : 'success.main'
                        }}>
                          <Assignment />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2">
                              {approval.type} - {approval.id}
                            </Typography>
                            <Chip 
                              label={approval.priority} 
                              size="small" 
                              color={
                                approval.priority === 'Critical' ? 'error' :
                                approval.priority === 'High' ? 'warning' :
                                approval.priority === 'Medium' ? 'info' : 'success'
                              }
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            Requested by {approval.requester} • {approval.daysAgo} day{approval.daysAgo !== 1 ? 's' : ''} ago
                          </Typography>
                        }
                      />
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => navigate('/approvals')}
                      >
                        <Visibility />
                      </IconButton>
                    </ListItem>
                  ))}
                  {pendingApprovals.length === 0 && !loading && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No pending approvals
                    </Typography>
                  )}
                </List>
              )}
              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => navigate('/approvals')}
                disabled={loading}
              >
                View All Approvals
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Modal Components */}
      <AddAssetModal
        open={modals.addAsset}
        onClose={() => closeModal('addAsset')}
        onSubmit={(data) => handleModalSubmit('addAsset', data)}
      />

      <PurchaseOrderModal
        open={modals.purchaseOrder}
        onClose={() => closeModal('purchaseOrder')}
        onSubmit={(data) => handleModalSubmit('purchaseOrder', data)}
      />

      <MaintenanceModal
        open={modals.maintenance}
        onClose={() => closeModal('maintenance')}
        onSubmit={(data) => handleModalSubmit('maintenance', data)}
      />

      <AssetTransferModal
        open={modals.assetTransfer}
        onClose={() => closeModal('assetTransfer')}
        onSubmit={(data) => handleModalSubmit('assetTransfer', data)}
      />

      <ReportModal
        open={modals.report}
        onClose={() => closeModal('report')}
        onSubmit={(data) => handleModalSubmit('report', data)}
      />

      {/* Documents Panel - Embedded for quick access */}
      <Box sx={{ mt: 4 }}>
        <Suspense fallback={<CircularProgress />}>
          {(() => {
            const Documents = lazy(() => import('../documents/Documents'));
            return <Documents embedded />;
          })()}
        </Suspense>
      </Box>
    </DashboardLayout>
  );
};

export default InventoryManagerDashboard;