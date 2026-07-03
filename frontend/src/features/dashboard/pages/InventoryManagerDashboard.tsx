import {
    ArrowPathIcon,
    BuildingStorefrontIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    CubeIcon,
    ExclamationTriangleIcon,
    EyeIcon,
    MapPinIcon,
    PlusIcon,
    ShoppingCartIcon,
    WrenchScrewdriverIcon
} from "@heroicons/react/24/outline";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import { dashboardDataService } from "../../../services/dashboardData.service";
import { UserRole } from "../../../types";

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "info";
  onClick?: () => void;
  loading?: boolean;
}

const colorConfig: Record<string, { text: string; bg: string }> = {
  primary: { text: "text-brand-600", bg: "bg-brand-50" },
  secondary: { text: "text-slate-600", bg: "bg-slate-100" },
  success: { text: "text-green-600", bg: "bg-green-50" },
  warning: { text: "text-amber-600", bg: "bg-amber-50" },
  error: { text: "text-red-600", bg: "bg-red-50" },
  info: { text: "text-sky-600", bg: "bg-sky-50" },
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = "primary",
  onClick,
  loading = false,
}) => {
  const cfg = colorConfig[color] || colorConfig.primary;

  const content = (
    <div className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
            {title}
          </p>
          {loading ? (
            <div className="h-8 w-20 bg-slate-100 rounded animate-pulse my-1" />
          ) : (
            <h3 className="text-2xl font-bold font-display text-slate-900 truncate">
              {value}
            </h3>
          )}
        </div>
        <div className={`w-14 h-14 rounded-full ${cfg.bg} ${cfg.text} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const baseClasses = "bg-white rounded-xl border border-slate-100 shadow-card transition-all duration-300";

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} text-left w-full hover:shadow-card-lg hover:-translate-y-1 hover:border-brand-200 cursor-pointer`}
      >
        {content}
      </button>
    );
  }

  return <div className={baseClasses}>{content}</div>;
};

// Quick Action Card Component
interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "info";
}

const QuickActionCard: React.FC<QuickActionProps> = ({
  title,
  description,
  icon,
  onClick,
  color = "primary",
}) => {
  const cfg = colorConfig[color] || colorConfig.primary;

  return (
    <button
      onClick={onClick}
      className="bg-white text-left w-full rounded-xl border border-slate-100 shadow-card p-5 hover:shadow-card-lg hover:-translate-y-1 hover:border-brand-200 transition-all duration-300 cursor-pointer flex items-start gap-4"
    >
      <div className={`w-12 h-12 rounded-xl ${cfg.bg} ${cfg.text} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-slate-900 font-display text-sm mb-1">{title}</h4>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
    </button>
  );
};

const InventoryManagerDashboard: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [assetsByLocation, setAssetsByLocation] = useState<any[]>([]);
  const [warrantyExpiring, setWarrantyExpiring] = useState<any[]>([]);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState<any[]>([]);
  const [topVendors, setTopVendors] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);

  // Load dashboard data from API
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel from real API endpoints
      const [
        dashboardStats,
        locationData,
        warrantyData,
        maintenanceData,
        vendorData,
        approvalsData,
      ] = await Promise.all([
        dashboardDataService.getDashboardStats(UserRole.INVENTORY_MANAGER),
        dashboardDataService.getAssetsByLocation(),
        dashboardDataService.getWarrantyExpiringAssets(),
        dashboardDataService.getMaintenanceSchedule(),
        dashboardDataService.getVendorPerformance(),
        api.get('/dashboard/inventory-approvals').then((res: any) => res.data).catch(() => ({ data: [] })),
      ]);

      setStats(dashboardStats);
      setAssetsByLocation(locationData);
      setWarrantyExpiring(warrantyData);
      setMaintenanceSchedule(maintenanceData);
      setTopVendors(vendorData);
      setPendingApprovals(Array.isArray(approvalsData.data) ? approvalsData.data : []);
      
    } catch (error: any) {
      setError(error.message || "Failed to load dashboard data");
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    dashboardDataService.refreshCache();
    loadDashboardData();
  };

  // Quick Actions
  const quickActions = [
    {
      title: "Scan QR Code",
      description: "Scan asset QR codes",
      icon: <CubeIcon className="w-6 h-6" />,
      onClick: () => navigate("/assets/scan-qr"),
      color: "primary" as const,
    },
    {
      title: "Add Asset",
      description: "Register new asset",
      icon: <PlusIcon className="w-6 h-6" />,
      onClick: () => navigate("/assets/add"),
      color: "success" as const,
    },
    {
      title: "Manage Maintenance",
      description: "Schedule maintenance",
      icon: <CalendarDaysIcon className="w-6 h-6" />,
      onClick: () => navigate("/maintenance"),
      color: "warning" as const,
    },
    {
      title: "Purchase Orders",
      description: "View purchase orders",
      icon: <ShoppingCartIcon className="w-6 h-6" />,
      onClick: () => navigate("/purchase-orders"),
      color: "secondary" as const,
    },
  ];

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-4 max-w-md w-full text-center">
            {error}
          </div>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors"
          >
            Retry
          </button>
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
              Inventory Manager Dashboard
            </h2>
            <p className="text-sm text-slate-500 mt-1">Real-time inventory and maintenance overview</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 disabled:opacity-60 transition-all cursor-pointer"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Assets"
            value={stats?.totalAssets || 0}
            icon={<CubeIcon className="w-7 h-7" />}
            trend={stats?.trends?.assets}
            color="primary"
            onClick={() => navigate("/assets")}
            loading={loading}
          />
          <StatCard
            title="Active Assets"
            value={stats?.activeAssets || 0}
            icon={<CheckCircleIcon className="w-7 h-7" />}
            trend={stats?.trends?.active}
            color="success"
            onClick={() => navigate("/assets?status=Active")}
            loading={loading}
          />
          <StatCard
            title="Warranty Expiring"
            value={stats?.warrantyExpiring || 0}
            icon={<WrenchScrewdriverIcon className="w-7 h-7" />}
            color="warning"
            onClick={() => navigate("/assets?filter=warranty_expiring")}
            loading={loading}
          />
          <StatCard
            title="Total Value"
            value={`₹${Number(stats?.totalValue || 0).toLocaleString('en-IN')}`}
            icon={<CubeIcon className="w-7 h-7" />}
            color="info"
            loading={loading}
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold font-display text-slate-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <QuickActionCard key={index} {...action} />
            ))}
          </div>
        </div>

        {/* Data Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assets by Location */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold font-display text-slate-900 mb-4">
                Assets by Location
              </h3>
              {loading ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-2 border-slate-200 border-t-brand-600 rounded-full animate-spin" />
                </div>
              ) : assetsByLocation.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-sm text-center">
                  No location data available
                </div>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {assetsByLocation.map((location, index) => (
                    <li key={index} className="py-3 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                        <MapPinIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{location.location}</p>
                        <div className="mt-1">
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>{location.count} assets</span>
                            <span>{location.percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-brand-600 h-1.5 rounded-full" style={{ width: `${location.percentage}%` }} />
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              onClick={() => navigate("/locations")}
              className="w-full mt-4 py-2 bg-slate-50 text-slate-700 hover:bg-slate-100 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              View All Locations
            </button>
          </div>

          {/* Warranty Expiring */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
            <h3 className="text-lg font-bold font-display text-slate-900 mb-4">
              Warranty Expiring Soon
            </h3>
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-brand-600 rounded-full animate-spin" />
              </div>
            ) : warrantyExpiring.length === 0 ? (
              <div className="p-4 rounded-xl bg-green-50 text-green-700 text-sm text-center">
                No warranties expiring soon
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-500">
                      <th className="pb-3 font-medium">Asset</th>
                      <th className="pb-3 font-medium">Days Left</th>
                      <th className="pb-3 font-medium">Priority</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {warrantyExpiring.slice(0, 5).map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3">
                          <p className="font-semibold text-slate-900">{item.asset}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{item.category}</p>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1.5">
                            {item.daysLeft <= 30 && (
                              <ExclamationTriangleIcon className="w-4 h-4 text-red-500 shrink-0" />
                            )}
                            <span className="font-medium text-slate-900">{item.daysLeft} days</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            item.priority === "high"
                              ? "bg-red-50 text-red-700"
                              : item.priority === "medium"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-50 text-slate-700"
                          }`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => navigate(`/assets?warranty=${item.asset}`)}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Maintenance & Vendors Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Maintenance Schedule */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 lg:col-span-7">
            <h3 className="text-lg font-bold font-display text-slate-900 mb-4">
              Upcoming Maintenance
            </h3>
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-brand-600 rounded-full animate-spin" />
              </div>
            ) : maintenanceSchedule.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-sm text-center">
                No maintenance scheduled
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-500">
                      <th className="pb-3 font-medium">Asset</th>
                      <th className="pb-3 font-medium">Type</th>
                      <th className="pb-3 font-medium">Scheduled</th>
                      <th className="pb-3 font-medium">Technician</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {maintenanceSchedule.slice(0, 5).map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 font-semibold text-slate-900">{item.asset}</td>
                        <td className="py-3 text-slate-600">{item.type}</td>
                        <td className="py-3 text-slate-500">{item.scheduledDate}</td>
                        <td className="py-3 text-slate-600">{item.technician}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            item.status === "scheduled" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button
              onClick={() => navigate("/maintenance")}
              className="w-full mt-4 py-2 bg-slate-50 text-slate-700 hover:bg-slate-100 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              View All Maintenance
            </button>
          </div>

          {/* Top Vendors */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 lg:col-span-5 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold font-display text-slate-900 mb-4">
                Top Vendors
              </h3>
              {loading ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-2 border-slate-200 border-t-brand-600 rounded-full animate-spin" />
                </div>
              ) : topVendors.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-sm text-center">
                  No vendor data available
                </div>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {topVendors.slice(0, 5).map((vendor, index) => (
                    <li key={index} className="py-3 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <BuildingStorefrontIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{vendor.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {vendor.orders || 0} orders • ₹{Number(vendor.value || 0).toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-brand-600 font-semibold mt-1">
                          Rating: ⭐ {vendor.rating || 0}/5
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              onClick={() => navigate("/vendors")}
              className="w-full mt-4 py-2 bg-slate-50 text-slate-700 hover:bg-slate-100 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              View All Vendors
            </button>
          </div>
        </div>

        {/* Pending Approvals */}
        {pendingApprovals.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
            <h3 className="text-lg font-bold font-display text-slate-900 mb-4">
              Pending Approvals ({pendingApprovals.length})
            </h3>
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-brand-600 rounded-full animate-spin" />
              </div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {pendingApprovals.slice(0, 5).map((approval, index) => (
                  <li key={index} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{approval.type} - {approval.id}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          approval.priority === "Critical"
                            ? "bg-red-50 text-red-700"
                            : approval.priority === "High"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-sky-50 text-sky-700"
                        }`}>
                          {approval.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Requested by {approval.requester} • {approval.daysAgo} day{approval.daysAgo !== 1 ? "s" : ""} ago
                      </p>
                    </div>
                    <button
                      onClick={() => navigate("/approvals")}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors shrink-0"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => navigate("/approvals")}
              className="w-full mt-4 py-2 bg-slate-50 text-slate-700 hover:bg-slate-100 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              View All Approvals
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InventoryManagerDashboard;
