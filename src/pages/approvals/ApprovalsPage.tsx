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
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { toast } from 'react-toastify';

interface Approval {
  _id: string;
  request_type: 'ASSET_TRANSFER' | 'MAINTENANCE' | 'PURCHASE' | 'DISPOSAL';
  requested_by: {
    _id: string;
    name: string;
    email: string;
    employee_id: string;
  };
  asset_id?: {
    _id: string;
    name: string;
    unique_asset_id: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  request_details: {
    reason: string;
    from_location?: string;
    to_location?: string;
    estimated_cost?: number;
    maintenance_type?: string;
  };
  created_at: string;
  approved_at?: string;
  comments?: string;
}

const ApprovalsPage: React.FC = () => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [approvalComments, setApprovalComments] = useState('');

  // Generate dynamic approval data
  const generateApprovalData = (): Approval[] => {
    const requestTypes = ['ASSET_TRANSFER', 'MAINTENANCE', 'PURCHASE', 'DISPOSAL'] as const;
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
    const statuses = ['PENDING', 'APPROVED', 'REJECTED'] as const;
    const names = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown', 'Lisa Davis'];
    const assetNames = ['MacBook Pro', 'Dell Monitor', 'Office Chair', 'Printer HP', 'iPhone 14', 'Surface Pro'];
    
    return Array.from({ length: 25 }, (_, index) => {
      const requestType = requestTypes[index % requestTypes.length];
      const status = index < 15 ? 'PENDING' : statuses[Math.floor(Math.random() * statuses.length)];
      const createdDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      return {
        _id: `approval_${String(index + 1).padStart(3, '0')}`,
        request_type: requestType,
        requested_by: {
          _id: `user_${index + 1}`,
          name: names[index % names.length],
          email: `user${index + 1}@company.com`,
          employee_id: `EMP${String(index + 1).padStart(3, '0')}`
        },
        asset_id: {
          _id: `asset_${index + 1}`,
          name: assetNames[index % assetNames.length],
          unique_asset_id: `AST-${String(index + 1).padStart(4, '0')}`
        },
        status,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        request_details: {
          reason: requestType === 'ASSET_TRANSFER' ? 'Employee relocation to new office' :
                  requestType === 'MAINTENANCE' ? 'Equipment requires regular maintenance' :
                  requestType === 'PURCHASE' ? 'New equipment needed for project' :
                  'Asset reached end of life',
          from_location: requestType === 'ASSET_TRANSFER' ? 'Office Floor 2' : undefined,
          to_location: requestType === 'ASSET_TRANSFER' ? 'Office Floor 5' : undefined,
          estimated_cost: requestType === 'MAINTENANCE' ? Math.floor(Math.random() * 5000) + 1000 :
                         requestType === 'PURCHASE' ? Math.floor(Math.random() * 50000) + 10000 : undefined,
          maintenance_type: requestType === 'MAINTENANCE' ? 'Preventive Maintenance' : undefined
        },
        created_at: createdDate.toISOString(),
        approved_at: status !== 'PENDING' ? new Date(createdDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        comments: status !== 'PENDING' ? 'Request processed as per company policy' : undefined
      };
    });
  };

  useEffect(() => {
    const fetchApprovals = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1200));
        const approvalData = generateApprovalData();
        setApprovals(approvalData);
        toast.success('Approvals loaded successfully');
      } catch (error) {
        toast.error('Failed to load approvals');
      } finally {
        setLoading(false);
      }
    };

    fetchApprovals();
  }, []);

  const handleApproval = async (approvalId: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      setApprovals(prev => prev.map(approval => 
        approval._id === approvalId 
          ? { 
              ...approval, 
              status: action, 
              approved_at: new Date().toISOString(),
              comments: approvalComments || `Request ${action.toLowerCase()} by inventory manager`
            }
          : approval
      ));
      
      setViewDialog(false);
      setApprovalComments('');
      toast.success(`Request ${action.toLowerCase()} successfully`);
    } catch (error) {
      toast.error('Failed to process approval');
    }
  };

  const pendingApprovals = approvals.filter(a => a.status === 'PENDING');
  const processedApprovals = approvals.filter(a => a.status !== 'PENDING');
  
  const currentApprovals = selectedTab === 0 ? pendingApprovals : 
                          selectedTab === 1 ? processedApprovals : approvals;

  const totalPending = pendingApprovals.length;
  const highPriorityPending = pendingApprovals.filter(a => a.priority === 'HIGH' || a.priority === 'CRITICAL').length;
  const avgProcessingTime = 2.3; // days
  const approvalRate = processedApprovals.length > 0 ? 
    (processedApprovals.filter(a => a.status === 'APPROVED').length / processedApprovals.length * 100) : 0;

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
          <Badge badgeContent={totalPending} color="error">
            <AssignmentIcon sx={{ fontSize: 40 }} />
          </Badge>
        </Box>

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
                      <Typography variant="h4">{avgProcessingTime}d</Typography>
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
                              {approval.request_details.reason}
                            </Typography>
                            {approval.request_details.estimated_cost && (
                              <Typography variant="caption" color="textSecondary">
                                Est. Cost: ₹{approval.request_details.estimated_cost.toLocaleString()}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {approval.requested_by.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {approval.requested_by.employee_id}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={approval.request_type.replace('_', ' ')} 
                            size="small"
                            color={
                              approval.request_type === 'ASSET_TRANSFER' ? 'info' :
                              approval.request_type === 'MAINTENANCE' ? 'warning' :
                              approval.request_type === 'PURCHASE' ? 'success' : 'error'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {approval.asset_id?.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {approval.asset_id?.unique_asset_id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={approval.priority} 
                            size="small"
                            color={
                              approval.priority === 'CRITICAL' ? 'error' :
                              approval.priority === 'HIGH' ? 'warning' :
                              approval.priority === 'MEDIUM' ? 'info' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={approval.status} 
                            size="small"
                            color={
                              approval.status === 'APPROVED' ? 'success' :
                              approval.status === 'REJECTED' ? 'error' : 'warning'
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
                          {approval.status === 'PENDING' && (
                            <>
                              <IconButton 
                                size="small" 
                                color="success"
                                onClick={() => handleApproval(approval._id, 'APPROVED')}
                              >
                                <ApproveIcon />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleApproval(approval._id, 'REJECTED')}
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
                  <Chip label={selectedApproval.priority} size="small" />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Reason</Typography>
                  <Typography variant="body2">{selectedApproval.request_details.reason}</Typography>
                </Grid>
                {selectedApproval.request_details.estimated_cost && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>Estimated Cost</Typography>
                    <Typography variant="body2">₹{selectedApproval.request_details.estimated_cost.toLocaleString()}</Typography>
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
            {selectedApproval?.status === 'PENDING' && (
              <>
                <Button 
                  color="error"
                  onClick={() => handleApproval(selectedApproval._id, 'REJECTED')}
                >
                  Reject
                </Button>
                <Button 
                  variant="contained" 
                  color="success"
                  onClick={() => handleApproval(selectedApproval._id, 'APPROVED')}
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