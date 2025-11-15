require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Middleware to verify JWT token and attach user to req
const authMiddleware = async (req, res, next) => {
    try {
      // Safety check: Ensure JWT_SECRET is configured from .env
      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not configured in .env file!');
        return res.status(500).json({ message: 'Server configuration error. JWT_SECRET missing.' });
      }
  
      // Get token from Authorization header (format: Bearer <token>)
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
      }
  
      // Verify token using ONLY JWT_SECRET from .env (no fallback)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Fetch user from database (exclude password for security)
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid token. User not found.' });
      }
  
      // Attach user to request object
      req.user = user;
      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error('Auth middleware error:', error.message);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired. Please login again.' });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token.' });
      }
      res.status(401).json({ message: 'Authentication failed.' });
    }
  };
  
  // Role-based middleware (optional extension)
  const requireRole = (roles) => {
    return (req, res, next) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ 
          message: `Access denied. Requires one of these roles: ${roles.join(', ')}` 
        });
      }
      next();
    };
  };
  
  // Aliases for compatibility with different route files
  const authenticateToken = authMiddleware;
  const authenticate = authMiddleware;
  const authorize = requireRole;
  
  module.exports = { authMiddleware, requireRole, authenticateToken, authenticate, authorize }; 