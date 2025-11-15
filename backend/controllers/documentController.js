const Document = require('../models/document');

// Get all documents with populated asset and user data
exports.getAllDocuments = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', documentType = '' } = req.query;
    
    // Build query
    const query = {};
    
    if (documentType && documentType !== 'all') {
      query.document_type = documentType;
    }
    
    if (search) {
      query.file_name = { $regex: search, $options: 'i' };
    }
    
    const documents = await Document.find(query)
      .populate('asset_id', 'asset_name asset_tag')
      .populate('uploaded_by', 'name email')
      .sort({ uploaded_at: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Document.countDocuments(query);
    
    res.json({
      success: true,
      data: documents,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDocumentsByAsset = async (req, res) => {
  try {
    const docs = await Document.find({ asset_id: req.params.assetId })
      .populate('uploaded_by', 'name email')
      .sort({ uploaded_at: -1 });
    res.json({ success: true, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete a document by id
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Document.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    return res.json({ success: true, message: 'Document deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'File missing' });
    const doc = new Document({
      asset_id: req.params.assetId,
      document_type: req.body.document_type || 'Other',
      file_name: req.file.originalname,
      file_path: req.file.path,
      file_size: req.file.size,
      uploaded_by: req.body.uploaded_by
    });
    const saved = await doc.save();
    res.status(201).json({ success: true, data: saved, message: 'Document uploaded successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
