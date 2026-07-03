import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AssetQRCodeDialog from '../components/AssetQRCodeDialog';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import api from '../../../services/api';
import { assetUpdateService } from '../services/assetUpdateService';

const AddAssetPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [createdAssetForQr, setCreatedAssetForQr] = useState<unknown | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    unique_asset_id: '',
    asset_type: '',
    category: '',
    manufacturer: '',
    model: '',
    serial_number: '',
    purchase_date: '',
    purchase_cost: '',
    warranty_expiry: '',
    status: 'Available',
    condition: 'excellent',
    location: '',
    department: '',
    description: '',
  });

  const assetTypes = ['IT Equipment', 'Office Equipment', 'Mobile Device', 'Furniture', 'Machinery', 'Vehicle', 'Other'];
  const departments = ['INVENTORY', 'IT', 'ADMIN', 'VENDOR'];
  const conditions = ['excellent', 'good', 'fair', 'poor', 'damaged'];
  const statuses = ['Available', 'Active', 'Under Maintenance', 'Damaged', 'Ready for Scrap'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.unique_asset_id || !formData.asset_type) {
      toast.error('Please fill in all required fields (Name, Asset ID, Type)');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        purchase_cost: parseFloat(formData.purchase_cost) || 0,
      };

      const response = await api.post('/assets', payload);
      const createdAsset = response.data.data || response.data;

      assetUpdateService.notifyUpdate(createdAsset.id || createdAsset._id, { type: 'created', asset: createdAsset });

      setCreatedAssetForQr(createdAsset);
      setQrOpen(true);
      toast.success(`Asset "${formData.name}" created successfully!`);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create asset';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/assets');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-900">
            Add New Asset
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Register a new asset in the inventory system
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold font-display text-slate-900">Basic Information</h3>
                <hr className="border-slate-100 mt-2" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-655 mb-1.5">Asset Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Dell XPS 15 Laptop"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-655 mb-1.5">Unique Asset ID *</label>
                  <input
                    type="text"
                    name="unique_asset_id"
                    required
                    value={formData.unique_asset_id}
                    onChange={handleChange}
                    placeholder="e.g. AST-001"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-655 mb-1.5">Asset Type *</label>
                  <select
                    name="asset_type"
                    required
                    value={formData.asset_type}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option value="">Select Asset Type</option>
                    {assetTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-655 mb-1.5">Category</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="e.g. Laptop, Desktop, Printer"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Manufacturer Details */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold font-display text-slate-900">Manufacturer Details</h3>
                <hr className="border-slate-100 mt-2" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-655 mb-1.5">Manufacturer</label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleChange}
                    placeholder="e.g. Dell, HP, Apple"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-655 mb-1.5">Model</label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="e.g. XPS 15, ThinkPad X1"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-655 mb-1.5">Serial Number</label>
                  <input
                    type="text"
                    name="serial_number"
                    value={formData.serial_number}
                    onChange={handleChange}
                    placeholder="e.g. SN123456789"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Purchase Information */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold font-display text-slate-900">Purchase Information</h3>
                <hr className="border-slate-100 mt-2" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-655 mb-1.5">Purchase Date</label>
                  <input
                    type="date"
                    name="purchase_date"
                    value={formData.purchase_date}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-655 mb-1.5">Purchase Value (₹)</label>
                  <input
                    type="number"
                    name="purchase_cost"
                    value={formData.purchase_cost}
                    onChange={handleChange}
                    placeholder="e.g. 50000"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-655 mb-1.5">Warranty Expiry</label>
                  <input
                    type="date"
                    name="warranty_expiry"
                    value={formData.warranty_expiry}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Status and Location */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold font-display text-slate-900">Status and Location</h3>
                <hr className="border-slate-100 mt-2" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-655 mb-1.5">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-655 mb-1.5">Condition</label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    {conditions.map(condition => (
                      <option key={condition} value={condition}>{condition}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-655 mb-1.5">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. IT Department - Floor 2"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-655 mb-1.5">Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-655 mb-1.5">Description</label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="Additional details about the asset..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Submit Toolbar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-all shadow-brand cursor-pointer"
              >
                {loading ? 'Creating...' : 'Create Asset'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <AssetQRCodeDialog
        open={qrOpen}
        asset={createdAssetForQr}
        onClose={() => {
          setQrOpen(false);
          setCreatedAssetForQr(null);
          navigate('/assets');
        }}
      />
    </DashboardLayout>
  );
};

export default AddAssetPage;
