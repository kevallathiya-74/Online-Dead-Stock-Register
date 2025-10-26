require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');
const { swaggerUi, swaggerSpec } = require('./config/swagger');

// Initialize express
const app = express();

// CORS configuration - This must come before other middleware
app.use(cors({
  origin: 'http://localhost:3000', // Explicitly set the allowed origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Body parser middleware - Must come before security middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// HTTP Request Logging with Morgan and Winston
app.use(requestLogger);

// Custom sanitization middleware for security
app.use((req, res, next) => {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  // Sanitize query params
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  next();
});

// Helper function to sanitize objects
function sanitizeObject(obj) {
  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Remove $ and other MongoDB operators
      const cleanKey = key.replace(/^\$/, '');
      const value = obj[key];
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[cleanKey] = sanitizeObject(value);
      } else if (Array.isArray(value)) {
        sanitized[cleanKey] = value.map(item => 
          typeof item === 'object' ? sanitizeObject(item) : item
        );
      } else if (typeof value === 'string') {
        // Basic XSS protection
        sanitized[cleanKey] = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      } else {
        sanitized[cleanKey] = value;
      }
    }
  }
  return sanitized;
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Connect to MongoDB
connectDB().then(() => {
  logger.info('Database connection established');
  
  // Initialize cron jobs for scheduled audits
  const { initializeCronJobs } = require('./services/cronService');
  initializeCronJobs();
}).catch(err => {
  logger.error('Database connection error:', err);
  process.exit(1);
});

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// File upload directory
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOAD_DIR || 'uploads')));

// Import route files
const assetRoutes = require('./routes/assets');
const userRoutes = require('./routes/users');
const txnRoutes = require('./routes/transactions');
const approvalRoutes = require('./routes/approvals');
const auditRoutes = require('./routes/auditLogs');
const docRoutes = require('./routes/documents');
const vendorRoutes = require('./routes/vendors');
const maintRoutes = require('./routes/maintenance');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const assetRequestRoutes = require('./routes/assetRequests');
const assetTransferRoutes = require('./routes/assetTransfers');
const purchaseManagementRoutes = require('./routes/purchaseManagement');
const notificationRoutes = require('./routes/notifications');
const uploadRoutes = require('./routes/upload');
const exportImportRoutes = require('./routes/exportImport');
const userManagementRoutes = require('./routes/userManagement');
const vendorManagementRoutes = require('./routes/vendorManagement');
const vendorPortalRoutes = require('./routes/vendorPortal');
const qrScanRoutes = require('./routes/qrScan');
const photoRoutes = require('./routes/photos');
const bulkOperationsRoutes = require('./routes/bulkOperations');
const customFiltersRoutes = require('./routes/customFilters');
const scheduledAuditsRoutes = require('./routes/scheduledAudits');

// API Documentation with Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Asset Management API Docs'
}));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', txnRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/auditlogs', auditRoutes);
app.use('/api/documents', docRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/maintenance', maintRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/asset-requests', assetRequestRoutes);
app.use('/api/asset-transfers', assetTransferRoutes);
app.use('/api/purchase-management', purchaseManagementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/export-import', exportImportRoutes);
app.use('/api/user-management', userManagementRoutes);
app.use('/api/vendor-management', vendorManagementRoutes);
app.use('/api/vendor', vendorPortalRoutes);
app.use('/api/qr', qrScanRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/bulk', bulkOperationsRoutes);
app.use('/api/filters', customFiltersRoutes);
app.use('/api/scheduled-audits', scheduledAuditsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });
  
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });
  
  process.exit(1);
});