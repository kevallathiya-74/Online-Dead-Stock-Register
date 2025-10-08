const Approval = require('../models/approval');

exports.getApprovals = async (req, res) => {
  try {
    const approvals = await Approval.find().populate('requested_by approver asset_id', 'name email');
    res.json(approvals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getApprovalById = async (req, res) => {
  try {
    const ap = await Approval.findById(req.params.id);
    if (!ap) return res.status(404).json({ message: 'Approval not found' });
    res.json(ap);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createApproval = async (req, res) => {
  try {
    const request = new Approval(req.body);
    const saved = await request.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.approveRequest = async (req, res) => {
  try {
    const ap = await Approval.findByIdAndUpdate(req.params.id, { status: 'Accepted', approved_at: Date.now() }, { new: true });
    if (!ap) return res.status(404).json({ message: 'Approval not found' });
    res.json(ap);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const ap = await Approval.findByIdAndUpdate(req.params.id, { status: 'Rejected', approved_at: Date.now() }, { new: true });
    if (!ap) return res.status(404).json({ message: 'Approval not found' });
    res.json(ap);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
