import React, { useState, useEffect } from 'react';
import { addDays } from 'date-fns';
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
  Tabs,
  Tab,
  Alert,
  ButtonGroup,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  SwapHoriz as TransactionIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Pending as PendingIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Computer as AssetIcon,
  TrendingUp as TrendingUpIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AdminDataService, { AdminTransaction } from '../../data/adminDataService';

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
      id={`transaction-tabpanel-${index}`}
      aria-labelledby={`transaction-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdminTransactionPage: React.FC = () => {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<AdminTransaction | null>(null);
  const [viewTransactionDialogOpen, setViewTransactionDialogOpen] = useState(false);
  const [addTransactionDialogOpen, setAddTransactionDialogOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    type: '',
    asset_id: '',
    assigned_user: '',
    assigned_department: '',
    priority: 'Medium',
    description: '',
    notes: ''
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const transactionData = AdminDataService.getTransactions();
      setTransactions(transactionData);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionsForTab = (tabIndex: number) => {
    switch (tabIndex) {
      case 0: // All
        return transactions;
      case 1: // Pending
        return transactions.filter(t => t.status === 'Pending');
      case 2: // Approved
        return transactions.filter(t => t.status === 'Approved');
      case 3: // Completed
        return transactions.filter(t => t.status === 'Completed');
      case 4: // Rejected
        return transactions.filter(t => t.status === 'Rejected');
      default:
        return transactions;
    }
  };

  const filteredTransactions = getTransactionsForTab(tabValue).filter((transaction) => {
    const matchesSearch = 
      transaction.asset.unique_asset_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.asset.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.asset.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.from_user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.to_user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || '';
    
    const matchesStatus = selectedStatus === 'all' || transaction.status === selectedStatus;
    const matchesType = selectedType === 'all' || transaction.transaction_type === selectedType;
    const matchesPriority = selectedPriority === 'all' || transaction.priority === selectedPriority;
    
    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  const paginatedTransactions = filteredTransactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleApproveTransaction = (transactionId: string) => {
    setTransactions(prev => 
      prev.map(txn => 
        txn.id === transactionId 
          ? { ...txn, status: 'Approved', approved_by: { name: 'Current Admin' } as any }
          : txn
      )
    );
    toast.success('Transaction approved');
  };

  const handleRejectTransaction = (transactionId: string) => {
    setTransactions(prev => 
      prev.map(txn => 
        txn.id === transactionId 
          ? { ...txn, status: 'Rejected' }
          : txn
      )
    );
    toast.success('Transaction rejected');
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.type || !newTransaction.asset_id || !newTransaction.assigned_user) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const transaction: AdminTransaction = {
        id: `txn_${Date.now()}`,
        transaction_type: newTransaction.type as AdminTransaction['transaction_type'],
        asset: {
          id: newTransaction.asset_id,
          unique_asset_id: `AST-${String(Math.floor(Math.random() * 10000) + 10000).padStart(5, '0')}`,
          manufacturer: 'Generic',
          model: 'Model-X',
          serial_number: 'SN-' + Date.now(),
          asset_type: 'Laptop',
          location: 'Office',
          status: 'Active' as const,
          purchase_date: new Date().toISOString(),
          purchase_cost: 1200,
          warranty_expiry: addDays(new Date(), 365).toISOString(),
          last_audit_date: new Date().toISOString(),
          condition: 'Good',
          expected_lifespan: 3
        },
        to_user: {
          id: 'user_001',
          name: newTransaction.assigned_user,
          email: `${newTransaction.assigned_user.toLowerCase().replace(' ', '.')}@company.com`,
          role: 'Employee' as const,
          department: newTransaction.assigned_department || 'IT',
          employee_id: 'EMP-001',
          is_active: true,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          permissions: ['read']
        },
        quantity: 1,
        status: 'Pending',
        priority: newTransaction.priority as 'Low' | 'Medium' | 'High' | 'Critical',
        transaction_date: new Date().toISOString(),
        notes: `${newTransaction.description}. ${newTransaction.notes}`.trim()
      };

      setTransactions(prev => [transaction, ...prev]);
      setAddTransactionDialogOpen(false);
      setNewTransaction({
        type: '',
        asset_id: '',
        assigned_user: '',
        assigned_department: '',
        priority: 'Medium',
        description: '',
        notes: ''
      });
      toast.success('Transaction created successfully');
    } catch (error) {
      toast.error('Failed to create transaction');
    }
  };

  const handleCompleteTransaction = (transactionId: string) => {
    setTransactions(prev => 
      prev.map(txn => 
        txn.id === transactionId 
          ? { ...txn, status: 'Completed' }
          : txn
      )
    );
    toast.success('Transaction completed');
  };

  const handleBulkAction = (action: string) => {
    
    switch (action) {
      case 'approve':
        setTransactions(prev => 
          prev.map(txn => 
            bulkSelected.includes(txn.id) 
              ? { ...txn, status: 'Approved', approved_by: { name: 'Current Admin' } as any }
              : txn
          )
        );
        toast.success(`${bulkSelected.length} transactions approved`);
        break;
      case 'reject':
        setTransactions(prev => 
          prev.map(txn => 
            bulkSelected.includes(txn.id) 
              ? { ...txn, status: 'Rejected' }
              : txn
          )
        );
        toast.success(`${bulkSelected.length} transactions rejected`);
        break;
      case 'complete':
        setTransactions(prev => 
          prev.map(txn => 
            bulkSelected.includes(txn.id) 
              ? { ...txn, status: 'Completed' }
              : txn
          )
        );
        toast.success(`${bulkSelected.length} transactions completed`);
        break;
      case 'export':
        toast.info(`Exporting ${bulkSelected.length} transactions`);
        break;
      case 'delete':
        if (window.confirm(`Are you sure you want to delete ${bulkSelected.length} transactions?`)) {
          setTransactions(prev => prev.filter(txn => !bulkSelected.includes(txn.id)));
          toast.success(`${bulkSelected.length} transactions deleted`);
        }
        break;
    }
    setBulkSelected([]);
    setActionMenuAnchor(null);
  };

  const getStatusColor = (status: AdminTransaction['status']) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Approved':
        return 'info';
      case 'Completed':
        return 'success';
      case 'Rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: AdminTransaction['priority']) => {
    switch (priority) {
      case 'Critical':
        return 'error';
      case 'High':
        return 'warning';
      case 'Medium':
        return 'info';
      case 'Low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: AdminTransaction['status']) => {
    switch (status) {
      case 'Pending':
        return <PendingIcon />;
      case 'Approved':
        return <ApproveIcon />;
      case 'Completed':
        return <ApproveIcon />;
      case 'Rejected':
        return <RejectIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const stats = AdminDataService.getTransactionStatistics();
  const transactionTypes = ['Asset Assignment', 'Asset Transfer', 'Check-out', 'Check-in', 'Maintenance', 'Return'];
  const priorities = ['Low', 'Medium', 'High', 'Critical'];
  const statuses = ['Pending', 'Approved', 'Completed', 'Rejected'];

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
              Transaction Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Monitor and manage all asset transactions and approvals
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadTransactions}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddTransactionDialogOpen(true)}
            >
              New Transaction
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
                      Total Transactions
                    </Typography>
                    <Typography variant="h4">{stats.total}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {stats.recentTransactions} this week
                    </Typography>
                  </Box>
                  <TransactionIcon sx={{ fontSize: 40, opacity: 0.8 }} />
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
                      Pending Approval
                    </Typography>
                    <Typography variant="h4">{stats.pending}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Requires attention
                    </Typography>
                  </Box>
                  <PendingIcon sx={{ fontSize: 40, opacity: 0.8 }} />
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
                      Approved
                    </Typography>
                    <Typography variant="h4">{stats.approved}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Ready for processing
                    </Typography>
                  </Box>
                  <ApproveIcon sx={{ fontSize: 40, opacity: 0.8 }} />
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
                      Completed
                    </Typography>
                    <Typography variant="h4">{stats.completed}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Successfully processed
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Transaction Tabs */}
        <Card sx={{ mb: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab label={
                <Badge badgeContent={transactions.length} color="primary" max={999}>
                  All Transactions
                </Badge>
              } />
              <Tab label={
                <Badge badgeContent={transactions.filter(t => t.status === 'Pending').length} color="warning" max={999}>
                  Pending
                </Badge>
              } />
              <Tab label={
                <Badge badgeContent={transactions.filter(t => t.status === 'Approved').length} color="info" max={999}>
                  Approved
                </Badge>
              } />
              <Tab label={
                <Badge badgeContent={transactions.filter(t => t.status === 'Completed').length} color="success" max={999}>
                  Completed
                </Badge>
              } />
              <Tab label={
                <Badge badgeContent={transactions.filter(t => t.status === 'Rejected').length} color="error" max={999}>
                  Rejected
                </Badge>
              } />
            </Tabs>
          </Box>

          {/* Filters */}
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  placeholder="Search transactions..."
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
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={selectedType}
                    label="Type"
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    {transactionTypes.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={selectedPriority}
                    label="Priority"
                    onChange={(e) => setSelectedPriority(e.target.value)}
                  >
                    <MenuItem value="all">All Priorities</MenuItem>
                    {priorities.map(priority => (
                      <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    {filteredTransactions.length} transactions
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

        {/* Transaction Table */}
        <TabPanel value={tabValue} index={tabValue}>
          <Card>
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={bulkSelected.length > 0 && bulkSelected.length < filteredTransactions.length}
                          checked={filteredTransactions.length > 0 && bulkSelected.length === filteredTransactions.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBulkSelected(filteredTransactions.map(t => t.id));
                            } else {
                              setBulkSelected([]);
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>Transaction Details</TableCell>
                      <TableCell>Asset Information</TableCell>
                      <TableCell>Participants</TableCell>
                      <TableCell>Status & Priority</TableCell>
                      <TableCell>Timeline</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedTransactions.map((transaction) => (
                      <TableRow 
                        key={transaction.id}
                        selected={bulkSelected.includes(transaction.id)}
                        hover
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={bulkSelected.includes(transaction.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBulkSelected(prev => [...prev, transaction.id]);
                              } else {
                                setBulkSelected(prev => prev.filter(id => id !== transaction.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                              <TransactionIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {transaction.transaction_type}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {transaction.id}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Qty: {transaction.quantity}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium" display="flex" alignItems="center" gap={0.5}>
                              <AssetIcon fontSize="small" />
                              {transaction.asset.unique_asset_id}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {transaction.asset.manufacturer} {transaction.asset.model}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                              <LocationIcon fontSize="inherit" />
                              {transaction.from_location || transaction.asset.location} → {transaction.to_location || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            {transaction.from_user && (
                              <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                <PersonIcon fontSize="small" />
                                From: {transaction.from_user.name}
                              </Typography>
                            )}
                            {transaction.to_user && (
                              <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                <PersonIcon fontSize="small" />
                                To: {transaction.to_user.name}
                              </Typography>
                            )}
                            {transaction.approved_by && (
                              <Typography variant="caption" color="text.secondary">
                                Approved by: {transaction.approved_by.name}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Chip
                              icon={getStatusIcon(transaction.status)}
                              label={transaction.status}
                              color={getStatusColor(transaction.status) as any}
                              size="small"
                              sx={{ mb: 1 }}
                            />
                            <Box>
                              <Chip
                                label={transaction.priority}
                                color={getPriorityColor(transaction.priority) as any}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" display="flex" alignItems="center" gap={0.5}>
                              <ScheduleIcon fontSize="small" />
                              {new Date(transaction.transaction_date).toLocaleDateString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(transaction.transaction_date).toLocaleTimeString()}
                            </Typography>
                            {transaction.estimated_completion && (
                              <Typography variant="caption" color="text.secondary">
                                Est. completion: {new Date(transaction.estimated_completion).toLocaleDateString()}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                            <Tooltip title="View Details">
                              <IconButton 
                                size="small" 
                                color="info"
                                onClick={() => {
                                  setSelectedTransaction(transaction);
                                  setViewTransactionDialogOpen(true);
                                }}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            {transaction.status === 'Pending' && (
                              <>
                                <Tooltip title="Approve">
                                  <IconButton 
                                    size="small" 
                                    color="success"
                                    onClick={() => handleApproveTransaction(transaction.id)}
                                  >
                                    <ApproveIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={() => handleRejectTransaction(transaction.id)}
                                  >
                                    <RejectIcon />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            {transaction.status === 'Approved' && (
                              <Tooltip title="Mark Complete">
                                <IconButton 
                                  size="small" 
                                  color="success"
                                  onClick={() => handleCompleteTransaction(transaction.id)}
                                >
                                  <ApproveIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Edit">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => toast.info(`Edit functionality for transaction ${transaction.id} coming soon`)}
                              >
                                <EditIcon />
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
                count={filteredTransactions.length}
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
        </TabPanel>

        {/* Bulk Actions Menu */}
        <Menu
          anchorEl={actionMenuAnchor}
          open={Boolean(actionMenuAnchor)}
          onClose={() => setActionMenuAnchor(null)}
        >
          <MenuItemComp onClick={() => handleBulkAction('approve')}>
            <ListItemIcon>
              <ApproveIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>Approve Selected</ListItemText>
          </MenuItemComp>
          <MenuItemComp onClick={() => handleBulkAction('reject')}>
            <ListItemIcon>
              <RejectIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Reject Selected</ListItemText>
          </MenuItemComp>
          <MenuItemComp onClick={() => handleBulkAction('complete')}>
            <ListItemIcon>
              <ApproveIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>Mark Complete</ListItemText>
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

        {/* View Transaction Dialog */}
        <Dialog open={viewTransactionDialogOpen} onClose={() => setViewTransactionDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Transaction Details - {selectedTransaction?.id}
          </DialogTitle>
          <DialogContent>
            {selectedTransaction && (
              <Grid container spacing={3} sx={{ mt: 0.5 }}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Transaction Information</Typography>
                      <Typography><strong>Type:</strong> {selectedTransaction.transaction_type}</Typography>
                      <Typography><strong>Status:</strong> 
                        <Chip 
                          label={selectedTransaction.status} 
                          color={getStatusColor(selectedTransaction.status) as any} 
                          size="small" 
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                      <Typography sx={{ mt: 1 }}><strong>Priority:</strong> 
                        <Chip 
                          label={selectedTransaction.priority} 
                          color={getPriorityColor(selectedTransaction.priority) as any} 
                          size="small" 
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                      <Typography><strong>Quantity:</strong> {selectedTransaction.quantity}</Typography>
                      <Typography><strong>Date:</strong> {new Date(selectedTransaction.transaction_date).toLocaleString()}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Asset Details</Typography>
                      <Typography><strong>Asset ID:</strong> {selectedTransaction.asset.unique_asset_id}</Typography>
                      <Typography><strong>Manufacturer:</strong> {selectedTransaction.asset.manufacturer}</Typography>
                      <Typography><strong>Model:</strong> {selectedTransaction.asset.model}</Typography>
                      <Typography><strong>Serial Number:</strong> {selectedTransaction.asset.serial_number}</Typography>
                      <Typography><strong>Current Location:</strong> {selectedTransaction.asset.location}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Participants</Typography>
                      {selectedTransaction.from_user && (
                        <Typography><strong>From User:</strong> {selectedTransaction.from_user.name}</Typography>
                      )}
                      {selectedTransaction.to_user && (
                        <Typography><strong>To User:</strong> {selectedTransaction.to_user.name}</Typography>
                      )}
                      {selectedTransaction.approved_by && (
                        <Typography><strong>Approved By:</strong> {selectedTransaction.approved_by.name}</Typography>
                      )}
                      {selectedTransaction.from_location && (
                        <Typography><strong>From Location:</strong> {selectedTransaction.from_location}</Typography>
                      )}
                      {selectedTransaction.to_location && (
                        <Typography><strong>To Location:</strong> {selectedTransaction.to_location}</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Additional Information</Typography>
                      {selectedTransaction.notes && (
                        <Typography><strong>Notes:</strong> {selectedTransaction.notes}</Typography>
                      )}
                      {selectedTransaction.estimated_completion && (
                        <Typography><strong>Estimated Completion:</strong> {new Date(selectedTransaction.estimated_completion).toLocaleDateString()}</Typography>
                      )}
                      <Typography><strong>Created:</strong> {new Date(selectedTransaction.transaction_date).toLocaleString()}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                {selectedTransaction.status === 'Pending' && (
                  <Grid item xs={12}>
                    <Alert severity="info">
                      This transaction is pending approval. Use the action buttons to approve or reject it.
                    </Alert>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewTransactionDialogOpen(false)}>
              Close
            </Button>
            {selectedTransaction?.status === 'Pending' && (
              <ButtonGroup>
                <Button 
                  variant="contained" 
                  color="error"
                  onClick={() => {
                    if (selectedTransaction) {
                      handleRejectTransaction(selectedTransaction.id);
                      setViewTransactionDialogOpen(false);
                    }
                  }}
                >
                  Reject
                </Button>
                <Button 
                  variant="contained" 
                  color="success"
                  onClick={() => {
                    if (selectedTransaction) {
                      handleApproveTransaction(selectedTransaction.id);
                      setViewTransactionDialogOpen(false);
                    }
                  }}
                >
                  Approve
                </Button>
              </ButtonGroup>
            )}
            {selectedTransaction?.status === 'Approved' && (
              <Button 
                variant="contained" 
                color="success"
                onClick={() => {
                  if (selectedTransaction) {
                    handleCompleteTransaction(selectedTransaction.id);
                    setViewTransactionDialogOpen(false);
                  }
                }}
              >
                Mark Complete
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Add Transaction Dialog */}
        <Dialog open={addTransactionDialogOpen} onClose={() => setAddTransactionDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Create New Transaction
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Transaction Type</InputLabel>
                    <Select
                      value={newTransaction.type}
                      label="Transaction Type"
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <MenuItem value="Asset Assignment">Asset Assignment</MenuItem>
                      <MenuItem value="Asset Transfer">Asset Transfer</MenuItem>
                      <MenuItem value="Maintenance">Maintenance</MenuItem>
                      <MenuItem value="Check-out">Check-out</MenuItem>
                      <MenuItem value="Check-in">Check-in</MenuItem>
                      <MenuItem value="Return">Return</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Asset ID"
                    value={newTransaction.asset_id}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, asset_id: e.target.value }))}
                    placeholder="e.g., AST-10001"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Assigned User"
                    value={newTransaction.assigned_user}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, assigned_user: e.target.value }))}
                    placeholder="Full name of user"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Department</InputLabel>
                    <Select
                      value={newTransaction.assigned_department}
                      label="Department"
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, assigned_department: e.target.value }))}
                    >
                      <MenuItem value="IT">IT</MenuItem>
                      <MenuItem value="HR">HR</MenuItem>
                      <MenuItem value="Finance">Finance</MenuItem>
                      <MenuItem value="Marketing">Marketing</MenuItem>
                      <MenuItem value="Operations">Operations</MenuItem>
                      <MenuItem value="Legal">Legal</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={newTransaction.priority}
                      label="Priority"
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, priority: e.target.value }))}
                    >
                      <MenuItem value="Low">Low</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="High">High</MenuItem>
                      <MenuItem value="Critical">Critical</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the transaction purpose and details"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Notes (Optional)"
                    value={newTransaction.notes}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes or special instructions"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddTransactionDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddTransaction} 
              variant="contained"
              startIcon={<AddIcon />}
            >
              Create Transaction
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default AdminTransactionPage;