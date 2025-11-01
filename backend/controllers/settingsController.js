const logger = require('../utils/logger');

// System settings in-memory store (in production, use a database)
let systemSettings = [
  // Security Settings
  {
    id: 'sec-001',
    category: 'Security',
    name: 'Session Timeout',
    value: 30,
    description: 'Session timeout duration in minutes',
    type: 'number',
    required: true
  },
  {
    id: 'sec-002',
    category: 'Security',
    name: 'Password Expiry',
    value: 90,
    description: 'Password expiration period in days',
    type: 'number',
    required: true
  },
  {
    id: 'sec-003',
    category: 'Security',
    name: 'Two-Factor Authentication',
    value: true,
    description: 'Enable two-factor authentication for all users',
    type: 'boolean',
    required: false
  },
  {
    id: 'sec-004',
    category: 'Security',
    name: 'Maximum Login Attempts',
    value: 5,
    description: 'Maximum failed login attempts before account lockout',
    type: 'number',
    required: true
  },
  // Database Settings
  {
    id: 'db-001',
    category: 'Database',
    name: 'Connection Pool Size',
    value: 50,
    description: 'Maximum number of database connections',
    type: 'number',
    required: true
  },
  {
    id: 'db-002',
    category: 'Database',
    name: 'Auto Backup',
    value: true,
    description: 'Enable automatic daily database backups',
    type: 'boolean',
    required: false
  },
  // Email Settings
  {
    id: 'email-001',
    category: 'Email',
    name: 'SMTP Server',
    value: 'smtp.gmail.com',
    description: 'SMTP server address for sending emails',
    type: 'text',
    required: true,
    sensitive: true
  },
  {
    id: 'email-002',
    category: 'Email',
    name: 'SMTP Port',
    value: 587,
    description: 'SMTP server port number',
    type: 'number',
    required: true
  },
  {
    id: 'email-003',
    category: 'Email',
    name: 'Email Notifications',
    value: true,
    description: 'Enable email notifications for system events',
    type: 'boolean',
    required: false
  },
  // Application Settings
  {
    id: 'app-001',
    category: 'Application',
    name: 'Application Name',
    value: 'Dead Stock Register',
    description: 'Application display name',
    type: 'text',
    required: true
  },
  {
    id: 'app-002',
    category: 'Application',
    name: 'Maintenance Mode',
    value: false,
    description: 'Enable maintenance mode (blocks user access)',
    type: 'boolean',
    required: false
  },
  {
    id: 'app-003',
    category: 'Application',
    name: 'Default Language',
    value: 'English',
    description: 'Default application language',
    type: 'select',
    options: ['English', 'Hindi', 'Spanish', 'French'],
    required: true
  }
];

/**
 * @desc    Get all system settings
 * @route   GET /api/v1/settings
 * @access  Private (ADMIN only)
 */
const getAllSettings = async (req, res) => {
  try {
    logger.info('System settings retrieved', { userId: req.user.id });

    res.status(200).json({
      success: true,
      data: systemSettings
    });
  } catch (error) {
    logger.error('Error fetching system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system settings'
    });
  }
};

/**
 * @desc    Get single system setting
 * @route   GET /api/v1/settings/:id
 * @access  Private (ADMIN only)
 */
const getSetting = async (req, res) => {
  try {
    const { id } = req.params;
    
    const setting = systemSettings.find(s => s.id === id);
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    logger.info('System setting retrieved', { userId: req.user.id, settingId: id });

    res.status(200).json({
      success: true,
      data: setting
    });
  } catch (error) {
    logger.error('Error fetching system setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system setting'
    });
  }
};

/**
 * @desc    Update system setting
 * @route   PUT /api/v1/settings/:id
 * @access  Private (ADMIN only)
 */
const updateSetting = async (req, res) => {
  try {
    const { id } = req.params;
    const { value } = req.body;
    
    const settingIndex = systemSettings.findIndex(s => s.id === id);
    
    if (settingIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    // Update the setting value
    systemSettings[settingIndex].value = value;

    logger.info('System setting updated', {
      userId: req.user.id,
      settingId: id,
      newValue: value
    });

    res.status(200).json({
      success: true,
      message: 'Setting updated successfully',
      data: systemSettings[settingIndex]
    });
  } catch (error) {
    logger.error('Error updating system setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system setting'
    });
  }
};

/**
 * @desc    Test connection (email, database, etc.)
 * @route   POST /api/v1/settings/test-connection/:type
 * @access  Private (ADMIN only)
 */
const testConnection = async (req, res) => {
  try {
    const { type } = req.params;
    
    // Simulate connection test
    logger.info('Connection test initiated', { userId: req.user.id, type });

    // In production, implement actual connection tests
    const success = Math.random() > 0.2; // 80% success rate for demo

    res.status(200).json({
      success: success,
      message: success ? `${type} connection successful` : `${type} connection failed`,
      data: {
        type,
        tested_at: new Date(),
        result: success ? 'CONNECTED' : 'FAILED'
      }
    });
  } catch (error) {
    logger.error('Error testing connection:', error);
    res.status(500).json({
      success: false,
      message: 'Connection test failed'
    });
  }
};

/**
 * @desc    Create backup
 * @route   POST /api/v1/settings/backup
 * @access  Private (ADMIN only)
 */
const createBackup = async (req, res) => {
  try {
    const { type } = req.body; // 'full' or 'incremental'
    
    logger.info('Backup initiated', { userId: req.user.id, type });

    // In production, implement actual backup logic
    const backup = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: type === 'incremental' ? 'Incremental' : 'Full',
      size: `${(Math.random() * 2 + 0.5).toFixed(1)} GB`,
      status: 'Success',
      filename: `backup_${type}_${new Date().toISOString().split('T')[0]}.zip`,
      description: `${type === 'incremental' ? 'Incremental' : 'Full'} backup created by ${req.user.name}`
    };

    res.status(200).json({
      success: true,
      message: 'Backup created successfully',
      data: backup
    });
  } catch (error) {
    logger.error('Error creating backup:', error);
    res.status(500).json({
      success: false,
      message: 'Backup creation failed'
    });
  }
};

/**
 * @desc    Get backup history
 * @route   GET /api/v1/settings/backups
 * @access  Private (ADMIN only)
 */
const getBackupHistory = async (req, res) => {
  try {
    // Mock backup history (in production, fetch from database)
    const backupHistory = [
      {
        id: '1',
        date: '2024-01-15T02:00:00Z',
        type: 'Full',
        size: '2.4 GB',
        status: 'Success',
        filename: 'backup_full_20240115_020000.zip',
        description: 'Scheduled full backup'
      },
      {
        id: '2', 
        date: '2024-01-14T14:30:00Z',
        type: 'Incremental',
        size: '145 MB',
        status: 'Success',
        filename: 'backup_incr_20240114_143000.zip',
        description: 'Incremental backup after major updates'
      }
    ];

    logger.info('Backup history retrieved', { userId: req.user.id });

    res.status(200).json({
      success: true,
      data: backupHistory
    });
  } catch (error) {
    logger.error('Error fetching backup history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch backup history'
    });
  }
};

module.exports = {
  getAllSettings,
  getSetting,
  updateSetting,
  testConnection,
  createBackup, 
  getBackupHistory
};
