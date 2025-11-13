const Approval = require('../models/approval');

exports.getApprovals = async (req, res) => {
  try {
    const approvals = await Approval.find().populate('requested_by approver asset_id', 'name email employee_id unique_asset_id');
    
    // Transform data to match frontend expectations
    const transformedApprovals = approvals.map(approval => ({
      _id: approval._id,
      request_type: approval.request_type.toUpperCase().replace(' ', '_'),
      requested_by: approval.requested_by ? {
        _id: approval.requested_by._id,
        name: approval.requested_by.name || 'Unknown',
        email: approval.requested_by.email || '',
        employee_id: approval.requested_by.employee_id || ''
      } : null,
      asset_id: approval.asset_id ? {
        _id: approval.asset_id._id,
        name: approval.asset_id.name || 'Unknown Asset',
        unique_asset_id: approval.asset_id.unique_asset_id || ''
      } : null,
      status: approval.status.toUpperCase() === 'ACCEPTED' ? 'APPROVED' : approval.status.toUpperCase(),
      priority: approval.request_data?.priority || 'MEDIUM',
      request_details: {
        reason: approval.request_data?.reason || approval.comments || 'No reason provided',
        from_location: approval.request_data?.from_location,
        to_location: approval.request_data?.to_location,
        estimated_cost: approval.request_data?.estimated_cost,
        maintenance_type: approval.request_data?.maintenance_type
      },
      created_at: approval.created_at,
      approved_at: approval.approved_at,
      comments: approval.comments
    }));
    
    res.json(transformedApprovals);
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
    const { comments } = req.body;
    const ap = await Approval.findByIdAndUpdate(
      req.params.id, 
      { 
        status: 'Accepted', 
        approved_at: Date.now(),
        comments: comments || 'Approved by manager'
      }, 
      { new: true }
    ).populate('requested_by approver asset_id', 'name email employee_id unique_asset_id');
    
    if (!ap) return res.status(404).json({ message: 'Approval not found' });
    
    // Transform response to match frontend expectations
    const transformed = {
      _id: ap._id,
      request_type: ap.request_type.toUpperCase().replace(' ', '_'),
      requested_by: ap.requested_by ? {
        _id: ap.requested_by._id,
        name: ap.requested_by.name || 'Unknown',
        email: ap.requested_by.email || '',
        employee_id: ap.requested_by.employee_id || ''
      } : null,
      asset_id: ap.asset_id ? {
        _id: ap.asset_id._id,
        name: ap.asset_id.name || 'Unknown Asset',
        unique_asset_id: ap.asset_id.unique_asset_id || ''
      } : null,
      status: 'APPROVED',
      priority: ap.request_data?.priority || 'MEDIUM',
      request_details: {
        reason: ap.request_data?.reason || ap.comments || 'No reason provided',
        from_location: ap.request_data?.from_location,
        to_location: ap.request_data?.to_location,
        estimated_cost: ap.request_data?.estimated_cost,
        maintenance_type: ap.request_data?.maintenance_type
      },
      created_at: ap.created_at,
      approved_at: ap.approved_at,
      comments: ap.comments
    };
    
    res.json(transformed);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const { comments } = req.body;
    const ap = await Approval.findByIdAndUpdate(
      req.params.id, 
      { 
        status: 'Rejected', 
        approved_at: Date.now(),
        comments: comments || 'Rejected by manager'
      }, 
      { new: true }
    ).populate('requested_by approver asset_id', 'name email employee_id unique_asset_id');
    
    if (!ap) return res.status(404).json({ message: 'Approval not found' });
    
    // Transform response to match frontend expectations
    const transformed = {
      _id: ap._id,
      request_type: ap.request_type.toUpperCase().replace(' ', '_'),
      requested_by: ap.requested_by ? {
        _id: ap.requested_by._id,
        name: ap.requested_by.name || 'Unknown',
        email: ap.requested_by.email || '',
        employee_id: ap.requested_by.employee_id || ''
      } : null,
      asset_id: ap.asset_id ? {
        _id: ap.asset_id._id,
        name: ap.asset_id.name || 'Unknown Asset',
        unique_asset_id: ap.asset_id.unique_asset_id || ''
      } : null,
      status: 'REJECTED',
      priority: ap.request_data?.priority || 'MEDIUM',
      request_details: {
        reason: ap.request_data?.reason || ap.comments || 'No reason provided',
        from_location: ap.request_data?.from_location,
        to_location: ap.request_data?.to_location,
        estimated_cost: ap.request_data?.estimated_cost,
        maintenance_type: ap.request_data?.maintenance_type
      },
      created_at: ap.created_at,
      approved_at: ap.approved_at,
      comments: ap.comments
    };
    
    res.json(transformed);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
