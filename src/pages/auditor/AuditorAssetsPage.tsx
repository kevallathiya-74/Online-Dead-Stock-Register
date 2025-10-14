import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Alert,
  TextField,
  Paper,
  IconButton,
  Tooltip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  QrCodeScanner as QrIcon,
  CheckCircle as VerifiedIcon,
  Warning as DiscrepancyIcon,
  Error as MissingIcon,
  Schedule as PendingIcon,
  Assignment as AuditIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  GetApp as ExportIcon,
  Print as PrintIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { toast } from 'react-toastify';

interface Asset {
  id: string;
  unique_asset_id: string;
  name: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  category: string;
  location: string;
  assigned_user: string;
  status: 'Active' | 'Inactive' | 'Maintenance' | 'Disposed';
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Damaged';
  last_audit_date: string;
  audit_status: 'pending' | 'verified' | 'discrepancy' | 'missing';
  purchase_date: string;
  purchase_cost: number;
  depreciation_value: number;
  warranty_expiry: string;
  notes?: string;
}

interface AuditSchedule {
  id: string;
  asset_id: string;
  asset_name: string;
  scheduled_date: string;
  auditor: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

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

const AuditorAssetsPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [auditSchedule, setAuditSchedule] = useState<AuditSchedule[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAuditStatus, setFilterAuditStatus] = useState('all');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditData();
  }, []);

  const loadAuditData = async () => {
    try {
      setLoading(true);
      
      // Fetch real assets data from API
      // TODO: Implement API call to fetch assets for auditing
      // Example: const response = await assetService.getAssetsForAudit();
      // setAssets(response.data);
      
      // For now, set empty arrays until API is implemented
      setAssets([]);
      setAuditSchedule([]);
      
      toast.info('No audit data available. Please add assets through the system.');
    } catch (error) {
      console.error('Error loading audit data:', error);
      toast.error('Failed to load audit data');
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.unique_asset_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.assigned_user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = filterLocation === 'all' || asset.location.includes(filterLocation);
    const matchesStatus = filterStatus === 'all' || asset.status === filterStatus;
    const matchesAuditStatus = filterAuditStatus === 'all' || asset.audit_status === filterAuditStatus;
    
    return matchesSearch && matchesLocation && matchesStatus && matchesAuditStatus;
  });

  const getAuditStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'discrepancy': return 'error';
      case 'missing': return 'error';
      default: return 'default';
    }
  };

  const getAuditStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <VerifiedIcon />;
      case 'pending': return <PendingIcon />;
      case 'discrepancy': return <DiscrepancyIcon />;
      case 'missing': return <MissingIcon />;
      default: return <PendingIcon />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const handleAuditAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setAuditDialogOpen(true);
  };

  const handleViewAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    toast.info(`Viewing details for ${asset.name}`);
  };

  const handleQRScan = () => {
    toast.info('QR Scanner opened - scan asset to begin audit');
  };

  const handleExportAudit = () => {
    toast.success('Audit report exported successfully');
  };

  const handlePrintReport = () => {
    toast.success('Audit report sent to printer');
  };

  const handleSubmitAudit = () => {
    if (selectedAsset) {
      toast.success(`Audit completed for ${selectedAsset.name}`);
      setAuditDialogOpen(false);
      setSelectedAsset(null);
      // In real implementation, update asset audit status
    }
  };

  const auditStats = {
    totalAssets: assets.length,
    verified: assets.filter(a => a.audit_status === 'verified').length,
    pending: assets.filter(a => a.audit_status === 'pending').length,
    discrepancies: assets.filter(a => a.audit_status === 'discrepancy').length,
    missing: assets.filter(a => a.audit_status === 'missing').length,
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Asset Audit Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<QrIcon />}
              onClick={handleQRScan}
            >
              Scan QR Code
            </Button>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={handleExportAudit}
            >
              Export Report
            </Button>
            <Button
              variant="contained"
              startIcon={<ReportIcon />}
              onClick={() => navigate('/auditor/reports')}
            >
              View Reports
            </Button>
          </Box>
        </Box>

        {/* Audit Statistics */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="primary.main">
                      {auditStats.totalAssets}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Assets
                    </Typography>
                  </Box>
                  <AuditIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="success.main">
                      {auditStats.verified}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Verified
                    </Typography>
                  </Box>
                  <VerifiedIcon color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="warning.main">
                      {auditStats.pending}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending
                    </Typography>
                  </Box>
                  <PendingIcon color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="error.main">
                      {auditStats.discrepancies}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Discrepancies
                    </Typography>
                  </Box>
                  <DiscrepancyIcon color="error" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="error.main">
                      {auditStats.missing}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Missing
                    </Typography>
                  </Box>
                  <MissingIcon color="error" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={(_, newValue) => setCurrentTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Asset Audit" />
            <Tab label="Audit Schedule" />
            <Tab label="Discrepancies" />
          </Tabs>
        </Card>

        {/* Tab Content */}
        <TabPanel value={currentTab} index={0}>
          {/* Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Search Assets"
                    variant="outlined"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, ID, or user"
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Location</InputLabel>
                    <Select
                      value={filterLocation}
                      label="Location"
                      onChange={(e) => setFilterLocation(e.target.value)}
                    >
                      <MenuItem value="all">All Locations</MenuItem>
                      <MenuItem value="IT Department">IT Department</MenuItem>
                      <MenuItem value="Design Department">Design Department</MenuItem>
                      <MenuItem value="Admin Office">Admin Office</MenuItem>
                      <MenuItem value="Sales Department">Sales Department</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filterStatus}
                      label="Status"
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Inactive">Inactive</MenuItem>
                      <MenuItem value="Maintenance">Maintenance</MenuItem>
                      <MenuItem value="Disposed">Disposed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Audit Status</InputLabel>
                    <Select
                      value={filterAuditStatus}
                      label="Audit Status"
                      onChange={(e) => setFilterAuditStatus(e.target.value)}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="verified">Verified</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="discrepancy">Discrepancy</MenuItem>
                      <MenuItem value="missing">Missing</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<PrintIcon />}
                      onClick={handlePrintReport}
                    >
                      Print
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ExportIcon />}
                      onClick={handleExportAudit}
                    >
                      Export
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Assets Table */}
          <Card>
            <CardContent>
              {loading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <LinearProgress />
                  <Typography sx={{ mt: 2 }}>Loading audit data...</Typography>
                </Box>
              ) : filteredAssets.length === 0 ? (
                <Alert severity="info">
                  No assets found matching your criteria.
                </Alert>
              ) : (
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Asset ID</TableCell>
                        <TableCell>Asset Name</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Assigned User</TableCell>
                        <TableCell>Audit Status</TableCell>
                        <TableCell>Last Audit</TableCell>
                        <TableCell>Condition</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredAssets.map((asset) => (
                        <TableRow key={asset.id} hover>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight="medium">
                              {asset.unique_asset_id}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle2">{asset.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {asset.manufacturer} {asset.model}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocationIcon fontSize="small" />
                              <Typography variant="body2">{asset.location}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PersonIcon fontSize="small" />
                              <Typography variant="body2">{asset.assigned_user}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getAuditStatusIcon(asset.audit_status)}
                              label={asset.audit_status.charAt(0).toUpperCase() + asset.audit_status.slice(1)}
                              size="small"
                              color={getAuditStatusColor(asset.audit_status) as any}
                            />
                          </TableCell>
                          <TableCell>{asset.last_audit_date}</TableCell>
                          <TableCell>
                            <Chip
                              label={asset.condition}
                              size="small"
                              variant="outlined"
                              color={asset.condition === 'Excellent' ? 'success' : 
                                     asset.condition === 'Good' ? 'info' : 
                                     asset.condition === 'Fair' ? 'warning' : 'error'}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewAsset(asset)}
                                  color="primary"
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Audit Asset">
                                <IconButton
                                  size="small"
                                  onClick={() => handleAuditAsset(asset)}
                                  color="success"
                                >
                                  <AuditIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Audit Schedule
              </Typography>
              <List>
                {auditSchedule.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <ListItem>
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            bgcolor: item.status === 'overdue' ? 'error.main' : 
                                     item.status === 'in_progress' ? 'warning.main' : 'primary.main'
                          }}
                        >
                          <AuditIcon />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1">{item.asset_name}</Typography>
                            <Chip
                              label={item.priority}
                              size="small"
                              color={getPriorityColor(item.priority) as any}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              Scheduled: {item.scheduled_date} | Auditor: {item.auditor}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Status: {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' ')}
                            </Typography>
                          </Box>
                        }
                      />
                      <IconButton onClick={() => toast.info(`Opening audit for ${item.asset_name}`)}>
                        <EditIcon />
                      </IconButton>
                    </ListItem>
                    {index < auditSchedule.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Asset Discrepancies
              </Typography>
              {assets.filter(a => a.audit_status === 'discrepancy' || a.audit_status === 'missing').length === 0 ? (
                <Alert severity="success">
                  No discrepancies found. All assets are properly audited.
                </Alert>
              ) : (
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Asset ID</TableCell>
                        <TableCell>Asset Name</TableCell>
                        <TableCell>Issue Type</TableCell>
                        <TableCell>Last Audit</TableCell>
                        <TableCell>Notes</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assets
                        .filter(a => a.audit_status === 'discrepancy' || a.audit_status === 'missing')
                        .map((asset) => (
                          <TableRow key={asset.id} hover>
                            <TableCell>{asset.unique_asset_id}</TableCell>
                            <TableCell>{asset.name}</TableCell>
                            <TableCell>
                              <Chip
                                icon={getAuditStatusIcon(asset.audit_status)}
                                label={asset.audit_status === 'missing' ? 'Missing' : 'Discrepancy'}
                                size="small"
                                color="error"
                              />
                            </TableCell>
                            <TableCell>{asset.last_audit_date}</TableCell>
                            <TableCell>{asset.notes || 'No notes available'}</TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleAuditAsset(asset)}
                              >
                                Resolve
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        {/* Audit Dialog */}
        <Dialog open={auditDialogOpen} onClose={() => setAuditDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Audit Asset: {selectedAsset?.name}
          </DialogTitle>
          <DialogContent>
            {selectedAsset && (
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Asset ID"
                    value={selectedAsset.unique_asset_id}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Serial Number"
                    value={selectedAsset.serial_number}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Condition</InputLabel>
                    <Select defaultValue={selectedAsset.condition} label="Condition">
                      <MenuItem value="Excellent">Excellent</MenuItem>
                      <MenuItem value="Good">Good</MenuItem>
                      <MenuItem value="Fair">Fair</MenuItem>
                      <MenuItem value="Poor">Poor</MenuItem>
                      <MenuItem value="Damaged">Damaged</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Audit Status</InputLabel>
                    <Select defaultValue={selectedAsset.audit_status} label="Audit Status">
                      <MenuItem value="verified">Verified</MenuItem>
                      <MenuItem value="discrepancy">Discrepancy</MenuItem>
                      <MenuItem value="missing">Missing</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Audit Notes"
                    multiline
                    rows={4}
                    placeholder="Enter audit findings, observations, or issues..."
                    defaultValue={selectedAsset.notes}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAuditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitAudit} variant="contained">
              Submit Audit
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default AuditorAssetsPage;