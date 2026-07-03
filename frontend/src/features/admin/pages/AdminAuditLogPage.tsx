import {
    ArrowDownTrayIcon,
    ArrowPathIcon,
    ArrowPathRoundedSquareIcon,
    CheckCircleIcon,
    Cog6ToothIcon,
    ComputerDesktopIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    MagnifyingGlassIcon,
    ShieldCheckIcon,
    UserIcon,
} from "@heroicons/react/24/outline";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import api from "../../../services/api";

interface AdminAuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  user?: { id: string; name: string; email: string };
  action: string;
  entity_type: string;
  entity_id?: string;
  description: string;
  timestamp: string;
  severity: "info" | "warning" | "error" | "critical";
  ip_address?: string;
  changes?: any;
  user_agent?: string;
  old_values?: any;
  new_values?: any;
}

const AdminAuditLogPage: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedEntityType, setSelectedEntityType] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get("/audit-logs");
      let logData: AdminAuditLog[] = [];
      if (response.data.data && Array.isArray(response.data.data)) {
        logData = response.data.data;
      } else if (Array.isArray(response.data)) {
        logData = response.data;
      }
      setAuditLogs(logData);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) { /* Error handled by API interceptor */ } finally {
      setLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter((log) => {
    const userName = log.user?.name || log.user_name || "";
    const matchesSearch =
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.ip_address && log.ip_address.includes(searchTerm)) ||
      false;

    const matchesSeverity =
      selectedSeverity === "all" || log.severity === selectedSeverity;
    const matchesEntityType =
      selectedEntityType === "all" || log.entity_type === selectedEntityType;
    const matchesAction =
      selectedAction === "all" || log.action.includes(selectedAction);

    return (
      matchesSearch && matchesSeverity && matchesEntityType && matchesAction
    );
  });

  const paginatedLogs = filteredLogs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getSeverityBadge = (severity: AdminAuditLog["severity"]) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800 border border-red-200";
      case "error":
        return "bg-red-50 text-red-700 border border-red-150";
      case "warning":
        return "bg-amber-50 text-amber-700 border border-amber-150";
      case "info":
        return "bg-sky-50 text-sky-700 border border-sky-150";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-150";
    }
  };

  const formatSeverity = (severity: string) => {
    return severity?.charAt(0).toUpperCase() + severity?.slice(1).toLowerCase() || "Info";
  };

  const getSeverityIcon = (severity: AdminAuditLog["severity"]) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return <ExclamationTriangleIcon className="w-3.5 h-3.5 text-red-700 mr-1 inline-block" />;
      case "error":
        return <ExclamationTriangleIcon className="w-3.5 h-3.5 text-red-650 mr-1 inline-block" />;
      case "warning":
        return <ExclamationTriangleIcon className="w-3.5 h-3.5 text-amber-600 mr-1 inline-block" />;
      case "info":
        return <InformationCircleIcon className="w-3.5 h-3.5 text-sky-600 mr-1 inline-block" />;
      default:
        return <CheckCircleIcon className="w-3.5 h-3.5 text-slate-500 mr-1 inline-block" />;
    }
  };

  const getEntityIcon = (entityType: string) => {
    const type = entityType?.toLowerCase() || '';
    switch (type) {
      case "user":
        return <UserIcon className="w-4 h-4" />;
      case "asset":
        return <ComputerDesktopIcon className="w-4 h-4" />;
      case "transaction":
        return <ArrowPathRoundedSquareIcon className="w-4 h-4" />;
      case "system":
        return <Cog6ToothIcon className="w-4 h-4" />;
      default:
        return <ShieldCheckIcon className="w-4 h-4" />;
    }
  };

  const handleExportLogs = () => {
    toast.info(`Exporting ${filteredLogs.length} audit logs`);
  };

  const severityStats = {
    critical: auditLogs.filter((l) => l.severity === "critical").length,
    error: auditLogs.filter((l) => l.severity === "error").length,
    warning: auditLogs.filter((l) => l.severity === "warning").length,
    info: auditLogs.filter((l) => l.severity === "info").length,
  };

  const entityTypes = Array.from(new Set(auditLogs.map((l) => l.entity_type)));
  const actions = Array.from(new Set(auditLogs.map((l) => l.action)));
  const severities = ["info", "warning", "error", "critical"];

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
              Audit Logs
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              System activity monitoring and security audit trail
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadAuditLogs}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleExportLogs}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-655 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-all shadow-brand cursor-pointer"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export Logs
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Logs</p>
              <h4 className="text-3xl font-bold font-display text-slate-900 mt-1">{auditLogs.length}</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">All activities</p>
            </div>
            <ShieldCheckIcon className="w-9 h-9 text-slate-405" />
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-red-500">Critical Issues</p>
              <h4 className="text-3xl font-bold font-display text-red-650 mt-1">{severityStats.critical}</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Require attention</p>
            </div>
            <ExclamationTriangleIcon className="w-9 h-9 text-red-405" />
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-500">Warnings</p>
              <h4 className="text-3xl font-bold font-display text-amber-600 mt-1">{severityStats.warning}</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Monitor closely</p>
            </div>
            <ExclamationTriangleIcon className="w-9 h-9 text-amber-400" />
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-505">Info Events</p>
              <h4 className="text-3xl font-bold font-display text-sky-600 mt-1">{severityStats.info}</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Normal activity</p>
            </div>
            <InformationCircleIcon className="w-9 h-9 text-sky-400" />
          </div>
        </div>

        {/* Filter Card */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
            <div className="relative lg:col-span-4 w-full">
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-405" />
            </div>

            <div className="lg:col-span-2 w-full">
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="all">All Severities</option>
                {severities.map((severity) => (
                  <option key={severity} value={severity}>
                    {formatSeverity(severity)}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2 w-full">
              <select
                value={selectedEntityType}
                onChange={(e) => setSelectedEntityType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white bg-no-repeat"
              >
                <option value="all">All Entities</option>
                {entityTypes.map((entity) => (
                  <option key={entity} value={entity}>
                    {entity.charAt(0).toUpperCase() + entity.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2 w-full">
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="all">All Actions</option>
                {actions.map((action) => (
                  <option key={action} value={action}>
                    {action.replace(/_/g, ' ').split(' ').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                    ).join(' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2 w-full text-right text-xs text-slate-500 font-semibold pr-2">
              {filteredLogs.length} of {auditLogs.length} logs
            </div>
          </div>
        </div>

        {severityStats.critical > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm">
              <span className="font-bold">Security Alert:</span> There are {severityStats.critical} critical security events that require immediate attention.
            </p>
          </div>
        )}

        {/* Audit Logs Table Card */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold font-display text-slate-900">System Audit Trail</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 border border-indigo-100 text-indigo-700">
              {filteredLogs.length} logs
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-500">
                  <th className="pb-3 font-medium">Timestamp</th>
                  <th className="pb-3 font-medium">User & Action</th>
                  <th className="pb-3 font-medium">Entity & Details</th>
                  <th className="pb-3 font-medium">Severity</th>
                  <th className="pb-3 font-medium">Source Information</th>
                  <th className="pb-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5">
                        <p className="font-semibold text-slate-950">
                          {new Date(log.timestamp).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true
                          })}
                        </p>
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 font-semibold flex items-center justify-center flex-shrink-0 text-xs">
                            {(log.user?.name || log.user_name || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {log.user?.name || log.user_name || "Unknown User"}
                            </p>
                            <p className="text-[10px] text-slate-400">{log.action || 'No action'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 flex-shrink-0">
                            {getEntityIcon(log.entity_type)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 capitalize text-xs">
                              {log.entity_type || 'Unknown'}
                            </p>
                            {log.entity_id && (
                              <p className="text-[9px] text-slate-400 font-mono">
                                {log.entity_id.length > 12 
                                  ? `${log.entity_id.substring(0, 12)}...` 
                                  : log.entity_id}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold capitalize ${getSeverityBadge(log.severity)}`}>
                          {getSeverityIcon(log.severity)}
                          {formatSeverity(log.severity)}
                        </span>
                      </td>
                      <td className="py-3.5">
                        {log.ip_address && log.ip_address !== 'Unknown' && log.ip_address !== 'System' ? (
                          <div>
                            <p className="font-semibold text-slate-900 font-mono text-xs">{log.ip_address}</p>
                            {log.user_agent && log.user_agent !== 'Unknown' && (
                              <p className="text-[10px] text-slate-400 truncate max-w-[140px]" title={log.user_agent}>
                                {log.user_agent.includes('Mozilla') 
                                  ? log.user_agent.match(/\(([^)]+)\)/)?.[1]?.split(';')[0] || log.user_agent.split(" ")[0]
                                  : log.user_agent.split(" ")[0]}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                              log.ip_address === 'System' ? 'bg-slate-50 text-slate-600 border-slate-205' : 'bg-amber-50 text-amber-700 border-amber-205'
                            }`}>
                              {log.ip_address === 'System' ? 'System' : 'Not Recorded'}
                            </span>
                            {log.user_agent && log.user_agent !== 'Unknown' && (
                              <p className="text-[10px] text-slate-400 mt-1">
                                {log.user_agent === 'Automated Process' ? 'Automated' : 'Manual Entry'}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 max-w-xs">
                        <p className="text-slate-700 leading-relaxed text-xs">
                          {log.description || log.action || 'No description available'}
                        </p>
                        {log.old_values && log.new_values && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold border border-indigo-150 text-indigo-700 bg-indigo-50/50">
                            Values changed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No audit logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                className="border border-slate-200 rounded p-1 bg-white"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <span>
                {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, filteredLogs.length)} of {filteredLogs.length}
              </span>
              <div className="flex gap-1">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  disabled={(page + 1) * rowsPerPage >= filteredLogs.length}
                  onClick={() => setPage(p => p + 1)}
                  className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminAuditLogPage;
