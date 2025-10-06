const express = require('express');
const router = express.Router();
const docCtrl = require('../controllers/documentController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.get('/:assetId', docCtrl.getDocumentsByAsset);
router.post('/:assetId', upload.single('file'), docCtrl.uploadDocument);

module.exports = router;
