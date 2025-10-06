const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userController');

// GET /api/users
router.get('/', userCtrl.getUsers);

// GET /api/users/:id
router.get('/:id', userCtrl.getUserById);

// POST /api/users
router.post('/', userCtrl.createUser);

// PUT /api/users/:id
router.put('/:id', userCtrl.updateUser);

// DELETE /api/users/:id
router.delete('/:id', userCtrl.deleteUser);

module.exports = router;
