const express = require('express');
const router = express.Router();
const docCtrl = require('../controllers/documentController');
const { documentUpload } = require('../middleware/uploadMiddleware');
const { authMiddleware } = require('../middleware/authMiddleware');

// Get all documents with filters
router.get('/', authMiddleware, docCtrl.getAllDocuments);

// Upload document - FIX FOR ISSUE #2 - Accept 'document' field name
router.post('/upload', authMiddleware, documentUpload.single('document'), docCtrl.uploadDocument);

// Get documents for specific asset
router.get('/:assetId', authMiddleware, docCtrl.getDocumentsByAsset);

// Upload document for specific asset
router.post('/:assetId', authMiddleware, documentUpload.single('document'), docCtrl.uploadDocument);

// Delete document
router.delete('/:id', authMiddleware, docCtrl.deleteDocument);

module.exports = router;
