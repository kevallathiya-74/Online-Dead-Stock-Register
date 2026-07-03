const getSupabase = require("../config/db");
const logger = require("../utils/logger");

exports.getTransactions = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data: txns, error } = await supabase
      .from("transactions")
      .select(
        `
        *,
        asset:asset_id(id, name, unique_asset_id),
        from_user_info:from_user(id, name, email),
        to_user_info:to_user(id, name, email),
        approver:approved_by(id, name, email)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return res.json({ success: true, data: txns });
  } catch (err) {
    logger.error("Error fetching transactions:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch transactions" });
  }
};

exports.getTransactionById = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data: txn, error } = await supabase
      .from("transactions")
      .select(
        `
        *,
        asset:asset_id(id, name, unique_asset_id),
        from_user_info:from_user(id, name, email),
        to_user_info:to_user(id, name, email),
        approver:approved_by(id, name, email)
      `,
      )
      .eq("id", req.params.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res
          .status(404)
          .json({ success: false, message: "Transaction not found" });
      }
      throw error;
    }
    return res.json({ success: true, data: txn });
  } catch (err) {
    logger.error("Error fetching transaction:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch transaction" });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const supabase = getSupabase();
    const {
      asset_id,
      transaction_type,
      from_user,
      to_user,
      from_location,
      to_location,
      quantity,
      notes,
      approved_by,
      status,
    } = req.body;

    const { data: txn, error } = await supabase
      .from("transactions")
      .insert({
        asset_id,
        transaction_type,
        from_user,
        to_user,
        from_location,
        to_location,
        quantity,
        notes,
        approved_by,
        status: status || "Pending",
        transaction_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Update asset status/location/assigned_user based on transaction_type
    if (
      transaction_type === "Asset Assignment" ||
      transaction_type === "Check-out"
    ) {
      const updateData = { status: "active" };
      if (to_user) updateData.assigned_user = to_user;
      if (to_location) updateData.location = to_location;

      await supabase.from("assets").update(updateData).eq("id", asset_id);
    }

    return res.status(201).json({
      success: true,
      data: txn,
      message: "Transaction created successfully",
    });
  } catch (err) {
    logger.error("Error creating transaction:", err);
    return res
      .status(400)
      .json({ success: false, message: "Failed to create transaction" });
  }
};
