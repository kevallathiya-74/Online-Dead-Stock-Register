const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const sharp = require('sharp');
const ExifParser = require('exif-parser');
const Document = require('../models/document');
const Asset = require('../models/asset');
const AuditLog = require('../models/auditLog');

/**
 * Enhanced Photo Upload Controller
 * Handles photo uploads with compression, thumbnail generation, and EXIF extraction
 */

// Helper function to create upload directories
const ensureUploadDirs = async () => {
  const dirs = [
    'uploads/photos',
    'uploads/photos/originals',
    'uploads/photos/compressed',
    'uploads/photos/thumbnails'
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
    logger.error('Error extracting EXIF data:', error);
    return {};
  }
};

// Compress image and create thumbnail
const processImage = async (inputPath, filename) => {
  try {
    const baseFilename = path.parse(filename).name;
    const extension = '.jpg'; // Always convert to JPG for consistency

    const compressedPath = path.join('uploads', 'photos', 'compressed', `${baseFilename}${extension}`);
    const thumbnailPath = path.join('uploads', 'photos', 'thumbnails', `${baseFilename}${extension}`);

    // Compress original image (max 1920x1080, 80% quality)
    await sharp(inputPath)
      .resize(1920, 1080, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toFile(compressedPath);

    // Create thumbnail (300x300, 70% quality)
    await sharp(inputPath)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center'
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
    logger.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
};

// Upload single photo
exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No photo file uploaded'
      });
    }

    const { asset_id, description, category = 'general' } = req.body;

    if (!asset_id) {
      // Clean up uploaded file
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Asset ID is required'
      });
    }

    // Verify asset exists
    const asset = await Asset.findById(asset_id);
    if (!asset) {
      await fs.unlink(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Extract EXIF data
    const exifData = await extractExifData(req.file.path);

    // Process image (compress and create thumbnail)
    const processedImages = await processImage(req.file.path, req.file.filename);

    // Save original to permanent location
    const originalPath = path.join('uploads', 'photos', 'originals', req.file.filename);
    await fs.rename(req.file.path, originalPath);

    // Create document record
    const document = new Document({
      name: req.file.originalname,
      file_path: processedImages.compressed_path, // Store compressed version as primary
      file_size: processedImages.compressed_size,
      mime_type: 'image/jpeg',
      document_type: 'photo',
      description: description || 'Asset photo',
      asset_id,
      uploaded_by: req.user.id,
      upload_date: new Date(),
      metadata: {
        original_path: originalPath,
        original_size: req.file.size,
        compressed_path: processedImages.compressed_path,
        compressed_size: processedImages.compressed_size,
        thumbnail_path: processedImages.thumbnail_path,
        thumbnail_size: processedImages.thumbnail_size,
        exif: exifData,
        category,
      }
    });

    await document.save();

    // Add photo reference to asset
    if (!asset.images) asset.images = [];
    asset.images.push({
      document_id: document._id,
      url: processedImages.compressed_path,
      thumbnail_url: processedImages.thumbnail_path,
      uploaded_at: new Date(),
      uploaded_by: req.user.id,
    });
    await asset.save();

    // Log upload
    await AuditLog.create({
      asset_id,
      action: 'photo_uploaded',
      performed_by: req.user.id,
      details: {
        photo_id: document._id,
        filename: req.file.originalname,
        file_size: req.file.size,
        compressed_size: processedImages.compressed_size,
        has_exif: Object.keys(exifData).length > 0,
        category,
      },
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Photo uploaded successfully',
      photo: {
        id: document._id,
        name: document.name,
        url: `/${processedImages.compressed_path}`,
        thumbnail_url: `/${processedImages.thumbnail_path}`,
        file_size: processedImages.compressed_size,
        original_size: req.file.size,
        upload_date: document.upload_date,
        exif: exifData,
      }
    });
  } catch (error) {
    logger.error('Error uploading photo:', error);

    // Clean up files on error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        logger.error('Error cleaning up file:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload photo',
      error: error.message
    });
  }
};

// Upload multiple photos (batch upload)
exports.uploadMultiplePhotos = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No photo files uploaded'
      });
    }

    const { asset_id, description, category = 'general' } = req.body;

    if (!asset_id) {
      // Clean up all uploaded files
      for (const file of req.files) {
        await fs.unlink(file.path).catch(console.error);
      }
      return res.status(400).json({
        success: false,
        message: 'Asset ID is required'
      });
    }

    // Verify asset exists
    const asset = await Asset.findById(asset_id);
    if (!asset) {
      for (const file of req.files) {
        await fs.unlink(file.path).catch(console.error);
      }
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    const uploadedPhotos = [];
    const errors = [];

    for (const file of req.files) {
      try {
        // Extract EXIF data
        const exifData = await extractExifData(file.path);

        // Process image
        const processedImages = await processImage(file.path, file.filename);

        // Save original
        const originalPath = path.join('uploads', 'photos', 'originals', file.filename);
        await fs.rename(file.path, originalPath);

        // Create document record
        const document = new Document({
          name: file.originalname,
          file_path: processedImages.compressed_path,
          file_size: processedImages.compressed_size,
          mime_type: 'image/jpeg',
          document_type: 'photo',
          description: description || 'Asset photo',
          asset_id,
          uploaded_by: req.user.id,
          upload_date: new Date(),
          metadata: {
            original_path: originalPath,
            original_size: file.size,
            compressed_path: processedImages.compressed_path,
            compressed_size: processedImages.compressed_size,
            thumbnail_path: processedImages.thumbnail_path,
            thumbnail_size: processedImages.thumbnail_size,
            exif: exifData,
            category,
          }
        });

        await document.save();

        // Add to asset
        if (!asset.images) asset.images = [];
        asset.images.push({
          document_id: document._id,
          url: processedImages.compressed_path,
          thumbnail_url: processedImages.thumbnail_path,
          uploaded_at: new Date(),
          uploaded_by: req.user.id,
        });

        uploadedPhotos.push({
          id: document._id,
          name: document.name,
          url: `/${processedImages.compressed_path}`,
          thumbnail_url: `/${processedImages.thumbnail_path}`,
          file_size: processedImages.compressed_size,
          original_size: file.size,
          upload_date: document.upload_date,
        });
      } catch (error) {
        logger.error(`Error processing file ${file.originalname}:`, error);
        errors.push({
          filename: file.originalname,
          error: error.message
        });
        // Clean up on error
        try {
          await fs.unlink(file.path);
        } catch (cleanupError) {
          logger.error('Error cleaning up file:', cleanupError);
        }
      }
    }

    // Save asset with all photo references
    await asset.save();

    // Log batch upload
    await AuditLog.create({
      asset_id,
      action: 'photos_batch_uploaded',
      performed_by: req.user.id,
      details: {
        total_files: req.files.length,
        successful: uploadedPhotos.length,
        failed: errors.length,
        category,
      },
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: `${uploadedPhotos.length} photo(s) uploaded successfully`,
      photos: uploadedPhotos,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    logger.error('Error in batch photo upload:', error);

    // Clean up all files on critical error
    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (cleanupError) {
          logger.error('Error cleaning up file:', cleanupError);
        }
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload photos',
      error: error.message
    });
  }
};

// Get photos for an asset
exports.getAssetPhotos = async (req, res) => {
  try {
    const { asset_id } = req.params;
    const { include_thumbnails = true, include_exif = false } = req.query;

    const asset = await Asset.findById(asset_id);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    const photos = await Document.find({
      asset_id,
      document_type: 'photo'
    })
    .populate('uploaded_by', 'name email')
    .sort({ upload_date: -1 });

    const photoData = photos.map(photo => ({
      id: photo._id,
      name: photo.name,
      url: `/${photo.file_path}`,
      thumbnail_url: include_thumbnails === 'true' ? `/${photo.metadata?.thumbnail_path}` : undefined,
      file_size: photo.file_size,
      original_size: photo.metadata?.original_size,
      upload_date: photo.upload_date,
      uploaded_by: {
        id: photo.uploaded_by._id,
        name: photo.uploaded_by.name,
        email: photo.uploaded_by.email,
      },
      description: photo.description,
      category: photo.metadata?.category || 'general',
      exif: include_exif === 'true' ? photo.metadata?.exif : undefined,
    }));

    res.json({
      success: true,
      asset_id,
      photo_count: photoData.length,
      photos: photoData,
    });
  } catch (error) {
    logger.error('Error fetching asset photos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch photos',
      error: error.message
    });
  }
};

// Delete photo
exports.deletePhoto = async (req, res) => {
  try {
    const { photo_id } = req.params;

    const photo = await Document.findById(photo_id);
    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
    }

    // Check permissions (only uploader or admin)
    if (photo.uploaded_by.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    // Delete physical files
    const filesToDelete = [
      photo.file_path,
      photo.metadata?.original_path,
      photo.metadata?.thumbnail_path,
    ].filter(Boolean);

    for (const filePath of filesToDelete) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        logger.error(`Error deleting file ${filePath}:`, error);
      }
    }

    // Remove from asset
    if (photo.asset_id) {
      await Asset.updateOne(
        { _id: photo.asset_id },
        { $pull: { images: { document_id: photo._id } } }
      );
    }

    // Delete document record
    await Document.findByIdAndDelete(photo_id);

    // Log deletion
    await AuditLog.create({
      asset_id: photo.asset_id,
      action: 'photo_deleted',
      performed_by: req.user.id,
      details: {
        photo_id,
        filename: photo.name,
      },
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Photo deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting photo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete photo',
      error: error.message
    });
  }
};

// Get photo statistics
exports.getPhotoStats = async (req, res) => {
  try {
    const stats = await Document.aggregate([
      { $match: { document_type: 'photo' } },
      {
        $group: {
          _id: null,
          total_photos: { $sum: 1 },
          total_size: { $sum: '$file_size' },
          avg_size: { $avg: '$file_size' },
        }
      }
    ]);

    const photosByAsset = await Document.aggregate([
      { $match: { document_type: 'photo' } },
      { $group: { _id: '$asset_id', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const photosByUser = await Document.aggregate([
      { $match: { document_type: 'photo' } },
      { $group: { _id: '$uploaded_by', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' }
    ]);

    res.json({
      success: true,
      stats: stats[0] || { total_photos: 0, total_size: 0, avg_size: 0 },
      top_assets_by_photo_count: photosByAsset,
      top_uploaders: photosByUser.map(item => ({
        user_id: item._id,
        user_name: item.user.name,
        photo_count: item.count,
      })),
    });
  } catch (error) {
    logger.error('Error fetching photo stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch photo statistics',
      error: error.message
    });
  }
};

module.exports = exports;
