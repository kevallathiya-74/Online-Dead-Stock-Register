import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Alert,
  Skeleton,
  Badge,
  Avatar,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { toast } from 'react-toastify';
import api from '../../services/api';

interface Approval {
  _id: string;
  request_type: 'Repair' | 'Upgrade' | 'Scrap' | 'New Asset' | 'Other';
  requested_by: {
    _id: string;
    name: string;
    email: string;
    employee_id?: string;
  };
  asset_id?: {
    _id: string;
    name?: string;
    unique_asset_id: string;
  };
  status: 'Pending' | 'Accepted' | 'Rejected';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  request_data: {
    reason: string;
    from_location?: string;
    to_location?: string;
    estimated_cost?: number;
    maintenance_type?: string;
    priority?: string;
    specifications?: string;
  };
  created_at: string;
  approved_at?: string;
  comments?: string;
}

const ApprovalsPage: React.FC = () => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [approvalComments, setApprovalComments] = useState('');

  const fetchApprovals = async () => {
    try {
      setError(null);
      const response = await api.get('/approvals');
      const approvalData = response.data.data || response.data;
      setApprovals(Array.isArray(approvalData) ? approvalData : []);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to load approvals';
      setError(errorMessage);
      if (error.response?.status !== 401) {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchApprovals();

    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(fetchApprovals, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleApproval = async (approvalId: string, action: 'Accepted' | 'Rejected') => {
    try {
      // Call the backend API
      const endpoint = action === 'Accepted' ? 'approve' : 'reject';
      await api.put(`/approvals/${approvalId}/${endpoint}`, {
        comments: approvalComments || `Request ${action.toLowerCase()} by inventory manager`
      });

      // Refresh approvals list to get updated data
      await fetchApprovals();
      
      setViewDialog(false);
      setApprovalComments('');
      toast.success(`Request ${action.toLowerCase()} successfully`);
    } catch (error) { /* Error handled by API interceptor */ }
  };

  const pendingApprovals = approvals.filter(a => a.status === 'Pending');
  const processedApprovals = approvals.filter(a => a.status !== 'Pending');
  
  const currentApprovals = selectedTab === 0 ? pendingApprovals : 
                          selectedTab === 1 ? processedApprovals : approvals;

  const totalPending = pendingApprovals.length;
  const highPriorityPending = pendingApprovals.filter(a => 
    (a.request_data?.priority?.toUpperCase() === 'HIGH' || 
     a.request_data?.priority?.toUpperCase() === 'CRITICAL')
  ).length;
  
  // Calculate average processing time from processed approvals
  const avgProcessingTime = processedApprovals.length > 0 ? 
    processedApprovals.reduce((sum, approval) => {
      if (approval.approved_at) {
        const processingTime = (new Date(approval.approved_at).getTime() - new Date(approval.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return sum + processingTime;
      }
      return sum;
    }, 0) / processedApprovals.length : 0;
  
  const approvalRate = processedApprovals.length > 0 ? 
    (processedApprovals.filter(a => a.status === 'Accepted').length / processedApprovals.length * 100) : 0;

  return (
    <DashboardLayout>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              My Approvals
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Review and manage pending approval requests from your team
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                setLoading(true);
                fetchApprovals();
              }}
              disabled={loading}
            >
              Refresh
            </Button>
            <Badge badgeContent={totalPending} color="error">
              <AssignmentIcon sx={{ fontSize: 40 }} />
            </Badge>
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Pending Approvals
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={60} height={40} />
                    ) : (
                      <Typography variant="h4">{totalPending}</Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'warning.main' }}>
                    <ScheduleIcon />
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
                      High Priority
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={60} height={40} />
                    ) : (
                      <Typography variant="h4">{highPriorityPending}</Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'error.main' }}>
                    <WarningIcon />
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
                      Approval Rate
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={60} height={40} />
                    ) : (
                      <Typography variant="h4">{approvalRate.toFixed(1)}%</Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'success.main' }}>
                    <TrendingIcon />
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
                      Avg. Processing
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={60} height={40} />
                    ) : (
                      <Typography variant="h4">
                        {avgProcessingTime >= 1 
                          ? `${Math.round(avgProcessingTime)}d` 
                          : avgProcessingTime > 0 
                            ? '<1d' 
                            : '0d'}
                      </Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'info.main' }}>
                    <AssignmentIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs and Table */}
        <Card>
          <CardContent>
            <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} sx={{ mb: 2 }}>
              <Tab label={`Pending (${totalPending})`} />
              <Tab label={`Processed (${processedApprovals.length})`} />
              <Tab label={`All (${approvals.length})`} />
            </Tabs>
            
            {loading ? (
              <Box>
                {Array.from({ length: 8 }).map((_, index) => (
                  <Skeleton key={index} height={60} sx={{ mb: 1 }} />
                ))}
              </Box>
            ) : currentApprovals.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No {selectedTab === 0 ? 'pending' : selectedTab === 1 ? 'processed' : ''} approvals found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedTab === 0 ? 'All caught up! No pending approval requests at the moment.' : 
                   'No approval requests have been processed yet.'}
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Request Details</TableCell>
                      <TableCell>Requested By</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Asset</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentApprovals.map((approval) => (
                      <TableRow key={approval._id}>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2">
                              {approval.request_data?.reason || 'No reason provided'}
                            </Typography>
                            {approval.request_data?.estimated_cost && (
                              <Typography variant="caption" color="text.secondary">
                                Est. Cost: ₹{approval.request_data.estimated_cost.toLocaleString('en-IN')}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {approval.requested_by?.name || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {approval.requested_by?.employee_id || approval.requested_by?.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={approval.request_type} 
                            size="small"
                            color={
                              approval.request_type === 'New Asset' ? 'success' :
                              approval.request_type === 'Repair' ? 'warning' :
                              approval.request_type === 'Upgrade' ? 'info' : 
                              approval.request_type === 'Scrap' ? 'error' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {approval.asset_id ? (
                            <>
                              <Typography variant="body2">
                                {approval.asset_id.name || 'Unnamed Asset'}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {approval.asset_id.unique_asset_id}
                              </Typography>
                            </>
                          ) : (
                            <Typography variant="caption" color="textSecondary">
                              N/A
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={approval.request_data?.priority?.toUpperCase() || 'MEDIUM'} 
                            size="small"
                            color={
                              approval.request_data?.priority?.toUpperCase() === 'CRITICAL' ? 'error' :
                              approval.request_data?.priority?.toUpperCase() === 'HIGH' ? 'warning' :
                              approval.request_data?.priority?.toUpperCase() === 'MEDIUM' ? 'info' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={approval.status} 
                            size="small"
                            color={
                              approval.status === 'Accepted' ? 'success' :
                              approval.status === 'Rejected' ? 'error' : 'warning'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(approval.created_at).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => {
                              setSelectedApproval(approval);
                              setViewDialog(true);
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                          {approval.status === 'Pending' && (
                            <>
                              <IconButton 
                                size="small" 
                                color="success"
                                onClick={() => handleApproval(approval._id, 'Accepted')}
                              >
                                <ApproveIcon />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleApproval(approval._id, 'Rejected')}
                              >
                                <RejectIcon />
                              </IconButton>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* View Approval Dialog */}
        <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Approval Request Details</DialogTitle>
          <DialogContent>
            {selectedApproval && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Alert severity="info">
                    Review the request details below and provide your approval decision.
                  </Alert>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Request Type</Typography>
                  <Typography variant="body2">{selectedApproval.request_type.replace('_', ' ')}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Priority</Typography>
                  <Chip 
                    label={(selectedApproval.request_data?.priority || selectedApproval.priority || 'MEDIUM').toUpperCase()} 
                    size="small"
                    color={
                      (selectedApproval.request_data?.priority || selectedApproval.priority || '').toLowerCase() === 'high' || 
                      (selectedApproval.request_data?.priority || selectedApproval.priority || '').toLowerCase() === 'critical'
                        ? 'error'
                        : (selectedApproval.request_data?.priority || selectedApproval.priority || '').toLowerCase() === 'medium'
                        ? 'warning'
                        : 'default'
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Reason</Typography>
                  <Typography variant="body2">{selectedApproval.request_data.reason}</Typography>
                </Grid>
                {selectedApproval.request_data.estimated_cost && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>Estimated Cost</Typography>
                    <Typography variant="body2">₹{selectedApproval.request_data.estimated_cost.toLocaleString()}</Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Approval Comments"
                    multiline
                    rows={3}
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                    placeholder="Add your comments here..."
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialog(false)}>Close</Button>
            {selectedApproval?.status === 'Pending' && (
              <>
                <Button 
                  color="error"
                  onClick={() => handleApproval(selectedApproval._id, 'Rejected')}
                >
                  Reject
                </Button>
                <Button 
                  variant="contained" 
                  color="success"
                  onClick={() => handleApproval(selectedApproval._id, 'Accepted')}
                >
                  Approve
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default ApprovalsPage;