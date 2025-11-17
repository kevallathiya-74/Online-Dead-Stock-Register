import React, { useState, useEffect } from 'react';
import { usePolling } from '../../hooks/usePolling';
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
  TextField,
  InputAdornment,
  Grid,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import api from '../../services/api';

interface Invoice {
  _id: string;
  invoice_number: string;
  purchase_order: {
    _id: string;
    po_number: string;
    status: string;
  };
  vendor: {
    _id: string;
    vendor_name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
  };
  vendor_gstin: string;
  invoice_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'received' | 'approved' | 'paid' | 'overdue' | 'cancelled';
  total_amount: number;
  tax_amount: number;
  subtotal: number;
  payment_method: 'bank_transfer' | 'cheque' | 'cash' | 'upi' | 'credit_card' | 'other';
  payment_date?: string;
  payment_reference?: string;
  items: InvoiceItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  totalAmount: number;
}

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadInvoiceData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/purchase-management/invoices');
      const data = response.data.data || response.data;
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading invoice data:', error);
      toast.error('Failed to load invoice data');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  // Real-time polling every 30 seconds
  usePolling(loadInvoiceData, {
    interval: 30000,
    enabled: true
  });

  useEffect(() => {
    loadInvoiceData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'default';
      case 'Sent':
        return 'info';
      case 'Received':
        return 'primary';
      case 'Approved':
        return 'warning';
      case 'Paid':
        return 'success';
      case 'Overdue':
        return 'error';
      case 'Cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid':
        return <CheckCircleIcon />;
      case 'Overdue':
        return <WarningIcon />;
      case 'Approved':
      case 'Received':
        return <ScheduleIcon />;
      default:
        return <ReceiptIcon />;
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.vendor?.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.purchase_order?.po_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || invoice.status === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setSelectedInvoice(null);
    setIsDetailModalOpen(false);
  };

  const handleApproveInvoice = async (invoice: Invoice) => {
    try {
      await api.patch(`/purchase-management/invoices/${invoice._id}/status`, {
        status: 'approved'
      });
      toast.success(`Invoice ${invoice.invoice_number} approved for payment`);
      loadInvoiceData(); // Refresh the list
    } catch (error) {
      toast.error('Failed to approve invoice');
    }
  };

  const handleMarkAsPaid = async (invoice: Invoice) => {
    try {
      await api.patch(`/purchase-management/invoices/${invoice._id}/status`, {
        status: 'paid',
        payment_date: new Date().toISOString()
      });
      toast.success(`Invoice ${invoice.invoice_number} marked as paid`);
      loadInvoiceData(); // Refresh the list
    } catch (error) {
      toast.error('Failed to mark invoice as paid');
    }
  };

  const paidCount = invoices.filter(inv => inv.status === 'paid').length;
  const pendingCount = invoices.filter(inv => ['received', 'approved'].includes(inv.status)).length;
  const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;
  const totalPaidAmount = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total_amount, 0);

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Invoice Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => toast.info('Create invoice feature coming soon')}
            >
              Create Invoice
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => toast.info('Invoice report download started')}
            >
              Export Report
            </Button>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Paid Invoices
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {paidCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ₹{totalPaidAmount.toLocaleString()}
                    </Typography>
                  </Box>
                  <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Pending Payment
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {pendingCount}
                    </Typography>
                  </Box>
                  <ScheduleIcon color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Overdue
                    </Typography>
                    <Typography variant="h4" color="error.main">
                      {overdueCount}
                    </Typography>
                  </Box>
                  <WarningIcon color="error" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Invoices
                    </Typography>
                    <Typography variant="h4">
                      {invoices.length}
                    </Typography>
                  </Box>
                  <ReceiptIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Filter */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search by invoice number, vendor, or PO number..."
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
                  <InputLabel>Status Filter</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status Filter"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="All">All Statuses</MenuItem>
                    <MenuItem value="Draft">Draft</MenuItem>
                    <MenuItem value="Sent">Sent</MenuItem>
                    <MenuItem value="Received">Received</MenuItem>
                    <MenuItem value="Approved">Approved</MenuItem>
                    <MenuItem value="Paid">Paid</MenuItem>
                    <MenuItem value="Overdue">Overdue</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={() => toast.info('Advanced filters coming soon')}
                >
                  Advanced Filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Invoices ({filteredInvoices.length})
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice</TableCell>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Purchase Order</TableCell>
                    <TableCell>Invoice Date</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Payment Method</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        Loading invoice data...
                      </TableCell>
                    </TableRow>
                  ) : filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        No invoices found matching your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <TableRow key={invoice._id}>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2">
                              {invoice.invoice_number}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              GSTIN: {invoice.vendor_gstin || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{invoice.vendor?.vendor_name || 'N/A'}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {invoice.purchase_order?.po_number || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {format(parseISO(invoice.invoice_date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2"
                            color={invoice.status === 'overdue' ? 'error.main' : 'text.primary'}
                          >
                            {format(parseISO(invoice.due_date), 'MMM dd, yyyy')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(invoice.status)}
                            label={invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            color={getStatusColor(invoice.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            ₹{invoice.total_amount.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Tax: ₹{invoice.tax_amount.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={invoice.payment_method.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewDetails(invoice)}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Print Invoice">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => toast.info(`Printing invoice ${invoice.invoice_number}`)}
                              >
                                <PrintIcon />
                              </IconButton>
                            </Tooltip>
                            {invoice.status === 'received' && (
                              <Tooltip title="Approve">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleApproveInvoice(invoice)}
                                >
                                  <CheckCircleIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            {invoice.status === 'approved' && (
                              <Tooltip title="Mark as Paid">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleMarkAsPaid(invoice)}
                                >
                                  <ReceiptIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Invoice Detail Modal */}
        <Dialog 
          open={isDetailModalOpen} 
          onClose={handleCloseDetailModal}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Invoice Details - {selectedInvoice?.invoice_number}
          </DialogTitle>
          <DialogContent>
            {selectedInvoice && (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Invoice Information</Typography>
                    <Typography variant="body2"><strong>Invoice Number:</strong> {selectedInvoice.invoice_number}</Typography>
                    <Typography variant="body2"><strong>Purchase Order:</strong> {selectedInvoice.purchase_order?.po_number || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>Invoice Date:</strong> {format(parseISO(selectedInvoice.invoice_date), 'MMM dd, yyyy')}</Typography>
                    <Typography variant="body2"><strong>Due Date:</strong> {format(parseISO(selectedInvoice.due_date), 'MMM dd, yyyy')}</Typography>
                    <Typography variant="body2"><strong>Status:</strong> 
                      <Chip
                        label={selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                        color={getStatusColor(selectedInvoice.status) as any}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Vendor Information</Typography>
                    <Typography variant="body2"><strong>Vendor:</strong> {selectedInvoice.vendor?.vendor_name || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>GSTIN:</strong> {selectedInvoice.vendor_gstin || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>Payment Method:</strong> {selectedInvoice.payment_method.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</Typography>
                    {selectedInvoice.payment_date && (
                      <Typography variant="body2"><strong>Payment Date:</strong> {format(parseISO(selectedInvoice.payment_date), 'MMM dd, yyyy')}</Typography>
                    )}
                    {selectedInvoice.payment_reference && (
                      <Typography variant="body2"><strong>Payment Ref:</strong> {selectedInvoice.payment_reference}</Typography>
                    )}
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>Invoice Items</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Tax Rate</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedInvoice.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">₹{item.unitPrice.toLocaleString()}</TableCell>
                          <TableCell align="right">{item.taxRate}%</TableCell>
                          <TableCell align="right">₹{item.totalAmount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2"><strong>Subtotal:</strong> ₹{selectedInvoice.subtotal.toLocaleString()}</Typography>
                      <Typography variant="body2"><strong>Tax Amount:</strong> ₹{selectedInvoice.tax_amount.toLocaleString()}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="h6" color="primary.main">
                        <strong>Total Amount: ₹{selectedInvoice.total_amount.toLocaleString()}</strong>
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {selectedInvoice.notes && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Notes</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedInvoice.notes}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetailModal}>
              Close
            </Button>
            <Button 
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => {
                toast.info(`Printing invoice ${selectedInvoice?.invoice_number}`);
                handleCloseDetailModal();
              }}
            >
              Print
            </Button>
            {selectedInvoice?.status === 'received' && (
              <Button 
                variant="contained" 
                color="success"
                onClick={() => {
                  handleApproveInvoice(selectedInvoice);
                  handleCloseDetailModal();
                }}
              >
                Approve
              </Button>
            )}
            {selectedInvoice?.status === 'approved' && (
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => {
                  handleMarkAsPaid(selectedInvoice);
                  handleCloseDetailModal();
                }}
              >
                Mark as Paid
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default InvoicesPage;