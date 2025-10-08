const Asset = require('../models/asset');

// GET all assets
exports.getAssets = async (req, res) => {
  try {
    const assets = await Asset.find().populate('assigned_user', 'name email');
    res.json(assets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET asset by id
exports.getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id).populate('assigned_user', 'name email');
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    res.json(asset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE asset
exports.createAsset = async (req, res) => {
  try {
    const asset = new Asset(req.body);
    const saved = await asset.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// UPDATE asset
exports.updateAsset = async (req, res) => {
  try {
    // Fetch the asset first
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    // Check if the user is the assigned user or an Admin
    if (
      asset.assigned_user &&
      asset.assigned_user.toString() !== req.user.id &&
      req.user.role !== 'Admin'
    ) {
      return res.status(403).json({
        message: 'Can only update your own assets or admin access required',
      });
    }

    // Proceed to update
    const updated = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE asset
exports.deleteAsset = async (req, res) => {
  try {
    const deleted = await Asset.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Asset not found' });
    res.json({ message: 'Asset deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
