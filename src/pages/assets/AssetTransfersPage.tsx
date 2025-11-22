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
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  SwapHoriz as TransferIcon,
  CheckCircle as CompletedIcon,
  CheckCircle,
  Schedule as PendingIcon,
  Cancel as CancelledIcon,
  Visibility as ViewIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AssetTransferModal from '../../components/modals/AssetTransferModal';
import api from '../../services/api';
import { usePolling } from '../../hooks/usePolling';

interface AssetTransfer {
  _id: string;
  transfer_id: string;
  asset: {
    _id: string;
    name: string;
    unique_asset_id: string;
  };
  from_location: string;
  to_location: string;
  from_user: { 
    _id: string;
    full_name: string;
    email: string;
  };
  to_user: { 
    _id: string;
    full_name: string;
    email: string;
  };
  initiated_by: {
    _id: string;
    full_name: string;
    email: string;
  };
  transfer_reason: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_transit' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expected_transfer_date: string;
  actual_transfer_date?: string;
  transfer_date?: string;
  completion_date?: string;
  approved_by?: {
    _id: string;
    full_name: string;
  };
  approved_at?: string;
  rejection_reason?: string;
  createdAt: string;
  updatedAt: string;
}

const AssetTransfersPage: React.FC = () => {
  const [transfers, setTransfers] = useState<AssetTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  useEffect(() => {
    loadTransfers();
  }, []);

  // Real-time polling for transfers every 30 seconds
  usePolling(
    async () => {
      await loadTransfers();
    },
    {
      interval: 30000,
      enabled: true
    }
  );

  const loadTransfers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/asset-transfers');
      // Backend returns { transfers: [], pagination: {} }
      const transfersData = response.data.transfers || response.data.data || response.data;
      setTransfers(Array.isArray(transfersData) ? transfersData : []);
    } catch (error: any) {
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
      transfer.to_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.transfer_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.from_user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.to_user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || transfer.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CompletedIcon />;
      case 'pending':
        return <PendingIcon />;
      case 'approved':
        return <CheckCircle />;
      case 'in_transit':
        return <TransferIcon />;
      case 'cancelled':
      case 'rejected':
        return <CancelledIcon />;
      default:
        return <TransferIcon />;
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'approved':
        return 'info';
      case 'in_transit':
        return 'info';
      case 'rejected':
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'in_transit': return 'In Transit';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const handleApproveTransfer = async (transferId: string) => {
    try {
      await api.patch(`/asset-transfers/${transferId}/status`, { status: 'approved' });
      toast.success('Transfer approved successfully');
      await loadTransfers();
    } catch (error) { /* Error handled by API interceptor */ }
  };

  const handleRejectTransfer = async (transferId: string) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      await api.patch(`/asset-transfers/${transferId}/status`, { 
        status: 'rejected',
        rejection_reason: reason 
      });
      toast.success('Transfer rejected');
      await loadTransfers();
    } catch (error) { /* Error handled by API interceptor */ }
  };

  const handleViewTransfer = (transferId: string) => {
    toast.info('Transfer details view - Coming soon');
  };

  const handleOpenTransferModal = () => {
    setTransferModalOpen(true);
  };

  const handleCloseTransferModal = () => {
    setTransferModalOpen(false);
  };

  const handleTransferSubmit = async () => {
    await loadTransfers();
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
    pending: transfers.filter(t => t.status === 'pending').length,
    approved: transfers.filter(t => t.status === 'approved').length,
    in_transit: transfers.filter(t => t.status === 'in_transit').length,
    completed: transfers.filter(t => t.status === 'completed').length,
    cancelled: transfers.filter(t => t.status === 'cancelled' || t.status === 'rejected').length,
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
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenTransferModal}>
            New Transfer
          </Button>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="overline">
                  Total Transfers
                </Typography>
                <Typography variant="h4">{stats.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="overline">
                  Pending
                </Typography>
                <Typography variant="h4" color="warning.main">{stats.pending}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="overline">
                  In Transit
                </Typography>
                <Typography variant="h4" color="info.main">{stats.in_transit}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="overline">
                  Completed
                </Typography>
                <Typography variant="h4" color="success.main">{stats.completed}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
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
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="in_transit">In Transit</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
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
                    <TableCell>Transfer ID</TableCell>
                    <TableCell>Asset</TableCell>
                    <TableCell>From</TableCell>
                    <TableCell>To</TableCell>
                    <TableCell>Expected Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Initiated By</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTransfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                          No transfers found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransfers.map((transfer) => {
                      const isOverdue = transfer.status !== 'completed' && transfer.status !== 'cancelled' && transfer.status !== 'rejected' && new Date(transfer.expected_transfer_date) < new Date();
                      
                      return (
                        <TableRow key={transfer._id}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {transfer.transfer_id}
                            </Typography>
                          </TableCell>
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
                                {transfer.from_location}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {transfer.from_user?.full_name || 'N/A'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">
                                {transfer.to_location}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {transfer.to_user?.full_name || 'N/A'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" color={isOverdue ? 'error' : 'text.primary'}>
                                {new Date(transfer.expected_transfer_date).toLocaleDateString()}
                              </Typography>
                              {isOverdue && (
                                <Chip label="Overdue" color="error" size="small" sx={{ mt: 0.5 }} />
                              )}
                              {transfer.actual_transfer_date && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Actual: {new Date(transfer.actual_transfer_date).toLocaleDateString()}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getStatusIcon(transfer.status)}
                              label={getStatusLabel(transfer.status)}
                              color={getStatusColor(transfer.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {transfer.initiated_by?.full_name || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={transfer.description || '-'}>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                {transfer.transfer_reason?.replace(/_/g, ' ')}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewTransfer(transfer._id)}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {transfer.status === 'pending' && (
                              <>
                                <Tooltip title="Approve">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleApproveTransfer(transfer._id)}
                                  >
                                    <ApproveIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleRejectTransfer(transfer._id)}
                                  >
                                    <RejectIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Transfer Modal */}
      <AssetTransferModal
        open={transferModalOpen}
        onClose={handleCloseTransferModal}
        onSubmit={handleTransferSubmit}
      />
    </DashboardLayout>
  );
};

export default AssetTransfersPage;
