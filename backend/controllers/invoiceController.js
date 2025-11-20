const Invoice = require('../models/invoice');
const PurchaseOrder = require('../models/purchaseOrder');
const logger = require('../utils/logger');

/**
 * Get all invoices with filters and pagination
 */
exports.getAllInvoices = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, vendor, search } = req.query;
    
    const query = {};
    
    // Status filter
    if (status && status !== 'All') {
      query.status = status.toLowerCase();
    }
    
    // Vendor filter
    if (vendor) {
      query.vendor = vendor;
    }
    
    // Search by invoice number
    if (search) {
      query.invoice_number = { $regex: search, $options: 'i' };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate('vendor', 'vendor_name contact_person email phone')
        .populate('purchase_order', 'po_number status')
        .populate('created_by', 'name email')
        .populate('approved_by', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Invoice.countDocuments(query)
    ]);
    
    res.status(200).json({
      success: true,
      data: invoices,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_invoices: total,
        has_next: skip + invoices.length < total,
        has_prev: parseInt(page) > 1
      }
    });
  } catch (error) {
    logger.error('Error fetching invoices:', error);
    next(error);
  }
};

/**
 * Get invoice by ID
 */
exports.getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('vendor', 'vendor_name contact_person email phone address payment_terms')
      .populate('purchase_order')
      .populate('created_by', 'name email')
      .populate('approved_by', 'name email')
      .lean();
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    logger.error('Error fetching invoice:', error);
    next(error);
  }
};

/**
 * Create new invoice
 */
exports.createInvoice = async (req, res, next) => {
  try {
    const {
      purchase_order,
      vendor,
      invoice_date,
      due_date,
      items,
      subtotal,
      tax_amount,
      total_amount,
      payment_method,
      vendor_gstin,
      notes
    } = req.body;
    
    // Validate required fields
    if (!purchase_order || !vendor || !due_date || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: purchase_order, vendor, due_date, and items are required'
      });
    }
    
    // Verify purchase order exists
    const po = await PurchaseOrder.findById(purchase_order);
    if (!po) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }
    
    const invoice = new Invoice({
      purchase_order,
      vendor,
      invoice_date: invoice_date || new Date(),
      due_date,
      items,
      subtotal: subtotal || items.reduce((sum, item) => sum + item.total_amount, 0),
      tax_amount: tax_amount || 0,
      total_amount: total_amount || subtotal + (tax_amount || 0),
      payment_method: payment_method || 'bank_transfer',
      vendor_gstin: vendor_gstin || '',
      notes: notes || '',
      created_by: req.user._id,
      status: 'draft'
    });
    
    await invoice.save();
    
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('vendor', 'vendor_name contact_person email')
      .populate('purchase_order', 'po_number')
      .populate('created_by', 'name email')
      .lean();
    
    logger.info(`Invoice ${invoice.invoice_number} created by user ${req.user.email}`);
    
    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: populatedInvoice
    });
  } catch (error) {
    logger.error('Error creating invoice:', error);
    next(error);
  }
};

/**
 * Update invoice status
 */
exports.updateInvoiceStatus = async (req, res, next) => {
  try {
    const { status, payment_date, payment_reference } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    const validStatuses = ['draft', 'sent', 'received', 'approved', 'paid', 'overdue', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    const updateData = { status };
    
    if (status === 'paid') {
      updateData.payment_date = payment_date || new Date();
      if (payment_reference) {
        updateData.payment_reference = payment_reference;
      }
    }
    
    if (status === 'approved') {
      updateData.approved_by = req.user._id;
    }
    
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('vendor', 'vendor_name contact_person email')
      .populate('purchase_order', 'po_number')
      .lean();
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    logger.info(`Invoice ${invoice.invoice_number} status updated to ${status} by user ${req.user.email}`);
    
    res.status(200).json({
      success: true,
      message: `Invoice status updated to ${status}`,
      data: invoice
    });
  } catch (error) {
    logger.error('Error updating invoice status:', error);
    next(error);
  }
};

/**
 * Delete invoice (soft delete)
 */
exports.deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    logger.info(`Invoice ${invoice.invoice_number} deleted by user ${req.user.email}`);
    
    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting invoice:', error);
    next(error);
  }
};

/**
 * Get invoice statistics
 */
exports.getInvoiceStats = async (req, res, next) => {
  try {
    const [
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalRevenue
    ] = await Promise.all([
      Invoice.countDocuments(),
      Invoice.countDocuments({ status: 'paid' }),
      Invoice.countDocuments({ status: { $in: ['draft', 'sent', 'received', 'approved'] } }),
      Invoice.countDocuments({ 
        status: { $nin: ['paid', 'cancelled'] },
        due_date: { $lt: new Date() }
      }),
      Invoice.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total_amount' } } }
      ])
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        total_invoices: totalInvoices,
        paid_invoices: paidInvoices,
        pending_invoices: pendingInvoices,
        overdue_invoices: overdueInvoices,
        total_revenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0
      }
    });
  } catch (error) {
    logger.error('Error fetching invoice stats:', error);
    next(error);
  }
};
