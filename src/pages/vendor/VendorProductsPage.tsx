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
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { getProducts } from '../../services/vendorPortal.service';
import type { VendorProduct } from '../../types';
import { format } from 'date-fns';

const VendorProductsPage: React.FC = () => {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    loadProducts();
  }, [page, rowsPerPage, searchTerm, categoryFilter, statusFilter]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: page + 1,
        limit: rowsPerPage
      };

      if (searchTerm) params.search = searchTerm;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;

      const { products: productsData, pagination } = await getProducts(params);

      setProducts(productsData);
      setTotalProducts(pagination.total);
    } catch (err: any) {
      console.error('Error loading products:', err);
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'in_maintenance':
        return 'warning';
      case 'disposed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getConditionColor = (condition: string): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
    switch (condition) {
      case 'excellent':
        return 'success';
      case 'good':
        return 'primary';
      case 'fair':
        return 'warning';
      case 'poor':
      case 'damaged':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My Products
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        View all products (assets) supplied by your company
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by product name, ID, or description..."
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

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="Electronics">Electronics</MenuItem>
                <MenuItem value="Furniture">Furniture</MenuItem>
                <MenuItem value="Equipment">Equipment</MenuItem>
                <MenuItem value="Vehicles">Vehicles</MenuItem>
                <MenuItem value="Tools">Tools</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="in_maintenance">In Maintenance</MenuItem>
                <MenuItem value="disposed">Disposed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Products Table */}
      <Paper>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Asset ID</TableCell>
                    <TableCell>Product Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Condition</TableCell>
                    <TableCell>Purchase Price</TableCell>
                    <TableCell>Current Value</TableCell>
                    <TableCell>Purchase Date</TableCell>
                    <TableCell>Assigned To</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.length > 0 ? (
                    products.map((product) => (
                      <TableRow key={product._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {product.asset_id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{product.name}</Typography>
                          {product.description && (
                            <Typography variant="caption" color="text.secondary">
                              {product.description.substring(0, 50)}
                              {product.description.length > 50 ? '...' : ''}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>
                          <Chip
                            label={product.status.replace(/_/g, ' ')}
                            size="small"
                            color={getStatusColor(product.status)}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={product.condition}
                            size="small"
                            color={getConditionColor(product.condition)}
                          />
                        </TableCell>
                        <TableCell>{formatCurrency(product.purchase_price)}</TableCell>
                        <TableCell>{formatCurrency(product.current_value)}</TableCell>
                        <TableCell>
                          {format(new Date(product.purchase_date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          {product.assigned_to ? (
                            <>
                              <Typography variant="body2">
                                {product.assigned_to.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {product.assigned_to.department}
                              </Typography>
                            </>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Unassigned
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No products found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalProducts}
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
    </Box>
  );
};

export default VendorProductsPage;
