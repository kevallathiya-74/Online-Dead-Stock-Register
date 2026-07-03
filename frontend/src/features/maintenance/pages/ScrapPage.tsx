import {
    AdjustmentsHorizontalIcon,
    ArrowDownTrayIcon,
    CheckCircleIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import scrapService, { ScrapItem } from '../services/scrap.service';

const steps = ['Request Submitted', 'Under Review', 'Approved', 'Disposal Process', 'Completed'];

const ScrapPage = () => {
  const [scrapItems, setScrapItems] = useState<ScrapItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedItem, setSelectedItem] = useState<ScrapItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // New scrap request form state
  const [newRequestForm, setNewRequestForm] = useState({
    assetId: '',
    scrapReason: '',
    estimatedValue: '',
    disposalMethod: '',
    notes: ''
  });

  useEffect(() => {
    loadScrapData();
    const interval = setInterval(loadScrapData, 30000);
    return () => clearInterval(interval);
  {/* eslint-disable-next-line react-hooks/exhaustive-deps */}
  }, []);

  const loadScrapData = async () => {
    try {
      setLoading(true);
      const response = await scrapService.getScrapItems({
        search: searchTerm,
        status: statusFilter === 'All' ? undefined : statusFilter
      });
      setScrapItems(response.data || []);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        toast.error(error.response?.data?.message || 'Failed to load scrap data');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Pending Approval': return 'bg-amber-50 text-amber-705 border border-amber-100';
      case 'Approved for Scrap': return 'bg-blue-50 text-blue-700 border border-blue-105';
      case 'In Disposal Process': return 'bg-purple-50 text-purple-700 border border-purple-105';
      case 'Disposed': case 'Sold': case 'Recycled': return 'bg-green-50 text-green-700 border border-green-105';
      default: return 'bg-slate-50 text-slate-705 border border-slate-105';
    }
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'Pending Approval': return 1;
      case 'Approved for Scrap': return 2;
      case 'In Disposal Process': return 3;
      case 'Disposed': case 'Sold': case 'Recycled': return 4;
      default: return 0;
    }
  };

  const getReasonBadgeClass = (reason: string) => {
    switch (reason) {
      case 'End of Life': return 'bg-blue-50 text-blue-700 border border-blue-100';
      case 'Beyond Repair': return 'bg-red-50 text-red-700 border border-red-100';
      case 'Obsolete': return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'Policy Compliance': return 'bg-purple-50 text-purple-700 border border-purple-100';
      case 'Accident Damage': return 'bg-red-50 text-red-700 border border-red-100';
      default: return 'bg-slate-50 text-slate-655 border border-slate-100';
    }
  };

  const filteredItems = scrapItems.filter((item) => {
    const matchesSearch = 
      item.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (item: ScrapItem) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setSelectedItem(null);
    setIsDetailModalOpen(false);
  };

  const handleApproveScrap = async (item: ScrapItem) => {
    try {
      const result = await scrapService.approveScrapItem(item._id);
      toast.success(result.message || `Scrap request approved for ${item.assetName}`);
      await loadScrapData();
    } catch { /* ignore */ }
  };

  const handleExportReport = async () => {
    try {
      toast.info('Preparing scrap report...');
      const blob = await scrapService.exportScrapReport('csv', {
        search: searchTerm,
        status: statusFilter === 'All' ? undefined : statusFilter
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `scrap-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Scrap report downloaded successfully');
    } catch { /* ignore */ }
  };

  const handleNewScrapRequest = () => {
    setNewRequestForm({
      assetId: '',
      scrapReason: '',
      estimatedValue: '',
      disposalMethod: '',
      notes: ''
    });
    setIsNewRequestModalOpen(true);
  };

  const handleCloseNewRequestModal = () => {
    setIsNewRequestModalOpen(false);
  };

  const handleSubmitNewRequest = async () => {
    try {
      if (!newRequestForm.assetId || !newRequestForm.scrapReason) {
        toast.error('Please fill in all required fields');
        return;
      }
      await scrapService.createScrapRequest({
        assetId: newRequestForm.assetId,
        scrapReason: newRequestForm.scrapReason,
        estimatedValue: newRequestForm.estimatedValue ? parseFloat(newRequestForm.estimatedValue) : undefined,
        disposalMethod: newRequestForm.disposalMethod || undefined,
        notes: newRequestForm.notes || undefined
      });
      toast.success('Scrap request created successfully');
      setIsNewRequestModalOpen(false);
      await loadScrapData();
    } catch { /* ignore */ }
  };

  const pendingCount = scrapItems.filter(i => i.status === 'Pending Approval').length;
  const approvedCount = scrapItems.filter(i => i.status === 'Approved for Scrap').length;
  const inProcessCount = scrapItems.filter(i => i.status === 'In Disposal Process').length;
  const completedCount = scrapItems.filter(i => ['Disposed', 'Sold', 'Recycled'].includes(i.status)).length;
  const totalScrapValue = scrapItems
    .filter(i => ['Disposed', 'Sold', 'Recycled'].includes(i.status))
    .reduce((sum, i) => sum + i.scrapValue, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-655">
        
        {/* Header Title Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-905">Scrap Management</h2>
            <p className="text-slate-455 mt-1">Manage asset write-offs, decommission workflows, and recovery values</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleNewScrapRequest}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-205 text-slate-700 font-semibold rounded-xl bg-white hover:bg-slate-50 cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" />
              New Scrap Request
            </button>
            <button
              onClick={handleExportReport}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-205 text-slate-700 font-semibold rounded-xl bg-white hover:bg-slate-50 cursor-pointer"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Stats Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400">Pending Approval</p>
            <h3 className="text-xl font-bold font-display text-amber-705 mt-1">{pendingCount}</h3>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400">Approved for Scrap</p>
            <h3 className="text-xl font-bold font-display text-blue-700 mt-1">{approvedCount}</h3>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400">In Disposal Process</p>
            <h3 className="text-xl font-bold font-display text-purple-700 mt-1">{inProcessCount}</h3>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400">Completed Scrap Recoveries</p>
            <h3 className="text-xl font-bold font-display text-green-700 mt-1">{completedCount}</h3>
            <p className="text-[9px] text-slate-400 mt-1 font-semibold">Recovered: ₹{totalScrapValue.toLocaleString()}</p>
          </div>
        </div>

        {/* Alert for Pending Reviews */}
        {pendingCount > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-105 text-blue-800 rounded-xl flex items-center justify-between font-semibold">
            <span>{pendingCount} scrap write-offs are pending review and approval.</span>
          </div>
        )}

        {/* Filter controls */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-card grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-6 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <MagnifyingGlassIcon className="w-4.5 h-4.5" />
            </span>
            <input
              type="text"
              placeholder="Search by asset name, ID, manufacturer, or serial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-205 rounded-xl bg-slate-50/50"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved for Scrap">Approved</option>
              <option value="In Disposal Process">In Process</option>
              <option value="Disposed">Disposed</option>
              <option value="Sold">Sold</option>
              <option value="Recycled">Recycled</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <button
              onClick={() => toast.info('Advanced filters coming soon')}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-205 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
            >
              <AdjustmentsHorizontalIcon className="w-4.5 h-4.5" />
              Advanced Filters
            </button>
          </div>
        </div>

        {/* Scrap table */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-bold text-slate-905 font-display mb-3">Scrap Items Registry</h3>
          
          <div className="overflow-x-auto border border-slate-50 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase">
                  <th className="pb-3 pt-2 pl-4">Asset Details</th>
                  <th className="pb-3 pt-2">Category</th>
                  <th className="pb-3 pt-2">Scrap Reason</th>
                  <th className="pb-3 pt-2">Request Date</th>
                  <th className="pb-3 pt-2">Status</th>
                  <th className="pb-3 pt-2 text-right">Original Value</th>
                  <th className="pb-3 pt-2 text-right">Scrap Value</th>
                  <th className="pb-3 pt-2">Disposal Method</th>
                  <th className="pb-3 pt-2 text-center pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 font-semibold">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      <div className="inline-block w-6 h-6 rounded-full border-2 border-slate-200 border-t-brand-600 animate-spin" />
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">No scrap records found</td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-55/50">
                      <td className="py-3.5 pl-4">
                        <p className="font-bold text-slate-900">{item.assetName}</p>
                        <p className="text-[9px] text-slate-405 font-normal mt-0.5">{item.assetId} • {item.manufacturer} {item.model}</p>
                      </td>
                      <td className="py-3.5">
                        <span className="inline-flex px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase text-[8px]">{item.category}</span>
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex px-2 py-0.5 border rounded-full text-[9px] font-bold ${getReasonBadgeClass(item.scrapReason)}`}>
                          {item.scrapReason}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-655">{format(parseISO(item.scrapDate), 'MMM dd, yyyy')}</td>
                      <td className="py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusBadgeClass(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-bold text-slate-900">₹{item.originalValue.toLocaleString()}</td>
                      <td className="py-3.5 text-right font-bold text-green-700">₹{item.scrapValue.toLocaleString()}</td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-[9px] uppercase">{item.disposalMethod}</span>
                      </td>
                      <td className="py-3.5 text-center pr-4 flex justify-center gap-1.5">
                        <button
                          onClick={() => handleViewDetails(item)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        {item.status === 'Pending Approval' && (
                          <button
                            onClick={() => handleApproveScrap(item)}
                            className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                            title="Approve Scrap"
                          >
                            <CheckCircleIcon className="w-4 h-4 text-green-600" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scrap Item Detail Modal */}
        {isDetailModalOpen && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 max-w-2xl w-full p-6 shadow-card-xl space-y-4 animate-fade-in-up">
              
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-base font-bold font-display text-slate-905">Scrap Decommission Details</h3>
                <button onClick={handleCloseDetailModal} className="p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-lg">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Progress steps indicators */}
              <div className="flex items-center justify-between border border-slate-50 rounded-xl p-3 bg-slate-50 text-[10px]">
                {steps.map((label, idx) => {
                  const activeStep = getStatusStep(selectedItem.status);
                  const isCurrent = idx === activeStep;
                  const isCompleted = idx < activeStep;
                  return (
                    <div key={label} className="text-center flex-1">
                      <p className={`font-bold uppercase ${
                        isCurrent ? 'text-brand-600' : isCompleted ? 'text-green-600' : 'text-slate-400'
                      }`}>{label}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-705">
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-905 border-b border-slate-50 pb-1 uppercase text-[10px] tracking-wider text-slate-405">Asset Particulars</h4>
                  <p><strong>Name:</strong> {selectedItem.assetName}</p>
                  <p><strong>Asset ID:</strong> <span className="font-mono text-[10px] select-all">{selectedItem.assetId}</span></p>
                  <p><strong>Category Group:</strong> {selectedItem.category}</p>
                  <p><strong>Spec Model:</strong> {selectedItem.manufacturer} {selectedItem.model}</p>
                  <p><strong>Serial Number:</strong> <span className="font-mono text-[10px] select-all">{selectedItem.serialNumber}</span></p>
                  <p><strong>Current Facility:</strong> {selectedItem.currentLocation}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-905 border-b border-slate-50 pb-1 uppercase text-[10px] tracking-wider text-slate-405">Decommission Log</h4>
                  <p className="flex items-center gap-1"><strong>Reason Code:</strong>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${getReasonBadgeClass(selectedItem.scrapReason)}`}>
                      {selectedItem.scrapReason}
                    </span>
                  </p>
                  <p><strong>Submit Date:</strong> {format(parseISO(selectedItem.scrapDate), 'MMM dd, yyyy')}</p>
                  {selectedItem.approvalDate && <p><strong>Approval Date:</strong> {format(parseISO(selectedItem.approvalDate), 'MMM dd, yyyy')}</p>}
                  {selectedItem.disposalDate && <p><strong>Disposal Date:</strong> {format(parseISO(selectedItem.disposalDate), 'MMM dd, yyyy')}</p>}
                  <p className="flex items-center gap-1"><strong>Current Status:</strong>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusBadgeClass(selectedItem.status)}`}>
                      {selectedItem.status}
                    </span>
                  </p>
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <h4 className="font-bold text-slate-905 border-b border-slate-50 pb-1 uppercase text-[10px] tracking-wider text-slate-405">Financial Settlement</h4>
                  <div className="grid grid-cols-3 gap-3 bg-slate-55 border border-slate-100 p-3 rounded-xl">
                    <div>
                      <p className="text-[10px] text-slate-400">Original Value:</p>
                      <p className="font-bold text-slate-900 mt-0.5">₹{selectedItem.originalValue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Scrap Recovery Value:</p>
                      <p className="font-bold text-green-700 mt-0.5">₹{selectedItem.scrapValue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Calculated Write-off loss:</p>
                      <p className="font-bold text-red-650 mt-0.5">₹{(selectedItem.originalValue - selectedItem.scrapValue).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <h4 className="font-bold text-slate-905 border-b border-slate-50 pb-1 uppercase text-[10px] tracking-wider text-slate-405">Compliance Remarks</h4>
                  <p><strong>Disposal Method:</strong> {selectedItem.disposalMethod}</p>
                  {selectedItem.vendorName && <p><strong>Appointed Recycler Vendor:</strong> {selectedItem.vendorName}</p>}
                  {selectedItem.approvedBy && <p><strong>Approving Authority:</strong> {selectedItem.approvedBy}</p>}
                  {selectedItem.documentReference && <p><strong>Audit document Reference:</strong> <span className="font-mono text-[10px] select-all">{selectedItem.documentReference}</span></p>}
                  <p className="flex items-center gap-1.5 mt-1"><strong>Environmental compliance standard:</strong>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                      selectedItem.environmentalCompliance ? 'bg-green-50 text-green-700 border-green-105' : 'bg-red-50 text-red-700 border-red-105'
                    }`}>
                      {selectedItem.environmentalCompliance ? 'Compliant certification' : 'Non-Compliant warning'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-105 font-semibold">
                <button
                  onClick={handleCloseDetailModal}
                  className="px-4 py-2 border border-slate-205 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Close
                </button>
                {selectedItem?.status === 'Pending Approval' && (
                  <button
                    onClick={() => {
                      handleApproveScrap(selectedItem);
                      handleCloseDetailModal();
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg cursor-pointer shadow-brand"
                  >
                    Approve Write-off
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Create New Scrap Request modal sheet */}
        {isNewRequestModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full p-6 shadow-card-xl space-y-4 animate-fade-in-up">
              
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-base font-bold font-display text-slate-900">Create New Scrap Request</h3>
                <button onClick={handleCloseNewRequestModal} className="p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-lg">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 pt-1 text-slate-700">
                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Asset ID Reference *</label>
                  <input
                    type="text"
                    required
                    value={newRequestForm.assetId}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, assetId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                    placeholder="Enter the unique asset ID key"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Scrap Reason Code *</label>
                  <select
                    value={newRequestForm.scrapReason}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, scrapReason: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
                  >
                    <option value="">Choose Reason</option>
                    <option value="End of Life">End of Life</option>
                    <option value="Beyond Repair">Beyond Repair</option>
                    <option value="Obsolete">Obsolete</option>
                    <option value="Policy Compliance">Policy Compliance</option>
                    <option value="Accident Damage">Accident Damage</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Target Disposal Method</label>
                  <select
                    value={newRequestForm.disposalMethod}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, disposalMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
                  >
                    <option value="Recycle">Recycle</option>
                    <option value="Sell">Sell</option>
                    <option value="Donate">Donate</option>
                    <option value="Destroy">Destroy</option>
                    <option value="Return to Vendor">Return to Vendor</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Estimated Scrap salvage Recovery Value (INR)</label>
                  <input
                    type="number"
                    value={newRequestForm.estimatedValue}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, estimatedValue: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                    placeholder="₹"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Technical Audit Notes</label>
                  <textarea
                    rows={3}
                    value={newRequestForm.notes}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-105 font-semibold">
                <button
                  onClick={handleCloseNewRequestModal}
                  className="px-4 py-2 border border-slate-205 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitNewRequest}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg cursor-pointer shadow-brand"
                >
                  Submit Request
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default ScrapPage;