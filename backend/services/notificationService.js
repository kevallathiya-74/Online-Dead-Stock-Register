const getSupabase = require("../config/db");
const logger = require("../utils/logger");

/**
 * Send notification to user(s)
 */
exports.sendNotification = async (notificationData) => {
  try {
    // Support single user or multiple users
    const userIds = Array.isArray(notificationData.user_id)
      ? notificationData.user_id
      : [notificationData.user_id];

    // Create notifications for all users
    const notifications = userIds.map((userId) => ({
      recipient: userId,
      sender: notificationData.sender || null,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      priority: notificationData.priority || "medium",
      is_read: false,
      read_at: null,
      data: {
        related_entity_type: notificationData.related_entity_type,
        related_entity_id: notificationData.related_entity_id,
        ...(notificationData.data || {}),
      },
      action_url: notificationData.action_url || null,
      expires_at: notificationData.expires_at || null,
    }));

    const supabase = getSupabase();
    const { data: created, error } = await supabase
      .from("notifications")
      .insert(notifications)
      .select();

    if (error) {
      throw error;
    }

    logger.info("Notifications sent", {
      count: created.length,
      type: notificationData.type,
      userIds,
    });

    // Map recipient and id for compatibility
    return created.map((item) => ({
      ...item,
      user_id: item.recipient,
      _id: item.id,
    }));
  } catch (error) {
    logger.error("Error sending notification:", error);
    throw error;
  }
};

/**
 * Get notifications for a user
 */
exports.getUserNotifications = async (
  userId,
  filters = {},
  pagination = {},
) => {
  try {
    const { page = 1, limit = 20 } = pagination;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = getSupabase();
    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("recipient", userId);

    // Filter by read status
    if (filters.unreadOnly) {
      query = query.eq("is_read", false);
    }

    // Filter by type
    if (filters.type) {
      query = query.eq("type", filters.type);
    }

    // Filter by priority
    if (filters.priority) {
      query = query.eq("priority", filters.priority);
    }

    const {
      data: notifications,
      count: total,
      error,
    } = await query.order("created_at", { ascending: false }).range(from, to);

    if (error) {
      throw error;
    }

    // Get unread count
    const { count: unreadCount, error: unreadError } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient", userId)
      .eq("is_read", false);

    if (unreadError) {
      throw unreadError;
    }

    const mappedNotifications = (notifications || []).map((item) => ({
      ...item,
      user_id: item.recipient,
      _id: item.id,
    }));

    return {
      notifications: mappedNotifications,
      pagination: {
        total: total || 0,
        page,
        pages: Math.ceil((total || 0) / limit),
        limit,
      },
      unreadCount: unreadCount || 0,
    };
  } catch (error) {
    logger.error("Error fetching user notifications:", error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
exports.markAsRead = async (notificationId, userId) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("recipient", userId)
      .select()
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      ...data,
      user_id: data.recipient,
      _id: data.id,
    };
  } catch (error) {
    logger.error("Error marking notification as read:", error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 */
exports.markAllAsRead = async (userId) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("recipient", userId)
      .eq("is_read", false)
      .select();

    if (error) {
      throw error;
    }

    const modifiedCount = data ? data.length : 0;

    logger.info("All notifications marked as read", {
      userId,
      count: modifiedCount,
    });

    return modifiedCount;
  } catch (error) {
    logger.error("Error marking all notifications as read:", error);
    throw error;
  }
};

/**
 * Delete notification
 */
exports.deleteNotification = async (notificationId, userId) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("recipient", userId)
      .select()
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      ...data,
      user_id: data.recipient,
      _id: data.id,
    };
  } catch (error) {
    logger.error("Error deleting notification:", error);
    throw error;
  }
};

/**
 * Get unread count for a user
 */
exports.getUnreadCount = async (userId) => {
  try {
    const supabase = getSupabase();
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient", userId)
      .eq("is_read", false);

    if (error) {
      throw error;
    }

    return count || 0;
  } catch (error) {
    logger.error("Error getting unread count:", error);
    throw error;
  }
};

/**
 * Send notification to multiple users by role
 */
exports.sendNotificationByRole = async (role, notificationData) => {
  try {
    const supabase = getSupabase();
    const { data: users, error } = await supabase
      .from("users")
      .select("id")
      .eq("role", role)
      .eq("is_active", true);

    if (error) {
      throw error;
    }

    if (!users || users.length === 0) {
      logger.warn("No users found with role:", role);
      return [];
    }

    const userIds = users.map((u) => u.id);

    return await this.sendNotification({
      ...notificationData,
      user_id: userIds,
    });
  } catch (error) {
    logger.error("Error sending notification by role:", error);
    throw error;
  }
};

/**
 * Send notification to department
 */
exports.sendNotificationToDepartment = async (department, notificationData) => {
  try {
    const supabase = getSupabase();
    const { data: users, error } = await supabase
      .from("users")
      .select("id")
      .eq("department", department)
      .eq("is_active", true);

    if (error) {
      throw error;
    }

    if (!users || users.length === 0) {
      logger.warn("No users found in department:", department);
      return [];
    }

    const userIds = users.map((u) => u.id);

    return await this.sendNotification({
      ...notificationData,
      user_id: userIds,
    });
  } catch (error) {
    logger.error("Error sending notification to department:", error);
    throw error;
  }
};

/**
 * Clean up old read notifications (retention policy)
 */
exports.cleanupOldNotifications = async (daysToKeep = 90) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("notifications")
      .delete()
      .eq("is_read", true)
      .lt("read_at", cutoffDate.toISOString())
      .select();

    if (error) {
      throw error;
    }

    const deletedCount = data ? data.length : 0;

    logger.info("Old notifications cleaned up", {
      count: deletedCount,
      daysToKeep,
    });

    return deletedCount;
  } catch (error) {
    logger.error("Error cleaning up old notifications:", error);
    throw error;
  }
};

/**
 * Get notification statistics
 */
exports.getNotificationStats = async (userId) => {
  try {
    const supabase = getSupabase();
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("id, type, priority, is_read, title, created_at")
      .eq("recipient", userId);

    if (error) {
      throw error;
    }

    const byTypeMap = {};
    const byPriorityMap = {};
    const readStatsMap = {
      true: 0,
      false: 0,
    };

    (notifications || []).forEach((notif) => {
      const t = notif.type || "unknown";
      byTypeMap[t] = (byTypeMap[t] || 0) + 1;

      const p = notif.priority || "medium";
      byPriorityMap[p] = (byPriorityMap[p] || 0) + 1;

      const r = notif.is_read;
      readStatsMap[r] = (readStatsMap[r] || 0) + 1;
    });

    const byType = Object.keys(byTypeMap).map((key) => ({
      _id: key,
      count: byTypeMap[key],
    }));

    const byPriority = Object.keys(byPriorityMap).map((key) => ({
      _id: key,
      count: byPriorityMap[key],
    }));

    const readStats = Object.keys(readStatsMap).map((key) => ({
      _id: key === "true",
      count: readStatsMap[key],
    }));

    const recentNotifications = [...(notifications || [])]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map((notif) => ({
        _id: notif.id,
        id: notif.id,
        type: notif.type,
        title: notif.title,
        created_at: notif.created_at,
        is_read: notif.is_read,
      }));

    return {
      byType,
      byPriority,
      readStats,
      recentNotifications,
    };
  } catch (error) {
    logger.error("Error getting notification stats:", error);
    throw error;
  }
};

/**
 * Notification templates for common scenarios
 */
exports.templates = {
  assetAssigned: (assetName, assignedTo) => ({
    type: "asset_assigned",
    title: "Asset Assigned",
    message: `Asset "${assetName}" has been assigned to ${assignedTo}`,
    priority: "medium",
  }),

  assetTransferred: (assetName, fromUser, toUser) => ({
    type: "asset_transferred",
    title: "Asset Transferred",
    message: `Asset "${assetName}" transferred from ${fromUser} to ${toUser}`,
    priority: "medium",
  }),

  maintenanceDue: (assetName, dueDate) => ({
    type: "maintenance_due",
    title: "Maintenance Due",
    message: `Maintenance for "${assetName}" is due on ${dueDate}`,
    priority: "high",
  }),

  approvalRequired: (requestType, requester) => ({
    type: "approval_required",
    title: "Approval Required",
    message: `${requestType} request from ${requester} requires your approval`,
    priority: "high",
  }),

  approvalApproved: (requestType) => ({
    type: "approval_approved",
    title: "Request Approved",
    message: `Your ${requestType} request has been approved`,
    priority: "medium",
  }),

  approvalRejected: (requestType, reason) => ({
    type: "approval_rejected",
    title: "Request Rejected",
    message: `Your ${requestType} request has been rejected${reason ? `: ${reason}` : ""}`,
    priority: "high",
  }),

  warrantyExpiring: (assetName, daysLeft) => ({
    type: "warranty_expiring",
    title: "Warranty Expiring Soon",
    message: `Warranty for "${assetName}" expires in ${daysLeft} days`,
    priority: "medium",
  }),

  auditScheduled: (auditDate, assets) => ({
    type: "audit_scheduled",
    title: "Asset Audit Scheduled",
    message: `Asset audit scheduled for ${auditDate} covering ${assets} assets`,
    priority: "high",
  }),
};
