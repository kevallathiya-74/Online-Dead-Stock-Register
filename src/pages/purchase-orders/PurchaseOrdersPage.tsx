import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  ShoppingCart as OrderIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as CancelledIcon,
  Schedule as PendingIcon,
  Receipt as InvoiceIcon,
  CurrencyRupee as MoneyIcon,
  Inventory as ItemsIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { usePolling } from '../../hooks/usePolling';
import PurchaseOrderModal from '../../components/modals/PurchaseOrderModal';

interface PurchaseOrder {
  _id: string;
  po_number: string;
  vendor: {
    _id: string;
    name: string;
    vendor_code: string;
    contact_person?: string;
  };
  requested_by: {
    _id: string;
    name: string;
    email: string;
  };
  approved_by?: {
    _id: string;
    name: string;
    email: string;
  };
  department: string;
  items: Array<{
    description: string;
    category: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  currency: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent_to_vendor' | 'acknowledged' | 'in_progress' | 'partially_received' | 'completed' | 'cancelled' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expected_delivery_date: string;
  actual_delivery_date?: string;
  payment_terms: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const PurchaseOrdersPage = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [createPOOpen, setCreatePOOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [viewPOOpen, setViewPOOpen] = useState(false);

  const loadData = async () => {
    try {
      const response = await api.get('/purchase-management/orders');
      const poData = response.data.purchase_orders || response.data.data || response.data || [];
      setPurchaseOrders(Array.isArray(poData) ? poData : []);
    } catch (error) { /* Error handled by API interceptor */ }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    };
    loadInitialData();
  }, []);

  // Real-time polling every 30 seconds
  usePolling(async () => {
    await loadData();
  }, {
    interval: 30000,
    enabled: true
  });

  const filteredOrders = purchaseOrders.filter((order) => {
    const matchesSearch = 
      order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.requested_by?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || order.priority === selectedPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'pending_approval': return 'warning';
      case 'approved': return 'info';
      case 'sent_to_vendor': return 'primary';
      case 'acknowledged': return 'info';
      case 'in_progress': return 'primary';
      case 'partially_received': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <ApprovedIcon />;
      case 'completed': return <ShippingIcon />;
      case 'cancelled': return <CancelledIcon />;
      case 'rejected': return <CancelledIcon />;
      case 'pending_approval': return <PendingIcon />;
      case 'in_progress': return <OrderIcon />;
      default: return <OrderIcon />;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getPriorityLabel = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const handleCreatePO = async (newPO: PurchaseOrder) => {
    // Refresh the purchase orders list
    await loadData();
    setCreatePOOpen(false);
  };

  const handleViewPO = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setViewPOOpen(true);
  };

  const stats = {
    totalOrders: purchaseOrders.length,
    pendingApproval: purchaseOrders.filter(o => o.status === 'pending_approval').length,
    approved: purchaseOrders.filter(o => o.status === 'approved' || o.status === 'sent_to_vendor').length,
    delivered: purchaseOrders.filter(o => o.status === 'completed').length,
    totalValue: purchaseOrders.reduce((sum, order) => sum + order.total_amount, 0),
    avgOrderValue: purchaseOrders.length > 0 ? 
      purchaseOrders.reduce((sum, order) => sum + order.total_amount, 0) / purchaseOrders.length : 0,
  };

  const recentOrders = purchaseOrders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const urgentOrders = purchaseOrders
    .filter(o => o.priority === 'urgent' && !['completed', 'cancelled', 'rejected'].includes(o.status))
    .slice(0, 5);

  return (
    <DashboardLayout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Purchase Orders
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage procurement, vendor orders, and delivery tracking
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreatePOOpen(true)}
          >
            Create Purchase Order
          </Button>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Total Orders
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={40} height={32} />
                    ) : (
                      <Typography variant="h5">{stats.totalOrders}</Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'primary.main' }}>
                    <OrderIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Pending
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={40} height={32} />
                    ) : (
                      <Badge badgeContent={stats.pendingApproval} color="warning">
                        <Typography variant="h5">{stats.pendingApproval}</Typography>
                      </Badge>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'warning.main' }}>
                    <PendingIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Approved
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={40} height={32} />
                    ) : (
                      <Typography variant="h5">{stats.approved}</Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'info.main' }}>
                    <ApprovedIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Delivered
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={40} height={32} />
                    ) : (
                      <Typography variant="h5">{stats.delivered}</Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'success.main' }}>
                    <ShippingIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Total Value
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={60} height={32} />
                    ) : (
                      <Typography variant="h6">₹{Number(stats.totalValue || 0).toLocaleString('en-IN')}</Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'secondary.main' }}>
                    <MoneyIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Avg Order
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={60} height={32} />
                    ) : (
                      <Typography variant="h6">₹{Number(stats.avgOrderValue || 0).toLocaleString('en-IN')}</Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'info.main' }}>
                    <TrendingUpIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={{ xs: 2, sm: 3 }}>
          <Grid item xs={12} lg={8}>
            {/* Filters */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={{ xs: 2, sm: 3 }} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Search purchase orders..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={selectedStatus}
                        label="Status"
                        onChange={(e) => setSelectedStatus(e.target.value)}
                      >
                        <MenuItem value="all">All Status</MenuItem>
                        <MenuItem value="draft">Draft</MenuItem>
                        <MenuItem value="pending_approval">Pending Approval</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="sent_to_vendor">Sent to Vendor</MenuItem>
                        <MenuItem value="acknowledged">Acknowledged</MenuItem>
                        <MenuItem value="in_progress">In Progress</MenuItem>
                        <MenuItem value="partially_received">Partially Received</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        value={selectedPriority}
                        label="Priority"
                        onChange={(e) => setSelectedPriority(e.target.value)}
                      >
                        <MenuItem value="all">All Priority</MenuItem>
                        <MenuItem value="urgent">Urgent</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="low">Low</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      {filteredOrders.length} of {purchaseOrders.length} orders
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Purchase Orders Table */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Purchase Orders ({filteredOrders.length})
                </Typography>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>PO Number</TableCell>
                        <TableCell>Vendor</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Order Date</TableCell>
                        <TableCell>Delivery Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Items</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        [1, 2, 3, 4, 5].map((item) => (
                          <TableRow key={item}>
                            <TableCell><Skeleton variant="text" width={100} /></TableCell>
                            <TableCell><Skeleton variant="text" width={150} /></TableCell>
                            <TableCell><Skeleton variant="rectangular" width={80} height={24} /></TableCell>
                            <TableCell><Skeleton variant="rectangular" width={80} height={24} /></TableCell>
                            <TableCell><Skeleton variant="text" width={100} /></TableCell>
                            <TableCell><Skeleton variant="text" width={100} /></TableCell>
                            <TableCell><Skeleton variant="text" width={80} /></TableCell>
                            <TableCell><Skeleton variant="text" width={40} /></TableCell>
                            <TableCell><Skeleton variant="text" width={100} /></TableCell>
                          </TableRow>
                        ))
                      ) : filteredOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9}>
                            <Box sx={{ p: 4, textAlign: 'center' }}>
                              <OrderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                              <Typography variant="h6" gutterBottom>
                                No purchase orders found
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {searchTerm || selectedStatus !== 'all' || selectedPriority !== 'all'
                                  ? 'Try adjusting your filters to see more results.'
                                  : 'Click "Create Purchase Order" to get started.'}
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrders.slice(0, 10).map((order) => (
                          <TableRow key={order._id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getStatusIcon(order.status)}
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                                    {order.po_number}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    by {order.requested_by?.name || 'Unknown'}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {order.vendor?.name || 'N/A'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {order.vendor?.vendor_code || ''}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getStatusLabel(order.status)}
                                color={getStatusColor(order.status) as any}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getPriorityLabel(order.priority)}
                                color={getPriorityColor(order.priority) as any}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {order.department}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {new Date(order.expected_delivery_date).toLocaleDateString()}
                              </Typography>
                              {order.actual_delivery_date && (
                                <Typography variant="caption" color="success.main" sx={{ display: 'block' }}>
                                  Delivered: {new Date(order.actual_delivery_date).toLocaleDateString()}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                ₹{Number(order.total_amount || 0).toLocaleString('en-IN')}
                              </Typography>
                              {order.tax_amount > 0 && (
                                <Typography variant="caption" color="text.secondary">
                                  +₹{Number(order.tax_amount || 0).toLocaleString('en-IN')} tax
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={`${order.items.length} items`}
                                size="small"
                                variant="outlined"
                                icon={<ItemsIcon />}
                              />
                            </TableCell>
                            <TableCell>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleViewPO(order)}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit">
                                <IconButton size="small" color="success">
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Download">
                                <IconButton size="small" color="info">
                                  <DownloadIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            {/* Recent Orders */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <OrderIcon />
                  Recent Orders
                </Typography>
                {loading ? (
                  [1, 2, 3].map((item) => (
                    <Box key={item} sx={{ mb: 2 }}>
                      <Skeleton variant="text" width="100%" />
                      <Skeleton variant="text" width="80%" />
                    </Box>
                  ))
                ) : recentOrders.length === 0 ? (
                  <Box sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
                    <OrderIcon sx={{ fontSize: { xs: 40, sm: 48 }, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No recent orders
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {recentOrders.map((order, index) => (
                      <React.Fragment key={order._id}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: getStatusColor(order.status) + '.main' }}>
                              {getStatusIcon(order.status)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={order.po_number}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {order.vendor?.name || 'N/A'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ₹{Number(order.total_amount || 0).toLocaleString('en-IN')} • {order.items.length} items
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < recentOrders.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>

            {/* Urgent Orders */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon color="error" />
                  Urgent Orders
                </Typography>
                {loading ? (
                  [1, 2, 3].map((item) => (
                    <Box key={item} sx={{ mb: 2 }}>
                      <Skeleton variant="text" width="100%" />
                      <Skeleton variant="rectangular" height={6} />
                    </Box>
                  ))
                ) : urgentOrders.length > 0 ? (
                  <Box>
                    {urgentOrders.map((order) => (
                      <Box key={order._id} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {order.po_number}
                          </Typography>
                          <Chip
                            label={getStatusLabel(order.status)}
                            color={getStatusColor(order.status) as any}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {order.vendor?.name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Expected: {new Date(order.expected_delivery_date).toLocaleDateString()}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(
                            ((new Date().getTime() - new Date(order.createdAt).getTime()) / 
                            (new Date(order.expected_delivery_date).getTime() - new Date(order.createdAt).getTime())) * 100,
                            100
                          )}
                          color="error"
                          sx={{ mt: 1, height: 4, borderRadius: 1 }}
                        />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No urgent orders at the moment
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Create PO Modal */}
        <PurchaseOrderModal
          open={createPOOpen}
          onClose={() => setCreatePOOpen(false)}
          onSubmit={handleCreatePO}
        />

        {/* View PO Dialog */}
        <Dialog open={viewPOOpen} onClose={() => setViewPOOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>
            Purchase Order Details - {selectedPO?.po_number}
          </DialogTitle>
          <DialogContent>
            {selectedPO && (
              <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Order Information</Typography>
                  <Typography variant="body2"><strong>Vendor:</strong> {selectedPO.vendor?.name || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Vendor Code:</strong> {selectedPO.vendor?.vendor_code || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Order Date:</strong> {new Date(selectedPO.createdAt).toLocaleDateString()}</Typography>
                  <Typography variant="body2"><strong>Expected Delivery:</strong> {new Date(selectedPO.expected_delivery_date).toLocaleDateString()}</Typography>
                  <Typography variant="body2"><strong>Payment Terms:</strong> {selectedPO.payment_terms}</Typography>
                  <Typography variant="body2"><strong>Department:</strong> {selectedPO.department}</Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong>{' '}
                    <Chip
                      label={getStatusLabel(selectedPO.status)}
                      color={getStatusColor(selectedPO.status) as any}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Financial Summary</Typography>
                  <Typography variant="body2"><strong>Subtotal:</strong> ₹{Number(selectedPO.subtotal || 0).toLocaleString('en-IN')}</Typography>
                  <Typography variant="body2"><strong>Tax Amount:</strong> ₹{Number(selectedPO.tax_amount || 0).toLocaleString('en-IN')}</Typography>
                  <Typography variant="body2"><strong>Shipping:</strong> ₹{Number(selectedPO.shipping_cost || 0).toLocaleString('en-IN')}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
                    <strong>Total Amount:</strong> ₹{Number(selectedPO.total_amount || 0).toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}><strong>Items Count:</strong> {selectedPO.items.length}</Typography>
                  <Typography variant="body2"><strong>Currency:</strong> {selectedPO.currency}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Requested By</Typography>
                  <Typography variant="body2">
                    {selectedPO.requested_by?.name || 'Unknown'} ({selectedPO.requested_by?.email || 'N/A'})
                  </Typography>
                  {selectedPO.approved_by && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Approved By:</strong> {selectedPO.approved_by.name} ({selectedPO.approved_by.email})
                    </Typography>
                  )}
                </Grid>
                {selectedPO.notes && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Notes</Typography>
                    <Typography variant="body2">{selectedPO.notes}</Typography>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button startIcon={<PrintIcon />}>Print</Button>
            <Button startIcon={<EmailIcon />}>Email</Button>
            <Button startIcon={<DownloadIcon />}>Download PDF</Button>
            <Button onClick={() => setViewPOOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default PurchaseOrdersPage;