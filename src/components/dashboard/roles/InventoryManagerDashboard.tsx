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
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  ShoppingCart as PurchaseIcon,
  Build as MaintenanceIcon,
  Store as VendorIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Layout from '../../layout/Layout';
import StatCard from '../StatCard';
import ChartComponent from '../ChartComponent';

const InventoryManagerDashboard = () => {
  const navigate = useNavigate();

  const [dashboardData] = useState({
    totalAssets: 1450,
    activeAssets: 1250,
    underMaintenance: 45,
    availableAssets: 155,
    pendingApprovals: 12,
    warrantyExpiring: 23,
    amcExpiring: 8,
    totalValue: 2500000,
    monthlyMaintenanceCost: 45000,
  });

  const [stockLevelsByLocation] = useState([
    { location: 'Main Office - Floor 1', total: 450, active: 420, available: 30, percentage: 93 },
    { location: 'Main Office - Floor 2', total: 380, active: 340, available: 40, percentage: 89 },
    { location: 'Branch Office - Mumbai', total: 290, active: 275, available: 15, percentage: 95 },
    { location: 'Warehouse - Pune', total: 330, active: 215, available: 115, percentage: 65 },
  ]);

  const [pendingApprovals] = useState([
    {
      id: 1,
      type: 'Asset Purchase',
      requestedBy: 'John Smith',
      amount: 125000,
      items: 'Dell Laptops (10 units)',
      priority: 'High',
      daysWaiting: 3,
    },
    {
      id: 2,
      type: 'Maintenance',
      requestedBy: 'IT Support',
      amount: 15000,
      items: 'Server Maintenance Contract',
      priority: 'Medium',
      daysWaiting: 7,
    },
    {
      id: 3,
      type: 'Asset Transfer',
      requestedBy: 'HR Department',
      amount: 0,
      items: 'Office Furniture Transfer',
      priority: 'Low',
      daysWaiting: 12,
    },
  ]);

  const [expiringWarranties] = useState([
    {
      assetId: 'AST-001',
      name: 'Dell XPS Laptop',
      location: 'IT Department',
      expiryDate: '2024-01-15',
      daysLeft: 5,
      type: 'Warranty',
    },
    {
      assetId: 'AST-089',
      name: 'HP LaserJet Printer',
      location: 'Admin Office',
      expiryDate: '2024-01-20',
      daysLeft: 10,
      type: 'AMC',
    },
    {
      assetId: 'AST-145',
      name: 'Samsung Monitor 24"',
      location: 'Finance Dept',
      expiryDate: '2024-01-25',
      daysLeft: 15,
      type: 'Warranty',
    },
  ]);

  const [recentTransactions] = useState([
    {
      id: 1,
      type: 'Purchase',
      description: 'Office Chairs (5 units)',
      amount: 25000,
      vendor: 'Office Solutions Ltd',
      date: new Date().toISOString(),
    },
    {
      id: 2,
      type: 'Transfer',
      description: 'Laptop Dell XPS -> Marketing',
      amount: 0,
      vendor: 'Internal',
      date: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 3,
      type: 'Maintenance',
      description: 'Printer Repair Service',
      amount: 3500,
      vendor: 'Tech Support Co',
      date: new Date(Date.now() - 7200000).toISOString(),
    },
  ]);

  // Chart data
  const stockTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Active Assets',
        data: [1180, 1200, 1220, 1230, 1240, 1250],
        borderColor: '#4caf50',
        backgroundColor: '#4caf5020',
      },
      {
        label: 'Available Assets',
        data: [180, 165, 160, 158, 157, 155],
        borderColor: '#2196f3',
        backgroundColor: '#2196f320',
      },
      {
        label: 'Under Maintenance',
        data: [40, 35, 38, 42, 43, 45],
        borderColor: '#ff9800',
        backgroundColor: '#ff980020',
      },
    ],
  };

  const vendorPerformanceData = {
    labels: ['Dell Technologies', 'HP Inc', 'Lenovo', 'Samsung', 'Canon', 'Others'],
    datasets: [
      {
        label: 'Purchase Value ($)',
        data: [450000, 320000, 280000, 190000, 150000, 110000],
        backgroundColor: [
          '#2196f3',
          '#4caf50',
          '#ff9800',
          '#f44336',
          '#9c27b0',
          '#607d8b',
        ],
      },
    ],
  };

  const maintenanceCostData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Maintenance Cost ($)',
        data: [38000, 42000, 35000, 41000, 39000, 45000],
        borderColor: '#f44336',
        backgroundColor: '#f4433620',
      },
      {
        label: 'Preventive Maintenance ($)',
        data: [15000, 18000, 12000, 16000, 14000, 17000],
        borderColor: '#4caf50',
        backgroundColor: '#4caf5020',
      },
    ],
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getExpiryColor = (daysLeft: number) => {
    if (daysLeft <= 7) return 'error';
    if (daysLeft <= 30) return 'warning';
    return 'success';
  };

  return (
    <Layout title="Inventory Manager Dashboard">
      <Grid container spacing={3}>
        {/* KPI Cards Row */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Assets"
            value={dashboardData.totalAssets.toLocaleString()}
            subtitle={`${dashboardData.activeAssets} active, ${dashboardData.availableAssets} available`}
            progress={Math.round((dashboardData.activeAssets / dashboardData.totalAssets) * 100)}
            progressColor="primary"
            icon={<InventoryIcon />}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Approvals"
            value={dashboardData.pendingApprovals}
            subtitle="3 high priority items"
            progress={dashboardData.pendingApprovals > 10 ? 80 : (dashboardData.pendingApprovals * 8)}
            progressColor="warning"
            icon={<AssignmentIcon />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Expiring Soon"
            value={dashboardData.warrantyExpiring + dashboardData.amcExpiring}
            subtitle={`${dashboardData.warrantyExpiring} warranties, ${dashboardData.amcExpiring} AMCs`}
            progress={75}
            progressColor="error"
            icon={<WarningIcon />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Maintenance Cost"
            value={`$${(dashboardData.monthlyMaintenanceCost / 1000).toFixed(0)}K`}
            subtitle="This month's spending"
            progress={65}
            progressColor="info"
            icon={<MaintenanceIcon />}
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
              {stockLevelsByLocation.map((location, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">{location.location}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {location.active}/{location.total}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={location.percentage}
                    sx={{ mt: 0.5, height: 8, borderRadius: 4 }}
                    color={location.percentage > 90 ? 'success' : location.percentage > 70 ? 'warning' : 'error'}
                  />
                </Box>
              ))}
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
              <List>
                {pendingApprovals.map((approval) => (
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
                            color={getPriorityColor(approval.priority) as any}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            {approval.items} • ${approval.amount.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            by {approval.requestedBy} • {approval.daysWaiting} days waiting
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

        {/* Charts Row */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <ChartComponent
              title="Asset Stock Trends"
              type="line"
              data={stockTrendData}
              height={300}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <ChartComponent
              title="Vendor Performance"
              type="bar"
              data={vendorPerformanceData}
              height={300}
            />
          </Paper>
        </Grid>

        {/* Warranty & AMC Expiring */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Warranty & AMC Expiring Soon
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Asset</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Days Left</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expiringWarranties.map((item) => (
                      <TableRow key={item.assetId}>
                        <TableCell>
                          <Typography variant="body2">{item.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.location}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={item.type} 
                            size="small" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${item.daysLeft} days`} 
                            size="small" 
                            color={getExpiryColor(item.daysLeft) as any}
                          />
                        </TableCell>
                        <TableCell>
                          <Button size="small" variant="outlined">
                            Renew
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Transactions
              </Typography>
              <List>
                {recentTransactions.map((transaction) => (
                  <ListItem key={transaction.id} divider>
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          bgcolor: transaction.type === 'Purchase' ? 'success.light' : 
                                  transaction.type === 'Transfer' ? 'info.light' : 'warning.light',
                          color: transaction.type === 'Purchase' ? 'success.main' : 
                                 transaction.type === 'Transfer' ? 'info.main' : 'warning.main',
                          width: 32,
                          height: 32,
                        }}
                      >
                        {transaction.type === 'Purchase' ? <MoneyIcon fontSize="small" /> :
                         transaction.type === 'Transfer' ? <LocationIcon fontSize="small" /> :
                         <MaintenanceIcon fontSize="small" />}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={transaction.description}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            {transaction.vendor} • ${transaction.amount.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(transaction.date).toLocaleString()}
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

        {/* Maintenance Cost Trends */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <ChartComponent
              title="Maintenance Cost Trends"
              type="line"
              data={maintenanceCostData}
              height={300}
            />
          </Paper>
        </Grid>
      </Grid>
    </Layout>
  );
};

export default InventoryManagerDashboard;