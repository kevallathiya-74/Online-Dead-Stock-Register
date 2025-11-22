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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
  Autorenew as RecycleIcon,
  Gavel as AuctionIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import scrapService, { ScrapItem } from '../../services/scrap.service';

const steps = ['Request Submitted', 'Under Review', 'Approved', 'Disposal Process', 'Completed'];

const ScrapPage = () => {
  const [scrapItems, setScrapItems] = useState<ScrapItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedItem, setSelectedItem] = useState<ScrapItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // New scrap request form state
  const [newRequestForm, setNewRequestForm] = useState({
    assetId: '',
    scrapReason: '',
    estimatedValue: '',
    disposalMethod: '',
    notes: ''
  });

  useEffect(() => {
    loadScrapData();
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(loadScrapData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadScrapData = async () => {
    try {
      setLoading(true);
      const response = await scrapService.getScrapItems({
        search: searchTerm,
        status: statusFilter === 'All' ? undefined : statusFilter
      });
      setScrapItems(response.data || []);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        toast.error(error.response?.data?.message || 'Failed to load scrap data');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending Approval':
        return 'warning';
      case 'Approved for Scrap':
        return 'info';
      case 'In Disposal Process':
        return 'primary';
      case 'Disposed':
        return 'success';
      case 'Sold':
        return 'success';
      case 'Recycled':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'Pending Approval':
        return 1;
      case 'Approved for Scrap':
        return 2;
      case 'In Disposal Process':
        return 3;
      case 'Disposed':
      case 'Sold':
      case 'Recycled':
        return 4;
      default:
        return 0;
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'End of Life':
        return 'primary';
      case 'Beyond Repair':
        return 'error';
      case 'Obsolete':
        return 'warning';
      case 'Policy Compliance':
        return 'info';
      case 'Accident Damage':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredItems = scrapItems.filter((item) => {
    const matchesSearch = 
      item.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (item: ScrapItem) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setSelectedItem(null);
    setIsDetailModalOpen(false);
  };

  const handleApproveScrap = async (item: ScrapItem) => {
    try {
      const result = await scrapService.approveScrapItem(item._id);
      
      toast.success(result.message || `Scrap request approved for ${item.assetName}`);
      
      // Reload data to get updated information from backend
      await loadScrapData();
    } catch (error) { /* Error handled by API interceptor */ }
  };

  const handleExportReport = async () => {
    try {
      toast.info('Preparing scrap report...');
      const blob = await scrapService.exportScrapReport('csv', {
        search: searchTerm,
        status: statusFilter === 'All' ? undefined : statusFilter
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `scrap-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Scrap report downloaded successfully');
    } catch (error) { /* Error handled by API interceptor */ }
  };

  const handleNewScrapRequest = () => {
    setNewRequestForm({
      assetId: '',
      scrapReason: '',
      estimatedValue: '',
      disposalMethod: '',
      notes: ''
    });
    setIsNewRequestModalOpen(true);
  };

  const handleCloseNewRequestModal = () => {
    setIsNewRequestModalOpen(false);
    setNewRequestForm({
      assetId: '',
      scrapReason: '',
      estimatedValue: '',
      disposalMethod: '',
      notes: ''
    });
  };

  const handleSubmitNewRequest = async () => {
    try {
      if (!newRequestForm.assetId || !newRequestForm.scrapReason) {
        toast.error('Please fill in all required fields');
        return;
      }

      await scrapService.createScrapRequest({
        assetId: newRequestForm.assetId,
        scrapReason: newRequestForm.scrapReason,
        estimatedValue: newRequestForm.estimatedValue ? parseFloat(newRequestForm.estimatedValue) : undefined,
        disposalMethod: newRequestForm.disposalMethod || undefined,
        notes: newRequestForm.notes || undefined
      });

      toast.success('Scrap request created successfully');
      handleCloseNewRequestModal();
      await loadScrapData();
    } catch (error) { /* Error handled by API interceptor */ }
  };

  const pendingCount = scrapItems.filter(i => i.status === 'Pending Approval').length;
  const approvedCount = scrapItems.filter(i => i.status === 'Approved for Scrap').length;
  const inProcessCount = scrapItems.filter(i => i.status === 'In Disposal Process').length;
  const completedCount = scrapItems.filter(i => ['Disposed', 'Sold', 'Recycled'].includes(i.status)).length;
  const totalScrapValue = scrapItems
    .filter(i => ['Disposed', 'Sold', 'Recycled'].includes(i.status))
    .reduce((sum, i) => sum + i.scrapValue, 0);

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Scrap Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleNewScrapRequest}
            >
              New Scrap Request
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportReport}
            >
              Export Report
            </Button>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Pending Approval
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {pendingCount}
                    </Typography>
                  </Box>
                  <ScheduleIcon color="warning" sx={{ fontSize: { xs: 32, sm: 40 } }} />
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
                      Approved
                    </Typography>
                    <Typography variant="h4" color="info.main">
                      {approvedCount}
                    </Typography>
                  </Box>
                  <CheckCircleIcon color="info" sx={{ fontSize: { xs: 32, sm: 40 } }} />
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
                      In Process
                    </Typography>
                    <Typography variant="h4" color="primary.main">
                      {inProcessCount}
                    </Typography>
                  </Box>
                  <RecycleIcon color="primary" sx={{ fontSize: { xs: 32, sm: 40 } }} />
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
                      Completed
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {completedCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Value: ₹{totalScrapValue.toLocaleString()}
                    </Typography>
                  </Box>
                  <AuctionIcon color="success" sx={{ fontSize: { xs: 32, sm: 40 } }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {pendingCount > 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle1">
              {pendingCount} scrap requests are pending approval. Please review and take necessary action.
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
                  placeholder="Search by asset name, ID, manufacturer, or serial number..."
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
                    <MenuItem value="Pending Approval">Pending Approval</MenuItem>
                    <MenuItem value="Approved for Scrap">Approved</MenuItem>
                    <MenuItem value="In Disposal Process">In Process</MenuItem>
                    <MenuItem value="Disposed">Disposed</MenuItem>
                    <MenuItem value="Sold">Sold</MenuItem>
                    <MenuItem value="Recycled">Recycled</MenuItem>
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

        {/* Scrap Items Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Scrap Items ({filteredItems.length})
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Asset</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Scrap Reason</TableCell>
                    <TableCell>Request Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Original Value</TableCell>
                    <TableCell>Scrap Value</TableCell>
                    <TableCell>Disposal Method</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        Loading scrap data...
                      </TableCell>
                    </TableRow>
                  ) : filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        No scrap items found matching your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2">
                              {item.assetName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.assetId} • {item.manufacturer} {item.model}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.category}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.scrapReason}
                            color={getReasonColor(item.scrapReason) as any}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {format(parseISO(item.scrapDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.status}
                            color={getStatusColor(item.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            ₹{item.originalValue.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            ₹{item.scrapValue.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.disposalMethod}
                            size="small"
                            variant="filled"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewDetails(item)}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            {item.status === 'Pending Approval' && (
                              <Tooltip title="Approve Scrap">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleApproveScrap(item)}
                                >
                                  <CheckCircleIcon />
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

        {/* Scrap Detail Modal */}
        <Dialog 
          open={isDetailModalOpen} 
          onClose={handleCloseDetailModal}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Scrap Item Details
          </DialogTitle>
          <DialogContent>
            {selectedItem && (
              <Box>
                {/* Progress Stepper */}
                <Box sx={{ mb: 3 }}>
                  <Stepper activeStep={getStatusStep(selectedItem.status)} alternativeLabel>
                    {steps.map((label) => (
                      <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Asset Information</Typography>
                    <Typography variant="body2"><strong>Name:</strong> {selectedItem.assetName}</Typography>
                    <Typography variant="body2"><strong>ID:</strong> {selectedItem.assetId}</Typography>
                    <Typography variant="body2"><strong>Category:</strong> {selectedItem.category}</Typography>
                    <Typography variant="body2"><strong>Manufacturer:</strong> {selectedItem.manufacturer}</Typography>
                    <Typography variant="body2"><strong>Model:</strong> {selectedItem.model}</Typography>
                    <Typography variant="body2"><strong>Serial Number:</strong> {selectedItem.serialNumber}</Typography>
                    <Typography variant="body2"><strong>Location:</strong> {selectedItem.currentLocation}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Scrap Information</Typography>
                    <Typography variant="body2"><strong>Reason:</strong> 
                      <Chip
                        label={selectedItem.scrapReason}
                        color={getReasonColor(selectedItem.scrapReason) as any}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                    <Typography variant="body2"><strong>Request Date:</strong> {format(parseISO(selectedItem.scrapDate), 'MMM dd, yyyy')}</Typography>
                    {selectedItem.approvalDate && (
                      <Typography variant="body2"><strong>Approval Date:</strong> {format(parseISO(selectedItem.approvalDate), 'MMM dd, yyyy')}</Typography>
                    )}
                    {selectedItem.disposalDate && (
                      <Typography variant="body2"><strong>Disposal Date:</strong> {format(parseISO(selectedItem.disposalDate), 'MMM dd, yyyy')}</Typography>
                    )}
                    <Typography variant="body2"><strong>Status:</strong> 
                      <Chip
                        label={selectedItem.status}
                        color={getStatusColor(selectedItem.status) as any}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Financial Information</Typography>
                    <Typography variant="body2"><strong>Original Value:</strong> ₹{selectedItem.originalValue.toLocaleString()}</Typography>
                    <Typography variant="body2"><strong>Scrap Value:</strong> ₹{selectedItem.scrapValue.toLocaleString()}</Typography>
                    <Typography variant="body2"><strong>Loss Amount:</strong> ₹{(selectedItem.originalValue - selectedItem.scrapValue).toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Disposal Information</Typography>
                    <Typography variant="body2"><strong>Method:</strong> {selectedItem.disposalMethod}</Typography>
                    {selectedItem.vendorName && (
                      <Typography variant="body2"><strong>Vendor:</strong> {selectedItem.vendorName}</Typography>
                    )}
                    {selectedItem.approvedBy && (
                      <Typography variant="body2"><strong>Approved By:</strong> {selectedItem.approvedBy}</Typography>
                    )}
                    {selectedItem.documentReference && (
                      <Typography variant="body2"><strong>Document Ref:</strong> {selectedItem.documentReference}</Typography>
                    )}
                    <Typography variant="body2"><strong>Environmental Compliance:</strong> 
                      <Chip
                        label={selectedItem.environmentalCompliance ? 'Compliant' : 'Non-Compliant'}
                        color={selectedItem.environmentalCompliance ? 'success' : 'error'}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetailModal}>
              Close
            </Button>
            {selectedItem?.status === 'Pending Approval' && (
              <Button 
                variant="contained" 
                color="success"
                onClick={() => {
                  handleApproveScrap(selectedItem);
                  handleCloseDetailModal();
                }}
              >
                Approve Scrap
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* New Scrap Request Modal */}
        <Dialog 
          open={isNewRequestModalOpen} 
          onClose={handleCloseNewRequestModal}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Create New Scrap Request
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Asset ID"
                    value={newRequestForm.assetId}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, assetId: e.target.value })}
                    placeholder="Enter asset unique ID"
                    helperText="Enter the unique ID of the asset to be scrapped"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Scrap Reason</InputLabel>
                    <Select
                      value={newRequestForm.scrapReason}
                      label="Scrap Reason"
                      onChange={(e) => setNewRequestForm({ ...newRequestForm, scrapReason: e.target.value })}
                    >
                      <MenuItem value="End of Life">End of Life</MenuItem>
                      <MenuItem value="Beyond Repair">Beyond Repair</MenuItem>
                      <MenuItem value="Obsolete">Obsolete</MenuItem>
                      <MenuItem value="Policy Compliance">Policy Compliance</MenuItem>
                      <MenuItem value="Accident Damage">Accident Damage</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Disposal Method</InputLabel>
                    <Select
                      value={newRequestForm.disposalMethod}
                      label="Disposal Method"
                      onChange={(e) => setNewRequestForm({ ...newRequestForm, disposalMethod: e.target.value })}
                    >
                      <MenuItem value="Recycle">Recycle</MenuItem>
                      <MenuItem value="Sell">Sell</MenuItem>
                      <MenuItem value="Donate">Donate</MenuItem>
                      <MenuItem value="Destroy">Destroy</MenuItem>
                      <MenuItem value="Return to Vendor">Return to Vendor</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Estimated Scrap Value"
                    value={newRequestForm.estimatedValue}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, estimatedValue: e.target.value })}
                    placeholder="Enter estimated value in ₹"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                    helperText="Optional: Estimated value that can be recovered"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Additional Notes"
                    value={newRequestForm.notes}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, notes: e.target.value })}
                    placeholder="Enter any additional information or notes"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseNewRequestModal}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleSubmitNewRequest}
            >
              Submit Request
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default ScrapPage;