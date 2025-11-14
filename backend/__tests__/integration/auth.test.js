/**
 * Integration tests for Auth endpoints
 */

const request = require('supertest');
const app = require('../../server');
const User = require('../../models/user');
const mongoose = require('mongoose');

// Note: This requires a test database to be configured
// In production, use MongoDB Memory Server for isolated testing

describe('Auth API Integration Tests', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || process.env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    // Clean up
    if (testUser) {
      await User.findByIdAndDelete(testUser._id);
    }
    await mongoose.connection.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: `test${Date.now()}@test.com`,
        password: 'Test@1234',
        full_name: 'Test User',
        department: 'IT',
        role: 'EMPLOYEE',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user).not.toHaveProperty('password');

      testUser = response.body.user;
      authToken = response.body.token;
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Test@1234',
        full_name: 'Test User',
        department: 'IT',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        email: 'test@test.com',
        password: 'weak',
        full_name: 'Test User',
        department: 'IT',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Password');
    });

    it('should reject duplicate email registration', async () => {
      const userData = {
        email: testUser.email,
        password: 'Test@1234',
        full_name: 'Duplicate User',
        department: 'IT',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        email: testUser.email,
        password: 'Test@1234',
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(loginData.email);
    });

    it('should reject login with invalid credentials', async () => {
      const loginData = {
        email: testUser.email,
        password: 'WrongPassword',
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'Test@1234',
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.message).toContain('Invalid credentials');
    });
  });

  describe('Protected Routes', () => {
    it('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .expect(401);

      expect(response.body.message).toContain('No token provided');
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toContain('Invalid token');
    });

    it('should accept requests with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data.email).toBe(testUser.email);
    });
  });
});
