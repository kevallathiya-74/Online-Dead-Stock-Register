const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Set up mock process variables
process.env.JWT_SECRET =
  "f16d77356faa2d3813bad1cf1686aa3d8d8888c10c9f0e0675c45472a104e2e3";
process.env.NODE_ENV = "test";

// Mock the database connection client
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();

const mockSupabase = {
  from: mockFrom,
};

mockFrom.mockReturnValue({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
});

mockSelect.mockReturnValue({
  eq: mockEq,
});

mockEq.mockReturnValue({
  single: mockSingle,
});

mockInsert.mockReturnValue({
  select: jest.fn().mockReturnValue({
    single: mockSingle,
  }),
});

mockUpdate.mockReturnValue({
  eq: mockEq,
});

jest.mock("../config/db", () => () => mockSupabase);

// Mock the email service
jest.mock("../utils/emailService", () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));

// Mock logger to avoid cluttering test output
jest.mock("../utils/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

const authRouter = require("../routes/auth");

const app = express();
app.use(express.json());
app.use("/api/v1/auth", authRouter);

describe("Auth Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/v1/auth/register", () => {
    const validUser = {
      full_name: "Test User",
      email: "test@example.com",
      password: "Password123!",
      department: "IT",
      role: "AUDITOR",
    };

    it("should register a user successfully and return a token", async () => {
      // 1. Mock user lookup (user does not exist)
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      }); // single() error for no rows

      // 2. Mock user creation insert output
      const mockSavedUser = {
        id: "user-id-123",
        name: "Test User",
        email: "test@example.com",
        password: "hashedpassword",
        department: "IT",
        role: "AUDITOR",
        is_active: true,
      };
      mockSingle.mockResolvedValueOnce({ data: mockSavedUser, error: null });

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(validUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toHaveProperty("email", "test@example.com");
      expect(response.body.user).toHaveProperty("role", "AUDITOR");
    });

    it("should fail if email is missing", async () => {
      const response = await request(app).post("/api/v1/auth/register").send({
        full_name: "Test User",
        password: "Password123!",
        department: "IT",
      });

      expect(response.status).toBe(400);
      expect(response.body.errors[0].message).toContain("email");
    });

    it("should fail on a weak password", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          ...validUser,
          password: "123",
        });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    const loginCredentials = {
      email: "test@example.com",
      password: "Password123!",
    };

    it("should authenticate a user with valid credentials", async () => {
      const hashedPassword = await bcrypt.hash("Password123!", 10);
      const mockUser = {
        id: "user-id-123",
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword,
        role: "ADMIN",
        department: "IT",
      };

      // 1. Mock user query return
      mockSingle.mockResolvedValueOnce({ data: mockUser, error: null });
      // 2. Mock last login update return
      mockSingle.mockResolvedValueOnce({ data: { ...mockUser }, error: null });

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send(loginCredentials);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toHaveProperty("role", "ADMIN");
    });

    it("should reject authentication with invalid password", async () => {
      const hashedPassword = await bcrypt.hash("Password123!", 10);
      const mockUser = {
        id: "user-id-123",
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword,
        role: "ADMIN",
      };

      // Mock user query return
      mockSingle.mockResolvedValueOnce({ data: mockUser, error: null });

      const response = await request(app).post("/api/v1/auth/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid credentials");
    });
  });
});
