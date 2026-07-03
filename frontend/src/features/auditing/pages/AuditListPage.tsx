import {
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    MagnifyingGlassIcon,
    PencilSquareIcon,
    XCircleIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import auditorService from '../services/auditorService';
import type { AuditItem } from '../../../types';

const AuditListPage: React.FC = () => {
  const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AuditItem | null>(null);
  const [editData, setEditData] = useState({
    condition: '',
    status: '',
    notes: '',
  });
  
  // CSV Import states
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditItems();
  }, []);

  useEffect(() => {
    filterItems();
  {/* eslint-disable-next-line react-hooks/exhaustive-deps */}
  }, [searchQuery, statusFilter, auditItems]);

  const fetchAuditItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await auditorService.getAuditItems();
      setAuditItems(data);
    } catch (err: any) {
      setError((err as any).response?.data?.message || 'Failed to load audit items');
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = auditItems;

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.asset_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.asset_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.assigned_user.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    setFilteredItems(filtered);
  };

  const handleEditClick = (item: AuditItem) => {
    setSelectedItem(item);
    setEditData({
      condition: (item.condition?.toLowerCase() || 'good').toLowerCase(),
      status: (item.status?.toLowerCase() || 'pending').toLowerCase(),
      notes: item.notes || '',
    });
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setSelectedItem(null);
    setEditData({
      condition: '',
      status: '',
      notes: '',
    });
  };

  const handleEditSave = async () => {
    if (!selectedItem) return;

    try {
      let assetStatus = 'Available';
      switch (editData.status.toLowerCase()) {
        case 'verified':
          assetStatus = 'Active';
          break;
        case 'pending':
          assetStatus = 'Available';
          break;
        case 'discrepancy':
          assetStatus = 'Under Maintenance';
          break;
        case 'missing':
          assetStatus = 'Damaged';
          break;
        default:
          assetStatus = 'Available';
      }

      await auditorService.updateAuditStatus(selectedItem.id, {
        condition: editData.condition.toLowerCase(),
        status: assetStatus,
        notes: editData.notes,
        last_audit_date: new Date().toISOString(),
      });

      setAuditItems(prevItems => 
        prevItems.map(item => 
          item.id === selectedItem.id 
            ? {
                ...item,
                condition: editData.condition.toLowerCase(),
                status: editData.status.toLowerCase() as 'verified' | 'pending' | 'discrepancy' | 'missing',
                notes: editData.notes,
                last_audit_date: new Date().toISOString(),
              }
            : item
        )
      );

      toast.success('Audit status updated successfully');
      handleEditClose();
      await fetchAuditItems();
    } catch (err: any) {
      toast.error((err as any).response?.data?.message || 'Failed to update audit status');
    }
  };

  const handleExport = async () => {
    try {
      const blob: any = await auditorService.exportAuditReport('csv');
      const url = URL.createObjectURL(blob as Blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err: any) {
      toast.error('Failed to export audit report');
    }
  };

  const handleImportClick = () => {
    setImportDialogOpen(true);
    setImportFile(null);
    setImportErrors([]);
    setImportSuccess(null);
  };

  const handleImportClose = () => {
    setImportDialogOpen(false);
    setImportFile(null);
    setImportErrors([]);
    setImportSuccess(null);
    setImportProgress(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size exceeds 15MB limit');
      return;
    }

    setImportFile(file);
    setImportErrors([]);
    setImportSuccess(null);
  };

  const handleImportSubmit = async () => {
    if (!importFile) {
      toast.error('Please select a file to import');
      return;
    }

    setImportProgress(true);
    setImportErrors([]);
    setImportSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('format', 'csv');

      const result = (await auditorService.importAuditData(formData)) as any;

      if (result.errors && result.errors.length > 0) {
        setImportErrors(result.errors);
        toast.warning(`Import completed with ${result.errors.length} errors`);
      } else {
        setImportSuccess(`Successfully imported ${result.imported || 0} records`);
        setTimeout(() => {
          fetchAuditItems();
          handleImportClose();
        }, 2000);
      }
    } catch (err: any) {
      const errorMsg = (err as any).response?.data?.message || 'Failed to import data';
      setImportErrors([errorMsg]);
      toast.error(errorMsg);
    } finally {
      setImportProgress(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
      case 'pending': return <ClockIcon className="w-4 h-4 text-amber-500" />;
      case 'discrepancy': return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
      case 'missing': return <XCircleIcon className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-50 text-green-700 border border-green-105';
      case 'pending': return 'bg-amber-50 text-amber-705 border border-amber-100';
      case 'discrepancy': return 'bg-red-50 text-red-700 border border-red-105';
      case 'missing': return 'bg-red-50 text-red-700 border border-red-105';
      default: return 'bg-slate-50 text-slate-705 border border-slate-105';
    }
  };

  const getConditionBadgeClass = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case 'excellent': return 'bg-green-50 text-green-705 border border-green-100';
      case 'good': return 'bg-blue-50 text-blue-700 border border-blue-105';
      case 'fair': return 'bg-amber-50 text-amber-705 border border-amber-100';
      case 'poor': return 'bg-red-50 text-red-655 border border-red-100';
      case 'damaged': return 'bg-red-50 text-red-700 border border-red-105';
      default: return 'bg-slate-50 text-slate-655 border border-slate-100';
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

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-655">
        
        {/* Header Action section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-905">Audit Registry</h2>
            <p className="text-slate-455 mt-1">View and manage asset verification audits ({filteredItems.length} items)</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleImportClick}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-205 text-slate-705 font-semibold rounded-xl bg-white hover:bg-slate-50 cursor-pointer"
            >
              <ArrowUpTrayIcon className="w-4 h-4 text-brand-600" />
              Import CSV
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl cursor-pointer shadow-brand"
            >
              <ArrowDownTrayIcon className="w-4.5 h-4.5" />
              Export CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-105 text-red-800 rounded-xl font-semibold flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-505 font-bold hover:text-red-800">×</button>
          </div>
        )}

        {/* Filter controls */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-card flex gap-3 items-center">
          <div className="flex-1 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <MagnifyingGlassIcon className="w-4.5 h-4.5" />
            </span>
            <input
              type="text"
              placeholder="Search by Asset ID, Name, Location, or User..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-205 rounded-xl bg-slate-50/50"
            />
          </div>

          <div className="w-56">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="discrepancy">Discrepancy</option>
              <option value="missing">Missing</option>
            </select>
          </div>
        </div>

        {/* Audit list table */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
          <div className="overflow-x-auto border border-slate-50 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase">
                  <th className="pb-3 pt-2 pl-4">Asset ID</th>
                  <th className="pb-3 pt-2">Asset Name</th>
                  <th className="pb-3 pt-2">Location</th>
                  <th className="pb-3 pt-2">Assigned User</th>
                  <th className="pb-3 pt-2">Last Audit</th>
                  <th className="pb-3 pt-2">Condition</th>
                  <th className="pb-3 pt-2">Status</th>
                  <th className="pb-3 pt-2 text-center pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 font-semibold">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">No audit items found matching criteria.</td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-55/50">
                      <td className="py-3.5 pl-4 font-mono font-bold text-slate-900 select-all">{item.asset_id}</td>
                      <td className="py-3.5 text-slate-900 font-bold">{item.asset_name}</td>
                      <td className="py-3.5 text-slate-805">{item.location}</td>
                      <td className="py-3.5 text-slate-805">{item.assigned_user}</td>
                      <td className="py-3.5 text-slate-655">
                        {item.last_audit_date && item.last_audit_date !== '1970-01-01'
                          ? format(new Date(item.last_audit_date), 'MMM dd, yyyy')
                          : 'Never'}
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex px-2 py-0.5 border rounded text-[9px] font-bold uppercase ${getConditionBadgeClass(item.condition)}`}>
                          {item.condition || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusBadgeClass(item.status?.toLowerCase() || 'pending')}`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(item.status?.toLowerCase() || 'pending')}
                            {item.status ? item.status.toUpperCase() : 'PENDING'}
                          </span>
                        </span>
                      </td>
                      <td className="py-3.5 text-center pr-4">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                          title="Edit Audit Details"
                        >
                          <PencilSquareIcon className="w-4.5 h-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Update Audit Dialog Modal */}
        {editDialogOpen && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full p-6 shadow-card-xl space-y-4 animate-fade-in-up">
              
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-base font-bold font-display text-slate-900">Update Audit Status</h3>
                <button onClick={handleEditClose} className="p-1 text-slate-400 hover:text-slate-655 hover:bg-slate-50 rounded-lg">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 text-slate-700 text-xs">
                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Asset ID Reference</label>
                  <input
                    type="text"
                    disabled
                    value={selectedItem.asset_id}
                    className="w-full px-3 py-2 border border-slate-105 rounded-xl bg-slate-50 text-slate-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Asset Name</label>
                  <input
                    type="text"
                    disabled
                    value={selectedItem.asset_name}
                    className="w-full px-3 py-2 border border-slate-105 rounded-xl bg-slate-50 text-slate-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Asset Physical Condition</label>
                  <select
                    value={editData.condition}
                    onChange={(e) => setEditData({ ...editData, condition: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Audit Status</label>
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
                  >
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="discrepancy">Discrepancy</option>
                    <option value="missing">Missing</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Audit Log Comments</label>
                  <textarea
                    rows={3}
                    value={editData.notes}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    placeholder="Enter audit logs remarks..."
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-105 font-semibold">
                <button
                  onClick={handleEditClose}
                  className="px-4 py-2 border border-slate-205 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg cursor-pointer shadow-brand font-display"
                >
                  Save Changes
                </button>
              </div>

            </div>
          </div>
        )}

        {/* CSV Import Dialog Modal */}
        {importDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full p-6 shadow-card-xl space-y-4 animate-fade-in-up">
              
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-base font-bold font-display text-slate-900">Import Audit Data</h3>
                <button onClick={handleImportClose} className="p-1 text-slate-400 hover:text-slate-655 hover:bg-slate-50 rounded-lg">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 text-slate-700 text-xs">
                
                {/* Upload drag-n-drop box */}
                <div 
                  onClick={() => document.getElementById('csv-file-input')?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:bg-slate-50 transition-all ${
                    importFile ? 'border-brand-500 bg-brand-50/10' : 'border-slate-200'
                  }`}
                >
                  <input
                    id="csv-file-input"
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <ArrowUpTrayIcon className="w-8 h-8 mx-auto text-brand-600 mb-2" />
                  <p className="font-bold text-slate-800">{importFile ? importFile.name : 'Click to select CSV file'}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Supports CSV files only (Max 15MB)</p>
                  {importFile && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-brand-50 border border-brand-100 text-brand-700 font-bold rounded-full text-[9px]">
                      {(importFile.size / 1024).toFixed(1)} KB
                    </span>
                  )}
                </div>

                <div className="p-3.5 bg-blue-50 border border-blue-105 rounded-xl font-semibold space-y-1">
                  <p className="font-bold text-slate-800">CSV Template Requirements:</p>
                  <ul className="list-disc pl-4 text-slate-700 space-y-0.5">
                    <li>Headers row required.</li>
                    <li>Required fields: Asset ID, Asset Name, Location</li>
                    <li>Formats: YYYY-MM-DD for date fields</li>
                  </ul>
                </div>

                {importSuccess && (
                  <div className="p-2.5 bg-green-50 border border-green-105 text-green-800 rounded-xl font-bold">
                    {importSuccess}
                  </div>
                )}

                {importErrors.length > 0 && (
                  <div className="p-2.5 bg-red-50 border border-red-105 text-red-800 rounded-xl font-semibold space-y-1">
                    <p className="font-bold">Errors found ({importErrors.length}):</p>
                    <div className="max-h-24 overflow-y-auto space-y-0.5">
                      {importErrors.map((err, idx) => <p key={idx}>• {err}</p>)}
                    </div>
                  </div>
                )}

                {importProgress && (
                  <div className="flex items-center gap-2 text-slate-500 font-bold">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-brand-600 animate-spin" />
                    <span>Importing audit logs...</span>
                  </div>
                )}

              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-105 font-semibold">
                <button
                  onClick={handleImportClose}
                  disabled={importProgress}
                  className="px-4 py-2 border border-slate-205 hover:bg-slate-50 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportSubmit}
                  disabled={!importFile || importProgress}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg cursor-pointer shadow-brand disabled:opacity-50 font-display"
                >
                  {importProgress ? 'Importing...' : 'Upload & Import'}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default AuditListPage;
