import {
    ArrowDownTrayIcon,
    ArrowPathIcon,
    ArrowTrendingUpIcon,
    CalendarDaysIcon,
    CubeIcon,
    DocumentTextIcon,
    EyeIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    PencilSquareIcon,
    PlayIcon,
    PlusIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import api from '../../../services/api';

interface Report {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'table' | 'chart' | 'dashboard';
  lastRun: string;
  createdBy: string;
  status: 'Active' | 'Draft' | 'Scheduled';
  frequency: string;
  recipients: string[];
  fileFormat: string;
  parameters: any;
}

const AdminReportsPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [reports, setReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [createDialog, setCreateDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [runProgress, setRunProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await api.get('/reports');
      const reportsData = response.data.data || response.data;
      setReports(reportsData);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) { /* Error handled by API interceptor */ }
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'table':
        return <DocumentTextIcon className="w-5 h-5 text-brand-600" />;
      case 'chart':
        return <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />;
      case 'dashboard':
        return <ChartBarIconCustom className="w-5 h-5 text-amber-600" />;
      default:
        return <DocumentTextIcon className="w-5 h-5 text-slate-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-50 text-green-700 border border-green-150';
      case 'Scheduled':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-150';
      case 'Draft':
        return 'bg-amber-50 text-amber-700 border border-amber-150';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-150';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Assets':
        return <CubeIcon className="w-5 h-5" />;
      case 'Financial':
        return <span className="font-bold text-sm">₹</span>;
      case 'Users':
        return <UsersIcon className="w-5 h-5" />;
      case 'Analytics':
        return <ArrowTrendingUpIcon className="w-5 h-5" />;
      default:
        return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || report.category.toLowerCase() === filterCategory.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });

  const runReport = async (report: Report) => {
    setSelectedReport(report);
    setIsRunning(true);
    setRunProgress(0);

    try {
      await api.post(`/reports/${report.id}/run`, {}, {
        onDownloadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setRunProgress(progress);
        },
      });

      setIsRunning(false);
      setSelectedReport(null);
      toast.success(`${report.name} generated successfully!`);
      loadReports();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      setIsRunning(false);
      setSelectedReport(null);
      toast.error('Failed to generate report');
    }
  };

  const reportsByCategory = [
    { category: 'Assets', count: reports.filter(r => r.category === 'Assets').length },
    { category: 'Financial', count: reports.filter(r => r.category === 'Financial').length },
    { category: 'Users', count: reports.filter(r => r.category === 'Users').length },
    { category: 'Inventory', count: reports.filter(r => r.category === 'Inventory').length },
    { category: 'Analytics', count: reports.filter(r => r.category === 'Analytics').length },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold font-display text-slate-900">
              Reports
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Generate, manage, and schedule automated reports
            </p>
          </div>
          <button
            onClick={() => setCreateDialog(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-all shadow-brand cursor-pointer self-start sm:self-auto"
          >
            <PlusIcon className="w-4 h-4" />
            Create Report
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
              <DocumentTextIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-2xl font-bold text-slate-900 font-display">{reports.length}</h4>
              <p className="text-xs text-slate-500 font-medium">Total Reports</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
              <PlayIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-2xl font-bold text-slate-900 font-display">
                {reports.filter(r => r.status === 'Active').length}
              </h4>
              <p className="text-xs text-slate-500 font-medium">Active Reports</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <CalendarDaysIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-2xl font-bold text-slate-900 font-display">
                {reports.filter(r => r.frequency !== 'On-demand').length}
              </h4>
              <p className="text-xs text-slate-500 font-medium">Scheduled Reports</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <FunnelIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-2xl font-bold text-slate-900 font-display">{reportsByCategory.length}</h4>
              <p className="text-xs text-slate-500 font-medium">Categories</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-100 flex gap-2">
          {['All Reports', 'By Category', 'Scheduled Reports'].map((tabLabel, idx) => (
            <button
              key={tabLabel}
              onClick={() => setCurrentTab(idx)}
              className={`px-4 py-2 border-b-2 text-sm font-semibold transition-all cursor-pointer ${
                currentTab === idx
                  ? 'border-brand-650 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tabLabel}
            </button>
          ))}
        </div>

        {/* Tab Panels */}
        {currentTab === 0 && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:max-w-md">
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-405" />
              </div>

              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full md:w-48 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="all">All Categories</option>
                  <option value="Assets">Assets</option>
                  <option value="Financial">Financial</option>
                  <option value="Users">Users</option>
                  <option value="Inventory">Inventory</option>
                  <option value="Analytics">Analytics</option>
                </select>
                <button
                  onClick={loadReports}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  Refresh
                </button>
                <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">
                  {filteredReports.length} of {reports.length} reports
                </span>
              </div>
            </div>

            {/* Reports List Table */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-500">
                    <th className="pb-3 font-medium">Report</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Frequency</th>
                    <th className="pb-3 font-medium">Last Run</th>
                    <th className="pb-3 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          {getReportIcon(report.type)}
                          <div>
                            <p className="font-semibold text-slate-900">{report.name}</p>
                            <p className="text-xs text-slate-400 leading-normal">{report.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-slate-200 rounded text-xs font-semibold text-slate-655 bg-slate-50/50">
                          {report.category}
                        </span>
                      </td>
                      <td className="py-3 capitalize text-slate-500">{report.type}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadge(report.status)}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-655 font-medium">{report.frequency}</td>
                      <td className="py-3 text-slate-500">
                        {new Date(report.lastRun).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => runReport(report)}
                            disabled={isRunning}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 disabled:opacity-40 transition-colors"
                            title="Run Report"
                          >
                            <PlayIcon className="w-4 h-4 text-green-600" />
                          </button>
                          <button
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                            title="Download CSV/PDF"
                          >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                            title="Edit"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentTab === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportsByCategory.map((cat) => (
              <div key={cat.category} className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
                <div className="flex items-center gap-2 mb-3 text-brand-600">
                  {getCategoryIcon(cat.category)}
                  <h3 className="text-base font-bold font-display text-slate-900">{cat.category}</h3>
                </div>
                <h4 className="text-3xl font-bold font-display text-slate-900">{cat.count}</h4>
                <p className="text-xs text-slate-500 mt-1">Reports available in category</p>
                
                <button
                  onClick={() => {
                    setFilterCategory(cat.category);
                    setCurrentTab(0);
                  }}
                  className="mt-4 inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors cursor-pointer"
                >
                  View Reports &rarr;
                </button>
              </div>
            ))}
          </div>
        )}

        {currentTab === 2 && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
            <ul className="divide-y divide-slate-50">
              {reports.filter(r => r.frequency !== 'On-demand').map((report) => (
                <li key={report.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getReportIcon(report.type)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{report.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{report.description}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Frequency: <span className="font-medium text-slate-600">{report.frequency}</span> • Last Run: {new Date(report.lastRun).toLocaleDateString()} • Recipients: {report.recipients.length}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 border border-indigo-150 text-indigo-700">
                      {report.frequency}
                    </span>
                    <button
                      onClick={() => runReport(report)}
                      disabled={isRunning}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-40 transition-colors"
                    >
                      <PlayIcon className="w-4.5 h-4.5 text-green-600" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Progress Overlay Modal */}
      {isRunning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full shadow-card-xl p-6 space-y-4 text-center animate-fade-in-up">
            <h3 className="text-lg font-bold font-display text-slate-900">Generating Report</h3>
            <p className="text-sm text-slate-500 font-semibold">{selectedReport?.name}</p>
            
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-brand-600 h-full transition-all" style={{ width: `${runProgress}%` }} />
            </div>
            
            <p className="text-xs text-slate-400 font-semibold">Progress: {runProgress}%</p>
          </div>
        </div>
      )}

      {/* Create Report Dialog */}
      {createDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-card-xl p-6 space-y-4 animate-fade-in-up">
            <h3 className="text-lg font-bold font-display text-slate-900">Create New Report</h3>
            
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-100 text-sky-850 text-xs">
              This feature allows you to create custom reports with various data sources, criteria filters, and delivery channels.
            </div>

            <div className="space-y-2 text-xs text-slate-655 font-medium pl-1">
              <p className="font-semibold text-slate-800">Report Creation Wizard will guide you through:</p>
              <p>• Data source table selection</p>
              <p>• Custom fields layout configuration</p>
              <p>• Filters & sorting criteria</p>
              <p>• Output delivery format selection (Excel, CSV, PDF)</p>
              <p>• Automated cron scheduler details</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setCreateDialog(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.success('Report creation wizard will be available soon!');
                  setCreateDialog(false);
                }}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer animate-pulse"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

// Custom inline mini component to replace PieChartIcon/BarChartIcon Mui items
const ChartBarIconCustom = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
  </svg>
);

export default AdminReportsPage;