const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const logger = require('../utils/logger');

// Backup model schema
const backupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['full', 'incremental', 'differential'], required: true },
  size: { type: String },
  status: { type: String, enum: ['completed', 'failed', 'in-progress'], default: 'in-progress' },
  location: { type: String, enum: ['local', 'cloud'], default: 'local' },
  description: { type: String },
  filePath: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  error: { type: String }
});

const Backup = mongoose.model('Backup', backupSchema);

// Backup job schema
const backupJobSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['full', 'incremental', 'differential'], required: true },
  schedule: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  lastRun: { type: Date },
  nextRun: { type: Date },
  status: { type: String, enum: ['active', 'paused', 'failed'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

const BackupJob = mongoose.model('BackupJob', backupJobSchema);

// Get file size helper
function getFileSizeInMB(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const fileSizeInBytes = stats.size;
    const fileSizeInMB = fileSizeInBytes / (1024 * 1024);
    
    if (fileSizeInMB > 1024) {
      return `${(fileSizeInMB / 1024).toFixed(2)} GB`;
    }
    return `${fileSizeInMB.toFixed(2)} MB`;
  } catch (error) {
    return 'Unknown';
  }
}

// Get all backups
exports.getAllBackups = async (req, res) => {
  try {
    const backups = await Backup.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: backups.map(backup => ({
        id: backup._id,
        name: backup.name,
        type: backup.type,
        size: backup.size,
        createdAt: backup.createdAt,
        completedAt: backup.completedAt,
        status: backup.status,
        location: backup.location,
        description: backup.description,
        createdBy: backup.createdBy
      }))
    });
  } catch (error) {
    logger.error('Error fetching backups:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch backups'
    });
  }
};

// Get backup jobs
exports.getBackupJobs = async (req, res) => {
  try {
    const jobs = await BackupJob.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: jobs.map(job => ({
        id: job._id,
        name: job.name,
        type: job.type,
        schedule: job.schedule,
        enabled: job.enabled,
        lastRun: job.lastRun,
        nextRun: job.nextRun,
        status: job.status
      }))
    });
  } catch (error) {
    logger.error('Error fetching backup jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch backup jobs'
    });
  }
};

// Create backup
exports.createBackup = async (req, res) => {
  try {
    const { name, type, location, description } = req.body;
    const userId = req.user.id;

    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Create backup record
    const backup = new Backup({
      name,
      type,
      location,
      description,
      createdBy: userId,
      status: 'in-progress'
    });

    await backup.save();

    logger.info('Backup initiated', { 
      backupId: backup._id, 
      userId, 
      type 
    });

    // Perform backup asynchronously
    performBackup(backup._id, type, backupDir);

    res.status(201).json({
      success: true,
      message: 'Backup initiated successfully',
      data: {
        id: backup._id,
        name: backup.name,
        type: backup.type,
        status: backup.status,
        createdAt: backup.createdAt
      }
    });
  } catch (error) {
    logger.error('Error creating backup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create backup'
    });
  }
};

// Perform actual backup
async function performBackup(backupId, type, backupDir) {
  try {
    const backup = await Backup.findById(backupId);
    if (!backup) return;

    const timestamp = Date.now();
    const fileName = `backup-${type}-${timestamp}.json`;
    const filePath = path.join(backupDir, fileName);

    // Get database connection info
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/asset-management';
    const dbName = dbUri.split('/').pop().split('?')[0];

    // For JSON backup (easier for development)
    // In production, use mongodump for binary backups
    const collections = await mongoose.connection.db.listCollections().toArray();
    const backupData = {
      metadata: {
        type,
        timestamp: new Date().toISOString(),
        database: dbName,
        collections: collections.map(c => c.name)
      },
      data: {}
    };

    // Export each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      const documents = await mongoose.connection.db
        .collection(collectionName)
        .find({})
        .toArray();
      backupData.data[collectionName] = documents;
    }

    // Write backup file
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

    // Update backup record
    backup.status = 'completed';
    backup.filePath = filePath;
    backup.size = getFileSizeInMB(filePath);
    backup.completedAt = new Date();
    await backup.save();

    logger.info('Backup completed successfully', { 
      backupId, 
      filePath, 
      size: backup.size 
    });
  } catch (error) {
    logger.error('Error performing backup:', error);
    
    // Update backup status to failed
    await Backup.findByIdAndUpdate(backupId, {
      status: 'failed',
      error: error.message
    });
  }
}

// Restore backup
exports.restoreBackup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const backup = await Backup.findById(id);
    if (!backup) {
      return res.status(404).json({
        success: false,
        error: 'Backup not found'
      });
    }

    if (backup.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot restore from incomplete backup'
      });
    }

    if (!fs.existsSync(backup.filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Backup file not found'
      });
    }

    logger.warn('Restore initiated - THIS WILL OVERWRITE ALL DATA', { 
      backupId: id, 
      userId 
    });

    // Read backup file
    const backupData = JSON.parse(fs.readFileSync(backup.filePath, 'utf8'));

    // WARNING: This will delete all existing data
    // In production, you'd want additional confirmation and safety checks
    
    // Restore each collection
    for (const [collectionName, documents] of Object.entries(backupData.data)) {
      if (documents && documents.length > 0) {
        // Drop existing collection
        await mongoose.connection.db.collection(collectionName).drop().catch(() => {});
        
        // Insert backup data
        await mongoose.connection.db.collection(collectionName).insertMany(documents);
        
        logger.info(`Restored collection: ${collectionName}`, { 
          documentCount: documents.length 
        });
      }
    }

    logger.info('Restore completed successfully', { backupId: id });

    res.json({
      success: true,
      message: 'System restored successfully',
      data: { 
        backupId: id,
        restoredCollections: Object.keys(backupData.data).length
      }
    });
  } catch (error) {
    logger.error('Error restoring backup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restore backup: ' + error.message
    });
  }
};

// Download backup
exports.downloadBackup = async (req, res) => {
  try {
    const { id } = req.params;

    const backup = await Backup.findById(id);
    if (!backup) {
      return res.status(404).json({
        success: false,
        error: 'Backup not found'
      });
    }

    if (backup.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Backup is not ready for download'
      });
    }

    if (!backup.filePath || !fs.existsSync(backup.filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Backup file not found'
      });
    }

    logger.info('Backup download initiated', { 
      backupId: id, 
      userId: req.user.id 
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${backup.name}.json`);
    
    const fileStream = fs.createReadStream(backup.filePath);
    fileStream.pipe(res);
  } catch (error) {
    logger.error('Error downloading backup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download backup'
    });
  }
};

// Delete backup
exports.deleteBackup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const backup = await Backup.findById(id);
    if (!backup) {
      return res.status(404).json({
        success: false,
        error: 'Backup not found'
      });
    }

    // Delete backup file if it exists
    if (backup.filePath && fs.existsSync(backup.filePath)) {
      fs.unlinkSync(backup.filePath);
    }

    // Delete backup record
    await Backup.findByIdAndDelete(id);

    logger.info('Backup deleted', { backupId: id, userId });

    res.json({
      success: true,
      message: 'Backup deleted successfully',
      data: { backupId: id }
    });
  } catch (error) {
    logger.error('Error deleting backup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete backup'
    });
  }
};
