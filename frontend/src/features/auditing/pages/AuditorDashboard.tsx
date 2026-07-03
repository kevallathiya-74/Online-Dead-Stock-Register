import {
    ArrowPathIcon,
    QrCodeIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import EnhancedQRScanner from '../../../components/common/EnhancedQRScanner';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import auditorService from '../services/auditorService';
import type { AuditorStats } from '../../../types';

const AuditorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AuditorStats | null>(null);
  const [auditItems, setAuditItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [scannedAsset, setScannedAsset] = useState<any>(null);
  const [assetDetailsOpen, setAssetDetailsOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        const errorMsg = 'Authentication required. Please log in again.';
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      const [statsData, itemsData] = await Promise.all([
        auditorService.getAuditorStats(),
        auditorService.getAuditItems(),
      ]);

      setStats(statsData);
      setAuditItems(Array.isArray(itemsData) ? itemsData.slice(0, 10) : []);
    } catch (err: any) {
      const errorMessage = (err as any).response?.data?.message || (err as any).message || 'Failed to load dashboard data';
      setError(errorMessage);
      
      if (!errorMessage.includes('token') && !errorMessage.includes('Authentication')) {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 100);
    
    const interval = setInterval(fetchDashboardData, 120000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'verified': return 'bg-green-50 text-green-700 border border-green-105';
      case 'pending': return 'bg-amber-50 text-amber-705 border border-amber-100';
      case 'discrepancy': return 'bg-red-50 text-red-700 border border-red-105';
      case 'missing': return 'bg-red-50 text-red-700 border border-red-105';
      default: return 'bg-slate-50 text-slate-705 border border-slate-105';
    }
  };

  const handleQrScanOpen = () => {
    setQrScannerOpen(true);
  };

  const handleQrScanClose = () => {
    setQrScannerOpen(false);
  };

  const handleAssetFound = (asset: any) => {
    setScannedAsset(asset);
    setQrScannerOpen(false);
    setAssetDetailsOpen(true);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const assetName = asset.name || asset.unique_asset_id;
    toast.success('Asset scanned successfully', {
      autoClose: 2000,
      position: 'top-center'
    });
  };

  const handleAssetDetailsClose = () => {
    setAssetDetailsOpen(false);
    setScannedAsset(null);
  };

  const handleNavigateToAsset = () => {
    if (!scannedAsset) {
      toast.error('No asset selected');
      return;
    }
    
    if (!scannedAsset.id) {
      toast.error('Invalid asset ID');
      return;
    }
    
    try {
      navigate(`/assets/${scannedAsset.id}`, {
        state: { from: '/auditor/dashboard' }
      });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      toast.error('Failed to navigate to asset details');
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

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-4 bg-red-50 border border-red-105 text-red-800 rounded-xl flex items-center justify-between font-semibold max-w-lg mx-auto mt-8">
          <span>{error}</span>
          <button onClick={fetchDashboardData} className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-755 text-[10px]">
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-655">
        
        {/* Header Title Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-905">Auditor Dashboard</h2>
            <p className="text-slate-455 mt-1">Track audit progress, compliance scores, and physical asset conditions</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleQrScanOpen}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl cursor-pointer shadow-brand"
            >
              <QrCodeIcon className="w-4 h-4" />
              Scan QR Code
            </button>
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-205 text-slate-705 font-semibold rounded-xl bg-white hover:bg-slate-50 cursor-pointer disabled:opacity-50"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Assigned Assets</p>
            <h3 className="text-xl font-bold font-display text-slate-905 mt-1">{stats?.total_assigned || 0}</h3>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400 font-semibold text-green-700">Completed Audits</p>
            <h3 className="text-xl font-bold font-display text-green-700 mt-1">{stats?.completed || 0}</h3>
            {stats && <p className="text-[9px] text-slate-400 mt-1 font-semibold">{stats.completion_rate}% verified completion</p>}
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400 font-semibold text-amber-600">Pending Audits</p>
            <h3 className="text-xl font-bold font-display text-amber-705 mt-1">{stats?.pending || 0}</h3>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400 font-semibold text-red-600">Discrepancies</p>
            <h3 className="text-xl font-bold font-display text-red-650 mt-1">{stats?.discrepancies || 0}</h3>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400 font-semibold text-red-600">Missing Assets</p>
            <h3 className="text-xl font-bold font-display text-red-650 mt-1">{stats?.missing || 0}</h3>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Completion Rate</p>
            <h3 className="text-xl font-bold font-display text-slate-905 mt-1">{stats?.completion_rate || 0}%</h3>
          </div>
        </div>

        {/* Recent Audit list */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-50">
            <h3 className="text-sm font-bold text-slate-905 font-display">Recent Assigned Audits</h3>
            <button 
              onClick={() => navigate('/auditor/audit-list')}
              className="text-brand-600 hover:text-brand-700 font-bold hover:underline"
            >
              View All Audits
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase">
                  <th className="pb-3 pl-4">Asset ID</th>
                  <th className="pb-3">Asset Name</th>
                  <th className="pb-3">Location</th>
                  <th className="pb-3">Assigned User</th>
                  <th className="pb-3">Last Audit</th>
                  <th className="pb-3">Condition</th>
                  <th className="pb-3 pr-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-707 font-semibold">
                {auditItems.length > 0 ? (
                  auditItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-55/50">
                      <td className="py-3 pl-4 font-mono font-bold text-slate-900 select-all">{item.asset_id}</td>
                      <td className="py-3 text-slate-905 font-bold">{item.asset_name}</td>
                      <td className="py-3 text-slate-655">{item.location}</td>
                      <td className="py-3 text-slate-655">{item.assigned_user}</td>
                      <td className="py-3 text-slate-455">
                        {item.last_audit_date !== '1970-01-01'
                          ? new Date(item.last_audit_date).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="py-3">
                        <span className="inline-flex px-2 py-0.5 rounded border border-slate-200 bg-slate-55 text-slate-705 font-bold uppercase text-[8px]">{item.condition}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusBadgeClass(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">No recent audit items available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scan components overlay */}
        <EnhancedQRScanner
          open={qrScannerOpen}
          onClose={handleQrScanClose}
          onAssetFound={handleAssetFound}
          mode="audit"
          enableBatchScan={true}
          enableHistory={true}
        />

        {/* Scanned Asset Details Dialog Modal */}
        {assetDetailsOpen && scannedAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 max-w-xl w-full p-6 shadow-card-xl space-y-4 animate-fade-in-up">
              
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-base font-bold font-display text-slate-905">Scanned Asset Details</h3>
                <button onClick={handleAssetDetailsClose} className="p-1 text-slate-400 hover:text-slate-655 hover:bg-slate-50 rounded-lg">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-705 text-xs">
                <div className="sm:col-span-2 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-400">Asset Particulars</p>
                  <p className="font-bold text-slate-900 mt-0.5">{scannedAsset.name || `${scannedAsset.manufacturer} ${scannedAsset.model}`}</p>
                </div>

                <div>
                  <p className="text-slate-400">Asset ID Code</p>
                  <p className="font-mono font-bold text-slate-900 mt-0.5 select-all">{scannedAsset.unique_asset_id}</p>
                </div>

                <div>
                  <p className="text-slate-400">Serial Number</p>
                  <p className="font-mono font-bold text-slate-900 mt-0.5 select-all">{scannedAsset.serial_number || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-slate-400">Status Indicator</p>
                  <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusBadgeClass(scannedAsset.status)}`}>
                    {scannedAsset.status}
                  </span>
                </div>

                <div>
                  <p className="text-slate-400">Condition Code</p>
                  <p className="font-bold text-slate-805 mt-0.5">{scannedAsset.condition}</p>
                </div>

                <div>
                  <p className="text-slate-400">Registered Location</p>
                  <p className="font-bold text-slate-805 mt-0.5">{scannedAsset.location}</p>
                </div>

                <div>
                  <p className="text-slate-400">Assigned User Holder</p>
                  <p className="font-bold text-slate-805 mt-0.5">{scannedAsset.assigned_user?.name || 'Unassigned'}</p>
                </div>

                <div>
                  <p className="text-slate-400">Category Tag</p>
                  <p className="font-bold text-slate-805 mt-0.5">{scannedAsset.category || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-slate-400">Last Audit Date</p>
                  <p className="font-bold text-slate-805 mt-0.5">
                    {scannedAsset.last_audit_date && scannedAsset.last_audit_date !== '1970-01-01'
                      ? new Date(scannedAsset.last_audit_date).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-105 font-semibold">
                <button
                  onClick={handleAssetDetailsClose}
                  className="px-4 py-2 border border-slate-205 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleNavigateToAsset();
                    handleAssetDetailsClose();
                  }}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg cursor-pointer shadow-brand font-display"
                >
                  View Full Asset Details
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default AuditorDashboard;
