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
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { format, parseISO, differenceInDays } from 'date-fns';
import { toast } from 'react-toastify';
import warrantyService, { WarrantyItem } from '../../services/warranty.service';
import { formatCurrency } from '../../utils/errorHandling';

const WarrantyPage = () => {
  const [warranties, setWarranties] = useState<WarrantyItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalCoverageValue, setTotalCoverageValue] = useState(0);

  useEffect(() => {
    loadWarrantyData();
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(loadWarrantyData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadWarrantyData = async () => {
    try {
      setLoading(true);
      const response = await warrantyService.getWarranties({
        search: searchTerm
      });
      setWarranties(response.data || []);
      
      // Calculate total coverage value from actual asset values
      const totalValue = response.data.reduce((sum: number, w: WarrantyItem) => {
        return sum + (w.coverageValue || 100000); // Use actual coverage value or default
      }, 0);
      setTotalCoverageValue(totalValue);
    } catch (error: any) {
      console.error('Error loading warranty data:', error);
      if (error.response?.status !== 401) {
        toast.error(error.response?.data?.message || 'Failed to load warranty data');
      }
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
      case 'Claim Filed':
        return 'info';
      default:
        return 'default';
    }
  };



  const getDaysUntilExpiry = (endDate: string) => {
    return differenceInDays(parseISO(endDate), new Date());
  };

  const filteredWarranties = warranties.filter((warranty) =>
    warranty.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warranty.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warranty.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warranty.vendor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = (warranty: WarrantyItem) => {
    setSelectedWarranty(warranty);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setSelectedWarranty(null);
    setIsDetailModalOpen(false);
  };

  const handleFileWarrantyClaim = async (warranty: WarrantyItem) => {
    try {
      const result = await warrantyService.fileWarrantyClaim({
        warrantyId: warranty._id,
        assetId: warranty.assetId, // Use assetId not _id
        description: `Warranty claim for ${warranty.assetName}`,
        issueType: 'warranty_claim'
      });
      
      toast.success(result.message || `Warranty claim filed successfully for ${warranty.assetName}`);
      
      // Reload data to get updated information from backend
      await loadWarrantyData();
    } catch (error: any) {
      console.error('Error filing warranty claim:', error);
      toast.error(error.response?.data?.message || 'Failed to file warranty claim');
    }
  };

  const handleExportReport = async () => {
    try {
      toast.info('Preparing warranty report...');
      const blob = await warrantyService.exportWarrantyReport('csv', {
        search: searchTerm
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `warranty-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Warranty report downloaded successfully');
    } catch (error: any) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export warranty report');
    }
  };

  const expiringCount = warranties.filter(w => w.status === 'Expiring Soon').length;
  const activeCount = warranties.filter(w => w.status === 'Active').length;
  const expiredCount = warranties.filter(w => w.status === 'Expired').length;

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Warranty Management
          </Typography>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportReport}
          >
            Export Report
          </Button>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Active Warranties
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
                      {expiringCount}
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
                      Expired
                    </Typography>
                    <Typography variant="h4" color="error.main">
                      {expiredCount}
                    </Typography>
                  </Box>
                  <CancelIcon color="error" sx={{ fontSize: 40 }} />
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
                      Total Coverage Value
                    </Typography>
                    <Typography variant="h4">
                      {formatCurrency(totalCoverageValue)}
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
              {expiringCount} warranties are expiring within the next 30 days. Please review and take necessary action.
            </Typography>
          </Alert>
        )}

        {/* Search and Filter */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  placeholder="Search warranties by asset, manufacturer, serial number, or vendor..."
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

        {/* Warranty Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Warranty Items ({filteredWarranties.length})
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Asset</TableCell>
                    <TableCell>Manufacturer</TableCell>
                    <TableCell>Serial Number</TableCell>
                    <TableCell>Warranty Type</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Days Until Expiry</TableCell>
                    <TableCell>Claims</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        Loading warranty data...
                      </TableCell>
                    </TableRow>
                  ) : filteredWarranties.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        No warranties found matching your search criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredWarranties.map((warranty) => {
                      const daysUntilExpiry = getDaysUntilExpiry(warranty.endDate);
                      return (
                        <TableRow key={warranty._id}>
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle2">
                                {warranty.assetName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {warranty.assetId}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{warranty.manufacturer}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              {warranty.serialNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={warranty.warrantyType}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            {format(parseISO(warranty.endDate), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={warranty.status}
                              color={getStatusColor(warranty.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              color={daysUntilExpiry < 0 ? 'error.main' : daysUntilExpiry <= 30 ? 'warning.main' : 'text.primary'}
                            >
                              {daysUntilExpiry < 0 
                                ? `Expired ${Math.abs(daysUntilExpiry)} days ago`
                                : `${daysUntilExpiry} days`
                              }
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {warranty.claimHistory}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewDetails(warranty)}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              {warranty.status === 'Active' && (
                                <Tooltip title="File Warranty Claim">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleFileWarrantyClaim(warranty)}
                                  >
                                    <EditIcon />
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

        {/* Warranty Detail Modal */}
        <Dialog 
          open={isDetailModalOpen} 
          onClose={handleCloseDetailModal}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Warranty Details
          </DialogTitle>
          <DialogContent>
            {selectedWarranty && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Asset Information</Typography>
                  <Typography variant="body2"><strong>Name:</strong> {selectedWarranty.assetName}</Typography>
                  <Typography variant="body2"><strong>ID:</strong> {selectedWarranty.assetId}</Typography>
                  <Typography variant="body2"><strong>Manufacturer:</strong> {selectedWarranty.manufacturer}</Typography>
                  <Typography variant="body2"><strong>Model:</strong> {selectedWarranty.model}</Typography>
                  <Typography variant="body2"><strong>Serial Number:</strong> {selectedWarranty.serialNumber}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Warranty Information</Typography>
                  <Typography variant="body2"><strong>Type:</strong> {selectedWarranty.warrantyType}</Typography>
                  <Typography variant="body2"><strong>Vendor:</strong> {selectedWarranty.vendor}</Typography>
                  <Typography variant="body2"><strong>Start Date:</strong> {format(parseISO(selectedWarranty.startDate), 'MMM dd, yyyy')}</Typography>
                  <Typography variant="body2"><strong>End Date:</strong> {format(parseISO(selectedWarranty.endDate), 'MMM dd, yyyy')}</Typography>
                  <Typography variant="body2"><strong>Status:</strong> 
                    <Chip
                      label={selectedWarranty.status}
                      color={getStatusColor(selectedWarranty.status) as any}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Coverage Details</Typography>
                  <Typography variant="body2">{selectedWarranty.coverageDetails}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Claim History</Typography>
                  <Typography variant="body2"><strong>Total Claims:</strong> {selectedWarranty.claimHistory}</Typography>
                  {selectedWarranty.lastClaimDate && (
                    <Typography variant="body2"><strong>Last Claim Date:</strong> {format(parseISO(selectedWarranty.lastClaimDate), 'MMM dd, yyyy')}</Typography>
                  )}
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetailModal}>
              Close
            </Button>
            {selectedWarranty?.status === 'Active' && (
              <Button 
                variant="contained" 
                onClick={() => {
                  handleFileWarrantyClaim(selectedWarranty);
                  handleCloseDetailModal();
                }}
              >
                File Claim
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default WarrantyPage;