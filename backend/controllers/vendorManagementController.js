const Vendor = require('../models/vendor');
const Asset = require('../models/asset');
const Transaction = require('../models/transaction');
const AuditLog = require('../models/auditLog');
const mongoose = require('mongoose');

// Get all vendors with pagination and filtering
exports.getAllVendors = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      vendor_type, 
      category, 
      is_active = true,
      sort_by = 'name',
      sort_order = 'asc'
    } = req.query;
    
    const skip = (page - 1) * limit;

    // Build filter object
    let filter = {};
    if (is_active !== undefined) filter.is_active = is_active === 'true';
    if (vendor_type) filter.vendor_type = vendor_type;
    if (category) filter.categories = { $in: [category] };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { vendor_code: { $regex: search, $options: 'i' } },
        { contact_person: { $regex: search, $options: 'i' } },
        { contact_email: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortOrder = sort_order === 'desc' ? -1 : 1;
    const sortObj = { [sort_by]: sortOrder };

    const vendors = await Vendor.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Vendor.countDocuments(filter);

    res.json({
      vendors,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_vendors: total,
        has_next: page * limit < total,
        has_prev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ message: 'Failed to fetch vendors' });
  }
};

// Get vendor by ID with performance metrics
exports.getVendorById = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Get vendor performance metrics
    const performance = await getVendorPerformance(id);

    res.json({
      vendor,
      performance
    });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({ message: 'Failed to fetch vendor' });
  }
};

// Create new vendor
exports.createVendor = async (req, res) => {
  try {
    const vendorData = req.body;

    // Check if vendor with same email already exists
    const existingVendor = await Vendor.findOne({ 
      contact_email: vendorData.contact_email 
    });

    if (existingVendor) {
      return res.status(400).json({ 
        message: 'Vendor with this email already exists' 
      });
    }

    const vendor = new Vendor(vendorData);
    await vendor.save();

    // Create audit log
    const auditLog = new AuditLog({
      action: 'vendor_created',
      performed_by: req.user.id,
      details: {
        vendor_id: vendor._id,
        vendor_name: vendor.vendor_name || vendor.name,
        vendor_code: vendor.vendor_code
      },
      timestamp: new Date()
    });
    await auditLog.save();

    res.status(201).json({
      message: 'Vendor created successfully',
      vendor
    });
  } catch (error) {
    console.error('Error creating vendor:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Vendor code already exists' });
    } else {
      res.status(500).json({ message: 'Failed to create vendor' });
    }
  }
};

// Update vendor
exports.updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if vendor exists
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Check for duplicate email (excluding current vendor)
    if (updateData.contact_email) {
      const existingVendor = await Vendor.findOne({
        _id: { $ne: id },
        contact_email: updateData.contact_email
      });

      if (existingVendor) {
        return res.status(400).json({ 
          message: 'Another vendor with this email already exists' 
        });
      }
    }

    const updatedVendor = await Vendor.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Create audit log
    const auditLog = new AuditLog({
      action: 'vendor_updated',
      performed_by: req.user.id,
      details: {
        vendor_id: id,
        vendor_name: updatedVendor.vendor_name || updatedVendor.name,
        updated_fields: Object.keys(updateData)
      },
      timestamp: new Date()
    });
    await auditLog.save();

    res.json({
      message: 'Vendor updated successfully',
      vendor: updatedVendor
    });
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({ message: 'Failed to update vendor' });
  }
};

// Delete vendor (soft delete)
exports.deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Check if vendor has active assets
    const activeAssets = await Asset.countDocuments({ 
      vendor: id,
      status: { $in: ['Active', 'In Use'] }
    });

    if (activeAssets > 0) {
      return res.status(400).json({ 
        message: `Cannot delete vendor. ${activeAssets} active assets are linked to this vendor.` 
      });
    }

    // Soft delete by setting is_active to false
    vendor.is_active = false;
    vendor.deactivated_at = new Date();
    await vendor.save();

    // Create audit log
    const auditLog = new AuditLog({
      action: 'vendor_deleted',
      performed_by: req.user.id,
      details: {
        vendor_id: id,
        vendor_name: vendor.vendor_name || vendor.name,
        vendor_code: vendor.vendor_code
      },
      timestamp: new Date()
    });
    await auditLog.save();

    res.json({ message: 'Vendor deactivated successfully' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ message: 'Failed to delete vendor' });
  }
};

// Get vendor performance metrics
exports.getVendorPerformance = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const performance = await getVendorPerformance(id);

    res.json({
      vendor_id: id,
      vendor_name: vendor.vendor_name || vendor.name,
      performance
    });
  } catch (error) {
    console.error('Error fetching vendor performance:', error);
    res.status(500).json({ message: 'Failed to fetch vendor performance' });
  }
};

// Get vendor statistics for dashboard
exports.getVendorStats = async (req, res) => {
  try {
    const totalVendors = await Vendor.countDocuments({ is_active: true });
    const inactiveVendors = await Vendor.countDocuments({ is_active: false });
    
    // Vendor types distribution
    const typeDistribution = await Vendor.aggregate([
      { $match: { is_active: true } },
      { $group: { _id: '$vendor_type', count: { $sum: 1 } } }
    ]);

    // Performance rating distribution
    const performanceDistribution = await Vendor.aggregate([
      { $match: { is_active: true } },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $gte: ['$performance_rating', 4.5] }, then: 'Excellent' },
                { case: { $gte: ['$performance_rating', 3.5] }, then: 'Good' },
                { case: { $gte: ['$performance_rating', 2.5] }, then: 'Average' },
                { case: { $lt: ['$performance_rating', 2.5] }, then: 'Poor' }
              ],
              default: 'Unrated'
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Top performing vendors
    const topVendors = await Vendor.find({ is_active: true })
      .sort({ performance_rating: -1 })
      .limit(5)
      .select('name vendor_code performance_rating vendor_type');

    // Recent vendor activities
    const recentActivities = await AuditLog.find({
      action: { $in: ['vendor_created', 'vendor_updated', 'vendor_deleted'] }
    })
    .populate('performed_by', 'full_name')
    .sort({ timestamp: -1 })
    .limit(10);

    res.json({
      total_active_vendors: totalVendors,
      inactive_vendors: inactiveVendors,
      type_distribution: typeDistribution,
      performance_distribution: performanceDistribution,
      top_vendors: topVendors,
      recent_activities: recentActivities
    });
  } catch (error) {
    console.error('Error fetching vendor stats:', error);
    res.status(500).json({ message: 'Failed to fetch vendor statistics' });
  }
};

// Get vendors by category
exports.getVendorsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const vendors = await Vendor.find({
      is_active: true,
      categories: { $in: [category] }
    })
    .select('name vendor_code contact_person contact_email performance_rating')
    .sort({ performance_rating: -1 });

    res.json({
      category,
      vendors,
      total_count: vendors.length
    });
  } catch (error) {
    console.error('Error fetching vendors by category:', error);
    res.status(500).json({ message: 'Failed to fetch vendors by category' });
  }
};

// Update vendor performance rating
exports.updateVendorRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, notes } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const oldRating = vendor.performance_rating;
    vendor.performance_rating = rating;
    if (notes) vendor.notes = notes;
    await vendor.save();

    // Create audit log
    const auditLog = new AuditLog({
      action: 'vendor_rating_updated',
      performed_by: req.user.id,
      details: {
        vendor_id: id,
        vendor_name: vendor.name,
        old_rating: oldRating,
        new_rating: rating,
        notes
      },
      timestamp: new Date()
    });
    await auditLog.save();

    res.json({
      message: 'Vendor rating updated successfully',
      vendor: {
        id: vendor._id,
        name: vendor.name,
        performance_rating: vendor.performance_rating
      }
    });
  } catch (error) {
    console.error('Error updating vendor rating:', error);
    res.status(500).json({ message: 'Failed to update vendor rating' });
  }
};

// Helper function to calculate vendor performance
async function getVendorPerformance(vendorId) {
  try {
    // Get assets from this vendor
    const assets = await Asset.find({ vendor: vendorId });
    const assetIds = assets.map(asset => asset._id);

    // Calculate performance metrics
    const totalAssets = assets.length;
    const activeAssets = assets.filter(asset => asset.status === 'Active').length;
    
    // Get average asset condition
    const conditionCounts = assets.reduce((acc, asset) => {
      acc[asset.condition] = (acc[asset.condition] || 0) + 1;
      return acc;
    }, {});

    // Get maintenance frequency
    const maintenanceCount = await mongoose.model('Maintenance').countDocuments({
      asset: { $in: assetIds }
    });

    // Get transaction volume (purchases)
    const transactions = await Transaction.find({
      asset: { $in: assetIds },
      transaction_type: 'Purchase'
    });

    const totalValue = transactions.reduce((sum, txn) => sum + (txn.amount || 0), 0);

    // Calculate delivery performance (based on transaction dates vs expected dates)
    const onTimeDeliveries = transactions.filter(txn => {
      // Simplified logic - in real implementation, compare with expected delivery dates
      return txn.createdAt <= txn.expected_delivery_date;
    }).length;

    const deliveryPerformance = transactions.length > 0 ? 
      (onTimeDeliveries / transactions.length) * 100 : 0;

    return {
      total_assets: totalAssets,
      active_assets: activeAssets,
      asset_utilization: totalAssets > 0 ? (activeAssets / totalAssets) * 100 : 0,
      condition_breakdown: conditionCounts,
      maintenance_frequency: totalAssets > 0 ? maintenanceCount / totalAssets : 0,
      total_purchase_value: totalValue,
      total_transactions: transactions.length,
      delivery_performance: deliveryPerformance,
      last_transaction_date: transactions.length > 0 ? 
        Math.max(...transactions.map(t => new Date(t.createdAt))) : null
    };
  } catch (error) {
    console.error('Error calculating vendor performance:', error);
    return {
      total_assets: 0,
      active_assets: 0,
      asset_utilization: 0,
      condition_breakdown: {},
      maintenance_frequency: 0,
      total_purchase_value: 0,
      total_transactions: 0,
      delivery_performance: 0,
      last_transaction_date: null
    };
  }
}