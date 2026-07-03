import {
    ArrowPathRoundedSquareIcon,
    InformationCircleIcon,
    MapPinIcon,
    UserIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../../services/api';

interface AssetTransferModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  preselectedAssetId?: string;
}

const AssetTransferModal: React.FC<AssetTransferModalProps> = ({ open, onClose, onSubmit, preselectedAssetId }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    asset: '',
    from_location: '',
    to_location: '',
    from_user: '',
    to_user: '',
    transfer_reason: 'employee_relocation',
    description: '',
    expected_transfer_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  });

  const [assets, setAssets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const steps = ['Select Asset', 'Transfer Details', 'Confirmation'];

  useEffect(() => {
    if (open) {
      loadFormData();
    }
  }, [open]);

  useEffect(() => {
    if (preselectedAssetId && assets.length > 0) {
      const asset = assets.find(a => a._id === preselectedAssetId || a.id === preselectedAssetId);
      if (asset) {
        handleInputChange('asset', asset._id || asset.id);
      }
    }
  {/* eslint-disable-next-line react-hooks/exhaustive-deps */}
  }, [preselectedAssetId, assets]);

  const loadFormData = async () => {
    try {
      setLoadingData(true);
      const [assetsRes, usersRes] = await Promise.all([
        api.get('/assets'),
        api.get('/users'),
      ]);

      const assetsData = assetsRes.data.data || assetsRes.data.assets || assetsRes.data;
      const usersData = usersRes.data.data || usersRes.data.users || usersRes.data;

      const assetsArray = Array.isArray(assetsData) ? assetsData : [];
      const usersArray = Array.isArray(usersData) ? usersData : [];

      setAssets(assetsArray);
      setUsers(usersArray);

      if (assetsArray.length > 0) {
        const uniqueLocations = [...new Set(assetsArray.map((a: any) => a.location).filter(Boolean))];
        setLocations(uniqueLocations as string[]);
      } else {
        setLocations([]);
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      toast.error('Failed to load assets and users');
      setAssets([]);
      setUsers([]);
      setLocations([]);
    } finally {
      setLoadingData(false);
    }
  };

  const transferReasons = [
    { value: 'employee_relocation', label: 'Employee Relocation' },
    { value: 'department_change', label: 'Department Change' },
    { value: 'temporary_assignment', label: 'Temporary Assignment' },
    { value: 'permanent_assignment', label: 'Permanent Assignment' },
    { value: 'maintenance_transfer', label: 'Maintenance Transfer' },
    { value: 'office_relocation', label: 'Office Relocation' },
    { value: 'project_requirement', label: 'Project Requirement' },
    { value: 'other', label: 'Other' },
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  if (!open) return null;

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'asset') {
      const selectedAsset = assets.find(asset => asset._id === value || asset.id === value);
      if (selectedAsset) {
        setFormData(prev => ({
          ...prev,
          from_location: selectedAsset.location || '',
          from_user: selectedAsset.assigned_user || '',
        }));
      }
    }
  };

  const handleNext = () => {
    if (activeStep === 0 && !formData.asset) {
      toast.error('Please select an asset to transfer');
      return;
    }
    if (activeStep === 1) {
      if (!formData.to_location || !formData.transfer_reason || !formData.description) {
        toast.error('Please fill in all required transfer details');
        return;
      }
    }
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        asset: formData.asset,
        from_user: formData.from_user || undefined,
        to_user: formData.to_user || undefined,
        from_location: formData.from_location,
        to_location: formData.to_location,
        transfer_reason: formData.transfer_reason,
        description: formData.description,
        expected_transfer_date: formData.expected_transfer_date,
        priority: formData.priority,
      };

      const response = await api.post('/asset-transfers', payload);
      const createdTransfer = response.data.data || response.data.transfer || response.data;
      
      toast.success(`Asset transfer request submitted successfully! ID: ${createdTransfer.transfer_id || 'Generated'}`);
      
      setFormData({
        asset: '',
        from_location: '',
        to_location: '',
        from_user: '',
        to_user: '',
        transfer_reason: 'employee_relocation',
        description: '',
        expected_transfer_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'medium',
      });
      setActiveStep(0);
      onSubmit();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process asset transfer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-xs text-slate-655">
      <div className="bg-white rounded-2xl border border-slate-100 max-w-2xl w-full h-[90vh] flex flex-col shadow-card-xl animate-fade-in-up">
        
        {/* Header Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-1.5">
            <ArrowPathRoundedSquareIcon className="w-5 h-5 text-brand-600" />
            Asset Transfer
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper progress */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            {steps.map((label, idx) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                  idx <= activeStep ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {idx + 1}
                </div>
                <span className={`font-semibold ${idx === activeStep ? 'text-brand-600' : 'text-slate-500'}`}>{label}</span>
                {idx < steps.length - 1 && <span className="text-slate-305 font-light">&rarr;</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loadingData ? (
            <div className="h-full flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-brand-600 animate-spin" />
            </div>
          ) : (
            <>
              {activeStep === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold text-slate-655 mb-1">Select Asset *</label>
                    <select
                      value={formData.asset}
                      onChange={(e) => handleInputChange('asset', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
                    >
                      <option value="">Choose Asset...</option>
                      {assets.map((a) => (
                        <option key={a._id || a.id} value={a._id || a.id}>
                          {a.unique_asset_id} - {a.name || `${a.manufacturer} ${a.model}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.asset && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                      <h4 className="font-bold text-slate-900">Current Location & Assignment Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <MapPinIcon className="w-5 h-5 text-sky-600 flex-shrink-0" />
                          <div>
                            <p className="text-[10px] text-slate-400">Current Location</p>
                            <p className="font-bold text-slate-900 mt-0.5">{formData.from_location || 'Not Specified'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <div>
                            <p className="text-[10px] text-slate-400">Current Assignment</p>
                            <p className="font-bold text-slate-900 mt-0.5">{formData.from_user || 'Unassigned'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeStep === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-655 mb-1">Transfer to Location *</label>
                    <input
                      type="text"
                      required
                      value={formData.to_location}
                      onChange={(e) => handleInputChange('to_location', e.target.value)}
                      placeholder="Select destination location"
                      className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-655 mb-1">Transfer to User</label>
                    <select
                      value={formData.to_user}
                      onChange={(e) => handleInputChange('to_user', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
                    >
                      <option value="">Select User...</option>
                      {users.map((u) => (
                        <option key={u._id || u.id} value={u._id || u.id}>{u.name || u.email}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-655 mb-1">Transfer Reason *</label>
                    <select
                      value={formData.transfer_reason}
                      onChange={(e) => handleInputChange('transfer_reason', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
                    >
                      {transferReasons.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-655 mb-1">Expected Transfer Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.expected_transfer_date}
                      onChange={(e) => handleInputChange('expected_transfer_date', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-655 mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
                    >
                      {priorities.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-655 mb-1">Description *</label>
                    <textarea
                      rows={3}
                      required
                      maxLength={500}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Explain details of transfer request..."
                      className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 text-right">{formData.description.length}/500 characters</p>
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-4">
                  <div className="p-3 bg-sky-50 border border-sky-100 text-sky-850 rounded-xl flex items-start gap-2">
                    <InformationCircleIcon className="w-4.5 h-4.5 text-sky-600 mt-0.5 flex-shrink-0" />
                    <p>Please review the transfer details before confirming. A transfer request will require approval.</p>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-4 shadow-card text-slate-700">
                    <h4 className="font-bold text-slate-900 border-b border-slate-50 pb-2">Asset Details</h4>
                    <p className="font-semibold text-slate-805">
                      {assets.find(a => (a._id || a.id) === formData.asset)?.unique_asset_id} - {assets.find(a => (a._id || a.id) === formData.asset)?.name}
                    </p>

                    <h4 className="font-bold text-slate-900 border-b border-slate-50 pb-2 pt-2">Routing Parameters</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-slate-400">From Location:</p>
                        <p className="font-bold mt-0.5">{formData.from_location}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">To Location:</p>
                        <p className="font-bold mt-0.5">{formData.to_location}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">From User:</p>
                        <p className="font-bold mt-0.5">{formData.from_user || 'Unassigned'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">To User:</p>
                        <p className="font-bold mt-0.5">{users.find(u => (u._id || u.id) === formData.to_user)?.name || 'Unassigned'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Priority:</p>
                        <p className="font-bold mt-0.5 capitalize">{formData.priority}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Expected Date:</p>
                        <p className="font-bold mt-0.5">{new Date(formData.expected_transfer_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0 bg-slate-50/50 font-semibold">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-slate-205 text-slate-705 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          {activeStep > 0 && (
            <button
              onClick={handleBack}
              disabled={loading}
              className="px-4 py-2 border border-slate-205 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Back
            </button>
          )}
          {activeStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg cursor-pointer shadow-brand"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-lg cursor-pointer shadow-brand"
            >
              {loading && <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
              {loading ? 'Processing Transfer...' : 'Confirm Transfer'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetTransferModal;