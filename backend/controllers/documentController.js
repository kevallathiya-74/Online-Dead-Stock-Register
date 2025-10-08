const Document = require('../models/document');

exports.getDocumentsByAsset = async (req, res) => {
  try {
    const docs = await Document.find({ asset_id: req.params.assetId });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'File missing' });
    const doc = new Document({
      asset_id: req.params.assetId,
      document_type: req.body.document_type || 'Other',
      file_name: req.file.originalname,
      file_path: req.file.path,
      file_size: req.file.size,
      uploaded_by: req.body.uploaded_by
    });
    const saved = await doc.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
