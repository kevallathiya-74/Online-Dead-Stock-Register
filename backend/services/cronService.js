const cron = require("node-cron");
const getSupabase = require("../config/db");
const {
  sendAuditReminder,
  sendAuditOverdueNotification,
} = require("./emailService");

/**
 * Cron Job Service for Scheduled Audits
 * Automatically triggers audits and sends reminders
 */

// Helper: Calculate next run date
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

// Helper: Build asset query filter
const applyAssetQuery = (query, scopeType, scopeConfig) => {
  query = query.neq("status", "Disposed");

  switch (scopeType) {
    case "department":
      if (scopeConfig.department)
        query = query.eq("department", scopeConfig.department);
      break;
    case "location":
      if (scopeConfig.location)
        query = query.eq("location", scopeConfig.location);
      break;
    case "category":
      if (scopeConfig.category)
        query = query.eq("category", scopeConfig.category);
      break;
    case "custom_filter":
      if (scopeConfig) {
        for (const [key, value] of Object.entries(scopeConfig)) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      }
      break;
    case "all":
    default:
      // Just not disposed
      break;
  }

  return query;
};

// Check and trigger due audits
const checkAndTriggerAudits = async () => {
  try {
    const supabase = getSupabase();
    console.log("🔍 Checking for due scheduled audits...");

    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today

    // Find audits that are due
    const { data: dueAudits, error: fetchError } = await supabase
      .from("scheduled_audits")
      .select("*")
      .eq("status", "active")
      .lte("next_run_date", now.toISOString())
      .not("next_run_date", "is", null);

    if (fetchError) throw fetchError;

    console.log(`Found ${dueAudits?.length || 0} due audit(s)`);

    for (const audit of dueAudits || []) {
      try {
        // Build asset query
        let assetQuery = supabase.from("assets").select("id");
        assetQuery = applyAssetQuery(
          assetQuery,
          audit.scope_type,
          audit.scope_config || {},
        );

        const { data: assets } = await assetQuery;
        const assetIds = (assets || []).map((a) => a.id);

        // Fetch assigned auditors
        const { data: auditors } = await supabase
          .from("scheduled_audit_auditors")
          .select("user_id")
          .eq("audit_id", audit.id);

        const assignedAuditors = (auditors || []).map((a) => a.user_id);

        // Fetch notification recipients
        const { data: recipients } = await supabase
          .from("scheduled_audit_recipients")
          .select("user_id")
          .eq("audit_id", audit.id);

        const notificationRecipients = (recipients || []).map((r) => r.user_id);

        // Create audit run
        const { data: auditRun, error: runError } = await supabase
          .from("scheduled_audit_runs")
          .insert({
            scheduled_audit_id: audit.id,
            run_date: new Date().toISOString(),
            status: "pending",
            assets_to_audit: assetIds,
            total_assets: assetIds.length,
            assigned_auditors: assignedAuditors,
          })
          .select()
          .single();

        if (runError) throw runError;

        // Update scheduled audit
        const nextRunDate = calculateNextRunDate(
          audit.start_date,
          audit.recurrence_type,
          new Date().toISOString(),
        );

        let newStatus = audit.status;
        if (audit.end_date && new Date(audit.end_date) < new Date()) {
          newStatus = "completed";
        }

        await supabase
          .from("scheduled_audits")
          .update({
            total_runs: (audit.total_runs || 0) + 1,
            last_run_date: new Date().toISOString(),
            next_run_date: nextRunDate ? nextRunDate.toISOString() : null,
            status: newStatus,
          })
          .eq("id", audit.id);

        // Send notifications
        const allNotificationRecipients = [
          ...new Set([...assignedAuditors, ...notificationRecipients]),
        ];

        if (allNotificationRecipients.length > 0) {
          await supabase.from("notifications").insert(
            allNotificationRecipients.map((userId) => ({
              user_id: userId,
              type: "audit_scheduled",
              title: `Audit Due: ${audit.name}`,
              message: `Scheduled audit "${audit.name}" is now due with ${assetIds.length} assets to audit.`,
              related_entity: "audit_run",
              related_id: auditRun.id,
              priority: "high",
              is_read: false,
              created_at: new Date().toISOString(),
            })),
          );
        }

        // Log trigger
        await supabase.from("audit_logs").insert({
          action: "audit_run_triggered",
          performed_by: "system",
          details: {
            audit_id: audit.id,
            audit_run_id: auditRun.id,
            audit_name: audit.name,
            assets_count: assetIds.length,
            triggered_by: "cron",
          },
          timestamp: new Date().toISOString(),
        });

        console.log(
          `✅ Triggered audit: ${audit.name} (${assetIds.length} assets)`,
        );
      } catch (error) {
        console.error(`❌ Failed to trigger audit ${audit.id}:`, error.message);

        // Mark as failed
        await supabase
          .from("scheduled_audits")
          .update({ failed_runs: (audit.failed_runs || 0) + 1 })
          .eq("id", audit.id);
      }
    }

    console.log(
      `✅ Completed audit check - triggered ${dueAudits?.length || 0} audit(s)`,
    );
  } catch (error) {
    console.error("❌ Error in checkAndTriggerAudits:", error);
  }
};

// Send reminders for upcoming audits
const sendUpcomingAuditReminders = async () => {
  try {
    const supabase = getSupabase();
    console.log("📧 Checking for upcoming audit reminders...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find active audits with reminders enabled
    const { data: scheduledAudits, error: fetchError } = await supabase
      .from("scheduled_audits")
      .select("*")
      .eq("status", "active")
      .eq("reminder_settings->enabled", true) // In PostgreSQL jsonb: reminder_settings->>'enabled' = 'true'
      .not("next_run_date", "is", null);

    if (fetchError) throw fetchError;

    let remindersSent = 0;

    for (const audit of scheduledAudits || []) {
      try {
        const reminderSettings =
          typeof audit.reminder_settings === "string"
            ? JSON.parse(audit.reminder_settings)
            : audit.reminder_settings;
        if (!reminderSettings || !reminderSettings.enabled) continue;

        const nextRunDate = new Date(audit.next_run_date);
        nextRunDate.setHours(0, 0, 0, 0);

        const daysUntilAudit = Math.ceil(
          (nextRunDate - today) / (1000 * 60 * 60 * 24),
        );

        // Send reminder if it matches the configured days before
        if (daysUntilAudit === reminderSettings.days_before) {
          // Get asset count
          let assetQuery = supabase
            .from("assets")
            .select("id", { count: "exact", head: true });
          assetQuery = applyAssetQuery(
            assetQuery,
            audit.scope_type,
            audit.scope_config || {},
          );

          const { count: assetsCount } = await assetQuery;

          // Fetch users info
          const { data: auditors } = await supabase
            .from("scheduled_audit_auditors")
            .select("users(id, email)")
            .eq("audit_id", audit.id);

          const { data: recipients } = await supabase
            .from("scheduled_audit_recipients")
            .select("users(id, email)")
            .eq("audit_id", audit.id);

          const auditorUsers = (auditors || [])
            .map((a) => a.users)
            .filter(Boolean);
          const recipientUsers = (recipients || [])
            .map((r) => r.users)
            .filter(Boolean);

          const allUsers = [...auditorUsers, ...recipientUsers];

          // Send email reminders
          if (reminderSettings.send_email) {
            const emails = [
              ...new Set(allUsers.map((u) => u.email).filter(Boolean)),
            ];

            if (emails.length > 0) {
              await sendAuditReminder({
                recipients: emails,
                auditName: audit.name,
                auditDate: audit.next_run_date,
                auditType: audit.audit_type,
                assetsCount: assetsCount || 0,
              });
              remindersSent++;
            }
          }

          // Send in-app notifications
          if (reminderSettings.send_notification) {
            const userIds = [
              ...new Set(allUsers.map((u) => u.id).filter(Boolean)),
            ];

            if (userIds.length > 0) {
              await supabase.from("notifications").insert(
                userIds.map((userId) => ({
                  user_id: userId,
                  type: "audit_reminder",
                  title: `Upcoming Audit: ${audit.name}`,
                  message: `Audit scheduled for ${new Date(audit.next_run_date).toLocaleDateString()} - ${assetsCount || 0} assets to audit`,
                  related_entity: "scheduled_audit",
                  related_id: audit.id,
                  priority: "medium",
                  is_read: false,
                  created_at: new Date().toISOString(),
                })),
              );
            }
          }

          console.log(
            `✅ Sent reminder for: ${audit.name} (${daysUntilAudit} days until audit)`,
          );
        }
      } catch (error) {
        console.error(
          `❌ Failed to send reminder for audit ${audit.id}:`,
          error.message,
        );
      }
    }

    console.log(`✅ Sent ${remindersSent} audit reminder(s)`);
  } catch (error) {
    console.error("❌ Error in sendUpcomingAuditReminders:", error);
  }
};

// Check for overdue audits
const checkOverdueAudits = async () => {
  try {
    const supabase = getSupabase();
    console.log("⚠️  Checking for overdue audits...");

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Find audit runs that are overdue (pending/in_progress for > 7 days)
    const { data: overdueRuns, error: fetchError } = await supabase
      .from("scheduled_audit_runs")
      .select(
        `
        *,
        scheduled_audits(*)
      `,
      )
      .in("status", ["pending", "in_progress"])
      .lt("run_date", sevenDaysAgo.toISOString());

    if (fetchError) throw fetchError;

    for (const run of overdueRuns || []) {
      try {
        const audit = run.scheduled_audits;
        if (!audit) continue;

        // Fetch users
        const { data: auditors } = await supabase
          .from("scheduled_audit_auditors")
          .select("users(id, email)")
          .eq("audit_id", audit.id);

        const { data: recipients } = await supabase
          .from("scheduled_audit_recipients")
          .select("users(id, email)")
          .eq("audit_id", audit.id);

        const auditorUsers = (auditors || [])
          .map((a) => a.users)
          .filter(Boolean);
        const recipientUsers = (recipients || [])
          .map((r) => r.users)
          .filter(Boolean);

        const allUsers = [...auditorUsers, ...recipientUsers];

        // Send overdue notification email
        const emails = [
          ...new Set(allUsers.map((u) => u.email).filter(Boolean)),
        ];

        if (emails.length > 0) {
          await sendAuditOverdueNotification({
            recipients: emails,
            auditName: audit.name,
            dueDate: run.run_date,
          });
        }

        // Send in-app notifications
        const auditorIds = [
          ...new Set(auditorUsers.map((u) => u.id).filter(Boolean)),
        ];

        if (auditorIds.length > 0) {
          await supabase.from("notifications").insert(
            auditorIds.map((userId) => ({
              user_id: userId,
              type: "audit_overdue",
              title: `⚠️ Overdue Audit: ${audit.name}`,
              message: `Audit run from ${new Date(run.run_date).toLocaleDateString()} is overdue. Please complete as soon as possible.`,
              related_entity: "audit_run",
              related_id: run.id,
              priority: "urgent",
              is_read: false,
              created_at: new Date().toISOString(),
            })),
          );
        }

        console.log(`⚠️  Sent overdue notification for: ${audit.name}`);
      } catch (error) {
        console.error(
          `❌ Failed to send overdue notification for run ${run.id}:`,
          error.message,
        );
      }
    }

    console.log(`✅ Checked ${overdueRuns?.length || 0} overdue audit run(s)`);
  } catch (error) {
    console.error("❌ Error in checkOverdueAudits:", error);
  }
};

// Initialize cron jobs
const initializeCronJobs = () => {
  // Check and trigger due audits every day at 6:00 AM
  cron.schedule(
    "0 6 * * *",
    async () => {
      await checkAndTriggerAudits();
    },
    {
      timezone: process.env.TIMEZONE || "UTC",
    },
  );

  // Send reminders every day at 8:00 AM
  cron.schedule(
    "0 8 * * *",
    async () => {
      await sendUpcomingAuditReminders();
    },
    {
      timezone: process.env.TIMEZONE || "UTC",
    },
  );

  // Check for overdue audits every day at 10:00 AM
  cron.schedule(
    "0 10 * * *",
    async () => {
      await checkOverdueAudits();
    },
    {
      timezone: process.env.TIMEZONE || "UTC",
    },
  );

  console.log("✅ Cron jobs initialized (6 AM, 8 AM, 10 AM)");
};

module.exports = {
  initializeCronJobs,
  checkAndTriggerAudits,
  sendUpcomingAuditReminders,
  checkOverdueAudits,
};
