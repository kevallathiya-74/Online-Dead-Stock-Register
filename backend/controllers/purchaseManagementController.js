const PurchaseOrder = require('../models/purchaseOrder');
const PurchaseRequest = require('../models/purchaseRequest');
const Vendor = require('../models/vendor');
const User = require('../models/user');
const AuditLog = require('../models/auditLog');
const Notification = require('../models/notification');

// PURCHASE ORDERS
// Get all purchase orders with filtering
exports.getAllPurchaseOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      vendor_id, 
      department,
      priority,
      date_from,
      date_to,
      search
    } = req.query;
    
    const skip = (page - 1) * limit;

    // Build filter
    let filter = {};
    if (status) filter.status = status;
    if (vendor_id) filter.vendor = vendor_id;
    if (department) filter.department = department;
    if (priority) filter.priority = priority;
    
    if (date_from || date_to) {
      filter.createdAt = {};
      if (date_from) filter.createdAt.$gte = new Date(date_from);
      if (date_to) filter.createdAt.$lte = new Date(date_to);
    }

    if (search) {
      filter.$or = [
        { po_number: { $regex: search, $options: 'i' } },
        { 'items.description': { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const purchaseOrders = await PurchaseOrder.find(filter)
      .populate('vendor', 'name vendor_code contact_person')
      .populate('requested_by', 'name email')
      .populate('approved_by', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PurchaseOrder.countDocuments(filter);

    res.json({
      purchase_orders: purchaseOrders,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_orders: total,
        has_next: page * limit < total,
        has_prev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ message: 'Failed to fetch purchase orders' });
  }
};

// Get purchase order by ID
exports.getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const purchaseOrder = await PurchaseOrder.findById(id)
      .populate('vendor', 'name vendor_code contact_person contact_email contact_phone address')
      .populate('requested_by', 'name email employee_id')
      .populate('approved_by', 'name email')
      .populate('approval_history.performed_by', 'name')
      .populate('received_items.received_by', 'name');

    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    res.json(purchaseOrder);
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({ message: 'Failed to fetch purchase order' });
  }
};

// Create purchase order
exports.createPurchaseOrder = async (req, res) => {
  try {
    const poData = req.body;
    poData.requested_by = req.user.id;

    // Calculate totals
    let subtotal = 0;
    poData.items.forEach(item => {
      item.total_price = item.quantity * item.unit_price;
      subtotal += item.total_price;
    });

    poData.subtotal = subtotal;
    poData.total_amount = subtotal + (poData.tax_amount || 0) + (poData.shipping_cost || 0);

    const purchaseOrder = new PurchaseOrder(poData);
    await purchaseOrder.save();

    // Add to approval history
    purchaseOrder.approval_history.push({
      action: 'submitted',
      performed_by: req.user.id,
      comments: 'Purchase order created',
      timestamp: new Date()
    });
    await purchaseOrder.save();

    // Populate for response
    await purchaseOrder.populate([
      { path: 'vendor', select: 'name vendor_code' },
      { path: 'requested_by', select: 'name email' }
    ]);

    // Create audit log
    const auditLog = new AuditLog({
      action: 'purchase_order_created',
      performed_by: req.user.id,
      details: {
        po_id: purchaseOrder._id,
        po_number: purchaseOrder.po_number,
        vendor_id: purchaseOrder.vendor,
        total_amount: purchaseOrder.total_amount
      },
      timestamp: new Date()
    });
    await auditLog.save();

    // Notify approvers
    const approvers = await User.find({ 
      role: { $in: ['ADMIN', 'INVENTORY_MANAGER'] },
      status: 'active' 
    });

    const notifications = approvers.map(approver => ({
      recipient: approver._id,
      title: 'New Purchase Order Requires Approval',
      message: `Purchase Order ${purchaseOrder.po_number} for ${purchaseOrder.total_amount} requires your approval`,
      type: 'approval',
      priority: poData.priority || 'medium',
      data: {
        po_id: purchaseOrder._id,
        po_number: purchaseOrder.po_number,
        total_amount: purchaseOrder.total_amount
      },
      action_url: `/inventory/purchase-orders/${purchaseOrder._id}`
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      message: 'Purchase order created successfully',
      purchase_order: purchaseOrder
    });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ message: 'Failed to create purchase order' });
  }
};

// Update purchase order status
exports.updatePurchaseOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;

    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    const oldStatus = purchaseOrder.status;
    purchaseOrder.status = status;

    // Add to approval history
    purchaseOrder.approval_history.push({
      action: status,
      performed_by: req.user.id,
      comments: comments || '',
      timestamp: new Date()
    });

    if (status === 'approved') {
      purchaseOrder.approved_by = req.user.id;
    }

    await purchaseOrder.save();

    // Create audit log
    const auditLog = new AuditLog({
      action: 'purchase_order_status_updated',
      performed_by: req.user.id,
      details: {
        po_id: id,
        po_number: purchaseOrder.po_number,
        old_status: oldStatus,
        new_status: status,
        comments
      },
      timestamp: new Date()
    });
    await auditLog.save();

    // Notify requester
    const notification = new Notification({
      recipient: purchaseOrder.requested_by,
      title: `Purchase Order ${status.replace('_', ' ').toUpperCase()}`,
      message: `Your purchase order ${purchaseOrder.po_number} has been ${status.replace('_', ' ')}`,
      type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info',
      priority: 'medium',
      data: {
        po_id: id,
        po_number: purchaseOrder.po_number,
        status
      },
      action_url: `/inventory/purchase-orders/${id}`
    });
    await notification.save();

    res.json({
      message: 'Purchase order status updated successfully',
      purchase_order: {
        id: purchaseOrder._id,
        po_number: purchaseOrder.po_number,
        status: purchaseOrder.status
      }
    });
  } catch (error) {
    console.error('Error updating purchase order status:', error);
    res.status(500).json({ message: 'Failed to update purchase order status' });
  }
};

// PURCHASE REQUESTS
// Get all purchase requests
exports.getAllPurchaseRequests = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      department,
      priority,
      requester_id,
      search
    } = req.query;
    
    const skip = (page - 1) * limit;

    // Build filter
    let filter = {};
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (priority) filter.priority = priority;
    if (requester_id) filter.requester = requester_id;

    if (search) {
      filter.$or = [
        { request_number: { $regex: search, $options: 'i' } },
        { purpose: { $regex: search, $options: 'i' } },
        { 'items.description': { $regex: search, $options: 'i' } }
      ];
    }

    const purchaseRequests = await PurchaseRequest.find(filter)
      .populate('requester', 'name email employee_id')
      .populate('reviewed_by', 'name email')
      .populate('converted_po', 'po_number')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PurchaseRequest.countDocuments(filter);

    res.json({
      purchase_requests: purchaseRequests,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_requests: total,
        has_next: page * limit < total,
        has_prev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching purchase requests:', error);
    res.status(500).json({ message: 'Failed to fetch purchase requests' });
  }
};

// Create purchase request
exports.createPurchaseRequest = async (req, res) => {
  try {
    const requestData = req.body;
    requestData.requester = req.user.id;

    // Calculate total estimated cost
    let totalCost = 0;
    requestData.items.forEach(item => {
      item.estimated_total = item.quantity * item.estimated_unit_price;
      totalCost += item.estimated_total;
    });
    requestData.total_estimated_cost = totalCost;

    const purchaseRequest = new PurchaseRequest(requestData);
    await purchaseRequest.save();

    // Populate for response
    await purchaseRequest.populate('requester', 'name email');

    // Create audit log
    const auditLog = new AuditLog({
      action: 'purchase_request_created',
      performed_by: req.user.id,
      details: {
        request_id: purchaseRequest._id,
        request_number: purchaseRequest.request_number,
        total_cost: purchaseRequest.total_estimated_cost
      },
      timestamp: new Date()
    });
    await auditLog.save();

    res.status(201).json({
      message: 'Purchase request created successfully',
      purchase_request: purchaseRequest
    });
  } catch (error) {
    console.error('Error creating purchase request:', error);
    res.status(500).json({ message: 'Failed to create purchase request' });
  }
};

// Get purchase statistics
exports.getPurchaseStats = async (req, res) => {
  try {
    // Purchase Orders stats
    const poStats = await PurchaseOrder.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total_value: { $sum: '$total_amount' }
        }
      }
    ]);

    // Purchase Requests stats
    const prStats = await PurchaseRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total_value: { $sum: '$total_estimated_cost' }
        }
      }
    ]);

    // Monthly spending trends
    const monthlySpending = await PurchaseOrder.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'partially_received'] },
          createdAt: { $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total_spent: { $sum: '$total_amount' },
          order_count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Top vendors by spending
    const topVendors = await PurchaseOrder.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'partially_received'] }
        }
      },
      {
        $group: {
          _id: '$vendor',
          total_spent: { $sum: '$total_amount' },
          order_count: { $sum: 1 }
        }
      },
      { $sort: { total_spent: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'vendors',
          localField: '_id',
          foreignField: '_id',
          as: 'vendor_info'
        }
      }
    ]);

    res.json({
      purchase_orders: {
        status_breakdown: poStats,
        total_orders: poStats.reduce((sum, stat) => sum + stat.count, 0),
        total_value: poStats.reduce((sum, stat) => sum + stat.total_value, 0)
      },
      purchase_requests: {
        status_breakdown: prStats,
        total_requests: prStats.reduce((sum, stat) => sum + stat.count, 0),
        total_estimated_value: prStats.reduce((sum, stat) => sum + stat.total_value, 0)
      },
      monthly_spending: monthlySpending,
      top_vendors: topVendors
    });
  } catch (error) {
    console.error('Error fetching purchase stats:', error);
    res.status(500).json({ message: 'Failed to fetch purchase statistics' });
  }
};