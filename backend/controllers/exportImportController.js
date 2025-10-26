const Asset = require('../models/asset');
const fs = require('fs');
const path = require('path');

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
    const { type, format = 'json' } = req.query;
    
    let data;
    switch (type) {
      case 'assets':
        data = await Asset.find({})
          .populate('assigned_user', 'name email')
          .select('-__v')
          .lean();
        
        // Flatten populated fields for CSV
        if (format === 'csv') {
          data = data.map(asset => ({
            ...asset,
            assigned_user_name: asset.assigned_user?.name || '',
            assigned_user_email: asset.assigned_user?.email || '',
            assigned_user: asset.assigned_user?._id || ''
          }));
        }
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type'
        });
    }

    if (format === 'json') {
      res.json({
        success: true,
        data,
        count: data.length
      });
    } else if (format === 'csv') {
      const csv = jsonToCSV(data);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_export_${Date.now()}.csv"`);
      res.send(csv);
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid format. Use json or csv'
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
          if (!asset.name || !asset.category) {
            errors.push({
              row: i + 1,
              error: 'Missing required fields: name or category',
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
