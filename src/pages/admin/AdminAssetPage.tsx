import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
  Checkbox,
  Menu,
  MenuItem as MenuItemComp,
  ListItemIcon,
  ListItemText,
  Tooltip,
  CircularProgress,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  QrCode as QrCodeIcon,
  Assignment as AssignmentIcon,
  Build as MaintenanceIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,

  Computer as ComputerIcon,
  Print as PrinterIcon,
  Monitor as MonitorIcon,
  Storage as StorageIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  CurrencyRupee as MoneyIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import AssetQRCodeDialog from '../../components/AssetQRCodeDialog';
import { useNavigate } from 'react-router-dom';

interface AdminAsset {
  id: string;
  unique_asset_id: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  asset_type: string;
  location: string;
  assigned_user?: string | { name: string; department: string };
  purchase_cost: number;
  purchase_date: string;
  warranty_expiry?: string;
  condition: string;
  status: string;
  created_at: string;
  current_value?: number;
  depreciation_rate?: number;
  last_audit_date?: string;
  expected_lifespan?: number;
  qr_code?: string;
}

const AdminAssetPage: React.FC = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<AdminAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedAsset, setSelectedAsset] = useState<AdminAsset | null>(null);
  const [addAssetDialogOpen, setAddAssetDialogOpen] = useState(false);
  const [viewAssetDialogOpen, setViewAssetDialogOpen] = useState(false);
  const [editAssetDialogOpen, setEditAssetDialogOpen] = useState(false);
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [newAsset, setNewAsset] = useState({
    manufacturer: '',
    model: '',
    serial_number: '',
    asset_type: '',
    location: '',
    purchase_cost: '',
    warranty_expiry: '',
    condition: 'Excellent'
  });

  const [editAsset, setEditAsset] = useState({
    manufacturer: '',
    model: '',
    serial_number: '',
    asset_type: '',
    location: '',
    purchase_cost: '',
    warranty_expiry: '',
    condition: '',
    status: ''
  });

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/assets');
      const assetData = response.data.data || response.data;
      setAssets(assetData);
    } catch (error) {
      console.error('Failed to load assets:', error);
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics from loaded assets
  const stats = {
    total: assets.length,
    active: assets.filter(a => a.status === 'Active').length,
    maintenance: assets.filter(a => a.status === 'Under Maintenance').length,
    available: assets.filter(a => a.status === 'Available').length,
    totalValue: assets.reduce((sum, a) => sum + (a.current_value || a.purchase_cost || 0), 0)
  };

  const filteredAssets = assets.filter((asset) => {
    const assignedUserName = typeof asset.assigned_user === 'object' ? asset.assigned_user?.name : asset.assigned_user;
    
    const matchesSearch = 
      asset.unique_asset_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignedUserName?.toLowerCase().includes(searchTerm.toLowerCase()) || '';
    
    const matchesStatus = selectedStatus === 'all' || asset.status === selectedStatus;
    const matchesType = selectedType === 'all' || asset.asset_type === selectedType;
    const matchesLocation = selectedLocation === 'all' || asset.location === selectedLocation;
    
    return matchesSearch && matchesStatus && matchesType && matchesLocation;
  });

  const paginatedAssets = filteredAssets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleAddAsset = async () => {
    if (!newAsset.manufacturer || !newAsset.model || !newAsset.serial_number || !newAsset.asset_type) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const assetData = {
        name: `${newAsset.manufacturer} ${newAsset.model}`,
        manufacturer: newAsset.manufacturer,
        model: newAsset.model,
        serial_number: newAsset.serial_number,
        category: newAsset.asset_type,
        location: newAsset.location,
        purchase_date: new Date().toISOString().split('T')[0],
        purchase_cost: parseFloat(newAsset.purchase_cost) || 0,  // ✅ Fixed
        warranty_expiry: newAsset.warranty_expiry,
        condition: newAsset.condition,
        status: 'Active'
      };

      console.log('Creating asset via API:', assetData);
      
  // Call API to create asset
  const response = await api.post('/assets', assetData);
  const createdAsset = response.data.data || response.data;
  console.log('Asset created successfully:', createdAsset);

  // Reload assets from server
  await loadAssets();

  // Close add dialog and open QR dialog for immediate download
  setAddAssetDialogOpen(false);
  resetNewAsset();
  setSelectedAsset(createdAsset as any);
  setQrCodeDialogOpen(true);
  toast.success(`Asset created successfully! ID: ${createdAsset?.unique_asset_id || ''}`);
    } catch (error: any) {
      console.error('Failed to create asset:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create asset';
      toast.error(errorMsg);
    }
  };

  const handleDeleteAsset = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (asset) {
      setSelectedAsset(asset);
      setDeleteConfirmOpen(true);
    }
  };

  const confirmDeleteAsset = async () => {
    if (!selectedAsset) return;
    
    try {
      console.log('Deleting asset via API:', selectedAsset.id);
      
      // Call API to delete asset
      await api.delete(`/assets/${selectedAsset.id}`);
      
      // Reload assets from server
      await loadAssets();
      
      toast.success('Asset deleted successfully');
      setDeleteConfirmOpen(false);
      setSelectedAsset(null);
    } catch (error: any) {
      console.error('Failed to delete asset:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to delete asset';
      toast.error(errorMsg);
      setDeleteConfirmOpen(false);
    }
  };

  const handleEditAsset = (asset: AdminAsset) => {
    setSelectedAsset(asset);
    setEditAsset({
      manufacturer: asset.manufacturer,
      model: asset.model,
      serial_number: asset.serial_number,
      asset_type: asset.asset_type,
      location: asset.location,
      purchase_cost: asset.purchase_cost.toString(),
      warranty_expiry: asset.warranty_expiry ? asset.warranty_expiry.split('T')[0] : '',
      condition: asset.condition,
      status: asset.status
    });
    setEditAssetDialogOpen(true);
  };

  const handleSaveEditAsset = async () => {
    if (!selectedAsset) return;
    
    try {
      const assetData = {
        manufacturer: editAsset.manufacturer,
        model: editAsset.model,
        serial_number: editAsset.serial_number,
        category: editAsset.asset_type,
        location: editAsset.location,
        purchase_cost: parseFloat(editAsset.purchase_cost) || 0,  // ✅ Fixed
        warranty_expiry: editAsset.warranty_expiry,
        condition: editAsset.condition,
        status: editAsset.status
      };

      console.log('Updating asset via API:', selectedAsset.id, assetData);
      
      // Call API to update asset
      await api.put(`/assets/${selectedAsset.id}`, assetData);
      
      // Reload assets from server
      await loadAssets();
      
      setEditAssetDialogOpen(false);
      setSelectedAsset(null);
      toast.success('Asset updated successfully');
    } catch (error: any) {
      console.error('Failed to update asset:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to update asset';
      toast.error(errorMsg);
    }
  };

  const handleShowQRCode = (asset: AdminAsset) => {
    setSelectedAsset(asset);
    setQrCodeDialogOpen(true);
  };

  const handleGenerateQRCode = () => {
    if (selectedAsset) {
      // In a real application, you would generate an actual QR code here
      const qrData = {
        id: selectedAsset.unique_asset_id,
        name: `${selectedAsset.manufacturer} ${selectedAsset.model}`,
        serialNumber: selectedAsset.serial_number,
        location: selectedAsset.location
      };
      
      navigator.clipboard.writeText(JSON.stringify(qrData, null, 2));
      toast.success('QR Code data copied to clipboard');
    }
  };

  const handleBulkAction = async (action: string) => {
    switch (action) {
      case 'delete':
        if (window.confirm(`Are you sure you want to delete ${bulkSelected.length} assets?`)) {
          try {
            console.log('Bulk deleting assets via API:', bulkSelected);
            
            // Call API to bulk delete assets
            await api.post('/assets/bulk-delete', { assetIds: bulkSelected });
            
            // Reload assets from server
            await loadAssets();
            
            setBulkSelected([]);
            toast.success(`${bulkSelected.length} assets deleted`);
          } catch (error: any) {
            console.error('Failed to bulk delete assets:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to delete assets';
            toast.error(errorMsg);
          }
        }
        break;
      case 'maintenance':
        toast.info(`Scheduled maintenance for ${bulkSelected.length} assets`);
        setBulkSelected([]);
        break;
      case 'audit':
        toast.info(`Audit scheduled for ${bulkSelected.length} assets`);
        setBulkSelected([]);
        break;
      case 'export':
        toast.info(`Exporting ${bulkSelected.length} assets`);
        break;
    }
    setActionMenuAnchor(null);
  };

  const resetNewAsset = () => {
    setNewAsset({
      manufacturer: '',
      model: '',
      serial_number: '',
      asset_type: '',
      location: '',
      purchase_cost: '',
      warranty_expiry: '',
      condition: 'Excellent'
    });
  };

  const getAssetIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'laptop':
      case 'desktop':
        return <ComputerIcon />;
      case 'printer':
        return <PrinterIcon />;
      case 'monitor':
        return <MonitorIcon />;
      case 'server':
        return <StorageIcon />;
      default:
        return <ComputerIcon />;
    }
  };

  const getStatusColor = (status: AdminAsset['status']) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Available':
        return 'info';
      case 'Under Maintenance':
        return 'warning';
      case 'Damaged':
        return 'error';
      case 'Ready for Scrap':
        return 'error';
      default:
        return 'default';
    }
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'Excellent':
      case 'Good':
        return <CheckCircleIcon color="success" />;
      case 'Fair':
        return <WarningIcon color="warning" />;
      case 'Poor':
        return <ErrorIcon color="error" />;
      default:
        return <CheckCircleIcon />;
    }
  };

  const assetTypes = Array.from(new Set(assets.map(a => a.asset_type)));
  const locations = Array.from(new Set(assets.map(a => a.location)));
  const statuses = ['Active', 'Available', 'Under Maintenance', 'Damaged', 'Ready for Scrap'];

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Asset Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Comprehensive asset tracking and lifecycle management
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadAssets}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddAssetDialogOpen(true)}
            >
              Add Asset
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="overline" sx={{ opacity: 0.8 }}>
                      Total Assets
                    </Typography>
                    <Typography variant="h4">{stats.total}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      ₹{stats.totalValue.toLocaleString('en-IN')} value
                    </Typography>
                  </Box>
                  <ComputerIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="overline" sx={{ opacity: 0.8 }}>
                      Available
                    </Typography>
                    <Typography variant="h4">{stats.available}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Ready for assignment
                    </Typography>
                  </Box>
                  <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="overline" sx={{ opacity: 0.8 }}>
                      Assigned
                    </Typography>
                    <Typography variant="h4">{assets.filter(a => a.assigned_user).length}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      In active use
                    </Typography>
                  </Box>
                  <PersonIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="overline" sx={{ opacity: 0.8 }}>
                      Maintenance
                    </Typography>
                    <Typography variant="h4">{stats.maintenance}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Needs attention
                    </Typography>
                  </Box>
                  <MaintenanceIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={3}>
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
              <Grid item xs={12} sm={4} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={selectedStatus}
                    label="Status"
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    {statuses.map(status => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={selectedType}
                    label="Type"
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    {assetTypes.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Location</InputLabel>
                  <Select
                    value={selectedLocation}
                    label="Location"
                    onChange={(e) => setSelectedLocation(e.target.value)}
                  >
                    <MenuItem value="all">All Locations</MenuItem>
                    {locations.map(location => (
                      <MenuItem key={location} value={location}>{location}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    {filteredAssets.length} of {assets.length} assets
                  </Typography>
                  {bulkSelected.length > 0 && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<FilterListIcon />}
                      onClick={(e) => setActionMenuAnchor(e.currentTarget)}
                    >
                      Actions ({bulkSelected.length})
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Assets Table */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Asset Registry
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip 
                  label={`${filteredAssets.length} assets`} 
                  color="primary" 
                  variant="outlined" 
                  size="small" 
                />
                {bulkSelected.length > 0 && (
                  <Chip 
                    label={`${bulkSelected.length} selected`} 
                    color="secondary" 
                    size="small" 
                  />
                )}
              </Box>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={bulkSelected.length > 0 && bulkSelected.length < filteredAssets.length}
                        checked={filteredAssets.length > 0 && bulkSelected.length === filteredAssets.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBulkSelected(filteredAssets.map(a => a.id));
                          } else {
                            setBulkSelected([]);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>Asset Details</TableCell>
                    <TableCell>Type & Model</TableCell>
                    <TableCell>Status & Condition</TableCell>
                    <TableCell>Assignment</TableCell>
                    <TableCell>Financial</TableCell>
                    <TableCell>Maintenance</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedAssets.map((asset) => (
                    <TableRow 
                      key={asset.id}
                      selected={bulkSelected.includes(asset.id)}
                      hover
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={bulkSelected.includes(asset.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBulkSelected(prev => [...prev, asset.id]);
                            } else {
                              setBulkSelected(prev => prev.filter(id => id !== asset.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            {getAssetIcon(asset.asset_type)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {asset.unique_asset_id}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              S/N: {asset.serial_number}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                              <LocationIcon fontSize="inherit" />
                              {asset.location}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {asset.manufacturer}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {asset.model}
                          </Typography>
                          <Chip 
                            label={asset.asset_type} 
                            size="small" 
                            variant="outlined" 
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Chip
                            label={asset.status}
                            color={getStatusColor(asset.status) as any}
                            size="small"
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="caption" display="flex" alignItems="center" gap={0.5}>
                            {getConditionIcon(asset.condition)}
                            {asset.condition}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {asset.assigned_user ? (
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {typeof asset.assigned_user === 'object' ? asset.assigned_user.name : asset.assigned_user}
                            </Typography>
                            {typeof asset.assigned_user === 'object' && asset.assigned_user.department && (
                              <Typography variant="caption" color="text.secondary">
                                {asset.assigned_user.department}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Unassigned
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" display="flex" alignItems="center" gap={0.5}>
                            <MoneyIcon fontSize="small" color="success" />
                            ₹{asset.purchase_cost.toLocaleString('en-IN')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Current: ₹{(asset.current_value || 0).toLocaleString('en-IN')}
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={((asset.current_value || 0) / asset.purchase_cost) * 100} 
                            sx={{ mt: 0.5, height: 4 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                            <ScheduleIcon fontSize="inherit" />
                            Last: {asset.last_audit_date ? new Date(asset.last_audit_date).toLocaleDateString() : 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Warranty: {asset.warranty_expiry ? new Date(asset.warranty_expiry).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              color="info"
                              onClick={() => navigate(`/assets/${asset.id}`)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Asset">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleEditAsset(asset)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="QR Code">
                            <IconButton 
                              size="small" 
                              color="secondary"
                              onClick={() => handleShowQRCode(asset)}
                            >
                              <QrCodeIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Asset">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteAsset(asset.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredAssets.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </CardContent>
        </Card>

        {/* Bulk Actions Menu */}
        <Menu
          anchorEl={actionMenuAnchor}
          open={Boolean(actionMenuAnchor)}
          onClose={() => setActionMenuAnchor(null)}
        >
          <MenuItemComp onClick={() => handleBulkAction('maintenance')}>
            <ListItemIcon>
              <MaintenanceIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Schedule Maintenance</ListItemText>
          </MenuItemComp>
          <MenuItemComp onClick={() => handleBulkAction('audit')}>
            <ListItemIcon>
              <AssignmentIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Schedule Audit</ListItemText>
          </MenuItemComp>
          <MenuItemComp onClick={() => handleBulkAction('export')}>
            <ListItemIcon>
              <DownloadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Export Selected</ListItemText>
          </MenuItemComp>
          <Divider />
          <MenuItemComp onClick={() => handleBulkAction('delete')} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete Selected</ListItemText>
          </MenuItemComp>
        </Menu>

        {/* Add Asset Dialog */}
        <Dialog open={addAssetDialogOpen} onClose={() => setAddAssetDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Add New Asset</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Manufacturer"
                  required
                  value={newAsset.manufacturer}
                  onChange={(e) => setNewAsset(prev => ({ ...prev, manufacturer: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Model"
                  required
                  value={newAsset.model}
                  onChange={(e) => setNewAsset(prev => ({ ...prev, model: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Serial Number"
                  required
                  value={newAsset.serial_number}
                  onChange={(e) => setNewAsset(prev => ({ ...prev, serial_number: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Asset Type</InputLabel>
                  <Select
                    value={newAsset.asset_type}
                    label="Asset Type"
                    onChange={(e) => setNewAsset(prev => ({ ...prev, asset_type: e.target.value }))}
                  >
                    <MenuItem value="Laptop">Laptop</MenuItem>
                    <MenuItem value="Desktop">Desktop</MenuItem>
                    <MenuItem value="Monitor">Monitor</MenuItem>
                    <MenuItem value="Printer">Printer</MenuItem>
                    <MenuItem value="Scanner">Scanner</MenuItem>
                    <MenuItem value="Server">Server</MenuItem>
                    <MenuItem value="Router">Router</MenuItem>
                    <MenuItem value="Switch">Switch</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={newAsset.location}
                  onChange={(e) => setNewAsset(prev => ({ ...prev, location: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Purchase Cost"
                  type="number"
                  value={newAsset.purchase_cost}
                  onChange={(e) => setNewAsset(prev => ({ ...prev, purchase_cost: e.target.value }))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Warranty Expiry"
                  type="date"
                  value={newAsset.warranty_expiry}
                  onChange={(e) => setNewAsset(prev => ({ ...prev, warranty_expiry: e.target.value }))}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Condition</InputLabel>
                  <Select
                    value={newAsset.condition}
                    label="Condition"
                    onChange={(e) => setNewAsset(prev => ({ ...prev, condition: e.target.value }))}
                  >
                    <MenuItem value="Excellent">Excellent</MenuItem>
                    <MenuItem value="Good">Good</MenuItem>
                    <MenuItem value="Fair">Fair</MenuItem>
                    <MenuItem value="Poor">Poor</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setAddAssetDialogOpen(false);
              resetNewAsset();
            }}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleAddAsset}
              disabled={!newAsset.manufacturer || !newAsset.model || !newAsset.serial_number || !newAsset.asset_type}
            >
              Create Asset
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Asset Dialog */}
        <Dialog open={viewAssetDialogOpen} onClose={() => setViewAssetDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Asset Details - {selectedAsset?.unique_asset_id}
          </DialogTitle>
          <DialogContent>
            {selectedAsset && (
              <Grid container spacing={3} sx={{ mt: 0.5 }}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Basic Information</Typography>
                      <Typography><strong>Manufacturer:</strong> {selectedAsset.manufacturer}</Typography>
                      <Typography><strong>Model:</strong> {selectedAsset.model}</Typography>
                      <Typography><strong>Serial Number:</strong> {selectedAsset.serial_number}</Typography>
                      <Typography><strong>Asset Type:</strong> {selectedAsset.asset_type}</Typography>
                      <Typography><strong>Location:</strong> {selectedAsset.location}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Status & Condition</Typography>
                      <Typography><strong>Status:</strong> 
                        <Chip 
                          label={selectedAsset.status} 
                          color={getStatusColor(selectedAsset.status) as any} 
                          size="small" 
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                      <Typography sx={{ mt: 1 }}><strong>Condition:</strong> {selectedAsset.condition}</Typography>
                      <Typography><strong>Assigned User:</strong> {typeof selectedAsset.assigned_user === 'object' ? selectedAsset.assigned_user?.name : selectedAsset.assigned_user || 'Unassigned'}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Financial Information</Typography>
                      <Typography><strong>Purchase Cost:</strong> ₹{selectedAsset.purchase_cost.toLocaleString('en-IN')}</Typography>
                      <Typography><strong>Current Value:</strong> ₹{(selectedAsset.current_value || selectedAsset.purchase_cost).toLocaleString('en-IN')}</Typography>
                      {selectedAsset.depreciation_rate && (
                        <Typography><strong>Depreciation Rate:</strong> {selectedAsset.depreciation_rate}%</Typography>
                      )}
                      <Typography><strong>Purchase Date:</strong> {new Date(selectedAsset.purchase_date).toLocaleDateString()}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Maintenance</Typography>
                      <Typography><strong>Last Audit:</strong> {selectedAsset.last_audit_date ? new Date(selectedAsset.last_audit_date).toLocaleDateString() : 'N/A'}</Typography>
                      <Typography><strong>Warranty Expiry:</strong> {selectedAsset.warranty_expiry ? new Date(selectedAsset.warranty_expiry).toLocaleDateString() : 'N/A'}</Typography>
                      {selectedAsset.expected_lifespan && (
                        <Typography><strong>Expected Lifespan:</strong> {selectedAsset.expected_lifespan} years</Typography>
                      )}
                      <Typography><strong>QR Code:</strong> {selectedAsset.qr_code}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewAssetDialogOpen(false)}>
              Close
            </Button>
            <Button variant="contained" onClick={() => {
              setViewAssetDialogOpen(false);
              handleEditAsset(selectedAsset!);
            }}>
              Edit Asset
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Asset Dialog */}
        <Dialog open={editAssetDialogOpen} onClose={() => setEditAssetDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Edit Asset: {selectedAsset?.unique_asset_id}</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Manufacturer"
                  value={editAsset.manufacturer}
                  onChange={(e) => setEditAsset(prev => ({ ...prev, manufacturer: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Model"
                  value={editAsset.model}
                  onChange={(e) => setEditAsset(prev => ({ ...prev, model: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Serial Number"
                  value={editAsset.serial_number}
                  onChange={(e) => setEditAsset(prev => ({ ...prev, serial_number: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Asset Type</InputLabel>
                  <Select
                    value={editAsset.asset_type}
                    label="Asset Type"
                    onChange={(e) => setEditAsset(prev => ({ ...prev, asset_type: e.target.value }))}
                  >
                    <MenuItem value="Laptop">Laptop</MenuItem>
                    <MenuItem value="Desktop">Desktop</MenuItem>
                    <MenuItem value="Monitor">Monitor</MenuItem>
                    <MenuItem value="Printer">Printer</MenuItem>
                    <MenuItem value="Server">Server</MenuItem>
                    <MenuItem value="Phone">Phone</MenuItem>
                    <MenuItem value="Router">Router</MenuItem>
                    <MenuItem value="Switch">Switch</MenuItem>
                    <MenuItem value="Scanner">Scanner</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Location</InputLabel>
                  <Select
                    value={editAsset.location}
                    label="Location"
                    onChange={(e) => setEditAsset(prev => ({ ...prev, location: e.target.value }))}
                  >
                    <MenuItem value="Floor 1">Floor 1</MenuItem>
                    <MenuItem value="Floor 2">Floor 2</MenuItem>
                    <MenuItem value="Floor 3">Floor 3</MenuItem>
                    <MenuItem value="Warehouse">Warehouse</MenuItem>
                    <MenuItem value="Data Center">Data Center</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={editAsset.status}
                    label="Status"
                    onChange={(e) => setEditAsset(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Available">Available</MenuItem>
                    <MenuItem value="Under Maintenance">Under Maintenance</MenuItem>
                    <MenuItem value="Damaged">Damaged</MenuItem>
                    <MenuItem value="Ready for Scrap">Ready for Scrap</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Condition</InputLabel>
                  <Select
                    value={editAsset.condition}
                    label="Condition"
                    onChange={(e) => setEditAsset(prev => ({ ...prev, condition: e.target.value }))}
                  >
                    <MenuItem value="Excellent">Excellent</MenuItem>
                    <MenuItem value="Good">Good</MenuItem>
                    <MenuItem value="Fair">Fair</MenuItem>
                    <MenuItem value="Poor">Poor</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Purchase Cost"
                  type="number"
                  value={editAsset.purchase_cost}
                  onChange={(e) => setEditAsset(prev => ({ ...prev, purchase_cost: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Warranty Expiry"
                  type="date"
                  value={editAsset.warranty_expiry}
                  onChange={(e) => setEditAsset(prev => ({ ...prev, warranty_expiry: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditAssetDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveEditAsset}>Save Changes</Button>
          </DialogActions>
        </Dialog>

        {/* QR Code Dialog - Using Reusable Component */}
        <AssetQRCodeDialog
          open={qrCodeDialogOpen}
          asset={selectedAsset}
          onClose={() => {
            setQrCodeDialogOpen(false);
            setSelectedAsset(null);
          }}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="sm">
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this asset?
            </Typography>
            {selectedAsset && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle2">
                  {selectedAsset.manufacturer} {selectedAsset.model}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ID: {selectedAsset.unique_asset_id}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Serial: {selectedAsset.serial_number}
                </Typography>
              </Box>
            )}
            <Typography variant="body2" color="error.main" sx={{ mt: 2 }}>
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={confirmDeleteAsset}>
              Delete Asset
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default AdminAssetPage;