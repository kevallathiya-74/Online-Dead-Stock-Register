const getSupabase = require("../config/db");
const logger = require("../utils/logger");

// Get all documents with populated asset and user data
exports.getAllDocuments = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { page = 1, limit = 10, search = "", documentType = "" } = req.query;
    const from = (parseInt(page) - 1) * parseInt(limit);
    const to = from + parseInt(limit) - 1;

    let query = supabase
      .from("documents")
      .select(
        `
        *,
        asset:asset_id(id, name, unique_asset_id),
        uploader:uploaded_by(id, name, email)
      `,
        { count: "exact" },
      )
      .order("uploaded_at", { ascending: false })
      .range(from, to);

    if (documentType && documentType !== "all") {
      query = query.eq("document_type", documentType);
    }
    if (search) {
      query = query.ilike("file_name", `%${search}%`);
    }

    const { data: documents, count, error } = await query;
    if (error) throw error;

    return res.json({
      success: true,
      data: documents,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (err) {
    logger.error("Error fetching documents:", err);
    return res
      .status(500)
      .json({ success: false, message: "An internal server error occurred" });
  }
};

exports.getDocumentsByAsset = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data: docs, error } = await supabase
      .from("documents")
      .select(
        `
        *,
        uploader:uploaded_by(id, name, email)
      `,
      )
      .eq("asset_id", req.params.assetId)
      .order("uploaded_at", { ascending: false });

    if (error) throw error;
    return res.json({ success: true, data: docs });
  } catch (err) {
    logger.error("Error fetching documents by asset:", err);
    return res
      .status(500)
      .json({ success: false, message: "An internal server error occurred" });
  }
};

// Delete a document by id
exports.deleteDocument = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

    const { data: existing, error: findError } = await supabase
      .from("documents")
      .select("id")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }

    const { error } = await supabase.from("documents").delete().eq("id", id);

    if (error) throw error;
    return res.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (err) {
    logger.error("Error deleting document:", err);
    return res
      .status(500)
      .json({ success: false, message: "An internal server error occurred" });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!req.file)
      return res.status(400).json({ success: false, message: "File missing" });

    const { data: doc, error } = await supabase
      .from("documents")
      .insert({
        asset_id: req.params.assetId || null,
        document_type: req.body.document_type || "Other",
        file_name: req.file.originalname,
        file_path: req.file.path,
        file_size: req.file.size,
        uploaded_by: req.body.uploaded_by || (req.user && req.user.id) || null,
        uploaded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json({
      success: true,
      data: doc,
      message: "Document uploaded successfully",
    });
  } catch (err) {
    logger.error("Error uploading document:", err);
    return res
      .status(500)
      .json({ message: "An internal server error occurred" });
  }
};
