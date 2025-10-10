import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Divider,
  Avatar,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ListItemAvatar,
} from '@mui/material';
import {
  Laptop as LaptopIcon,
  Smartphone as PhoneIcon,
  Print as PrinterIcon,
  Computer as ComputerIcon,
  QrCodeScanner as QrIcon,
  Inventory as InventoryIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  DateRange as DateIcon,
  Feedback as FeedbackIcon,
  Build as MaintenanceIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Add as AddIcon,
  Report as ReportIcon,
  Check as CheckinIcon,
  History as HistoryIcon,
  Assignment as RequestIcon,
  Schedule as ReminderIcon,
  EventAvailable as ReturnIcon,
  TrendingUp,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

interface Asset {
  id: string;
  unique_asset_id: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  status: string;
  location: string;
  assigned_user: string;
  last_audit_date: string;
  condition: string;
  category?: string;
  assigned_date?: string;
  warranty_expiry?: string;
}

interface MaintenanceRequest {
  id: string;
  asset_id: string;
  asset_name: string;
  issue_description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed';
  created_date: string;
}

const EmployeeDashboard = () => {
  const [myAssets, setMyAssets] = useState<Asset[]>([
    {
      id: '1',
      unique_asset_id: 'ASSET-001',
      manufacturer: 'Dell',
      model: 'XPS 15',
      serial_number: 'DLL123456789',
      status: 'Active',
      location: 'IT Department - Floor 2',
      assigned_user: 'Current User',
      last_audit_date: '2024-01-01',
      condition: 'Good',
      category: 'Laptop',
      assigned_date: '2023-06-15',
      warranty_expiry: '2025-06-15',
    },
    {
      id: '2',
      unique_asset_id: 'ASSET-005',
      manufacturer: 'Apple',
      model: 'iPhone 14',
      serial_number: 'APL987654321',
      status: 'Active',
      location: 'IT Department - Floor 2',
      assigned_user: 'Current User',
      last_audit_date: '2024-01-01',
      condition: 'Excellent',
      category: 'Mobile',
      assigned_date: '2023-08-20',
    },
    {
      id: '3',
      unique_asset_id: 'ASSET-012',
      manufacturer: 'HP',
      model: 'Monitor 24"',
      serial_number: 'HP445566778',
      status: 'Active',
      location: 'IT Department - Floor 2',
      assigned_user: 'Current User',
      last_audit_date: '2023-12-15',
      condition: 'Good',
      category: 'Monitor',
      assigned_date: '2023-06-15',
      warranty_expiry: '2024-02-15',
    },
  ]);

  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([
    {
      id: '1',
      asset_id: 'ASSET-001',
      asset_name: 'Dell XPS 15',
      issue_description: 'Battery not holding charge properly',
      priority: 'medium',
      status: 'pending',
      created_date: '2024-01-10',
    },
  ]);

  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [requestForm, setRequestForm] = useState({
    issue_description: '',
    priority: 'medium',
  });

  // Employee statistics
  const employeeStats = {
    total_assets: myAssets.length,
    active_assets: myAssets.filter(a => a.status === 'Active').length,
    pending_maintenance: maintenanceRequests.filter(r => r.status === 'pending').length,
    warranties_expiring: myAssets.filter(a => {
      if (!a.warranty_expiry) return false;
      const expiryDate = new Date(a.warranty_expiry);
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
      return expiryDate <= threeMonthsFromNow;
    }).length,
  };



  const handleQRScan = (asset: Asset) => {
    // Verify if this asset is assigned to current user
    if (asset.assigned_user === 'Current User') {
      setSelectedAsset(asset);
      setQrScannerOpen(false);
      // Could open asset details or quick action menu
    } else {
      // Show error that this asset is not assigned to them
      console.warn('Asset not assigned to current user');
    }
  };

  const handleMaintenanceRequest = (asset: Asset) => {
    setSelectedAsset(asset);
    setRequestForm({
      issue_description: '',
      priority: 'medium',
    });
    setRequestDialogOpen(true);
  };

  const submitMaintenanceRequest = () => {
    if (!selectedAsset || !requestForm.issue_description.trim()) return;

    const newRequest: MaintenanceRequest = {
      id: Date.now().toString(),
      asset_id: selectedAsset.unique_asset_id,
      asset_name: `${selectedAsset.manufacturer} ${selectedAsset.model}`,
      issue_description: requestForm.issue_description,
      priority: requestForm.priority as any,
      status: 'pending',
      created_date: new Date().toISOString().split('T')[0],
    };

    setMaintenanceRequests(prev => [newRequest, ...prev]);
    setRequestDialogOpen(false);
    setSelectedAsset(null);
    setRequestForm({ issue_description: '', priority: 'medium' });
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'laptop': return <LaptopIcon />;
      case 'mobile': return <PhoneIcon />;
      case 'monitor': return <ComputerIcon />;
      case 'printer': return <PrinterIcon />;
      default: return <InventoryIcon />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const isWarrantyExpiringSoon = (warrantyExpiry?: string) => {
    if (!warrantyExpiry) return false;
    const expiryDate = new Date(warrantyExpiry);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiryDate <= threeMonthsFromNow;
  };

  const { user } = useAuth();

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  }> = ({ title, value, icon, color = 'primary' }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4" component="h2">
              {value}
            </Typography>
          </Box>
          <Avatar
            sx={{
              backgroundColor: `${color}.main`,
              height: 56,
              width: 56,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          <PersonIcon />
        </Avatar>
        <Box>
          <Typography variant="h4">
            Welcome back, {user?.full_name || 'Employee'}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your assigned assets and maintenance requests
          </Typography>
        </Box>
      </Box>

      {/* Quick Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<QrIcon />}
              onClick={() => setQrScannerOpen(true)}
              size="large"
            >
              Scan My Asset
            </Button>
            <Button
              variant="outlined"
              startIcon={<MaintenanceIcon />}
              size="large"
              onClick={() => handleMaintenanceRequest(myAssets[0])}
            >
              Report Issue
            </Button>
            <Button
              variant="outlined"
              startIcon={<FeedbackIcon />}
              size="large"
            >
              Provide Feedback
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Assets"
            value={employeeStats.total_assets}
            icon={<InventoryIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Assets"
            value={employeeStats.active_assets}
            icon={<CheckIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Maintenance"
            value={employeeStats.pending_maintenance}
            icon={<MaintenanceIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Warranties Expiring"
            value={employeeStats.warranties_expiring}
            icon={<WarningIcon />}
            color="error"
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: '100%', cursor: 'pointer' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Avatar sx={{ backgroundColor: 'primary.main', mr: 2, mt: 0.5 }}>
                  <AddIcon />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    Request New Asset
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Submit request for new equipment
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: '100%', cursor: 'pointer' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Avatar sx={{ backgroundColor: 'error.main', mr: 2, mt: 0.5 }}>
                  <ReportIcon />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    Report Issue
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Report problems with assets
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: '100%', cursor: 'pointer' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Avatar sx={{ backgroundColor: 'success.main', mr: 2, mt: 0.5 }}>
                  <CheckinIcon />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    Check-in Asset
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Return assets no longer needed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: '100%', cursor: 'pointer' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Avatar sx={{ backgroundColor: 'secondary.main', mr: 2, mt: 0.5 }}>
                  <HistoryIcon />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    View My History
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    See complete asset usage history
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* My Assets */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                My Assigned Assets ({myAssets.length})
              </Typography>
              
              <List>
                {myAssets.map((asset, index) => (
                  <Box key={asset.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getCategoryIcon(asset.category || 'other')}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1} justifyContent="space-between">
                            <Typography variant="subtitle1">
                              {asset.manufacturer} {asset.model}
                            </Typography>
                            <Box display="flex" gap={1}>
                              <Chip
                                label={asset.status}
                                size="small"
                                color="success"
                              />
                              {isWarrantyExpiringSoon(asset.warranty_expiry) && (
                                <Chip
                                  label="Warranty Expiring"
                                  size="small"
                                  color="warning"
                                />
                              )}
                            </Box>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Box display="flex" alignItems="center" gap={2} mt={0.5}>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <InventoryIcon fontSize="small" />
                                <Typography variant="caption">
                                  {asset.unique_asset_id}
                                </Typography>
                              </Box>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <LocationIcon fontSize="small" />
                                <Typography variant="caption">
                                  {asset.location}
                                </Typography>
                              </Box>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <DateIcon fontSize="small" />
                                <Typography variant="caption">
                                  Assigned: {asset.assigned_date ? new Date(asset.assigned_date).toLocaleDateString() : 'N/A'}
                                </Typography>
                              </Box>
                            </Box>
                            {asset.warranty_expiry && (
                              <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                                <WarningIcon fontSize="small" />
                                <Typography 
                                  variant="caption"
                                  color={isWarrantyExpiringSoon(asset.warranty_expiry) ? 'error' : 'text.secondary'}
                                >
                                  Warranty expires: {new Date(asset.warranty_expiry).toLocaleDateString()}
                                </Typography>
                              </Box>
                            )}
                            <Box mt={1}>
                              <Typography variant="caption" color="text.secondary">
                                Condition: {asset.condition} | S/N: {asset.serial_number}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                      <Box display="flex" gap={1} ml={2}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<MaintenanceIcon />}
                          onClick={() => handleMaintenanceRequest(asset)}
                        >
                          Report Issue
                        </Button>
                      </Box>
                    </ListItem>
                    {index < myAssets.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Maintenance Requests */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Maintenance Requests
              </Typography>
              
              {maintenanceRequests.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <MaintenanceIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No maintenance requests
                  </Typography>
                </Box>
              ) : (
                <List>
                  {maintenanceRequests.map((request, index) => (
                    <Box key={request.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="subtitle2">
                                {request.asset_name}
                              </Typography>
                              <Chip
                                label={request.priority.toUpperCase()}
                                size="small"
                                color={getPriorityColor(request.priority) as any}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                {request.issue_description}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                <Chip
                                  label={request.status.replace('_', ' ')}
                                  size="small"
                                  color={getStatusColor(request.status) as any}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(request.created_date).toLocaleDateString()}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < maintenanceRequests.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Warranty Alerts */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Warranty Alerts
              </Typography>
              
              {employeeStats.warranties_expiring === 0 ? (
                <Box textAlign="center" py={2}>
                  <CheckIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    All warranties are up to date
                  </Typography>
                </Box>
              ) : (
                <List dense>
                  {myAssets
                    .filter(asset => isWarrantyExpiringSoon(asset.warranty_expiry))
                    .map((asset) => (
                      <ListItem key={asset.id} sx={{ px: 0 }}>
                        <ListItemIcon>
                          <WarningIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${asset.manufacturer} ${asset.model}`}
                          secondary={`Expires: ${new Date(asset.warranty_expiry!).toLocaleDateString()}`}
                        />
                      </ListItem>
                    ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* QR Scanner Dialog - Would be implemented with camera library */}
      <Dialog open={qrScannerOpen} onClose={() => setQrScannerOpen(false)}>
        <DialogTitle>QR Code Scanner</DialogTitle>
        <DialogContent>
          <Typography>QR Scanner would be implemented here with camera access</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrScannerOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Maintenance Request Dialog */}
      <Dialog
        open={requestDialogOpen}
        onClose={() => setRequestDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Report Maintenance Issue
        </DialogTitle>
        <DialogContent>
          {selectedAsset && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Reporting issue for: {selectedAsset.manufacturer} {selectedAsset.model} ({selectedAsset.unique_asset_id})
              </Alert>
              
              <TextField
                fullWidth
                label="Issue Description"
                multiline
                rows={4}
                value={requestForm.issue_description}
                onChange={(e) => setRequestForm(prev => ({ ...prev, issue_description: e.target.value }))}
                margin="normal"
                placeholder="Describe the issue you're experiencing with this asset..."
                required
              />

              <TextField
                fullWidth
                select
                label="Priority"
                value={requestForm.priority}
                onChange={(e) => setRequestForm(prev => ({ ...prev, priority: e.target.value }))}
                margin="normal"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={submitMaintenanceRequest}
            disabled={!requestForm.issue_description.trim()}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;