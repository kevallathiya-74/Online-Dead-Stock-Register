const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { seedDatabase } = require('../controllers/seedController');

// Apply auth middleware
router.use(authMiddleware);

// Seed database (ADMIN only, development only)
router.post('/seed-database', requireRole(['ADMIN']), seedDatabase);

module.exports = router;
