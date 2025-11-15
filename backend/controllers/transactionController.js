const Transaction = require('../models/transaction');
const Asset = require('../models/asset');

exports.getTransactions = async (req, res) => {
  try {
    const txns = await Transaction.find().populate('asset_id requested_by from_user to_user approved_by', 'name email');
    res.json({
      success: true,
      data: txns
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTransactionById = async (req, res) => {
  try {
    const txn = await Transaction.findById(req.params.id);
    if (!txn) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({
      success: true,
      data: txn
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const txn = new Transaction(req.body);
    const saved = await txn.save();

    // Optional: update asset status/location/assigned_user based on transaction_type
    if (req.body.transaction_type === 'Asset Assignment' || req.body.transaction_type === 'Check-out') {
      await Asset.findByIdAndUpdate(req.body.asset_id, {
        assigned_user: req.body.to_user,
        status: 'Active',
        location: req.body.to_location
      });
    }

    res.status(201).json({
      success: true,
      data: saved,
      message: 'Transaction created successfully'
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
