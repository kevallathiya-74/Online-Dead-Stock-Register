const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Test controller functions
const testGetStats = (req, res) => {
  res.json({ message: 'Dashboard stats working' });
};

const testGetActivities = (req, res) => {
  res.json({ message: 'Dashboard activities working' });
};

// Apply auth middleware to all dashboard routes
router.use(authMiddleware.authMiddleware);

// Basic test routes
router.get('/stats', testGetStats);
router.get('/activities', testGetActivities);

module.exports = router;