const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const logger = require("../utils/logger");
const getSupabase = require("../config/db");

// Get file size helper
function getFileSizeInMB(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const fileSizeInBytes = stats.size;
    const fileSizeInMB = fileSizeInBytes / (1024 * 1024);

    if (fileSizeInMB > 1024) {
      return `${(fileSizeInMB / 1024).toFixed(2)} GB`;
    }
    return `${fileSizeInMB.toFixed(2)} MB`;
  } catch (error) {
    return "Unknown";
  }
}

// Get all backups
exports.getAllBackups = async (req, res) => {
  try {
    const supabase = getSupabase();

    const { data: backups, error } = await supabase
      .from("backups")
      .select(
        `
        id,
        name,
        type,
        size,
        created_at,
        completed_at,
        status,
        location,
        description,
        created_by:users(name, email)
      `,
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      logger.error("Error fetching backups:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch backups",
      });
    }

    res.json({
      success: true,
      data: backups.map((backup) => ({
        id: backup.id,
        name: backup.name,
        type: backup.type,
        size: backup.size,
        createdAt: backup.created_at,
        completedAt: backup.completed_at,
        status: backup.status,
        location: backup.location,
        description: backup.description,
        createdBy: backup.created_by,
      })),
    });
  } catch (error) {
    logger.error("Error fetching backups:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch backups",
    });
  }
};

// Get backup jobs
exports.getBackupJobs = async (req, res) => {
  try {
    const supabase = getSupabase();

    const { data: jobs, error } = await supabase
      .from("backup_jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching backup jobs:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch backup jobs",
      });
    }

    res.json({
      success: true,
      data: jobs.map((job) => ({
        id: job.id,
        name: job.name,
        type: job.type,
        schedule: job.schedule,
        enabled: job.enabled,
        lastRun: job.last_run,
        nextRun: job.next_run,
        status: job.status,
      })),
    });
  } catch (error) {
    logger.error("Error fetching backup jobs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch backup jobs",
    });
  }
};

// Create backup
exports.createBackup = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { name, type, location, description } = req.body;
    const userId = req.user.id;

    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, "..", "backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Create backup record
    const backupData = {
      name,
      type,
      location,
      description,
      created_by: userId,
      status: "in-progress",
      created_at: new Date().toISOString(),
    };

    const { data: backup, error } = await supabase
      .from("backups")
      .insert([backupData])
      .select()
      .single();

    if (error || !backup) {
      logger.error("Error creating backup record:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to create backup record",
      });
    }

    logger.info("Backup initiated", {
      backupId: backup.id,
      userId,
      type,
    });

    // Perform backup asynchronously
    performBackup(backup.id, type, backupDir);

    res.status(201).json({
      success: true,
      message: "Backup initiated successfully",
      data: {
        id: backup.id,
        name: backup.name,
        type: backup.type,
        status: backup.status,
        createdAt: backup.created_at,
      },
    });
  } catch (error) {
    logger.error("Error creating backup:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create backup",
    });
  }
};

// Perform actual backup
async function performBackup(backupId, type, backupDir) {
  try {
    const supabase = getSupabase();

    const { data: backup, error: fetchError } = await supabase
      .from("backups")
      .select("*")
      .eq("id", backupId)
      .single();

    if (fetchError || !backup) return;

    const timestamp = Date.now();
    const fileName = `backup-${type}-${timestamp}.json`;
    const filePath = path.join(backupDir, fileName);

    const TABLES_TO_BACKUP = [
      "users",
      "assets",
      "asset_categories",
      "asset_issues",
      "asset_requests",
      "asset_transfers",
      "audit_logs",
      "disposal_records",
      "documents",
      "generated_reports",
      "invoices",
      "maintenances",
      "notifications",
      "purchase_orders",
      "purchase_requests",
      "report_templates",
      "saved_filters",
      "scheduled_audits",
      "scheduled_audit_runs",
      "settings",
      "settings_histories",
      "transactions",
      "vendors",
      "approvals",
    ];

    const backupData = {
      metadata: {
        type,
        timestamp: new Date().toISOString(),
        database: "supabase-postgresql",
        tables: TABLES_TO_BACKUP,
      },
      data: {},
    };

    // Export each table
    for (const tableName of TABLES_TO_BACKUP) {
      const { data: rows, error: selectError } = await supabase
        .from(tableName)
        .select("*");

      if (selectError) {
        logger.warn(
          `Failed to export table ${tableName}: ${selectError.message}`,
        );
        backupData.data[tableName] = [];
      } else {
        backupData.data[tableName] = rows || [];
      }
    }

    // Write backup file
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

    // Update backup record
    const { error: updateError } = await supabase
      .from("backups")
      .update({
        status: "completed",
        file_path: filePath,
        size: getFileSizeInMB(filePath),
        completed_at: new Date().toISOString(),
      })
      .eq("id", backupId);

    if (updateError) {
      throw new Error(
        `Failed to update backup status to completed: ${updateError.message}`,
      );
    }

    logger.info("Backup completed successfully", {
      backupId,
      filePath,
      size: getFileSizeInMB(filePath),
    });
  } catch (error) {
    logger.error("Error performing backup:", error);

    // Update backup status to failed
    const supabase = getSupabase();
    await supabase
      .from("backups")
      .update({
        status: "failed",
        error: error.message,
        completed_at: new Date().toISOString(),
      })
      .eq("id", backupId);
  }
}

// Restore backup
exports.restoreBackup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const supabase = getSupabase();

    const { data: backup, error: fetchError } = await supabase
      .from("backups")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !backup) {
      return res.status(404).json({
        success: false,
        error: "Backup not found",
      });
    }

    if (backup.status !== "completed") {
      return res.status(400).json({
        success: false,
        error: "Cannot restore from incomplete backup",
      });
    }

    if (!backup.file_path || !fs.existsSync(backup.file_path)) {
      return res.status(404).json({
        success: false,
        error: "Backup file not found",
      });
    }

    logger.warn("Restore initiated - THIS WILL OVERWRITE ALL DATA", {
      backupId: id,
      userId,
    });

    // Read backup file
    const backupData = JSON.parse(fs.readFileSync(backup.file_path, "utf8"));

    // WARNING: This will delete all existing data
    // In production, you'd want additional confirmation and safety checks

    // Order of restoring tables to respect foreign keys
    const RESTORE_ORDER = [
      "users",
      "vendors",
      "asset_categories",
      "report_templates",
      "saved_filters",
      "settings",
      "settings_histories",
      "assets",
      "purchase_orders",
      "purchase_requests",
      "invoices",
      "approvals",
      "maintenances",
      "notifications",
      "disposal_records",
      "documents",
      "generated_reports",
      "scheduled_audits",
      "transactions",
      "asset_issues",
      "asset_transfers",
      "scheduled_audit_runs",
    ];

    // 1. Delete existing data in reverse dependency order
    for (const tableName of [...RESTORE_ORDER].reverse()) {
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (deleteError) {
        logger.warn(
          `Failed to delete data from ${tableName} during restore: ${deleteError.message}`,
        );
      }
    }

    let restoredCount = 0;

    // 2. Insert backup data in forward dependency order
    for (const tableName of RESTORE_ORDER) {
      const rows =
        backupData.data[tableName] || backupData.data[tableName.toLowerCase()];
      if (rows && rows.length > 0) {
        const cleanedRows = rows.map((row) => {
          const newRow = { ...row };
          if (newRow._id && !newRow.id) {
            newRow.id = newRow._id;
          }
          delete newRow._id;
          delete newRow.__v;
          return newRow;
        });

        const { error: insertError } = await supabase
          .from(tableName)
          .insert(cleanedRows);

        if (insertError) {
          logger.error(`Error restoring table ${tableName}:`, insertError);
          throw new Error(
            `Failed to restore table ${tableName}: ${insertError.message}`,
          );
        }

        logger.info(`Restored table: ${tableName}`, {
          documentCount: cleanedRows.length,
        });
        restoredCount++;
      }
    }

    logger.info("Restore completed successfully", { backupId: id });

    res.json({
      success: true,
      message: "System restored successfully",
      data: {
        backupId: id,
        restoredCollections: restoredCount,
      },
    });
  } catch (error) {
    logger.error("Error restoring backup:", error);
    res.status(500).json({
      success: false,
      error: "Failed to restore backup: " + error.message,
    });
  }
};

// Download backup
exports.downloadBackup = async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getSupabase();

    const { data: backup, error: fetchError } = await supabase
      .from("backups")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !backup) {
      return res.status(404).json({
        success: false,
        error: "Backup not found",
      });
    }

    if (backup.status !== "completed") {
      return res.status(400).json({
        success: false,
        error: "Backup is not ready for download",
      });
    }

    if (!backup.file_path || !fs.existsSync(backup.file_path)) {
      return res.status(404).json({
        success: false,
        error: "Backup file not found",
      });
    }

    logger.info("Backup download initiated", {
      backupId: id,
      userId: req.user.id,
    });

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${backup.name}.json`,
    );

    const fileStream = fs.createReadStream(backup.file_path);
    fileStream.pipe(res);
  } catch (error) {
    logger.error("Error downloading backup:", error);
    res.status(500).json({
      success: false,
      error: "Failed to download backup",
    });
  }
};

// Delete backup
exports.deleteBackup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const supabase = getSupabase();

    const { data: backup, error: fetchError } = await supabase
      .from("backups")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !backup) {
      return res.status(404).json({
        success: false,
        error: "Backup not found",
      });
    }

    // Delete backup file if it exists
    if (backup.file_path && fs.existsSync(backup.file_path)) {
      fs.unlinkSync(backup.file_path);
    }

    // Delete backup record
    const { error: deleteError } = await supabase
      .from("backups")
      .delete()
      .eq("id", id);

    if (deleteError) {
      logger.error("Error deleting backup record:", deleteError);
      return res.status(500).json({
        success: false,
        error: "Failed to delete backup record",
      });
    }

    logger.info("Backup deleted", { backupId: id, userId });

    res.json({
      success: true,
      message: "Backup deleted successfully",
      data: { backupId: id },
    });
  } catch (error) {
    logger.error("Error deleting backup:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete backup",
    });
  }
};
