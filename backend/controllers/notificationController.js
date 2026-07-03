const getSupabase = require("../config/db");
const logger = require("../utils/logger");

// Get user notifications with pagination
exports.getUserNotifications = async (req, res) => {
  try {
    const supabase = getSupabase();
    const userId = req.user.id;
    const { page = 1, limit = 20, is_read, type } = req.query;
    const from = (parseInt(page) - 1) * parseInt(limit);
    const to = from + parseInt(limit) - 1;

    let query = supabase
      .from("notifications")
      .select(
        `
        *,
        sender_info:sender(id, name, email)
      `,
        { count: "exact" },
      )
      .eq("recipient", userId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (is_read !== undefined) query = query.eq("is_read", is_read === "true");
    if (type) query = query.eq("type", type);

    const { data: notifications, count, error } = await query;
    if (error) throw error;

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient", userId)
      .eq("is_read", false);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / parseInt(limit)),
          total_notifications: count,
          unread_count: unreadCount || 0,
          has_next: parseInt(page) * parseInt(limit) < count,
          has_prev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching notifications:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch notifications" });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const supabase = getSupabase();
    const userId = req.user.id;
    const { count: unreadCount, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient", userId)
      .eq("is_read", false);

    if (error) throw error;
    res.json({ success: true, data: { unread_count: unreadCount || 0 } });
  } catch (error) {
    logger.error("Error fetching unread count:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch unread count" });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const userId = req.user.id;

    const { data: notification, error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("recipient", userId)
      .select()
      .single();

    if (error || !notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    res.json({
      success: true,
      data: notification,
      message: "Notification marked as read",
    });
  } catch (error) {
    logger.error("Error marking notification as read:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to mark notification as read" });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const supabase = getSupabase();
    const userId = req.user.id;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("recipient", userId)
      .eq("is_read", false);

    if (error) throw error;
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    logger.error("Error marking all notifications as read:", error);
    res
      .status(500)
      .json({ message: "Failed to mark all notifications as read" });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const userId = req.user.id;

    const { data: notification, error: findError } = await supabase
      .from("notifications")
      .select("id")
      .eq("id", id)
      .eq("recipient", userId)
      .single();

    if (findError || !notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("recipient", userId);

    if (error) throw error;
    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    logger.error("Error deleting notification:", error);
    res.status(500).json({ message: "Failed to delete notification" });
  }
};

// Delete all read notifications
exports.deleteAllRead = async (req, res) => {
  try {
    const supabase = getSupabase();
    const userId = req.user.id;

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("recipient", userId)
      .eq("is_read", true);

    if (error) throw error;
    res.json({ message: "All read notifications deleted successfully" });
  } catch (error) {
    logger.error("Error deleting read notifications:", error);
    res.status(500).json({ message: "Failed to delete read notifications" });
  }
};

// Create notification (for admin/system use)
exports.createNotification = async (req, res) => {
  try {
    const supabase = getSupabase();
    const {
      recipient_id,
      title,
      message,
      type = "info",
      priority = "medium",
      data = null,
      action_url = null,
      expires_at = null,
    } = req.body;

    // Verify recipient exists
    const { data: recipient, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", recipient_id)
      .single();

    if (userError || !recipient) {
      return res.status(404).json({ message: "Recipient user not found" });
    }

    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        recipient: recipient_id,
        sender: req.user.id,
        title,
        message,
        type,
        priority,
        data,
        action_url,
        expires_at,
      })
      .select(
        `
        *,
        sender_info:sender(id, name, email),
        recipient_info:recipient(id, name, email)
      `,
      )
      .single();

    if (error) throw error;
    res
      .status(201)
      .json({ message: "Notification created successfully", notification });
  } catch (error) {
    logger.error("Error creating notification:", error);
    res.status(500).json({ message: "Failed to create notification" });
  }
};

// Create system notification (no sender)
exports.createSystemNotification = async (req, res) => {
  try {
    const supabase = getSupabase();
    const {
      recipient_id,
      title,
      message,
      type = "system",
      priority = "medium",
      data = null,
      action_url = null,
      expires_at = null,
    } = req.body;

    let recipientIds = [];
    if (recipient_id === "all") {
      const { data: users } = await supabase
        .from("users")
        .select("id")
        .eq("status", "active");
      recipientIds = (users || []).map((u) => u.id);
    } else {
      const { data: recipient, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("id", recipient_id)
        .single();
      if (userError || !recipient) {
        return res.status(404).json({ message: "Recipient user not found" });
      }
      recipientIds = [recipient_id];
    }

    const notifications = recipientIds.map((recipientId) => ({
      recipient: recipientId,
      title,
      message,
      type,
      priority,
      data,
      action_url,
      expires_at,
    }));

    const { error } = await supabase
      .from("notifications")
      .insert(notifications);
    if (error) throw error;

    res.status(201).json({
      message: `System notification sent to ${recipientIds.length} user(s)`,
      count: recipientIds.length,
    });
  } catch (error) {
    logger.error("Error creating system notification:", error);
    res.status(500).json({ message: "Failed to create system notification" });
  }
};

// Get notification types for filtering
exports.getNotificationTypes = async (req, res) => {
  try {
    const types = [
      "info",
      "warning",
      "error",
      "success",
      "maintenance",
      "audit",
      "approval",
      "asset_assigned",
      "asset_returned",
      "warranty_expiring",
      "system",
    ];
    res.json({ types });
  } catch (error) {
    logger.error("Error fetching notification types:", error);
    res.status(500).json({ message: "Failed to fetch notification types" });
  }
};
