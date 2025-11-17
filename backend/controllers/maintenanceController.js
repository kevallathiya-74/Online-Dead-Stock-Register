const Maintenance = require('../models/maintenance');

exports.getMaintenanceRecords = async (req, res) => {
  try {
    const records = await Maintenance.find().populate('asset_id vendor_id created_by');
    
    // Transform data to match frontend expectations
    const transformedRecords = records.map(record => {
      const asset = record.asset_id;
      
      return {
        id: record._id,
        asset_id: asset?._id || '',
        asset_name: asset?.name || asset?.unique_asset_id || 'Unknown Asset',
        type: record.maintenance_type,
        description: record.description || 'No description provided',
        scheduled_date: record.maintenance_date,
        completed_date: record.status === 'Completed' && record.updatedAt ? record.updatedAt : null,
        status: record.status || 'Scheduled',
        priority: record.priority || 'Medium',
        assigned_technician: record.performed_by || 'Unassigned',
        estimated_cost: record.cost || 0,
        actual_cost: record.status === 'Completed' ? record.cost : null,
        estimated_duration: record.estimated_duration || 2,
        actual_duration: record.status === 'Completed' ? record.estimated_duration : null,
        next_maintenance_date: record.next_maintenance_date,
        notes: record.description,
        downtime_impact: record.downtime_impact || 'Low'
      };
    });
    
    res.json({ data: transformedRecords });
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

exports.updateMaintenanceRecord = async (req, res) => {
  try {
    const rec = await Maintenance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!rec) return res.status(404).json({ message: 'Record not found' });
    res.json({ message: 'Maintenance record updated successfully', data: rec });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteMaintenanceRecord = async (req, res) => {
  try {
    const rec = await Maintenance.findByIdAndDelete(req.params.id);
    if (!rec) return res.status(404).json({ message: 'Record not found' });
    res.json({ message: 'Maintenance record deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get technicians (users with maintenance capabilities and their workload)
exports.getTechnicians = async (req, res) => {
  try {
    // Get users who have maintenance-related roles or activities
    const User = require('../models/user');
    const users = await User.find({ 
      $or: [
        { role: 'ADMIN' },
        { role: 'INVENTORY_MANAGER' },
        { 'permissions': { $in: ['schedule_maintenance', 'approve_maintenance'] } }
      ]
    }).select('full_name email role');

    // Get current workload for each technician
    const techniciansWithWorkload = await Promise.all(
      users.map(async (user) => {
        const currentWorkload = await Maintenance.countDocuments({
          performed_by: user.full_name,
          status: { $in: ['Scheduled', 'In Progress'] }
        });
        
        const totalCompleted = await Maintenance.countDocuments({
          performed_by: user.full_name,
          status: 'Completed'
        });

        return {
          id: user._id.toString(),
          name: user.full_name || user.email.split('@')[0], // Use full_name or extract from email
          email: user.email,
          specialization: ['General Maintenance', 'Equipment Repair'], // Default specializations
          current_workload: currentWorkload,
          rating: 4.5, // Mock rating - can be calculated from completed tasks
          total_completed: totalCompleted
        };
      })
    );

    res.json({ data: techniciansWithWorkload });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
