const mongoose = require('mongoose');
const Asset = require('../models/asset');
const User = require('../models/user');
const Approval = require('../models/approval');
const AuditLog = require('../models/auditLog');
const Transaction = require('../models/transaction');
const Maintenance = require('../models/maintenance');
const Vendor = require('../models/vendor');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Get current date and calculate periods
    const currentDate = new Date();
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // Fetch stats in parallel
    const [
      totalAssets,
      totalValue,
      activeUsers,
      pendingApprovals,
      scrapAssets,
      monthlyPurchase,
      lastMonthPurchase,
      assetsLastMonth,
      usersLastMonth
    ] = await Promise.all([
      // Total assets count
      Asset.countDocuments({ status: { $ne: 'Scrapped' } }),
      
      // Total asset value
      Asset.aggregate([
        { $match: { status: { $ne: 'Scrapped' } } },
        { $group: { _id: null, total: { $sum: '$purchase_cost' } } }
      ]),
      
      // Active users count
      User.countDocuments({ is_active: true }),
      
      // Pending approvals count
      Approval.countDocuments({ status: 'Pending' }),
      
      // Assets ready for scrap
      Asset.countDocuments({ 
        $or: [
          { status: 'Disposed' },
          { condition: 'Poor' },
          { warranty_expiry: { $lt: currentDate } }
        ]
      }),
      
      // Monthly purchase value (current month)
      Asset.aggregate([
        { 
          $match: { 
            purchase_date: { $gte: currentMonth },
            status: { $ne: 'Scrapped' }
          } 
        },
        { $group: { _id: null, total: { $sum: '$purchase_cost' } } }
      ]),
      
      // Last month purchase for comparison
      Asset.aggregate([
        { 
          $match: { 
            purchase_date: { $gte: lastMonth, $lt: currentMonth },
            status: { $ne: 'Scrapped' }
          } 
        },
        { $group: { _id: null, total: { $sum: '$purchase_cost' } } }
      ]),
      
      // Assets count last month for trend
      Asset.countDocuments({ 
        created_at: { $lt: currentMonth },
        status: { $ne: 'Scrapped' }
      }),
      
      // Users count last month for trend
      User.countDocuments({ 
        created_at: { $lt: currentMonth },
        is_active: true 
      })
    ]);

    // Calculate trends
    const currentTotalValue = totalValue[0]?.total || 0;
    const currentMonthlyPurchase = monthlyPurchase[0]?.total || 0;
    const lastMonthlyPurchase = lastMonthPurchase[0]?.total || 0;

    const assetsTrend = assetsLastMonth > 0 ? 
      Math.round(((totalAssets - assetsLastMonth) / assetsLastMonth) * 100) : 0;
    
    const usersTrend = usersLastMonth > 0 ? 
      Math.round(((activeUsers - usersLastMonth) / usersLastMonth) * 100) : 0;
    
    const purchaseTrend = lastMonthlyPurchase > 0 ? 
      Math.round(((currentMonthlyPurchase - lastMonthlyPurchase) / lastMonthlyPurchase) * 100) : 0;

    // Calculate asset value trend from last month
    const lastMonthValue = await Asset.aggregate([
      { 
        $match: { 
          created_at: { $lt: currentMonth },
          status: { $ne: 'Scrapped' }
        } 
      },
      { $group: { _id: null, total: { $sum: '$purchase_cost' } } }
    ]);
    
    const lastMonthTotalValue = lastMonthValue[0]?.total || 0;
    const valueTrend = lastMonthTotalValue > 0 ? 
      Math.round(((currentTotalValue - lastMonthTotalValue) / lastMonthTotalValue) * 100) : 0;

    // Calculate system health metrics (simplified - no db.stats())
    const systemHealth = {
      serverHealth: 100, // Server is running if this endpoint is reachable
      databasePerformance: mongoose.connection.readyState === 1 ? 100 : 0,
      storageUsage: 0, // Placeholder - would need cloud provider API
      lastBackup: 'Not configured'
    };

    const stats = {
      totalAssets,
      totalValue: currentTotalValue,
      activeUsers,
      pendingApprovals,
      scrapAssets,
      monthlyPurchase: currentMonthlyPurchase,
      trends: {
        assets: {
          value: Math.abs(assetsTrend),
          isPositive: assetsTrend >= 0
        },
        value: {
          value: Math.abs(valueTrend),
          isPositive: valueTrend >= 0
        },
        users: {
          value: Math.abs(usersTrend),
          isPositive: usersTrend >= 0
        },
        purchase: {
          value: Math.abs(purchaseTrend),
          isPositive: purchaseTrend >= 0
        }
      },
      systemHealth
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    });
  }
};

// Get recent activities
const getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const activities = await AuditLog.find()
      .populate('user_id', 'name email')
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    const formattedActivities = activities.map(activity => ({
      id: activity._id,
      user: activity.user_id?.name || 'Unknown User',
      userId: activity.user_id?._id,
      action: activity.action,
      asset: activity.entity_type || 'System',
      assetId: activity.entity_id,
      time: activity.timestamp,
      type: activity.action.toLowerCase().includes('create') ? 'create' :
            activity.action.toLowerCase().includes('approve') ? 'approve' :
            activity.action.toLowerCase().includes('update') ? 'update' : 'system'
    }));

    res.json({
      success: true,
      data: formattedActivities
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent activities'
    });
  }
};

// Get pending approvals
const getPendingApprovals = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || 'Pending';

    const approvals = await Approval.find({ status })
      .populate('requested_by', 'name email')
      .populate('asset_id', 'unique_asset_id purchase_cost')
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();

    const formattedApprovals = approvals.map(approval => {
      const requestData = approval.request_data || {};
      const priority = requestData.priority || 'Medium';
      
      return {
        id: approval._id,
        type: approval.request_type,
        requestor: approval.requested_by?.name || 'Unknown User',
        requestorId: approval.requested_by?._id,
        amount: requestData.estimated_cost || requestData.cost_estimate || approval.asset_id?.purchase_cost || 0,
        status: approval.status.toLowerCase(),
        priority: priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase(),
        createdAt: approval.created_at,
        description: approval.comments || requestData.description || '',
        photo: requestData.photo || requestData.image || null,
        asset_id: approval.asset_id?._id
      };
    });

    res.json({
      success: true,
      data: formattedApprovals
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending approvals'
    });
  }
};

// Get complete system overview
const getSystemOverview = async (req, res) => {
  try {
    // This endpoint combines all dashboard data
    const [stats, activities, approvals] = await Promise.all([
      getDashboardStatsData(),
      getRecentActivitiesData(6),
      getPendingApprovalsData(5)
    ]);

    res.json({
      success: true,
      data: {
        stats,
        recentActivities: activities,
        pendingApprovals: approvals
      }
    });
  } catch (error) {
    console.error('Error fetching system overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system overview'
    });
  }
};

// Helper functions to get data without HTTP response
const getDashboardStatsData = async () => {
  const currentDate = new Date();
  const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  const [
    totalAssets,
    totalValue,
    activeUsers,
    pendingApprovals,
    scrapAssets,
    monthlyPurchase
  ] = await Promise.all([
    Asset.countDocuments({ status: { $ne: 'Scrapped' } }),
    Asset.aggregate([
      { $match: { status: { $ne: 'Scrapped' } } },
      { $group: { _id: null, total: { $sum: '$purchase_cost' } } }
    ]),
    User.countDocuments({ is_active: true }),
    Approval.countDocuments({ status: 'Pending' }),
    Asset.countDocuments({ 
      $or: [
        { status: 'Disposed' },
        { condition: 'Poor' }
      ]
    }),
    Asset.aggregate([
      { 
        $match: { 
          purchase_date: { $gte: currentMonth },
          status: { $ne: 'Scrapped' }
        } 
      },
      { $group: { _id: null, total: { $sum: '$purchase_cost' } } }
    ])
  ]);

  return {
    totalAssets,
    totalValue: totalValue[0]?.total || 0,
    activeUsers,
    pendingApprovals,
    scrapAssets,
    monthlyPurchase: monthlyPurchase[0]?.total || 0,
    trends: {
      assets: { value: 12, isPositive: true },
      value: { value: 8, isPositive: true },
      users: { value: 5, isPositive: true },
      purchase: { value: 15, isPositive: true }
    }
  };
};

const getRecentActivitiesData = async (limit = 10) => {
  const activities = await AuditLog.find()
    .populate('user_id', 'name email')
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();

  return activities.map(activity => ({
    id: activity._id,
    user: activity.user_id?.name || 'Unknown User',
    userId: activity.user_id?._id,
    action: activity.action,
    asset: activity.entity_type || 'System',
    assetId: activity.entity_id,
    time: activity.timestamp,
    type: activity.action.toLowerCase().includes('create') ? 'create' :
          activity.action.toLowerCase().includes('approve') ? 'approve' :
          activity.action.toLowerCase().includes('update') ? 'update' : 'system'
  }));
};

const getPendingApprovalsData = async (limit = 10) => {
  const approvals = await Approval.find({ status: 'Pending' })
    .populate('requested_by', 'name email')
    .populate('asset_id', 'unique_asset_id purchase_cost')
    .sort({ created_at: -1 })
    .limit(limit)
    .lean();

  return approvals.map(approval => {
    const requestData = approval.request_data || {};
    const priority = requestData.priority || 'Medium';
    
    return {
      id: approval._id,
      type: approval.request_type,
      requestor: approval.requested_by?.name || 'Unknown User',
      requestorId: approval.requested_by?._id,
      amount: requestData.estimated_cost || requestData.cost_estimate || approval.asset_id?.purchase_cost || 0,
      status: approval.status.toLowerCase(),
      priority: priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase(),
      createdAt: approval.created_at,
      description: approval.comments || requestData.description || '',
      photo: requestData.photo || requestData.image || null,
      asset_id: approval.asset_id?._id
    };
  });
};

// Get users by role statistics
const getUsersByRole = async (req, res) => {
  try {
    const usersByRole = await User.aggregate([
      { $match: { is_active: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const result = usersByRole.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching users by role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users by role'
    });
  }
};

// Get assets by category statistics
const getAssetsByCategory = async (req, res) => {
  try {
    const assetsByCategory = await Asset.aggregate([
      { $match: { status: { $ne: 'Scrapped' } } },
      { $group: { _id: '$asset_type', count: { $sum: 1 } } }
    ]);

    const result = assetsByCategory.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching assets by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assets by category'
    });
  }
};

// Get monthly trends
const getMonthlyTrends = async (req, res) => {
  try {
    const currentDate = new Date();
    const monthsBack = 6;
    
    // Get last 6 months data
    const trends = {};
    
    for (let i = 0; i < monthsBack; i++) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
      
      const [assets, purchases] = await Promise.all([
        Asset.countDocuments({
          created_at: { $gte: monthStart, $lte: monthEnd },
          status: { $ne: 'Scrapped' }
        }),
        Asset.aggregate([
          {
            $match: {
              purchase_date: { $gte: monthStart, $lte: monthEnd },
              status: { $ne: 'Scrapped' }
            }
          },
          { $group: { _id: null, total: { $sum: '$purchase_cost' } } }
        ])
      ]);
      
      const monthKey = monthStart.toISOString().substring(0, 7); // YYYY-MM format
      if (!trends.assets) trends.assets = [];
      if (!trends.purchases) trends.purchases = [];
      
      trends.assets.unshift(assets);
      trends.purchases.unshift(purchases[0]?.total || 0);
    }

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error fetching monthly trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch monthly trends'
    });
  }
};

// Inventory Manager specific endpoints

// Get inventory manager dashboard statistics
const getInventoryStats = async (req, res) => {
  try {
    const currentDate = new Date();
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    const [
      totalAssets,
      activeAssets,
      inMaintenanceAssets,
      disposedAssets,
      totalValue,
      locationCount,
      warrantyExpiring,
      maintenanceDue,
      monthlyPurchases,
      lastMonthPurchases,
      topVendorsCount,
      assetsLastMonth
    ] = await Promise.all([
      Asset.countDocuments({ status: { $ne: 'Scrapped' } }),
      Asset.countDocuments({ status: 'Active' }),
      Asset.countDocuments({ status: 'Under Maintenance' }),
      Asset.countDocuments({ status: 'Ready for Scrap' }),
      Asset.aggregate([
        { $match: { status: { $ne: 'Scrapped' } } },
        { $group: { _id: null, total: { $sum: '$purchase_cost' } } }
      ]),
      Asset.distinct('location').then(locations => locations.length).catch(err => {
        logger.error('Failed to get distinct locations', { error: err.message });
        return 0;
      }),
      Asset.countDocuments({
        warranty_expiry: { 
          $gte: currentDate,
          $lte: new Date(currentDate.getTime() + (90 * 24 * 60 * 60 * 1000)) // Next 90 days
        }
      }),
      Maintenance.countDocuments({
        status: { $in: ['Scheduled', 'In Progress'] },
        maintenance_date: { 
          $gte: currentDate,
          $lte: new Date(currentDate.getTime() + (7 * 24 * 60 * 60 * 1000)) 
        }
      }),
      Asset.countDocuments({
        purchase_date: { $gte: currentMonth }
      }),
      Asset.countDocuments({
        purchase_date: { $gte: lastMonth, $lt: currentMonth }
      }),
      Vendor.countDocuments({ is_active: true }),
      Asset.countDocuments({ 
        created_at: { $lt: currentMonth },
        status: { $ne: 'Scrapped' }
      })
    ]);

    const purchaseTrend = lastMonthPurchases > 0 ? 
      Math.round(((monthlyPurchases - lastMonthPurchases) / lastMonthPurchases) * 100) : 0;

    const assetsTrend = assetsLastMonth > 0 ? 
      Math.round(((totalAssets - assetsLastMonth) / assetsLastMonth) * 100) : 0;

    const stats = {
      totalAssets,
      activeAssets,
      inMaintenanceAssets,
      disposedAssets,
      totalValue: totalValue[0]?.total || 0,
      locationCount,
      warrantyExpiring,
      maintenanceDue,
      monthlyPurchases,
      topVendorsCount,
      trends: {
        assets: {
          value: Math.abs(assetsTrend),
          isPositive: assetsTrend >= 0
        },
        purchases: {
          value: Math.abs(purchaseTrend),
          isPositive: purchaseTrend >= 0
        }
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory statistics'
    });
  }
};

// Get assets grouped by location
const getAssetsByLocationDetailed = async (req, res) => {
  try {
    const assetsByLocation = await Asset.aggregate([
      { $match: { status: { $ne: 'Scrapped' } } },
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 },
          assets: { $push: '$unique_asset_id' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const totalAssets = await Asset.countDocuments({ status: { $ne: 'Scrapped' } });

    const result = assetsByLocation.map(location => ({
      location: location._id,
      count: location.count,
      percentage: totalAssets > 0 ? Math.round((location.count / totalAssets) * 100) : 0,
      assets: location.assets.slice(0, 5) // First 5 assets for preview
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching assets by location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assets by location'
    });
  }
};

// Get assets with expiring warranties
const getWarrantyExpiringAssets = async (req, res) => {
  try {
    const currentDate = new Date();
    const threeMonthsFromNow = new Date(currentDate.getTime() + (90 * 24 * 60 * 60 * 1000));

    const expiringAssets = await Asset.find({
      warranty_expiry: {
        $gte: currentDate,
        $lte: threeMonthsFromNow
      },
      status: { $ne: 'Scrapped' }
    })
    .populate('assigned_user', 'name email')
    .sort({ warranty_expiry: 1 })
    .limit(20);

    const result = expiringAssets.map(asset => {
      const daysLeft = Math.ceil((new Date(asset.warranty_expiry) - currentDate) / (1000 * 60 * 60 * 24));
      return {
        id: asset._id,
        asset: asset.unique_asset_id,
        assetId: asset._id,
        category: asset.asset_type,
        expiryDate: asset.warranty_expiry.toISOString().split('T')[0],
        daysLeft,
        priority: daysLeft <= 30 ? 'high' : daysLeft <= 60 ? 'medium' : 'low',
        assignedUser: asset.assigned_user?.name
      };
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching warranty expiring assets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch warranty expiring assets'
    });
  }
};

// Get maintenance schedule
const getMaintenanceScheduleDetailed = async (req, res) => {
  try {
    const currentDate = new Date();
    const nextMonth = new Date(currentDate.getTime() + (30 * 24 * 60 * 60 * 1000));

    const maintenanceItems = await Maintenance.find({
      maintenance_date: {
        $gte: currentDate,
        $lte: nextMonth
      },
      status: { $in: ['Scheduled', 'In Progress'] }
    })
    .populate('asset_id', 'unique_asset_id asset_type')
    .populate('vendor_id', 'vendor_name contact_person')
    .sort({ maintenance_date: 1 })
    .limit(15);

    const result = maintenanceItems.map(item => ({
      id: item._id,
      asset: item.asset_id?.unique_asset_id || 'Unknown Asset',
      assetId: item.asset_id?._id,
      type: item.maintenance_type,
      scheduledDate: item.maintenance_date.toISOString().split('T')[0],
      technician: item.performed_by || item.vendor_id?.contact_person || 'TBD',
      status: item.status === 'Scheduled' ? 'scheduled' : item.status.toLowerCase().replace(' ', '_'),
      cost: item.cost,
      description: item.description
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching maintenance schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch maintenance schedule'
    });
  }
};

// Get top vendors by performance
const getTopVendorsDetailed = async (req, res) => {
  try {
    const vendors = await Vendor.find({ is_active: true })
      .sort({ performance_rating: -1 })
      .limit(10);

    const result = await Promise.all(vendors.map(async (vendor) => {
      const assetsCount = await Asset.countDocuments({ vendor: vendor._id });
      const maintenanceCount = await Maintenance.countDocuments({ vendor_id: vendor._id });
      
      // Calculate actual total value from assets
      const assetValue = await Asset.aggregate([
        { $match: { vendor: vendor._id, status: { $ne: 'Scrapped' } } },
        { $group: { _id: null, total: { $sum: '$purchase_cost' } } }
      ]);
      
      return {
        id: vendor._id,
        name: vendor.vendor_name || vendor.name,
        orders: assetsCount + maintenanceCount,
        value: assetValue[0]?.total || 0,
        rating: vendor.performance_rating || 3,
        categories: vendor.categories || [],
        activeContracts: maintenanceCount
      };
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching top vendors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top vendors'
    });
  }
};

// Get pending approvals for inventory manager
const getInventoryApprovals = async (req, res) => {
  try {
    const approvals = await Approval.find({ 
      status: 'Pending',
      request_type: { $in: ['Repair', 'Upgrade', 'New Asset', 'Other'] }
    })
    .populate('requested_by', 'name email')
    .populate('asset_id', 'unique_asset_id')
    .sort({ created_at: -1 })
    .limit(10);

    const result = approvals.map(approval => {
      const daysAgo = Math.floor((new Date() - new Date(approval.created_at)) / (1000 * 60 * 60 * 24));
      const requestData = approval.request_data || {};
      const priority = requestData.priority || 'Medium';
      
      return {
        id: approval._id,
        type: approval.request_type,
        requester: approval.requested_by?.name || 'Unknown User',
        requestorId: approval.requested_by?._id,
        priority: priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase(),
        daysAgo,
        amount: requestData.cost_estimate || requestData.estimated_cost,
        description: approval.comments || requestData.description,
        assetId: approval.asset_id?._id
      };
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching inventory approvals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory approvals'
    });
  }
};

// Get complete inventory overview
const getInventoryOverview = async (req, res) => {
  try {
    const [stats, assetsByLocation, warrantyExpiring, maintenanceSchedule, topVendors, pendingApprovals] = await Promise.all([
      getInventoryStatsData(),
      getAssetsByLocationData(),
      getWarrantyExpiringData(),
      getMaintenanceScheduleData(),
      getTopVendorsData(),
      getInventoryApprovalsData()
    ]);

    res.json({
      success: true,
      data: {
        stats,
        assetsByLocation,
        warrantyExpiring,
        maintenanceSchedule,
        topVendors,
        pendingApprovals
      }
    });
  } catch (error) {
    console.error('Error fetching inventory overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory overview'
    });
  }
};

// Helper functions for inventory data (similar to admin dashboard helpers)
const getInventoryStatsData = async () => {
  const currentDate = new Date();
  const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  const [
    totalAssets,
    activeAssets,
    inMaintenanceAssets,
    disposedAssets,
    totalValue,
    locationCount,
    warrantyExpiring,
    maintenanceDue,
    monthlyPurchases,
    topVendorsCount,
    lastMonthAssets,
    lastMonthActive
  ] = await Promise.all([
    Asset.countDocuments({ status: { $ne: 'Scrapped' } }),
    Asset.countDocuments({ status: 'Active' }),
    Asset.countDocuments({ status: 'Under Maintenance' }),
    Asset.countDocuments({ status: 'Ready for Scrap' }),
    Asset.aggregate([
      { $match: { status: { $ne: 'Scrapped' } } },
      { $group: { _id: null, total: { $sum: '$purchase_cost' } } }
    ]),
    Asset.distinct('location').then(locations => locations.length),
    Asset.countDocuments({
      warranty_expiry: { 
        $gte: currentDate,
        $lte: new Date(currentDate.getTime() + (90 * 24 * 60 * 60 * 1000))
      }
    }),
    Maintenance.countDocuments({
      status: { $in: ['Scheduled', 'In Progress'] },
      maintenance_date: { 
        $gte: currentDate,
        $lte: new Date(currentDate.getTime() + (7 * 24 * 60 * 60 * 1000)) 
      }
    }),
    Asset.countDocuments({
      purchase_date: { $gte: currentMonth }
    }),
    Vendor.countDocuments({ is_active: true }),
    Asset.countDocuments({ 
      status: { $ne: 'Scrapped' },
      created_at: { $lt: currentMonth }
    }),
    Asset.countDocuments({ 
      status: 'Active',
      created_at: { $lt: currentMonth }
    })
  ]);

  // Calculate trends
  const assetsTrend = lastMonthAssets > 0 ? 
    Math.round(((totalAssets - lastMonthAssets) / lastMonthAssets) * 100) : 0;
  const activeTrend = lastMonthActive > 0 ? 
    Math.round(((activeAssets - lastMonthActive) / lastMonthActive) * 100) : 0;

  return {
    totalAssets,
    activeAssets,
    inMaintenanceAssets,
    disposedAssets,
    totalValue: totalValue[0]?.total || 0,
    locationCount,
    warrantyExpiring,
    maintenanceDue,
    monthlyPurchases,
    topVendorsCount,
    trends: {
      assets: { 
        value: Math.abs(assetsTrend), 
        isPositive: assetsTrend >= 0 
      },
      active: { 
        value: Math.abs(activeTrend), 
        isPositive: activeTrend >= 0 
      }
    }
  };
};

const getAssetsByLocationData = async () => {
  const assetsByLocation = await Asset.aggregate([
    { $match: { status: { $ne: 'Scrapped' } } },
    {
      $group: {
        _id: '$location',
        count: { $sum: 1 },
        assets: { $push: '$unique_asset_id' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 8 }
  ]);

  const totalAssets = await Asset.countDocuments({ status: { $ne: 'Scrapped' } });

  return assetsByLocation.map(location => ({
    location: location._id,
    count: location.count,
    percentage: totalAssets > 0 ? Math.round((location.count / totalAssets) * 100) : 0,
    assets: location.assets.slice(0, 3)
  }));
};

const getWarrantyExpiringData = async () => {
  const currentDate = new Date();
  const threeMonthsFromNow = new Date(currentDate.getTime() + (90 * 24 * 60 * 60 * 1000));

  const expiringAssets = await Asset.find({
    warranty_expiry: {
      $gte: currentDate,
      $lte: threeMonthsFromNow
    },
    status: { $ne: 'Scrapped' }
  })
  .populate('assigned_user', 'name')
  .sort({ warranty_expiry: 1 })
  .limit(10);

  return expiringAssets.map(asset => {
    const daysLeft = Math.ceil((new Date(asset.warranty_expiry) - currentDate) / (1000 * 60 * 60 * 24));
    return {
      id: asset._id,
      asset: asset.unique_asset_id,
      assetId: asset._id,
      category: asset.asset_type,
      expiryDate: asset.warranty_expiry.toISOString().split('T')[0],
      daysLeft,
      priority: daysLeft <= 30 ? 'high' : daysLeft <= 60 ? 'medium' : 'low',
      assignedUser: asset.assigned_user?.name
    };
  });
};

const getMaintenanceScheduleData = async () => {
  const currentDate = new Date();
  const nextMonth = new Date(currentDate.getTime() + (30 * 24 * 60 * 60 * 1000));

  const maintenanceItems = await Maintenance.find({
    maintenance_date: {
      $gte: currentDate,
      $lte: nextMonth
    },
    status: { $in: ['Scheduled', 'In Progress'] }
  })
  .populate('asset_id', 'unique_asset_id')
  .sort({ maintenance_date: 1 })
  .limit(10);

  return maintenanceItems.map(item => ({
    id: item._id,
    asset: item.asset_id?.unique_asset_id || 'Unknown',
    assetId: item.asset_id?._id,
    type: item.maintenance_type,
    scheduledDate: item.maintenance_date.toISOString().split('T')[0],
    technician: item.performed_by || 'TBD',
    status: item.status === 'Scheduled' ? 'scheduled' : item.status.toLowerCase().replace(' ', '_')
  }));
};

const getTopVendorsData = async () => {
  const vendors = await Vendor.find({ is_active: true })
    .sort({ performance_rating: -1 })
    .limit(8);

  return Promise.all(vendors.map(async (vendor) => {
    const assetsCount = await Asset.countDocuments({ vendor: vendor._id });
    const maintenanceCount = await Maintenance.countDocuments({ vendor_id: vendor._id });
    
    // Get actual total value from assets purchased from this vendor
    const assetValue = await Asset.aggregate([
      { $match: { vendor: vendor._id, status: { $ne: 'Scrapped' } } },
      { $group: { _id: null, total: { $sum: '$purchase_cost' } } }
    ]);
    
    return {
      id: vendor._id,
      name: vendor.vendor_name || vendor.name,
      orders: assetsCount,
      value: assetValue[0]?.total || 0,
      rating: vendor.performance_rating || 3,
      categories: vendor.categories || [],
      activeContracts: maintenanceCount
    };
  }));
};

const getInventoryApprovalsData = async () => {
  const approvals = await Approval.find({ 
    status: 'Pending',
    request_type: { $in: ['Repair', 'Upgrade', 'New Asset'] }
  })
  .populate('requested_by', 'name')
  .sort({ created_at: -1 })
  .limit(8);

  return approvals.map(approval => {
    const daysAgo = Math.floor((new Date() - new Date(approval.created_at)) / (1000 * 60 * 60 * 24));
    const requestData = approval.request_data || {};
    const priority = requestData.priority || 'Medium';
    
    return {
      id: approval._id,
      type: approval.request_type,
      requester: approval.requested_by?.name || 'Unknown',
      requestorId: approval.requested_by?._id,
      priority: priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase(),
      daysAgo
    };
  });
};

// ===== AUDITOR DASHBOARD ENDPOINTS =====

// Auditor Dashboard - Get audit statistics
const getAuditorStats = async (req, res) => {
  try {
    // Get all assets for audit statistics
    const totalAssets = await Asset.countDocuments();
    const auditedAssets = await Asset.countDocuments({ last_audit_date: { $exists: true, $ne: null } });
    const pendingAudits = await Asset.countDocuments({ 
      $or: [
        { last_audit_date: { $exists: false } },
        { last_audit_date: null },
        { last_audit_date: { $lt: new Date(Date.now() - 365*24*60*60*1000) } } // More than 1 year old
      ]
    });
    
    // Get discrepancies (assets with condition 'Poor' or 'Damaged' or specific status)
    const discrepancies = await Asset.countDocuments({
      $or: [
        { condition: { $in: ['Poor', 'Damaged'] } },
        { status: 'Under Review' }
      ]
    });
    
    // Get missing assets
    const missing = await Asset.countDocuments({ status: 'Missing' });
    
    // Calculate completion rate
    const completion_rate = totalAssets > 0 ? Math.round((auditedAssets / totalAssets) * 100) : 0;
    
    res.json({
      total_assigned: totalAssets,
      completed: auditedAssets,
      pending: pendingAudits,
      discrepancies: discrepancies,
      missing: missing,
      completion_rate: completion_rate
    });
  } catch (error) {
    console.error('Error getting auditor stats:', error);
    res.status(500).json({ 
      message: 'Failed to get auditor statistics',
      error: error.message 
    });
  }
};

// Auditor Dashboard - Get audit items (assets assigned for auditing)
const getAuditItems = async (req, res) => {
  try {
    const assets = await Asset.find()
      .populate('assigned_user', 'name email')
      .sort({ last_audit_date: 1 }) // Oldest audits first
      .limit(50); // Limit for performance
    
    const auditItems = assets.map(asset => {
      let auditStatus = 'verified';
      if (!asset.last_audit_date || asset.last_audit_date < new Date(Date.now() - 365*24*60*60*1000)) {
        auditStatus = 'pending';
      }
      if (asset.condition === 'Poor' || asset.condition === 'Damaged' || asset.status === 'Under Review') {
        auditStatus = 'discrepancy';
      }
      if (asset.status === 'Missing') {
        auditStatus = 'missing';
      }
      
      return {
        id: asset._id,
        asset_id: asset.unique_asset_id,
        asset_name: `${asset.manufacturer} ${asset.model}`,
        location: asset.location,
        assigned_user: asset.assigned_user ? asset.assigned_user.name : 'Unassigned',
        last_audit_date: asset.last_audit_date || '1970-01-01',
        status: auditStatus,
        condition: asset.condition || 'Unknown',
        notes: asset.notes
      };
    });
    
    res.json(auditItems);
  } catch (error) {
    console.error('Error getting audit items:', error);
    res.status(500).json({ 
      message: 'Failed to get audit items',
      error: error.message 
    });
  }
};

// Auditor Dashboard - Get audit progress chart data
const getAuditProgressChart = async (req, res) => {
  try {
    // Generate monthly audit progress data for the last 6 months
    const months = [];
    const auditedData = [];
    const discrepancyData = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      months.push(monthName);
      
  // Get audit count for this month
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const auditedCount = await Asset.countDocuments({
        last_audit_date: { $gte: startOfMonth, $lte: endOfMonth }
      });
      
      const discrepancyCount = await Asset.countDocuments({
        last_audit_date: { $gte: startOfMonth, $lte: endOfMonth },
        $or: [
          { condition: { $in: ['Poor', 'Damaged'] } },
          { status: 'Under Review' }
        ]
      });
      
      auditedData.push(auditedCount);
      discrepancyData.push(discrepancyCount);
    }
    
    res.json({
      labels: months,
      datasets: [
        {
          label: 'Audited Assets',
          data: auditedData,
          backgroundColor: 'rgba(76, 175, 80, 0.6)',
          borderColor: 'rgba(76, 175, 80, 1)',
          borderWidth: 2,
        },
        {
          label: 'Discrepancies Found',
          data: discrepancyData,
          backgroundColor: 'rgba(255, 152, 0, 0.6)',
          borderColor: 'rgba(255, 152, 0, 1)',
          borderWidth: 2,
        },
      ],
    });
  } catch (error) {
    console.error('Error getting audit progress chart:', error);
    res.status(500).json({ 
      message: 'Failed to get audit progress data',
      error: error.message 
    });
  }
};

// Auditor Dashboard - Get condition distribution chart data
const getConditionChart = async (req, res) => {
  try {
    const conditionCounts = await Asset.aggregate([
      {
        $group: {
          _id: '$condition',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Initialize default conditions
    const conditions = ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'];
    const data = conditions.map(condition => {
      const found = conditionCounts.find(item => item._id === condition);
      return found ? found.count : 0;
    });
    
    res.json({
      labels: conditions,
      datasets: [
        {
          label: 'Asset Condition',
          data: data,
          backgroundColor: [
            '#4CAF50',
            '#8BC34A',
            '#FF9800',
            '#FF5722',
            '#F44336',
          ],
        },
      ],
    });
  } catch (error) {
    console.error('Error getting condition chart:', error);
    res.status(500).json({ 
      message: 'Failed to get condition data',
      error: error.message 
    });
  }
};

// Auditor Dashboard - Get recent audit activities
const getAuditorActivities = async (req, res) => {
  try {
    // Get recent asset updates that relate to auditing
    const recentAssets = await Asset.find({
      $or: [
        { last_audit_date: { $gte: new Date(Date.now() - 30*24*60*60*1000) } },
        { condition: { $in: ['Poor', 'Damaged'] } },
        { status: { $in: ['Missing', 'Under Review'] } }
      ]
    })
    .populate('assigned_user', 'name')
    .sort({ updatedAt: -1 })
    .limit(10);
    
    const activities = recentAssets.map(asset => {
      let activityType = 'audit_completed';
      let title = 'Asset Audit Completed';
      let description = `${asset.manufacturer} ${asset.model} - Location: ${asset.location}`;
      let priority = 'medium';
      
      if (asset.status === 'Missing') {
        activityType = 'asset_missing';
        title = 'Asset Missing';
        priority = 'critical';
      } else if (asset.condition === 'Poor' || asset.condition === 'Damaged') {
        activityType = 'discrepancy_found';
        title = 'Asset Condition Issue';
        priority = 'high';
      } else if (asset.status === 'Under Review') {
        activityType = 'compliance_check';
        title = 'Compliance Review Required';
        priority = 'high';
      }
      
      return {
        id: asset._id,
        type: activityType,
        title: title,
        description: description,
        timestamp: asset.updatedAt || asset.last_audit_date,
        asset_id: asset.unique_asset_id,
        location: asset.location,
        priority: priority
      };
    });
    
    res.json(activities);
  } catch (error) {
    console.error('Error getting auditor activities:', error);
    res.status(500).json({ 
      message: 'Failed to get audit activities',
      error: error.message 
    });
  }
};

// Auditor Dashboard - Get compliance metrics
const getComplianceMetrics = async (req, res) => {
  try {
    const totalAssets = await Asset.countDocuments();
    const compliantAssets = await Asset.countDocuments({
      condition: { $in: ['Excellent', 'Good'] },
      status: 'Active',
      last_audit_date: { $gte: new Date(Date.now() - 365*24*60*60*1000) }
    });
    
    const overallScore = totalAssets > 0 ? Math.round((compliantAssets / totalAssets) * 100) : 0;
    
  // Category scores derived from overallScore
    const categoryScores = {
      'Physical Condition': Math.round(overallScore * 0.9),
      'Documentation': Math.round(overallScore * 0.85),
      'Location Accuracy': Math.round(overallScore * 0.95),
      'Audit Compliance': Math.round(overallScore * 0.8)
    };
    
    // Trends derived from current overallScore (flat, no randomization)
    const trends = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      trends.push({
        date: date.toISOString().split('T')[0],
        score: overallScore
      });
    }
    
    res.json({
      overallScore,
      categoryScores,
      trends
    });
  } catch (error) {
    console.error('Error getting compliance metrics:', error);
    res.status(500).json({ 
      message: 'Failed to get compliance metrics',
      error: error.message 
    });
  }
};

// ===== EMPLOYEE DASHBOARD ENDPOINTS =====

// Employee Dashboard - Get employee statistics
const getEmployeeStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get assets assigned to current user
    const userAssets = await Asset.find({ assigned_user: userId });
    const activeAssets = userAssets.filter(asset => asset.status === 'Active');
    
    // Get pending maintenance requests for user's assets
    const pendingMaintenance = await Maintenance.countDocuments({
      asset: { $in: userAssets.map(a => a._id) },
      status: 'Pending'
    });
    
    // Get warranties expiring within 3 months
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    
    const warrantiesExpiring = userAssets.filter(asset => {
      return asset.warranty_expiry && 
             new Date(asset.warranty_expiry) <= threeMonthsFromNow &&
             new Date(asset.warranty_expiry) > new Date();
    }).length;
    
    res.json({
      total_assets: userAssets.length,
      active_assets: activeAssets.length,
      pending_maintenance: pendingMaintenance,
      warranties_expiring: warrantiesExpiring
    });
  } catch (error) {
    console.error('Error getting employee stats:', error);
    res.status(500).json({ 
      message: 'Failed to get employee statistics',
      error: error.message 
    });
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivities,
  getPendingApprovals,
  getSystemOverview,
  getUsersByRole,
  getAssetsByCategory,
  getMonthlyTrends,
  // Inventory Manager endpoints
  getInventoryStats,
  getAssetsByLocationDetailed,
  getWarrantyExpiringAssets,
  getMaintenanceScheduleDetailed,
  getTopVendorsDetailed,
  getInventoryApprovals,
  getInventoryOverview,
  // Auditor endpoints
  getAuditorStats,
  getAuditItems,
  getAuditProgressChart,
  getConditionChart,
  getAuditorActivities,
  getComplianceMetrics,
  // Employee endpoints
  getEmployeeStats
};