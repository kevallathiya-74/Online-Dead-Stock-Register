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
  AttachMoney as MoneyIcon,
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

interface PurchaseOrder {
  id: string;
  vendor_name: string;
  vendor_id: string;
  order_date: string;
  expected_delivery: string;
  actual_delivery?: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Ordered' | 'Delivered' | 'Cancelled' | 'Invoiced';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  total_amount: number;
  currency: string;
  items_count: number;
  created_by: string;
  approved_by?: string;
  notes?: string;
  payment_terms: string;
  delivery_address: string;
  discount_percent: number;
  tax_amount: number;
}

// interface POItem {
//   id: string;
//   item_name: string;
//   description: string;
//   quantity: number;
//   unit_price: number;
//   total_price: number;
//   category: string;
// }

const PurchaseOrdersPage = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [createPOOpen, setCreatePOOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [viewPOOpen, setViewPOOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await api.get('/purchase-management/purchase-orders');
        const poData = response.data.data || response.data;
        setPurchaseOrders(poData);
      } catch (error) {
        console.error('Failed to load purchase orders:', error);
        toast.error('Failed to load purchase orders');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredOrders = purchaseOrders.filter((order) => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.created_by.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || order.priority === selectedPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'default';
      case 'Pending Approval': return 'warning';
      case 'Approved': return 'info';
      case 'Ordered': return 'primary';
      case 'Delivered': return 'success';
      case 'Cancelled': return 'error';
      case 'Invoiced': return 'secondary';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'error';
      case 'High': return 'warning';
      case 'Medium': return 'info';
      case 'Low': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved': return <ApprovedIcon />;
      case 'Delivered': return <ShippingIcon />;
      case 'Cancelled': return <CancelledIcon />;
      case 'Pending Approval': return <PendingIcon />;
      case 'Invoiced': return <InvoiceIcon />;
      default: return <OrderIcon />;
    }
  };

  const handleViewPO = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setViewPOOpen(true);
  };

  const stats = {
    totalOrders: purchaseOrders.length,
    pendingApproval: purchaseOrders.filter(o => o.status === 'Pending Approval').length,
    approved: purchaseOrders.filter(o => o.status === 'Approved').length,
    delivered: purchaseOrders.filter(o => o.status === 'Delivered').length,
    totalValue: purchaseOrders.reduce((sum, order) => sum + order.total_amount, 0),
    avgOrderValue: purchaseOrders.length > 0 ? 
      purchaseOrders.reduce((sum, order) => sum + order.total_amount, 0) / purchaseOrders.length : 0,
  };

  const recentOrders = purchaseOrders
    .sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())
    .slice(0, 5);

  const urgentOrders = purchaseOrders
    .filter(o => o.priority === 'Urgent' && !['Delivered', 'Cancelled'].includes(o.status))
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
        <Grid container spacing={3} sx={{ mb: 4 }}>
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
                      <Typography variant="h6">₹{(stats.totalValue / 10000000).toFixed(1)}Cr</Typography>
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
                      <Typography variant="h6">₹{(stats.avgOrderValue / 100000).toFixed(1)}L</Typography>
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

        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            {/* Filters */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={3} alignItems="center">
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
                        <MenuItem value="Draft">Draft</MenuItem>
                        <MenuItem value="Pending Approval">Pending Approval</MenuItem>
                        <MenuItem value="Approved">Approved</MenuItem>
                        <MenuItem value="Ordered">Ordered</MenuItem>
                        <MenuItem value="Delivered">Delivered</MenuItem>
                        <MenuItem value="Cancelled">Cancelled</MenuItem>
                        <MenuItem value="Invoiced">Invoiced</MenuItem>
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
                        <MenuItem value="Urgent">Urgent</MenuItem>
                        <MenuItem value="High">High</MenuItem>
                        <MenuItem value="Medium">Medium</MenuItem>
                        <MenuItem value="Low">Low</MenuItem>
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
                      ) : (
                        filteredOrders.slice(0, 10).map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getStatusIcon(order.status)}
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                                    {order.id}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    by {order.created_by}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {order.vendor_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {order.vendor_id}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={order.status}
                                color={getStatusColor(order.status) as any}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={order.priority}
                                color={getPriorityColor(order.priority) as any}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {new Date(order.order_date).toLocaleDateString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {new Date(order.expected_delivery).toLocaleDateString()}
                              </Typography>
                              {order.actual_delivery && (
                                <Typography variant="caption" color="success.main" sx={{ display: 'block' }}>
                                  Delivered: {new Date(order.actual_delivery).toLocaleDateString()}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                ₹{(order.total_amount / 100000).toFixed(1)}L
                              </Typography>
                              {order.discount_percent > 0 && (
                                <Typography variant="caption" color="success.main">
                                  {order.discount_percent}% off
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={`${order.items_count} items`}
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
                ) : (
                  <List>
                    {recentOrders.map((order, index) => (
                      <React.Fragment key={order.id}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: getStatusColor(order.status) + '.main' }}>
                              {getStatusIcon(order.status)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={order.id}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {order.vendor_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ₹{(order.total_amount / 100000).toFixed(1)}L • {order.items_count} items
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
                      <Box key={order.id} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {order.id}
                          </Typography>
                          <Chip
                            label={order.status}
                            color={getStatusColor(order.status) as any}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {order.vendor_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Expected: {new Date(order.expected_delivery).toLocaleDateString()}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(
                            ((new Date().getTime() - new Date(order.order_date).getTime()) / 
                            (new Date(order.expected_delivery).getTime() - new Date(order.order_date).getTime())) * 100,
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

        {/* Create PO Dialog */}
        <Dialog open={createPOOpen} onClose={() => setCreatePOOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create New Purchase Order</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Purchase order creation form would be implemented here with vendor selection, items, pricing, and delivery details.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreatePOOpen(false)}>Cancel</Button>
            <Button variant="contained">Create PO</Button>
          </DialogActions>
        </Dialog>

        {/* View PO Dialog */}
        <Dialog open={viewPOOpen} onClose={() => setViewPOOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>
            Purchase Order Details - {selectedPO?.id}
          </DialogTitle>
          <DialogContent>
            {selectedPO && (
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Order Information</Typography>
                  <Typography variant="body2"><strong>Vendor:</strong> {selectedPO.vendor_name}</Typography>
                  <Typography variant="body2"><strong>Order Date:</strong> {new Date(selectedPO.order_date).toLocaleDateString()}</Typography>
                  <Typography variant="body2"><strong>Expected Delivery:</strong> {new Date(selectedPO.expected_delivery).toLocaleDateString()}</Typography>
                  <Typography variant="body2"><strong>Payment Terms:</strong> {selectedPO.payment_terms}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Financial Summary</Typography>
                  <Typography variant="body2"><strong>Total Amount:</strong> ₹{(selectedPO.total_amount / 100000).toFixed(2)}L</Typography>
                  <Typography variant="body2"><strong>Discount:</strong> {selectedPO.discount_percent}%</Typography>
                  <Typography variant="body2"><strong>Tax:</strong> ₹{(selectedPO.tax_amount / 1000).toFixed(2)}K</Typography>
                  <Typography variant="body2"><strong>Items Count:</strong> {selectedPO.items_count}</Typography>
                </Grid>
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