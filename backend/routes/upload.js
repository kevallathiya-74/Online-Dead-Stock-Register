const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { documentUpload, assetImageUpload } = require('../middleware/uploadMiddleware');
const uploadController = require('../controllers/uploadController');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Upload documents (multiple files)
router.post('/documents', 
  documentUpload.array('documents', 5),
  uploadController.uploadDocuments
);

// Upload asset images (multiple files)
router.post('/asset-images', 
  assetImageUpload.array('images', 10),
  uploadController.uploadAssetImages
);

// Download document by ID
router.get('/documents/:id', uploadController.downloadDocument);

// Get documents for specific asset
router.get('/assets/:asset_id/documents', uploadController.getAssetDocuments);

// Get user's uploaded documents
router.get('/my-documents', uploadController.getUserDocuments);

// Get document types for filtering
router.get('/document-types', uploadController.getDocumentTypes);

// Delete document
router.delete('/documents/:id', uploadController.deleteDocument);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ 
      message: 'File too large. Maximum size allowed is 10MB for documents and 5MB for images.' 
    });
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ 
      message: 'Too many files. Maximum 5 documents or 10 images allowed at once.' 
    });
  }
  
  if (error.message) {
    return res.status(400).json({ message: error.message });
  }
  
  res.status(500).json({ message: 'Upload failed' });
});

module.exports = router;