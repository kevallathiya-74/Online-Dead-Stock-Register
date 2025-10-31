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

interface DeadStockAsset {
  id: string;
  unique_asset_id: string;
  category: string;
  model: string;
  manufacturer: string;
  purchase_date: string;
  purchase_value: number;
  reason_for_dead_stock: string;
  status: string;
  location: string;
}

const DeadStockItemsPage: React.FC = () => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, searchTerm]);

  useEffect(() => {
    fetchStats();
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
      const response = await api.get('/inventory/dead-stock/stats');
      if (response.data?.success && response.data?.data) {
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

  const handleMarkForDisposal = async (asset: DeadStockAsset) => {
    if (!window.confirm(`Are you sure you want to mark "${asset.unique_asset_id}" for disposal?`)) {
      return;
    }

    try {
      await api.post(`/inventory/disposal-records`, {
        asset_id: asset.id,
        disposal_type: 'Scrap',
        reason: asset.reason_for_dead_stock || 'Marked from dead stock',
        estimated_value: asset.purchase_value * 0.1, // 10% of purchase value as scrap value
      });

      toast.success(`Asset ${asset.unique_asset_id} marked for disposal successfully`);
      
      // Refresh the data
      await fetchDeadStockAssets();
      await fetchStats();
    } catch (error: any) {
      console.error('Error marking asset for disposal:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to mark asset for disposal';
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
                  <TableRow key={asset.id} hover>
                    <TableCell>{asset.unique_asset_id}</TableCell>
                    <TableCell>{asset.category}</TableCell>
                    <TableCell>{asset.model}</TableCell>
                    <TableCell>{asset.manufacturer}</TableCell>
                    <TableCell>{asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>₹{asset.purchase_value?.toLocaleString('en-IN')}</TableCell>
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
                        <IconButton size="small" color="primary">
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
