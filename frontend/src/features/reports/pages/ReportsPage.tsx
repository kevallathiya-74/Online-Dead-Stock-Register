import {
    ArrowDownTrayIcon,
    ArrowPathIcon,
    ArrowTrendingUpIcon,
    BanknotesIcon,
    CubeIcon,
    DocumentChartBarIcon,
    MapPinIcon,
    TagIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import api from '../../../services/api';

interface ReportTemplate {
  _id: string;
  name: string;
  category: string;
  description: string;
  type: string;
  frequency: string;
  lastGenerated?: string;
  parameters: string[];
  format: string;
  status: string;
  generationCount: number;
}

interface AssetSummary {
  totalAssets: number;
  activeAssets: number;
  inactiveAssets: number;
  underMaintenance: number;
  totalValue: number;
  depreciatedValue: number;
  byCategory: { category: string; count: number; value: number }[];
  byLocation: { location: string; count: number; percentage: number }[];
  byStatus: { status: string; count: number; percentage: number }[];
}

const ReportsPage = () => {
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [assetSummary, setAssetSummary] = useState<AssetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date()
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const navigate = useNavigate();

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [templatesRes, summaryRes] = await Promise.all([
        api.get('/reports/templates').catch(() => {
          return { data: { data: [] } };
        }),
        api.get('/reports/asset-summary').catch(() => {
          return { data: { data: null } };
        })
      ]);
      
      setReportTemplates(Array.isArray(templatesRes.data.data) ? templatesRes.data.data : []);
      setAssetSummary(summaryRes.data.data || summaryRes.data || null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load report data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const categories = Array.from(new Set(reportTemplates.map(r => r.category)));

  const filteredTemplates = reportTemplates.filter(
    template => selectedCategory === 'all' || template.category === selectedCategory
  );

  const getTypeBadgeClass = (type: string) => {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('table') || lowerType.includes('detailed')) return 'bg-blue-50 text-blue-700 border-blue-105';
    if (lowerType.includes('chart') || lowerType.includes('analytics')) return 'bg-purple-50 text-purple-705 border-purple-100';
    if (lowerType.includes('summary')) return 'bg-sky-50 text-sky-700 border-sky-100';
    return 'bg-slate-50 text-slate-700 border-slate-105';
  };

  const handleRefresh = async () => {
    toast.info('Refreshing report data...');
    await loadDashboardData();
    toast.success('Report data refreshed successfully');
  };

  const handleGenerateReport = async (template: ReportTemplate) => {
    try {
      const loadingToast = toast.loading(`Generating ${template.name}...`);
      
      const response = await api.post('/reports/generate', {
        template_id: template._id,
        format: template.format || 'PDF',
        parameters: {}
      });

      if (response.data.success) {
        const templatesRes = await api.get('/reports/templates');
        setReportTemplates(templatesRes.data.data || []);
        
        if (response.data.data?.report_id) {
          try {
            const downloadResponse = await api.get(
              `/reports/${response.data.data.report_id}/download`,
              { responseType: 'blob' }
            );
            
            const blob = new Blob([downloadResponse.data], { type: 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${template.name.replace(/\s+/g, '-')}-${response.data.data.report_id}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            toast.dismiss(loadingToast);
            toast.success(`Report "${template.name}" generated and downloaded successfully!`);
          } catch (downloadError: any) {
            toast.dismiss(loadingToast);
            toast.error(downloadError.response?.data?.message || 'Failed to download report');
          }
        } else {
          toast.dismiss(loadingToast);
          toast.error('Report generated but download link not available');
        }
      } else {
        toast.dismiss(loadingToast);
        toast.error('Report generation failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate report';
      toast.error(errorMessage);
    }
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'Inventory': return <CubeIcon className="w-5 h-5 text-brand-600" />;
      case 'Analytics': return <ArrowTrendingUpIcon className="w-5 h-5 text-purple-600" />;
      case 'Financial': return <BanknotesIcon className="w-5 h-5 text-green-600" />;
      case 'Tracking': return <TagIcon className="w-5 h-5 text-sky-600" />;
      default: return <DocumentChartBarIcon className="w-5 h-5 text-slate-500" />;
    }
  };

  const stats = {
    totalTemplates: reportTemplates.length,
    activeTemplates: reportTemplates.filter(r => r.status === 'active').length,
    totalAssets: assetSummary?.totalAssets || 0,
    totalValue: assetSummary?.totalValue || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-655">
        
        {/* Header Title Controls */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-905">Asset Reports & Analytics</h2>
            <p className="text-slate-450 mt-1">Generate comprehensive asset reports with real-time data</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-205 text-slate-700 font-semibold rounded-xl bg-white hover:bg-slate-50 cursor-pointer disabled:opacity-50"
          >
            <ArrowPathIcon className="w-4 h-4 animate-spin-hover" />
            Refresh Data
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold">Dismiss</button>
          </div>
        )}

        {/* Stats Panel cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Report Templates</p>
              <h3 className="text-lg font-bold text-slate-905 font-display mt-1">{loading ? '...' : stats.activeTemplates}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <DocumentChartBarIcon className="w-5.5 h-5.5" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Assets</p>
              <h3 className="text-lg font-bold text-slate-905 font-display mt-1">{loading ? '...' : stats.totalAssets}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <CubeIcon className="w-5.5 h-5.5" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Value</p>
              <h3 className="text-lg font-bold text-slate-905 font-display mt-1">
                {loading ? '...' : `₹${Number(stats.totalValue).toLocaleString('en-IN')}`}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <BanknotesIcon className="w-5.5 h-5.5" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Assets</p>
              <h3 className="text-lg font-bold text-slate-905 font-display mt-1">{loading ? '...' : assetSummary?.activeAssets || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ArrowTrendingUpIcon className="w-5.5 h-5.5" />
            </div>
          </div>
        </div>

        {/* Date scope filter parameters */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-card grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div>
            <label className="block font-semibold text-slate-655 mb-1">Category Filter</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-655 mb-1">Start Date</label>
            <input
              type="date"
              value={selectedDateRange.startDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDateRange(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
              className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-655 mb-1">End Date</label>
            <input
              type="date"
              value={selectedDateRange.endDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDateRange(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
              className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-slate-50/50"
            />
          </div>

          <div className="pt-4 text-slate-450 font-medium">
            Showing {filteredTemplates.length} of {reportTemplates.length} templates
          </div>
        </div>

        {/* Report templates list card grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-slate-100 rounded-xl p-5 shadow-card animate-pulse space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-100" />
                <div className="h-4 bg-slate-100 rounded w-2/3" />
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-8 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="p-4 bg-slate-50 border border-slate-150 text-slate-500 rounded-xl text-center font-medium">
            No report templates found. Try resetting the category filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div key={template._id} className="bg-white border border-slate-100 rounded-xl p-5 shadow-card flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
                      {getIcon(template.category)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-905 text-sm">{template.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{template.category}</p>
                    </div>
                  </div>

                  <p className="text-slate-500 leading-relaxed min-h-[40px]">{template.description}</p>

                  <div className="flex flex-wrap gap-1.5 font-bold">
                    <span className={`px-2 py-0.5 border rounded-full text-[9px] ${getTypeBadgeClass(template.type)}`}>
                      {template.type}
                    </span>
                    <span className="px-2 py-0.5 border border-slate-150 bg-slate-50 text-slate-655 rounded-full text-[9px]">
                      {template.frequency}
                    </span>
                    <span className="px-2 py-0.5 border border-sky-100 bg-sky-50 text-sky-700 rounded-full text-[9px]">
                      {template.format}
                    </span>
                  </div>

                  {template.lastGenerated && (
                    <p className="text-[9.5px] text-slate-400 font-semibold">
                      Last generated: {new Date(template.lastGenerated).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleGenerateReport(template)}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl cursor-pointer shadow-brand"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Generate Report
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Assets Summary section grids */}
        {assetSummary && (
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-bold font-display text-slate-905">Executive Asset Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Category table */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
                <h4 className="font-bold text-slate-905 text-xs flex items-center gap-1.5 mb-3">
                  <TagIcon className="w-4.5 h-4.5 text-slate-500" />
                  Assets by Category
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase">
                        <th className="pb-2">Category</th>
                        <th className="pb-2 text-right">Count</th>
                        <th className="pb-2 text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700 font-semibold">
                      {assetSummary.byCategory && assetSummary.byCategory.length > 0 ? (
                        assetSummary.byCategory.map((item) => (
                          <tr key={item.category}>
                            <td className="py-2.5 font-bold text-slate-805">{item.category}</td>
                            <td className="py-2.5 text-right text-slate-655">{item.count}</td>
                            <td className="py-2.5 text-right text-brand-600">₹{Number(item.value).toLocaleString('en-IN')}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-slate-400 font-medium">No category stats.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Location table */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
                <h4 className="font-bold text-slate-905 text-xs flex items-center gap-1.5 mb-3">
                  <MapPinIcon className="w-4.5 h-4.5 text-slate-500" />
                  Assets by Location
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase">
                        <th className="pb-2">Location</th>
                        <th className="pb-2 text-right">Count</th>
                        <th className="pb-2 text-right">% Allocation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700 font-semibold">
                      {assetSummary.byLocation && assetSummary.byLocation.length > 0 ? (
                        assetSummary.byLocation.map((item) => (
                          <tr key={item.location}>
                            <td className="py-2.5 font-bold text-slate-805">{item.location}</td>
                            <td className="py-2.5 text-right text-slate-655">{item.count}</td>
                            <td className="py-2.5 text-right text-purple-600">{item.percentage}%</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-slate-400 font-medium">No location stats.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
