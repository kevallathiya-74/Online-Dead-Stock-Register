import React, { useState } from 'react';
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
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';

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
  purchase_value: number;
  warranty_expiry?: string;
  last_audit_date: string;
}

const AssetsPage = () => {
  const [assets, setAssets] = useState<Asset[]>([
    {
      id: '1',
      unique_asset_id: 'AST-001',
      name: 'Dell XPS 15 Laptop',
      category: 'IT Equipment',
      manufacturer: 'Dell',
      model: 'XPS 15',
      serial_number: 'DLL123456789',
      status: 'Active',
      condition: 'Good',
      location: 'IT Department - Floor 2',
      assigned_user: 'John Employee',
      purchase_date: '2023-06-15',
      purchase_value: 85000,
      warranty_expiry: '2025-06-15',
      last_audit_date: '2024-01-01',
    },
    {
      id: '2',
      unique_asset_id: 'AST-002',
      name: 'HP LaserJet Printer',
      category: 'Office Equipment',
      manufacturer: 'HP',
      model: 'LaserJet Pro M404n',
      serial_number: 'HP987654321',
      status: 'Active',
      condition: 'Excellent',
      location: 'Admin Office',
      purchase_date: '2023-08-20',
      purchase_value: 25000,
      warranty_expiry: '2025-08-20',
      last_audit_date: '2024-01-15',
    },
    {
      id: '3',
      unique_asset_id: 'AST-003',
      name: 'iPhone 14 Pro',
      category: 'Mobile Device',
      manufacturer: 'Apple',
      model: 'iPhone 14 Pro',
      serial_number: 'APL445566778',
      status: 'Active',
      condition: 'Excellent',
      location: 'Sales Department',
      assigned_user: 'Sarah Manager',
      purchase_date: '2023-09-10',
      purchase_value: 120000,
      warranty_expiry: '2024-09-10',
      last_audit_date: '2023-12-15',
    },
    {
      id: '4',
      unique_asset_id: 'AST-004',
      name: 'Ergonomic Office Chair',
      category: 'Furniture',
      manufacturer: 'Herman Miller',
      model: 'Aeron',
      serial_number: 'HM334455667',
      status: 'Maintenance',
      condition: 'Fair',
      location: 'Maintenance Room',
      purchase_date: '2022-12-01',
      purchase_value: 45000,
      last_audit_date: '2024-02-01',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const categories = ['IT Equipment', 'Office Equipment', 'Mobile Device', 'Furniture', 'Machinery'];

  // Handler functions for asset actions
  const handleViewAsset = (asset: Asset) => {
    console.log('Viewing asset:', asset);
    // In a real app, this would navigate to asset details page or open a modal
    toast.info(`Viewing details for: ${asset.name} (${asset.unique_asset_id})`);
  };

  const handleEditAsset = (asset: Asset) => {
    console.log('Editing asset:', asset);
    // In a real app, this would navigate to edit page or open edit modal
    toast.info(`Opening editor for: ${asset.name} (${asset.unique_asset_id})`);
  };

  const handleDeleteAsset = (asset: Asset) => {
    if (window.confirm(`Are you sure you want to delete asset: ${asset.name}?`)) {
      setAssets(prevAssets => prevAssets.filter(a => a.id !== asset.id));
      console.log('Deleted asset:', asset);
      toast.success(`Asset "${asset.name}" has been successfully deleted.`);
    }
    handleMenuClose();
  };

  const handleTransferAsset = (asset: Asset) => {
    console.log('Transferring asset:', asset);
    // In a real app, this would open a transfer dialog
    toast.info(`Initiating transfer for: ${asset.name}`);
    handleMenuClose();
  };

  const handleGenerateQR = (asset: Asset) => {
    console.log('Generating QR code for asset:', asset);
    // In a real app, this would generate and display/download QR code
    toast.success(`QR Code generated for: ${asset.name} (${asset.unique_asset_id})`);
    handleMenuClose();
  };

  const handlePrintLabel = (asset: Asset) => {
    console.log('Printing label for asset:', asset);
    // In a real app, this would trigger printing functionality
    toast.success(`Label printed for: ${asset.name}`);
    handleMenuClose();
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.unique_asset_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serial_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || asset.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

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

  const stats = {
    totalAssets: assets.length,
    activeAssets: assets.filter(a => a.status === 'Active').length,
    maintenanceAssets: assets.filter(a => a.status === 'Maintenance').length,
    totalValue: assets.reduce((sum, asset) => sum + asset.purchase_value, 0),
  };

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
            <Button variant="outlined" startIcon={<UploadIcon />}>
              Bulk Import
            </Button>
            <Button variant="contained" startIcon={<AddIcon />}>
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
                    <Typography variant="h4">{stats.maintenanceAssets}</Typography>
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
                    <Typography variant="h4">₹{(stats.totalValue / 100000).toFixed(1)}L</Typography>
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
                    <TableRow key={asset.id}>
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
                      <TableCell>₹{asset.purchase_value.toLocaleString()}</TableCell>
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
                          onClick={() => handleEditAsset(asset)}
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
      </Box>
    </DashboardLayout>
  );
};

export default AssetsPage;