const getSupabase = require("../config/db");
const logger = require("../utils/logger");

/**
 * Get audit logs with filtering, pagination, and search
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const supabase = getSupabase();
    const {
      page,
      limit,
      severity,
      entityType,
      action,
      userId,
      search,
      startDate,
      endDate,
      filter,
    } = req.query;

    const usePagination = page || limit;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 200;
    const from = usePagination ? (pageNum - 1) * limitNum : 0;
    const to = from + limitNum - 1;

    let query = supabase
      .from("audit_logs")
      .select(
        `
        *,
        user:user_id(id, name, email, role)
      `,
        { count: "exact" },
      )
      .order("timestamp", { ascending: false });

    // Filters
    if (severity && severity !== "all") query = query.eq("severity", severity);
    if (entityType && entityType !== "all")
      query = query.eq("entity_type", entityType);
    if (action && action !== "all") query = query.eq("action", action);
    if (userId) query = query.eq("user_id", userId);
    if (startDate)
      query = query.gte("timestamp", new Date(startDate).toISOString());
    if (endDate)
      query = query.lte("timestamp", new Date(endDate).toISOString());

    if (filter === "security") {
      query = query.or(
        "severity.in.(warning,error,critical),action.in.(login,logout,failed_login,password_change,permission_change,role_change),entity_type.eq.User",
      );
    }
    if (search) {
      query = query.or(
        `action.ilike.%${search}%,description.ilike.%${search}%,entity_type.ilike.%${search}%`,
      );
    }

    if (usePagination) {
      query = query.range(from, to);
    } else {
      query = query.limit(200);
    }

    const { data: logs, count, error } = await query;
    if (error) throw error;

    const formattedLogs = (logs || []).map((log) => ({
      id: log.id,
      user_id: log.user?.id || log.user_id,
      user_name: log.user?.name || "System",
      user_email: log.user?.email,
      user: log.user
        ? {
            id: log.user.id,
            name: log.user.name,
            email: log.user.email,
            role: log.user.role,
          }
        : null,
      action: log.action || "Unknown",
      entity_type: log.entity_type || "Unknown",
      entity_id: log.entity_id,
      description: log.description || log.action || "No description",
      timestamp: log.timestamp || new Date(),
      severity: log.severity || "info",
      ip_address: log.ip_address || "",
      user_agent: log.user_agent || "",
      old_values: log.old_values,
      new_values: log.new_values,
      changes: log.changes,
    }));

    if (usePagination) {
      res.json({
        success: true,
        data: formattedLogs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count,
          pages: Math.ceil(count / limitNum),
        },
      });
    } else {
      res.json({ success: true, data: formattedLogs });
    }
  } catch (err) {
    logger.error("Error fetching audit logs:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get audit log statistics
 */
exports.getAuditStats = async (req, res) => {
  try {
    const supabase = getSupabase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      { count: totalLogs },
      { count: todayLogs },
      { count: criticalEvents },
      { data: allLogs },
    ] = await Promise.all([
      supabase.from("audit_logs").select("id", { count: "exact", head: true }),
      supabase
        .from("audit_logs")
        .select("id", { count: "exact", head: true })
        .gte("timestamp", today.toISOString()),
      supabase
        .from("audit_logs")
        .select("id", { count: "exact", head: true })
        .eq("severity", "critical"),
      supabase.from("audit_logs").select("action,severity,entity_type"),
    ]);

    // Aggregate in-memory
    const actionMap = {};
    const severityMap = {};
    const entityTypeMap = {};
    let securityEvents = 0;
    const securityActions = ["login", "logout", "failed_login"];
    const securitySeverities = ["warning", "error", "critical"];

    (allLogs || []).forEach((log) => {
      if (log.action) actionMap[log.action] = (actionMap[log.action] || 0) + 1;
      if (log.severity)
        severityMap[log.severity] = (severityMap[log.severity] || 0) + 1;
      if (log.entity_type)
        entityTypeMap[log.entity_type] =
          (entityTypeMap[log.entity_type] || 0) + 1;
      if (
        securitySeverities.includes(log.severity) ||
        securityActions.includes(log.action)
      )
        securityEvents++;
    });

    const byAction = Object.entries(actionMap)
      .map(([_id, count]) => ({ _id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    const bySeverity = Object.entries(severityMap).map(([_id, count]) => ({
      _id,
      count,
    }));
    const byEntityType = Object.entries(entityTypeMap)
      .map(([_id, count]) => ({ _id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        totalLogs: totalLogs || 0,
        todayLogs: todayLogs || 0,
        criticalEvents: criticalEvents || 0,
        securityEvents,
        byAction,
        bySeverity,
        byEntityType,
      },
    });
  } catch (err) {
    logger.error("Error fetching audit stats:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Export audit logs
 */
exports.exportAuditLogs = async (req, res) => {
  try {
    const supabase = getSupabase();
    const {
      format = "json",
      severity,
      entityType,
      startDate,
      endDate,
    } = req.query;

    let query = supabase
      .from("audit_logs")
      .select(`*, user:user_id(id, name, email, role)`)
      .order("timestamp", { ascending: false })
      .limit(10000);

    if (severity && severity !== "all") query = query.eq("severity", severity);
    if (entityType && entityType !== "all")
      query = query.eq("entity_type", entityType);
    if (startDate)
      query = query.gte("timestamp", new Date(startDate).toISOString());
    if (endDate)
      query = query.lte("timestamp", new Date(endDate).toISOString());

    const { data: logs, error } = await query;
    if (error) throw error;

    if (format === "csv") {
      const escapeCsvValue = (value) => {
        if (value === null || value === undefined) return "";
        const stringValue = String(value);
        if (
          stringValue.includes('"') ||
          stringValue.includes(",") ||
          stringValue.includes("\n") ||
          stringValue.includes("\r")
        ) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return `"${stringValue}"`;
      };

      const csvHeaders = [
        "Timestamp",
        "User",
        "Action",
        "Entity Type",
        "Entity ID",
        "Description",
        "Severity",
        "IP Address",
      ];
      const csvRows = (logs || []).map((log) => [
        escapeCsvValue(
          log.timestamp ? new Date(log.timestamp).toISOString() : "",
        ),
        escapeCsvValue(log.user?.name || "System"),
        escapeCsvValue(log.action),
        escapeCsvValue(log.entity_type),
        escapeCsvValue(log.entity_id || ""),
        escapeCsvValue(log.description || ""),
        escapeCsvValue(log.severity || "info"),
        escapeCsvValue(log.ip_address || ""),
      ]);

      const BOM = "\uFEFF";
      const csv =
        BOM +
        [
          csvHeaders.map((h) => escapeCsvValue(h)).join(","),
          ...csvRows.map((row) => row.join(",")),
        ].join("\r\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=audit-logs-${Date.now()}.csv`,
      );
      res.send(csv);
    } else {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=audit-logs-${Date.now()}.json`,
      );
      res.json({
        exportDate: new Date().toISOString(),
        totalRecords: (logs || []).length,
        data: logs,
      });
    }

    logger.info("Audit logs exported", {
      userId: req.user?.id,
      format,
      count: (logs || []).length,
    });
  } catch (err) {
    logger.error("Error exporting audit logs:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get current user's activity history
 */
exports.getMyActivity = async (req, res) => {
  try {
    const supabase = getSupabase();
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;

    const { data: logs, error } = await supabase
      .from("audit_logs")
      .select(`*, user:user_id(id, name, email)`)
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (error) throw error;
    res.json({ success: true, data: logs, total: (logs || []).length });
  } catch (err) {
    logger.error("Error fetching user activity:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
