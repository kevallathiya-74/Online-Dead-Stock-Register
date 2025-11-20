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
  Button,
  Chip,
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
  Checkbox,
  CircularProgress,
  Alert,
  Tooltip,
  Switch
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Work as WorkIcon,
  CheckCircle as CheckCircleIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

interface AdminUser {
  _id: string;
  id?: string; // Deprecated: use _id
  name: string;
  email: string;
  role: 'ADMIN' | 'INVENTORY_MANAGER' | 'IT_MANAGER' | 'AUDITOR' | 'EMPLOYEE';
  department: string;
  employee_id: string;
  status: 'Active' | 'Inactive';
  is_active: boolean;
  phone: string;
  location: string;
  manager: string;
  created_at: string;
  last_login?: string;
  permissions?: string[];
}

const UsersPage = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Employee' as AdminUser['role'],
    department: 'INVENTORY',
    employee_id: '',
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
      const response = await api.get('/users', {
        params: { _t: Date.now() }
      });
      
      console.log('Users response:', response.data);
      
      const userData = response.data.data || response.data;
      
      if (!Array.isArray(userData)) {
        console.error('Invalid user data format:', userData);
        throw new Error('Invalid data format received from server');
      }
      
      const mappedUsers = userData.map((user: any) => ({
        ...user,
        _id: user._id,
        status: user.is_active ? 'Active' : 'Inactive'
      }));
      
      console.log('Mapped users:', mappedUsers.length, 'users loaded');
      setUsers(mappedUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesDepartment = selectedDepartment === 'all' || user.department === selectedDepartment;
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'active' && user.is_active) ||
      (selectedStatus === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
  });

  const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.employee_id || !newUser.department) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      console.log('Creating user:', newUser);
      const response = await api.post('/users', {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        employee_id: newUser.employee_id,
        is_active: true,
        phone: newUser.phone,
        location: newUser.location,
        manager: newUser.manager,
        password: 'defaultPassword123' 
      });

      console.log('User created:', response.data);
      await loadUsers();
      
      setAddUserDialogOpen(false);
      resetNewUser();
      toast.success('User created successfully');
    } catch (error: any) {
      console.error('Failed to create user:', error);
      toast.error(error?.response?.data?.message || 'Failed to create user');
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      const user = users.find(u => u._id === userId);
      if (!user) return;
      
      // Update user status via API
      await api.put(`/users/${userId}`, {
        is_active: !user.is_active
      });
      
      // Update local state
      setUsers(prev => 
        prev.map(user => 
          user._id === userId 
            ? { ...user, is_active: !user.is_active, status: !user.is_active ? 'Active' : 'Inactive' }
            : user
        )
      );
      toast.success('User status updated');
    } catch (error) {
      console.error('Failed to update user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        // Delete user via API
        await api.delete(`/users/${userId}`);
        
        // Update local state
        setUsers(prev => prev.filter(user => user._id !== userId));
        toast.success('User deleted successfully');
      } catch (error) {
        console.error('Failed to delete user:', error);
        toast.error('Failed to delete user');
      }
    }
  };

  const handleRefresh = () => {
    loadUsers();
    toast.success('Users refreshed');
  };

  const resetNewUser = () => {
    setNewUser({
      name: '',
      email: '',
      role: 'EMPLOYEE',
      department: 'INVENTORY',
      employee_id: '',
      phone: '',
      location: '',
      manager: ''
    });
  };

  const getPermissionsByRole = (role: AdminUser['role']): string[] => {
    const allPermissions = [
      'view_users', 'create_users', 'edit_users', 'delete_users',
      'view_assets', 'create_assets', 'edit_assets', 'delete_assets',
      'view_transactions', 'approve_transactions', 'create_transactions',
      'view_reports', 'create_reports', 'export_data',
      'view_audit_logs', 'view_system_settings', 'edit_system_settings',
      'manage_vendors', 'schedule_maintenance', 'approve_maintenance'
    ];

    switch (role) {
      case 'ADMIN':
        return allPermissions;
      case 'INVENTORY_MANAGER':
        return [
          'view_users', 'view_assets', 'create_assets', 'edit_assets',
          'view_transactions', 'create_transactions', 'approve_transactions',
          'view_reports', 'create_reports', 'manage_vendors', 'schedule_maintenance'
        ];
      case 'IT_MANAGER':
        return [
          'view_users', 'view_assets', 'create_assets', 'edit_assets',
          'view_transactions', 'create_transactions', 'approve_transactions',
          'view_reports', 'create_reports', 'manage_vendors', 'schedule_maintenance'
        ];
      case 'AUDITOR':
        return [
          'view_users', 'view_assets', 'view_transactions', 'view_reports',
          'create_reports', 'export_data', 'view_audit_logs'
        ];
      case 'EMPLOYEE':
        return ['view_assets', 'view_transactions'];
      default:
        return [];
    }
  };

  const getRoleColor = (role: AdminUser['role']) => {
    switch (role) {
      case 'ADMIN':
        return 'error';
      case 'INVENTORY_MANAGER':
        return 'primary';
      case 'IT_MANAGER':
        return 'info';
      case 'AUDITOR':
        return 'secondary';
      case 'EMPLOYEE':
        return 'success';
      default:
        return 'default';
    }
  };

  const stats = {
    total: users.length,
    totalUsers: users.length,
    active: users.filter(u => u.is_active || u.status === 'Active').length,
    activeUsers: users.filter(u => u.is_active || u.status === 'Active').length,
    inactiveUsers: users.filter(u => !u.is_active || u.status === 'Inactive').length,
    adminUsers: users.filter(u => u.role === 'ADMIN').length,
    recentLogins: users.filter(u => u.last_login).length,
    byRole: {
      'ADMIN': users.filter(u => u.role === 'ADMIN').length,
      'INVENTORY_MANAGER': users.filter(u => u.role === 'INVENTORY_MANAGER').length,
      'IT_MANAGER': users.filter(u => u.role === 'IT_MANAGER').length,
      'AUDITOR': users.filter(u => u.role === 'AUDITOR').length,
      'EMPLOYEE': users.filter(u => u.role === 'EMPLOYEE').length,
    },
    byDepartment: users.reduce((acc: any, user) => {
      if (user.department) {
        acc[user.department] = (acc[user.department] || 0) + 1;
      }
      return acc;
    }, {}),
  };
  
  // Helper function to format role names for display
  const formatRoleName = (role: string): string => {
    const roleNames: Record<string, string> = {
      'ADMIN': 'Admin',
      'INVENTORY_MANAGER': 'Inventory Manager',
      'IT_MANAGER': 'IT Manager',
      'EMPLOYEE': 'Employee',
      'AUDITOR': 'Auditor'
    };
    return roleNames[role] || role;
  };
  
  // Filter out empty/undefined departments and ensure unique values
  const departments = Array.from(new Set(users.map(u => u.department).filter(d => d && d.trim() !== '')));
  const roles = ['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER', 'AUDITOR', 'EMPLOYEE'];

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
              User Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage system users, roles, and permissions
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddUserDialogOpen(true)}
            >
              Add User
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
                      Total Users
                    </Typography>
                    <Typography variant="h4">{stats.total}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {stats.recentLogins} logged in this week
                    </Typography>
                  </Box>
                  <PersonIcon sx={{ fontSize: 40, opacity: 0.8 }} />
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
                      Active Users
                    </Typography>
                    <Typography variant="h4">{stats.active}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {((stats.active / stats.total) * 100).toFixed(1)}% of total
                    </Typography>
                  </Box>
                  <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
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
                      Admin Users
                    </Typography>
                    <Typography variant="h4">{stats.byRole['Admin'] || 0}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      System administrators
                    </Typography>
                  </Box>
                  <AdminIcon sx={{ fontSize: 40, opacity: 0.8 }} />
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
                      Departments
                    </Typography>
                    <Typography variant="h4">{Object.keys(stats.byDepartment).length}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Active departments
                    </Typography>
                  </Box>
                  <WorkIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Enhanced Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search users by name, email, department..."
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
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={selectedRole}
                    label="Role"
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    <MenuItem value="all">All Roles</MenuItem>
                    {roles.map(role => (
                      <MenuItem key={role} value={role}>
                        {role.replace('_', ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={selectedDepartment}
                    label="Department"
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    <MenuItem value="all">All Departments</MenuItem>
                    {departments.map(dept => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={selectedStatus}
                    label="Status"
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    {filteredUsers.length} of {users.length}
                  </Typography>
                  <Tooltip title="Export Users">
                    <IconButton onClick={() => toast.info('Export functionality coming soon')}>
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Enhanced Users Table */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                User Directory
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip 
                  label={`${filteredUsers.length} users`} 
                  color="primary" 
                  variant="outlined" 
                  size="small" 
                />
                {bulkSelected.length > 0 && (
                  <Chip 
                    label={`${bulkSelected.length} selected`} 
                    color="secondary" 
                    size="small" 
                  />
                )}
              </Box>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={bulkSelected.length > 0 && bulkSelected.length < filteredUsers.length}
                        checked={filteredUsers.length > 0 && bulkSelected.length === filteredUsers.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBulkSelected(filteredUsers.map(u => u._id));
                          } else {
                            setBulkSelected([]);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>User Details</TableCell>
                    <TableCell>Role & Permissions</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Contact Info</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Activity</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.filter(user => user._id).map((user, index) => (
                    <TableRow 
                      key={user._id || `user-${index}`}
                      selected={bulkSelected.includes(user._id)}
                      hover
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={bulkSelected.includes(user._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBulkSelected(prev => [...prev, user._id]);
                            } else {
                              setBulkSelected(prev => prev.filter(id => id !== user._id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              mr: 2, 
                              bgcolor: user.is_active ? 'primary.main' : 'grey.400',
                              width: 45,
                              height: 45
                            }}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {user.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {user.email}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                              ID: {user.employee_id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Chip
                            label={formatRoleName(user.role)}
                            color={getRoleColor(user.role) as any}
                            size="small"
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="caption" display="block" color="text.secondary">
                            {user.permissions?.length || 0} permissions
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {user.department}
                          </Typography>
                          {user.location && (
                            <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                              <LocationIcon fontSize="inherit" />
                              {user.location}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          {user.phone && (
                            <Typography variant="caption" display="flex" alignItems="center" gap={0.5} sx={{ mb: 0.5 }}>
                              <PhoneIcon fontSize="inherit" />
                              {user.phone}
                            </Typography>
                          )}
                          <Typography variant="caption" display="flex" alignItems="center" gap={0.5}>
                            <EmailIcon fontSize="inherit" />
                            {user.email.split('@')[0]}@...
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Switch
                            checked={user.is_active}
                            onChange={() => handleToggleUserStatus(user._id)}
                            size="small"
                          />
                          <Chip
                            label={user.is_active ? 'Active' : 'Inactive'}
                            color={user.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Created: {new Date(user.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              color="info"
                              onClick={() => {
                                setSelectedUser(user);
                                setViewDialogOpen(true);
                              }}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit User">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => {
                                toast.info(`Edit functionality for ${user.name} coming soon`);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete User">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteUser(user._id)}
                            >
                              <DeleteIcon />
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
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredUsers.length}
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

        {/* Enhanced Add User Dialog */}
        <Dialog open={addUserDialogOpen} onClose={() => setAddUserDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon color="primary" />
              Add New User
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    ),
                  }}
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
                    <MenuItem value="EMPLOYEE">Employee</MenuItem>
                    <MenuItem value="AUDITOR">Auditor</MenuItem>
                    <MenuItem value="INVENTORY_MANAGER">Inventory Manager</MenuItem>
                    <MenuItem value="IT_MANAGER">IT Manager</MenuItem>
                    <MenuItem value="ADMIN">Administrator</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Employee ID"
                  required
                  value={newUser.employee_id}
                  onChange={(e) => setNewUser(prev => ({ ...prev, employee_id: e.target.value }))}
                  placeholder="EMP0001"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={newUser.department}
                    label="Department"
                    onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                    startAdornment={
                      <InputAdornment position="start">
                        <WorkIcon />
                      </InputAdornment>
                    }
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
                  label="Phone Number"
                  value={newUser.phone}
                  onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={newUser.location}
                  onChange={(e) => setNewUser(prev => ({ ...prev, location: e.target.value }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Manager"
                  value={newUser.manager}
                  onChange={(e) => setNewUser(prev => ({ ...prev, manager: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info">
                  New users will be created with default permissions based on their role. 
                  You can modify permissions later in the user settings.
                </Alert>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setAddUserDialogOpen(false);
              resetNewUser();
            }}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleAddUser}
              disabled={!newUser.name || !newUser.email || !newUser.employee_id || !newUser.department}
              startIcon={<AddIcon />}
            >
              Create User
            </Button>
          </DialogActions>
        </Dialog>

        {/* View User Details Dialog */}
        <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>User Details</DialogTitle>
          <DialogContent dividers>
            {selectedUser && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Basic Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Name</Typography>
                          <Typography variant="body1" fontWeight="bold">{selectedUser.name}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Employee ID</Typography>
                          <Typography variant="body1" fontWeight="bold">{selectedUser.employee_id}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Email</Typography>
                          <Typography variant="body1">{selectedUser.email}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Phone</Typography>
                          <Typography variant="body1">{selectedUser.phone || 'N/A'}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Role & Department
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Role</Typography>
                          <Chip 
                            label={selectedUser.role} 
                            color="primary"
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Department</Typography>
                          <Chip 
                            label={selectedUser.department}
                            color="secondary"
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Status</Typography>
                          <Chip 
                            label={selectedUser.status}
                            color={selectedUser.status === 'Active' ? 'success' : 'default'}
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Manager</Typography>
                          <Typography variant="body1">{selectedUser.manager || 'N/A'}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Activity Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Created Date</Typography>
                          <Typography variant="body1">
                            {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Last Login</Typography>
                          <Typography variant="body1">
                            {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : 'Never'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)} variant="outlined">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default UsersPage;