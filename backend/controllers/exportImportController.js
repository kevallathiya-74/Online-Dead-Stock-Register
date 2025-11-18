const Asset = require('../models/asset');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const logger = require('../utils/logger');

// Helper function to convert JSON to CSV
const jsonToCSV = (data) => {
  if (!data || data.length === 0) {
    return '';
  }

  // Get all unique keys from all objects
  const allKeys = new Set();
  data.forEach(item => {
    Object.keys(item).forEach(key => {
      if (key !== '_id' && key !== '__v') {
        allKeys.add(key);
      }
    });
  });

  const keys = Array.from(allKeys);
  
  // Create CSV header
  const header = keys.join(',');
  
  // Create CSV rows
  const rows = data.map(item => {
    return keys.map(key => {
      let value = item[key];
      
      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      }
      
      // Handle dates
      if (value instanceof Date) {
        value = value.toISOString();
      }
      
      // Handle objects and arrays
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      
      // Convert to string and escape
      value = String(value);
      
      // Escape quotes and wrap in quotes if contains comma, newline, or quote
      if (value.includes(',') || value.includes('\n') || value.includes('"')) {
        value = '"' + value.replace(/"/g, '""') + '"';
      }
      
      return value;
    }).join(',');
  });
  
  return [header, ...rows].join('\n');
};

// Export data
exports.exportData = async (req, res) => {
  try {
    const { format = 'xlsx', includeAssets, includeUsers, includeTransactions, includeVendors } = req.body;
    const User = require('../models/user');
    const Transaction = require('../models/transaction');
    const Vendor = require('../models/vendor');
    const logger = require('../utils/logger');
    
    let exportData = {
      exportDate: new Date().toISOString(),
      exportedBy: req.user?.email || 'System',
      data: {}
    };

    // Export Assets
    if (includeAssets) {
      const assets = await Asset.find({})
        .populate('assigned_user', 'name email')
        .select('-__v')
        .lean();
      
      exportData.data.assets = assets.map(asset => ({
        id: asset._id,
        unique_asset_id: asset.unique_asset_id,
        manufacturer: asset.manufacturer,
        model: asset.model,
        serial_number: asset.serial_number,
        asset_type: asset.asset_type,
        location: asset.location,
        status: asset.status,
        department: asset.department,
        purchase_date: asset.purchase_date,
        purchase_cost: asset.purchase_cost,
        warranty_expiry: asset.warranty_expiry,
        assigned_user: asset.assigned_user?.name || '',
        assigned_user_email: asset.assigned_user?.email || '',
        condition: asset.condition,
        last_audit_date: asset.last_audit_date,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt
      }));
    }

    // Export Users
    if (includeUsers) {
      const users = await User.find({})
        .select('-password -resetPasswordToken -resetPasswordExpires -__v')
        .lean();
      
      exportData.data.users = users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        employee_id: user.employee_id,
        phone: user.phone,
        is_active: user.is_active,
        last_login: user.last_login,
        created_at: user.created_at,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));
    }

    // Export Transactions
    if (includeTransactions) {
      const transactions = await Transaction.find({})
        .populate('asset_id', 'unique_asset_id manufacturer model')
        .populate('from_user', 'name email')
        .populate('to_user', 'name email')
        .populate('approved_by', 'name email')
        .select('-__v')
        .lean();
      
      exportData.data.transactions = transactions.map(txn => ({
        id: txn._id,
        transaction_type: txn.transaction_type,
        asset_id: txn.asset_id?.unique_asset_id || '',
        asset_info: txn.asset_id ? `${txn.asset_id.manufacturer} ${txn.asset_id.model}` : '',
        from_user: txn.from_user?.name || '',
        from_user_email: txn.from_user?.email || '',
        to_user: txn.to_user?.name || '',
        to_user_email: txn.to_user?.email || '',
        from_location: txn.from_location,
        to_location: txn.to_location,
        quantity: txn.quantity,
        transaction_date: txn.transaction_date,
        status: txn.status,
        approved_by: txn.approved_by?.name || '',
        notes: txn.notes,
        createdAt: txn.createdAt
      }));
    }

    // Export Vendors
    if (includeVendors) {
      const vendors = await Vendor.find({})
        .select('-__v')
        .lean();
      
      exportData.data.vendors = vendors.map(vendor => ({
        id: vendor._id,
        vendor_name: vendor.vendor_name,
        contact_person: vendor.contact_person,
        email: vendor.email,
        phone: vendor.phone,
        address_street: vendor.address?.street || '',
        address_city: vendor.address?.city || '',
        address_state: vendor.address?.state || '',
        address_zip: vendor.address?.zip_code || '',
        address_country: vendor.address?.country || '',
        payment_terms: vendor.payment_terms,
        is_active: vendor.is_active,
        created_at: vendor.created_at
      }));
    }

    // Calculate statistics
    exportData.statistics = {
      totalAssets: exportData.data.assets?.length || 0,
      totalUsers: exportData.data.users?.length || 0,
      totalTransactions: exportData.data.transactions?.length || 0,
      totalVendors: exportData.data.vendors?.length || 0
    };

    logger.info('Data export completed', {
      userId: req.user.id,
      format,
      stats: exportData.statistics
    });

    // Return based on format
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="system-export-${Date.now()}.json"`);
      res.json(exportData);
    } else if (format === 'xlsx' || format === 'excel') {
      // Create Excel workbook
      const workbook = XLSX.utils.book_new();
      
      // Add Assets sheet
      if (exportData.data.assets && exportData.data.assets.length > 0) {
        const assetsSheet = XLSX.utils.json_to_sheet(exportData.data.assets);
        XLSX.utils.book_append_sheet(workbook, assetsSheet, 'Assets');
      }
      
      // Add Users sheet
      if (exportData.data.users && exportData.data.users.length > 0) {
        const usersSheet = XLSX.utils.json_to_sheet(exportData.data.users);
        XLSX.utils.book_append_sheet(workbook, usersSheet, 'Users');
      }
      
      // Add Transactions sheet
      if (exportData.data.transactions && exportData.data.transactions.length > 0) {
        const transactionsSheet = XLSX.utils.json_to_sheet(exportData.data.transactions);
        XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions');
      }
      
      // Add Vendors sheet
      if (exportData.data.vendors && exportData.data.vendors.length > 0) {
        const vendorsSheet = XLSX.utils.json_to_sheet(exportData.data.vendors);
        XLSX.utils.book_append_sheet(workbook, vendorsSheet, 'Vendors');
      }
      
      // Add Summary sheet
      const summaryData = [
        { Field: 'Export Date', Value: exportData.exportDate },
        { Field: 'Exported By', Value: exportData.exportedBy },
        { Field: 'Total Assets', Value: exportData.statistics.totalAssets },
        { Field: 'Total Users', Value: exportData.statistics.totalUsers },
        { Field: 'Total Transactions', Value: exportData.statistics.totalTransactions },
        { Field: 'Total Vendors', Value: exportData.statistics.totalVendors }
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Generate buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      // Send file
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="system-export-${Date.now()}.xlsx"`);
      res.send(excelBuffer);
    } else if (format === 'csv') {
      // Create CSV with summary and data sections
      let csvContent = '';
      
      // Add export summary
      csvContent += '=== EXPORT SUMMARY ===\n';
      csvContent += `Export Date,${exportData.exportDate}\n`;
      csvContent += `Exported By,${exportData.exportedBy}\n`;
      csvContent += `Total Assets,${exportData.statistics.totalAssets}\n`;
      csvContent += `Total Users,${exportData.statistics.totalUsers}\n`;
      csvContent += `Total Transactions,${exportData.statistics.totalTransactions}\n`;
      csvContent += `Total Vendors,${exportData.statistics.totalVendors}\n`;
      csvContent += '\n\n';
      
      // Add Assets data
      if (exportData.data.assets && exportData.data.assets.length > 0) {
        csvContent += '=== ASSETS ===\n';
        csvContent += jsonToCSV(exportData.data.assets);
        csvContent += '\n\n';
      }
      
      // Add Users data
      if (exportData.data.users && exportData.data.users.length > 0) {
        csvContent += '=== USERS ===\n';
        csvContent += jsonToCSV(exportData.data.users);
        csvContent += '\n\n';
      }
      
      // Add Transactions data
      if (exportData.data.transactions && exportData.data.transactions.length > 0) {
        csvContent += '=== TRANSACTIONS ===\n';
        csvContent += jsonToCSV(exportData.data.transactions);
        csvContent += '\n\n';
      }
      
      // Add Vendors data
      if (exportData.data.vendors && exportData.data.vendors.length > 0) {
        csvContent += '=== VENDORS ===\n';
        csvContent += jsonToCSV(exportData.data.vendors);
        csvContent += '\n';
      }
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="system-export-${Date.now()}.csv"`);
      res.send(csvContent);
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid format. Use json, xlsx, or csv'
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export data',
      error: error.message
    });
  }
};

// Helper function to parse CSV to JSON
const csvToJSON = (csvString) => {
  const lines = csvString.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header and one data row');
  }
  
  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    // Parse CSV with proper quote handling
    for (let char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
    
    // Create object
    const obj = {};
    headers.forEach((header, index) => {
      let value = values[index] || '';
      
      // Try to parse JSON objects/arrays
      if (value.startsWith('{') || value.startsWith('[')) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // Keep as string if parse fails
        }
      }
      
      // Convert empty strings to null
      if (value === '') {
        value = null;
      }
      
      obj[header] = value;
    });
    
    data.push(obj);
  }
  
  return data;
};

// Import data
exports.importData = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Read file content
    const filePath = req.file.path;
    let fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Determine format from file extension or request body
    const format = req.body.format || (req.file.originalname.endsWith('.csv') ? 'csv' : 'json');
    const type = req.body.type || 'assets'; // Default to assets
    
    let importData;
    
    try {
      if (format === 'csv') {
        // Parse CSV string to JSON
        importData = csvToJSON(fileContent);
      } else {
        // JSON format
        importData = JSON.parse(fileContent);
        if (!Array.isArray(importData)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid JSON format. Must be an array of objects'
          });
        }
      }
    } catch (parseError) {
      // Clean up uploaded file
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: `Failed to parse ${format.toUpperCase()} file: ${parseError.message}`
      });
    }

    let result;
    const errors = [];
    
    switch (type) {
      case 'assets':
        // Validate and import with error handling
        const validAssets = [];
        
        for (let i = 0; i < importData.length; i++) {
          const asset = importData[i];
          
          // Basic validation
          if (!asset.name || !asset.asset_type) {
            errors.push({
              row: i + 1,
              error: 'Missing required fields: name or asset_type',
              data: asset
            });
            continue;
          }
          
          validAssets.push(asset);
        }
        
        if (validAssets.length > 0) {
          result = await Asset.insertMany(validAssets, { ordered: false });
        } else {
          return res.status(400).json({
            success: false,
            message: 'No valid assets to import',
            errors
          });
        }
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid import type'
        });
    }

    // Clean up uploaded file after successful import
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Failed to delete temp file:', err);
    }

    res.json({
      success: true,
      message: `Successfully imported ${result.length} records`,
      imported: result.length,
      errors: errors.length > 0 ? errors.map(e => e.error) : undefined
    });
  } catch (error) {
    console.error('Import error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Failed to delete temp file:', err);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to import data',
      error: error.message
    });
  }
};
