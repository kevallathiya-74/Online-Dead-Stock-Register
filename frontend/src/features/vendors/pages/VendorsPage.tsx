import {
    BuildingOfficeIcon,
    DocumentTextIcon,
    EllipsisVerticalIcon,
    EnvelopeIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    PencilSquareIcon,
    PlusIcon,
    TrashIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { usePolling } from '../../../hooks/usePolling';
import api from '../../../services/api';
import VendorFormDialog from '../components/VendorFormDialog';

interface VendorFormData {
  vendor_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  payment_terms: string;
  is_active: boolean;
}

interface Vendor {
  _id: string;
  vendor_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  };
  payment_terms?: string;
  is_active: boolean;
  created_at: string;
}

const VendorsPage = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeMenuVendorId, setActiveMenuVendorId] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const loadVendors = async () => {
    setLoading(true);
    try {
      const response = await api.get('/vendors');
      const vendorData = response.data.data || response.data;
      setVendors(Array.isArray(vendorData) ? vendorData : []);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  usePolling(loadVendors, {
    interval: 30000,
    enabled: true
  });

  useEffect(() => {
    loadVendors();
  }, []);

  const handleAddVendor = async (formData: VendorFormData) => {
    try {
      const response = await api.post('/vendors', formData);
      const newVendor = response.data?.data || response.data;
      setVendors((prev) => [...prev, newVendor]);
      toast.success('Vendor added successfully');
      setFormDialogOpen(false);
    } catch (error: any) {
      const errObj = error as { response?: { data?: { message?: string } } };
      toast.error(errObj.response?.data?.message || 'Failed to add vendor');
      throw error;
    }
  };

  const handleUpdateVendor = async (formData: VendorFormData) => {
    if (!selectedVendor) return;
    try {
      const response = await api.put(`/vendors/${selectedVendor._id}`, formData);
      const updatedVendor = response.data?.data || response.data;
      setVendors((prev) =>
        prev.map((v) => (v._id === selectedVendor._id ? updatedVendor : v))
      );
      toast.success('Vendor updated successfully');
      setFormDialogOpen(false);
      setSelectedVendor(null);
    } catch (error: any) {
      const errObj = error as { response?: { data?: { message?: string } } };
      toast.error(errObj.response?.data?.message || 'Failed to update vendor');
      throw error;
    }
  };

  const handleDeleteVendor = async () => {
    if (!selectedVendor) return;
    try {
      await api.delete(`/vendors/${selectedVendor._id}`);
      setVendors((prev) => prev.filter((v) => v._id !== selectedVendor._id));
      toast.success('Vendor deleted successfully');
      setDeleteConfirmOpen(false);
      setSelectedVendor(null);
    } catch { /* ignore */ }
  };

  const openAddDialog = () => {
    setSelectedVendor(null);
    setIsEditMode(false);
    setFormDialogOpen(true);
  };

  const openEditDialog = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsEditMode(true);
    setFormDialogOpen(true);
    setActiveMenuVendorId(null);
  };

  const openDeleteConfirm = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setDeleteConfirmOpen(true);
    setActiveMenuVendorId(null);
  };

  const handleGenerateReport = (vendor: Vendor) => {
    const reportContent = `
VENDOR REPORT
=============

Vendor Information:
------------------
Name: ${vendor.vendor_name}
Contact Person: ${vendor.contact_person || 'N/A'}
Email: ${vendor.email || 'N/A'}
Phone: ${vendor.phone || 'N/A'}

Address:
--------
${vendor.address?.street || 'N/A'}
${vendor.address?.city || ''} ${vendor.address?.state || ''} ${vendor.address?.zip_code || ''}
${vendor.address?.country || ''}

Business Details:
----------------
Payment Terms: ${vendor.payment_terms || 'N/A'}
Status: ${vendor.is_active ? 'Active' : 'Inactive'}
Vendor ID: ${vendor._id}
Created: ${vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : 'N/A'}

Generated on: ${new Date().toLocaleString()}
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vendor-report-${vendor.vendor_name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success(`Report generated for ${vendor.vendor_name}`);
    setActiveMenuVendorId(null);
  };

  const handleSendEmail = (vendor: Vendor) => {
    const subject = encodeURIComponent(`Regarding: ${vendor.vendor_name}`);
    const body = encodeURIComponent(`Dear ${vendor.contact_person || vendor.vendor_name},\n\n\n\nBest regards,\nOnline Dead Stock Register Team`);
    const email = vendor.email;
    
    if (!email) {
      toast.error('No email address found for this vendor');
      return;
    }
    
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    toast.success(`Opening email to ${vendor.vendor_name}`);
    setActiveMenuVendorId(null);
  };

  const filteredVendors = vendors.filter((vendor) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      vendor.vendor_name?.toLowerCase().includes(searchLower) ||
      vendor.contact_person?.toLowerCase().includes(searchLower) ||
      vendor.email?.toLowerCase().includes(searchLower) ||
      vendor._id?.toLowerCase().includes(searchLower);
    
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'Active' && vendor.is_active) ||
      (selectedStatus === 'Inactive' && !vendor.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const handleViewVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setViewDialogOpen(true);
  };

  const stats = {
    totalVendors: vendors.length,
    activeVendors: vendors.filter(v => v.is_active).length,
    inactiveVendors: vendors.filter(v => !v.is_active).length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-655">
        
        {/* Header section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-900">Vendor Management</h2>
            <p className="text-slate-450 mt-1">Manage suppliers, vendors, and business partners</p>
          </div>
          <button
            onClick={openAddDialog}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl cursor-pointer shadow-brand"
          >
            <PlusIcon className="w-4.5 h-4.5" />
            Add New Vendor
          </button>
        </div>

        {/* Statistics Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Vendors</p>
              <h3 className="text-lg font-bold text-slate-900 font-display mt-1">{loading ? '...' : stats.totalVendors}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <BuildingOfficeIcon className="w-5.5 h-5.5" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Vendors</p>
              <h3 className="text-lg font-bold text-slate-900 font-display mt-1">{loading ? '...' : stats.activeVendors}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <BuildingOfficeIcon className="w-5.5 h-5.5" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Inactive Vendors</p>
              <h3 className="text-lg font-bold text-slate-900 font-display mt-1">{loading ? '...' : stats.inactiveVendors}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
              <BuildingOfficeIcon className="w-5.5 h-5.5" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Latest Registration</p>
              <p className="text-xs font-bold text-slate-805 mt-1.5">
                {vendors.length > 0 ? new Date(vendors[0].created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <BuildingOfficeIcon className="w-5.5 h-5.5" />
            </div>
          </div>
        </div>

        {/* Filters control row */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-card flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <MagnifyingGlassIcon className="w-4.5 h-4.5" />
            </span>
            <input
              type="text"
              placeholder="Search vendors by name, email, or identifier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-205 rounded-xl bg-slate-50/50"
            />
          </div>

          <div className="w-full md:w-48">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>

          <p className="text-slate-450 font-medium">Showing {filteredVendors.length} of {vendors.length} vendors</p>
        </div>

        {/* Vendors Directory grid table */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-bold text-slate-900 font-display mb-3">Vendor Directory</h3>
          
          <div className="overflow-x-auto border border-slate-50 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase">
                  <th className="pb-3 pt-2 pl-4">Vendor Name</th>
                  <th className="pb-3 pt-2">Contact Person</th>
                  <th className="pb-3 pt-2">Email</th>
                  <th className="pb-3 pt-2">Phone</th>
                  <th className="pb-3 pt-2">Payment Terms</th>
                  <th className="pb-3 pt-2">Status</th>
                  <th className="pb-3 pt-2 text-center pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {loading ? (
                  [1, 2, 3].map((idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-4 pl-4"><div className="h-4 bg-slate-100 rounded w-28" /></td>
                      <td className="py-4"><div className="h-4 bg-slate-100 rounded w-20" /></td>
                      <td className="py-4"><div className="h-4 bg-slate-100 rounded w-32" /></td>
                      <td className="py-4"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                      <td className="py-4"><div className="h-4 bg-slate-100 rounded w-16" /></td>
                      <td className="py-4"><div className="h-4 bg-slate-100 rounded w-12" /></td>
                      <td className="py-4"><div className="h-4 bg-slate-100 rounded w-10" /></td>
                    </tr>
                  ))
                ) : filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">No vendors found.</td>
                  </tr>
                ) : (
                  filteredVendors.map((vendor) => (
                    <tr key={vendor._id} className="hover:bg-slate-55/50">
                      <td className="py-3.5 pl-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center">
                            {vendor.vendor_name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{vendor.vendor_name}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">ID: {vendor._id.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 font-medium text-slate-700">{vendor.contact_person || 'N/A'}</td>
                      <td className="py-3.5 font-mono">{vendor.email || 'N/A'}</td>
                      <td className="py-3.5">{vendor.phone || 'N/A'}</td>
                      <td className="py-3.5 font-medium">{vendor.payment_terms || 'N/A'}</td>
                      <td className="py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          vendor.is_active ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-slate-100 text-slate-600 border border-slate-150'
                        }`}>
                          {vendor.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 text-center pr-4 relative">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewVendor(vendor)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                            title="View Details"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditDialog(vendor)}
                            className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                            title="Edit"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setActiveMenuVendorId(activeMenuVendorId === vendor._id ? null : vendor._id)}
                            className="p-1.5 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-lg cursor-pointer"
                            title="More Actions"
                          >
                            <EllipsisVerticalIcon className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Inline context action popup */}
                        {activeMenuVendorId === vendor._id && (
                          <div className="absolute right-12 top-10 z-10 w-44 bg-white border border-slate-100 rounded-xl shadow-card p-1 text-left space-y-0.5">
                            <button
                              onClick={() => handleGenerateReport(vendor)}
                              className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                            >
                              <DocumentTextIcon className="w-4 h-4 text-slate-400" />
                              Generate Report
                            </button>
                            <button
                              onClick={() => handleSendEmail(vendor)}
                              className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                            >
                              <EnvelopeIcon className="w-4 h-4 text-slate-400" />
                              Send Email
                            </button>
                            <button
                              onClick={() => openDeleteConfirm(vendor)}
                              className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-650 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
                            >
                              <TrashIcon className="w-4 h-4" />
                              Delete Vendor
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* View Details Dialog popup */}
        {viewDialogOpen && selectedVendor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 max-w-xl w-full p-6 shadow-card-xl space-y-4 animate-fade-in-up">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-base font-bold font-display text-slate-900">Vendor Details</h3>
                <button onClick={() => setViewDialogOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-slate-900">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400">Vendor ID:</p>
                      <p className="font-semibold text-slate-805 mt-0.5">{selectedVendor._id}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Vendor Name:</p>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedVendor.vendor_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Contact Person:</p>
                      <p className="font-semibold text-slate-805 mt-0.5">{selectedVendor.contact_person || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Status:</p>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold mt-1 ${
                        selectedVendor.is_active ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-slate-150 text-slate-655 border border-slate-205'
                      }`}>{selectedVendor.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-slate-900">Contact & Address Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400">Email:</p>
                      <p className="font-semibold text-slate-805 mt-0.5">{selectedVendor.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Phone:</p>
                      <p className="font-semibold text-slate-805 mt-0.5">{selectedVendor.phone || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-slate-400">Address:</p>
                      <p className="font-semibold text-slate-805 mt-0.5">
                        {selectedVendor.address ? (
                          <>
                            {selectedVendor.address.street && `${selectedVendor.address.street}, `}
                            {selectedVendor.address.city && `${selectedVendor.address.city}, `}
                            {selectedVendor.address.state && `${selectedVendor.address.state} `}
                            {selectedVendor.address.zip_code && `${selectedVendor.address.zip_code}, `}
                            {selectedVendor.address.country}
                          </>
                        ) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-slate-900">Business Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400">Payment Terms:</p>
                      <p className="font-semibold text-slate-805 mt-0.5">{selectedVendor.payment_terms || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Registration Date:</p>
                      <p className="font-semibold text-slate-805 mt-0.5">
                        {selectedVendor.created_at ? new Date(selectedVendor.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 font-semibold">
                <button
                  onClick={() => setViewDialogOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    window.location.href = `mailto:${selectedVendor.email}`;
                  }}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg cursor-pointer shadow-brand"
                >
                  <EnvelopeIcon className="w-4.5 h-4.5" />
                  Send Email
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation popup */}
        {deleteConfirmOpen && selectedVendor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full p-6 shadow-card-xl space-y-4 animate-fade-in-up">
              <h3 className="text-base font-bold font-display text-slate-905 border-b border-slate-50 pb-2">Confirm Delete</h3>
              <p className="text-slate-655 leading-relaxed">
                Are you sure you want to delete vendor <strong className="text-slate-900">{selectedVendor.vendor_name}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 font-semibold">
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteVendor}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Vendor Form popup */}
        <VendorFormDialog
          open={formDialogOpen}
          onClose={() => {
            setFormDialogOpen(false);
            setSelectedVendor(null);
            setIsEditMode(false);
          }}
          onSubmit={isEditMode ? handleUpdateVendor : handleAddVendor}
          initialData={selectedVendor ? {
            vendor_name: selectedVendor.vendor_name,
            contact_person: selectedVendor.contact_person || '',
            email: selectedVendor.email || '',
            phone: selectedVendor.phone || '',
            address: {
              street: selectedVendor.address?.street || '',
              city: selectedVendor.address?.city || '',
              state: selectedVendor.address?.state || '',
              zip_code: selectedVendor.address?.zip_code || '',
              country: selectedVendor.address?.country || ''
            },
            payment_terms: selectedVendor.payment_terms || '',
            is_active: selectedVendor.is_active
          } : undefined}
          isEdit={isEditMode}
        />

      </div>
    </DashboardLayout>
  );
};

export default VendorsPage;