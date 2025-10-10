import React from 'react';
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
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  LocationOn as LocationIcon,
  Inventory as InventoryIcon,
  Security as WarrantyIcon,
  Build as MaintenanceIcon,
  ShoppingCart as PurchaseIcon,
  Store as VendorIcon,
  Add as AddIcon,
  Assignment as OrderIcon,
  Schedule as ScheduleIcon,
  SwapHoriz as TransferIcon,
  Assessment as ReportIcon,
  Visibility,
  Edit,
  Warning,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';

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

const InventoryManagerDashboard = () => {
  // Mock data - in real app, this would come from API
  const stats = {
    assetsByLocation: 8,
    assetsByStatus: '95% Active',
    warrantyExpiring: 12,
    maintenanceDue: 8,
    monthlyPurchases: 15,
    topVendors: 5
  };

  const quickActions = [
    {
      title: 'Add New Asset',
      description: 'Register new assets with QR codes',
      icon: <AddIcon />,
      onClick: () => console.log('Add asset'),
      color: 'primary' as const,
    },
    {
      title: 'Create Purchase Order',
      description: 'Generate new purchase orders',
      icon: <OrderIcon />,
      onClick: () => console.log('Create PO'),
      color: 'secondary' as const,
    },
    {
      title: 'Schedule Maintenance',
      description: 'Plan asset maintenance activities',
      icon: <ScheduleIcon />,
      onClick: () => console.log('Schedule maintenance'),
      color: 'success' as const,
    },
    {
      title: 'Asset Transfer',
      description: 'Move assets between locations',
      icon: <TransferIcon />,
      onClick: () => console.log('Asset transfer'),
      color: 'warning' as const,
    },
    {
      title: 'Generate Report',
      description: 'Create inventory analysis reports',
      icon: <ReportIcon />,
      onClick: () => console.log('Generate report'),
      color: 'error' as const,
    },
  ];

  const assetsByLocation = [
    { location: 'Main Office', count: 245, percentage: 35 },
    { location: 'Warehouse A', count: 180, percentage: 25 },
    { location: 'Branch Office 1', count: 140, percentage: 20 },
    { location: 'Branch Office 2', count: 95, percentage: 14 },
    { location: 'Storage Room', count: 45, percentage: 6 },
  ];

  const warrantyExpiring = [
    {
      asset: 'Dell Laptops (10 units)',
      category: 'IT Equipment',
      expiryDate: '2025-11-15',
      daysLeft: 35,
      priority: 'high',
    },
    {
      asset: 'HP Printers (3 units)',
      category: 'Office Equipment',
      expiryDate: '2025-12-20',
      daysLeft: 70,
      priority: 'medium',
    },
    {
      asset: 'Samsung Monitors (8 units)',
      category: 'IT Equipment',
      expiryDate: '2026-01-10',
      daysLeft: 91,
      priority: 'low',
    },
  ];

  const maintenanceSchedule = [
    {
      asset: 'HVAC System - Floor 2',
      type: 'Preventive Maintenance',
      scheduledDate: '2025-10-15',
      technician: 'John Service Co.',
      status: 'scheduled',
    },
    {
      asset: 'Generator - Backup Power',
      type: 'Regular Service',
      scheduledDate: '2025-10-18',
      technician: 'Power Systems Ltd.',
      status: 'pending',
    },
    {
      asset: 'Elevator - Main Building',
      type: 'Safety Inspection',
      scheduledDate: '2025-10-22',
      technician: 'Elevator Services Inc.',
      status: 'scheduled',
    },
  ];

  const topVendors = [
    { name: 'Tech Solutions Ltd.', orders: 15, value: '₹3,45,000', rating: 4.8 },
    { name: 'Office Supplies Co.', orders: 12, value: '₹1,85,000', rating: 4.6 },
    { name: 'IT Equipment Inc.', orders: 8, value: '₹2,95,000', rating: 4.9 },
    { name: 'Maintenance Services', orders: 6, value: '₹1,25,000', rating: 4.5 },
  ];

  return (
    <DashboardLayout>
      <Box>
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          Inventory Manager Dashboard - Asset & Vendor Management
        </Typography>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Assets by Location"
              value={`${stats.assetsByLocation} Locations`}
              icon={<LocationIcon />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Assets by Status"
              value={stats.assetsByStatus}
              icon={<InventoryIcon />}
              trend={{ value: 2, isPositive: true }}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Warranty Expiring Soon"
              value={stats.warrantyExpiring}
              icon={<WarrantyIcon />}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Maintenance Due"
              value={stats.maintenanceDue}
              icon={<MaintenanceIcon />}
              color="error"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Purchase Orders This Month"
              value={stats.monthlyPurchases}
              icon={<PurchaseIcon />}
              trend={{ value: 25, isPositive: true }}
              color="secondary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Top Vendors"
              value={`${stats.topVendors} Active`}
              icon={<VendorIcon />}
              color="primary"
            />
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={2.4} key={index}>
              <QuickActionCard {...action} />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Assets by Location */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Assets by Location
              </Typography>
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
              </List>
            </Paper>
          </Grid>

          {/* Warranty Expiring */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Warranty Expiring Soon
              </Typography>
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
                    {warrantyExpiring.map((item, index) => (
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
                          <IconButton size="small" color="primary">
                            <Visibility />
                          </IconButton>
                          <IconButton size="small" color="success">
                            <Edit />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Maintenance Schedule */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Upcoming Maintenance Schedule
              </Typography>
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
                    {maintenanceSchedule.map((item, index) => (
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
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Top Vendors */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Top Vendors by Value
              </Typography>
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
              </List>
              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => console.log('View all vendors')}
              >
                View All Vendors
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
};

export default InventoryManagerDashboard;