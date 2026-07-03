import {
    CheckIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import AssetTransferModal from '../components/AssetTransferModal';
import { usePolling } from '../../../hooks/usePolling';
import api from '../../../services/api';

interface AssetTransfer {
  _id: string;
  transfer_id: string;
  asset: {
    _id: string;
    name: string;
    unique_asset_id: string;
  };
  from_location: string;
  to_location: string;
  from_user: { 
    _id: string;
    full_name: string;
    email: string;
  };
  to_user: { 
    _id: string;
    full_name: string;
    email: string;
  };
  initiated_by: {
    _id: string;
    full_name: string;
    email: string;
  };
  transfer_reason: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_transit' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expected_transfer_date: string;
  actual_transfer_date?: string;
  transfer_date?: string;
  completion_date?: string;
  approved_by?: {
    _id: string;
    full_name: string;
  };
  approved_at?: string;
  rejection_reason?: string;
  createdAt: string;
  updatedAt: string;
}

const AssetTransfersPage: React.FC = () => {
  const [transfers, setTransfers] = useState<AssetTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  useEffect(() => {
    loadTransfers();
  }, []);

  usePolling(
    async () => {
      await loadTransfers();
    },
    {
      interval: 30000,
      enabled: true
    }
  );

  const loadTransfers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/asset-transfers');
      const transfersData = response.data.transfers || response.data.data || response.data;
      setTransfers(Array.isArray(transfersData) ? transfersData : []);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load transfers';
      toast.error(errorMsg);
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransfers = transfers.filter((transfer) => {
    const matchesSearch = 
      transfer.asset?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.asset?.unique_asset_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.from_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.to_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.transfer_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.from_user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.to_user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || transfer.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border border-green-100';
      case 'pending':
        return 'bg-amber-50 text-amber-705 border border-amber-100';
      case 'approved':
      case 'in_transit':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-100';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-50 text-red-700 border border-red-100';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-100';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'in_transit': return 'In Transit';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const handleApproveTransfer = async (transferId: string) => {
    try {
      await api.patch(`/asset-transfers/${transferId}/status`, { status: 'approved' });
      toast.success('Transfer approved successfully');
      await loadTransfers();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) { /* Error handled by API interceptor */ }
  };

  const handleRejectTransfer = async (transferId: string) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      await api.patch(`/asset-transfers/${transferId}/status`, { 
        status: 'rejected',
        rejection_reason: reason 
      });
      toast.success('Transfer rejected');
      await loadTransfers();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) { /* Error handled by API interceptor */ }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleViewTransfer = (transferId: string) => {
    toast.info('Transfer details view - Coming soon');
  };

  const handleOpenTransferModal = () => {
    setTransferModalOpen(true);
  };

  const handleCloseTransferModal = () => {
    setTransferModalOpen(false);
  };

  const handleTransferSubmit = async () => {
    await loadTransfers();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-brand-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const stats = {
    total: transfers.length,
    pending: transfers.filter(t => t.status === 'pending').length,
    approved: transfers.filter(t => t.status === 'approved').length,
    in_transit: transfers.filter(t => t.status === 'in_transit').length,
    completed: transfers.filter(t => t.status === 'completed').length,
    cancelled: transfers.filter(t => t.status === 'cancelled' || t.status === 'rejected').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold font-display text-slate-900">
              Asset Transfers
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Track asset movements and transfers
            </p>
          </div>
          <button
            onClick={handleOpenTransferModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-all shadow-brand cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            New Transfer
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Transfers</p>
            <h4 className="text-2xl font-bold text-slate-900 font-display mt-0.5">{stats.total}</h4>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
            <p className="text-[10px] text-amber-600 uppercase tracking-wider font-semibold">Pending</p>
            <h4 className="text-2xl font-bold text-slate-900 font-display mt-0.5 text-amber-600">{stats.pending}</h4>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
            <p className="text-[10px] text-indigo-600 uppercase tracking-wider font-semibold">In Transit</p>
            <h4 className="text-2xl font-bold text-slate-900 font-display mt-0.5 text-indigo-600">{stats.in_transit}</h4>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
            <p className="text-[10px] text-green-600 uppercase tracking-wider font-semibold">Completed</p>
            <h4 className="text-2xl font-bold text-slate-900 font-display mt-0.5 text-green-650">{stats.completed}</h4>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4 col-span-2 sm:col-span-1">
            <p className="text-[10px] text-red-600 uppercase tracking-wider font-semibold">Cancelled</p>
            <h4 className="text-2xl font-bold text-slate-900 font-display mt-0.5 text-red-600">{stats.cancelled}</h4>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="relative md:col-span-8 w-full">
              <input
                type="text"
                placeholder="Search by asset name, ID, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            <div className="md:col-span-4 w-full">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="in_transit">In Transit</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transfers Table Card */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold font-display text-slate-900">
              Transfer History ({filteredTransfers.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-500">
                  <th className="pb-3 font-medium">Transfer ID</th>
                  <th className="pb-3 font-medium">Asset</th>
                  <th className="pb-3 font-medium">From</th>
                  <th className="pb-3 font-medium">To</th>
                  <th className="pb-3 font-medium">Expected Date</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Initiated By</th>
                  <th className="pb-3 font-medium">Reason</th>
                  <th className="pb-3 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {filteredTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                      No transfers found
                    </td>
                  </tr>
                ) : (
                  filteredTransfers.map((transfer) => {
                    const isOverdue = 
                      transfer.status !== 'completed' && 
                      transfer.status !== 'cancelled' && 
                      transfer.status !== 'rejected' && 
                      new Date(transfer.expected_transfer_date) < new Date();
                    
                    return (
                      <tr key={transfer._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 font-mono text-[11px] text-slate-700">
                          {transfer.transfer_id}
                        </td>
                        <td className="py-4">
                          <div>
                            <p className="font-semibold text-slate-900 text-xs">{transfer.asset?.name || 'N/A'}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">{transfer.asset?.unique_asset_id || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="py-4">
                          <div>
                            <p className="font-semibold text-slate-900 text-xs">{transfer.from_location}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">{transfer.from_user?.full_name || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="py-4">
                          <div>
                            <p className="font-semibold text-slate-900 text-xs">{transfer.to_location}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">{transfer.to_user?.full_name || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="py-4">
                          <div>
                            <p className={`font-semibold text-xs ${isOverdue ? 'text-red-650' : 'text-slate-805'}`}>
                              {new Date(transfer.expected_transfer_date).toLocaleDateString()}
                            </p>
                            {isOverdue && (
                              <span className="inline-block mt-0.5 px-1 py-0.2 bg-red-50 text-red-600 rounded text-[9px] font-bold">
                                Overdue
                              </span>
                            )}
                            {transfer.actual_transfer_date && (
                              <p className="text-[9px] text-slate-400 mt-0.5">
                                Actual: {new Date(transfer.actual_transfer_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(transfer.status)}`}>
                            {getStatusLabel(transfer.status)}
                          </span>
                        </td>
                        <td className="py-4 text-xs text-slate-655 font-medium">
                          {transfer.initiated_by?.full_name || 'N/A'}
                        </td>
                        <td className="py-4">
                          <p className="text-xs text-slate-505 truncate max-w-[150px]" title={transfer.description || '-'}>
                            {transfer.transfer_reason?.replace(/_/g, ' ')}
                          </p>
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleViewTransfer(transfer._id)}
                              className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                              title="View Details"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {transfer.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveTransfer(transfer._id)}
                                  className="p-1 rounded hover:bg-green-50 text-slate-500 hover:text-green-600 transition-colors"
                                  title="Approve"
                                >
                                  <CheckIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleRejectTransfer(transfer._id)}
                                  className="p-1 rounded hover:bg-red-50 text-slate-550 hover:text-red-650 transition-colors"
                                  title="Reject"
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AssetTransferModal
        open={transferModalOpen}
        onClose={handleCloseTransferModal}
        onSubmit={handleTransferSubmit}
      />
    </DashboardLayout>
  );
};

export default AssetTransfersPage;
