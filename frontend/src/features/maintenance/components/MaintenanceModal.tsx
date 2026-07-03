import {
    CalendarDaysIcon,
    InformationCircleIcon,
    UserIcon,
    WrenchScrewdriverIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import maintenanceService from '../services/maintenance.service';

interface MaintenanceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (maintenanceData: any) => void;
}

interface Asset {
  _id: string;
  name: string;
  unique_asset_id: string;
  asset_type: string;
  status: string;
}

interface Technician {
  id: string;
  name: string;
  email: string;
  specialization: string[];
  current_workload: number;
}

const MaintenanceModal: React.FC<MaintenanceModalProps> = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    asset_id: '',
    maintenance_type: '',
    priority: 'Medium',
    maintenance_date: '',
    estimated_duration: 2,
    performed_by: '',
    description: '',
    cost: 0,
    downtime_impact: 'Low',
    status: 'Scheduled',
  });

  const [assets, setAssets] = useState<Asset[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (open) {
      loadFormData();
    }
  }, [open]);

  const loadFormData = async () => {
    setLoadingData(true);
    try {
      const [assetsRes, techniciansRes] = await Promise.all([
        api.get('/assets'),
        maintenanceService.getTechnicians()
      ]);
      const assetsData = assetsRes.data.data || assetsRes.data || [];
      const techniciansData = techniciansRes.data || [];
      setAssets(Array.isArray(assetsData) ? assetsData : []);
      setTechnicians(Array.isArray(techniciansData) ? techniciansData : []);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      toast.error('Failed to load assets and technicians');
    } finally {
      setLoadingData(false);
    }
  };

  const maintenanceTypes = [
    'Preventive',
    'Corrective',
    'Predictive',
    'Emergency',
    'Inspection',
    'Calibration',
    'Cleaning',
  ];

  const priorities = [
    { value: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'Medium', color: 'bg-amber-100 text-amber-800' },
    { value: 'High', color: 'bg-red-100 text-red-800' },
    { value: 'Critical', color: 'bg-red-200 text-red-900 border border-red-300' },
  ];

  const downtimeImpacts = ['Low', 'Medium', 'High'];

  if (!open) return null;

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.asset_id) {
      toast.error('Please select an asset');
      return;
    }
    if (!formData.maintenance_type) {
      toast.error('Please select maintenance type');
      return;
    }
    if (!formData.maintenance_date) {
      toast.error('Please select maintenance date');
      return;
    }

    const selectedDate = new Date(formData.maintenance_date);
    const now = new Date();
    if (selectedDate < now) {
      toast.error('Maintenance date cannot be in the past');
      return;
    }

    setLoading(true);
    try {
      const result = await maintenanceService.createMaintenance({
        asset_id: formData.asset_id,
        maintenance_type: formData.maintenance_type,
        description: formData.description,
        cost: formData.cost,
        maintenance_date: formData.maintenance_date,
        performed_by: formData.performed_by,
        priority: formData.priority,
        status: 'Scheduled',
        estimated_duration: formData.estimated_duration,
        downtime_impact: formData.downtime_impact,
      });
      
      toast.success(result.message || 'Maintenance scheduled successfully!');
      onSubmit(result.data);
      
      setFormData({
        asset_id: '',
        maintenance_type: '',
        priority: 'Medium',
        maintenance_date: '',
        estimated_duration: 2,
        performed_by: '',
        description: '',
        cost: 0,
        downtime_impact: 'Low',
        status: 'Scheduled',
      });
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to schedule maintenance';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-xs text-slate-655">
      <div className="bg-white rounded-2xl border border-slate-100 max-w-3xl w-full h-[85vh] flex flex-col shadow-card-xl animate-fade-in-up">
        
        {/* Title */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-1.5 font-bold font-display text-slate-900 text-sm">
            <WrenchScrewdriverIcon className="w-5 h-5 text-brand-600" />
            Schedule Maintenance
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form content scrollarea */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loadingData ? (
            <div className="h-full flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-brand-600 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Left Column: Basic Info */}
              <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-4 shadow-card">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CalendarDaysIcon className="w-4 h-4 text-slate-500" />
                  Basic Information
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-655 mb-1">Select Asset *</label>
                    <select
                      value={formData.asset_id}
                      onChange={(e) => handleInputChange('asset_id', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
                    >
                      <option value="">Choose Asset...</option>
                      {assets.map((a) => (
                        <option key={a._id} value={a._id}>{a.unique_asset_id} - {a.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-655 mb-1">Maintenance Type *</label>
                    <select
                      value={formData.maintenance_type}
                      onChange={(e) => handleInputChange('maintenance_type', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
                    >
                      <option value="">Select Type...</option>
                      {maintenanceTypes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-655 mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
                    >
                      {priorities.map((p) => (
                        <option key={p.value} value={p.value}>{p.value}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column: Scheduling */}
              <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-4 shadow-card">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  Scheduling & Assignment
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-655 mb-1">Maintenance Date *</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.maintenance_date}
                      onChange={(e) => handleInputChange('maintenance_date', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-655 mb-1">Estimated Duration (hours)</label>
                    <input
                      type="number"
                      step={0.5}
                      min={0.5}
                      max={24}
                      value={formData.estimated_duration}
                      onChange={(e) => handleInputChange('estimated_duration', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-655 mb-1">Assigned Technician</label>
                    <select
                      value={formData.performed_by}
                      onChange={(e) => handleInputChange('performed_by', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
                    >
                      <option value="">Select Technician...</option>
                      {technicians.map((t) => (
                        <option key={t.id} value={t.name}>{t.name} ({t.current_workload} active tasks)</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Lower Section: Details */}
              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-655 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe details of the maintenance task..."
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none"
                />
              </div>

              {/* Estimates Cost & Downtime Impact */}
              <div>
                <label className="block font-semibold text-slate-655 mb-1">Estimated Cost (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.cost}
                  onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Downtime Impact Level</label>
                <select
                  value={formData.downtime_impact}
                  onChange={(e) => handleInputChange('downtime_impact', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
                >
                  {downtimeImpacts.map((i) => <option key={i} value={i}>{i} Impact</option>)}
                </select>
              </div>

              {/* Summary Alert */}
              {formData.asset_id && formData.maintenance_type && formData.maintenance_date && (
                <div className="md:col-span-2 p-3 bg-sky-50 border border-sky-100 text-sky-850 rounded-xl flex items-start gap-2 leading-relaxed">
                  <InformationCircleIcon className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Summary: </strong> 
                    {formData.maintenance_type} task for {assets.find(a => a._id === formData.asset_id)?.name} scheduled on {new Date(formData.maintenance_date).toLocaleString()}. 
                    {formData.performed_by && ` Assigned to ${formData.performed_by}.`}
                    {formData.cost > 0 && ` Estimated cost: ₹${formData.cost.toLocaleString('en-IN')}.`}
                  </div>
                </div>
              )}

            </div>
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
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg cursor-pointer shadow-brand"
          >
            <CalendarDaysIcon className="w-4 h-4" />
            Schedule Maintenance
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceModal;