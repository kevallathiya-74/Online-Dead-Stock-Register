const Maintenance = require('../models/maintenance');

exports.getMaintenanceRecords = async (req, res) => {
  try {
    const records = await Maintenance.find().populate('asset_id vendor_id created_by');
    
    // Transform data to match frontend expectations
    const transformedRecords = records.map(record => ({
      id: record._id,
      asset_id: record.asset_id?._id || '',
      asset_name: record.asset_id?.name || record.asset_id?.unique_asset_id || 'Unknown Asset',
      type: record.maintenance_type,
      description: record.description || 'No description provided',
      scheduled_date: record.maintenance_date,
      completed_date: record.status === 'Completed' ? record.maintenance_date : null,
      status: record.status,
      priority: 'Medium', // Default priority since not in model
      assigned_technician: record.performed_by || 'Unassigned',
      estimated_cost: record.cost || 0,
      actual_cost: record.status === 'Completed' ? record.cost : null,
      estimated_duration: 2, // Default 2 hours
      actual_duration: record.status === 'Completed' ? 2 : null,
      next_maintenance_date: record.next_maintenance_date,
      notes: record.description,
      downtime_impact: record.cost > 10000 ? 'High' : record.cost > 5000 ? 'Medium' : 'Low'
    }));
    
    res.json(transformedRecords);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createMaintenanceRecord = async (req, res) => {
  try {
    const rec = new Maintenance(req.body);
    const saved = await rec.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getMaintenanceById = async (req, res) => {
  try {
    const rec = await Maintenance.findById(req.params.id);
    if (!rec) return res.status(404).json({ message: 'Record not found' });
    res.json(rec);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
