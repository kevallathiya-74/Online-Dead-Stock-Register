import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  MenuItem,
  Tabs,
  Tab,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Build as MaintenanceIcon,
  PriorityHigh as PriorityIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/Layout';

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

const RequestsPage = () => {
  const location = useLocation();
  const [tabValue, setTabValue] = useState(0);
  const [newRequestDialogOpen, setNewRequestDialogOpen] = useState(false);
  const [maintenanceRequestDialogOpen, setMaintenanceRequestDialogOpen] = useState(false);
  
  // Form states
  const [newAssetRequest, setNewAssetRequest] = useState({
    category: '',
    description: '',
    justification: '',
    priority: 'medium',
    urgency: 'normal',
  });

  const [maintenanceRequest, setMaintenanceRequest] = useState({
    asset_id: '',
    issue_description: '',
    priority: 'medium',
    urgency: 'normal',
    category: 'hardware',
  });

  // Sample data
  const [assetRequests] = useState([
    {
      id: '1',
      type: 'new_asset',
      category: 'Laptop',
      description: 'MacBook Pro for development work',
      justification: 'Current laptop is outdated and affecting productivity',
      priority: 'high',
      status: 'pending',
      submitted_date: '2024-01-15',
      updated_date: '2024-01-15',
      estimated_cost: 2500,
      expected_delivery: '2024-02-15',
    },
    {
      id: '2',
      type: 'new_asset',
      category: 'Monitor',
      description: '4K Monitor for design work',
      justification: 'Need larger screen for UI/UX design tasks',
      priority: 'medium',
      status: 'approved',
      submitted_date: '2024-01-10',
      updated_date: '2024-01-12',
      estimated_cost: 500,
      expected_delivery: '2024-01-25',
      approval_notes: 'Approved by IT Manager. Ordered from preferred vendor.',
    },
    {
      id: '3',
      type: 'new_asset',
      category: 'Accessories',
      description: 'Wireless keyboard and mouse',
      justification: 'Ergonomic improvement for workstation',
      priority: 'low',
      status: 'rejected',
      submitted_date: '2024-01-05',
      updated_date: '2024-01-08',
      estimated_cost: 150,
      rejection_reason: 'Budget constraints for current quarter.',
    },
  ]);

  const [maintenanceRequests] = useState([
    {
      id: '1',
      asset_id: 'ASSET-001',
      asset_name: 'Dell XPS 15',
      issue_description: 'Battery not holding charge properly',
      priority: 'medium',
      status: 'in_progress',
      submitted_date: '2024-01-10',
      updated_date: '2024-01-12',
      assigned_technician: 'John Tech',
      category: 'hardware',
      estimated_completion: '2024-01-20',
    },
    {
      id: '2',
      asset_id: 'ASSET-005',
      asset_name: 'Apple iPhone 14',
      issue_description: 'Screen flickering issue',
      priority: 'high',
      status: 'pending',
      submitted_date: '2024-01-14',
      updated_date: '2024-01-14',
      category: 'hardware',
    },
    {
      id: '3',
      asset_id: 'ASSET-012',
      asset_name: 'HP Monitor 24"',
      issue_description: 'Display color calibration needed',
      priority: 'low',
      status: 'completed',
      submitted_date: '2024-01-08',
      updated_date: '2024-01-10',
      assigned_technician: 'Jane Tech',
      category: 'software',
      completion_notes: 'Color profile updated and calibrated successfully.',
    },
  ]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'in_progress': return 'info';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <PendingIcon />;
      case 'approved': return <CheckIcon />;
      case 'rejected': return <CancelIcon />;
      case 'in_progress': return <ScheduleIcon />;
      case 'completed': return <CheckIcon />;
      default: return <PendingIcon />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const handleSubmitNewAssetRequest = () => {
    if (!newAssetRequest.category || !newAssetRequest.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    toast.success('Asset request submitted successfully!');
    setNewRequestDialogOpen(false);
    setNewAssetRequest({
      category: '',
      description: '',
      justification: '',
      priority: 'medium',
      urgency: 'normal',
    });
  };

  const handleSubmitMaintenanceRequest = () => {
    if (!maintenanceRequest.asset_id || !maintenanceRequest.issue_description) {
      toast.error('Please fill in all required fields');
      return;
    }

    toast.success('Maintenance request submitted successfully!');
    setMaintenanceRequestDialogOpen(false);
    setMaintenanceRequest({
      asset_id: '',
      issue_description: '',
      priority: 'medium',
      urgency: 'normal',
      category: 'hardware',
    });
  };

  // Check if we were passed an asset from another page
  React.useEffect(() => {
    if (location.state?.asset) {
      setMaintenanceRequest(prev => ({
        ...prev,
        asset_id: location.state.asset.unique_asset_id,
      }));
      setMaintenanceRequestDialogOpen(true);
    }
  }, [location.state]);

  return (
    <DashboardLayout title="My Requests">
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            My Requests
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Submit and track your asset and maintenance requests
          </Typography>
        </Box>

        {/* Quick Actions */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => setNewRequestDialogOpen(true)}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <AddIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">Request New Asset</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Submit a request for new equipment
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => setMaintenanceRequestDialogOpen(true)}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                    <MaintenanceIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">Report Maintenance Issue</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Report problems with your assets
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label={`Asset Requests (${assetRequests.length})`} />
            <Tab label={`Maintenance Requests (${maintenanceRequests.length})`} />
          </Tabs>
        </Box>

        {/* Asset Requests Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {assetRequests.map((request) => (
              <Grid item xs={12} key={request.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {request.category} Request
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {request.description}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                          label={request.priority}
                          color={getPriorityColor(request.priority) as any}
                          size="small"
                          icon={<PriorityIcon />}
                        />
                        <Chip
                          label={request.status}
                          color={getStatusColor(request.status) as any}
                          size="small"
                          icon={getStatusIcon(request.status)}
                        />
                      </Box>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Justification:</strong> {request.justification}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Submitted:</strong> {new Date(request.submitted_date).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Updated:</strong> {new Date(request.updated_date).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Estimated Cost:</strong> ${request.estimated_cost?.toLocaleString()}
                        </Typography>
                        {request.expected_delivery && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Expected Delivery:</strong> {new Date(request.expected_delivery).toLocaleDateString()}
                          </Typography>
                        )}
                        {request.approval_notes && (
                          <Typography variant="body2" color="success.main">
                            <strong>Notes:</strong> {request.approval_notes}
                          </Typography>
                        )}
                        {request.rejection_reason && (
                          <Typography variant="body2" color="error.main">
                            <strong>Rejection Reason:</strong> {request.rejection_reason}
                          </Typography>
                        )}
                      </Grid>
                    </Grid>

                    {request.status === 'pending' && (
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => toast.info('Edit request functionality coming soon!')}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => toast.info('Cancel request functionality coming soon!')}
                        >
                          Cancel
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Maintenance Requests Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {maintenanceRequests.map((request) => (
              <Grid item xs={12} key={request.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {request.asset_name} ({request.asset_id})
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {request.issue_description}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                          label={request.priority}
                          color={getPriorityColor(request.priority) as any}
                          size="small"
                          icon={<PriorityIcon />}
                        />
                        <Chip
                          label={request.status}
                          color={getStatusColor(request.status) as any}
                          size="small"
                          icon={getStatusIcon(request.status)}
                        />
                      </Box>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Category:</strong> {request.category}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Submitted:</strong> {new Date(request.submitted_date).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Updated:</strong> {new Date(request.updated_date).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        {request.assigned_technician && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Assigned to:</strong> {request.assigned_technician}
                          </Typography>
                        )}
                        {request.estimated_completion && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Est. Completion:</strong> {new Date(request.estimated_completion).toLocaleDateString()}
                          </Typography>
                        )}
                        {request.completion_notes && (
                          <Typography variant="body2" color="success.main">
                            <strong>Completion Notes:</strong> {request.completion_notes}
                          </Typography>
                        )}
                      </Grid>
                    </Grid>

                    {request.status === 'in_progress' && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Request in progress...
                        </Typography>
                        <LinearProgress />
                      </Box>
                    )}

                    {request.status === 'pending' && (
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => toast.info('Edit request functionality coming soon!')}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => toast.info('Cancel request functionality coming soon!')}
                        >
                          Cancel
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* New Asset Request Dialog */}
        <Dialog
          open={newRequestDialogOpen}
          onClose={() => setNewRequestDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Request New Asset</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Asset Category"
                    value={newAssetRequest.category}
                    onChange={(e) => setNewAssetRequest({ ...newAssetRequest, category: e.target.value })}
                    required
                  >
                    <MenuItem value="Laptop">Laptop</MenuItem>
                    <MenuItem value="Desktop">Desktop</MenuItem>
                    <MenuItem value="Monitor">Monitor</MenuItem>
                    <MenuItem value="Mobile">Mobile Device</MenuItem>
                    <MenuItem value="Tablet">Tablet</MenuItem>
                    <MenuItem value="Printer">Printer</MenuItem>
                    <MenuItem value="Accessories">Accessories</MenuItem>
                    <MenuItem value="Software">Software</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Priority"
                    value={newAssetRequest.priority}
                    onChange={(e) => setNewAssetRequest({ ...newAssetRequest, priority: e.target.value })}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={newAssetRequest.description}
                    onChange={(e) => setNewAssetRequest({ ...newAssetRequest, description: e.target.value })}
                    multiline
                    rows={3}
                    required
                    placeholder="Describe the asset you need..."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Business Justification"
                    value={newAssetRequest.justification}
                    onChange={(e) => setNewAssetRequest({ ...newAssetRequest, justification: e.target.value })}
                    multiline
                    rows={3}
                    placeholder="Explain why this asset is needed for your work..."
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNewRequestDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmitNewAssetRequest}
            >
              Submit Request
            </Button>
          </DialogActions>
        </Dialog>

        {/* Maintenance Request Dialog */}
        <Dialog
          open={maintenanceRequestDialogOpen}
          onClose={() => setMaintenanceRequestDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Report Maintenance Issue</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Asset ID"
                    value={maintenanceRequest.asset_id}
                    onChange={(e) => setMaintenanceRequest({ ...maintenanceRequest, asset_id: e.target.value })}
                    required
                    placeholder="e.g., ASSET-001"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Issue Category"
                    value={maintenanceRequest.category}
                    onChange={(e) => setMaintenanceRequest({ ...maintenanceRequest, category: e.target.value })}
                  >
                    <MenuItem value="hardware">Hardware</MenuItem>
                    <MenuItem value="software">Software</MenuItem>
                    <MenuItem value="network">Network</MenuItem>
                    <MenuItem value="performance">Performance</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Priority"
                    value={maintenanceRequest.priority}
                    onChange={(e) => setMaintenanceRequest({ ...maintenanceRequest, priority: e.target.value })}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Urgency"
                    value={maintenanceRequest.urgency}
                    onChange={(e) => setMaintenanceRequest({ ...maintenanceRequest, urgency: e.target.value })}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="normal">Normal</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="emergency">Emergency</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Issue Description"
                    value={maintenanceRequest.issue_description}
                    onChange={(e) => setMaintenanceRequest({ ...maintenanceRequest, issue_description: e.target.value })}
                    multiline
                    rows={4}
                    required
                    placeholder="Describe the issue in detail..."
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMaintenanceRequestDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmitMaintenanceRequest}
            >
              Submit Request
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default RequestsPage;