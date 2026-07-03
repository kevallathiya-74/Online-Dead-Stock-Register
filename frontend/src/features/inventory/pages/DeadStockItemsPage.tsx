import {
    AdjustmentsHorizontalIcon,
    ArrowDownTrayIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import api from '../../../services/api';
import assetUpdateService from '../../assets/services/assetUpdateService';

interface DeadStockAsset {
  _id: string;
  id?: string;
  unique_asset_id: string;
  category: string;
  asset_type: string;
  model: string;
  manufacturer: string;
  purchase_date: string;
  purchase_cost: number;
  reason_for_dead_stock: string;
  status: string;
  location: string;
}

const DeadStockItemsPage: React.FC = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<DeadStockAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [stats, setStats] = useState({
    totalDeadStock: 0,
    totalValue: 0,
    pendingDisposal: 0,
  });

  useEffect(() => {
    fetchDeadStockAssets();
    fetchStats();
  {/* eslint-disable-next-line react-hooks/exhaustive-deps */}
  }, [page, rowsPerPage, searchTerm]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const unsubscribe = assetUpdateService.subscribeGlobal((assetId, updateData) => {
      fetchDeadStockAssets();
      fetchStats();
    });
    return () => {
      unsubscribe();
    };
  {/* eslint-disable-next-line react-hooks/exhaustive-deps */}
  }, []);

  const fetchDeadStockAssets = async () => {
    const abortController = new AbortController();
    try {
      setLoading(true);
      const response = await api.get('/inventory/dead-stock', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm,
        },
        signal: abortController.signal,
      });

      if (response.data?.success && response.data?.data) {
        setAssets(response.data.data);
        setTotalItems(response.data.pagination?.totalItems || 0);
      } else {
        setAssets([]);
        setTotalItems(0);
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        return;
      }
      setAssets([]);
      setTotalItems(0);
      if (error.response?.status === 404) {
        toast.error('Dead stock endpoint not found. Please check backend.');
      } else {
        toast.error('Failed to load dead stock items');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/inventory/dead-stock/stats');
      if (response.data?.success && response.data?.data) {
        setStats(response.data.data);
      }
    } catch { /* ignore */ }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'dead_stock': return 'bg-red-50 text-red-700 border border-red-105';
      case 'pending_disposal': return 'bg-amber-50 text-amber-705 border border-amber-100';
      case 'marked_for_scrap': return 'bg-slate-50 text-slate-705 border border-slate-105';
      default: return 'bg-slate-50 text-slate-655 border border-slate-100';
    }
  };

  const handleExport = () => {
    toast.info('Export functionality will be implemented');
  };

  const handleViewDetails = (asset: DeadStockAsset) => {
    navigate(`/assets/${asset._id}`, {
      state: { from: '/inventory/dead-stock' }
    });
  };

  const handleMarkForDisposal = async (asset: DeadStockAsset) => {
    if (!window.confirm(`Are you sure you want to mark "${asset.unique_asset_id}" for disposal?`)) {
      return;
    }
    try {
      const disposalPayload = {
        asset_id: asset.unique_asset_id,
        asset_name: `${asset.manufacturer} ${asset.model}`,
        category: asset.asset_type,
        disposal_method: 'Scrap',
        disposal_value: Math.round(asset.purchase_cost * 0.1),
        disposal_date: new Date().toISOString(),
        status: 'pending',
        remarks: asset.reason_for_dead_stock || 'Marked from dead stock items page'
      };

      const disposalResponse = await api.post('/inventory/disposal-records', disposalPayload);
      if (disposalResponse.data.success) {
        setStats(prevStats => ({
          ...prevStats,
          totalDeadStock: Math.max(0, prevStats.totalDeadStock - 1),
          totalValue: Math.max(0, prevStats.totalValue - asset.purchase_cost),
          pendingDisposal: prevStats.pendingDisposal + 1
        }));

        try {
          await api.put(`/assets/${asset._id}`, {
            status: 'Disposed',
            notes: `Marked for disposal on ${new Date().toLocaleDateString()}. Disposal Record: ${disposalResponse.data.data.document_reference || 'N/A'}. ${asset.reason_for_dead_stock || ''}`
          });
        } catch { /* ignore */ }

        assetUpdateService.notifyStatusChange(
          asset.id || '',
          asset.status,
          'Disposed'
        );

        toast.success(`Asset ${asset.unique_asset_id} marked for disposal successfully and removed from dead stock`);
        await Promise.all([
          fetchDeadStockAssets(),
          fetchStats()
        ]);
      }
    } catch (error: any) {
      let errorMsg = 'Failed to mark asset for disposal';
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      }
      if (error.response?.data?.errors) {
        const validationErrors = Object.values(error.response.data.errors).join(', ');
        errorMsg = `Validation error: ${validationErrors}`;
      }
      toast.error(errorMsg);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-655">
        
        {/* Header Title Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-905">Dead Stock Items</h2>
            <p className="text-slate-455 mt-1">Manage and track write-offs, scrap items, and obsolete hardware assets</p>
          </div>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-205 text-slate-700 font-semibold rounded-xl bg-white hover:bg-slate-50 cursor-pointer"
          >
            <ArrowDownTrayIcon className="w-4.5 h-4.5" />
            Export Report
          </button>
        </div>

        {/* Stats Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Dead Stock Items</p>
            <h3 className="text-xl font-bold font-display text-slate-905 mt-1">{stats.totalDeadStock}</h3>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Capital Value</p>
            <h3 className="text-xl font-bold font-display text-red-650 mt-1">
              ₹{typeof stats.totalValue === 'number' ? stats.totalValue.toLocaleString('en-IN') : '0'}
            </h3>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400">Pending Disposal Requests</p>
            <h3 className="text-xl font-bold font-display text-amber-705 mt-1">{stats.pendingDisposal}</h3>
          </div>
        </div>

        {/* Search controls */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-card flex items-center justify-between gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <MagnifyingGlassIcon className="w-4.5 h-4.5" />
            </span>
            <input
              type="text"
              placeholder="Search dead stock items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-205 rounded-xl bg-slate-50/50"
            />
          </div>
          <button className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-205 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer">
            <AdjustmentsHorizontalIcon className="w-4.5 h-4.5" />
            Filters
          </button>
        </div>

        {/* Dead Stock Items Table */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-bold text-slate-905 font-display mb-3 font-semibold">Inventory Breakdown</h3>
          
          <div className="overflow-x-auto border border-slate-50 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase">
                  <th className="pb-3 pt-2 pl-4">Asset ID</th>
                  <th className="pb-3 pt-2">Category</th>
                  <th className="pb-3 pt-2">Model</th>
                  <th className="pb-3 pt-2">Manufacturer</th>
                  <th className="pb-3 pt-2">Purchase Date</th>
                  <th className="pb-3 pt-2 text-right">Purchase Value</th>
                  <th className="pb-3 pt-2">Reason</th>
                  <th className="pb-3 pt-2">Status</th>
                  <th className="pb-3 pt-2">Location</th>
                  <th className="pb-3 pt-2 text-center pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 font-semibold">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      <div className="inline-block w-6 h-6 rounded-full border-2 border-slate-200 border-t-brand-600 animate-spin" />
                    </td>
                  </tr>
                ) : assets.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">No dead stock items found</td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr key={asset._id} className="hover:bg-slate-55/50">
                      <td className="py-3.5 pl-4 text-slate-900 font-bold font-mono">{asset.unique_asset_id}</td>
                      <td className="py-3.5 text-slate-655">{asset.asset_type}</td>
                      <td className="py-3.5 text-slate-900 font-bold">{asset.model}</td>
                      <td className="py-3.5 text-slate-655">{asset.manufacturer}</td>
                      <td className="py-3.5 text-slate-655">{asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '—'}</td>
                      <td className="py-3.5 text-right text-slate-900 font-bold">₹{asset.purchase_cost?.toLocaleString('en-IN')}</td>
                      <td className="py-3.5 text-slate-500 max-w-xs truncate">{asset.reason_for_dead_stock}</td>
                      <td className="py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusBadgeClass(asset.status)}`}>
                          {asset.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-655">{asset.location}</td>
                      <td className="py-3.5 text-center pr-4 flex justify-center gap-1.5">
                        <button
                          onClick={() => handleViewDetails(asset)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMarkForDisposal(asset)}
                          className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Mark for Disposal"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Simple custom pagination */}
          <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-4 font-semibold text-slate-500">
            <div>
              <label className="mr-2">Rows per page:</label>
              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
                className="px-2 py-1 border border-slate-205 rounded bg-white"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 border border-slate-205 rounded hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                Prev
              </button>
              <span className="py-1 px-2 text-slate-700">Page {page + 1} of {Math.ceil(totalItems / rowsPerPage) || 1}</span>
              <button
                disabled={page >= Math.ceil(totalItems / rowsPerPage) - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 border border-slate-205 rounded hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default DeadStockItemsPage;
