const fs = require("fs");
const logger = require("../utils/logger");
const path = require("path");
const getSupabase = require("../config/db");

// Upload documents
exports.uploadDocuments = async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const { asset_id, document_type, description } = req.body;
    const uploadedFiles = [];

    // We will do a batch insert if possible, but we need to generate entries
    const documentsToInsert = req.files.map((file) => ({
      name: file.originalname,
      file_path: file.path,
      file_size: file.size,
      mime_type: file.mimetype,
      document_type: document_type || "general",
      description: description || "",
      asset_id: asset_id || null,
      uploaded_by: req.user.id,
      upload_date: new Date().toISOString(),
    }));

    const { data: insertedDocs, error: insertError } = await supabase
      .from("documents")
      .insert(documentsToInsert)
      .select();

    if (insertError) {
      throw insertError;
    }

    insertedDocs.forEach((doc) => {
      uploadedFiles.push({
        id: doc.id,
        name: doc.name,
        file_size: doc.file_size,
        document_type: doc.document_type,
        upload_date: doc.upload_date,
      });
    });

    // Create audit log
    await supabase.from("audit_logs").insert({
      asset_id: asset_id || null,
      action: "documents_uploaded",
      performed_by: req.user.id,
      details: {
        file_count: req.files.length,
        document_type: document_type,
        file_names: req.files.map((file) => file.originalname),
      },
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      message: `${uploadedFiles.length} document(s) uploaded successfully`,
      documents: uploadedFiles,
    });
  } catch (error) {
    logger.error("Error uploading documents:", error);
    // Clean up uploaded files if database save fails
    if (req.files) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(500).json({ message: "Failed to upload documents" });
  }
};

// Upload asset images
exports.uploadAssetImages = async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    const { asset_id, description } = req.body;

    if (!asset_id) {
      // Clean up files if no asset_id provided
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res
        .status(400)
        .json({ message: "Asset ID is required for image upload" });
    }

    const uploadedImages = [];

    const documentsToInsert = req.files.map((file) => ({
      name: file.originalname,
      file_path: file.path,
      file_size: file.size,
      mime_type: file.mimetype,
      document_type: "image",
      description: description || "Asset image",
      asset_id: asset_id,
      uploaded_by: req.user.id,
      upload_date: new Date().toISOString(),
    }));

    const { data: insertedDocs, error: insertError } = await supabase
      .from("documents")
      .insert(documentsToInsert)
      .select();

    if (insertError) {
      throw insertError;
    }

    insertedDocs.forEach((doc, idx) => {
      uploadedImages.push({
        id: doc.id,
        name: doc.name,
        file_size: doc.file_size,
        file_path: `/uploads/asset-images/${path.basename(req.files[idx].path)}`,
        upload_date: doc.upload_date,
      });
    });

    // Create audit log
    await supabase.from("audit_logs").insert({
      asset_id: asset_id,
      action: "asset_images_uploaded",
      performed_by: req.user.id,
      details: {
        image_count: req.files.length,
        file_names: req.files.map((file) => file.originalname),
      },
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      message: `${uploadedImages.length} image(s) uploaded successfully`,
      images: uploadedImages,
    });
  } catch (error) {
    logger.error("Error uploading asset images:", error);
    // Clean up uploaded files if database save fails
    if (req.files) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(500).json({ message: "Failed to upload asset images" });
  }
};

// Download document
exports.downloadDocument = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

    const { data: document, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Check if file exists
    if (!fs.existsSync(document.file_path)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    // Set appropriate headers
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${document.name}"`,
    );
    res.setHeader("Content-Type", document.mime_type);

    // Stream the file
    const fileStream = fs.createReadStream(document.file_path);
    fileStream.pipe(res);

    // Log download activity
    await supabase.from("audit_logs").insert({
      asset_id: document.asset_id,
      action: "document_downloaded",
      performed_by: req.user.id,
      details: {
        document_id: id,
        document_name: document.name,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error downloading document:", error);
    res.status(500).json({ message: "Failed to download document" });
  }
};

// Delete document
exports.deleteDocument = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

    const { data: document, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Check permissions - only uploader, admin, or inventory manager can delete
    const canDelete =
      document.uploaded_by === req.user.id ||
      ["ADMIN", "INVENTORY_MANAGER"].includes(req.user.role);

    if (!canDelete) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Delete file from filesystem
    if (fs.existsSync(document.file_path)) {
      fs.unlinkSync(document.file_path);
    }

    // Delete document record
    await supabase.from("documents").delete().eq("id", id);

    // Create audit log
    await supabase.from("audit_logs").insert({
      asset_id: document.asset_id,
      action: "document_deleted",
      performed_by: req.user.id,
      details: {
        document_id: id,
        document_name: document.name,
        original_uploader: document.uploaded_by,
      },
      timestamp: new Date().toISOString(),
    });

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    logger.error("Error deleting document:", error);
    res.status(500).json({ message: "Failed to delete document" });
  }
};

// Get documents for an asset
exports.getAssetDocuments = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { asset_id } = req.params;
    const { document_type } = req.query;

    let query = supabase
      .from("documents")
      .select(
        `
        *,
        uploaded_by_user:users!uploaded_by(name, email)
      `,
      )
      .eq("asset_id", asset_id)
      .order("upload_date", { ascending: false });

    if (document_type) {
      query = query.eq("document_type", document_type);
    }

    const { data: documents, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      documents: (documents || []).map((doc) => ({
        id: doc.id,
        name: doc.name,
        file_size: doc.file_size,
        mime_type: doc.mime_type,
        document_type: doc.document_type,
        description: doc.description,
        upload_date: doc.upload_date,
        uploaded_by: doc.uploaded_by_user,
        download_url: `/api/upload/documents/${doc.id}`,
      })),
    });
  } catch (error) {
    logger.error("Error fetching asset documents:", error);
    res.status(500).json({ message: "Failed to fetch asset documents" });
  }
};

// Get user's uploaded documents
exports.getUserDocuments = async (req, res) => {
  try {
    const supabase = getSupabase();
    const userId = req.user.id;
    const { page = 1, limit = 10, document_type } = req.query;

    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;

    let query = supabase
      .from("documents")
      .select(
        `
        *,
        asset_info:assets!asset_id(unique_asset_id, manufacturer, model)
      `,
        { count: "exact" },
      )
      .eq("uploaded_by", userId)
      .order("upload_date", { ascending: false })
      .range(skip, skip + limitInt - 1);

    if (document_type) {
      query = query.eq("document_type", document_type);
    }

    const { data: documents, error, count: total } = await query;

    if (error) {
      throw error;
    }

    res.json({
      documents: (documents || []).map((doc) => ({
        id: doc.id,
        name: doc.name,
        file_size: doc.file_size,
        mime_type: doc.mime_type,
        document_type: doc.document_type,
        description: doc.description,
        upload_date: doc.upload_date,
        asset: doc.asset_info,
        download_url: `/api/upload/documents/${doc.id}`,
      })),
      pagination: {
        current_page: pageInt,
        total_pages: Math.ceil((total || 0) / limitInt),
        total_documents: total || 0,
        has_next: pageInt * limitInt < (total || 0),
        has_prev: pageInt > 1,
      },
    });
  } catch (error) {
    logger.error("Error fetching user documents:", error);
    res.status(500).json({ message: "Failed to fetch user documents" });
  }
};

// Get document types for filtering
exports.getDocumentTypes = async (req, res) => {
  try {
    const types = [
      "general",
      "warranty",
      "invoice",
      "manual",
      "certificate",
      "maintenance",
      "image",
      "report",
      "other",
    ];

    res.json({ types });
  } catch (error) {
    logger.error("Error fetching document types:", error);
    res.status(500).json({ message: "Failed to fetch document types" });
  }
};
