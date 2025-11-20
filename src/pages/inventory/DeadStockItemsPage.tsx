import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Chip,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FileDownload as ExportIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import assetUpdateService from '../../services/assetUpdateService';

interface DeadStockAsset {
  _id: string;
  id?: string; // Deprecated: use _id
  unique_asset_id: string;
  category: string;
  asset_type: string;
  model: string;
  manufacturer: string;
  purchase_date: string;
  purchase_cost: number;  // ✅ Fixed: Changed from purchase_value
  reason_for_dead_stock: string;
  status: string;
  location: string;
}

const DeadStockItemsPage: React.FC = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<DeadStockAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [stats, setStats] = useState({
    totalDeadStock: 0,
    totalValue: 0,
    pendingDisposal: 0,
  });

  useEffect(() => {
    fetchDeadStockAssets();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, searchTerm]);

  // Subscribe to global asset updates for real-time refresh
  useEffect(() => {
    console.log('📡 DeadStockItems: Subscribing to global asset updates');
    
    const unsubscribe = assetUpdateService.subscribeGlobal((assetId, updateData) => {
      console.log('🔔 DeadStockItems: Received update for asset:', assetId, updateData);
      
      // Refresh dead stock list if any asset is updated
      fetchDeadStockAssets();
      fetchStats();
    });

    return () => {
      console.log('📡 DeadStockItems: Unsubscribing from global updates');
      unsubscribe();
    };
  }, []);

  const fetchDeadStockAssets = async () => {
    const abortController = new AbortController();
    
    try {
      setLoading(true);
      // Call the API endpoint with server-side pagination
      const response = await api.get('/inventory/dead-stock', {
        params: {
          page: page + 1, // API expects 1-based page numbers
          limit: rowsPerPage,
          search: searchTerm,
        },
        signal: abortController.signal,
      });

      if (response.data?.success && response.data?.data) {
        setAssets(response.data.data);
        setTotalItems(response.data.pagination?.totalItems || 0);
      } else {
        setAssets([]);
        setTotalItems(0);
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        return; // Request was cancelled, don't show error
      }
      console.error('Error fetching dead stock assets:', error);
      setAssets([]);
      setTotalItems(0);
      if (error.response?.status === 404) {
        toast.error('Dead stock endpoint not found. Please check backend.');
      } else {
        toast.error('Failed to load dead stock items');
      }
    } finally {
      setLoading(false);
    }
    
    return () => abortController.abort();
  };

  const fetchStats = async () => {
    try {
      console.log('📊 Fetching dead stock stats...');
      const response = await api.get('/inventory/dead-stock/stats');
      if (response.data?.success && response.data?.data) {
        console.log('📊 Stats received:', response.data.data);
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dead stock stats:', error);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'dead_stock':
        return 'error';
      case 'pending_disposal':
        return 'warning';
      case 'marked_for_scrap':
        return 'default';
      default:
        return 'default';
    }
  };

  const handleExport = () => {
    toast.info('Export functionality will be implemented');
  };

  const handleViewDetails = (asset: DeadStockAsset) => {
    // Navigate to asset details page with state to enable proper back navigation
    navigate(`/assets/${asset._id}`, {
      state: { from: '/inventory/dead-stock' }
    });
  };

  const handleMarkForDisposal = async (asset: DeadStockAsset) => {
    if (!window.confirm(`Are you sure you want to mark "${asset.unique_asset_id}" for disposal?`)) {
      return;
    }

    try {
      // Prepare disposal record payload with ALL required fields
      const disposalPayload = {
        asset_id: asset.unique_asset_id, // Use unique_asset_id (string) as required by schema
        asset_name: `${asset.manufacturer} ${asset.model}`,
        category: asset.asset_type,
        disposal_method: 'Scrap', // Changed from disposal_type to disposal_method
        disposal_value: Math.round(asset.purchase_cost * 0.1), // 10% of purchase cost  // ✅ Fixed
        disposal_date: new Date().toISOString(),
        status: 'pending',
        remarks: asset.reason_for_dead_stock || 'Marked from dead stock items page'
      };

      console.log('Creating disposal record with payload:', disposalPayload);

      // Create disposal record
      const disposalResponse = await api.post('/inventory/disposal-records', disposalPayload);

      if (disposalResponse.data.success) {
        console.log('Disposal record created:', disposalResponse.data.data);

        // Optimistic UI update - immediately decrease counter before API refresh
        setStats(prevStats => ({
          ...prevStats,
          totalDeadStock: Math.max(0, prevStats.totalDeadStock - 1),
          totalValue: Math.max(0, prevStats.totalValue - asset.purchase_cost),  // ✅ Fixed
          pendingDisposal: prevStats.pendingDisposal + 1
        }));

        // Update asset status to "Disposed" to remove it from dead stock list
        // Using "Disposed" status instead of "Ready for Scrap" so it won't appear in dead stock items anymore
        try {
          await api.put(`/assets/${asset._id}`, {
            status: 'Disposed', // Changed to "Disposed" to exclude from dead stock query
            notes: `Marked for disposal on ${new Date().toLocaleDateString()}. Disposal Record: ${disposalResponse.data.data.document_reference || 'N/A'}. ${asset.reason_for_dead_stock || ''}`
          });
          console.log('Asset status updated to Disposed');
        } catch (updateError) {
          console.warn('Asset status update failed, but disposal record created:', updateError);
        }

        // Notify the update service for real-time synchronization
        assetUpdateService.notifyStatusChange(
          asset.id || '',
          asset.status,
          'Disposed'
        );

        toast.success(`Asset ${asset.unique_asset_id} marked for disposal successfully and removed from dead stock`);
        
        console.log('🔄 Refreshing dead stock list and stats after disposal...');
        
        // Refresh the data to show updated status (asset should now be removed from list)
        // This will correct any discrepancy from the optimistic update
        await Promise.all([
          fetchDeadStockAssets(),
          fetchStats()
        ]);
        
        console.log('✅ Dead stock list and stats refreshed successfully');
      }
    } catch (error: any) {
      console.error('Error marking asset for disposal:', error);
      
      // Extract detailed error message
      let errorMsg = 'Failed to mark asset for disposal';
      
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      // Show validation errors if present
      if (error.response?.data?.errors) {
        const validationErrors = Object.values(error.response.data.errors).join(', ');
        errorMsg = `Validation error: ${validationErrors}`;
      }
      
      toast.error(errorMsg);
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Dead Stock Items
          </Typography>
        <Button
          variant="outlined"
          startIcon={<ExportIcon />}
          onClick={handleExport}
        >
          Export Report
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Dead Stock Items
              </Typography>
              <Typography variant="h4" component="div">
                {stats.totalDeadStock}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Value (₹)
              </Typography>
              <Typography variant="h4" component="div">
                ₹{(stats.totalValue / 100000).toFixed(2)}L
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Pending Disposal
              </Typography>
              <Typography variant="h4" component="div">
                {stats.pendingDisposal}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Search dead stock items..."
            variant="outlined"
            size="small"
            fullWidth
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
          <Button variant="outlined" startIcon={<FilterIcon />}>
            Filters
          </Button>
        </Box>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Asset ID</strong></TableCell>
              <TableCell><strong>Category</strong></TableCell>
              <TableCell><strong>Model</strong></TableCell>
              <TableCell><strong>Manufacturer</strong></TableCell>
              <TableCell><strong>Purchase Date</strong></TableCell>
              <TableCell><strong>Purchase Value</strong></TableCell>
              <TableCell><strong>Reason</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Location</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : assets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  No dead stock items found
                </TableCell>
              </TableRow>
            ) : (
              assets.map((asset) => (
                  <TableRow key={asset._id} hover>
                    <TableCell>{asset.unique_asset_id}</TableCell>
                    <TableCell>{asset.asset_type}</TableCell>
                    <TableCell>{asset.model}</TableCell>
                    <TableCell>{asset.manufacturer}</TableCell>
                    <TableCell>{asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>₹{asset.purchase_cost?.toLocaleString('en-IN')}</TableCell>  {/* ✅ Fixed */}
                    <TableCell>{asset.reason_for_dead_stock}</TableCell>
                    <TableCell>
                      <Chip
                        label={asset.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(asset.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{asset.location}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleViewDetails(asset)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Mark for Disposal">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleMarkForDisposal(asset)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalItems}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
      </Box>
    </DashboardLayout>
  );
};

export default DeadStockItemsPage;
