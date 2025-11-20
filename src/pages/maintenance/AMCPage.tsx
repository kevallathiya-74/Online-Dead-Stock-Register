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
  Alert,
  Badge,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { format, parseISO, differenceInDays } from 'date-fns';
import { toast } from 'react-toastify';
import api from '../../services/api';

interface AMCContract {
  _id: string;
  id?: string; // Deprecated: use _id
  contractNumber: string;
  assetId: string;
  assetName: string;
  vendor: string;
  contractType: 'Comprehensive' | 'Parts Only' | 'Labor Only' | 'On-Site' | 'Remote Support';
  startDate: string;
  endDate: string;
  renewalDate: string;
  status: 'Active' | 'Expired' | 'Expiring Soon' | 'Under Review' | 'Renewed';
  annualCost: number;
  coverage: string;
  serviceLevel: 'Standard' | 'Premium' | 'Critical' | 'Basic';
  responseTime: string;
  lastServiceDate?: string;
  serviceCallsUsed: number;
  serviceCallsLimit: number;
  paymentStatus: 'Paid' | 'Pending' | 'Overdue';
}

const AMCPage = () => {
  const [contracts, setContracts] = useState<AMCContract[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedContract, setSelectedContract] = useState<AMCContract | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAMCData();
  }, []);

  const loadAMCData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/maintenance/amc-contracts');
      const data = response.data.data || response.data;
      setContracts(data);
    } catch (error) {
      console.error('Error loading AMC data:', error);
      toast.error('Failed to load AMC data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Expired':
        return 'error';
      case 'Expiring Soon':
        return 'warning';
      case 'Under Review':
        return 'info';
      case 'Renewed':
        return 'primary';
      default:
        return 'default';
    }
  };



  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const getDaysUntilRenewal = (renewalDate: string) => {
    return differenceInDays(parseISO(renewalDate), new Date());
  };

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch = 
      contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.assetId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || contract.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (contract: AMCContract) => {
    setSelectedContract(contract);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setSelectedContract(null);
    setIsDetailModalOpen(false);
  };

  const handleRenewContract = (contract: AMCContract) => {
    toast.success(`Contract renewal initiated for ${contract.contractNumber}`);
    setContracts(prev => prev.map(c => 
      c._id === contract._id 
        ? { ...c, status: 'Under Review' as const }
        : c
    ));
  };

  const activeCount = contracts.filter(c => c.status === 'Active').length;
  const expiringCount = contracts.filter(c => c.status === 'Expiring Soon').length;
  const renewalCount = contracts.filter(c => c.status === 'Under Review').length;
  const totalAnnualCost = contracts
    .filter(c => c.status === 'Active')
    .reduce((sum, c) => sum + c.annualCost, 0);

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            AMC Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => toast.info('Add new AMC contract feature coming soon')}
            >
              New Contract
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => toast.info('AMC report download started')}
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
                      Active Contracts
                    </Typography>
                    <Typography variant="h4">
                      {activeCount}
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
                      Expiring Soon
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      <Badge badgeContent={expiringCount} color="warning">
                        {expiringCount}
                      </Badge>
                    </Typography>
                  </Box>
                  <WarningIcon color="warning" sx={{ fontSize: 40 }} />
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
                      Under Review
                    </Typography>
                    <Typography variant="h4" color="info.main">
                      {renewalCount}
                    </Typography>
                  </Box>
                  <ScheduleIcon color="info" sx={{ fontSize: 40 }} />
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
                      Annual Cost
                    </Typography>
                    <Typography variant="h4">
                      ₹{(totalAnnualCost / 100000).toFixed(1)}L
                    </Typography>
                  </Box>
                  <ScheduleIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {expiringCount > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle1">
              {expiringCount} AMC contracts are expiring soon. Please review and renew to avoid service interruption.
            </Typography>
          </Alert>
        )}

        {/* Search and Filter */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search contracts by number, asset, or vendor..."
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
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Expiring Soon">Expiring Soon</MenuItem>
                    <MenuItem value="Under Review">Under Review</MenuItem>
                    <MenuItem value="Expired">Expired</MenuItem>
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

        {/* AMC Contracts Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              AMC Contracts ({filteredContracts.length})
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Contract</TableCell>
                    <TableCell>Asset</TableCell>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Annual Cost</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell>Service Usage</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        Loading AMC data...
                      </TableCell>
                    </TableRow>
                  ) : filteredContracts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        No AMC contracts found matching your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredContracts.map((contract) => {
                      const daysUntilRenewal = getDaysUntilRenewal(contract.renewalDate);
                      return (
                        <TableRow key={contract._id}>
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle2">
                                {contract.contractNumber}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Service Level: {contract.serviceLevel}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle2">
                                {contract.assetName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {contract.assetId}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{contract.vendor}</TableCell>
                          <TableCell>
                            <Chip
                              label={contract.contractType}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {format(parseISO(contract.endDate), 'MMM dd, yyyy')}
                            </Typography>
                            {daysUntilRenewal <= 30 && daysUntilRenewal > 0 && (
                              <Typography variant="caption" color="warning.main">
                                Renewal due in {daysUntilRenewal} days
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={contract.status}
                              color={getStatusColor(contract.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              ₹{contract.annualCost.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={contract.paymentStatus}
                              color={getPaymentStatusColor(contract.paymentStatus) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {contract.serviceCallsUsed}/{contract.serviceCallsLimit}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Response: {contract.responseTime}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewDetails(contract)}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              {(contract.status === 'Expiring Soon' || contract.status === 'Expired') && (
                                <Tooltip title="Renew Contract">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleRenewContract(contract)}
                                  >
                                    <RefreshIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
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

        {/* Contract Detail Modal */}
        <Dialog 
          open={isDetailModalOpen} 
          onClose={handleCloseDetailModal}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            AMC Contract Details
          </DialogTitle>
          <DialogContent>
            {selectedContract && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Contract Information</Typography>
                  <Typography variant="body2"><strong>Contract Number:</strong> {selectedContract.contractNumber}</Typography>
                  <Typography variant="body2"><strong>Type:</strong> {selectedContract.contractType}</Typography>
                  <Typography variant="body2"><strong>Service Level:</strong> {selectedContract.serviceLevel}</Typography>
                  <Typography variant="body2"><strong>Response Time:</strong> {selectedContract.responseTime}</Typography>
                  <Typography variant="body2"><strong>Start Date:</strong> {format(parseISO(selectedContract.startDate), 'MMM dd, yyyy')}</Typography>
                  <Typography variant="body2"><strong>End Date:</strong> {format(parseISO(selectedContract.endDate), 'MMM dd, yyyy')}</Typography>
                  <Typography variant="body2"><strong>Renewal Date:</strong> {format(parseISO(selectedContract.renewalDate), 'MMM dd, yyyy')}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Asset & Vendor</Typography>
                  <Typography variant="body2"><strong>Asset:</strong> {selectedContract.assetName}</Typography>
                  <Typography variant="body2"><strong>Asset ID:</strong> {selectedContract.assetId}</Typography>
                  <Typography variant="body2"><strong>Vendor:</strong> {selectedContract.vendor}</Typography>
                  <Typography variant="body2"><strong>Annual Cost:</strong> ₹{selectedContract.annualCost.toLocaleString()}</Typography>
                  <Typography variant="body2"><strong>Payment Status:</strong> 
                    <Chip
                      label={selectedContract.paymentStatus}
                      color={getPaymentStatusColor(selectedContract.paymentStatus) as any}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Coverage Details</Typography>
                  <Typography variant="body2">{selectedContract.coverage}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Service Usage</Typography>
                  <Typography variant="body2"><strong>Service Calls Used:</strong> {selectedContract.serviceCallsUsed} / {selectedContract.serviceCallsLimit}</Typography>
                  {selectedContract.lastServiceDate && (
                    <Typography variant="body2"><strong>Last Service Date:</strong> {format(parseISO(selectedContract.lastServiceDate), 'MMM dd, yyyy')}</Typography>
                  )}
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetailModal}>
              Close
            </Button>
            {selectedContract && (selectedContract.status === 'Expiring Soon' || selectedContract.status === 'Expired') && (
              <Button 
                variant="contained" 
                onClick={() => {
                  handleRenewContract(selectedContract);
                  handleCloseDetailModal();
                }}
              >
                Renew Contract
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default AMCPage;