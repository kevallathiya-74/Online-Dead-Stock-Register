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
  Alert,
  Tabs,
  Tab,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'INVENTORY_MANAGER' | 'AUDITOR' | 'EMPLOYEE';
  department: string;
  employee_id: string;
  is_active: boolean;
  phone: string;
  location: string;
  manager: string;
  created_at: string;
  last_login?: string;
  permissions?: string[];
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
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
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

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'EMPLOYEE' as AdminUser['role'],
    department: '',
    phone: '',
    location: '',
    manager: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      const userData = response.data.data || response.data;
      setUsers(userData);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    admins: users.filter(u => u.role === 'ADMIN').length,
    managers: users.filter(u => u.role === 'INVENTORY_MANAGER').length,
    employees: users.filter(u => u.role === 'EMPLOYEE').length
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.department) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const userData = {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        phone: newUser.phone,
        location: newUser.location,
        manager: newUser.manager,
        is_active: true,
        password: 'Password@123' // Default password
      };

      console.log('Creating user via API:', userData);
      
      // Call API to create user
      const response = await api.post('/users', userData);
      console.log('User created successfully:', response.data);
      
      // Reload users from server
      await loadUsers();
      
      setAddUserDialogOpen(false);
      setNewUser({
        name: '',
        email: '',
        role: 'EMPLOYEE',
        department: '',
        phone: '',
        location: '',
        manager: ''
      });
      
      toast.success(`User added successfully! Employee ID: ${response.data.data.employee_id}`);
    } catch (error: any) {
      console.error('Failed to add user:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to add user';
      toast.error(errorMsg);
    }
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setNewUser({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      phone: user.phone || '',
      location: user.location || '',
      manager: user.manager || ''
    });
    setEditUserDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !newUser.name || !newUser.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const userData = {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        phone: newUser.phone,
        location: newUser.location,
        manager: newUser.manager
      };

      console.log('Updating user via API:', selectedUser.id, userData);
      
      // Call API to update user
      await api.put(`/users/${selectedUser.id}`, userData);
      
      // Reload users from server
      await loadUsers();
      
      setEditUserDialogOpen(false);
      setSelectedUser(null);
      toast.success('User updated successfully');
    } catch (error: any) {
      console.error('Failed to update user:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to update user';
      toast.error(errorMsg);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        console.log('Deleting user via API:', userId);
        
        // Call API to delete user
        await api.delete(`/users/${userId}`);
        
        // Reload users from server
        await loadUsers();
        
        toast.success('User deleted successfully');
      } catch (error: any) {
        console.error('Failed to delete user:', error);
        const errorMsg = error.response?.data?.message || error.message || 'Failed to delete user';
        toast.error(errorMsg);
      }
    }
  };

  const toggleUserStatus = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      console.log('Toggling user status via API:', userId);
      
      // Call API to update user status
      await api.put(`/users/${userId}`, {
        is_active: !user.is_active
      });
      
      // Reload users from server
      await loadUsers();
      
      toast.success('User status updated');
    } catch (error: any) {
      console.error('Failed to update user status:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to update user status';
      toast.error(errorMsg);
    }
  };

  const formatRoleName = (role: string): string => {
    const roleNames: Record<string, string> = {
      'ADMIN': 'Admin',
      'INVENTORY_MANAGER': 'Inventory Manager',
      'EMPLOYEE': 'Employee',
      'AUDITOR': 'Auditor'
    };
    return roleNames[role] || role;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'error';
      case 'INVENTORY_MANAGER':
        return 'warning';
      case 'AUDITOR':
        return 'info';
      case 'EMPLOYEE':
        return 'success';
      default:
        return 'default';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <AdminIcon fontSize="small" />;
      case 'INVENTORY_MANAGER':
        return <BusinessIcon fontSize="small" />;
      case 'AUDITOR':
        return <SecurityIcon fontSize="small" />;
      case 'EMPLOYEE':
        return <PersonIcon fontSize="small" />;
      default:
        return <PersonIcon fontSize="small" />;
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ flexGrow: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              User Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage system users, roles, and permissions
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddUserDialogOpen(true)}
          >
            Add New User
          </Button>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4">{stats.total}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Total Users
                    </Typography>
                  </Box>
                  <PersonIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4">{stats.active}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Active Users
                    </Typography>
                  </Box>
                  <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4">{stats.admins}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Administrators
                    </Typography>
                  </Box>
                  <AdminIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4">{stats.managers}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Managers
                    </Typography>
                  </Box>
                  <BusinessIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4">{stats.employees}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Employees
                    </Typography>
                  </Box>
                  <PersonIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="All Users" />
            <Tab label="Active Users" />
            <Tab label="Inactive Users" />
          </Tabs>
        </Paper>

        {/* Search and Filters */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search users by name, email, or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300, flexGrow: 1 }}
          />
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={selectedRole}
              label="Role"
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <MenuItem value="all">All Roles</MenuItem>
              <MenuItem value="ADMIN">Admin</MenuItem>
              <MenuItem value="INVENTORY_MANAGER">Inventory Manager</MenuItem>
              <MenuItem value="EMPLOYEE">Employee</MenuItem>
              <MenuItem value="AUDITOR">Auditor</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          {/* All Users Table */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">All Users ({filteredUsers.length})</Typography>
              </Box>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Last Login</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <CircularProgress />
                            <Typography variant="body2" color="text.secondary">
                              Loading users...
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : paginatedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {user.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {user.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {user.email}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {user.employee_id}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getRoleIcon(user.role)}
                            label={formatRoleName(user.role)}
                            color={getRoleColor(user.role) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{user.department}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.is_active ? 'Active' : 'Inactive'}
                            color={user.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditUser(user)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => toggleUserStatus(user.id)}
                              color={user.is_active ? 'warning' : 'success'}
                            >
                              {user.is_active ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteUser(user.id)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredUsers.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Alert severity="info">Active users view - shows only active users</Alert>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Alert severity="info">Inactive users view - shows only inactive users</Alert>
        </TabPanel>

        {/* Add User Dialog */}
        <Dialog open={addUserDialogOpen} onClose={() => setAddUserDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Add New User</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Full Name"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={newUser.role}
                      label="Role"
                      onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as AdminUser['role'] }))}
                    >
                      <MenuItem value="ADMIN">Admin</MenuItem>
                      <MenuItem value="INVENTORY_MANAGER">Inventory Manager</MenuItem>
                      <MenuItem value="EMPLOYEE">Employee</MenuItem>
                      <MenuItem value="AUDITOR">Auditor</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Department</InputLabel>
                    <Select
                      value={newUser.department}
                      label="Department"
                      onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                    >
                      <MenuItem value="INVENTORY">Inventory</MenuItem>
                      <MenuItem value="IT">IT</MenuItem>
                      <MenuItem value="ADMIN">Admin</MenuItem>
                      <MenuItem value="VENDOR">Vendor</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={newUser.phone}
                    onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={newUser.location}
                    onChange={(e) => setNewUser(prev => ({ ...prev, location: e.target.value }))}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Manager"
                    value={newUser.manager}
                    onChange={(e) => setNewUser(prev => ({ ...prev, manager: e.target.value }))}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddUserDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddUser} variant="contained">Add User</Button>
          </DialogActions>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={editUserDialogOpen} onClose={() => setEditUserDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Edit User</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Full Name"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={newUser.role}
                      label="Role"
                      onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as AdminUser['role'] }))}
                    >
                      <MenuItem value="ADMIN">Admin</MenuItem>
                      <MenuItem value="INVENTORY_MANAGER">Inventory Manager</MenuItem>
                      <MenuItem value="EMPLOYEE">Employee</MenuItem>
                      <MenuItem value="AUDITOR">Auditor</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Department</InputLabel>
                    <Select
                      value={newUser.department}
                      label="Department"
                      onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                    >
                      <MenuItem value="INVENTORY">Inventory</MenuItem>
                      <MenuItem value="IT">IT</MenuItem>
                      <MenuItem value="ADMIN">Admin</MenuItem>
                      <MenuItem value="VENDOR">Vendor</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={newUser.phone}
                    onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={newUser.location}
                    onChange={(e) => setNewUser(prev => ({ ...prev, location: e.target.value }))}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Manager"
                    value={newUser.manager}
                    onChange={(e) => setNewUser(prev => ({ ...prev, manager: e.target.value }))}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditUserDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateUser} variant="contained">Update User</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default AdminUsersPage;