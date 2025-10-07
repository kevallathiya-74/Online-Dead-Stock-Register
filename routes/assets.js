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