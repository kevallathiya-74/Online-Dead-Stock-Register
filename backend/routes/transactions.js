const express = require('express');
const router = express.Router();
const txnCtrl = require('../controllers/transactionController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/objectIdValidator');

// Protected: GET all transactions
router.get('/', authMiddleware, txnCtrl.getTransactions);

// Protected: POST create transaction
router.post('/', authMiddleware, txnCtrl.createTransaction);

// Protected: GET single transaction
router.get('/:id', authMiddleware, validateObjectId('id'), txnCtrl.getTransactionById);

module.exports = router;
