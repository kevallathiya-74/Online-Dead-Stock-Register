require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL ERROR: JWT_SECRET is not configured in environment variables!');
  console.error('   JWT_SECRET is required for secure authentication.');
  console.error('   Please add JWT_SECRET to your .env file (minimum 32 characters).');
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('❌ FATAL ERROR: JWT_SECRET must be at least 32 characters long!');
  console.error('   Current length:', process.env.JWT_SECRET.length);
  console.error('   Required length: 32+');
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error('❌ FATAL ERROR: MONGODB_URI is not configured!');
  console.error('   Please add MONGODB_URI to your .env file.');
  process.exit(1);
}

console.log('✅ Environment variables validated successfully');

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
const { swaggerUi, swaggerSpec } = require('./config/swagger');
const dbUtils = require('./utils/dbUtils');

// Initialize express
const app = express();

// CORS configuration - Environment-based allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {

    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request from unauthorized origin', { origin });
      callback(new Error('Not allowed by CORS'));
    }
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

// ========================================
// HEALTH CHECK ENDPOINT (No Rate Limiting)
// ========================================
app.get('/health', async (req, res) => {
  try {
    const isHealthy = await dbUtils.isConnectionHealthy();
    const connectionInfo = dbUtils.getConnectionInfo();
    const poolStats = dbUtils.getPoolStats();
    
    if (isHealthy) {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: connectionInfo,
        pool: poolStats,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
        }
      });
    } else {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: connectionInfo,
        error: 'Database connection is not healthy'
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Connect to MongoDB
connectDB().then(() => {
  console.log('✅ Database connection callback reached');
  logger.info('Database connection established');
  
  // Initialize cron jobs for scheduled audits
  const { initializeCronJobs } = require('./services/cronService');
  initializeCronJobs();
}).catch(err => {
  console.error('❌ Database connection error in server.js:', err);
  logger.error('Database connection error:', err);
  process.exit(1);
});

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// File upload directory
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOAD_DIR || 'uploads')));

// Import route files
console.log('📦 Loading route modules...');
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
const inventoryRoutes = require('./routes/inventory');
const reportsRoutes = require('./routes/reports');
const backupsRoutes = require('./routes/backups');
const settingsRoutes = require('./routes/settings');
console.log('✅ All route modules loaded successfully');

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
v1Router.use('/settings', settingsRoutes);

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

console.log('✅ All middleware and routes registered');
console.log('✅ Error handler attached');

// Start server
console.log('🚀 Starting HTTP server...');
const PORT = process.env.PORT || 5000;
let server; // Declare server variable here

console.log('🔧 About to call app.listen() on port', PORT);
server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
});

console.log('🔧 app.listen() called, server object:', typeof server);

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

// Start the connection monitor after initial connection
startConnectionMonitor();

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