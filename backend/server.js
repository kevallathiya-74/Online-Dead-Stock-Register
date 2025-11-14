require('dotenv').config();

// Validate environment variables on startup
const validateEnv = require('./config/validateEnv');
validateEnv();

const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');
const requestIdMiddleware = require('./middleware/requestId');
const { swaggerUi, swaggerSpec } = require('./config/swagger');
const dbUtils = require('./utils/dbUtils');

// Initialize express
const app = express();

// Trust proxy - Required for deployment behind reverse proxy (Render, Heroku, etc.)
// This allows Express to trust the X-Forwarded-* headers from the proxy
app.set('trust proxy', 1);

// Request ID Middleware - Must be first for request tracing
app.use(requestIdMiddleware);

// ========================================
// CORS CONFIGURATION - Environment-Driven
// ========================================
// SECURITY: Only allow requests from explicitly configured origins
// Set ALLOWED_ORIGINS in .env as comma-separated list of allowed domains
// Example: ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
// If ALLOWED_ORIGINS is not set, defaults to localhost only (development mode)
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000']; // Default: localhost only

// Log CORS configuration on startup
console.log('🔒 CORS Configuration:');
console.log('   Allowed Origins:', allowedOrigins.length > 0 ? allowedOrigins.join(', ') : 'NONE (localhost only)');
if (!process.env.ALLOWED_ORIGINS) {
  console.warn('⚠️  WARNING: ALLOWED_ORIGINS not set in .env - defaulting to localhost only');
  console.warn('   Set ALLOWED_ORIGINS in production to allow your frontend domain');
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in explicitly allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // In development mode only: Allow localhost with any port
    if (process.env.NODE_ENV === 'development') {
      const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
      if (localhostRegex.test(origin)) {
        return callback(null, true);
      }
    }
    
    // Block unauthorized origins
    console.error('❌ CORS: Blocked unauthorized origin:', origin);
    logger.warn('CORS blocked request from unauthorized origin', { 
      origin, 
      allowedOrigins,
      environment: process.env.NODE_ENV 
    });
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours - cache preflight requests
}));

// Response Compression - Performance Optimization
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Balanced compression level (0-9)
  threshold: 1024 // Only compress responses > 1KB
}));

// Body parser middleware - Must come before security middleware
app.use(express.json({ limit: '100kb' })); 
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// NoSQL Injection Protection - CRITICAL SECURITY
app.use(mongoSanitize({
  replaceWith: '_', 
  onSanitize: ({ req, key }) => {
    logger.warn('Potential NoSQL injection attempt blocked', {
      ip: req.ip,
      key: key,
      url: req.originalUrl
    });
  }
}));

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// HTTP Request Logging with Morgan and Winston
app.use(requestLogger);

// ========================================
// RATE LIMITING - CRITICAL SECURITY
// ========================================

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased from 100 to 500 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for authenticated users (they have valid tokens)
  skip: (req) => {
    // If user is authenticated (has valid token), skip rate limiting
    return req.user !== undefined;
  },
  message: { 
    success: false,
    error: 'Too many requests from this IP, please try again later.' 
  },
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', { 
      ip: req.ip, 
      url: req.originalUrl 
    });
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.'
    });
  }
});

// Strict limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5,
  skipSuccessfulRequests: true, 
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again in 15 minutes.'
  },
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded - possible brute force attack', { 
      ip: req.ip,
      url: req.originalUrl,
      userAgent: req.get('user-agent')
    });
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Progressive delay for failed login attempts
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.error('Excessive failed login attempts - account may be under attack', {
      ip: req.ip,
      email: req.body.email
    });
    res.status(429).json({
      success: false,
      error: 'Too many failed login attempts. Account temporarily locked.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

app.use('/api/', generalLimiter);

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// File upload directory
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOAD_DIR || 'uploads')));

// Import route files
// Load routes one by one with error handling
let assetRoutes, userRoutes, txnRoutes, approvalRoutes, auditRoutes, docRoutes;
let vendorRoutes, maintRoutes, authRoutes, dashboardRoutes, assetRequestRoutes;
let assetTransferRoutes, purchaseManagementRoutes, notificationRoutes, uploadRoutes;
let exportImportRoutes, userManagementRoutes, vendorManagementRoutes, vendorPortalRoutes;
let qrScanRoutes, photoRoutes, bulkOperationsRoutes, customFiltersRoutes;
let scheduledAuditsRoutes, inventoryRoutes, reportsRoutes, backupsRoutes, settingsRoutes;
let assetIssueRoutes, automationRoutes;  // ✅ Added automation routes

try {
  assetRoutes = require('./routes/assets');
  userRoutes = require('./routes/users');
  txnRoutes = require('./routes/transactions');
  approvalRoutes = require('./routes/approvals');
  auditRoutes = require('./routes/auditLogs');
  docRoutes = require('./routes/documents');
  vendorRoutes = require('./routes/vendors');
  maintRoutes = require('./routes/maintenance');
  authRoutes = require('./routes/auth');
  dashboardRoutes = require('./routes/dashboard');
  assetRequestRoutes = require('./routes/assetRequests');
  assetTransferRoutes = require('./routes/assetTransfers');
  purchaseManagementRoutes = require('./routes/purchaseManagement');
  notificationRoutes = require('./routes/notifications');
  uploadRoutes = require('./routes/upload');
  exportImportRoutes = require('./routes/exportImport');
  userManagementRoutes = require('./routes/userManagement');
  vendorManagementRoutes = require('./routes/vendorManagement');
  vendorPortalRoutes = require('./routes/vendorPortal');
  qrScanRoutes = require('./routes/qrScan');
  photoRoutes = require('./routes/photos');
  bulkOperationsRoutes = require('./routes/bulkOperations');
  customFiltersRoutes = require('./routes/customFilters');
  scheduledAuditsRoutes = require('./routes/scheduledAudits');
  inventoryRoutes = require('./routes/inventory');
  reportsRoutes = require('./routes/reports');
  backupsRoutes = require('./routes/backups');
  settingsRoutes = require('./routes/settings');
  assetIssueRoutes = require('./routes/assetIssues');
  automationRoutes = require('./routes/automation');  // ✅ Added automation routes
} catch (error) {
  console.error('❌ Error loading route modules:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

// API Documentation with Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Asset Management API Docs'
}));

// ========================================
// API VERSIONING - v1
// ========================================
const v1Router = express.Router();

// Auth routes with strict rate limiting
v1Router.use('/auth/login', loginLimiter);
v1Router.use('/auth/register', authLimiter);
v1Router.use('/auth/forgot-password', authLimiter);
v1Router.use('/auth/reset-password', authLimiter);
v1Router.use('/auth', authRoutes);

// Protected routes
v1Router.use('/assets', assetRoutes);
v1Router.use('/users', userRoutes);
v1Router.use('/transactions', txnRoutes);
v1Router.use('/approvals', approvalRoutes);
v1Router.use('/audit-logs', auditRoutes);
v1Router.use('/documents', docRoutes);
v1Router.use('/vendors', vendorRoutes);
v1Router.use('/maintenance', maintRoutes);
v1Router.use('/dashboard', dashboardRoutes);
v1Router.use('/asset-requests', assetRequestRoutes);
v1Router.use('/asset-transfers', assetTransferRoutes);
v1Router.use('/purchase-management', purchaseManagementRoutes);
v1Router.use('/notifications', notificationRoutes);
v1Router.use('/upload', uploadRoutes);
v1Router.use('/export-import', exportImportRoutes);
v1Router.use('/user-management', userManagementRoutes);
v1Router.use('/vendor-management', vendorManagementRoutes);
v1Router.use('/vendor', vendorPortalRoutes);
v1Router.use('/qr', qrScanRoutes);
v1Router.use('/photos', photoRoutes);
v1Router.use('/bulk', bulkOperationsRoutes);
v1Router.use('/bulk-operations', bulkOperationsRoutes); 
v1Router.use('/filters', customFiltersRoutes);
v1Router.use('/scheduled-audits', scheduledAuditsRoutes);
v1Router.use('/inventory', inventoryRoutes);
v1Router.use('/reports', reportsRoutes);
v1Router.use('/backups', backupsRoutes);
v1Router.use('/', assetIssueRoutes); // Asset issues routes (includes /assets/:id/issues)
v1Router.use('/settings', settingsRoutes);
v1Router.use('/automation', automationRoutes);  // ✅ Added automation routes

// Mount v1 routes
app.use('/api/v1', v1Router);

// Backward compatibility - keep /api routes (will be deprecated)
app.use('/api', v1Router);

// Health check endpoint - Comprehensive monitoring
app.get('/health', async (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: 'unknown',
      memory: 'unknown'
    }
  };

  try {
    // Check database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      healthcheck.checks.database = 'connected';
    } else {
      healthcheck.checks.database = 'disconnected';
      healthcheck.status = 'DEGRADED';
    }
    
    // Check memory usage 
    const memUsage = process.memoryUsage();
    const memUsagePercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
    healthcheck.checks.memory = {
      usage: `${memUsagePercent}%`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      status: memUsagePercent > 90 ? 'critical' : memUsagePercent > 75 ? 'warning' : 'healthy'
    };
    
    if (healthcheck.checks.database === 'disconnected' || healthcheck.checks.memory.status === 'critical') {
      return res.status(503).json(healthcheck);
    }
    
    res.status(200).json(healthcheck);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    healthcheck.status = 'ERROR';
    healthcheck.checks.database = 'error';
    res.status(503).json(healthcheck);
  }
});

// Simple liveness probe for Kubernetes/Docker
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// API root endpoint - Backend only (no static files)
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Dead Stock Register API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/v1/health',
      apiDocs: '/api-docs',
      api: '/api/v1'
    },
    documentation: 'Visit /api-docs for full API documentation'
  });
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
let server; // Declare server variable here

// Function to start the server
const startServer = () => {
  try {
    // Listen on 0.0.0.0 to allow network access from other devices
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        logger.error(`Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        logger.error('Server error:', error);
        process.exit(1);
      }
    });
    
    // Start connection health monitor after server is up
    startConnectionMonitor();
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Don't start server until we're ready
// Server will be started after DB connection

// ========================================
// MONGODB CONNECTION HEALTH MONITOR
// ========================================
// Periodically check MongoDB connection and reconnect if needed
let connectionCheckInterval = null;

const startConnectionMonitor = () => {
  // Check every 30 seconds
  connectionCheckInterval = setInterval(async () => {
    try {
      const state = mongoose.connection.readyState;
      /*
       * 0 = disconnected
       * 1 = connected
       * 2 = connecting
       * 3 = disconnecting
       */
      
      if (state === 0) {
        logger.warn('MongoDB connection lost. Attempting to reconnect...');
        await connectDB();
      } else if (state === 1) {
        // Verify connection with ping
        try {
          await mongoose.connection.db.admin().ping();
          // Connection is healthy, no action needed
        } catch (pingError) {
          logger.error('MongoDB ping failed, connection may be stale');
          // Mongoose will attempt auto-reconnect
        }
      }
    } catch (error) {
      logger.error('Connection monitor error:', error.message);
    }
  }, 30000); // Check every 30 seconds
  
  logger.info('🔍 MongoDB connection health monitor started (checks every 30s)');
};

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} signal received: closing HTTP server and database connection`);
  
  // Stop connection monitor
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
    logger.info('Connection health monitor stopped');
  }
  
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
        process.exit(0);
      } catch (err) {
        logger.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });
  } else {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
      process.exit(0);
    } catch (err) {
      logger.error('Error closing MongoDB connection:', err);
      process.exit(1);
    }
  }

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });
  
  // Close server & exit process
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
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

// ========================================
// INITIALIZE APPLICATION
// ========================================
// Connect to MongoDB and start server
connectDB().then(() => {
  logger.info('Database connection established');
  
  // Initialize cron jobs for scheduled audits
  const { initializeCronJobs } = require('./services/cronService');
  initializeCronJobs();
  
  // Initialize disposal automation scheduler ✅ NEW
  const scheduledJobs = require('./services/scheduledJobs');
  scheduledJobs.initialize().catch(err => {
    console.error('❌ Failed to initialize disposal automation:', err);
  });
  
  // Start the HTTP server after DB connection and cron initialization
  startServer();
}).catch(err => {
  console.error('❌ Database connection error in server.js:', err);
  logger.error('Database connection error:', err);
  process.exit(1);
});