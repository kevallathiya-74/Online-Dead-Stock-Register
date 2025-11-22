import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider
} from '@mui/material';
import { Search, Visibility, Close } from '@mui/icons-material';
import { getOrders, getOrderById } from '../../services/vendorPortal.service';
import type { VendorOrder } from '../../types';
import { format } from 'date-fns';
import DashboardLayout from '../../components/layout/DashboardLayout';

const VendorOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    loadOrders();
  }, [page, rowsPerPage, searchTerm, statusFilter, priorityFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string | number> = {
        page: page + 1,
        limit: rowsPerPage
      };

      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const { orders: ordersData, pagination } = await getOrders(params);

      setOrders(ordersData);
      setTotalOrders(pagination.total);
    } catch (err: unknown) {
      setError((err as any).response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (orderId: string) => {
    try {
      setDetailsLoading(true);
      setDetailsOpen(true);
      const orderDetails = await getOrderById(orderId);
      setSelectedOrder(orderDetails);
    } catch (err: unknown) {
      setError((err as any).response?.data?.message || 'Failed to load order details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedOrder(null);
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

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h4" gutterBottom>
          My Orders
        </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        View and manage all your purchase orders
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search by order number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="pending_approval">Pending Approval</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="sent_to_vendor">Sent to Vendor</MenuItem>
                <MenuItem value="acknowledged">Acknowledged</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={priorityFilter}
                label="Priority"
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <MenuItem value="">All Priorities</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Orders Table */}
      <Paper>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: { xs: 2, sm: 3, md: 4 } }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
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
                    <TableCell>Expected Delivery</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.length > 0 ? (
                    orders.map((order) => (
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
                            label={order.status.replace(/_/g, ' ')}
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
                          {format(new Date(order.expected_delivery_date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(order._id)}
                            title="View Details"
                          >
                            <Visibility />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No orders found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalOrders}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )}
      </Paper>

      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Order Details</Typography>
            <IconButton onClick={handleCloseDetails} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {detailsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : selectedOrder ? (
            <Box>
              {/* Order Info */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Order Number
                  </Typography>
                  <Typography variant="body1">{selectedOrder.po_number}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedOrder.status?.replace(/_/g, ' ')}
                    size="small"
                    color={getStatusColor(selectedOrder.status)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Order Date
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(selectedOrder.createdAt), 'MMM dd, yyyy')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Expected Delivery
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(selectedOrder.expected_delivery_date), 'MMM dd, yyyy')}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Items */}
              <Typography variant="subtitle1" gutterBottom>
                Order Items
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.items?.map((item: Record<string, unknown>, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{String(item.description || '')}</TableCell>
                        <TableCell>{String(item.category || '')}</TableCell>
                        <TableCell align="right">{String(item.quantity || 0)}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(Number(item.unit_price || 0))}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(Number(item.total_price || 0))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Box>
                  <Typography variant="body2">
                    Subtotal: {formatCurrency(selectedOrder.subtotal)}
                  </Typography>
                  {selectedOrder.tax_amount > 0 && (
                    <Typography variant="body2">
                      Tax: {formatCurrency(selectedOrder.tax_amount)}
                    </Typography>
                  )}
                  {selectedOrder.shipping_cost > 0 && (
                    <Typography variant="body2">
                      Shipping: {formatCurrency(selectedOrder.shipping_cost)}
                    </Typography>
                  )}
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    Total: {formatCurrency(selectedOrder.total_amount)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
    </DashboardLayout>
  );
};

export default VendorOrdersPage;
