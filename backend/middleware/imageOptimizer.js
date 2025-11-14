/**
 * Image Optimization Middleware
 * Compresses and optimizes uploaded images using Sharp
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

/**
 * Image optimization middleware
 * Processes uploaded images to reduce file size and optimize dimensions
 */
const optimizeImage = async (req, res, next) => {
  // Skip if no file uploaded
  if (!req.file && !req.files) {
    return next();
  }

  try {
    const files = req.files || [req.file];
    const optimizedFiles = [];

    for (const file of files) {
      if (!file) continue;

      // Only process image files
      const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!imageTypes.includes(file.mimetype)) {
        optimizedFiles.push(file);
        continue;
      }

      // Generate optimized filename
      const ext = 'jpg'; // Convert all to jpg for consistency
      const filename = `optimized-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const outputDir = path.join(process.env.UPLOAD_PATH || 'uploads', 'optimized');
      const outputPath = path.join(outputDir, filename);

      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      // Get original file size
      const stats = await fs.stat(file.path);
      const originalSize = stats.size;

      // Optimize image with Sharp
      await sharp(file.path)
        .resize(1920, 1920, {
          fit: 'inside',
          withoutEnlargement: true, // Don't upscale small images
        })
        .jpeg({
          quality: 80,
          progressive: true,
          mozjpeg: true, // Use mozjpeg for better compression
        })
        .toFile(outputPath);

      // Get optimized file size
      const optimizedStats = await fs.stat(outputPath);
      const optimizedSize = optimizedStats.size;
      const savedBytes = originalSize - optimizedSize;
      const savedPercent = ((savedBytes / originalSize) * 100).toFixed(1);

      logger.info('Image optimized', {
        originalFile: file.originalname,
        originalSize: `${(originalSize / 1024).toFixed(2)}KB`,
        optimizedSize: `${(optimizedSize / 1024).toFixed(2)}KB`,
        saved: `${(savedBytes / 1024).toFixed(2)}KB (${savedPercent}%)`,
        requestId: req.id,
      });

      // Delete original file to save storage
      try {
        await fs.unlink(file.path);
      } catch (err) {
        logger.warn('Failed to delete original file', { path: file.path });
      }

      // Update file information
      optimizedFiles.push({
        ...file,
        filename,
        path: outputPath,
        size: optimizedSize,
        optimized: true,
        originalSize,
        savedBytes,
      });
    }

    // Update request with optimized files
    if (req.files) {
      req.files = optimizedFiles;
    } else {
      req.file = optimizedFiles[0];
    }

    next();
  } catch (error) {
    logger.error('Image optimization error', {
      error: error.message,
      stack: error.stack,
      requestId: req.id,
    });

    // Continue without optimization if error occurs
    // This ensures upload still works even if optimization fails
    next();
  }
};

/**
 * Generate thumbnail for image
 */
const generateThumbnail = async (imagePath, thumbnailSize = 300) => {
  try {
    const parsed = path.parse(imagePath);
    const thumbnailPath = path.join(
      parsed.dir,
      'thumbnails',
      `thumb-${parsed.name}${parsed.ext}`
    );

    // Ensure thumbnails directory exists
    await fs.mkdir(path.join(parsed.dir, 'thumbnails'), { recursive: true });

    await sharp(imagePath)
      .resize(thumbnailSize, thumbnailSize, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 70 })
      .toFile(thumbnailPath);

    logger.info('Thumbnail generated', { imagePath, thumbnailPath });

    return thumbnailPath;
  } catch (error) {
    logger.error('Thumbnail generation error', { error: error.message, imagePath });
    throw error;
  }
};

/**
 * Convert image to WebP format for even better compression
 */
const convertToWebP = async (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }

  try {
    const files = req.files || [req.file];
    const convertedFiles = [];

    for (const file of files) {
      if (!file) continue;

      // Only process image files
      const imageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!imageTypes.includes(file.mimetype)) {
        convertedFiles.push(file);
        continue;
      }

      // Generate WebP filename
      const filename = `${path.parse(file.originalname).name}-${Date.now()}.webp`;
      const outputDir = path.join(process.env.UPLOAD_PATH || 'uploads', 'webp');
      const outputPath = path.join(outputDir, filename);

      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      // Convert to WebP
      await sharp(file.path)
        .resize(1920, 1920, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toFile(outputPath);

      // Delete original
      try {
        await fs.unlink(file.path);
      } catch (err) {
        logger.warn('Failed to delete original file', { path: file.path });
      }

      convertedFiles.push({
        ...file,
        filename,
        path: outputPath,
        mimetype: 'image/webp',
      });
    }

    if (req.files) {
      req.files = convertedFiles;
    } else {
      req.file = convertedFiles[0];
    }

    next();
  } catch (error) {
    logger.error('WebP conversion error', {
      error: error.message,
      requestId: req.id,
    });
    next();
  }
};

module.exports = {
  optimizeImage,
  generateThumbnail,
  convertToWebP,
};
