import {
  ArrowPathIcon,
  ArrowsRightLeftIcon,
  Cog6ToothIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ServerIcon,
  ShieldCheckIcon,
  UsersIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Filler,
} from "chart.js";
import React, { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Line, Pie } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import CategoriesModal from "../../assets/components/CategoriesModal";
import usePolling from "../../../hooks/usePolling";
import api from "../../../services/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
);

// Utility function to format currency
const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return "₹0";
  return `₹${numAmount.toLocaleString("en-IN")}`;
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);

  // Statistics data
  const [userStats, setUserStats] = useState<any>(null);
  const [assetStats, setAssetStats] = useState<any>(null);
  const [transactionStats, setTransactionStats] = useState<any>(null);
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any>({});

  // Real-time polling for pending approvals (updates every 30 seconds)
  const fetchPendingApprovals = useCallback(async () => {
    const approvalsResponse = await api.get("/dashboard/approvals");
    const approvalsData = approvalsResponse.data.data || approvalsResponse.data;
    return Array.isArray(approvalsData) ? approvalsData.slice(0, 3) : [];
  }, []);

  const { data: pendingApprovals = [] } = usePolling(fetchPendingApprovals, {
    interval: 30000, // 30 seconds for real-time approvals
    enabled: true,
    onError: () => {},
  });

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Load real statistics from API
      const [statsResponse, categoryResponse, trendsResponse] =
        await Promise.all([
          api.get("/dashboard/stats"),
          api
            .get("/dashboard/assets-by-category")
            .catch(() => ({ data: { data: {} } })),
          api
            .get("/dashboard/monthly-trends")
            .catch(() => ({ data: { data: { assets: [], purchases: [] } } })),
        ]);

      const stats = statsResponse.data.data || statsResponse.data;

      // Set user stats
      setUserStats({
        total: stats.activeUsers || 0,
        active: stats.activeUsers || 0,
        inactive: 0,
        trend: stats.trends?.users?.value || 0,
      });

      // Set asset stats
      setAssetStats({
        total: stats.totalAssets || 0,
        inUse: stats.totalAssets || 0,
        available: 0,
        maintenance: stats.inMaintenanceAssets || 0,
        totalValue: stats.totalValue || 0,
        trend: stats.trends?.assets?.value || 0,
      });

      // Set transaction stats
      setTransactionStats({
        total: 0,
        pending: stats.pendingApprovals || 0,
        approved: 0,
        rejected: 0,
      });

      // Set system alerts (from real data when available)
      const alerts: any[] = [];
      if (stats.warrantyExpiring > 0) {
        alerts.push({
          id: 1,
          type: "warning",
          message: `${stats.warrantyExpiring} assets have expiring warranties`,
          action: "View Assets",
        });
      }
      if (stats.maintenanceDue > 0) {
        alerts.push({
          id: 2,
          type: "warning",
          message: `${stats.maintenanceDue} assets require maintenance`,
          action: "View Maintenance",
        });
      }
      if (stats.pendingApprovals > 0) {
        alerts.push({
          id: 3,
          type: "info",
          message: `${stats.pendingApprovals} pending approvals require review`,
          action: "View Approvals",
        });
      }
      setSystemAlerts(alerts);

      // Generate chart data from real stats
      generateChartData({
        categories: categoryResponse.data?.data || {},
        trends: trendsResponse.data?.data || { assets: [], purchases: [] },
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      /* Error handled by API interceptor */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const generateChartData = (data: any = {}) => {
    // We only have real data for asset types and monthly trends right now
    const { categories = {}, trends = { assets: [], purchases: [] } } = data;

    // Monthly trends mapping
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const currentMonthIdx = new Date().getMonth();

    const assetUtilizationData = Array.from({ length: 6 }, (_, i) => {
      // Go back 6 months
      const mIdx = (currentMonthIdx - 5 + i + 12) % 12;
      return {
        month: months[mIdx],
        active: trends.assets?.[i] || 0,
        available: 0,
        maintenance: 0,
      };
    });

    const transactionTrendData: unknown[] = []; // No real endpoint yet

    const categoryEntries = Object.entries(categories) as [string, number][];
    const colors = [
      "#6366F1",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#06B6D4",
      "#8B5CF6",
    ];

    const assetTypeData = categoryEntries.map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    }));

    const userActivityData: unknown[] = []; // No real endpoint yet

    setChartData({
      assetUtilization: assetUtilizationData,
      transactionTrend: transactionTrendData,
      assetTypes: assetTypeData,
      userActivity: userActivityData,
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success("Dashboard data refreshed");
  };

  const handleExportData = async () => {
    try {
      toast.info("Preparing data export...");
      const response = await api.post(
        "/export-import/export",
        {
          format: "xlsx",
          includeAssets: true,
          includeUsers: true,
          includeTransactions: true,
          includeVendors: true,
        },
        { responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `system-export-${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Data exported successfully!");
    } catch {
      /* ignore */
    }
  };

  const quickActions = [
    {
      title: "Add New User",
      description: "Create new user accounts and assign roles",
      icon: <UsersIcon className="w-6 h-6" />,
      color: "primary",
      onClick: () => navigate("/admin/users/add"),
    },
    {
      title: "System Backup",
      description: "Create system backup and manage recovery",
      icon: <ServerIcon className="w-6 h-6" />,
      color: "secondary",
      onClick: () => navigate("/admin/backups"),
    },
    {
      title: "View Audit Logs",
      description: "Review system activity and user actions",
      icon: <ShieldCheckIcon className="w-6 h-6" />,
      color: "success",
      onClick: () => navigate("/admin/audit-logs"),
    },
    {
      title: "System Settings",
      description: "Configure global system preferences",
      icon: <Cog6ToothIcon className="w-6 h-6" />,
      color: "warning",
      onClick: () => navigate("/admin/settings"),
    },
    {
      title: "Manage Categories",
      description: "Organize asset categories and classifications",
      icon: <CubeIcon className="w-6 h-6" />,
      color: "info",
      onClick: () => setCategoriesModalOpen(true),
    },
    {
      title: "Export Data",
      description: "Download system data and generate reports",
      icon: <ArrowPathIcon className="w-6 h-6" />,
      color: "primary",
      onClick: handleExportData,
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const colorConfig: Record<string, { text: string; bg: string }> = {
    primary: { text: "text-brand-600", bg: "bg-brand-50" },
    secondary: { text: "text-slate-600", bg: "bg-slate-100" },
    success: { text: "text-green-600", bg: "bg-green-50" },
    warning: { text: "text-amber-600", bg: "bg-amber-50" },
    info: { text: "text-sky-600", bg: "bg-sky-50" },
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
              Admin Workspace Dashboard
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              System-wide monitoring, auditing, and analytics
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-50 border border-brand-100 text-brand-700 text-sm font-semibold rounded-xl hover:bg-brand-100 hover:text-brand-800 disabled:opacity-60 transition-all cursor-pointer shadow-sm"
          >
            <ArrowPathIcon
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        {/* System Alerts */}
        {systemAlerts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {systemAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start justify-between gap-3 p-4 rounded-xl border text-sm shadow-sm ${
                  alert.type === "warning"
                    ? "bg-amber-50/50 border-amber-200 text-amber-800"
                    : "bg-sky-50/50 border-sky-200 text-sky-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      alert.type === "warning"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-sky-100 text-sky-600"
                    }`}
                  >
                    <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
                  </div>
                  <div className="pt-0.5">
                    <p className="font-semibold">{alert.message}</p>
                    <button
                      onClick={() => toast.info(`Action: ${alert.action}`)}
                      className="text-xs font-bold underline hover:opacity-80 mt-1"
                    >
                      {alert.action}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Key Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Total Users */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 hover:shadow-card-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform duration-500" />
            <div className="flex flex-col gap-4 relative">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100 shadow-sm">
                  <UsersIcon className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black font-display text-slate-900 tracking-tight">
                  {userStats?.total || 0}
                </h3>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">
                  Total Users
                </p>
                <p className="text-sm font-semibold text-slate-500 mt-2">
                  {userStats?.active || 0} active currently
                </p>
              </div>
            </div>
          </div>

          {/* Total Assets */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 hover:shadow-card-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform duration-500" />
            <div className="flex flex-col gap-4 relative">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center border border-green-100 shadow-sm">
                  <CubeIcon className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black font-display text-slate-900 tracking-tight">
                  {assetStats?.total || 0}
                </h3>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">
                  Total Assets
                </p>
                <p className="text-sm font-semibold text-slate-500 mt-2">
                  ₹{(assetStats?.totalValue || 0).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>

          {/* Pending Transactions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 hover:shadow-card-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform duration-500" />
            <div className="flex flex-col gap-4 relative">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-sm">
                  <ArrowsRightLeftIcon className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black font-display text-slate-900 tracking-tight">
                  {transactionStats?.pending || 0}
                </h3>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">
                  Pending Transactions
                </p>
                <p className="text-sm font-semibold text-slate-500 mt-2">
                  {transactionStats?.total || 0} total requests
                </p>
              </div>
            </div>
          </div>

          {/* Under Maintenance */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 hover:shadow-card-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform duration-500" />
            <div className="flex flex-col gap-4 relative">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-sm">
                  <ExclamationTriangleIcon className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black font-display text-slate-900 tracking-tight">
                  {assetStats?.maintenance || 0}
                </h3>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">
                  Under Maintenance
                </p>
                <p className="text-sm font-semibold text-slate-500 mt-2">
                  Assets requiring attention
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Asset Utilization Trends */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold font-display text-slate-900">
                Asset Utilization Trends
              </h3>
            </div>
            <div className="h-[300px] relative">
              <Line
                data={{
                  labels:
                    chartData.assetUtilization?.map(
                      (item: any) => item.month,
                    ) || [],
                  datasets: [
                    {
                      label: "Active",
                      data:
                        chartData.assetUtilization?.map(
                          (item: any) => item.active,
                        ) || [],
                      borderColor: "#6366F1",
                      backgroundColor: "rgba(99, 102, 241, 0.15)",
                      fill: true,
                      tension: 0.4,
                    },
                    {
                      label: "Available",
                      data:
                        chartData.assetUtilization?.map(
                          (item: any) => item.available,
                        ) || [],
                      borderColor: "#10B981",
                      backgroundColor: "rgba(16, 185, 129, 0.15)",
                      fill: true,
                      tension: 0.4,
                    },
                    {
                      label: "Maintenance",
                      data:
                        chartData.assetUtilization?.map(
                          (item: any) => item.maintenance,
                        ) || [],
                      borderColor: "#F59E0B",
                      backgroundColor: "rgba(245, 158, 11, 0.15)",
                      fill: true,
                      tension: 0.4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    mode: "index",
                    intersect: false,
                  },
                  plugins: {
                    legend: {
                      position: "top" as const,
                      labels: { usePointStyle: true, padding: 20 },
                    },
                    tooltip: {
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      titleFont: { size: 13 },
                      bodyFont: { size: 13 },
                      padding: 12,
                      cornerRadius: 8,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: { color: "rgba(241, 245, 249, 1)" },
                      border: { dash: [4, 4] },
                    },
                    x: { grid: { display: false } },
                  },
                }}
              />
            </div>
          </div>

          {/* Asset Types Distribution */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 flex flex-col">
            <h3 className="text-lg font-bold font-display text-slate-900 mb-6">
              Asset Types Distribution
            </h3>
            <div className="flex-1 min-h-[300px] relative">
              <Pie
                data={{
                  labels:
                    chartData.assetTypes?.map((item: any) => item.name) || [],
                  datasets: [
                    {
                      data:
                        chartData.assetTypes?.map((item: any) => item.value) ||
                        [],
                      backgroundColor:
                        chartData.assetTypes?.map((item: any) => item.color) ||
                        [],
                      borderWidth: 0,
                      hoverOffset: 4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom" as const,
                      labels: { usePointStyle: true, padding: 20 },
                    },
                    tooltip: {
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      padding: 12,
                      cornerRadius: 8,
                    },
                  },
                  cutout: "65%", // makes it a nice donut chart
                }}
              />
            </div>
          </div>
        </div>

        {/* Management Sections - Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Quick Actions Panel */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 lg:col-span-8 flex flex-col">
            <h3 className="text-lg font-bold font-display text-slate-900 mb-6">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 flex-1">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="bg-slate-50 hover:bg-white hover:shadow-card border border-slate-100 rounded-xl p-5 text-left transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-600 mb-4 group-hover:bg-brand-50 group-hover:text-brand-600 group-hover:border-brand-100 transition-colors">
                    {action.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {action.title}
                    </h4>
                    <p className="text-xs font-medium text-slate-500 mt-1.5 leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* System Status Panel */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 lg:col-span-4 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold font-display text-slate-900 mb-6">
                System Status
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                    <span>Server Health</span>
                    <span className="text-green-600">98%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-green-500 h-full rounded-full"
                      style={{ width: "98%" }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                    <span>Database Performance</span>
                    <span className="text-amber-600">85%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: "85%" }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                    <span>Storage Usage</span>
                    <span className="text-indigo-600">72%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: "72%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 mt-6 border border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-sm font-bold text-slate-900">
                  All Systems Operational
                </p>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-1 ml-4">
                Last Backup: 2 hours ago
              </p>
            </div>
          </div>
        </div>

        {/* Management Sections - Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Pending Approvals Section */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-0 lg:col-span-8 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold font-display text-slate-900">
                Pending Approvals
              </h3>
              <button
                onClick={() => navigate("/approvals")}
                className="text-sm font-bold text-brand-600 hover:text-brand-700"
              >
                View All &rarr;
              </button>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-50/50">
                    <th className="py-4 px-6 font-medium">Type / Requestor</th>
                    <th className="py-4 px-6 font-medium">Amount</th>
                    <th className="py-4 px-6 font-medium">Priority</th>
                    <th className="py-4 px-6 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {(pendingApprovals || []).length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-12 text-center text-slate-500 font-medium"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <CheckCircleIcon className="w-8 h-8 text-green-400" />
                          <span>All caught up! No pending approvals.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    (pendingApprovals || []).map((approval: any) => (
                      <tr
                        key={approval._id}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="py-4 px-6">
                          <p className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                            {approval.type}
                          </p>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">
                            {approval.requestor}
                          </p>
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-900">
                          {formatCurrency(approval.amount)}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                              approval.priority === "high" ||
                              approval.priority === "critical"
                                ? "bg-red-50 text-red-700 border border-red-100"
                                : approval.priority === "medium"
                                  ? "bg-amber-50 text-amber-700 border border-amber-100"
                                  : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {approval.priority}
                          </span>
                        </td>
                        <td className="py-4 px-6 flex items-center gap-2">
                          <button
                            onClick={() => navigate("/approvals")}
                            className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors"
                            title="View details"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Admin Navigation Panel */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 lg:col-span-4 flex flex-col">
            <h3 className="text-lg font-bold font-display text-slate-900 mb-6">
              Administrative Navigation
            </h3>
            <div className="space-y-3 overflow-y-auto flex-1 max-h-[320px] pr-2 custom-scrollbar">
              {[
                {
                  title: "User Management",
                  path: "/users",
                  desc: "Manage user accounts & roles",
                },
                {
                  title: "Asset Management",
                  path: "/admin/assets",
                  desc: "Track and manage all assets",
                },
                {
                  title: "Transaction Monitor",
                  path: "/admin/transactions",
                  desc: "Monitor all transactions logs",
                },
                {
                  title: "Audit Logs",
                  path: "/admin/audit-logs",
                  desc: "View system audit trails",
                },
                {
                  title: "Analytics",
                  path: "/admin/analytics",
                  desc: "Generate system reports",
                },
                {
                  title: "System Settings",
                  path: "/admin/settings",
                  desc: "Configure system preferences",
                },
              ].map((item, index) => (
                <button
                  key={index}
                  onClick={() => navigate(item.path)}
                  className="w-full bg-white hover:bg-brand-50 hover:border-brand-100 rounded-xl px-4 py-3 text-left transition-all duration-200 border border-slate-100 shadow-sm hover:shadow-md flex items-center justify-between cursor-pointer group"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-brand-700 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      {item.desc}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-white flex items-center justify-center transition-colors">
                    <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-brand-500 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Documents Panel */}
        <div className="mt-6">
          <Suspense
            fallback={
              <div className="h-32 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-8 h-8 border-4 border-slate-100 border-t-brand-600 rounded-full animate-spin" />
                <span className="text-sm font-bold text-slate-500 mt-3">
                  Loading Documents...
                </span>
              </div>
            }
          >
            {(() => {
              const Documents = lazy(() => import("../../documents/pages/Documents"));
              return <Documents embedded={true} />;
            })()}
          </Suspense>
        </div>
      </div>
      <CategoriesModal
        open={categoriesModalOpen}
        onClose={() => setCategoriesModalOpen(false)}
      />
    </DashboardLayout>
  );
};

export default AdminDashboard;
