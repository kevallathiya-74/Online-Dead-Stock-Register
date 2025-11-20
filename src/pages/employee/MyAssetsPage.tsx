import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Divider,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  QrCode as QrCodeIcon,
  Computer as ComputerIcon,
  Laptop as LaptopIcon,
  Smartphone as PhoneIcon,
  Print as PrinterIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Build as MaintenanceIcon,
  Visibility as ViewIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const MyAssetsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [assetDetailDialogOpen, setAssetDetailDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [myAssets, setMyAssets] = useState<any[]>([]);

  // Fetch assets on component mount
  React.useEffect(() => {
    loadMyAssets();
  }, []);

  const loadMyAssets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/assets/my-assets');
      setMyAssets(response.data.data || []);
    } catch (error: any) {
      console.error('Error loading assets:', error);
      const errorMsg = error.response?.data?.message || 'Failed to load your assets';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getAssetIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'laptop': return <LaptopIcon />;
      case 'mobile': return <PhoneIcon />;
      case 'monitor': return <ComputerIcon />;
      case 'printer': return <PrinterIcon />;
      default: return <ComputerIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'success';
      case 'in_maintenance': return 'warning';
      case 'disposed': return 'error';
      default: return 'default';
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewAsset = (asset: any) => {
    setSelectedAsset(asset);
    setAssetDetailDialogOpen(true);
  };

  const handleReportIssue = (asset: any) => {
    toast.info(`Opening issue report for ${asset.model}...`);
    navigate('/employee/requests', { state: { asset } });
  };

  const handleViewHistory = (asset: any) => {
    toast.info(`Viewing history for ${asset.model}...`);
    navigate('/employee/history', { state: { assetId: asset._id } });
  };

  const filteredAssets = myAssets.filter(asset =>
    asset.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.unique_asset_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeAssets = filteredAssets.filter(asset => asset.status === 'Active');
  const warrantyExpiring = filteredAssets.filter(asset => 
    asset.warranty_expiry && new Date(asset.warranty_expiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            My Assets
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage your assigned assets
          </Typography>
        </Box>

        {/* Search and Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search assets..."
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
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    onClick={() => toast.info('Filter options coming soon!')}
                  >
                    Filter
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<QrCodeIcon />}
                    onClick={() => toast.info('QR Scanner coming soon!')}
                  >
                    Scan QR
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label={`All Assets (${filteredAssets.length})`} />
            <Tab label={`Active (${activeAssets.length})`} />
            <Tab label={`Warranty Expiring (${warrantyExpiring.length})`} />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredAssets.length === 0 ? (
            <Alert severity="info">No assets found</Alert>
          ) : (
            <Grid container spacing={3}>
              {filteredAssets.map((asset) => (
                <Grid item xs={12} md={6} lg={4} key={asset._id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {getAssetIcon(asset.asset_type)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {asset.manufacturer} {asset.model}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {asset.unique_asset_id}
                        </Typography>
                      </Box>
                      <Chip
                        label={asset.status}
                        color={getStatusColor(asset.status) as any}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Location:</strong> {asset.location}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Assigned:</strong> {new Date(asset.assigned_date).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Condition:</strong> {asset.condition}
                      </Typography>
                      {asset.warranty_expiry && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Warranty:</strong> {new Date(asset.warranty_expiry).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleViewAsset(asset)}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        startIcon={<MaintenanceIcon />}
                        onClick={() => handleReportIssue(asset)}
                      >
                        Report Issue
                      </Button>
                      <Button
                        size="small"
                        startIcon={<HistoryIcon />}
                        onClick={() => handleViewHistory(asset)}
                      >
                        History
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : activeAssets.length === 0 ? (
            <Alert severity="info">No active assets found</Alert>
          ) : (
            <Grid container spacing={3}>
              {activeAssets.map((asset) => (
                <Grid item xs={12} md={6} lg={4} key={asset._id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'success.main' }}>
                        {getAssetIcon(asset.asset_type)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {asset.manufacturer} {asset.model}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {asset.unique_asset_id}
                        </Typography>
                      </Box>
                      <Chip
                        label={asset.status}
                        color="success"
                        size="small"
                        icon={<CheckIcon />}
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Location:</strong> {asset.location}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Condition:</strong> {asset.condition}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleViewAsset(asset)}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        startIcon={<MaintenanceIcon />}
                        onClick={() => handleReportIssue(asset)}
                      >
                        Report Issue
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : warrantyExpiring.length === 0 ? (
            <Alert severity="info">No warranties expiring soon</Alert>
          ) : (
            <Grid container spacing={3}>
              {warrantyExpiring.map((asset) => (
                <Grid item xs={12} md={6} lg={4} key={asset._id}>
                <Card sx={{ height: '100%', border: '2px solid', borderColor: 'warning.main' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'warning.main' }}>
                        <WarningIcon />
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {asset.manufacturer} {asset.model}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {asset.unique_asset_id}
                        </Typography>
                      </Box>
                      <Chip
                        label="Warranty Expiring"
                        color="warning"
                        size="small"
                        icon={<WarningIcon />}
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Warranty Expires:</strong> {asset.warranty_expiry ? new Date(asset.warranty_expiry).toLocaleDateString() : 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Location:</strong> {asset.location}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleViewAsset(asset)}
                      >
                        View Details
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="warning"
                        onClick={() => toast.info('Contacting IT department about warranty renewal...')}
                      >
                        Renew Warranty
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          )}
        </TabPanel>

        {/* Asset Detail Dialog */}
        <Dialog
          open={assetDetailDialogOpen}
          onClose={() => setAssetDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Asset Details
          </DialogTitle>
          <DialogContent>
            {selectedAsset && (
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Basic Information
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell><strong>Asset ID</strong></TableCell>
                            <TableCell>{selectedAsset.unique_asset_id}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Manufacturer</strong></TableCell>
                            <TableCell>{selectedAsset.manufacturer}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Model</strong></TableCell>
                            <TableCell>{selectedAsset.model}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Serial Number</strong></TableCell>
                            <TableCell>{selectedAsset.serial_number}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Category</strong></TableCell>
                            <TableCell>{selectedAsset.asset_type}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell>
                              <Chip
                                label={selectedAsset.status}
                                color={getStatusColor(selectedAsset.status) as any}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Assignment & Location
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell><strong>Location</strong></TableCell>
                            <TableCell>{selectedAsset.location}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Assigned Date</strong></TableCell>
                            <TableCell>{new Date(selectedAsset.assigned_date).toLocaleDateString()}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Condition</strong></TableCell>
                            <TableCell>{selectedAsset.condition}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Last Audit</strong></TableCell>
                            <TableCell>{new Date(selectedAsset.last_audit_date).toLocaleDateString()}</TableCell>
                          </TableRow>
                          {selectedAsset.warranty_expiry && (
                            <TableRow>
                              <TableCell><strong>Warranty Expires</strong></TableCell>
                              <TableCell>{new Date(selectedAsset.warranty_expiry).toLocaleDateString()}</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Financial Information
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell><strong>Purchase Date</strong></TableCell>
                            <TableCell>{new Date(selectedAsset.purchase_date).toLocaleDateString()}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Purchase Price</strong></TableCell>
                            <TableCell>₹{selectedAsset.purchase_cost?.toLocaleString('en-IN')}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Current Value</strong></TableCell>
                            <TableCell>₹{selectedAsset.current_value?.toLocaleString('en-IN')}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAssetDetailDialogOpen(false)}>
              Close
            </Button>
            <Button
              variant="contained"
              startIcon={<MaintenanceIcon />}
              onClick={() => {
                setAssetDetailDialogOpen(false);
                handleReportIssue(selectedAsset);
              }}
            >
              Report Issue
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default MyAssetsPage;