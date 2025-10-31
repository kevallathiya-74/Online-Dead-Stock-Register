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
  IconButton,
  TextField,
  InputAdornment,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Menu,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Checkbox,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  QrCode as QrCodeIcon,
  SwapHoriz as TransferIcon,
  Print as PrintIcon,
  Upload as UploadIcon,
  MoreVert as MoreIcon,
  Inventory as InventoryIcon,
  Computer as ComputerIcon,
  Smartphone as SmartphoneIcon,
  Print as PrinterIcon,
  Chair as FurnitureIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

interface Asset {
  id: string;
  unique_asset_id: string;
  name: string;
  category: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  status: 'Active' | 'Inactive' | 'Maintenance' | 'Scrapped';
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  location: string;
  assigned_user?: string;
  purchase_date: string;
  purchase_cost: number;
  warranty_expiry?: string;
  last_audit_date: string;
}

const AssetsPage = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [newAssetQrDialogOpen, setNewAssetQrDialogOpen] = useState(false);
  const [newlyCreatedAsset, setNewlyCreatedAsset] = useState<Asset | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [transferData, setTransferData] = useState({
    to_location: '',
    to_user: '',
    notes: ''
  });
  const [stats, setStats] = useState({
    totalAssets: 0,
    activeAssets: 0,
    underMaintenance: 0,
    totalValue: 0,
  });
  const [formData, setFormData] = useState({
    unique_asset_id: '',
    name: '',
    asset_type: '',
    manufacturer: '',
    model: '',
    serial_number: '',
    location: '',
    purchase_date: '',
    purchase_value: '',
    status: 'Active',
    condition: 'Good',
    department: '',
  });
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const categories = ['IT Equipment', 'Office Equipment', 'Mobile Device', 'Furniture', 'Machinery'];

  // Load assets from API on component mount
  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      
      // Fetch both assets and stats in parallel
      const [assetsResponse, statsResponse] = await Promise.all([
        api.get('/assets'),
        api.get('/assets/stats')
      ]);
      
      // Handle new API response format with pagination
      const apiData = assetsResponse.data.data || assetsResponse.data;
      const assetsArray = apiData.data || apiData;
      
      // Transform backend data to match frontend interface
      const transformedAssets = Array.isArray(assetsArray) ? assetsArray.map((asset: any) => ({
        id: asset._id || asset.id,
        unique_asset_id: asset.unique_asset_id,
        name: asset.name,
        category: asset.category || asset.asset_type,
        manufacturer: asset.manufacturer,
        model: asset.model,
        serial_number: asset.serial_number,
        status: asset.status,
        condition: asset.condition,
        location: asset.location,
        assigned_user: asset.assigned_to?.name || asset.assigned_user,
        purchase_date: asset.purchase_date,
        purchase_cost: asset.purchase_cost || asset.purchase_value || asset.value || 0,
        warranty_expiry: asset.warranty_expiry,
        last_audit_date: asset.last_audit_date,
      })) : [];
      
      setAssets(transformedAssets);
      
      // Update stats from API - DYNAMIC!
      if (statsResponse.data.success && statsResponse.data.data) {
        setStats({
          totalAssets: statsResponse.data.data.totalAssets,
          activeAssets: statsResponse.data.data.activeAssets,
          underMaintenance: statsResponse.data.data.underMaintenance,
          totalValue: statsResponse.data.data.totalValue,
        });
      }
    } catch (error) {
      console.error('Failed to load assets:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to load assets';
      toast.error(errorMsg);
      setAssets([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Handler functions for asset actions
  const handleViewAsset = (asset: Asset) => {
    console.log('Viewing asset:', asset);
    // In a real app, this would navigate to asset details page or open a modal
    toast.info(`Viewing details for: ${asset.name} (${asset.unique_asset_id})`);
  };

  const handleAddAsset = async () => {
    try {
      // Validation
      if (!formData.unique_asset_id || !formData.manufacturer || !formData.model || 
          !formData.serial_number || !formData.asset_type || !formData.department) {
        toast.error('Please fill in all required fields: Asset ID, Manufacturer, Model, Serial Number, Category, and Department');
        return;
      }

      const payload = {
        unique_asset_id: formData.unique_asset_id,
        manufacturer: formData.manufacturer,
        model: formData.model,
        serial_number: formData.serial_number,
        asset_type: formData.asset_type,
        department: formData.department,
        location: formData.location || 'Unknown',
        purchase_date: formData.purchase_date || new Date().toISOString(),
        purchase_cost: formData.purchase_value ? Number(formData.purchase_value) : 0,
        status: formData.status,
        condition: formData.condition,
      };

      const response = await api.post('/assets', payload);
      const createdAsset = response.data.data || response.data;
      
      toast.success('Asset added successfully');
      setAddDialogOpen(false);
      resetForm();
      
      // Generate and show QR code for the new asset
      const fullAssetData = {
        id: createdAsset._id || createdAsset.id,
        unique_asset_id: createdAsset.unique_asset_id,
        name: `${createdAsset.manufacturer} ${createdAsset.model}`,
        category: createdAsset.asset_type,
        manufacturer: createdAsset.manufacturer,
        model: createdAsset.model,
        serial_number: createdAsset.serial_number,
        status: createdAsset.status,
        condition: createdAsset.condition,
        location: createdAsset.location,
        purchase_date: createdAsset.purchase_date,
        purchase_value: createdAsset.purchase_cost,
        department: createdAsset.department
      };
      
      // Create comprehensive QR data with all asset details
      const qrData = JSON.stringify({
        type: 'asset',
        id: fullAssetData.id,
        asset_id: fullAssetData.unique_asset_id,
        name: fullAssetData.name,
        manufacturer: fullAssetData.manufacturer,
        model: fullAssetData.model,
        serial: fullAssetData.serial_number,
        category: fullAssetData.category,


        location: fullAssetData.location,
        status: fullAssetData.status,
        condition: fullAssetData.condition,
        purchase_date: fullAssetData.purchase_date,
        purchase_value: fullAssetData.purchase_value,
        department: fullAssetData.department,
        scan_url: `${window.location.origin}/assets/${fullAssetData.id}`
      });
      
      setQrCodeUrl(qrData);
      setNewlyCreatedAsset(fullAssetData as any);
      setNewAssetQrDialogOpen(true);
      
      await loadAssets();
    } catch (error: any) {
      console.error('Failed to add asset:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to add asset';
      toast.error(errorMsg);
    }
  };

  const handleEditAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setFormData({
      unique_asset_id: asset.unique_asset_id,
      name: asset.name || '',
      asset_type: asset.category,
      manufacturer: asset.manufacturer,
      model: asset.model,
      serial_number: asset.serial_number,
      location: asset.location,
      purchase_date: asset.purchase_date?.split('T')[0] || '',
      purchase_value: asset.purchase_cost?.toString() || '',
      status: asset.status,
      condition: asset.condition,
      department: '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdateAsset = async () => {
    if (!selectedAsset) return;

    try {
      const payload = {
        manufacturer: formData.manufacturer,
        model: formData.model,
        serial_number: formData.serial_number,
        asset_type: formData.asset_type,
        location: formData.location,
        purchase_date: formData.purchase_date,
        purchase_cost: formData.purchase_value ? Number(formData.purchase_value) : undefined,
        status: formData.status,
        condition: formData.condition,
      };

      await api.put(`/assets/${selectedAsset.id}`, payload);
      toast.success('Asset updated successfully');
      setEditDialogOpen(false);
      resetForm();
      await loadAssets();
    } catch (error: any) {
      console.error('Failed to update asset:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to update asset';
      toast.error(errorMsg);
    }
  };

  const resetForm = () => {
    setFormData({
      unique_asset_id: '',
      name: '',
      asset_type: '',
      manufacturer: '',
      model: '',
      serial_number: '',
      location: '',
      purchase_date: '',
      purchase_value: '',
      status: 'Active',
      condition: 'Good',
      department: '',
    });
    setSelectedAsset(null);
  };

  const handleBulkImport = () => {
    setBulkImportOpen(true);
  };

  const handleImportFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
        toast.error('Please select a CSV or Excel file');
        return;
      }
      
      setImportFile(file);
    }
  };

  const handleBulkImportSubmit = async () => {
    if (!importFile) {
      toast.error('Please select a file to import');
      return;
    }

    try {
      setImporting(true);
      
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await api.post('/assets/bulk-import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const { imported, failed, total } = response.data.data;
        toast.success(`Successfully imported ${imported} out of ${total} assets${failed > 0 ? `. ${failed} failed.` : ''}`);
        
        setBulkImportOpen(false);
        setImportFile(null);
        
        // Refresh assets list
        await loadAssets();
      }
    } catch (error: any) {
      console.error('Failed to import assets:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to import assets';
      toast.error(errorMsg);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Create CSV template
    const headers = ['unique_asset_id', 'manufacturer', 'model', 'serial_number', 'asset_type', 'department', 'location', 'purchase_date', 'purchase_cost', 'status', 'condition'];
    const sampleRow = ['AST-001', 'Dell', 'Latitude 5520', 'SN123456', 'IT Equipment', 'IT Department', 'Office 101', '2024-01-01', '50000', 'Active', 'Good'];
    
    const csvContent = [
      headers.join(','),
      sampleRow.join(','),
      '# Add your assets below this line (one per row)',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'asset_import_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    toast.success('Template downloaded successfully');
  };

  const handleDeleteAsset = async (asset: Asset) => {
    if (window.confirm(`Are you sure you want to delete asset: ${asset.name}?`)) {
      try {
        console.log('Deleting asset via API:', asset.id);
        
        // Call API to delete asset
        await api.delete(`/assets/${asset.id}`);
        
        // Update local state
        setAssets(prevAssets => prevAssets.filter(a => a.id !== asset.id));
        
        toast.success(`Asset "${asset.name}" has been successfully deleted.`);
        
        // Reload assets to ensure consistency with backend
        await loadAssets();
      } catch (error: any) {
        console.error('Failed to delete asset:', error);
        const errorMsg = error.response?.data?.message || error.message || 'Failed to delete asset';
        toast.error(errorMsg);
      }
    }
    handleMenuClose();
  };

  const handleTransferAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setTransferDialogOpen(true);
    handleMenuClose();
  };

  const handleTransferSubmit = async () => {
    if (!selectedAsset || !transferData.to_location) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      await api.post('/asset-transfers', {
        asset_id: selectedAsset.id,
        from_location: selectedAsset.location,
        to_location: transferData.to_location,
        to_user: transferData.to_user || null,
        notes: transferData.notes,
        transfer_date: new Date().toISOString()
      });

      toast.success('Asset transfer initiated successfully');
      setTransferDialogOpen(false);
      setTransferData({ to_location: '', to_user: '', notes: '' });
      loadAssets(); // Reload assets
    } catch (error: any) {
      console.error('Failed to transfer asset:', error);
      toast.error(error.response?.data?.message || 'Failed to transfer asset');
    }
  };

  const handleGenerateQR = async (asset: Asset) => {
    try {
      // Create comprehensive QR data with all asset details
      const qrData = JSON.stringify({
        type: 'asset',
        id: asset.id,
        asset_id: asset.unique_asset_id,
        name: asset.name,
        manufacturer: asset.manufacturer,
        model: asset.model,
        serial: asset.serial_number,
        category: asset.category,
        location: asset.location,
        status: asset.status,
        condition: asset.condition,
        purchase_date: asset.purchase_date,
        purchase_value: asset.purchase_cost,
        assigned_user: asset.assigned_user,
        scan_url: `${window.location.origin}/assets/${asset.id}`
      });
      setQrCodeUrl(qrData);
      setSelectedAsset(asset);
      setQrDialogOpen(true);
      toast.success(`QR Code generated for: ${asset.name}`);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      toast.error('Failed to generate QR code');
    }
    handleMenuClose();
  };

  const handlePrintLabel = async (asset: Asset) => {
    try {
      // Create a printable label
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Asset Label - ${asset.unique_asset_id}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .label { border: 2px solid #000; padding: 20px; max-width: 400px; }
                .label h2 { margin: 0 0 10px 0; }
                .label p { margin: 5px 0; }
                .qr { margin-top: 10px; }
              </style>
            </head>
            <body>
              <div class="label">
                <h2>${asset.name}</h2>
                <p><strong>Asset ID:</strong> ${asset.unique_asset_id}</p>
                <p><strong>Serial:</strong> ${asset.serial_number}</p>
                <p><strong>Model:</strong> ${asset.manufacturer} ${asset.model}</p>
                <p><strong>Location:</strong> ${asset.location}</p>
              </div>
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(() => window.close(), 500);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
      toast.success(`Label sent to printer for: ${asset.name}`);
    } catch (error) {
      console.error('Failed to print label:', error);
      toast.error('Failed to print label');
    }
    handleMenuClose();
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = 
      (asset.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (asset.category?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (asset.unique_asset_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (asset.manufacturer?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (asset.model?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (asset.serial_number?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || asset.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allAssetIds = filteredAssets.map(asset => asset.id);
      setSelectedAssets(allAssetIds);
    } else {
      setSelectedAssets([]);
    }
  };

  const handleSelectAsset = (assetId: string) => {
    setSelectedAssets(prev => {
      if (prev.includes(assetId)) {
        return prev.filter(id => id !== assetId);
      } else {
        return [...prev, assetId];
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedAssets.length === 0) {
      toast.error('No assets selected');
      return;
    }

    try {
      // Delete each asset
      await Promise.all(
        selectedAssets.map(assetId => api.delete(`/assets/${assetId}`))
      );

      toast.success(`Successfully deleted ${selectedAssets.length} asset(s)`);
      setSelectedAssets([]);
      setBulkDeleteDialogOpen(false);
      await loadAssets();
    } catch (error: any) {
      console.error('Failed to delete assets:', error);
      toast.error(error.response?.data?.message || 'Failed to delete assets');
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, asset: Asset) => {
    setAnchorEl(event.currentTarget);
    setSelectedAsset(asset);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAsset(null);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'IT Equipment':
        return <ComputerIcon />;
      case 'Mobile Device':
        return <SmartphoneIcon />;
      case 'Office Equipment':
        return <PrinterIcon />;
      case 'Furniture':
        return <FurnitureIcon />;
      default:
        return <InventoryIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Inactive':
        return 'default';
      case 'Maintenance':
        return 'warning';
      case 'Scrapped':
        return 'error';
      default:
        return 'default';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'Excellent':
        return 'success';
      case 'Good':
        return 'primary';
      case 'Fair':
        return 'warning';
      case 'Poor':
        return 'error';
      default:
        return 'default';
    }
  };

  // Stats now loaded from API (removed static calculation)

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
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Asset Inventory
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and track all organizational assets
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {selectedAssets.length > 0 && (
              <>
                <Chip 
                  label={`${selectedAssets.length} selected`}
                  color="primary"
                  onDelete={() => setSelectedAssets([])}
                  sx={{ height: 36, fontSize: '0.875rem' }}
                />
                <Button 
                  variant="contained" 
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setBulkDeleteDialogOpen(true)}
                >
                  Delete Selected
                </Button>
              </>
            )}
            <Button 
              variant="outlined" 
              startIcon={<QrCodeIcon />}
              onClick={() => navigate('/assets/scan-qr')}
            >
              Scan QR Code
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<UploadIcon />}
              onClick={handleBulkImport}
            >
              Bulk Import
            </Button>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
            >
              Add New Asset
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Total Assets
                    </Typography>
                    <Typography variant="h4">{stats.totalAssets}</Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: 'primary.main' }}>
                    <InventoryIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Active Assets
                    </Typography>
                    <Typography variant="h4">{stats.activeAssets}</Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: 'success.main' }}>
                    <InventoryIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Under Maintenance
                    </Typography>
                    <Typography variant="h4">{stats.underMaintenance}</Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: 'warning.main' }}>
                    <InventoryIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Total Value
                    </Typography>
                    <Typography variant="h4">₹{((stats.totalValue || 0) / 100000).toFixed(1)}L</Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: 'info.main' }}>
                    <InventoryIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search assets by name, ID, manufacturer, or serial number..."
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
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    label="Category"
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={selectedStatus}
                    label="Status"
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                    <MenuItem value="Maintenance">Maintenance</MenuItem>
                    <MenuItem value="Scrapped">Scrapped</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Showing {filteredAssets.length} of {assets.length} assets
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Assets Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Asset Inventory ({filteredAssets.length})
            </Typography>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedAssets.length > 0 && selectedAssets.length < filteredAssets.length}
                        checked={filteredAssets.length > 0 && selectedAssets.length === filteredAssets.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>Asset</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Condition</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAssets.map((asset) => (
                    <TableRow 
                      key={asset.id}
                      selected={selectedAssets.includes(asset.id)}
                      hover
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedAssets.includes(asset.id)}
                          onChange={() => handleSelectAsset(asset.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            {getCategoryIcon(asset.category)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                              {asset.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {asset.unique_asset_id} • {asset.manufacturer} {asset.model}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              S/N: {asset.serial_number}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{asset.category}</TableCell>
                      <TableCell>
                        <Chip
                          label={asset.status}
                          color={getStatusColor(asset.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={asset.condition}
                          color={getConditionColor(asset.condition) as any}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{asset.location}</TableCell>
                      <TableCell>{asset.assigned_user || 'Unassigned'}</TableCell>
                      <TableCell>₹{asset.purchase_cost?.toLocaleString() || '0'}</TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleViewAsset(asset)}
                          title="View Asset Details"
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => handleEditAssetClick(asset)}
                          title="Edit Asset"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={(e) => handleMenuClick(e, asset)}
                          title="More Actions"
                        >
                          <MoreIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => selectedAsset && handleGenerateQR(selectedAsset)}>
            <ListItemIcon>
              <QrCodeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Generate QR Code</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => selectedAsset && handleTransferAsset(selectedAsset)}>
            <ListItemIcon>
              <TransferIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Transfer Asset</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => selectedAsset && handlePrintLabel(selectedAsset)}>
            <ListItemIcon>
              <PrintIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Print Label</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => selectedAsset && handleDeleteAsset(selectedAsset)}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete Asset</ListItemText>
          </MenuItem>
        </Menu>

        {/* Add Asset Dialog */}
        <Dialog 
          open={addDialogOpen} 
          onClose={() => setAddDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Add New Asset</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Asset ID"
                    required
                    value={formData.unique_asset_id}
                    onChange={(e) => setFormData({...formData, unique_asset_id: e.target.value})}
                    placeholder="e.g., AST-001"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Category</InputLabel>
                    <Select 
                      label="Category" 
                      value={formData.asset_type}
                      onChange={(e) => setFormData({...formData, asset_type: e.target.value})}
                    >
                      {categories.map((cat) => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Manufacturer"
                    required
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Model"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Serial Number"
                    required
                    value={formData.serial_number}
                    onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Department"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    placeholder="e.g., IT, HR, Finance"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Purchase Date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Purchase Value"
                    value={formData.purchase_value}
                    onChange={(e) => setFormData({...formData, purchase_value: e.target.value})}
                    InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select 
                      label="Status" 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Inactive">Inactive</MenuItem>
                      <MenuItem value="Maintenance">Maintenance</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Condition</InputLabel>
                    <Select 
                      label="Condition" 
                      value={formData.condition}
                      onChange={(e) => setFormData({...formData, condition: e.target.value})}
                    >
                      <MenuItem value="Excellent">Excellent</MenuItem>
                      <MenuItem value="Good">Good</MenuItem>
                      <MenuItem value="Fair">Fair</MenuItem>
                      <MenuItem value="Poor">Poor</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setAddDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleAddAsset}
            >
              Add Asset
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Asset Dialog */}
        <Dialog 
          open={editDialogOpen} 
          onClose={() => { setEditDialogOpen(false); resetForm(); }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Edit Asset</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Asset ID"
                    value={formData.unique_asset_id}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select 
                      label="Category" 
                      value={formData.asset_type}
                      onChange={(e) => setFormData({...formData, asset_type: e.target.value})}
                    >
                      {categories.map((cat) => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Model"
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Serial Number"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Purchase Date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Purchase Value"
                    value={formData.purchase_value}
                    onChange={(e) => setFormData({...formData, purchase_value: e.target.value})}
                    InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select 
                      label="Status" 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Inactive">Inactive</MenuItem>
                      <MenuItem value="Maintenance">Maintenance</MenuItem>
                      <MenuItem value="Scrapped">Scrapped</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Condition</InputLabel>
                    <Select 
                      label="Condition" 
                      value={formData.condition}
                      onChange={(e) => setFormData({...formData, condition: e.target.value})}
                    >
                      <MenuItem value="Excellent">Excellent</MenuItem>
                      <MenuItem value="Good">Good</MenuItem>
                      <MenuItem value="Fair">Fair</MenuItem>
                      <MenuItem value="Poor">Poor</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setEditDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleUpdateAsset}
            >
              Update Asset
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Import Dialog */}
        <Dialog
          open={bulkImportOpen}
          onClose={() => { setBulkImportOpen(false); setImportFile(null); }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Bulk Import Assets</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="info">
                Upload a CSV or Excel file to import multiple assets at once. 
                Download the template to see the required format.
              </Alert>

              <Button
                variant="outlined"
                onClick={handleDownloadTemplate}
                fullWidth
              >
                Download Template
              </Button>

              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: importFile ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  bgcolor: importFile ? 'action.hover' : 'background.paper',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover',
                  }
                }}
                onClick={() => document.getElementById('bulk-import-file')?.click()}
              >
                <input
                  id="bulk-import-file"
                  type="file"
                  hidden
                  accept=".csv,.xlsx,.xls"
                  onChange={handleImportFileSelect}
                />
                <UploadIcon sx={{ fontSize: 48, color: importFile ? 'primary.main' : 'text.secondary', mb: 1 }} />
                {importFile ? (
                  <Box>
                    <Typography variant="body1" fontWeight="medium" color="primary">
                      {importFile.name}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Click to change file
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      Click to select a file
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Supported: CSV, Excel (.xlsx, .xls)
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setBulkImportOpen(false); setImportFile(null); }} disabled={importing}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleBulkImportSubmit}
              disabled={!importFile || importing}
              startIcon={importing ? <CircularProgress size={20} /> : <UploadIcon />}
            >
              {importing ? 'Importing...' : 'Import Assets'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* QR Code Dialog (for existing assets) */}
        <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Asset QR Code</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              {selectedAsset && qrCodeUrl && (
                <>
                  <Typography variant="h6">{selectedAsset.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedAsset.unique_asset_id}
                  </Typography>
                  <Box id="qr-code-container" sx={{ p: 2, bgcolor: 'white', borderRadius: 1 }}>
                    <QRCodeCanvas
                      value={qrCodeUrl}
                      size={300}
                      level="H"
                      includeMargin={true}
                    />
                  </Box>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      const canvas = document.querySelector('#qr-code-container canvas') as HTMLCanvasElement;
                      if (canvas) {
                        canvas.toBlob((blob) => {
                          if (blob) {
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.download = `${selectedAsset.unique_asset_id}-qr.png`;
                            link.href = url;
                            link.click();
                            URL.revokeObjectURL(url);
                            toast.success('QR Code downloaded');
                          }
                        });
                      }
                    }}
                  >
                    Download QR Code
                  </Button>
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setQrDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* New Asset Success Dialog with QR Code */}
        <Dialog open={newAssetQrDialogOpen} onClose={() => setNewAssetQrDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CheckCircleIcon color="success" fontSize="large" />
              <Typography variant="h5">Asset Created Successfully!</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {newlyCreatedAsset && qrCodeUrl && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Alert severity="success" sx={{ mb: 2 }}>
                      Your asset has been created and a QR code has been generated.
                    </Alert>
                    <Typography variant="h6" gutterBottom>Asset Details:</Typography>
                    <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                      <Typography variant="body2"><strong>Asset ID:</strong> {newlyCreatedAsset.unique_asset_id}</Typography>
                      <Typography variant="body2"><strong>Name:</strong> {newlyCreatedAsset.name}</Typography>
                      <Typography variant="body2"><strong>Manufacturer:</strong> {newlyCreatedAsset.manufacturer}</Typography>
                      <Typography variant="body2"><strong>Model:</strong> {newlyCreatedAsset.model}</Typography>
                      <Typography variant="body2"><strong>Serial:</strong> {newlyCreatedAsset.serial_number}</Typography>
                      <Typography variant="body2"><strong>Category:</strong> {newlyCreatedAsset.category}</Typography>
                      <Typography variant="body2"><strong>Location:</strong> {newlyCreatedAsset.location}</Typography>
                      <Typography variant="body2"><strong>Status:</strong> {newlyCreatedAsset.status}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h6">QR Code</Typography>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        Scan this QR code to view asset details
                      </Typography>
                      <Box id="new-asset-qr-container" sx={{ p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 2 }}>
                        <QRCodeCanvas
                          value={qrCodeUrl}
                          size={250}
                          level="H"
                          includeMargin={true}
                        />
                      </Box>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => {
                          const canvas = document.querySelector('#new-asset-qr-container canvas') as HTMLCanvasElement;
                          if (canvas) {
                            canvas.toBlob((blob) => {
                              if (blob) {
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.download = `${newlyCreatedAsset.unique_asset_id}-qr.png`;
                                link.href = url;
                                link.click();
                                URL.revokeObjectURL(url);
                                toast.success('QR Code downloaded successfully!');
                              }
                            });
                          }
                        }}
                      >
                        Download QR Code
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setNewAssetQrDialogOpen(false);
              setNewlyCreatedAsset(null);
            }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Transfer Asset Dialog */}
        <Dialog open={transferDialogOpen} onClose={() => setTransferDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Transfer Asset</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {selectedAsset && (
                <>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Transferring: <strong>{selectedAsset.name}</strong> ({selectedAsset.unique_asset_id})
                    <br />
                    Current Location: <strong>{selectedAsset.location}</strong>
                  </Alert>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="To Location"
                        required
                        value={transferData.to_location}
                        onChange={(e) => setTransferData({...transferData, to_location: e.target.value})}
                        placeholder="e.g., IT Department, Floor 3"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Assigned To (Optional)"
                        value={transferData.to_user}
                        onChange={(e) => setTransferData({...transferData, to_user: e.target.value})}
                        placeholder="User ID or Email"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Notes"
                        value={transferData.notes}
                        onChange={(e) => setTransferData({...transferData, notes: e.target.value})}
                        placeholder="Reason for transfer, special instructions, etc."
                      />
                    </Grid>
                  </Grid>
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setTransferDialogOpen(false);
              setTransferData({ to_location: '', to_user: '', notes: '' });
            }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleTransferSubmit}>
              Transfer Asset
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Delete Confirmation Dialog */}
        <Dialog open={bulkDeleteDialogOpen} onClose={() => setBulkDeleteDialogOpen(false)} maxWidth="sm">
          <DialogTitle>Confirm Bulk Delete</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body1">
                Are you sure you want to delete <strong>{selectedAssets.length}</strong> selected asset(s)?
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                This action cannot be undone.
              </Typography>
            </Alert>
            {selectedAssets.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Selected Assets:
                </Typography>
                <Box sx={{ mt: 1, maxHeight: 200, overflowY: 'auto' }}>
                  {selectedAssets.slice(0, 10).map(assetId => {
                    const asset = assets.find(a => a.id === assetId);
                    return asset ? (
                      <Chip
                        key={assetId}
                        label={`${asset.unique_asset_id} - ${asset.name}`}
                        size="small"
                        sx={{ m: 0.5 }}
                      />
                    ) : null;
                  })}
                  {selectedAssets.length > 10 && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      ...and {selectedAssets.length - 10} more
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBulkDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="error" 
              onClick={handleBulkDelete}
              startIcon={<DeleteIcon />}
            >
              Delete {selectedAssets.length} Asset(s)
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default AssetsPage;