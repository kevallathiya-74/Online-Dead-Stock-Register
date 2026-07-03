const fs = require("fs").promises;
const path = require("path");
const logger = require("../utils/logger");
const sharp = require("sharp");
const ExifParser = require("exif-parser");
const getSupabase = require("../config/db");

/**
 * Enhanced Photo Upload Controller
 * Handles photo uploads with compression, thumbnail generation, and EXIF extraction
 * Refactored from MongoDB/Mongoose to Supabase (PostgreSQL)
 */

// Helper function to create upload directories
const ensureUploadDirs = async () => {
  const dirs = [
    "uploads/photos",
    "uploads/photos/originals",
    "uploads/photos/compressed",
    "uploads/photos/thumbnails",
  ];

  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      logger.error(`Error creating directory ${dir}:`, error);
    }
  }
};

// Initialize directories
ensureUploadDirs();

// Extract EXIF data from image
const extractExifData = async (filePath) => {
  try {
    const buffer = await fs.readFile(filePath);
    const parser = ExifParser.create(buffer);
    const result = parser.parse();

    return {
      date_taken: result.tags.DateTimeOriginal || result.tags.DateTime || null,
      camera_make: result.tags.Make || null,
      camera_model: result.tags.Model || null,
      gps_latitude: result.tags.GPSLatitude || null,
      gps_longitude: result.tags.GPSLongitude || null,
      orientation: result.tags.Orientation || null,
      width: result.imageSize?.width || null,
      height: result.imageSize?.height || null,
      iso: result.tags.ISO || null,
      exposure_time: result.tags.ExposureTime || null,
      f_number: result.tags.FNumber || null,
      flash: result.tags.Flash || null,
    };
  } catch (error) {
    logger.error("Error extracting EXIF data:", error);
    return {};
  }
};

// Compress image and create thumbnail
const processImage = async (inputPath, filename) => {
  try {
    const baseFilename = path.parse(filename).name;
    const extension = ".jpg"; // Always convert to JPG for consistency

    const compressedPath = path.join(
      "uploads",
      "photos",
      "compressed",
      `${baseFilename}${extension}`,
    );
    const thumbnailPath = path.join(
      "uploads",
      "photos",
      "thumbnails",
      `${baseFilename}${extension}`,
    );

    // Compress original image (max 1920x1080, 80% quality)
    await sharp(inputPath)
      .resize(1920, 1080, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toFile(compressedPath);

    // Create thumbnail (300x300, 70% quality)
    await sharp(inputPath)
      .resize(300, 300, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 70 })
      .toFile(thumbnailPath);

    // Get file sizes
    const compressedStats = await fs.stat(compressedPath);
    const thumbnailStats = await fs.stat(thumbnailPath);

    return {
      compressed_path: compressedPath,
      compressed_size: compressedStats.size,
      thumbnail_path: thumbnailPath,
      thumbnail_size: thumbnailStats.size,
    };
  } catch (error) {
    logger.error("Error processing image:", error);
    throw new Error("Failed to process image");
  }
};

// ---------------------------------------------------------------------------
// Helper: serialise / deserialise extended metadata in documents.description
// The documents table has no dedicated metadata column; extended photo info
// (thumbnail path, original path, EXIF, category, etc.) is stored as a JSON
// string inside the description field and parsed back on reads.
// ---------------------------------------------------------------------------
const buildMetaDescription = (data) => JSON.stringify(data);

const parseMetaDescription = (description) => {
  try {
    return JSON.parse(description);
  } catch (_) {
    return {};
  }
};

// ---------------------------------------------------------------------------
// Upload single photo
// ---------------------------------------------------------------------------
exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No photo file uploaded" });
    }

    const { asset_id, description, category = "general" } = req.body;

    if (!asset_id) {
      await fs.unlink(req.file.path);
      return res
        .status(400)
        .json({ success: false, message: "Asset ID is required" });
    }

    const supabase = getSupabase();

    // Verify asset exists
    const { data: asset, error: assetErr } = await supabase
      .from("assets")
      .select("id, images")
      .eq("id", asset_id)
      .single();

    if (assetErr || !asset) {
      await fs.unlink(req.file.path);
      return res
        .status(404)
        .json({ success: false, message: "Asset not found" });
    }

    // Extract EXIF data
    const exifData = await extractExifData(req.file.path);

    // Process image (compress + thumbnail)
    const processedImages = await processImage(
      req.file.path,
      req.file.filename,
    );

    // Move original to permanent location
    const originalPath = path.join(
      "uploads",
      "photos",
      "originals",
      req.file.filename,
    );
    await fs.rename(req.file.path, originalPath);

    // Build metadata blob stored in description field
    const metaBlob = buildMetaDescription({
      original_path: originalPath,
      original_size: req.file.size,
      compressed_path: processedImages.compressed_path,
      compressed_size: processedImages.compressed_size,
      thumbnail_path: processedImages.thumbnail_path,
      thumbnail_size: processedImages.thumbnail_size,
      exif: exifData,
      category,
      user_description: description || "Asset photo",
    });

    // Insert document record
    const { data: document, error: docErr } = await supabase
      .from("documents")
      .insert({
        asset_id,
        document_type: "Other",
        file_name: req.file.originalname,
        file_path: processedImages.compressed_path,
        file_size: processedImages.compressed_size,
        uploaded_by: req.user.id,
        uploaded_at: new Date().toISOString(),
        description: metaBlob,
      })
      .select()
      .single();

    if (docErr) {
      logger.error("Error inserting document record:", docErr);
      throw new Error(docErr.message);
    }

    // Append photo reference to asset.images JSONB array
    const existingImages = Array.isArray(asset.images) ? asset.images : [];
    const updatedImages = [
      ...existingImages,
      {
        document,
        url: processedImages.compressed_path,
        thumbnail_url: processedImages.thumbnail_path,
        uploaded_at: new Date().toISOString(),
        uploaded_by: req.user.id,
      },
    ];

    const { error: assetUpdateErr } = await supabase
      .from("assets")
      .update({ images: updatedImages })
      .eq("id", asset_id);

    if (assetUpdateErr)
      logger.error("Error updating asset images:", assetUpdateErr);

    // Audit log
    const { error: auditErr } = await supabase.from("audit_logs").insert({
      asset_id,
      action: "photo_uploaded",
      performed_by: req.user.id,
      details: {
        filename: req.file.originalname,
        file_size: req.file.size,
        compressed_size: processedImages.compressed_size,
        has_exif: Object.keys(exifData).length > 0,
        category,
      },
      timestamp: new Date().toISOString(),
    });

    if (auditErr) logger.error("Error creating audit log:", auditErr);

    return res.status(201).json({
      success: true,
      message: "Photo uploaded successfully",
      photo: {
        id: document.id,
        name: document.file_name,
        url: `/${processedImages.compressed_path}`,
        thumbnail_url: `/${processedImages.thumbnail_path}`,
        file_size: processedImages.compressed_size,
        original_size: req.file.size,
        upload_date: document.uploaded_at,
        exif: exifData,
      },
    });
  } catch (error) {
    logger.error("Error uploading photo:", error);

    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        logger.error("Error cleaning up file:", cleanupError);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to upload photo",
      error: "An internal server error occurred",
    });
  }
};

// ---------------------------------------------------------------------------
// Batch upload photos
// ---------------------------------------------------------------------------
exports.uploadMultiplePhotos = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No photo files uploaded" });
    }

    const { asset_id, description, category = "general" } = req.body;

    if (!asset_id) {
      for (const file of req.files)
        await fs.unlink(file.path).catch(console.error);
      return res
        .status(400)
        .json({ success: false, message: "Asset ID is required" });
    }

    const supabase = getSupabase();

    // Verify asset exists
    const { data: asset, error: assetErr } = await supabase
      .from("assets")
      .select("id, images")
      .eq("id", asset_id)
      .single();

    if (assetErr || !asset) {
      for (const file of req.files)
        await fs.unlink(file.path).catch(console.error);
      return res
        .status(404)
        .json({ success: false, message: "Asset not found" });
    }

    const uploadedPhotos = [];
    const errors = [];
    const newImageEntries = [];

    for (const file of req.files) {
      try {
        const exifData = await extractExifData(file.path);
        const processedImages = await processImage(file.path, file.filename);

        const originalPath = path.join(
          "uploads",
          "photos",
          "originals",
          file.filename,
        );
        await fs.rename(file.path, originalPath);

        const metaBlob = buildMetaDescription({
          original_path: originalPath,
          original_size: file.size,
          compressed_path: processedImages.compressed_path,
          compressed_size: processedImages.compressed_size,
          thumbnail_path: processedImages.thumbnail_path,
          thumbnail_size: processedImages.thumbnail_size,
          exif: exifData,
          category,
          user_description: description || "Asset photo",
        });

        const { data: document, error: docErr } = await supabase
          .from("documents")
          .insert({
            asset_id,
            document_type: "Other",
            file_name: file.originalname,
            file_path: processedImages.compressed_path,
            file_size: processedImages.compressed_size,
            uploaded_by: req.user.id,
            uploaded_at: new Date().toISOString(),
            description: metaBlob,
          })
          .select()
          .single();

        if (docErr) throw new Error(docErr.message);

        newImageEntries.push({
          document,
          url: processedImages.compressed_path,
          thumbnail_url: processedImages.thumbnail_path,
          uploaded_at: new Date().toISOString(),
          uploaded_by: req.user.id,
        });

        uploadedPhotos.push({
          id: document.id,
          name: document.file_name,
          url: `/${processedImages.compressed_path}`,
          thumbnail_url: `/${processedImages.thumbnail_path}`,
          file_size: processedImages.compressed_size,
          original_size: file.size,
          upload_date: document.uploaded_at,
        });
      } catch (fileErr) {
        logger.error(`Error processing file ${file.originalname}:`, fileErr);
        errors.push({ filename: file.originalname, error: fileErr.message });
        try {
          await fs.unlink(file.path);
        } catch (cleanupError) {
          logger.error("Error cleaning up file:", cleanupError);
        }
      }
    }

    // Persist all new image references in one asset update
    if (newImageEntries.length > 0) {
      const existingImages = Array.isArray(asset.images) ? asset.images : [];
      const { error: assetUpdateErr } = await supabase
        .from("assets")
        .update({ images: [...existingImages, ...newImageEntries] })
        .eq("id", asset_id);
      if (assetUpdateErr)
        logger.error("Error updating asset images:", assetUpdateErr);
    }

    // Audit log
    const { error: auditErr } = await supabase.from("audit_logs").insert({
      asset_id,
      action: "photos_batch_uploaded",
      performed_by: req.user.id,
      details: {
        total_files: req.files.length,
        successful: uploadedPhotos.length,
        failed: errors.length,
        category,
      },
      timestamp: new Date().toISOString(),
    });

    if (auditErr) logger.error("Error creating audit log:", auditErr);

    return res.status(201).json({
      success: true,
      message: `${uploadedPhotos.length} photo(s) uploaded successfully`,
      photos: uploadedPhotos,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    logger.error("Error in batch photo upload:", error);

    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (cleanupError) {
          logger.error("Error cleaning up file:", cleanupError);
        }
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to upload photos",
      error: "An internal server error occurred",
    });
  }
};

// ---------------------------------------------------------------------------
// Get photos for an asset
// ---------------------------------------------------------------------------
exports.getAssetPhotos = async (req, res) => {
  try {
    const { asset_id } = req.params;
    const { include_thumbnails = "true", include_exif = "false" } = req.query;

    const supabase = getSupabase();

    // Verify asset exists
    const { data: asset, error: assetErr } = await supabase
      .from("assets")
      .select("id")
      .eq("id", asset_id)
      .single();

    if (assetErr || !asset) {
      return res
        .status(404)
        .json({ success: false, message: "Asset not found" });
    }

    // Fetch photo documents joined with uploader user info
    const { data: photos, error: photosErr } = await supabase
      .from("documents")
      .select(
        `
        id,
        file_name,
        file_path,
        file_size,
        description,
        uploaded_at,
        uploaded_by,
        users:uploaded_by ( id, name, email )
      `,
      )
      .eq("asset_id", asset_id)
      .eq("document_type", "Other")
      .order("uploaded_at", { ascending: false });

    if (photosErr) {
      logger.error("Error fetching asset photos:", photosErr);
      throw new Error(photosErr.message);
    }

    const photoData = (photos || []).map((photo) => {
      const meta = parseMetaDescription(photo.description);
      return {
        id: photo.id,
        name: photo.file_name,
        url: `/${photo.file_path}`,
        thumbnail_url:
          include_thumbnails === "true" && meta.thumbnail_path
            ? `/${meta.thumbnail_path}`
            : undefined,
        file_size: photo.file_size,
        original_size: meta.original_size,
        upload_date: photo.uploaded_at,
        uploaded_by: photo.users
          ? {
              id: photo.users.id,
              name: photo.users.name,
              email: photo.users.email,
            }
          : { id: photo.uploaded_by },
        description: meta.user_description || "",
        category: meta.category || "general",
        exif: include_exif === "true" ? meta.exif : undefined,
      };
    });

    return res.json({
      success: true,
      asset_id,
      photo_count: photoData.length,
      photos: photoData,
    });
  } catch (error) {
    logger.error("Error fetching asset photos:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch photos",
      error: "An internal server error occurred",
    });
  }
};

// ---------------------------------------------------------------------------
// Delete a single photo
// ---------------------------------------------------------------------------
exports.deletePhoto = async (req, res) => {
  try {
    const { photo_id } = req.params;

    const supabase = getSupabase();

    // Fetch document record
    const { data: photo, error: photoErr } = await supabase
      .from("documents")
      .select("id, asset_id, file_name, file_path, description, uploaded_by")
      .eq("id", photo_id)
      .single();

    if (photoErr || !photo) {
      return res
        .status(404)
        .json({ success: false, message: "Photo not found" });
    }

    // Permission check: only the uploader or an ADMIN may delete
    if (photo.uploaded_by !== req.user.id && req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, message: "Permission denied" });
    }

    const meta = parseMetaDescription(photo.description);

    // Delete physical files
    const filesToDelete = [
      photo.file_path,
      meta.original_path,
      meta.thumbnail_path,
    ].filter(Boolean);

    for (const filePath of filesToDelete) {
      try {
        await fs.unlink(filePath);
      } catch (unlinkErr) {
        logger.error(`Error deleting file ${filePath}:`, unlinkErr);
      }
    }

    // Remove photo reference from asset.images JSONB array
    if (photo.asset_id) {
      const { data: assetData } = await supabase
        .from("assets")
        .select("images")
        .eq("id", photo.asset_id)
        .single();

      if (assetData && Array.isArray(assetData.images)) {
        const filteredImages = assetData.images.filter(
          (img) => img.document_id !== photo_id,
        );
        await supabase
          .from("assets")
          .update({ images: filteredImages })
          .eq("id", photo.asset_id);
      }
    }

    // Delete the document record
    const { error: deleteErr } = await supabase
      .from("documents")
      .delete()
      .eq("id", photo_id);

    if (deleteErr) {
      logger.error("Error deleting document record:", deleteErr);
      throw new Error(deleteErr.message);
    }

    // Audit log
    const { error: auditErr } = await supabase.from("audit_logs").insert({
      asset_id: photo.asset_id,
      action: "photo_deleted",
      performed_by: req.user.id,
      details: {
        photo_id,
        filename: photo.file_name,
      },
      timestamp: new Date().toISOString(),
    });

    if (auditErr) logger.error("Error creating audit log:", auditErr);

    return res.json({ success: true, message: "Photo deleted successfully" });
  } catch (error) {
    logger.error("Error deleting photo:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete photo",
      error: "An internal server error occurred",
    });
  }
};

// ---------------------------------------------------------------------------
// Photo statistics (aggregate in JS — Supabase JS client has no native $group)
// ---------------------------------------------------------------------------
exports.getPhotoStats = async (req, res) => {
  try {
    const supabase = getSupabase();

    // Fetch all photo document records (document_type = 'Other')
    const { data: allPhotos, error: photosErr } = await supabase
      .from("documents")
      .select("id, file_size, asset_id, uploaded_by")
      .eq("document_type", "Other");

    if (photosErr) {
      logger.error("Error fetching photo stats:", photosErr);
      throw new Error(photosErr.message);
    }

    const photos = allPhotos || [];

    // Overall aggregates
    const totalSize = photos.reduce((sum, p) => sum + (p.file_size || 0), 0);
    const avgSize =
      photos.length > 0 ? Math.round(totalSize / photos.length) : 0;
    const stats = {
      total_photos: photos.length,
      total_size: totalSize,
      avg_size: avgSize,
    };

    // Top 10 assets by photo count
    const assetCountMap = {};
    for (const p of photos) {
      if (p.asset_id)
        assetCountMap[p.asset_id] = (assetCountMap[p.asset_id] || 0) + 1;
    }
    const photosByAsset = Object.entries(assetCountMap)
      .map(([asset_id, count]) => ({ count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top 10 uploaders — enrich with name from users table
    const userCountMap = {};
    for (const p of photos) {
      if (p.uploaded_by)
        userCountMap[p.uploaded_by] = (userCountMap[p.uploaded_by] || 0) + 1;
    }
    const topUploaderIds = Object.entries(userCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId]) => userId);

    let topUploaders = [];
    if (topUploaderIds.length > 0) {
      const { data: usersData } = await supabase
        .from("users")
        .select("id, name")
        .in("id", topUploaderIds);

      const userMap = {};
      for (const u of usersData || []) userMap[u.id] = u;

      topUploaders = Object.entries(userCountMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([userId, count]) => ({
          user_id: userId,
          user_name: userMap[userId]?.name || "Unknown",
          photo_count: count,
        }));
    }

    return res.json({
      success: true,
      stats,
      top_assets_by_photo_count: photosByAsset,
      top_uploaders: topUploaders,
    });
  } catch (error) {
    logger.error("Error fetching photo stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch photo statistics",
      error: "An internal server error occurred",
    });
  }
};

module.exports = exports;
