import {
    ArrowLeftIcon,
    CalendarDaysIcon,
    InformationCircleIcon,
    MapPinIcon,
    PencilSquareIcon,
    PrinterIcon,
    QrCodeIcon,
    TagIcon,
    UserIcon
} from '@heroicons/react/24/outline';
import { QRCodeCanvas } from 'qrcode.react';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import api from '../../../services/api';
import assetUpdateService from '../services/assetUpdateService';

interface AssetDetails {
  _id: string;
  unique_asset_id: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  asset_type: string;
  location: string;
  status: string;
  department: string;
  purchase_date: string;
  purchase_cost: number;
  warranty_expiry?: string;
  condition: string;
  assigned_user?: {
    name: string;
    email: string;
    department?: string;
  };
  last_audited_by?: {
    name: string;
    email: string;
  };
  last_audit_date?: string;
  location_verified?: boolean;
  last_location_verification_date?: string;
  audit_history?: any[];
  createdAt: string;
  updatedAt: string;
}

const AssetDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [asset, setAsset] = useState<AssetDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const handleBackNavigation = () => {
    const fromPage = (location.state as any)?.from;
    if (fromPage) {
      navigate(fromPage);
    } else if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/assets');
    }
  };

  useEffect(() => {
    loadAssetDetails();
  {/* eslint-disable-next-line react-hooks/exhaustive-deps */}
  }, [id]);

  useEffect(() => {
    if (!autoRefresh || !id) return;
    const intervalId = setInterval(() => {
      loadAssetDetails(true);
    }, 10000);
    return () => clearInterval(intervalId);
  {/* eslint-disable-next-line react-hooks/exhaustive-deps */}
  }, [id, autoRefresh]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `asset_updated_${id}`) {
        loadAssetDetails(true);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  {/* eslint-disable-next-line react-hooks/exhaustive-deps */}
  }, [id]);

  const loadAssetDetails = async (silent = false) => {
    try {
      if (!id || id.trim() === '') {
        throw new Error('Invalid asset ID');
      }
      if (!silent) setLoading(true);
      const response = await api.get(`/assets/${id}`);
      const assetData = response.data.data || response.data;
      setAsset(assetData);
      setLastUpdated(new Date());
      setError('');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load asset details';
      setError(errorMsg);
      if (!silent) {
        toast.error(errorMsg);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const refreshAssetDetails = () => {
    loadAssetDetails();
  };

  useEffect(() => {
    (window as any).refreshAssetDetails = refreshAssetDetails;
    return () => {
      delete (window as any).refreshAssetDetails;
    };
  {/* eslint-disable-next-line react-hooks/exhaustive-deps */}
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = assetUpdateService.subscribe(id, (assetId, updateData) => {
      if (updateData?.type === 'audit_completed') {
        toast.success('Asset audit completed! Refreshing data...', { autoClose: 3000 });
      } else if (updateData?.type === 'status_changed') {
        toast.info(`Asset status changed: ${updateData.oldStatus} &rarr; ${updateData.newStatus}`, { autoClose: 3000 });
      }
      loadAssetDetails(true);
    });
    return unsubscribe;
  {/* eslint-disable-next-line react-hooks/exhaustive-deps */}
  }, [id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
      case 'Available':
        return 'bg-green-50 text-green-700 border border-green-105';
      case 'Under Maintenance':
        return 'bg-amber-50 text-amber-700 border border-amber-105';
      case 'Damaged':
        return 'bg-red-50 text-red-700 border border-red-105';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-105';
    }
  };

  const getConditionBadge = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case 'excellent':
      case 'good':
        return 'bg-green-50 text-green-700 border border-green-100';
      case 'fair':
        return 'bg-amber-50 text-amber-750 border border-amber-100';
      case 'poor':
      case 'damaged':
        return 'bg-red-50 text-red-700 border border-red-100';
      default:
        return 'bg-slate-50 text-slate-705 border border-slate-100';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQR = () => {
    const canvas = document.querySelector('#asset-qr-canvas canvas') as HTMLCanvasElement;
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `${asset?.unique_asset_id}-qr.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          toast.success('QR Code downloaded');
        }
      });
    }
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

  if (error || !asset) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto mt-8 bg-white rounded-2xl border border-slate-100 shadow-card p-6 text-center space-y-4">
          <div className="inline-flex w-12 h-12 rounded-full bg-red-50 text-red-600 items-center justify-center text-xl font-bold">!</div>
          <h3 className="text-lg font-bold text-slate-900 font-display">Error Loading Asset</h3>
          <p className="text-sm text-slate-550">{error || 'Asset details could not be retrieved.'}</p>
          <button
            onClick={handleBackNavigation}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Assets
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const qrData = JSON.stringify({
    type: 'asset',
    id: asset._id,
    asset_id: asset.unique_asset_id,
    name: `${asset.manufacturer} ${asset.model}`,
    manufacturer: asset.manufacturer,
    model: asset.model,
    serial: asset.serial_number,
    category: asset.asset_type,
    location: asset.location,
    status: asset.status,
    condition: asset.condition,
    purchase_date: asset.purchase_date,
    purchase_cost: asset.purchase_cost,
    department: asset.department,
    scan_url: `${window.location.origin}/assets/${asset._id}`
  });

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackNavigation}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeftIcon className="w-4.5 h-4.5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold font-display text-slate-900">
                Asset Details
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500' : 'bg-slate-305'}`} />
                <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`text-xs px-2.5 py-1.5 rounded-xl font-bold border transition-colors cursor-pointer ${
                autoRefresh 
                  ? 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100/55' 
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {autoRefresh ? 'Auto-updating' : 'Auto-update paused'}
            </button>
            
            <button
              onClick={() => setShowQR(q => !q)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-205 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <QrCodeIcon className="w-4 h-4 text-slate-500" />
              {showQR ? 'Hide' : 'Show'} QR
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-205 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <PrinterIcon className="w-4 h-4 text-slate-500" />
              Print
            </button>

            <button
              onClick={() => navigate(`/assets?edit=${asset._id}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              <PencilSquareIcon className="w-4 h-4" />
              Edit Asset
            </button>
          </div>
        </div>

        {/* Real-time Banner */}
        {asset.last_audit_date && (
          <div className="p-4 bg-sky-50 border border-sky-100 text-sky-850 rounded-xl flex items-start justify-between gap-3">
            <div className="flex gap-2.5">
              <InformationCircleIcon className="w-5 h-5 text-sky-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs">
                This asset was last audited on <strong>{new Date(asset.last_audit_date).toLocaleString()}</strong>
                {asset.last_audited_by && ` by ${asset.last_audited_by.name}`}
              </p>
            </div>
            <button 
              onClick={() => loadAssetDetails()}
              className="text-xs text-sky-700 font-bold hover:underline cursor-pointer"
            >
              Refresh
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0 font-display text-lg font-bold">
                  {asset.manufacturer?.[0] || 'A'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-905 font-display">
                    {asset.manufacturer} {asset.model}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Asset ID: {asset.unique_asset_id}</p>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <TagIcon className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Category</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{asset.asset_type}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPinIcon className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Location</p>
                    <p className="text-sm font-semibold text-slate-805 mt-0.5">{asset.location}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-slate-405 uppercase tracking-wide font-semibold mb-1">Status</p>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(asset.status)}`}>
                    {asset.status}
                  </span>
                </div>

                <div>
                  <p className="text-[10px] text-slate-405 uppercase tracking-wide font-semibold mb-1">Condition</p>
                  <span className={`inline-flex px-2.5 py-0.5 rounded text-xs font-bold ${getConditionBadge(asset.condition)}`}>
                    {asset.condition}
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <hr className="border-slate-50 my-1" />
                </div>

                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Serial Number</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{asset.serial_number}</p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Department</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{asset.department}</p>
                </div>

                <div className="flex items-start gap-3">
                  <CalendarDaysIcon className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Purchase Date</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">
                      {asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full border border-slate-300 text-slate-400 text-center font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">₹</div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Purchase Cost</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">
                      ₹{asset.purchase_cost ? asset.purchase_cost.toLocaleString('en-IN') : '0'}
                    </p>
                  </div>
                </div>

                {asset.warranty_expiry && (
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Warranty Expiry</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">
                      {new Date(asset.warranty_expiry).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {asset.assigned_user && (
                  <div className="flex items-start gap-3">
                    <UserIcon className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Assigned To</p>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">{asset.assigned_user.name}</p>
                      <p className="text-xs text-slate-400">{asset.assigned_user.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Side Info */}
          <div className="lg:col-span-4 space-y-6">
            {showQR && (
              <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6 text-center space-y-4">
                <h3 className="text-base font-semibold font-display text-slate-900">Asset QR Code</h3>
                <div className="flex justify-center" id="asset-qr-canvas">
                  <div className="bg-white p-3 rounded-2xl shadow-card border border-slate-150">
                    <QRCodeCanvas
                      value={qrData}
                      size={180}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                </div>
                <button
                  onClick={handleDownloadQR}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Download QR Code
                </button>
              </div>
            )}

            <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6 space-y-4">
              <h3 className="text-base font-semibold font-display text-slate-905">System Information</h3>
              <hr className="border-slate-100" />
              <div className="space-y-3 text-xs text-slate-500">
                <div>
                  <p className="font-semibold text-slate-400 uppercase tracking-wide">Created</p>
                  <p className="text-slate-805 mt-0.5">{new Date(asset.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-400 uppercase tracking-wide">Last Updated</p>
                  <p className="text-slate-805 mt-0.5">{new Date(asset.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audit History */}
        {asset.audit_history && asset.audit_history.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold font-display text-slate-900">Recent Audit History</h3>
              <hr className="border-slate-100 mt-2" />
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {asset.audit_history.map((audit: any, index: number) => (
                <div
                  key={audit._id || index}
                  className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        audit.action.includes('completed') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-slate-200 text-slate-655'
                      }`}>
                        {audit.action.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      {audit.user_id && (
                        <span className="text-slate-400">By {audit.user_id.name}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(audit.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-slate-655 leading-relaxed">{audit.description}</p>
                  
                  {audit.new_values && (
                    <div className="mt-2 p-2.5 bg-green-50/50 border border-green-100 text-green-800 rounded-lg">
                      <p className="font-bold text-[10px]">Updated Values:</p>
                      <div className="mt-1 space-y-0.5">
                        {audit.new_values.condition && <p>Condition: {audit.new_values.condition}</p>}
                        {audit.new_values.status && <p>Status: {audit.new_values.status}</p>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AssetDetailsPage;
