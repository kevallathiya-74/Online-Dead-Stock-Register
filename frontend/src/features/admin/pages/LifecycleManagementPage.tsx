import {
    ArchiveBoxIcon,
    ArrowPathIcon,
    ArrowTrendingUpIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    PlayIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import api from '../../../services/api';

interface LifecycleStats {
  current_state: {
    active: number;
    dead_stock: number;
    disposed: number;
  };
  eligible: {
    for_dead_stock: number;
    for_disposal: number;
  };
  configuration: {
    deadStock: {
      maxAgeYears: number;
      poorConditionAge: number;
      noMaintenanceMonths: number;
    };
    disposal: {
      daysInDeadStock: number;
      autoApprove: boolean;
    };
  };
}

interface AutomationResult {
  success: boolean;
  duration: string;
  deadStock: {
    count: number;
    assets: Array<{
      assetId: string;
      name: string;
      reason: string;
    }>;
  };
  disposal: {
    count: number;
    records: Array<{
      assetId: string;
      name: string;
      method: string;
      value: number;
    }>;
  };
}

const LifecycleManagementPage: React.FC = () => {
  const [stats, setStats] = useState<LifecycleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [resultDialog, setResultDialog] = useState(false);
  const [result, setResult] = useState<AutomationResult | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/lifecycle/stats');
      setStats(response.data.data);
    } catch (error: any) {
      
      toast.error('Failed to fetch lifecycle statistics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const runFullAutomation = async () => {
    setRunning(true);
    try {
      const response = await api.post('/lifecycle/run');
      setResult(response.data.data);
      setResultDialog(true);
      toast.success('Lifecycle automation completed successfully');
      await fetchStats();
    } catch (error: any) {
      toast.error((error as any).response?.data?.message || 'Failed to run lifecycle automation');
      console.error(error);
    } finally {
      setRunning(false);
    }
  };

  const runDeadStockOnly = async () => {
    setRunning(true);
    try {
      const response = await api.post('/lifecycle/dead-stock');
      toast.success(`${response.data.data.count} assets moved to dead stock`);
      await fetchStats();
    } catch (error: any) {
      
      toast.error((error as any).response?.data?.message || 'Failed to run dead stock check');
    } finally {
      setRunning(false);
    }
  };

  const runDisposalOnly = async () => {
    setRunning(true);
    try {
      const response = await api.post('/lifecycle/disposal');
      toast.success(`${response.data.data.count} assets moved to disposal`);
      await fetchStats();
    } catch (error: any) {
      
      toast.error((error as any).response?.data?.message || 'Failed to run disposal check');
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-brand-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold font-display text-slate-900">
              Asset Lifecycle Management
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Automated management of asset lifecycle: Active → Dead Stock → Disposal
            </p>
          </div>
          <button
            onClick={runFullAutomation}
            disabled={running}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-55 text-white text-sm font-semibold rounded-xl transition-all shadow-brand cursor-pointer"
          >
            {running ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
            ) : (
              <PlayIcon className="w-4 h-4" />
            )}
            Run Full Automation
          </button>
        </div>

        {/* Alert for pending actions */}
        {stats && (stats.eligible.for_dead_stock > 0 || stats.eligible.for_disposal > 0) && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
            <p>
              <span className="font-semibold">Action Required:</span> {stats.eligible.for_dead_stock} assets eligible for
              dead stock, {stats.eligible.for_disposal} assets ready for disposal
            </p>
          </div>
        )}

        {/* Current State Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-slate-900 font-display">Active Assets</h3>
            </div>
            <h4 className="text-4xl font-bold text-slate-900 font-display">
              {stats?.current_state.active || 0}
            </h4>
            <p className="text-xs text-slate-500 mt-2">Currently in use or available</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-slate-900 font-display">Dead Stock</h3>
            </div>
            <h4 className="text-4xl font-bold text-amber-600 font-display">
              {stats?.current_state.dead_stock || 0}
            </h4>
            <p className="text-xs text-slate-500 mt-2">Marked for disposal review</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrashIcon className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-slate-900 font-display">Disposed</h3>
            </div>
            <h4 className="text-4xl font-bold text-red-600 font-display">
              {stats?.current_state.disposed || 0}
            </h4>
            <p className="text-xs text-slate-500 mt-2">Permanently disposed</p>
          </div>
        </div>

        {/* Eligible Assets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Eligible for Dead Stock */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold font-display text-slate-900 mb-2">
                Eligible for Dead Stock
              </h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-amber-600 font-display">
                  {stats?.eligible.for_dead_stock || 0}
                </span>
                <span className="text-xs text-slate-500">assets meet criteria</span>
              </div>
              <div className="border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-500">
                <p className="font-semibold text-slate-700">Criteria:</p>
                <p>• Assets older than {stats?.configuration.deadStock.maxAgeYears} years</p>
                <p>• Poor condition for {stats?.configuration.deadStock.poorConditionAge}+ years</p>
                <p>• No maintenance for {stats?.configuration.deadStock.noMaintenanceMonths} months</p>
              </div>
            </div>
            <button
              onClick={runDeadStockOnly}
              disabled={running || stats?.eligible.for_dead_stock === 0}
              className="w-full mt-6 py-2.5 border border-amber-250 text-amber-700 bg-amber-50/20 hover:bg-amber-50 hover:border-amber-400 text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <ArchiveBoxIcon className="w-4 h-4" />
              Move to Dead Stock
            </button>
          </div>

          {/* Ready for Disposal */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold font-display text-slate-900 mb-2">
                Ready for Disposal
              </h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-red-650 font-display">
                  {stats?.eligible.for_disposal || 0}
                </span>
                <span className="text-xs text-slate-500">assets ready</span>
              </div>
              <div className="border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-500">
                <p className="font-semibold text-slate-700">Criteria:</p>
                <p>• In dead stock for {stats?.configuration.disposal.daysInDeadStock}+ days</p>
                <p>• Auto-approval: {stats?.configuration.disposal.autoApprove ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>
            <button
              onClick={runDisposalOnly}
              disabled={running || stats?.eligible.for_disposal === 0}
              className="w-full mt-6 py-2.5 border border-red-200 text-red-750 bg-red-50/20 hover:bg-red-50 hover:border-red-400 text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <TrashIcon className="w-4 h-4" />
              Move to Disposal
            </button>
          </div>
        </div>

        {/* Automation Flow Diagram */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
          <h3 className="text-lg font-bold font-display text-slate-900 mb-4">
            Automation Flow
          </h3>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 sm:p-8">
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-4">
              <div className="text-center w-full md:w-1/3">
                <CheckCircleIcon className="w-12 h-12 mx-auto mb-2 text-green-600" />
                <h4 className="font-semibold text-slate-900 text-sm">Active</h4>
                <p className="text-xs text-slate-500 mt-1">In use / Available</p>
              </div>
              <span className="text-slate-400 text-2xl hidden md:inline">→</span>
              <div className="text-center w-full md:w-1/3">
                <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-2 text-amber-500" />
                <h4 className="font-semibold text-slate-900 text-sm">Dead Stock</h4>
                <p className="text-xs text-slate-500 mt-1">Outdated / Damaged</p>
              </div>
              <span className="text-slate-400 text-2xl hidden md:inline">→</span>
              <div className="text-center w-full md:w-1/3">
                <TrashIcon className="w-12 h-12 mx-auto mb-2 text-red-500" />
                <h4 className="font-semibold text-slate-900 text-sm">Disposal</h4>
                <p className="text-xs text-slate-500 mt-1">Recycling / Auction</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scheduled Info Alert */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-850 text-sm">
          <ArrowTrendingUpIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-sky-600" />
          <p>
            <span className="font-semibold">Scheduled Automation:</span> Lifecycle automation runs daily at 1:00 AM IST.
            Assets are automatically evaluated and moved through stages based on criteria.
          </p>
        </div>
      </div>

      {/* Result Dialog Modal */}
      {resultDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-2xl w-full shadow-card-xl p-6 space-y-4 animate-fade-in-up">
            <h3 className="text-lg font-bold font-display text-slate-900">Automation Results</h3>
            
            {result && (
              <div className="space-y-4">
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-lg">
                  ✅ Completed in {result.duration}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4">
                    <h4 className="font-bold text-amber-700 text-sm mb-2">
                      Dead Stock: {result.deadStock.count}
                    </h4>
                    <div className="space-y-1 text-xs text-slate-600">
                      {result.deadStock.assets.slice(0, 5).map((asset, i) => (
                        <p key={i}>• {asset.assetId}: {asset.reason}</p>
                      ))}
                      {result.deadStock.count > 5 && (
                        <p className="text-slate-400 italic">... and {result.deadStock.count - 5} more</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-red-50/50 border border-red-100 rounded-xl p-4">
                    <h4 className="font-bold text-red-700 text-sm mb-2">
                      Disposal: {result.disposal.count}
                    </h4>
                    <div className="space-y-1 text-xs text-slate-600">
                      {result.disposal.records.slice(0, 5).map((record, i) => (
                        <p key={i}>• {record.assetId}: {record.method} - ₹{record.value}</p>
                      ))}
                      {result.disposal.count > 5 && (
                        <p className="text-slate-400 italic">... and {result.disposal.count - 5} more</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setResultDialog(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default LifecycleManagementPage;
