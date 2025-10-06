const Maintenance = require('../models/maintenance');

exports.getMaintenanceRecords = async (req, res) => {
  try {
    const records = await Maintenance.find().populate('asset_id vendor_id created_by');
    res.json(records);
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
