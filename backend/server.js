require("dotenv").config();

// Validate environment variables on startup
const validateEnv = require("./config/validateEnv");
validateEnv();

const express = require("express");
const getSupabase = require("./config/db");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const path = require("path");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const requestLogger = require("./middleware/requestLogger");
const requestIdMiddleware = require("./middleware/requestId");
const captureClientIp = require("./middleware/ipCapture");
const { swaggerUi, swaggerSpec } = require("./config/swagger");
const dbUtils = require("./utils/dbUtils");

// Initialize express
const app = express();

// ========================================
// SERVER READINESS FLAG
// ========================================
// Prevents health check from returning 503 during startup
// Render kills instances that return 503 within the first health check window
let isServerReady = false;
const SERVER_READY_AFTER_MS = 45000; // Consider server ready after 45s
let serverStartTime = Date.now();

// Trust proxy - Required for deployment behind reverse proxy (Render, Heroku, etc.)
// This allows Express to trust the X-Forwarded-* headers from the proxy
app.set("trust proxy", 1);

// Request ID Middleware - Must be early for request tracing
app.use(requestIdMiddleware);

// ========================================
// CORS CONFIGURATION - Environment-Driven
// ========================================
// SECURITY: Only allow requests from explicitly configured origins
// Set ALLOWED_ORIGINS in .env as comma-separated list of allowed domains
// Example: ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
// If ALLOWED_ORIGINS is not set, defaults to localhost only (development mode)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : ["http://localhost:3000"]; // Default: localhost only

// Log CORS configuration on startup
console.log("🔒 CORS Configuration:");
console.log(
  "   Allowed Origins:",
  allowedOrigins.length > 0
    ? allowedOrigins.join(", ")
    : "NONE (localhost only)",
);
if (!process.env.ALLOWED_ORIGINS) {
  console.warn(
    "⚠️  WARNING: ALLOWED_ORIGINS not set in .env - defaulting to localhost only",
  );
  console.warn(
    "   Set ALLOWED_ORIGINS in production to allow your frontend domain",
  );
}

app.use(
  cors({
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
      if (process.env.NODE_ENV === "development") {
        const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
        if (localhostRegex.test(origin)) {
          return callback(null, true);
        }
      }

      // Block unauthorized origins
      console.error("❌ CORS: Blocked unauthorized origin:", origin);
      logger.warn("CORS blocked request from unauthorized origin", {
        origin,
        allowedOrigins,
        environment: process.env.NODE_ENV,
      });
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Cache-Control",
    ],
    exposedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 200,
    maxAge: 86400, // 24 hours - cache preflight requests
  }),
);

// Response Compression - Performance Optimization
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // Balanced compression level (0-9)
    threshold: 1024, // Only compress responses > 1KB
  }),
);

// Body parser middleware - Must come before security middleware
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// Security Middleware
app.use(
  helmet({
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
      preload: true,
    },
  }),
);

// HTTP Request Logging with Morgan and Winston
app.use(requestLogger);

// IP Address Capture Middleware - Ensures proper IP tracking for audit logs
app.use(captureClientIp);

// ========================================
// RATE LIMITING - CRITICAL SECURITY
// ========================================

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Increased to 5000 for development (reduce in production)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests from this IP, please try again later.",
  },
  handler: (req, res) => {
    logger.warn("Rate limit exceeded", {
      ip: req.ip,
      url: req.originalUrl,
    });
    res.status(429).json({
      success: false,
      error: "Too many requests, please try again later.",
    });
  },
});

// Strict limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Increased from 5 to 50 for development
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: "Too many authentication attempts. Please try again in 15 minutes.",
  },
  handler: (req, res) => {
    logger.warn("Auth rate limit exceeded - possible brute force attack", {
      ip: req.ip,
      url: req.originalUrl,
      userAgent: req.get("user-agent"),
    });
    res.status(429).json({
      success: false,
      error: "Too many authentication attempts. Please try again later.",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

// Progressive delay for failed login attempts
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100, // Increased from 10 to 100 for development
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.error(
      "Excessive failed login attempts - account may be under attack",
      {
        ip: req.ip,
        email: req.body.email,
      },
    );
    res.status(429).json({
      success: false,
      error: "Too many failed login attempts. Account temporarily locked.",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

// Strict limiter for password reset to prevent abuse
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Only 5 password reset requests per hour
  skipSuccessfulRequests: false, // Count all requests
  message: {
    success: false,
    error: "Too many password reset requests. Please try again in 1 hour.",
  },
  handler: (req, res) => {
    logger.warn("Password reset rate limit exceeded - possible abuse", {
      ip: req.ip,
      url: req.originalUrl,
      email: req.body.email,
    });
    res.status(429).json({
      success: false,
      error: "Too many password reset requests. Please try again later.",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

app.use("/api/", generalLimiter);

// Static folder
app.use(express.static(path.join(__dirname, "public")));

// File upload directory
app.use(
  "/uploads",
  express.static(path.join(__dirname, process.env.UPLOAD_DIR || "uploads")),
);

// Import route files
// Load routes one by one with error handling
let authRoutes, assetRoutes;
let userRoutes, txnRoutes, approvalRoutes, auditRoutes, docRoutes;
let vendorRoutes, maintRoutes, dashboardRoutes, assetRequestRoutes;
let assetTransferRoutes,
  purchaseManagementRoutes,
  notificationRoutes,
  uploadRoutes;
let exportImportRoutes,
  userManagementRoutes,
  vendorManagementRoutes,
  vendorPortalRoutes;
let qrScanRoutes, photoRoutes, bulkOperationsRoutes, customFiltersRoutes;
let scheduledAuditsRoutes,
  inventoryRoutes,
  reportsRoutes,
  backupsRoutes,
  settingsRoutes;
let assetIssueRoutes, automationRoutes, lifecycleRoutes, logRoutes;

try {
  // ✅ MIGRATED - Working with Supabase
  authRoutes = require("./routes/auth");
  assetRoutes = require("./routes/assets");

  userRoutes = require("./routes/users");
  txnRoutes = require("./routes/transactions");
  approvalRoutes = require("./routes/approvals");
  auditRoutes = require("./routes/auditLogs");
  docRoutes = require("./routes/documents");
  vendorRoutes = require("./routes/vendors");
  maintRoutes = require("./routes/maintenance");
  dashboardRoutes = require("./routes/dashboard");
  assetRequestRoutes = require("./routes/assetRequests");
  assetTransferRoutes = require("./routes/assetTransfers");
  purchaseManagementRoutes = require("./routes/purchaseManagement");
  notificationRoutes = require("./routes/notifications");
  uploadRoutes = require("./routes/upload");
  exportImportRoutes = require("./routes/exportImport");
  userManagementRoutes = require("./routes/userManagement");
  vendorManagementRoutes = require("./routes/vendorManagement");
  vendorPortalRoutes = require("./routes/vendorPortal");
  qrScanRoutes = require("./routes/qrScan");
  photoRoutes = require("./routes/photos");
  bulkOperationsRoutes = require("./routes/bulkOperations");
  customFiltersRoutes = require("./routes/customFilters");
  scheduledAuditsRoutes = require("./routes/scheduledAudits");
  inventoryRoutes = require("./routes/inventory");
  reportsRoutes = require("./routes/reports");
  backupsRoutes = require("./routes/backups");
  settingsRoutes = require("./routes/settings");
  assetIssueRoutes = require("./routes/assetIssues");
  automationRoutes = require("./routes/automation");
  lifecycleRoutes = require("./routes/lifecycleRoutes");
  logRoutes = require("./routes/logRoutes");
} catch (error) {
  console.error("❌ Error loading route modules:", error.message);
  console.error("Stack:", error.stack);
  process.exit(1);
}

// API Documentation with Swagger
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Asset Management API Docs",
  }),
);

// ========================================
// API VERSIONING - v1
// ========================================
const v1Router = express.Router();

// ========================================
// ACTIVE ROUTES (Supabase-migrated)
// ========================================

// Auth routes with strict rate limiting - ✅ WORKING
v1Router.use("/auth/login", loginLimiter);
v1Router.use("/auth/register", authLimiter);
v1Router.use("/auth/forgot-password", passwordResetLimiter);
v1Router.use("/auth/reset-password", passwordResetLimiter);
v1Router.use("/auth", authRoutes);

// Asset routes - ✅ WORKING
v1Router.use("/assets", assetRoutes);

v1Router.use("/users", userRoutes);
v1Router.use("/transactions", txnRoutes);
v1Router.use("/approvals", approvalRoutes);
v1Router.use("/audit-logs", auditRoutes);
v1Router.use("/documents", docRoutes);
v1Router.use("/vendors", vendorRoutes);
v1Router.use("/maintenance", maintRoutes);
v1Router.use("/dashboard", dashboardRoutes);
v1Router.use("/asset-requests", assetRequestRoutes);
v1Router.use("/asset-transfers", assetTransferRoutes);
v1Router.use("/purchase-management", purchaseManagementRoutes);
v1Router.use("/notifications", notificationRoutes);
v1Router.use("/upload", uploadRoutes);
v1Router.use("/export-import", exportImportRoutes);
v1Router.use("/user-management", userManagementRoutes);
v1Router.use("/vendor-management", vendorManagementRoutes);
v1Router.use("/vendor", vendorPortalRoutes);
v1Router.use("/qr", qrScanRoutes);
v1Router.use("/photos", photoRoutes);
v1Router.use("/bulk", bulkOperationsRoutes);
v1Router.use("/bulk-operations", bulkOperationsRoutes);
v1Router.use("/filters", customFiltersRoutes);
v1Router.use("/scheduled-audits", scheduledAuditsRoutes);
v1Router.use("/inventory", inventoryRoutes);
v1Router.use("/reports", reportsRoutes);
v1Router.use("/backups", backupsRoutes);
v1Router.use("/", assetIssueRoutes);
v1Router.use("/settings", settingsRoutes);
v1Router.use("/automation", automationRoutes);
v1Router.use("/lifecycle", lifecycleRoutes);
v1Router.use("/logs", logRoutes);
// Removed invalid v1Router.use('/dev');

// Mount v1 router
app.use("/api/v1", v1Router);

// Health check endpoint - Comprehensive monitoring
app.get("/health", async (req, res) => {
  const uptime = process.uptime();
  const startTime = Date.now();

  // ⚡ STARTUP GRACE PERIOD: Return 200 during first 45s so Render doesn't
  // kill the instance before it finishes initializing. Render's health check
  // fires immediately after deploy — a heavy DB query can timeout/fail and
  // trigger SIGTERM before the server is fully ready.
  if (!isServerReady || uptime < 45) {
    return res.status(200).json({
      status: "STARTING",
      message: "Server is initializing, please wait...",
      uptime: Math.floor(uptime),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
    });
  }

  const healthcheck = {
    uptime,
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
    checks: {
      database: { status: "unknown", responseTime: null },
      memory: { status: "unknown", details: null },
      redis: { status: "unknown", responseTime: null },
    },
  };

  try {
    // Check database connection with timing
    const dbStartTime = Date.now();
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("users")
        .select("count")
        .limit(1);

      if (error) {
        healthcheck.checks.database = {
          status: "error",
          responseTime: `${Date.now() - dbStartTime}ms`,
          error: error.message,
        };
        healthcheck.status = "DEGRADED";
      } else {
        healthcheck.checks.database = {
          status: "connected",
          responseTime: `${Date.now() - dbStartTime}ms`,
          type: "PostgreSQL (Supabase)",
        };
      }
    } catch (dbError) {
      healthcheck.checks.database = {
        status: "disconnected",
        responseTime: null,
        error: dbError.message,
      };
      healthcheck.status = "DEGRADED";
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const memUsagePercent = Math.round(
      (memUsage.heapUsed / memUsage.heapTotal) * 100,
    );
    const rssMemoryMB = Math.round(memUsage.rss / 1024 / 1024);
    healthcheck.checks.memory = {
      usage: `${memUsagePercent}%`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      rss: `${rssMemoryMB}MB`,
      status:
        memUsagePercent > 90
          ? "critical"
          : memUsagePercent > 75
            ? "warning"
            : "healthy",
    };

    // Check Redis connection with timing
    const redisStartTime = Date.now();
    try {
      const redis = require("./config/redis");
      const testKey = "health:check:test";
      await redis.set(testKey, "ok", 10);
      const value = await redis.get(testKey);

      healthcheck.checks.redis = {
        status: value === "ok" ? "connected" : "degraded",
        responseTime: `${Date.now() - redisStartTime}ms`,
        type: redis.client ? "redis" : "in-memory",
      };
    } catch (redisError) {
      healthcheck.checks.redis = {
        status: "unavailable",
        responseTime: null,
        error: redisError.message,
      };
      // Redis is optional, don't degrade overall status
    }

    // Calculate total response time
    healthcheck.responseTime = `${Date.now() - startTime}ms`;

    // Determine overall status — only return 503 if DB is completely disconnected
    // Never return 503 for degraded/warning states to avoid Render SIGTERM
    if (healthcheck.checks.database.status === "disconnected") {
      healthcheck.status = "UNHEALTHY";
      // Still return 200 so Render doesn't restart us — we'll recover
      return res.status(200).json(healthcheck);
    }

    if (healthcheck.checks.memory.status === "warning") {
      healthcheck.status = "DEGRADED";
    }

    res.status(200).json(healthcheck);
  } catch (error) {
    logger.error("Health check failed", { error: error.message });
    // Return 200 even on error to prevent Render from killing us
    res.status(200).json({
      status: "ERROR",
      message: error.message,
      uptime,
      timestamp: new Date().toISOString(),
    });
  }
});

// Simple liveness probe for Kubernetes/Docker
app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

// Lightweight health check for keep-alive service (minimal overhead)
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    service: "DSR-Backend",
  });
});

// API root endpoint - Backend only (no static files)
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Dead Stock Register API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/api/v1/health",
      apiDocs: "/api-docs",
      api: "/api/v1",
    },
    documentation: "Visit /api-docs for full API documentation",
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
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
    server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server running on port ${PORT}`);
      logger.info(
        `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
      );
      logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
    });

    // Handle server errors
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use`);
        logger.error(`Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error("❌ Server error:", error);
        logger.error("Server error:", error);
        process.exit(1);
      }
    });

    // Start connection health monitor after server is up
    startConnectionMonitor();
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Don't start server until we're ready
// Server will be started after DB connection

// ========================================
// SUPABASE CONNECTION HEALTH MONITOR
// ========================================
// Periodically check Supabase connection
let connectionCheckInterval = null;

const startConnectionMonitor = () => {
  // Check every 60 seconds (Supabase is more stable, check less frequently)
  connectionCheckInterval = setInterval(async () => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from("users").select("count").limit(1);

      if (error) {
        logger.warn("Supabase connection check failed:", error.message);
      }
    } catch (error) {
      logger.error("Connection monitor error:", error.message);
    }
  }, 60000); // Check every 60 seconds

  logger.info(
    "🔍 Supabase connection health monitor started (checks every 60s)",
  );
};

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} signal received: closing HTTP server`);

  // Stop keep-alive service
  try {
    const keepAliveService = require("./services/keepAliveService");
    keepAliveService.stop();
    logger.info("Keep-alive service stopped");
  } catch (err) {
    logger.warn("Keep-alive service stop skipped - may not be initialized");
  }

  // Stop connection monitor
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
    logger.info("Connection health monitor stopped");
  }

  if (server) {
    server.close(() => {
      logger.info("HTTP server closed");
      logger.info("Supabase client will be cleaned up automatically");
      process.exit(0);
    });
  } else {
    logger.info("Supabase client will be cleaned up automatically");
    process.exit(0);
  }

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error(
      "Could not close connections in time, forcefully shutting down",
    );
    process.exit(1);
  }, 10000);
};

// Handle graceful shutdown
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION! 💥 Shutting down...", {
    name: err.name,
    message: err.message,
    stack: err.stack,
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
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION! 💥 Shutting down...", {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });

  process.exit(1);
});

// ========================================
// INITIALIZE APPLICATION
// ========================================
// Initialize Supabase and start server
(async () => {
  try {
    // Initialize Supabase connection
    const { initSupabase, testConnection } = require("./config/db");
    initSupabase();

    const isConnected = await testConnection();

    if (isConnected) {
      logger.info("Database connection established with Supabase");

      // Initialize keep-alive service (prevents Render spin-down)
      try {
        const keepAliveService = require("./services/keepAliveService");
        keepAliveService.start();
      } catch (err) {
        logger.warn("Keep-alive service initialization skipped:", err.message);
      }
    } else {
      logger.warn("⚠️  Starting server with degraded database connection");
      console.warn("⚠️  Some database-dependent features may not be available");
    }

    // Start the HTTP server
    startServer();

    // Mark server as ready after startup grace period
    setTimeout(() => {
      isServerReady = true;
      logger.info("✅ Server marked as READY — health checks now fully active");
    }, SERVER_READY_AFTER_MS);
  } catch (err) {
    console.error("❌ Database connection error in server.js:", err);
    logger.error("Database connection error:", err);
    console.warn("⚠️  Starting server anyway...");
    startServer();

    // Even on DB error, mark ready after grace period so health check returns 200
    setTimeout(() => {
      isServerReady = true;
      logger.info("✅ Server marked as READY (degraded mode)");
    }, SERVER_READY_AFTER_MS);
  }
})();
