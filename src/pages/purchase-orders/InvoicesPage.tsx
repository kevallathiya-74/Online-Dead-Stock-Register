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

interface Invoice {
  id: string;
  invoiceNumber: string;
  purchaseOrderId: string;
  vendorName: string;
  vendorGSTIN: string;
  invoiceDate: string;
  dueDate: string;
  status: 'Draft' | 'Sent' | 'Received' | 'Approved' | 'Paid' | 'Overdue' | 'Cancelled';
  totalAmount: number;
  taxAmount: number;
  netAmount: number;
  paymentMethod: 'Bank Transfer' | 'Cheque' | 'Cash' | 'UPI' | 'Credit Card';
  paymentDate?: string;
  paymentReference?: string;
  items: InvoiceItem[];
  notes?: string;
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

  useEffect(() => {
    loadInvoiceData();
  }, []);

  const loadInvoiceData = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual API call
      const demoInvoices: Invoice[] = [
        {
          id: '1',
          invoiceNumber: 'INV-2024-001',
          purchaseOrderId: 'PO-2024-001',
          vendorName: 'TechCorp Solutions',
          vendorGSTIN: '27AABCT1234K1Z2',
          invoiceDate: '2024-10-01',
          dueDate: '2024-10-31',
          status: 'Approved',
          totalAmount: 118000,
          taxAmount: 18000,
          netAmount: 100000,
          paymentMethod: 'Bank Transfer',
          items: [
            {
              id: '1',
              description: 'Dell Laptop XPS 15',
              quantity: 2,
              unitPrice: 50000,
              taxRate: 18,
              totalAmount: 118000,
            },
          ],
          notes: 'Standard payment terms apply',
        },
        {
          id: '2',
          invoiceNumber: 'INV-2024-002',
          purchaseOrderId: 'PO-2024-002',
          vendorName: 'Office Supplies Ltd',
          vendorGSTIN: '27AABCO5678M1N3',
          invoiceDate: '2024-09-28',
          dueDate: '2024-10-28',
          status: 'Paid',
          totalAmount: 23600,
          taxAmount: 3600,
          netAmount: 20000,
          paymentMethod: 'UPI',
          paymentDate: '2024-10-15',
          paymentReference: 'TXN123456789',
          items: [
            {
              id: '1',
              description: 'Office Chairs',
              quantity: 10,
              unitPrice: 2000,
              taxRate: 18,
              totalAmount: 23600,
            },
          ],
        },
        {
          id: '3',
          invoiceNumber: 'INV-2024-003',
          purchaseOrderId: 'PO-2024-003',
          vendorName: 'IT Services Inc',
          vendorGSTIN: '27AABIT9876P5Q4',
          invoiceDate: '2024-10-05',
          dueDate: '2024-11-05',
          status: 'Received',
          totalAmount: 59000,
          taxAmount: 9000,
          netAmount: 50000,
          paymentMethod: 'Bank Transfer',
          items: [
            {
              id: '1',
              description: 'Software License - Annual',
              quantity: 1,
              unitPrice: 50000,
              taxRate: 18,
              totalAmount: 59000,
            },
          ],
          notes: 'License key to be provided after payment',
        },
        {
          id: '4',
          invoiceNumber: 'INV-2024-004',
          purchaseOrderId: 'PO-2024-004',
          vendorName: 'Hardware Mart',
          vendorGSTIN: '27AABHM4321X7Y8',
          invoiceDate: '2024-09-15',
          dueDate: '2024-10-15',
          status: 'Overdue',
          totalAmount: 35400,
          taxAmount: 5400,
          netAmount: 30000,
          paymentMethod: 'Cheque',
          items: [
            {
              id: '1',
              description: 'Network Switches',
              quantity: 3,
              unitPrice: 10000,
              taxRate: 18,
              totalAmount: 35400,
            },
          ],
        },
      ];

      setInvoices(demoInvoices);
    } catch (error) {
      console.error('Error loading invoice data:', error);
      toast.error('Failed to load invoice data');
    } finally {
      setLoading(false);
    }
  };

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
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.purchaseOrderId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || invoice.status === statusFilter;
    
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

  const handleApproveInvoice = (invoice: Invoice) => {
    toast.success(`Invoice ${invoice.invoiceNumber} approved for payment`);
    setInvoices(prev => prev.map(inv => 
      inv.id === invoice.id 
        ? { ...inv, status: 'Approved' as const }
        : inv
    ));
  };

  const handleMarkAsPaid = (invoice: Invoice) => {
    toast.success(`Invoice ${invoice.invoiceNumber} marked as paid`);
    setInvoices(prev => prev.map(inv => 
      inv.id === invoice.id 
        ? { 
            ...inv, 
            status: 'Paid' as const,
            paymentDate: new Date().toISOString().split('T')[0],
            paymentReference: `PAY-${Date.now()}`
          }
        : inv
    ));
  };

  const paidCount = invoices.filter(inv => inv.status === 'Paid').length;
  const pendingCount = invoices.filter(inv => ['Received', 'Approved'].includes(inv.status)).length;
  const overdueCount = invoices.filter(inv => inv.status === 'Overdue').length;
  const totalPaidAmount = invoices
    .filter(inv => inv.status === 'Paid')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

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
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2">
                              {invoice.invoiceNumber}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              GSTIN: {invoice.vendorGSTIN}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{invoice.vendorName}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {invoice.purchaseOrderId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {format(parseISO(invoice.invoiceDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2"
                            color={invoice.status === 'Overdue' ? 'error.main' : 'text.primary'}
                          >
                            {format(parseISO(invoice.dueDate), 'MMM dd, yyyy')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(invoice.status)}
                            label={invoice.status}
                            color={getStatusColor(invoice.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            ₹{invoice.totalAmount.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Net: ₹{invoice.netAmount.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={invoice.paymentMethod}
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
                                onClick={() => toast.info(`Printing invoice ${invoice.invoiceNumber}`)}
                              >
                                <PrintIcon />
                              </IconButton>
                            </Tooltip>
                            {invoice.status === 'Received' && (
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
                            {invoice.status === 'Approved' && (
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
            Invoice Details - {selectedInvoice?.invoiceNumber}
          </DialogTitle>
          <DialogContent>
            {selectedInvoice && (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Invoice Information</Typography>
                    <Typography variant="body2"><strong>Invoice Number:</strong> {selectedInvoice.invoiceNumber}</Typography>
                    <Typography variant="body2"><strong>Purchase Order:</strong> {selectedInvoice.purchaseOrderId}</Typography>
                    <Typography variant="body2"><strong>Invoice Date:</strong> {format(parseISO(selectedInvoice.invoiceDate), 'MMM dd, yyyy')}</Typography>
                    <Typography variant="body2"><strong>Due Date:</strong> {format(parseISO(selectedInvoice.dueDate), 'MMM dd, yyyy')}</Typography>
                    <Typography variant="body2"><strong>Status:</strong> 
                      <Chip
                        label={selectedInvoice.status}
                        color={getStatusColor(selectedInvoice.status) as any}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Vendor Information</Typography>
                    <Typography variant="body2"><strong>Vendor:</strong> {selectedInvoice.vendorName}</Typography>
                    <Typography variant="body2"><strong>GSTIN:</strong> {selectedInvoice.vendorGSTIN}</Typography>
                    <Typography variant="body2"><strong>Payment Method:</strong> {selectedInvoice.paymentMethod}</Typography>
                    {selectedInvoice.paymentDate && (
                      <Typography variant="body2"><strong>Payment Date:</strong> {format(parseISO(selectedInvoice.paymentDate), 'MMM dd, yyyy')}</Typography>
                    )}
                    {selectedInvoice.paymentReference && (
                      <Typography variant="body2"><strong>Payment Ref:</strong> {selectedInvoice.paymentReference}</Typography>
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
                      <Typography variant="body2"><strong>Net Amount:</strong> ₹{selectedInvoice.netAmount.toLocaleString()}</Typography>
                      <Typography variant="body2"><strong>Tax Amount:</strong> ₹{selectedInvoice.taxAmount.toLocaleString()}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="h6" color="primary.main">
                        <strong>Total Amount: ₹{selectedInvoice.totalAmount.toLocaleString()}</strong>
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
                toast.info(`Printing invoice ${selectedInvoice?.invoiceNumber}`);
                handleCloseDetailModal();
              }}
            >
              Print
            </Button>
            {selectedInvoice?.status === 'Received' && (
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
            {selectedInvoice?.status === 'Approved' && (
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