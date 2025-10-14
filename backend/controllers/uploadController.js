const fs = require('fs');
const path = require('path');
const Document = require('../models/document');
const AuditLog = require('../models/auditLog');

// Upload documents
exports.uploadDocuments = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const { asset_id, document_type, description } = req.body;
    const uploadedFiles = [];

    for (const file of req.files) {
      const document = new Document({
        name: file.originalname,
        file_path: file.path,
        file_size: file.size,
        mime_type: file.mimetype,
        document_type: document_type || 'general',
        description: description || '',
        asset_id: asset_id || null,
        uploaded_by: req.user.id,
        upload_date: new Date()
      });

      await document.save();
      uploadedFiles.push({
        id: document._id,
        name: document.name,
        file_size: document.file_size,
        document_type: document.document_type,
        upload_date: document.upload_date
      });
    }

    // Create audit log
    const auditLog = new AuditLog({
      asset_id: asset_id || null,
      action: 'documents_uploaded',
      performed_by: req.user.id,
      details: {
        file_count: req.files.length,
        document_type: document_type,
        file_names: req.files.map(file => file.originalname)
      },
      timestamp: new Date()
    });
    await auditLog.save();

    res.status(201).json({
      message: `${uploadedFiles.length} document(s) uploaded successfully`,
      documents: uploadedFiles
    });
  } catch (error) {
    console.error('Error uploading documents:', error);
    // Clean up uploaded files if database save fails
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(500).json({ message: 'Failed to upload documents' });
  }
};

// Upload asset images
exports.uploadAssetImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    const { asset_id, description } = req.body;
    
    if (!asset_id) {
      // Clean up files if no asset_id provided
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res.status(400).json({ message: 'Asset ID is required for image upload' });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const document = new Document({
        name: file.originalname,
        file_path: file.path,
        file_size: file.size,
        mime_type: file.mimetype,
        document_type: 'image',
        description: description || 'Asset image',
        asset_id: asset_id,
        uploaded_by: req.user.id,
        upload_date: new Date()
      });

      await document.save();
      uploadedImages.push({
        id: document._id,
        name: document.name,
        file_size: document.file_size,
        file_path: `/uploads/asset-images/${path.basename(file.path)}`,
        upload_date: document.upload_date
      });
    }

    // Create audit log
    const auditLog = new AuditLog({
      asset_id: asset_id,
      action: 'asset_images_uploaded',
      performed_by: req.user.id,
      details: {
        image_count: req.files.length,
        file_names: req.files.map(file => file.originalname)
      },
      timestamp: new Date()
    });
    await auditLog.save();

    res.status(201).json({
      message: `${uploadedImages.length} image(s) uploaded successfully`,
      images: uploadedImages
    });
  } catch (error) {
    console.error('Error uploading asset images:', error);
    // Clean up uploaded files if database save fails
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(500).json({ message: 'Failed to upload asset images' });
  }
};

// Download document
exports.downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if file exists
    if (!fs.existsSync(document.file_path)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
    res.setHeader('Content-Type', document.mime_type);

    // Stream the file
    const fileStream = fs.createReadStream(document.file_path);
    fileStream.pipe(res);

    // Log download activity
    const auditLog = new AuditLog({
      asset_id: document.asset_id,
      action: 'document_downloaded',
      performed_by: req.user.id,
      details: {
        document_id: id,
        document_name: document.name
      },
      timestamp: new Date()
    });
    await auditLog.save();
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ message: 'Failed to download document' });
  }
};

// Delete document
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permissions - only uploader, admin, or inventory manager can delete
    const canDelete = 
      document.uploaded_by.toString() === req.user.id ||
      ['ADMIN', 'INVENTORY_MANAGER'].includes(req.user.role);

    if (!canDelete) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete file from filesystem
    if (fs.existsSync(document.file_path)) {
      fs.unlinkSync(document.file_path);
    }

    // Delete document record
    await Document.findByIdAndDelete(id);

    // Create audit log
    const auditLog = new AuditLog({
      asset_id: document.asset_id,
      action: 'document_deleted',
      performed_by: req.user.id,
      details: {
        document_id: id,
        document_name: document.name,
        original_uploader: document.uploaded_by
      },
      timestamp: new Date()
    });
    await auditLog.save();

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Failed to delete document' });
  }
};

// Get documents for an asset
exports.getAssetDocuments = async (req, res) => {
  try {
    const { asset_id } = req.params;
    const { document_type } = req.query;

    let filter = { asset_id };
    if (document_type) filter.document_type = document_type;

    const documents = await Document.find(filter)
      .populate('uploaded_by', 'full_name email')
      .sort({ upload_date: -1 });

    res.json({
      documents: documents.map(doc => ({
        id: doc._id,
        name: doc.name,
        file_size: doc.file_size,
        mime_type: doc.mime_type,
        document_type: doc.document_type,
        description: doc.description,
        upload_date: doc.upload_date,
        uploaded_by: doc.uploaded_by,
        download_url: `/api/upload/documents/${doc._id}`
      }))
    });
  } catch (error) {
    console.error('Error fetching asset documents:', error);
    res.status(500).json({ message: 'Failed to fetch asset documents' });
  }
};

// Get user's uploaded documents
exports.getUserDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, document_type } = req.query;
    const skip = (page - 1) * limit;

    let filter = { uploaded_by: userId };
    if (document_type) filter.document_type = document_type;

    const documents = await Document.find(filter)
      .populate('asset_id', 'unique_asset_id manufacturer model')
      .sort({ upload_date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Document.countDocuments(filter);

    res.json({
      documents: documents.map(doc => ({
        id: doc._id,
        name: doc.name,
        file_size: doc.file_size,
        mime_type: doc.mime_type,
        document_type: doc.document_type,
        description: doc.description,
        upload_date: doc.upload_date,
        asset: doc.asset_id,
        download_url: `/api/upload/documents/${doc._id}`
      })),
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_documents: total,
        has_next: page * limit < total,
        has_prev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching user documents:', error);
    res.status(500).json({ message: 'Failed to fetch user documents' });
  }
};

// Get document types for filtering
exports.getDocumentTypes = async (req, res) => {
  try {
    const types = [
      'general',
      'warranty',
      'invoice',
      'manual',
      'certificate',
      'maintenance',
      'image',
      'report',
      'other'
    ];

    res.json({ types });
  } catch (error) {
    console.error('Error fetching document types:', error);
    res.status(500).json({ message: 'Failed to fetch document types' });
  }
};