import {
    AdjustmentsHorizontalIcon,
    ArrowDownTrayIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { differenceInDays, format, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import api from '../../../services/api';

interface AMCContract {
  _id: string;
  id?: string;
  contractNumber: string;
  assetId: string;
  assetName: string;
  vendor: string;
  contractType: 'Comprehensive' | 'Parts Only' | 'Labor Only' | 'On-Site' | 'Remote Support';
  startDate: string;
  endDate: string;
  renewalDate: string;
  status: 'Active' | 'Expired' | 'Expiring Soon' | 'Under Review' | 'Renewed';
  annualCost: number;
  coverage: string;
  serviceLevel: 'Standard' | 'Premium' | 'Critical' | 'Basic';
  responseTime: string;
  lastServiceDate?: string;
  serviceCallsUsed: number;
  serviceCallsLimit: number;
  paymentStatus: 'Paid' | 'Pending' | 'Overdue';
}

const AMCPage = () => {
  const [contracts, setContracts] = useState<AMCContract[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedContract, setSelectedContract] = useState<AMCContract | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAMCData();
  }, []);

  const loadAMCData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/maintenance/amc-contracts');
      const data = response.data.data || response.data;
      setContracts(data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-50 text-green-700 border border-green-105';
      case 'Expired': return 'bg-red-50 text-red-700 border border-red-105';
      case 'Expiring Soon': return 'bg-amber-50 text-amber-705 border border-amber-100';
      case 'Under Review': return 'bg-blue-50 text-blue-700 border border-blue-105';
      default: return 'bg-slate-50 text-slate-705 border border-slate-105';
    }
  };

  const getPaymentStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-50 text-green-700 border border-green-105';
      case 'Pending': return 'bg-amber-50 text-amber-705 border border-amber-100';
      case 'Overdue': return 'bg-red-50 text-red-705 border border-red-100';
      default: return 'bg-slate-50 text-slate-655 border border-slate-100';
    }
  };

  const getDaysUntilRenewal = (renewalDate: string) => {
    return differenceInDays(parseISO(renewalDate), new Date());
  };

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch = 
      contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.assetId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (contract: AMCContract) => {
    setSelectedContract(contract);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setSelectedContract(null);
    setIsDetailModalOpen(false);
  };

  const handleRenewContract = (contract: AMCContract) => {
    toast.success(`Contract renewal initiated for ${contract.contractNumber}`);
    setContracts(prev => prev.map(c => 
      c._id === contract._id 
        ? { ...c, status: 'Under Review' as const }
        : c
    ));
  };

  const activeCount = contracts.filter(c => c.status === 'Active').length;
  const expiringCount = contracts.filter(c => c.status === 'Expiring Soon').length;
  const renewalCount = contracts.filter(c => c.status === 'Under Review').length;
  const totalAnnualCost = contracts
    .filter(c => c.status === 'Active')
    .reduce((sum, c) => sum + c.annualCost, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-655">
        
        {/* Header Action Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-905">AMC Management</h2>
            <p className="text-slate-455 mt-1">Manage annual maintenance contracts, SLA metrics, and vendor renewals</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => toast.info('Add new AMC contract feature coming soon')}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-205 text-slate-700 font-semibold rounded-xl bg-white hover:bg-slate-50 cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" />
              New Contract
            </button>
            <button
              onClick={() => toast.info('AMC report download started')}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-205 text-slate-700 font-semibold rounded-xl bg-white hover:bg-slate-50 cursor-pointer"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Summaries Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400">Active SLA Contracts</p>
            <h3 className="text-xl font-bold font-display text-slate-905 mt-1">{activeCount}</h3>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400 font-semibold text-amber-600">Expiring Soon</p>
            <h3 className="text-xl font-bold font-display text-amber-705 mt-1">{expiringCount}</h3>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400">Contracts Under Review</p>
            <h3 className="text-xl font-bold font-display text-blue-700 mt-1">{renewalCount}</h3>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400">Current Cost Commitment</p>
            <h3 className="text-md font-bold font-display text-slate-905 mt-1">₹{Number(totalAnnualCost || 0).toLocaleString('en-IN')}</h3>
          </div>
        </div>

        {/* Warning Alert banner */}
        {expiringCount > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl flex items-start gap-2.5 font-semibold">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-slate-900 text-xs">Action Required</p>
              <p className="mt-0.5">{expiringCount} AMC contracts are expiring soon. Please review and renew to avoid service interruption.</p>
            </div>
          </div>
        )}

        {/* Filters control */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-card grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-6 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <MagnifyingGlassIcon className="w-4.5 h-4.5" />
            </span>
            <input
              type="text"
              placeholder="Search contracts by number, asset, or vendor..."
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
              <option value="Active">Active</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Under Review">Under Review</option>
              <option value="Expired">Expired</option>
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

        {/* AMC Contracts Table */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-bold text-slate-905 font-display mb-3">Contracts Catalogue</h3>
          
          <div className="overflow-x-auto border border-slate-50 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase">
                  <th className="pb-3 pt-2 pl-4">Contract ID</th>
                  <th className="pb-3 pt-2">Asset Particulars</th>
                  <th className="pb-3 pt-2">Vendor Name</th>
                  <th className="pb-3 pt-2">Type</th>
                  <th className="pb-3 pt-2">End Date</th>
                  <th className="pb-3 pt-2">Status</th>
                  <th className="pb-3 pt-2 text-right">Annual Cost</th>
                  <th className="pb-3 pt-2">Payment Status</th>
                  <th className="pb-3 pt-2">Calls (Used/Limit)</th>
                  <th className="pb-3 pt-2 text-center pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 font-semibold">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-405">
                      <div className="inline-block w-6 h-6 rounded-full border-2 border-slate-200 border-t-brand-600 animate-spin" />
                    </td>
                  </tr>
                ) : filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">No AMC contracts found</td>
                  </tr>
                ) : (
                  filteredContracts.map((contract) => {
                    const daysUntilRenewal = getDaysUntilRenewal(contract.renewalDate);
                    return (
                      <tr key={contract._id} className="hover:bg-slate-55/50">
                        <td className="py-3.5 pl-4">
                          <p className="font-bold text-slate-900">{contract.contractNumber}</p>
                          <p className="text-[9px] text-slate-405 font-normal mt-0.5">SLA: {contract.serviceLevel}</p>
                        </td>
                        <td className="py-3.5">
                          <p className="font-bold text-slate-900">{contract.assetName}</p>
                          <p className="text-[9px] text-slate-405 font-mono select-all mt-0.5">{contract.assetId}</p>
                        </td>
                        <td className="py-3.5 text-slate-805">{contract.vendor}</td>
                        <td className="py-3.5 text-slate-655 font-normal">{contract.contractType}</td>
                        <td className="py-3.5">
                          <p className="text-slate-900">{format(parseISO(contract.endDate), 'MMM dd, yyyy')}</p>
                          {daysUntilRenewal <= 30 && daysUntilRenewal > 0 && (
                            <p className="text-[9px] text-amber-600 mt-0.5 font-bold">Due in {daysUntilRenewal}d</p>
                          )}
                        </td>
                        <td className="py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusBadgeClass(contract.status)}`}>
                            {contract.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-bold text-slate-900">₹{contract.annualCost.toLocaleString()}</td>
                        <td className="py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getPaymentStatusBadgeClass(contract.paymentStatus)}`}>
                            {contract.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-805">
                          <p>{contract.serviceCallsUsed} / {contract.serviceCallsLimit} calls</p>
                          <p className="text-[9px] text-slate-405 font-normal mt-0.5">Response: {contract.responseTime}</p>
                        </td>
                        <td className="py-3.5 text-center pr-4 flex justify-center gap-1.5">
                          <button
                            onClick={() => handleViewDetails(contract)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                            title="View Details"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          {(contract.status === 'Expiring Soon' || contract.status === 'Expired') && (
                            <button
                              onClick={() => handleRenewContract(contract)}
                              className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                              title="Renew Contract"
                            >
                              <ArrowPathIcon className="w-4 h-4" />
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

        {/* Contract Detail Dialog Modal */}
        {isDetailModalOpen && selectedContract && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 max-w-2xl w-full p-6 shadow-card-xl space-y-4 animate-fade-in-up">
              
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-base font-bold font-display text-slate-900">AMC Contract Details</h3>
                <button onClick={handleCloseDetailModal} className="p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-lg">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-905 border-b border-slate-55 pb-1 uppercase text-[10px] tracking-wider text-slate-405">Contract Parameters</h4>
                    <p><strong>Contract Number:</strong> {selectedContract.contractNumber}</p>
                    <p><strong>Contract Type:</strong> {selectedContract.contractType}</p>
                    <p><strong>Service Level:</strong> {selectedContract.serviceLevel}</p>
                    <p><strong>Response SLA:</strong> {selectedContract.responseTime}</p>
                    <p><strong>Duration Dates:</strong> {format(parseISO(selectedContract.startDate), 'MMM dd, yyyy')} to {format(parseISO(selectedContract.endDate), 'MMM dd, yyyy')}</p>
                    <p><strong>Renewal Lock Date:</strong> {format(parseISO(selectedContract.renewalDate), 'MMM dd, yyyy')}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-905 border-b border-slate-55 pb-1 uppercase text-[10px] tracking-wider text-slate-405">Vendor & Asset info</h4>
                    <p><strong>Associated Asset Name:</strong> {selectedContract.assetName}</p>
                    <p><strong>Asset ID Reference:</strong> <span className="font-mono text-[10px] select-all">{selectedContract.assetId}</span></p>
                    <p><strong>Contractor Vendor:</strong> {selectedContract.vendor}</p>
                    <p><strong>Annual Cost Cost:</strong> ₹{selectedContract.annualCost.toLocaleString()}</p>
                    <p className="flex items-center gap-1.5"><strong>Payment Status:</strong> 
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getPaymentStatusBadgeClass(selectedContract.paymentStatus)}`}>
                        {selectedContract.paymentStatus}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1.5">
                  <h4 className="font-bold text-slate-905 uppercase text-[10px] tracking-wider text-slate-405">Coverage Scope</h4>
                  <p className="leading-relaxed">{selectedContract.coverage}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-55 border border-slate-100 rounded-xl p-4 text-slate-805">
                  <div>
                    <h4 className="font-bold text-slate-905 uppercase text-[10px] tracking-wider text-slate-405 mb-1.5">Support Call Logs</h4>
                    <p><strong>Used service calls:</strong> {selectedContract.serviceCallsUsed} of {selectedContract.serviceCallsLimit} limit</p>
                  </div>
                  <div>
                    {selectedContract.lastServiceDate && (
                      <p><strong>Last Service Ticket Date:</strong> {format(parseISO(selectedContract.lastServiceDate), 'MMM dd, yyyy')}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-105 font-semibold">
                <button
                  onClick={handleCloseDetailModal}
                  className="px-4 py-2 border border-slate-205 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                {selectedContract && (selectedContract.status === 'Expiring Soon' || selectedContract.status === 'Expired') && (
                  <button
                    onClick={() => {
                      handleRenewContract(selectedContract);
                      handleCloseDetailModal();
                    }}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg cursor-pointer shadow-brand"
                  >
                    Renew SLA Contract
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

export default AMCPage;