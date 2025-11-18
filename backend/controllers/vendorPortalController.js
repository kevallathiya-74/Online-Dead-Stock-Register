const PurchaseOrder = require('../models/purchaseOrder');
const Asset = require('../models/asset');
const Vendor = require('../models/vendor');
const mongoose = require('mongoose');

// Get vendor dashboard statistics (REAL DATA)
const getVendorStats = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;

    if (!vendorId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User is not linked to a vendor account' 
      });
    }

    // Get total orders count
    const totalOrders = await PurchaseOrder.countDocuments({ 
      vendor: vendorId 
    });

    // Get pending orders (waiting for approval or in progress)
    const pendingOrders = await PurchaseOrder.countDocuments({ 
      vendor: vendorId,
      status: { $in: ['pending_approval', 'approved', 'sent_to_vendor', 'acknowledged', 'in_progress'] }
    });

    // Get completed orders
    const completedOrders = await PurchaseOrder.countDocuments({ 
      vendor: vendorId,
      status: 'completed'
    });

    // Calculate total revenue from completed orders
    const revenueResult = await PurchaseOrder.aggregate([
      { 
        $match: { 
          vendor: new mongoose.Types.ObjectId(vendorId),
          status: 'completed'
        } 
      },
      { 
        $group: { 
          _id: null, 
          totalRevenue: { $sum: '$total_amount' } 
        } 
      }
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Calculate on-time delivery rate
    const deliveredOrders = await PurchaseOrder.find({
      vendor: vendorId,
      status: 'completed',
      actual_delivery_date: { $exists: true }
    });

    const onTimeDeliveries = deliveredOrders.filter(order => {
      return new Date(order.actual_delivery_date) <= new Date(order.expected_delivery_date);
    }).length;

    const onTimeDeliveryRate = deliveredOrders.length > 0 
      ? Math.round((onTimeDeliveries / deliveredOrders.length) * 100) 
      : 100;

    // Get active products count
    const activeProducts = await Asset.countDocuments({ 
      vendor: vendorId,
      status: { $ne: 'disposed' }
    });

    // Get pending invoices count (orders that are completed but not fully paid)
    const pendingInvoices = await PurchaseOrder.countDocuments({
      vendor: vendorId,
      status: 'completed',
      payment_status: { $ne: 'paid' }
    });

    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue: totalRevenue,
        activeProducts,
        pendingInvoices,
        onTimeDeliveryRate,
        performanceScore: onTimeDeliveryRate // Based on delivery performance
      }
    });

  } catch (error) {
    console.error('Error fetching vendor stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch vendor statistics',
      error: error.message 
    });
  }
};

// Get recent orders (REAL DATA)
const getRecentOrders = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;

    if (!vendorId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User is not linked to a vendor account' 
      });
    }

    const recentOrders = await PurchaseOrder.find({ vendor: vendorId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('requested_by', 'name email')
      .populate('approved_by', 'name email')
      .select('po_number status total_amount expected_delivery_date items createdAt priority');

    const formattedOrders = recentOrders.map(order => ({
      _id: order._id,
      po_number: order.po_number,
      status: order.status,
      total_amount: order.total_amount,
      expected_delivery_date: order.expected_delivery_date,
      order_date: order.createdAt,
      items_count: order.items.length,
      priority: order.priority,
      requested_by: order.requested_by ? order.requested_by.name : 'N/A'
    }));

    res.json({
      success: true,
      orders: formattedOrders
    });

  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch recent orders',
      error: error.message 
    });
  }
};

// Get all orders with pagination (REAL DATA)
const getAllOrders = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;

    if (!vendorId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User is not linked to a vendor account' 
      });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filters
    const filters = { vendor: vendorId };
    
    if (req.query.status) {
      filters.status = req.query.status;
    }

    if (req.query.search) {
      filters.po_number = { $regex: req.query.search, $options: 'i' };
    }

    if (req.query.priority) {
      filters.priority = req.query.priority;
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filters.createdAt = {};
      if (req.query.startDate) {
        filters.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filters.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    const totalOrders = await PurchaseOrder.countDocuments(filters);
    
    const orders = await PurchaseOrder.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('requested_by', 'name email department')
      .populate('approved_by', 'name email')
      .select('-attachments -approval_history -received_items'); // Exclude large fields

    const formattedOrders = orders.map(order => ({
      _id: order._id,
      po_number: order.po_number,
      status: order.status,
      priority: order.priority,
      total_amount: order.total_amount,
      expected_delivery_date: order.expected_delivery_date,
      actual_delivery_date: order.actual_delivery_date,
      order_date: order.createdAt,
      items_count: order.items.length,
      requested_by: order.requested_by ? {
        name: order.requested_by.name,
        email: order.requested_by.email,
        department: order.requested_by.department
      } : null,
      approved_by: order.approved_by ? {
        name: order.approved_by.name,
        email: order.approved_by.email
      } : null,
      payment_terms: order.payment_terms,
      payment_method: order.payment_method
    }));

    res.json({
      success: true,
      orders: formattedOrders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch orders',
      error: error.message 
    });
  }
};

// Get single order details (REAL DATA)
const getOrderById = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;
    const orderId = req.params.id;

    if (!vendorId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User is not linked to a vendor account' 
      });
    }

    const order = await PurchaseOrder.findOne({ 
      _id: orderId, 
      vendor: vendorId 
    })
      .populate('requested_by', 'name email department employee_id')
      .populate('approved_by', 'name email')
      .populate('vendor', 'company_name contact_person email phone address')
      .populate('attachments.uploaded_by', 'name email')
      .populate('approval_history.performed_by', 'name email')
      .populate('received_items.received_by', 'name email');

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found or access denied' 
      });
    }

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch order details',
      error: error.message 
    });
  }
};

// Get vendor products (assets supplied by vendor) (REAL DATA)
const getProducts = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;

    if (!vendorId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User is not linked to a vendor account' 
      });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Filters
    const filters = { vendor: vendorId };
    
    if (req.query.search) {
      filters.$or = [
        { asset_id: { $regex: req.query.search, $options: 'i' } },
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    if (req.query.category) {
      filters.category = req.query.category;
    }

    if (req.query.status) {
      filters.status = req.query.status;
    }

    const totalProducts = await Asset.countDocuments(filters);
    
    const products = await Asset.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('assigned_user', 'name email department')
      .populate('location', 'name building floor')
      .select('-images -documents'); // Exclude large binary data

    const formattedProducts = products.map(product => ({
      _id: product._id,
      asset_id: product.asset_id,
      name: product.name,
      description: product.description,
      category: product.asset_type,
      status: product.status,
      condition: product.condition,
      purchase_price: product.purchase_price,
      current_value: product.current_value,
      purchase_date: product.purchase_date,
      warranty_expiry: product.warranty_expiry,
      assigned_to: product.assigned_user ? {
        name: product.assigned_user.name,
        email: product.assigned_user.email,
        department: product.assigned_user.department
      } : null,
      location: product.location,
      quantity: product.quantity || 1,
      serial_number: product.serial_number,
      model_number: product.model_number
    }));

    res.json({
      success: true,
      products: formattedProducts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch products',
      error: error.message 
    });
  }
};

// Get vendor invoices (from completed purchase orders) (REAL DATA)
const getInvoices = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;

    if (!vendorId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User is not linked to a vendor account' 
      });
    }

    // Get completed purchase orders as invoices
    const filters = { 
      vendor: vendorId,
      status: { $in: ['completed', 'partially_received'] }
    };

    if (req.query.status === 'paid') {
      filters.payment_status = 'paid';
    } else if (req.query.status === 'pending') {
      filters.payment_status = { $in: ['pending', 'partial'] };
    }

    const invoices = await PurchaseOrder.find(filters)
      .sort({ createdAt: -1 })
      .populate('requested_by', 'name email department')
      .populate('approved_by', 'name email')
      .select('po_number total_amount payment_terms payment_method payment_status createdAt expected_delivery_date actual_delivery_date items');

    // Calculate invoice status based on payment and delivery
    const formattedInvoices = invoices.map(order => {
      let invoiceStatus = 'pending';
      
      if (order.payment_status === 'paid') {
        invoiceStatus = 'paid';
      } else if (order.expected_delivery_date && new Date() > new Date(order.expected_delivery_date)) {
        invoiceStatus = 'overdue';
      }

      return {
        _id: order._id,
        invoice_number: order.po_number, // Using PO number as invoice number
        order_number: order.po_number,
        invoice_date: order.createdAt,
        due_date: order.expected_delivery_date,
        amount: order.total_amount,
        status: invoiceStatus,
        payment_method: order.payment_method,
        payment_terms: order.payment_terms,
        items_count: order.items.length,
        requested_by: order.requested_by ? order.requested_by.name : 'N/A'
      };
    });

    // Calculate summary
    const totalAmount = formattedInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidAmount = formattedInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
    const pendingAmount = formattedInvoices
      .filter(inv => inv.status !== 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);

    res.json({
      success: true,
      invoices: formattedInvoices,
      summary: {
        totalInvoices: formattedInvoices.length,
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        pendingAmount: pendingAmount
      }
    });

  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch invoices',
      error: error.message 
    });
  }
};

// Get vendor profile (REAL DATA)
const getProfile = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;

    if (!vendorId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User is not linked to a vendor account' 
      });
    }

    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vendor profile not found' 
      });
    }

    // Calculate performance metrics
    const completedOrders = await PurchaseOrder.countDocuments({
      vendor: vendorId,
      status: 'completed'
    });

    const deliveredOrders = await PurchaseOrder.find({
      vendor: vendorId,
      status: 'completed',
      actual_delivery_date: { $exists: true }
    });

    const onTimeDeliveries = deliveredOrders.filter(order => {
      return new Date(order.actual_delivery_date) <= new Date(order.expected_delivery_date);
    }).length;

    const onTimeDeliveryRate = deliveredOrders.length > 0 
      ? Math.round((onTimeDeliveries / deliveredOrders.length) * 100) 
      : 100;

    // Calculate average rating (if available)
    const rating = vendor.rating || 4.5; // Default if no rating system yet

    res.json({
      success: true,
      profile: {
        ...vendor.toObject(),
        performance: {
          total_orders: completedOrders,
          on_time_delivery_rate: onTimeDeliveryRate,
          rating: rating
        }
      }
    });

  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch vendor profile',
      error: error.message 
    });
  }
};

// Update vendor profile (REAL DATA)
const updateProfile = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;

    if (!vendorId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User is not linked to a vendor account' 
      });
    }

    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.rating; // Rating should be calculated, not manually set

    const updatedVendor = await Vendor.findByIdAndUpdate(
      vendorId,
      { ...updateData, updated_at: Date.now() },
      { new: true, runValidators: true }
    );

    if (!updatedVendor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vendor profile not found' 
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedVendor
    });

  } catch (error) {
    console.error('Error updating vendor profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update vendor profile',
      error: error.message 
    });
  }
};

module.exports = {
  getVendorStats,
  getRecentOrders,
  getAllOrders,
  getOrderById,
  getProducts,
  getInvoices,
  getProfile,
  updateProfile
};
