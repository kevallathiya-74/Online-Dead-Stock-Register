import {
    AdjustmentsHorizontalIcon,
    ArrowDownTrayIcon,
    ExclamationTriangleIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    PencilSquareIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { differenceInDays, format, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import warrantyService, { WarrantyItem } from '../services/warranty.service';
import { formatCurrency } from '../../../utils/errorHandling';

const WarrantyPage = () => {
  const [warranties, setWarranties] = useState<WarrantyItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalCoverageValue, setTotalCoverageValue] = useState(0);

  useEffect(() => {
    loadWarrantyData();
    const interval = setInterval(loadWarrantyData, 30000);
    return () => clearInterval(interval);
  {/* eslint-disable-next-line react-hooks/exhaustive-deps */}
  }, []);

  const loadWarrantyData = async () => {
    try {
      setLoading(true);
      const response = await warrantyService.getWarranties({
        search: searchTerm
      });
      setWarranties(response.data || []);
      
      const totalValue = response.data.reduce((sum: number, w: WarrantyItem) => {
        return sum + (w.coverageValue || 100000);
      }, 0);
      setTotalCoverageValue(totalValue);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        toast.error(error.response?.data?.message || 'Failed to load warranty data');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-50 text-green-700 border border-green-105';
      case 'Expired': return 'bg-red-50 text-red-700 border border-red-105';
      case 'Expiring Soon': return 'bg-amber-50 text-amber-705 border border-amber-100';
      case 'Claim Filed': return 'bg-blue-50 text-blue-700 border border-blue-105';
      default: return 'bg-slate-50 text-slate-705 border border-slate-105';
    }
  };

  const getDaysUntilExpiry = (endDate: string) => {
    return differenceInDays(parseISO(endDate), new Date());
  };

  const filteredWarranties = warranties.filter((warranty) =>
    warranty.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warranty.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warranty.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warranty.vendor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = (warranty: WarrantyItem) => {
    setSelectedWarranty(warranty);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setSelectedWarranty(null);
    setIsDetailModalOpen(false);
  };

  const handleFileWarrantyClaim = async (warranty: WarrantyItem) => {
    try {
      const result = await warrantyService.fileWarrantyClaim({
        warrantyId: warranty._id,
        assetId: warranty.assetId,
        description: `Warranty claim for ${warranty.assetName}`,
        issueType: 'warranty_claim'
      });
      toast.success(result.message || `Warranty claim filed successfully for ${warranty.assetName}`);
      await loadWarrantyData();
    } catch { /* ignore */ }
  };

  const handleExportReport = async () => {
    try {
      toast.info('Preparing warranty report...');
      const blob = await warrantyService.exportWarrantyReport('csv', {
        search: searchTerm
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `warranty-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Warranty report downloaded successfully');
    } catch { /* ignore */ }
  };

  const expiringCount = warranties.filter(w => w.status === 'Expiring Soon').length;
  const activeCount = warranties.filter(w => w.status === 'Active').length;
  const expiredCount = warranties.filter(w => w.status === 'Expired').length;

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-655">
        
        {/* Header Action Row */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-905">Warranty Management</h2>
            <p className="text-slate-455 mt-1">Track manufacturer warranty policies, claim timelines, and active SLA details</p>
          </div>
          <button
            onClick={handleExportReport}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-205 text-slate-700 font-semibold rounded-xl bg-white hover:bg-slate-50 cursor-pointer"
          >
            <ArrowDownTrayIcon className="w-4.5 h-4.5" />
            Export Report
          </button>
        </div>

        {/* Stats Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400">Active Warranties</p>
            <h3 className="text-xl font-bold font-display text-slate-905 mt-1">{activeCount}</h3>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400 font-semibold text-amber-600">Expiring Soon</p>
            <h3 className="text-xl font-bold font-display text-amber-750 mt-1">{expiringCount}</h3>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400 font-semibold text-red-600">Expired Contracts</p>
            <h3 className="text-xl font-bold font-display text-red-650 mt-1">{expiredCount}</h3>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Capital Insured</p>
            <h3 className="text-md font-bold font-display text-slate-905 mt-1">{formatCurrency(totalCoverageValue)}</h3>
          </div>
        </div>

        {/* Warning Alerts panel */}
        {expiringCount > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl flex items-start gap-2.5 font-semibold">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-slate-900 text-xs">Expiries Notice</p>
              <p className="mt-0.5">{expiringCount} warranties are expiring within the next 30 days. Please review and file necessary extensions or claims.</p>
            </div>
          </div>
        )}

        {/* Search controls */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-card grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-9 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <MagnifyingGlassIcon className="w-4.5 h-4.5" />
            </span>
            <input
              type="text"
              placeholder="Search warranties by asset, manufacturer, serial number, or vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-205 rounded-xl bg-slate-50/50"
            />
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

        {/* Warranty Table */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-bold text-slate-905 font-display mb-3">Insured Warranties Catalogue</h3>
          
          <div className="overflow-x-auto border border-slate-50 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase">
                  <th className="pb-3 pt-2 pl-4">Asset Details</th>
                  <th className="pb-3 pt-2">Manufacturer</th>
                  <th className="pb-3 pt-2">Serial Number</th>
                  <th className="pb-3 pt-2">Warranty Type</th>
                  <th className="pb-3 pt-2">End Date</th>
                  <th className="pb-3 pt-2">Status</th>
                  <th className="pb-3 pt-2">Days Until Expiry</th>
                  <th className="pb-3 pt-2">Claims Count</th>
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
                ) : filteredWarranties.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">No warranties found matching parameters</td>
                  </tr>
                ) : (
                  filteredWarranties.map((warranty) => {
                    const daysUntilExpiry = getDaysUntilExpiry(warranty.endDate);
                    return (
                      <tr key={warranty._id} className="hover:bg-slate-55/50">
                        <td className="py-3.5 pl-4">
                          <p className="font-bold text-slate-900">{warranty.assetName}</p>
                          <p className="text-[9px] text-slate-405 font-mono select-all mt-0.5">{warranty.assetId}</p>
                        </td>
                        <td className="py-3.5 text-slate-805">{warranty.manufacturer}</td>
                        <td className="py-3.5 text-slate-700 font-mono text-[10px] select-all">{warranty.serialNumber}</td>
                        <td className="py-3.5">
                          <span className="inline-flex px-2 py-0.5 rounded border border-slate-200 bg-slate-55 text-slate-700 font-bold uppercase text-[8px]">{warranty.warrantyType}</span>
                        </td>
                        <td className="py-3.5 text-slate-900">{format(parseISO(warranty.endDate), 'MMM dd, yyyy')}</td>
                        <td className="py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusBadgeClass(warranty.status)}`}>
                            {warranty.status}
                          </span>
                        </td>
                        <td className="py-3.5 font-bold">
                          <span className={daysUntilExpiry < 0 ? 'text-red-650' : daysUntilExpiry <= 30 ? 'text-amber-600' : 'text-slate-900'}>
                            {daysUntilExpiry < 0 
                              ? `Expired ${Math.abs(daysUntilExpiry)} days ago`
                              : `${daysUntilExpiry} days`
                            }
                          </span>
                        </td>
                        <td className="py-3.5 text-center font-normal text-slate-400">{warranty.claimHistory} claims</td>
                        <td className="py-3.5 text-center pr-4 flex justify-center gap-1.5">
                          <button
                            onClick={() => handleViewDetails(warranty)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                            title="View Details"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          {warranty.status === 'Active' && (
                            <button
                              onClick={() => handleFileWarrantyClaim(warranty)}
                              className="p-1.5 text-slate-400 hover:text-brand-655 hover:bg-slate-50 rounded-lg cursor-pointer"
                              title="File Warranty Claim"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Warranty Detail Modal */}
        {isDetailModalOpen && selectedWarranty && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 max-w-2xl w-full p-6 shadow-card-xl space-y-4 animate-fade-in-up">
              
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-base font-bold font-display text-slate-900">Warranty Details</h3>
                <button onClick={handleCloseDetailModal} className="p-1 text-slate-400 hover:text-slate-655 hover:bg-slate-50 rounded-lg">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-705">
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-905 border-b border-slate-50 pb-1 uppercase text-[10px] tracking-wider text-slate-405">Asset Information</h4>
                  <p><strong>Name:</strong> {selectedWarranty.assetName}</p>
                  <p><strong>Asset ID Reference:</strong> <span className="font-mono text-[10px] select-all">{selectedWarranty.assetId}</span></p>
                  <p><strong>Manufacturer:</strong> {selectedWarranty.manufacturer}</p>
                  <p><strong>Model Spec:</strong> {selectedWarranty.model}</p>
                  <p><strong>Serial Number:</strong> <span className="font-mono text-[10px] select-all">{selectedWarranty.serialNumber}</span></p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-905 border-b border-slate-50 pb-1 uppercase text-[10px] tracking-wider text-slate-405">Warranty policy Parameters</h4>
                  <p><strong>Type:</strong> {selectedWarranty.warrantyType}</p>
                  <p><strong>Vendor Supplier:</strong> {selectedWarranty.vendor}</p>
                  <p><strong>Start Date:</strong> {format(parseISO(selectedWarranty.startDate), 'MMM dd, yyyy')}</p>
                  <p><strong>End Date:</strong> {format(parseISO(selectedWarranty.endDate), 'MMM dd, yyyy')}</p>
                  <p className="flex items-center gap-1"><strong>Status:</strong>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusBadgeClass(selectedWarranty.status)}`}>
                      {selectedWarranty.status}
                    </span>
                  </p>
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <h4 className="font-bold text-slate-905 border-b border-slate-50 pb-1 uppercase text-[10px] tracking-wider text-slate-405">Coverage scope</h4>
                  <p className="bg-slate-50 border border-slate-100 p-3 rounded-xl leading-relaxed">{selectedWarranty.coverageDetails}</p>
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <h4 className="font-bold text-slate-905 border-b border-slate-50 pb-1 uppercase text-[10px] tracking-wider text-slate-405">Claims History Log</h4>
                  <p><strong>Total Filed Claims:</strong> {selectedWarranty.claimHistory}</p>
                  {selectedWarranty.lastClaimDate && (
                    <p><strong>Last Claim Submission Date:</strong> {format(parseISO(selectedWarranty.lastClaimDate), 'MMM dd, yyyy')}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-105 font-semibold">
                <button
                  onClick={handleCloseDetailModal}
                  className="px-4 py-2 border border-slate-205 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Close
                </button>
                {selectedWarranty?.status === 'Active' && (
                  <button
                    onClick={() => {
                      handleFileWarrantyClaim(selectedWarranty);
                      handleCloseDetailModal();
                    }}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg cursor-pointer shadow-brand"
                  >
                    File Claim
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default WarrantyPage;