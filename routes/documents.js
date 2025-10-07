const express = require('express');
const router = express.Router();
const docCtrl = require('../controllers/documentController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/:assetId', authMiddleware, docCtrl.getDocumentsByAsset);
router.post('/:assetId', authMiddleware, upload.single('file'), docCtrl.uploadDocument);

module.exports = router;
