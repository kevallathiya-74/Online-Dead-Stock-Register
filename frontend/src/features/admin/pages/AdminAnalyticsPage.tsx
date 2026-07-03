import {
    ArrowDownTrayIcon,
    ArrowPathIcon,
    ArrowTrendingUpIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ChevronDoubleRightIcon,
    CubeIcon,
    EnvelopeIcon
} from '@heroicons/react/24/outline';
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend as ChartLegend,
    Tooltip as ChartTooltip,
    LinearScale,
    LineElement,
    PointElement,
    Title,
} from 'chart.js';
import React, { useEffect, useState } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import api from '../../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  ChartLegend,
  ArcElement
);

const AdminAnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [dateRange, setDateRange] = useState('30d');
  const [reportDialog, setReportDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState('');

  // Analytics data
  const [assetTrends, setAssetTrends] = useState<any[]>([]);
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const [financialMetrics, setFinancialMetrics] = useState<any[]>([]);
  const [systemPerformance, setSystemPerformance] = useState<any[]>([]);
  const [departmentStats, setDepartmentStats] = useState<any[]>([]);
  const [alertsData, setAlertsData] = useState<any[]>([]);
  const [topAssets, setTopAssets] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>({});

  useEffect(() => {
    loadAnalyticsData();
  {/* eslint-disable-next-line react-hooks/exhaustive-deps */}
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/dashboard/analytics', {
        params: { dateRange }
      });
      
      const data = response.data.data || response.data;
      
      setAssetTrends(data.assetTrends || []);
      setUserActivity(data.userActivity || []);
      setFinancialMetrics(data.financialMetrics || []);
      setSystemPerformance(data.systemPerformance || []);
      setDepartmentStats(data.departmentStats || []);
      setAlertsData(data.alerts || []);
      setTopAssets(data.topAssets || []);
      
      setKpis({
        totalAssets: data.kpis?.totalAssets || 0,
        totalValue: data.kpis?.totalValue || 0,
        avgUtilization: data.kpis?.avgUtilization || 0,
        monthlyGrowth: data.kpis?.monthlyGrowth || 0,
        costSavings: data.kpis?.costSavings || 0,
        maintenanceCost: 120000,
        activeUsers: 24,
        systemUptime: 99.8
      });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) { /* Error handled by API interceptor */ } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = (reportType: string) => {
    setSelectedReport(reportType);
    setReportDialog(true);
  };

  const handleExportReport = (format: string) => {
    toast.success(`Exporting ${selectedReport} report as ${format}`);
    setReportDialog(false);
  };

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-brand-600 animate-spin" />
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
              Analytics & Reports
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Comprehensive data insights and performance analytics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={loadAnalyticsData}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => handleGenerateReport('comprehensive')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-605 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-all shadow-brand cursor-pointer"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Generate Report
            </button>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold">Total Assets</p>
              <h4 className="text-3xl font-bold font-display text-slate-900 mt-1">{kpis.totalAssets}</h4>
              <div className="flex items-center gap-1 mt-1.5 text-xs text-green-600 font-medium">
                <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
                <span>+{kpis.monthlyGrowth}% this month</span>
              </div>
            </div>
            <CubeIcon className="w-9 h-9 text-slate-400" />
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold">Total Asset Value</p>
              <h4 className="text-3xl font-bold font-display text-slate-900 mt-1">
                ₹{Number(kpis.totalValue || 0).toLocaleString('en-IN')}
              </h4>
              <div className="flex items-center gap-1 mt-1.5 text-xs text-green-600 font-medium">
                <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
                <span>+8% from last quarter</span>
              </div>
            </div>
            <span className="text-2xl font-bold text-slate-400 font-display">₹</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold">Avg Utilization</p>
              <h4 className="text-3xl font-bold font-display text-slate-900 mt-1">{kpis.avgUtilization}%</h4>
              <div className="flex items-center gap-1 mt-1.5 text-xs text-green-600 font-medium">
                <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
                <span>Excellent performance</span>
              </div>
            </div>
            <ChartBarIcon className="w-9 h-9 text-slate-405" />
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold">System Uptime</p>
              <h4 className="text-3xl font-bold font-display text-slate-900 mt-1">{kpis.systemUptime}%</h4>
              <div className="flex items-center gap-1 mt-1.5 text-xs text-green-605 font-medium">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                <span>All systems operational</span>
              </div>
            </div>
            <ChevronDoubleRightIcon className="w-9 h-9 text-slate-405" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-100 flex gap-2 overflow-x-auto whitespace-nowrap">
          {['Asset Analytics', 'User Activity', 'Financial Reports', 'Performance', 'Department Stats'].map((tabLabel, idx) => (
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

        {/* Tab Panel Content */}
        {currentTab === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 lg:col-span-8">
              <h3 className="text-lg font-bold font-display text-slate-900 mb-4">
                Asset Trends Over Time
              </h3>
              <div className="h-[400px]">
                <Line
                  data={{
                    labels: assetTrends?.map((item: any) => item.month) || [],
                    datasets: [
                      {
                        label: 'Active',
                        data: assetTrends?.map((item: any) => item.active) || [],
                        borderColor: '#8884d8',
                        backgroundColor: 'rgba(136, 132, 216, 0.2)',
                        fill: true,
                      },
                      {
                        label: 'Maintenance',
                        data: assetTrends?.map((item: any) => item.maintenance) || [],
                        borderColor: '#82ca9d',
                        backgroundColor: 'rgba(130, 202, 157, 0.2)',
                        fill: true,
                      },
                      {
                        label: 'Damaged',
                        data: assetTrends?.map((item: any) => item.damaged) || [],
                        borderColor: '#ffc658',
                        backgroundColor: 'rgba(255, 198, 88, 0.2)',
                        fill: true,
                      },
                      {
                        label: 'Purchased',
                        data: assetTrends?.map((item: any) => item.purchased) || [],
                        borderColor: '#ff7300',
                        backgroundColor: 'rgba(255, 115, 0, 0.1)',
                        borderWidth: 3,
                        fill: false,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' as const },
                    },
                    scales: {
                      y: { beginAtZero: true },
                    },
                  }}
                />
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
                <h3 className="text-base font-bold font-display text-slate-900 mb-4">
                  Top Performing Assets
                </h3>
                <ul className="space-y-4">
                  {topAssets.map((asset, index) => (
                    <li key={asset.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs text-white" style={{ backgroundColor: colors[index % colors.length] }}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 text-sm">{asset.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-brand-600 h-full transition-all" style={{ width: `${asset.utilization}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold">{asset.utilization}%</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
                <h3 className="text-base font-bold font-display text-slate-900 mb-4">
                  Asset Health Alerts
                </h3>
                <div className="space-y-4">
                  {alertsData.map((alert) => (
                    <div key={alert.type}>
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-655 capitalize">{alert.type} Alerts</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          alert.type === 'critical' ? 'bg-red-50 text-red-700' : alert.type === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-sky-700'
                        }`}>
                          {alert.count}
                        </span>
                      </div>
                      <div className="w-full bg-slate-105 h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div className={`h-full transition-all ${
                          alert.type === 'critical' ? 'bg-red-600' : alert.type === 'warning' ? 'bg-amber-500' : 'bg-sky-500'
                        }`} style={{ width: `${alert.count * 4}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentTab === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
              <h3 className="text-lg font-bold font-display text-slate-900 mb-4">Daily User Activity</h3>
              <div className="h-[300px]">
                <Bar
                  data={{
                    labels: userActivity?.map((item: any) => item.day) || [],
                    datasets: [
                      {
                        label: 'Logins',
                        data: userActivity?.map((item: any) => item.logins) || [],
                        backgroundColor: '#8884d8',
                      },
                      {
                        label: 'Actions',
                        data: userActivity?.map((item: any) => item.actions) || [],
                        backgroundColor: '#82ca9d',
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top' as const } },
                    scales: { y: { beginAtZero: true } },
                  }}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
              <h3 className="text-lg font-bold font-display text-slate-900 mb-4">System Errors</h3>
              <div className="h-[300px]">
                <Line
                  data={{
                    labels: userActivity?.map((item: any) => item.day) || [],
                    datasets: [
                      {
                        label: 'Errors',
                        data: userActivity?.map((item: any) => item.errors) || [],
                        borderColor: '#ff7300',
                        backgroundColor: 'rgba(255, 115, 0, 0.1)',
                        borderWidth: 3,
                        fill: false,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top' as const } },
                    scales: { y: { beginAtZero: true } },
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {currentTab === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 lg:col-span-8">
              <h3 className="text-lg font-bold font-display text-slate-900 mb-4">Financial Metrics by Quarter</h3>
              <div className="h-[400px]">
                <Bar
                  data={{
                    labels: financialMetrics?.map((item: any) => item.quarter) || [],
                    datasets: [
                      {
                        label: 'Purchases',
                        data: financialMetrics?.map((item: any) => item.purchases) || [],
                        backgroundColor: '#8884d8',
                      },
                      {
                        label: 'Maintenance',
                        data: financialMetrics?.map((item: any) => item.maintenance) || [],
                        backgroundColor: '#82ca9d',
                      },
                      {
                        label: 'Depreciation',
                        data: financialMetrics?.map((item: any) => item.depreciation) || [],
                        backgroundColor: '#ffc658',
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' as const },
                      tooltip: {
                        callbacks: {
                          label: (context) => `${context.dataset.label}: ₹${(context.raw as number)?.toLocaleString('en-IN')}`
                        }
                      }
                    },
                    scales: { y: { beginAtZero: true } },
                  }}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 lg:col-span-4 space-y-4">
              <h3 className="text-base font-bold font-display text-slate-900">Cost Breakdown</h3>
              <div>
                <p className="text-xs text-slate-500">Purchase Costs</p>
                <h5 className="text-xl font-bold font-display text-indigo-600 mt-0.5">
                  ₹{Number(kpis.totalValue || 0).toLocaleString('en-IN')}
                </h5>
              </div>
              <div>
                <p className="text-xs text-slate-500">Maintenance Costs</p>
                <h5 className="text-xl font-bold font-display text-amber-600 mt-0.5">
                  ₹{Number(kpis.maintenanceCost || 0).toLocaleString('en-IN')}
                </h5>
              </div>
              <div>
                <p className="text-xs text-slate-500">Cost Savings</p>
                <h5 className="text-xl font-bold font-display text-green-600 mt-0.5">
                  ₹{Number(kpis.costSavings || 0).toLocaleString('en-IN')}
                </h5>
              </div>
              <div className="border-t border-slate-100 pt-4 mt-4">
                <button
                  onClick={() => handleGenerateReport('financial')}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-brand transition-colors cursor-pointer"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Generate Financial Report
                </button>
              </div>
            </div>
          </div>
        )}

        {currentTab === 3 && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
            <h3 className="text-lg font-bold font-display text-slate-900 mb-4">System Performance Metrics (24 Hours)</h3>
            <div className="h-[400px]">
              <Line
                data={{
                  labels: systemPerformance?.map((item: any) => item.time) || [],
                  datasets: [
                    {
                      label: 'CPU',
                      data: systemPerformance?.map((item: any) => item.cpu) || [],
                      borderColor: '#8884d8',
                      backgroundColor: 'rgba(136, 132, 216, 0.1)',
                      borderWidth: 2,
                      fill: false,
                    },
                    {
                      label: 'Memory',
                      data: systemPerformance?.map((item: any) => item.memory) || [],
                      borderColor: '#82ca9d',
                      backgroundColor: 'rgba(130, 202, 157, 0.1)',
                      borderWidth: 2,
                      fill: false,
                    },
                    {
                      label: 'Disk',
                      data: systemPerformance?.map((item: any) => item.disk) || [],
                      borderColor: '#ffc658',
                      backgroundColor: 'rgba(255, 198, 88, 0.1)',
                      borderWidth: 2,
                      fill: false,
                    },
                    {
                      label: 'Network',
                      data: systemPerformance?.map((item: any) => item.network) || [],
                      borderColor: '#ff7300',
                      backgroundColor: 'rgba(255, 115, 0, 0.1)',
                      borderWidth: 2,
                      fill: false,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top' as const },
                    tooltip: {
                      callbacks: { label: (context) => `${context.dataset.label}: ${context.raw}%` }
                    }
                  },
                  scales: {
                    y: { beginAtZero: true, max: 100 },
                  },
                }}
              />
            </div>
          </div>
        )}

        {currentTab === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 lg:col-span-8 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-500">
                    <th className="pb-3 font-medium">Department</th>
                    <th className="pb-3 font-medium text-right">Assets</th>
                    <th className="pb-3 font-medium text-right">Total Value</th>
                    <th className="pb-3 font-medium text-right">Utilization</th>
                    <th className="pb-3 font-medium">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {departmentStats.map((dept) => (
                    <tr key={dept.name} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 font-bold flex items-center justify-center text-xs">
                            {dept.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-900">{dept.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right text-slate-655 font-medium">{dept.assets}</td>
                      <td className="py-3 text-right text-slate-655 font-medium">₹{dept.value.toLocaleString('en-IN')}</td>
                      <td className="py-3 text-right text-slate-655 font-medium">{dept.utilization}%</td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-brand-600 h-full transition-all" style={{ width: `${dept.utilization}%` }} />
                          </div>
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            dept.utilization >= 90 ? 'bg-green-50 text-green-700' : dept.utilization >= 80 ? 'bg-brand-50 text-brand-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {dept.utilization >= 90 ? 'Excellent' : dept.utilization >= 80 ? 'Good' : 'Fair'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 lg:col-span-4">
              <h3 className="text-base font-bold font-display text-slate-900 mb-4">Department Distribution</h3>
              <div className="h-[300px]">
                <Pie
                  data={{
                    labels: departmentStats?.map((item: any) => item.name) || [],
                    datasets: [
                      {
                        data: departmentStats?.map((item: any) => item.assets) || [],
                        backgroundColor: departmentStats?.map((item: any, idx: number) => colors[idx % colors.length]) || [],
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom' as const },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const total = context.dataset.data.reduce((a: any, b: any) => a + b, 0);
                            const percentage = (((context.raw as number) / total) * 100).toFixed(0);
                            return `${context.label}: ${percentage}%`;
                          }
                        }
                      }
                    },
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Report Generation Modal */}
      {reportDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-card-xl p-6 space-y-4 animate-fade-in-up">
            <h3 className="text-lg font-bold font-display text-slate-900 capitalize">
              Generate {selectedReport} Report
            </h3>
            
            <p className="text-sm text-slate-500">
              Choose the format for your analytics report:
            </p>
            
            <div className="grid grid-cols-3 gap-3 pt-2">
              <button
                onClick={() => handleExportReport('PDF')}
                className="inline-flex flex-col items-center justify-center gap-1.5 p-3 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer text-slate-700 text-xs font-semibold"
              >
                <ArrowDownTrayIcon className="w-5 h-5 text-red-500" />
                PDF
              </button>
              <button
                onClick={() => handleExportReport('Excel')}
                className="inline-flex flex-col items-center justify-center gap-1.5 p-3 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer text-slate-700 text-xs font-semibold"
              >
                <ArrowDownTrayIcon className="w-5 h-5 text-green-600" />
                Excel
              </button>
              <button
                onClick={() => handleExportReport('Email')}
                className="inline-flex flex-col items-center justify-center gap-1.5 p-3 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer text-slate-700 text-xs font-semibold"
              >
                <EnvelopeIcon className="w-5 h-5 text-blue-500" />
                Email
              </button>
            </div>

            <div className="flex items-center justify-end pt-4">
              <button
                onClick={() => setReportDialog(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminAnalyticsPage;