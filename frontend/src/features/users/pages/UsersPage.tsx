import {
    ArrowDownTrayIcon,
    ArrowPathIcon,
    BriefcaseIcon,
    CheckCircleIcon,
    EnvelopeIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    MapPinIcon,
    PencilSquareIcon,
    PhoneIcon,
    PlusIcon,
    ShieldCheckIcon,
    TrashIcon,
    UserIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import api from '../../../services/api';

interface AdminUser {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'INVENTORY_MANAGER' | 'IT_MANAGER' | 'AUDITOR' | 'VENDOR';
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
    role: 'AUDITOR' as AdminUser['role'],
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
      const userData = response.data.data || response.data;
      if (!Array.isArray(userData)) {
        throw new Error('Invalid data format received from server');
      }
      const mappedUsers = userData.map((user: Record<string, unknown>) => ({
        ...user,
        _id: String(user._id || user.id),
        status: user.is_active ? 'Active' : 'Inactive'
      })) as AdminUser[];
      setUsers(mappedUsers);
    } catch { /* ignore */ } finally {
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
      await api.post('/users', {
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
      await loadUsers();
      setAddUserDialogOpen(false);
      resetNewUser();
      toast.success('User created successfully');
    } catch { /* ignore */ }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      const user = users.find(u => u._id === userId);
      if (!user) return;
      await api.put(`/users/${userId}`, {
        is_active: !user.is_active
      });
      setUsers(prev => 
        prev.map(user => 
          user._id === userId 
            ? { ...user, is_active: !user.is_active, status: !user.is_active ? 'Active' : 'Inactive' }
            : user
        )
      );
      toast.success('User status updated');
    } catch { /* ignore */ }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${userId}`);
        setUsers(prev => prev.filter(user => user._id !== userId));
        toast.success('User deleted successfully');
      } catch { /* ignore */ }
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
      role: 'AUDITOR',
      department: 'INVENTORY',
      employee_id: '',
      phone: '',
      location: '',
      manager: ''
    });
  };

  const getRoleBadgeClass = (role: AdminUser['role']) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-50 text-red-700 border-red-100';
      case 'INVENTORY_MANAGER': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'IT_MANAGER': return 'bg-sky-50 text-sky-700 border-sky-100';
      case 'AUDITOR': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'VENDOR': return 'bg-green-50 text-green-700 border-green-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active || u.status === 'Active').length,
    admins: users.filter(u => u.role === 'ADMIN').length,
    byDepartment: users.reduce((acc: Record<string, number>, user) => {
      if (user.department) {
        acc[user.department] = (acc[user.department] || 0) + 1;
      }
      return acc;
    }, {}),
  };
  
  const formatRoleName = (role: string): string => {
    const roleNames: Record<string, string> = {
      'ADMIN': 'Admin',
      'INVENTORY_MANAGER': 'Inventory Manager',
      'IT_MANAGER': 'IT Manager',
      'AUDITOR': 'Auditor',
      'VENDOR': 'Vendor'
    };
    return roleNames[role] || role;
  };
  
  const departments = Array.from(new Set(users.map(u => u.department).filter(d => d && d.trim() !== '')));
  const roles = ['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER', 'AUDITOR', 'VENDOR'];

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-655">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-905">User Management</h2>
            <p className="text-slate-450 mt-1">Manage system users, roles, and permissions</p>
          </div>
          <div className="flex gap-2 font-semibold">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-205 text-slate-700 rounded-xl bg-white hover:bg-slate-50 cursor-pointer"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setAddUserDialogOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl cursor-pointer shadow-brand"
            >
              <PlusIcon className="w-4 h-4" />
              Add User
            </button>
          </div>
        </div>

        {/* Stats Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Users</p>
              <h3 className="text-lg font-bold text-slate-905 font-display mt-1">{loading ? '...' : stats.total}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <UserIcon className="w-5.5 h-5.5" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Accounts</p>
              <h3 className="text-lg font-bold text-slate-905 font-display mt-1">{loading ? '...' : stats.active}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <CheckCircleIcon className="w-5.5 h-5.5" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Administrators</p>
              <h3 className="text-lg font-bold text-slate-905 font-display mt-1">{loading ? '...' : stats.admins}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <ShieldCheckIcon className="w-5.5 h-5.5" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Departments</p>
              <h3 className="text-lg font-bold text-slate-905 font-display mt-1">{loading ? '...' : Object.keys(stats.byDepartment).length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <BriefcaseIcon className="w-5.5 h-5.5" />
            </div>
          </div>
        </div>

        {/* Enhanced Filters row */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-card grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-4 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <MagnifyingGlassIcon className="w-4.5 h-4.5" />
            </span>
            <input
              type="text"
              placeholder="Search by name, email, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-205 rounded-xl bg-slate-50/50"
            />
          </div>

          <div className="md:col-span-2">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
            >
              <option value="all">All Roles</option>
              {roles.map(r => <option key={r} value={r}>{formatRoleName(r)}</option>)}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
            >
              <option value="all">All Depts</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-center justify-between pl-2">
            <span className="text-[10px] text-slate-450 font-bold">{filteredUsers.length} of {users.length}</span>
            <button
              onClick={() => toast.info('Export functionality coming soon')}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer"
              title="Export Users Data"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Directory table */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-905 font-display">User Directory</h3>
            <div className="flex items-center gap-1.5 font-semibold text-[10px]">
              <span className="px-2 py-0.5 border border-brand-100 bg-brand-50 text-brand-700 rounded-full">{filteredUsers.length} matches</span>
              {bulkSelected.length > 0 && <span className="px-2 py-0.5 bg-amber-500 text-slate-900 rounded-full">{bulkSelected.length} selected</span>}
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-50 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase">
                  <th className="pb-3 pt-2 pl-4 w-10">
                    <input
                      type="checkbox"
                      checked={filteredUsers.length > 0 && bulkSelected.length === filteredUsers.length}
                      onChange={(e) => {
                        if (e.target.checked) setBulkSelected(filteredUsers.map(u => u._id));
                        else setBulkSelected([]);
                      }}
                      className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                    />
                  </th>
                  <th className="pb-3 pt-2">User Details</th>
                  <th className="pb-3 pt-2">Role</th>
                  <th className="pb-3 pt-2">Department</th>
                  <th className="pb-3 pt-2">Contact</th>
                  <th className="pb-3 pt-2">Status</th>
                  <th className="pb-3 pt-2">Last Activity</th>
                  <th className="pb-3 pt-2 text-center pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {loading ? (
                  [1, 2, 3].map((idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-4 pl-4" colSpan={8}><div className="h-4 bg-slate-100 rounded w-full" /></td>
                    </tr>
                  ))
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-semibold">No users found.</td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user._id} className={`hover:bg-slate-55/50 ${bulkSelected.includes(user._id) ? 'bg-slate-50/50' : ''}`}>
                      <td className="py-3.5 pl-4">
                        <input
                          type="checkbox"
                          checked={bulkSelected.includes(user._id)}
                          onChange={(e) => {
                            if (e.target.checked) setBulkSelected(prev => [...prev, user._id]);
                            else setBulkSelected(prev => prev.filter(id => id !== user._id));
                          }}
                          className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                        />
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full font-bold flex items-center justify-center text-white ${user.is_active ? 'bg-brand-600' : 'bg-slate-350'}`}>
                            {user.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{user.name}</p>
                            <p className="text-[9px] text-slate-400 font-semibold font-mono">ID: {user.employee_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex px-2 py-0.5 border rounded-full text-[9px] font-bold ${getRoleBadgeClass(user.role)}`}>
                          {formatRoleName(user.role)}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <p className="font-bold text-slate-900">{user.department}</p>
                        {user.location && <span className="text-[9.5px] text-slate-400 inline-flex items-center gap-0.5 mt-0.5"><MapPinIcon className="w-3.5 h-3.5" />{user.location}</span>}
                      </td>
                      <td className="py-3.5">
                        {user.phone && <p className="text-[9.5px] text-slate-500 font-semibold inline-flex items-center gap-0.5"><PhoneIcon className="w-3 h-3" />{user.phone}</p>}
                        <p className="text-[9.5px] text-slate-450 mt-0.5 inline-flex items-center gap-0.5"><EnvelopeIcon className="w-3 h-3" />{user.email.split('@')[0]}@...</p>
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={user.is_active}
                            onChange={() => handleToggleUserStatus(user._id)}
                            className="w-8 h-4 rounded-full bg-slate-205 border-transparent focus:ring-0 checked:bg-brand-600 appearance-none relative cursor-pointer before:content-[''] before:absolute before:w-3 before:h-3 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition-transform"
                          />
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${user.is_active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{user.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <p className="font-semibold text-slate-805">{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</p>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Created: {new Date(user.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="py-3.5 text-center pr-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => { setSelectedUser(user); setViewDialogOpen(true); }}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toast.info(`Edit functionality for ${user.name} coming soon`)}
                            className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-slate-50 rounded-lg cursor-pointer"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Simple custom pagination Controls */}
          <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-4 font-semibold text-slate-500">
            <div>
              <label className="mr-2">Rows per page:</label>
              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
                className="px-2 py-1 border border-slate-205 rounded bg-white"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 border border-slate-205 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Prev
              </button>
              <span className="py-1 px-2 text-slate-700">Page {page + 1} of {Math.ceil(filteredUsers.length / rowsPerPage) || 1}</span>
              <button
                disabled={page >= Math.ceil(filteredUsers.length / rowsPerPage) - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 border border-slate-205 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>

        </div>

        {/* Add User Dialog pop */}
        {addUserDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 max-w-2xl w-full p-6 shadow-card-xl space-y-4 animate-fade-in-up">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-base font-bold font-display text-slate-900">Add New User</h3>
                <button onClick={() => { setAddUserDialogOpen(false); resetNewUser(); }} className="p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-lg">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                    placeholder="e.g. Jane Doe"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                    placeholder="jane@company.com"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Role *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser(p => ({ ...p, role: e.target.value as AdminUser['role'] }))}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
                  >
                    <option value="AUDITOR">Auditor</option>
                    <option value="INVENTORY_MANAGER">Inventory Manager</option>
                    <option value="IT_MANAGER">IT Manager</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={newUser.employee_id}
                    onChange={(e) => setNewUser(p => ({ ...p, employee_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                    placeholder="EMP0001"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Department *</label>
                  <select
                    value={newUser.department}
                    onChange={(e) => setNewUser(p => ({ ...p, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
                  >
                    <option value="INVENTORY">Inventory</option>
                    <option value="IT">IT</option>
                    <option value="ADMIN">Admin</option>
                    <option value="VENDOR">Vendor</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newUser.phone}
                    onChange={(e) => setNewUser(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                    placeholder="1234567890"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Location</label>
                  <input
                    type="text"
                    value={newUser.location}
                    onChange={(e) => setNewUser(p => ({ ...p, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                    placeholder="Floor 2 IT lab"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Manager</label>
                  <input
                    type="text"
                    value={newUser.manager}
                    onChange={(e) => setNewUser(p => ({ ...p, manager: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                    placeholder="Supervisor Name"
                  />
                </div>
              </div>

              <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl leading-relaxed text-sky-850">
                New users will be created with default permissions based on their role. You can modify permissions later in user details.
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 font-semibold">
                <button
                  onClick={() => { setAddUserDialogOpen(false); resetNewUser(); }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={!newUser.name || !newUser.email || !newUser.employee_id || !newUser.department}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg cursor-pointer shadow-brand disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon className="w-4 h-4" />
                  Create User
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View details popup */}
        {viewDialogOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 max-w-xl w-full p-6 shadow-card-xl space-y-4 animate-fade-in-up">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-base font-bold font-display text-slate-900">User Details</h3>
                <button onClick={() => setViewDialogOpen(false)} className="p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-lg">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-slate-900">Basic Info</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400">Name:</p>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedUser.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Employee ID:</p>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedUser.employee_id}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Email Address:</p>
                      <p className="font-semibold text-slate-805 mt-0.5">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Phone:</p>
                      <p className="font-semibold text-slate-805 mt-0.5">{selectedUser.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-slate-900">Role & Department</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400">System Role:</p>
                      <span className={`inline-flex px-2 py-0.5 border rounded-full text-[9px] font-bold mt-1.5 ${getRoleBadgeClass(selectedUser.role)}`}>
                        {formatRoleName(selectedUser.role)}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Department:</p>
                      <span className="inline-flex px-2 py-0.5 border border-slate-205 text-slate-700 bg-slate-50 rounded-full text-[9px] font-bold mt-1.5">{selectedUser.department}</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Account Status:</p>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold mt-1.5 ${selectedUser.is_active ? 'bg-green-50 text-green-700' : 'bg-slate-150 text-slate-655'}`}>{selectedUser.status}</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Manager:</p>
                      <p className="font-semibold text-slate-805 mt-0.5">{selectedUser.manager || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-slate-900">Activity Log</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400">Member Since:</p>
                      <p className="font-semibold text-slate-805 mt-0.5">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Last Login activity:</p>
                      <p className="font-semibold text-slate-805 mt-0.5">{selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : 'Never'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 font-semibold">
                <button
                  onClick={() => setViewDialogOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default UsersPage;