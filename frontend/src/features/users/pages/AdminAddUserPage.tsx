import {
    ArrowLeftIcon,
    BriefcaseIcon,
    CheckIcon,
    ShieldCheckIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import api from '../../../services/api';

const steps = ['Basic Information', 'Role & Department', 'Permissions & Access'];

const AdminAddUserPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    employee_id: '',
    role: 'AUDITOR',
    department: 'INVENTORY',
    location: '',
    manager: '',
    is_active: true,
    permissions: {
      assets: { read: true, write: false, delete: false },
      users: { read: false, write: false, delete: false },
      reports: { read: true, write: false, delete: false },
      settings: { read: false, write: false, delete: false }
    }
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateStep = (step: number) => {
    const newErrors: { [key: string]: string } = {};

    switch (step) {
      case 0:
        if (!newUser.name) newErrors.name = 'Name is required';
        if (!newUser.email) newErrors.email = 'Email is required';
        if (!newUser.email.includes('@')) newErrors.email = 'Valid email is required';
        break;
      case 1:
        if (!newUser.department) newErrors.department = 'Department is required';
        if (!newUser.role) newErrors.role = 'Role is required';
        break;
      case 2:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleRoleChange = (role: string) => {
    setNewUser(prev => {
      let permissions = { ...prev.permissions };
    
      switch (role) {
        case 'ADMIN':
          permissions = {
            assets: { read: true, write: true, delete: true },
            users: { read: true, write: true, delete: true },
            reports: { read: true, write: true, delete: true },
            settings: { read: true, write: true, delete: true }
          };
          break;
        case 'INVENTORY_MANAGER':
          permissions = {
            assets: { read: true, write: true, delete: false },
            users: { read: true, write: false, delete: false },
            reports: { read: true, write: true, delete: false },
            settings: { read: true, write: false, delete: false }
          };
          break;
        case 'AUDITOR':
          permissions = {
            assets: { read: true, write: false, delete: false },
            users: { read: true, write: false, delete: false },
            reports: { read: true, write: false, delete: false },
            settings: { read: true, write: false, delete: false }
          };
          break;
        default:
          permissions = {
            assets: { read: true, write: false, delete: false },
            users: { read: false, write: false, delete: false },
            reports: { read: true, write: false, delete: false },
            settings: { read: false, write: false, delete: false }
          };
      }
      
      return { ...prev, role, permissions };
    });
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    try {
      const userData = {
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        employee_id: newUser.employee_id || undefined,
        role: newUser.role,
        department: newUser.department,
        location: newUser.location,
        manager: newUser.manager,
        is_active: newUser.is_active,
        password: 'Password@123'
      };
      
      const response = await api.post('/users', userData);
      toast.success(`User created successfully! Employee ID: ${response.data.data.employee_id}`);
      navigate('/users');
    } catch (error: any) {
      
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create user';
      toast.error(errorMsg);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">Basic Information</h3>
              {/* eslint-disable-next-line react/no-unescaped-entities */}
              <p className="text-xs text-slate-500 mt-1">Enter the user's basic personal and contact information</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    errors.name ? 'border-red-400 focus:ring-red-405' : 'border-slate-200'
                  }`}
                  placeholder="John Doe"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    errors.email ? 'border-red-400 focus:ring-red-405' : 'border-slate-200'
                  }`}
                  placeholder="john.doe@company.com"
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newUser.phone}
                  onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="+91 9876543210"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID</label>
                <input
                  type="text"
                  value={newUser.employee_id}
                  onChange={(e) => setNewUser(prev => ({ ...prev, employee_id: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Leave blank to auto-generate"
                />
              </div>
              
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={newUser.location}
                  onChange={(e) => setNewUser(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Building C, 4th Floor"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">Role & Department</h3>
              {/* eslint-disable-next-line react/no-unescaped-entities */}
              <p className="text-xs text-slate-500 mt-1">Assign the user's role and department within the organization</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white ${
                    errors.role ? 'border-red-400 focus:ring-red-405' : 'border-slate-200'
                  }`}
                >
                  <option value="ADMIN">Admin</option>
                  <option value="INVENTORY_MANAGER">Inventory Manager</option>
                  <option value="AUDITOR">Auditor</option>
                  <option value="VENDOR">Vendor</option>
                </select>
                {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department *</label>
                <select
                  value={newUser.department}
                  onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                  className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white ${
                    errors.department ? 'border-red-400 focus:ring-red-405' : 'border-slate-200'
                  }`}
                >
                  <option value="INVENTORY">Inventory</option>
                  <option value="IT">IT</option>
                  <option value="ADMIN">Admin</option>
                  <option value="VENDOR">Vendor</option>
                </select>
                {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department}</p>}
              </div>
              
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Manager</label>
                <input
                  type="text"
                  value={newUser.manager}
                  onChange={(e) => setNewUser(prev => ({ ...prev, manager: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Enter manager's name"
                />
              </div>
              
              <div className="sm:col-span-2 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newUser.is_active}
                    onChange={(e) => setNewUser(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600" />
                  <span className="ml-2 text-sm font-semibold text-slate-650">Active User Account</span>
                </label>
              </div>

              {/* Role Description Card */}
              <div className="sm:col-span-2 p-4 bg-sky-50 border border-sky-100 rounded-xl text-sky-850">
                <h4 className="text-xs font-bold font-display uppercase tracking-wide text-sky-800">
                  {newUser.role.replace('_', ' ')} Role Scope:
                </h4>
                <p className="text-xs mt-1.5 leading-relaxed text-sky-700">
                  {newUser.role === 'ADMIN' && 'Full system access with user management, system settings, backups, and audits.'}
                  {newUser.role === 'INVENTORY_MANAGER' && 'Manage assets, inventory transfers, warranty schedules, categories, and vendors.'}
                  {newUser.role === 'AUDITOR' && 'Read-only access to all reports, audit logs, compliance data, and assets.'}
                  {newUser.role === 'VENDOR' && 'Access to vendor portal for checking assigned purchase orders and invoices.'}
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">Permissions & Access</h3>
              <p className="text-xs text-slate-500 mt-1">Review and customize user module permissions (auto-configured by role)</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(newUser.permissions).map(([module, perms]) => (
                <div key={module} className="bg-white rounded-xl border border-slate-100 shadow-card p-5 space-y-3">
                  <h4 className="font-semibold text-slate-950 text-sm uppercase tracking-wider font-display border-b border-slate-50 pb-2">
                    {module} Module
                  </h4>
                  
                  <div className="space-y-2">
                    <label className="relative inline-flex items-center cursor-pointer w-full">
                      <input
                        type="checkbox"
                        checked={perms.read}
                        onChange={(e) => setNewUser(prev => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            [module]: { ...perms, read: e.target.checked }
                          }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand-600" />
                      <span className="ml-2 text-xs font-semibold text-slate-600">Read Access</span>
                    </label>
                    
                    <label className="relative inline-flex items-center cursor-pointer w-full">
                      <input
                        type="checkbox"
                        checked={perms.write}
                        onChange={(e) => setNewUser(prev => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            [module]: { ...perms, write: e.target.checked }
                          }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand-600" />
                      <span className="ml-2 text-xs font-semibold text-slate-650">Write Access</span>
                    </label>
                    
                    <label className="relative inline-flex items-center cursor-pointer w-full">
                      <input
                        type="checkbox"
                        checked={perms.delete}
                        onChange={(e) => setNewUser(prev => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            [module]: { ...perms, delete: e.target.checked }
                          }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand-600" />
                      <span className="ml-2 text-xs font-semibold text-slate-650">Delete Access</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Card */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-4">
              <h4 className="text-sm font-bold font-display text-slate-900">User Summary</h4>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-lg">
                  {newUser.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h5 className="font-semibold text-slate-900 text-sm">{newUser.name || 'New User'}</h5>
                  <p className="text-xs text-slate-500">{newUser.email}</p>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-700 uppercase border border-brand-100 mt-1">
                    {newUser.role.replace('_', ' ')}
                  </span>
                </div>
              </div>
              
              <div className="border-t border-slate-200 pt-4 grid grid-cols-2 gap-4 text-xs text-slate-500">
                <div>
                  <p className="font-semibold text-slate-700">Department</p>
                  <p className="mt-0.5">{newUser.department || 'Not specified'}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Manager</p>
                  <p className="mt-0.5">{newUser.manager || 'Not specified'}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Location</p>
                  <p className="mt-0.5">{newUser.location || 'Not specified'}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Status</p>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${
                    newUser.is_active ? 'bg-green-50 text-green-700 border border-green-150' : 'bg-slate-100 text-slate-650'
                  }`}>
                    {newUser.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold font-display text-slate-900">
              Add New User
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Create a new user account with appropriate role and permissions
            </p>
          </div>
          <button
            onClick={() => navigate('/users')}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Users
          </button>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6 sm:p-8 space-y-8">
          {/* Stepper Header */}
          <div className="flex items-center justify-between max-w-lg mx-auto relative">
            {steps.map((label, index) => (
              <div key={label} className="flex flex-col items-center z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                  activeStep > index
                    ? 'bg-green-600 text-white'
                    : activeStep === index
                    ? 'bg-brand-600 text-white shadow-brand'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {activeStep > index ? (
                    <CheckIcon className="w-5 h-5" />
                  ) : index === 0 ? (
                    <UserIcon className="w-5 h-5" />
                  ) : index === 1 ? (
                    <BriefcaseIcon className="w-5 h-5" />
                  ) : (
                    <ShieldCheckIcon className="w-5 h-5" />
                  )}
                </div>
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-2 text-center">{label}</span>
              </div>
            ))}
            <div className="absolute top-5 left-[15%] right-[15%] h-0.5 bg-slate-100 z-0">
              <div 
                className="h-full bg-brand-650 transition-all duration-305" 
                style={{ width: activeStep === 0 ? '0%' : activeStep === 1 ? '50%' : '100%' }}
              />
            </div>
          </div>

          {/* Stepper Content */}
          <div className="max-w-xl mx-auto py-4">
            {getStepContent(activeStep)}
          </div>

          {/* Navigation Buttons */}
          <div className="max-w-xl mx-auto pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={activeStep === 0}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
            >
              Back
            </button>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/users')}
                className="px-4 py-2 text-slate-650 hover:text-slate-800 text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              
              {activeStep === steps.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-all shadow-brand cursor-pointer"
                >
                  Create User
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-5 py-2.5 bg-brand-650 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-all shadow-brand cursor-pointer"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminAddUserPage;