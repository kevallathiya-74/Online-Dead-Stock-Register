const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

/**
 * Initialize Sentry error tracking and performance monitoring
 */
const initSentry = (app) => {
  // Only initialize Sentry if DSN is provided
  if (!process.env.SENTRY_DSN) {
    console.warn('⚠️ Sentry DSN not found - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
    // In production, consider a lower value (0.1 = 10%)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Set profilesSampleRate to profile 10% of transactions
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    integrations: [
      // Enable HTTP request tracing
      new Sentry.Integrations.Http({ tracing: true }),
      
      // Enable Express.js integration
      new Sentry.Integrations.Express({ app }),
      
      // Enable MongoDB integration
      new Sentry.Integrations.Mongo({
        useMongoose: true,
      }),
      
      // Enable profiling
      new ProfilingIntegration(),
    ],
    
    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      
      // Remove passwords from POST data
      if (event.request?.data) {
        if (typeof event.request.data === 'object') {
          delete event.request.data.password;
          delete event.request.data.token;
        }
      }
      
      return event;
    },
    
    // Ignore specific errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      // Random network errors
      'NetworkError',
      'Network request failed',
      // JWT errors (expected business logic)
      'JsonWebTokenError',
      'TokenExpiredError',
    ],
  });

  console.log('✅ Sentry initialized in', process.env.NODE_ENV, 'environment');
};

/**
 * Express middleware to capture request context
 */
const requestHandler = () => {
  return Sentry.Handlers.requestHandler({
    user: ['id', 'email', 'role'],
    ip: true,
    transaction: 'methodPath',
  });
};

/**
 * Express middleware to trace requests
 */
const tracingHandler = () => {
  return Sentry.Handlers.tracingHandler();
};

/**
 * Express error handler (must be used before other error handlers)
 */
const errorHandler = () => {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all errors except 4xx status codes
      if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
        return false;
      }
      return true;
    },
  });
};

/**
 * Manually capture exception with context
 */
const captureException = (error, context = {}) => {
  Sentry.captureException(error, {
    tags: context.tags,
    extra: context.extra,
    user: context.user,
    level: context.level || 'error',
  });
};

/**
 * Capture a message
 */
const captureMessage = (message, level = 'info', context = {}) => {
  Sentry.captureMessage(message, {
    level,
    tags: context.tags,
    extra: context.extra,
  });
};

/**
 * Set user context for error tracking
 */
const setUser = (user) => {
  Sentry.setUser({
    id: user._id?.toString(),
    email: user.email,
    role: user.role,
    department: user.department,
  });
};

/**
 * Add breadcrumb for debugging
 */
const addBreadcrumb = (category, message, data = {}, level = 'info') => {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
};

/**
 * Start a transaction for performance monitoring
 */
const startTransaction = (name, op) => {
  return Sentry.startTransaction({
    name,
    op,
  });
};

module.exports = {
  initSentry,
  requestHandler,
  tracingHandler,
  errorHandler,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  startTransaction,
};
