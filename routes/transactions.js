const express = require('express');
const router = express.Router();
const txnCtrl = require('../controllers/transactionController');

// GET /api/transactions
router.get('/', txnCtrl.getTransactions);

// POST /api/transactions
router.post('/', txnCtrl.createTransaction);

// GET /api/transactions/:id
router.get('/:id', txnCtrl.getTransactionById);

module.exports = router;
