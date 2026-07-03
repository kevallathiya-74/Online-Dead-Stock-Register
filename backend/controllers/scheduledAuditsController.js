const getSupabase = require("../config/db");
const logger = require("../utils/logger");
const {
  sendAuditReminder,
  sendAuditCompletionNotification,
  sendAuditOverdueNotification,
} = require("../services/emailService");

/**
 * Scheduled Audits Controller
 * Handles creation, scheduling, and management of recurring audits
 */

// Helper: Calculate next run date based on recurrence
const calculateNextRunDate = (
  startDate,
  recurrenceType,
  lastRunDate = null,
) => {
  const baseDate = lastRunDate ? new Date(lastRunDate) : new Date(startDate);
  const nextDate = new Date(baseDate);

  switch (recurrenceType) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case "weekly":
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case "quarterly":
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case "yearly":
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    case "once":
      return null;
    default:
      return null;
  }

  return nextDate;
};

// Create scheduled audit
exports.createScheduledAudit = async (req, res) => {
  try {
    const supabase = getSupabase();
    const {
      name,
      description,
      recurrence_type,
      start_date,
      end_date,
      audit_type,
      scope_type,
      scope_config,
      assigned_auditors,
      auto_assign,
      reminder_settings,
      checklist_items,
      notification_recipients,
    } = req.body;

    if (!name || !recurrence_type || !start_date || !scope_type) {
      return res.status(400).json({
        success: false,
        message:
          "Name, recurrence type, start date, and scope type are required",
      });
    }

    const next_run_date = calculateNextRunDate(start_date, recurrence_type);

    const auditPayload = {
      name,
      description,
      recurrence_type,
      start_date: new Date(start_date).toISOString(),
      end_date: end_date ? new Date(end_date).toISOString() : null,
      next_run_date: next_run_date ? next_run_date.toISOString() : null,
      audit_type: audit_type || "full",
      scope_type,
      scope_config: scope_config || {},
      assigned_auditors: assigned_auditors || [],
      auto_assign: auto_assign || false,
      checklist_items: checklist_items || [],
      notification_recipients: notification_recipients || [],
      created_by: req.user.id,
      status: "active",
      total_runs: 0,
      completed_runs: 0,
      failed_runs: 0,
    };

    const { data: scheduledAudit, error } = await supabase
      .from("scheduled_audits")
      .insert(auditPayload)
      .select()
      .single();

    if (error) throw error;

    // Log creation
    await supabase.from("audit_logs").insert({
      action: "scheduled_audit_created",
      performed_by: req.user.id,
      details: {
        audit_id: scheduledAudit.id,
        audit_name: name,
        recurrence_type,
        next_run_date: next_run_date ? next_run_date.toISOString() : null,
      },
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message: "Scheduled audit created successfully",
      scheduled_audit: {
        id: scheduledAudit.id,
        name: scheduledAudit.name,
        recurrence_type: scheduledAudit.recurrence_type,
        next_run_date: scheduledAudit.next_run_date,
        status: scheduledAudit.status,
      },
    });
  } catch (error) {
    logger.error("Error creating scheduled audit:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create scheduled audit",
      error: error.message,
    });
  }
};

// Get all scheduled audits
exports.getScheduledAudits = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { status, recurrence_type, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let dataQuery = supabase
      .from("scheduled_audits")
      .select("*, creator:created_by(name, email)", { count: "exact" })
      .order("next_run_date", { ascending: true })
      .range(skip, skip + parseInt(limit) - 1);

    let countQuery = supabase
      .from("scheduled_audits")
      .select("id", { count: "exact", head: true });

    if (status) {
      dataQuery = dataQuery.eq("status", status);
      countQuery = countQuery.eq("status", status);
    }
    if (recurrence_type) {
      dataQuery = dataQuery.eq("recurrence_type", recurrence_type);
      countQuery = countQuery.eq("recurrence_type", recurrence_type);
    }

    // Non-admin users: filter by created_by only (assigned_auditors is a JSON array)
    if (req.user.role !== "ADMIN") {
      dataQuery = dataQuery.eq("created_by", req.user.id);
      countQuery = countQuery.eq("created_by", req.user.id);
    }

    const [
      { data: scheduledAudits, error: dataErr },
      { count: total, error: countErr },
    ] = await Promise.all([dataQuery, countQuery]);

    if (dataErr) throw dataErr;
    if (countErr) throw countErr;

    res.json({
      success: true,
      scheduled_audits: scheduledAudits || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total || 0,
        pages: Math.ceil((total || 0) / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error("Error fetching scheduled audits:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch scheduled audits",
      error: error.message,
    });
  }
};

// Get scheduled audit by ID
exports.getScheduledAuditById = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { audit_id } = req.params;

    const { data: scheduledAudit, error } = await supabase
      .from("scheduled_audits")
      .select("*, creator:created_by(name, email)")
      .eq("id", audit_id)
      .single();

    if (error || !scheduledAudit) {
      return res
        .status(404)
        .json({ success: false, message: "Scheduled audit not found" });
    }

    // Check access
    if (
      req.user.role !== "ADMIN" &&
      scheduledAudit.created_by !== req.user.id &&
      !(scheduledAudit.assigned_auditors || []).includes(req.user.id)
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Get run history
    const { data: runs, error: runErr } = await supabase
      .from("scheduled_audit_runs")
      .select("*")
      .eq("scheduled_audit_id", audit_id)
      .order("run_date", { ascending: false })
      .limit(10);

    if (runErr) throw runErr;

    res.json({
      success: true,
      scheduled_audit: scheduledAudit,
      recent_runs: runs || [],
    });
  } catch (error) {
    logger.error("Error fetching scheduled audit:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch scheduled audit",
      error: error.message,
    });
  }
};

// Update scheduled audit
exports.updateScheduledAudit = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { audit_id } = req.params;
    const updates = req.body;

    const { data: existing, error: fetchErr } = await supabase
      .from("scheduled_audits")
      .select("*")
      .eq("id", audit_id)
      .single();

    if (fetchErr || !existing) {
      return res
        .status(404)
        .json({ success: false, message: "Scheduled audit not found" });
    }

    // Check permission
    if (req.user.role !== "ADMIN" && existing.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the creator or admin can update this audit",
      });
    }

    const allowedUpdates = [
      "name",
      "description",
      "recurrence_type",
      "start_date",
      "end_date",
      "audit_type",
      "scope_type",
      "scope_config",
      "assigned_auditors",
      "checklist_items",
      "notification_recipients",
      "status",
    ];

    const patch = {};
    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) patch[field] = updates[field];
    });

    // Recalculate next run date if recurrence changed
    if (updates.recurrence_type || updates.start_date) {
      const nextRunDate = calculateNextRunDate(
        patch.start_date || existing.start_date,
        patch.recurrence_type || existing.recurrence_type,
        existing.last_run_date,
      );
      patch.next_run_date = nextRunDate ? nextRunDate.toISOString() : null;
    }

    const { data: scheduledAudit, error: updateErr } = await supabase
      .from("scheduled_audits")
      .update(patch)
      .eq("id", audit_id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Log update
    await supabase.from("audit_logs").insert({
      action: "scheduled_audit_updated",
      performed_by: req.user.id,
      details: {
        audit_id,
        audit_name: scheduledAudit.name,
        updates: Object.keys(updates),
      },
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Scheduled audit updated successfully",
      scheduled_audit: scheduledAudit,
    });
  } catch (error) {
    logger.error("Error updating scheduled audit:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update scheduled audit",
      error: error.message,
    });
  }
};

// Delete scheduled audit
exports.deleteScheduledAudit = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { audit_id } = req.params;

    const { data: existing, error: fetchErr } = await supabase
      .from("scheduled_audits")
      .select("id, name, created_by")
      .eq("id", audit_id)
      .single();

    if (fetchErr || !existing) {
      return res
        .status(404)
        .json({ success: false, message: "Scheduled audit not found" });
    }

    if (req.user.role !== "ADMIN" && existing.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the creator or admin can delete this audit",
      });
    }

    const { error: deleteErr } = await supabase
      .from("scheduled_audits")
      .delete()
      .eq("id", audit_id);

    if (deleteErr) throw deleteErr;

    // Log deletion
    await supabase.from("audit_logs").insert({
      action: "scheduled_audit_deleted",
      performed_by: req.user.id,
      details: { audit_id, audit_name: existing.name },
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Scheduled audit deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting scheduled audit:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete scheduled audit",
      error: error.message,
    });
  }
};

// Trigger audit run (manually or by cron job)
exports.triggerAuditRun = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { audit_id } = req.params;

    const { data: scheduledAudit, error: auditErr } = await supabase
      .from("scheduled_audits")
      .select("*")
      .eq("id", audit_id)
      .single();

    if (auditErr || !scheduledAudit) {
      return res
        .status(404)
        .json({ success: false, message: "Scheduled audit not found" });
    }

    if (scheduledAudit.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Cannot trigger audit - audit is not active",
      });
    }

    // Build asset query based on scope
    const scopeConfig = scheduledAudit.scope_config || {};
    let assetQuery = supabase
      .from("assets")
      .select("id")
      .neq("status", "Disposed");

    switch (scheduledAudit.scope_type) {
      case "department":
        assetQuery = assetQuery.eq("department", scopeConfig.department);
        break;
      case "location":
        assetQuery = assetQuery.eq("location", scopeConfig.location);
        break;
      case "category":
        assetQuery = assetQuery.eq("asset_type", scopeConfig.category);
        break;
      default:
        break;
    }

    const { data: assets, error: assetErr } = await assetQuery;
    if (assetErr) throw assetErr;

    const assetIds = (assets || []).map((a) => a.id);

    // Create audit run
    const { data: auditRun, error: runErr } = await supabase
      .from("scheduled_audit_runs")
      .insert({
        scheduled_audit_id: audit_id,
        run_date: new Date().toISOString(),
        status: "pending",
        assets_to_audit: assetIds,
        total_assets: assetIds.length,
        assigned_auditors: scheduledAudit.assigned_auditors || [],
      })
      .select()
      .single();

    if (runErr) throw runErr;

    // Update scheduled audit stats
    const lastRunDate = new Date().toISOString();
    const nextRunDate = calculateNextRunDate(
      scheduledAudit.start_date,
      scheduledAudit.recurrence_type,
      lastRunDate,
    );

    await supabase
      .from("scheduled_audits")
      .update({
        total_runs: (scheduledAudit.total_runs || 0) + 1,
        last_run_date: lastRunDate,
        next_run_date: nextRunDate ? nextRunDate.toISOString() : null,
      })
      .eq("id", audit_id);

    // Send notifications
    const notificationRecipients = [
      ...(scheduledAudit.assigned_auditors || []),
      ...(scheduledAudit.notification_recipients || []),
    ].filter(Boolean);

    if (notificationRecipients.length > 0) {
      const notifications = notificationRecipients.map((userId) => ({
        recipient: userId,
        type: "audit",
        title: `Audit Run Started: ${scheduledAudit.name}`,
        message: `A new audit run has been triggered with ${assetIds.length} assets to audit.`,
        priority: "high",
        is_read: false,
        data: { related_entity: "audit_run", related_id: auditRun.id },
      }));
      await supabase.from("notifications").insert(notifications);
    }

    // Log trigger
    await supabase.from("audit_logs").insert({
      action: "audit_run_triggered",
      performed_by: req.user?.id || null,
      details: {
        audit_id,
        audit_run_id: auditRun.id,
        audit_name: scheduledAudit.name,
        assets_count: assetIds.length,
      },
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message: "Audit run triggered successfully",
      audit_run: {
        id: auditRun.id,
        status: auditRun.status,
        total_assets: auditRun.total_assets,
        run_date: auditRun.run_date,
      },
    });
  } catch (error) {
    logger.error("Error triggering audit run:", error);
    res.status(500).json({
      success: false,
      message: "Failed to trigger audit run",
      error: error.message,
    });
  }
};

// Get audit runs
exports.getAuditRuns = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { audit_id } = req.params;
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let dataQuery = supabase
      .from("scheduled_audit_runs")
      .select("*", { count: "exact" })
      .eq("scheduled_audit_id", audit_id)
      .order("run_date", { ascending: false })
      .range(skip, skip + parseInt(limit) - 1);

    let countQuery = supabase
      .from("scheduled_audit_runs")
      .select("id", { count: "exact", head: true })
      .eq("scheduled_audit_id", audit_id);

    if (status) {
      dataQuery = dataQuery.eq("status", status);
      countQuery = countQuery.eq("status", status);
    }

    const [{ data: runs, error: dataErr }, { count: total, error: countErr }] =
      await Promise.all([dataQuery, countQuery]);

    if (dataErr) throw dataErr;
    if (countErr) throw countErr;

    res.json({
      success: true,
      audit_runs: runs || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total || 0,
        pages: Math.ceil((total || 0) / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error("Error fetching audit runs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch audit runs",
      error: error.message,
    });
  }
};

// Update audit run progress
exports.updateAuditRunProgress = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { run_id } = req.params;
    const {
      asset_id,
      status,
      condition,
      location,
      notes,
      checklist_responses,
    } = req.body;

    const { data: auditRun, error: fetchErr } = await supabase
      .from("scheduled_audit_runs")
      .select("*")
      .eq("id", run_id)
      .single();

    if (fetchErr || !auditRun) {
      return res
        .status(404)
        .json({ success: false, message: "Audit run not found" });
    }

    // Check if auditor is assigned
    const assignedAuditors = auditRun.assigned_auditors || [];
    if (!assignedAuditors.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this audit run",
      });
    }

    // Append audited asset entry
    const auditedAssets = auditRun.audited_assets || [];
    auditedAssets.push({
      asset_id,
      audited_at: new Date().toISOString(),
      audited_by: req.user.id,
      status,
      condition,
      location,
      notes,
      checklist_responses,
    });

    // Update statistics
    let assets_found = auditRun.assets_found || 0;
    let assets_not_found = auditRun.assets_not_found || 0;
    let assets_damaged = auditRun.assets_damaged || 0;
    let assets_missing = auditRun.assets_missing || 0;

    if (status === "found") assets_found += 1;
    if (status === "not_found") assets_not_found += 1;
    if (status === "damaged") assets_damaged += 1;
    if (status === "missing") assets_missing += 1;

    const totalAssets = auditRun.total_assets || 1;
    const completion_percentage = Math.round(
      (auditedAssets.length / totalAssets) * 100,
    );

    let newStatus = auditRun.status;
    let completed_at = auditRun.completed_at;
    let started_at = auditRun.started_at;

    if (auditedAssets.length >= totalAssets) {
      newStatus = "completed";
      completed_at = new Date().toISOString();
    } else if (auditRun.status === "pending") {
      newStatus = "in_progress";
      started_at = new Date().toISOString();
    }

    const { error: updateErr } = await supabase
      .from("scheduled_audit_runs")
      .update({
        audited_assets: auditedAssets,
        assets_found,
        assets_not_found,
        assets_damaged,
        assets_missing,
        completion_percentage,
        status: newStatus,
        completed_at,
        started_at,
      })
      .eq("id", run_id);

    if (updateErr) throw updateErr;

    // Update asset record
    const assetPatch = {
      last_audit_date: new Date().toISOString(),
      last_audited_by: req.user.id,
    };
    if (condition) assetPatch.condition = condition;
    await supabase.from("assets").update(assetPatch).eq("id", asset_id);

    // Log audit
    await supabase.from("audit_logs").insert({
      action: "asset_audited",
      asset_id,
      performed_by: req.user.id,
      details: { audit_run_id: run_id, status, condition, location },
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Audit progress updated",
      completion_percentage,
      is_complete: newStatus === "completed",
    });
  } catch (error) {
    logger.error("Error updating audit progress:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update audit progress",
      error: error.message,
    });
  }
};

// Send reminders for upcoming audits
exports.sendAuditReminders = async (req, res) => {
  try {
    const supabase = getSupabase();
    const reminderDate = new Date();
    reminderDate.setHours(0, 0, 0, 0);

    const { data: scheduledAudits, error } = await supabase
      .from("scheduled_audits")
      .select("*")
      .eq("status", "active")
      .not("next_run_date", "is", null);

    if (error) throw error;

    let remindersSent = 0;

    for (const audit of scheduledAudits || []) {
      try {
        const reminderSettings = audit.reminder_settings || {};
        if (!reminderSettings.enabled) continue;

        const daysUntilAudit = Math.ceil(
          (new Date(audit.next_run_date) - reminderDate) /
            (1000 * 60 * 60 * 24),
        );

        if (daysUntilAudit !== (reminderSettings.days_before || 1)) continue;

        // Get auditor and recipient user emails if we need them
        const assignedAuditorIds = audit.assigned_auditors || [];
        const notificationRecipientIds = audit.notification_recipients || [];

        if (assignedAuditorIds.length > 0 && reminderSettings.send_email) {
          const { data: users } = await supabase
            .from("users")
            .select("id, email")
            .in("id", [...assignedAuditorIds, ...notificationRecipientIds]);

          const recipients = (users || []).map((u) => u.email).filter(Boolean);

          if (recipients.length > 0) {
            try {
              await sendAuditReminder({
                recipients,
                auditName: audit.name,
                auditDate: audit.next_run_date,
                auditType: audit.audit_type,
                assetsCount: "TBD",
              });
              remindersSent++;
            } catch (emailErr) {
              logger.error(
                `Failed to send reminder for audit ${audit.id}:`,
                emailErr,
              );
            }
          }
        }

        // Send in-app notifications
        if (reminderSettings.send_notification) {
          const notificationUsers = [
            ...assignedAuditorIds,
            ...notificationRecipientIds,
          ].filter(Boolean);
          if (notificationUsers.length > 0) {
            await supabase.from("notifications").insert(
              notificationUsers.map((userId) => ({
                recipient: userId,
                type: "audit",
                title: `Upcoming Audit: ${audit.name}`,
                message: `Audit scheduled for ${new Date(audit.next_run_date).toLocaleDateString()}`,
                priority: "medium",
                is_read: false,
                data: {
                  related_entity: "scheduled_audit",
                  related_id: audit.id,
                },
              })),
            );
          }
        }
      } catch (auditErr) {
        logger.error(
          `Failed to process reminders for audit ${audit.id}:`,
          auditErr,
        );
      }
    }

    res.json({
      success: true,
      message: `Sent ${remindersSent} audit reminders`,
      reminders_sent: remindersSent,
    });
  } catch (error) {
    logger.error("Error sending audit reminders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send audit reminders",
      error: error.message,
    });
  }
};

module.exports = exports;
