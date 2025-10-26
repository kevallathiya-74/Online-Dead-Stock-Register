import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  InputAdornment,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Calculate as CalculateIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';

interface PurchaseOrderModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (poData: any) => void;
}

interface OrderItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    vendor: '',
    delivery_date: '',
    billing_address: '',
    shipping_address: '',
    terms: 'Net 30',
    notes: '',
    urgent: false,
  });

  const [items, setItems] = useState<OrderItem[]>([]);
  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 1,
    unit_price: 0,
  });
  
  const [loading, setLoading] = useState(false);

  const vendors = [
    'TechCorp Solutions Pvt Ltd',
    'Office Plus Supplies',
    'Global IT Hardware',
    'Premium Furniture Co.',
    'Industrial Equipment Ltd',
    'Digital Solutions Inc',
  ];

  const terms = [
    'Net 15',
    'Net 30',
    'Net 45',
    'Net 60',
    'Cash on Delivery',
    '2/10 Net 30',
  ];

  const generatePONumber = () => {
    const prefix = 'PO';
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${year}${month}-${random}`;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemChange = (field: string, value: any) => {
    setNewItem(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addItem = () => {
    if (!newItem.description.trim()) {
      toast.error('Please enter item description');
      return;
    }

    const item: OrderItem = {
      id: Date.now().toString(),
      description: newItem.description,
      quantity: newItem.quantity,
      unit_price: newItem.unit_price,
      total: newItem.quantity * newItem.unit_price,
    };

    setItems(prev => [...prev, item]);
    setNewItem({
      description: '',
      quantity: 1,
      unit_price: 0,
    });
    toast.success('Item added to purchase order');
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
    toast.info('Item removed from purchase order');
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax;
    
    return { subtotal, tax, total };
  };

  const handleSubmit = async () => {
    if (!formData.vendor) {
      toast.error('Please select a vendor');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    setLoading(true);
    try {
      const poNumber = generatePONumber();
      const { subtotal, tax, total } = calculateTotals();
      
      const purchaseOrder = {
        ...formData,
        items,
        subtotal,
        tax,
        total,
        status: 'Draft',
        po_number: poNumber,
      };

      const response = await api.post('/purchase-management/purchase-orders', purchaseOrder);
      const createdPO = response.data.data || response.data;
      
      onSubmit(createdPO);
      toast.success(`Purchase Order ${poNumber} created successfully!`);
      
      // Reset form
      setFormData({
        vendor: '',
        delivery_date: '',
        billing_address: '',
        shipping_address: '',
        terms: 'Net 30',
        notes: '',
        urgent: false,
      });
      setItems([]);
      onClose();
    } catch (error) {
      toast.error('Failed to create purchase order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, tax, total } = calculateTotals();

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Create Purchase Order</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Vendor Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Vendor Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Vendor</InputLabel>
                      <Select
                        value={formData.vendor}
                        label="Vendor"
                        onChange={(e) => handleInputChange('vendor', e.target.value)}
                      >
                        {vendors.map((vendor) => (
                          <MenuItem key={vendor} value={vendor}>
                            {vendor}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Delivery Date"
                      type="date"
                      value={formData.delivery_date}
                      onChange={(e) => handleInputChange('delivery_date', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Payment Terms</InputLabel>
                      <Select
                        value={formData.terms}
                        label="Payment Terms"
                        onChange={(e) => handleInputChange('terms', e.target.value)}
                      >
                        {terms.map((term) => (
                          <MenuItem key={term} value={term}>
                            {term}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Address Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Address Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Billing Address"
                      multiline
                      rows={2}
                      value={formData.billing_address}
                      onChange={(e) => handleInputChange('billing_address', e.target.value)}
                      placeholder="Enter billing address..."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Shipping Address"
                      multiline
                      rows={2}
                      value={formData.shipping_address}
                      onChange={(e) => handleInputChange('shipping_address', e.target.value)}
                      placeholder="Enter shipping address..."
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Add Items */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Add Items</Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={5}>
                    <TextField
                      fullWidth
                      label="Item Description"
                      value={newItem.description}
                      onChange={(e) => handleItemChange('description', e.target.value)}
                      placeholder="e.g., Dell Laptop XPS 15"
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="Quantity"
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) => handleItemChange('quantity', parseInt(e.target.value) || 1)}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Unit Price"
                      type="number"
                      value={newItem.unit_price}
                      onChange={(e) => handleItemChange('unit_price', parseFloat(e.target.value) || 0)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={addItem}
                      startIcon={<AddIcon />}
                    >
                      Add
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Items Table */}
          {items.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Order Items</Typography>
                  <TableContainer component={Paper} elevation={0}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Description</TableCell>
                          <TableCell align="center">Quantity</TableCell>
                          <TableCell align="right">Unit Price</TableCell>
                          <TableCell align="right">Total</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell align="center">{item.quantity}</TableCell>
                            <TableCell align="right">₹{item.unit_price.toLocaleString()}</TableCell>
                            <TableCell align="right">₹{item.total.toLocaleString()}</TableCell>
                            <TableCell align="center">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => removeItem(item.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Totals */}
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Card sx={{ minWidth: 300 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>Subtotal:</Typography>
                          <Typography>₹{subtotal.toLocaleString()}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>Tax (18% GST):</Typography>
                          <Typography>₹{tax.toLocaleString()}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: 1, borderColor: 'divider' }}>
                          <Typography variant="h6">Total:</Typography>
                          <Typography variant="h6" color="primary">₹{total.toLocaleString()}</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes or special instructions..."
            />
          </Grid>

          {/* Preview */}
          {items.length > 0 && (
            <Grid item xs={12}>
              <Alert severity="success" icon={<CalculateIcon />}>
                <Typography variant="body2">
                  Purchase Order will be created with <strong>{items.length}</strong> items 
                  totaling <strong>₹{total.toLocaleString()}</strong>
                </Typography>
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || items.length === 0}
        >
          {loading ? 'Creating Purchase Order...' : 'Create Purchase Order'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PurchaseOrderModal;