import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Avatar,
  MenuItem,
  Paper,
  ListItemAvatar,
  CircularProgress,
} from '@mui/material';
import {
  Laptop as LaptopIcon,
  Smartphone as PhoneIcon,
  Inventory as InventoryIcon,
  Person as PersonIcon,
  Build as MaintenanceIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Add as AddIcon,
  History as HistoryIcon,
  Help as HelpIcon,
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [requestForm, setRequestForm] = useState({
    issue_description: '',
    priority: 'medium',
  });

  const [myAssets] = useState<Asset[]>([
    {
      id: '1',
      unique_asset_id: 'ASSET-001',
      manufacturer: 'Dell',
      model: 'XPS 15',
      serial_number: 'DLL123456789',
      status: 'Active',
      location: 'IT Department - Floor 2',
      assigned_user: user?.name || 'Current User',
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
      assigned_user: user?.name || 'Current User',
      last_audit_date: '2024-01-01',
      condition: 'Excellent',
      category: 'Mobile',
      assigned_date: '2023-08-20',
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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setLoading(false);
    };
    loadData();
  }, []);

  const employeeStats = {
    total_assets: myAssets.length,
    active_assets: myAssets.filter((a) => a.status === 'Active').length,
    pending_requests: maintenanceRequests.filter((r) => r.status === 'pending').length,
    warranties_expiring: 0,
  };

  const handleMaintenanceRequest = (asset: Asset) => {
    setSelectedAsset(asset);
    setRequestForm({ issue_description: '', priority: 'medium' });
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

    setMaintenanceRequests([...maintenanceRequests, newRequest]);
    setRequestDialogOpen(false);
    toast.success('Maintenance request submitted successfully!');
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'laptop':
        return <LaptopIcon />;
      case 'mobile':
      case 'phone':
        return <PhoneIcon />;
      default:
        return <InventoryIcon />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

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
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Avatar sx={{ backgroundColor: `${color}.main`, height: 56, width: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const QuickActionCard: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  }> = ({ title, description, icon, onClick, color = 'primary' }) => (
    <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={onClick}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <Avatar sx={{ backgroundColor: `${color}.main`, mr: 2, mt: 0.5 }}>
            {icon}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" gutterBottom>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box>
        {/* Header */}
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
            <PersonIcon />
          </Avatar>
          <Box>
            <Typography variant="h4">
              Welcome, {user?.name || user?.full_name || 'Employee'}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your assigned assets and maintenance requests
            </Typography>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={4}>
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
              title="Pending Requests"
              value={employeeStats.pending_requests}
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
          <Grid item xs={12} sm={6} md={3}>
            <QuickActionCard
              title="Request Asset"
              description="Submit request for new equipment"
              icon={<AddIcon />}
              onClick={() => navigate('/employee/requests/new')}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <QuickActionCard
              title="Report Issue"
              description="Report problems with assets"
              icon={<MaintenanceIcon />}
              onClick={() => {
                if (myAssets.length > 0) {
                  handleMaintenanceRequest(myAssets[0]);
                } else {
                  toast.info('No assets available');
                }
              }}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <QuickActionCard
              title="View History"
              description="Track all asset activities"
              icon={<HistoryIcon />}
              onClick={() => navigate('/employee/history')}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <QuickActionCard
              title="Help & Support"
              description="Get help and documentation"
              icon={<HelpIcon />}
              onClick={() => navigate('/employee/help')}
              color="secondary"
            />
          </Grid>
        </Grid>

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* My Assets */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                My Assigned Assets ({myAssets.length})
              </Typography>
              <List>
                {myAssets.map((asset, index) => (
                  <ListItem
                    key={asset.id}
                    divider={index < myAssets.length - 1}
                    secondaryAction={
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<MaintenanceIcon />}
                        onClick={() => handleMaintenanceRequest(asset)}
                      >
                        Report Issue
                      </Button>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {getCategoryIcon(asset.category || 'other')}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1">
                            {asset.manufacturer} {asset.model}
                          </Typography>
                          <Chip label={asset.status} size="small" color="success" />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            ID: {asset.unique_asset_id} | S/N: {asset.serial_number}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Location: {asset.location} | Condition: {asset.condition}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Maintenance Requests */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                My Maintenance Requests
              </Typography>
              {maintenanceRequests.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <MaintenanceIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No maintenance requests yet
                  </Typography>
                </Box>
              ) : (
                <List>
                  {maintenanceRequests.map((request, index) => (
                    <ListItem key={request.id} divider={index < maintenanceRequests.length - 1}>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle2">{request.asset_name}</Typography>
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
                  ))}
                </List>
              )}
              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => navigate('/employee/requests')}
              >
                View All Requests
              </Button>
            </Paper>
          </Grid>
        </Grid>

        {/* Maintenance Request Dialog */}
        <Dialog
          open={requestDialogOpen}
          onClose={() => setRequestDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Report Maintenance Issue</DialogTitle>
          <DialogContent>
            {selectedAsset && (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Reporting issue for: {selectedAsset.manufacturer} {selectedAsset.model} (
                  {selectedAsset.unique_asset_id})
                </Alert>
                <TextField
                  fullWidth
                  label="Issue Description"
                  multiline
                  rows={4}
                  value={requestForm.issue_description}
                  onChange={(e) =>
                    setRequestForm((prev) => ({ ...prev, issue_description: e.target.value }))
                  }
                  margin="normal"
                  placeholder="Describe the issue you're experiencing..."
                  required
                />
                <TextField
                  fullWidth
                  select
                  label="Priority"
                  value={requestForm.priority}
                  onChange={(e) =>
                    setRequestForm((prev) => ({ ...prev, priority: e.target.value }))
                  }
                  margin="normal"
                >
                  <MenuItem value="low">Low - Can wait</MenuItem>
                  <MenuItem value="medium">Medium - Normal priority</MenuItem>
                  <MenuItem value="high">High - Needs attention soon</MenuItem>
                  <MenuItem value="critical">Critical - Urgent</MenuItem>
                </TextField>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRequestDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={submitMaintenanceRequest}
              disabled={!requestForm.issue_description.trim()}
            >
              Submit Request
            </Button>
          </DialogActions>
        </Dialog>

        {/* Documents Panel - Embedded for quick access */}
        <Box sx={{ mt: 4 }}>
          <Suspense fallback={<CircularProgress />}>
            {(() => {
              const Documents = lazy(() => import('../documents/Documents'));
              return <Documents embedded />;
            })()}
          </Suspense>
        </Box>
      </Box>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;
