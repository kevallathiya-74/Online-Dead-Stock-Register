const express = require('express');
const router = express.Router();
const photoController = require('../controllers/photoController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/photos/temp/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `photo-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, HEIC, and HEIF images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  }
});

// Ensure temp directory exists
const fs = require('fs');
const tempDir = 'uploads/photos/temp';
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/photos/upload
 * @desc    Upload single photo
 * @access  All authenticated users
 * @body    { asset_id, description, category } + file
 */
router.post('/upload', upload.single('photo'), photoController.uploadPhoto);

/**
 * @route   POST /api/photos/upload-multiple
 * @desc    Upload multiple photos (batch upload)
 * @access  All authenticated users
 * @body    { asset_id, description, category } + files (max 10)
 */
router.post('/upload-multiple', upload.array('photos', 10), photoController.uploadMultiplePhotos);

/**
 * @route   GET /api/photos/asset/:asset_id
 * @desc    Get all photos for an asset
 * @access  All authenticated users
 * @query   include_thumbnails (boolean), include_exif (boolean)
 */
router.get('/asset/:asset_id', photoController.getAssetPhotos);

/**
 * @route   DELETE /api/photos/:photo_id
 * @desc    Delete a photo
 * @access  Photo uploader or Admin
 */
router.delete('/:photo_id', photoController.deletePhoto);

/**
 * @route   GET /api/photos/stats
 * @desc    Get photo statistics
 * @access  Admin only
 */
router.get('/stats', requireRole(['ADMIN']), photoController.getPhotoStats);

// Error handling middleware for multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB per file.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files per upload.'
      });
    }
  }
  
  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  res.status(500).json({
    success: false,
    message: 'File upload error',
    error: err.message
  });
});

module.exports = router;
