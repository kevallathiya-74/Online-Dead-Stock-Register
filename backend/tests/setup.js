const getSupabase = require("../config/db");

// Global setup for tests
beforeAll(async () => {
  // Any necessary global setup
  process.env.NODE_ENV = "test";
});

afterAll(async () => {
  // Close connections or cleanup
});
