/**
 * Jest Test Setup
 * Runs before all tests to configure test environment
 */

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_minimum_32_characters_long_for_testing';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test_db';
process.env.SKIP_DB_CONNECTION = 'true';

// Mock mongoose before any other imports
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  const originalModel = actual.model.bind(actual);
  
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue({}),
    startSession: jest.fn().mockResolvedValue({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    }),
    connection: {
      ...actual.connection,
      readyState: 1,
    },
    model: jest.fn((name, schema) => {
      // Call the original if schema is provided (model definition)
      if (schema) {
        return originalModel(name, schema);
      }
      // Return the already registered model (model retrieval)
      return originalModel(name);
    }),
  };
});

// Suppress console output during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock mongoose connection to prevent actual database connections
jest.mock('../config/db', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(true),
}));

// Mock Redis to prevent connection attempts
jest.mock('../config/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  delPattern: jest.fn(),
  exists: jest.fn(),
}));

// Global test utilities
global.mockUser = {
  _id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  role: 'Admin',
  department: 'IT',
};

global.mockRequest = (overrides = {}) => ({
  user: global.mockUser,
  body: {},
  params: {},
  query: {},
  headers: {},
  ...overrides,
});

global.mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

global.mockNext = jest.fn();
