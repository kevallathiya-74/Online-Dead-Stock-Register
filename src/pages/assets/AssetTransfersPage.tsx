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
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  SwapHoriz as TransferIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  Cancel as CancelledIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

interface AssetTransfer {
  _id: string;
  asset: {
    _id: string;
    name: string;
    unique_asset_id: string;
  };
  from_location?: string;
  to_location?: string;
  from_user?: { name: string };
  to_user?: { name: string };
  transfer_date: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
  reason?: string;
  notes?: string;
  created_by: { name: string };
  created_at: string;
}

const AssetTransfersPage: React.FC = () => {
  const [transfers, setTransfers] = useState<AssetTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadTransfers();
  }, []);

  const loadTransfers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/asset-transfers');
      setTransfers(response.data);
    } catch (error: any) {
      console.error('Failed to load transfers:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load transfers';
      toast.error(errorMsg);
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransfers = transfers.filter((transfer) => {
    const matchesSearch = 
      transfer.asset?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.asset?.unique_asset_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.from_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.to_location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || transfer.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CompletedIcon />;
      case 'Pending':
        return <PendingIcon />;
      case 'Cancelled':
        return <CancelledIcon />;
      default:
        return <TransferIcon />;
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </DashboardLayout>
    );
  }

  const stats = {
    total: transfers.length,
    pending: transfers.filter(t => t.status === 'Pending').length,
    completed: transfers.filter(t => t.status === 'Completed').length,
    cancelled: transfers.filter(t => t.status === 'Cancelled').length,
  };

  return (
    <DashboardLayout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Asset Transfers
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track asset movements and transfers
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />}>
            New Transfer
          </Button>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="overline">
                  Total Transfers
                </Typography>
                <Typography variant="h4">{stats.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="overline">
                  Pending
                </Typography>
                <Typography variant="h4" color="warning.main">{stats.pending}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="overline">
                  Completed
                </Typography>
                <Typography variant="h4" color="success.main">{stats.completed}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="overline">
                  Cancelled
                </Typography>
                <Typography variant="h4" color="error.main">{stats.cancelled}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search by asset name, ID, or location..."
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
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={selectedStatus}
                    label="Status"
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Transfers Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Transfer History ({filteredTransfers.length})
            </Typography>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Asset</TableCell>
                    <TableCell>From</TableCell>
                    <TableCell>To</TableCell>
                    <TableCell>Transfer Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Initiated By</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTransfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                          No transfers found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransfers.map((transfer) => (
                      <TableRow key={transfer._id}>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2">
                              {transfer.asset?.name || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {transfer.asset?.unique_asset_id || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {transfer.from_location || 'N/A'}
                            </Typography>
                            {transfer.from_user && (
                              <Typography variant="caption" color="text.secondary">
                                {transfer.from_user.name}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {transfer.to_location || 'N/A'}
                            </Typography>
                            {transfer.to_user && (
                              <Typography variant="caption" color="text.secondary">
                                {transfer.to_user.name}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {new Date(transfer.transfer_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(transfer.status)}
                            label={transfer.status}
                            color={getStatusColor(transfer.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{transfer.created_by?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {transfer.reason || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
};

export default AssetTransfersPage;
