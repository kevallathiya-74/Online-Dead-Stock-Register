import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  AccountBalance as BudgetIcon,
  ShoppingCart as SpendIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import api from '../../services/api';

interface BudgetCategory {
  id: string;
  name: string;
  allocatedAmount: number;
  spentAmount: number;
  committedAmount: number;
  availableAmount: number;
  utilizationPercentage: number;
  department: string;
  fiscalYear: string;
  status: 'On Track' | 'Over Budget' | 'Nearly Exceeded' | 'Under Utilized';
}

interface BudgetTransaction {
  id: string;
  date: string;
  description: string;
  category: string;
  department: string;
  amount: number;
  type: 'Allocation' | 'Expense' | 'Commitment' | 'Adjustment';
  status: 'Approved' | 'Pending' | 'Rejected';
  referenceNumber: string;
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
      id={`budget-tabpanel-${index}`}
      aria-labelledby={`budget-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const BudgetTrackingPage = () => {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [transactions, setTransactions] = useState<BudgetTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBudgetData();
  }, []);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      
      const [categoriesResponse, transactionsResponse] = await Promise.all([
        api.get('/purchase-management/budget-categories'),
        api.get('/purchase-management/budget-transactions')
      ]);
      
      const categories = categoriesResponse.data.data || categoriesResponse.data;
      const transactions = transactionsResponse.data.data || transactionsResponse.data;
      
      setCategories(categories);
      setTransactions(transactions);
    } catch (error) { /* Error handled by API interceptor */ } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Track':
        return 'success';
      case 'Over Budget':
        return 'error';
      case 'Nearly Exceeded':
        return 'warning';
      case 'Under Utilized':
        return 'info';
      default:
        return 'default';
    }
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage > 100) return 'error';
    if (percentage > 90) return 'warning';
    if (percentage < 50) return 'info';
    return 'success';
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'Allocation':
        return 'primary';
      case 'Expense':
        return 'error';
      case 'Commitment':
        return 'warning';
      case 'Adjustment':
        return 'info';
      default:
        return 'default';
    }
  };

  const filteredCategories = categories.filter((category) => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === 'All' || category.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === 'All' || transaction.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const totalAllocated = categories.reduce((sum, cat) => sum + cat.allocatedAmount, 0);
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
  const totalCommitted = categories.reduce((sum, cat) => sum + cat.committedAmount, 0);
  const totalAvailable = categories.reduce((sum, cat) => sum + cat.availableAmount, 0);
  const overBudgetCount = categories.filter(cat => cat.status === 'Over Budget').length;
  const nearlyExceededCount = categories.filter(cat => cat.status === 'Nearly Exceeded').length;

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Budget Tracking
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => toast.info('Budget report download started')}
            >
              Export Report
            </Button>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Allocated
                    </Typography>
                    <Typography variant="h4">
                      ₹{Number(totalAllocated || 0).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                  <BudgetIcon color="primary" sx={{ fontSize: { xs: 32, sm: 40 } }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Spent
                    </Typography>
                    <Typography variant="h4" color="error.main">
                      ₹{Number(totalSpent || 0).toLocaleString('en-IN')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {((totalSpent / totalAllocated) * 100).toFixed(1)}% utilized
                    </Typography>
                  </Box>
                  <SpendIcon color="error" sx={{ fontSize: { xs: 32, sm: 40 } }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Committed
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      ₹{Number(totalCommitted || 0).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                  <CheckCircleIcon color="warning" sx={{ fontSize: { xs: 32, sm: 40 } }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Available
                    </Typography>
                    <Typography 
                      variant="h4" 
                      color={totalAvailable < 0 ? 'error.main' : 'success.main'}
                    >
                      ₹{Number(Math.abs(totalAvailable) || 0).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                  {totalAvailable >= 0 ? (
                    <TrendingUpIcon color="success" sx={{ fontSize: { xs: 32, sm: 40 } }} />
                  ) : (
                    <TrendingDownIcon color="error" sx={{ fontSize: { xs: 32, sm: 40 } }} />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Alerts */}
        {overBudgetCount > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle1">
              {overBudgetCount} budget categories are over budget. Immediate attention required.
            </Typography>
          </Alert>
        )}
        
        {nearlyExceededCount > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle1">
              {nearlyExceededCount} budget categories are nearly exceeded ({'>'}90% utilized).
            </Typography>
          </Alert>
        )}

        {/* Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab label="Budget Categories" />
              <Tab label="Transaction History" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            {/* Search and Filter for Categories */}
            <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search budget categories..."
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
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={departmentFilter}
                    label="Department"
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                  >
                    <MenuItem value="All">All Departments</MenuItem>
                    <MenuItem value="IT">IT</MenuItem>
                    <MenuItem value="Admin">Admin</MenuItem>
                    <MenuItem value="Operations">Operations</MenuItem>
                    <MenuItem value="Security">Security</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={() => toast.info('Advanced filters coming soon')}
                >
                  Advanced Filters
                </Button>
              </Grid>
            </Grid>

            {/* Budget Categories */}
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {loading ? (
                <Grid item xs={12}>
                  <Typography align="center">Loading budget data...</Typography>
                </Grid>
              ) : filteredCategories.length === 0 ? (
                <Grid item xs={12}>
                  <Typography align="center">No budget categories found.</Typography>
                </Grid>
              ) : (
                filteredCategories.map((category) => (
                  <Grid item xs={12} md={6} key={category.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" gutterBottom>
                              {category.name}
                            </Typography>
                            <Chip
                              label={category.department}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                          <Chip
                            label={category.status}
                            color={getStatusColor(category.status) as any}
                            size="small"
                          />
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Budget Utilization
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {category.utilizationPercentage}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(category.utilizationPercentage, 100)}
                            color={getUtilizationColor(category.utilizationPercentage) as any}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>

                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Allocated
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              ₹{Number(category.allocatedAmount || 0).toLocaleString('en-IN')}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Spent
                            </Typography>
                            <Typography variant="body2" fontWeight="medium" color="error.main">
                              ₹{Number(category.spentAmount || 0).toLocaleString('en-IN')}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Committed
                            </Typography>
                            <Typography variant="body2" fontWeight="medium" color="warning.main">
                              ₹{Number(category.committedAmount || 0).toLocaleString('en-IN')}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Available
                            </Typography>
                            <Typography 
                              variant="body2" 
                              fontWeight="medium"
                              color={category.availableAmount < 0 ? 'error.main' : 'success.main'}
                            >
                              ₹{Number(Math.abs(category.availableAmount) || 0).toLocaleString('en-IN')}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {/* Transaction History Table */}
            <Typography variant="h6" gutterBottom>
              Recent Transactions ({filteredTransactions.length})
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Reference</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        Loading transactions...
                      </TableCell>
                    </TableRow>
                  ) : filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(parseISO(transaction.date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          <Chip
                            label={transaction.category}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{transaction.department}</TableCell>
                        <TableCell>
                          <Chip
                            label={transaction.type}
                            color={getTransactionTypeColor(transaction.type) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            color={transaction.type === 'Expense' ? 'error.main' : 'text.primary'}
                            fontWeight="medium"
                          >
                            {transaction.type === 'Expense' ? '-' : ''}₹{transaction.amount.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={transaction.status}
                            color={
                              transaction.status === 'Approved' ? 'success' : 
                              transaction.status === 'Pending' ? 'warning' : 'error'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {transaction.referenceNumber}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </Card>
      </Box>
    </DashboardLayout>
  );
};

export default BudgetTrackingPage;