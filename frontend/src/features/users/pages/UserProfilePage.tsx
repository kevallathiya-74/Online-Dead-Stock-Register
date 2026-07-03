import {
    EyeIcon,
    EyeSlashIcon,
    LockClosedIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';

const UserProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    employee_id: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get('/users/profile');
        const data = response.data.user;
        
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          department: data.department || '',
          employee_id: data.employee_id || ''
        });
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Failed to load profile';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const payload = {
        name: formData.name,
        phone: formData.phone
      };
      
      await api.put('/users/profile', payload);
      await refreshUser();
      toast.success('Profile updated successfully');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to update profile';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      setPasswordError(null);

      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        setPasswordError('All password fields are required');
        return;
      }

      if (passwordData.newPassword.length < 8) {
        setPasswordError('New password must be at least 8 characters long');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError('New passwords do not match');
        return;
      }

      setChangingPassword(true);

      await api.post('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      toast.success('Password changed successfully');
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to change password';
      setPasswordError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-brand-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const initialLetter = (user?.name || user?.full_name || user?.email)?.[0]?.toUpperCase() || 'U';

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-655">
        
        {/* Header Profile Title */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold font-display text-2xl shadow-brand">
            {initialLetter}
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-slate-905">My Profile</h2>
            <p className="text-slate-455 mt-1">Manage your identity credentials, contact metrics, and secure keys</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-105 text-red-800 rounded-xl font-semibold flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-505 font-bold hover:text-red-800">×</button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Personal Information Form */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card space-y-4">
            <h3 className="text-sm font-bold text-slate-905 font-display pb-2 border-b border-slate-100">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-655 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-205 rounded-xl text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-3 py-2.5 border border-slate-105 rounded-xl text-slate-400 bg-slate-50 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Email address cannot be modified.</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-205 rounded-xl text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1.5">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  placeholder="Not assigned"
                  disabled
                  className="w-full px-3 py-2.5 border border-slate-105 rounded-xl text-slate-400 bg-slate-50 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Only system admins can assign departments.</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1.5">Employee ID</label>
                <input
                  type="text"
                  value={formData.employee_id}
                  placeholder="Not assigned"
                  disabled
                  className="w-full px-3 py-2.5 border border-slate-105 rounded-xl text-slate-400 bg-slate-50 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Only system admins can modify ID parameters.</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1.5">Assigned System Role</label>
                <input
                  type="text"
                  value={user?.role || ''}
                  disabled
                  className="w-full px-3 py-2.5 border border-slate-105 rounded-xl text-slate-400 bg-slate-50 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Privileges are restricted by role settings.</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold rounded-xl cursor-pointer shadow-brand font-display"
              >
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </div>

          {/* Change Password Panel */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card space-y-4">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <LockClosedIcon className="w-5 h-5 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-905 font-display">Change Account Password</h3>
            </div>

            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-105 text-red-800 rounded-xl font-semibold flex justify-between items-center">
                <span>{passwordError}</span>
                <button onClick={() => setPasswordError(null)} className="text-red-505 font-bold hover:text-red-800">×</button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-655 mb-1.5">Current Password</label>
                <div className="relative">
                  <input
                    type={showPassword.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2.5 pr-10 border border-slate-205 rounded-xl text-slate-900 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650"
                  >
                    {showPassword.current ? <EyeSlashIcon className="w-4.5 h-4.5" /> : <EyeIcon className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2.5 pr-10 border border-slate-205 rounded-xl text-slate-900 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650"
                  >
                    {showPassword.new ? <EyeSlashIcon className="w-4.5 h-4.5" /> : <EyeIcon className="w-4.5 h-4.5" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Minimum 8 characters with capital letters and numbers.</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPassword.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2.5 pr-10 border border-slate-205 rounded-xl text-slate-900 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650"
                  >
                    {showPassword.confirm ? <EyeSlashIcon className="w-4.5 h-4.5" /> : <EyeIcon className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handlePasswordChange}
                disabled={changingPassword}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-slate-205 hover:bg-slate-50 disabled:opacity-60 text-slate-700 font-semibold rounded-xl cursor-pointer"
              >
                {changingPassword ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default UserProfilePage;
