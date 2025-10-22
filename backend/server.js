require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');

// Initialize express
const app = express();

// CORS configuration - This must come before other middleware
app.use(cors({
  origin: 'http://localhost:3000', // Explicitly set the allowed origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
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

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

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
  console.log('Database connection established');
}).catch(err => {
  console.error('Database connection error:', err);
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

// Mount routes
app.use('/api/assets', assetRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', txnRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/auditlogs', auditRoutes);
app.use('/api/documents', docRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/maintenance', maintRoutes);
app.use('/api/auth', authRoutes);

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
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error('Error:', err.name, err.message);
  console.error('Stack:', err.stack);
  
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error('Error:', err.name, err.message);
  console.error('Stack:', err.stack);
  
  process.exit(1);
});