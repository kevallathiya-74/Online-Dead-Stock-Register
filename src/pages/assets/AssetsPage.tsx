import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Menu,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Checkbox,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  QrCode as QrCodeIcon,
  SwapHoriz as TransferIcon,
  Print as PrintIcon,
  Upload as UploadIcon,
  MoreVert as MoreIcon,
  Inventory as InventoryIcon,
  Computer as ComputerIcon,
  Smartphone as SmartphoneIcon,
  Print as PrinterIcon,
  Chair as FurnitureIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import assetUpdateService from '../../services/assetUpdateService';

interface Asset {
  _id?: string;
  id?: string;
  unique_asset_id: string;
  name?: string;
  asset_type: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  status: 'Active' | 'Available' | 'Under Maintenance' | 'Damaged' | 'Ready for Scrap' | 'Disposed';
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Obsolete' | 'Beyond Repair';
  location: string;
  assigned_user?: string | { _id: string; name: string; email: string };
  purchase_date: string;
  purchase_cost: number;
  warranty_expiry?: string;
  last_audit_date?: string;
  last_audited_by?: {
    _id?: string;
    name: string;
    email: string;
  } | string;
  department?: string;
  vendor?: string | { _id: string; vendor_name: string };
}

const AssetsPage = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [newAssetQrDialogOpen, setNewAssetQrDialogOpen] = useState(false);
  const [newlyCreatedAsset, setNewlyCreatedAsset] = useState<Asset | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [transferData, setTransferData] = useState({
    to_location: '',
    to_user: '',
    notes: ''
  });
  const [stats, setStats] = useState({
    totalAssets: 0,
    activeAssets: 0,
    underMaintenance: 0,
    totalValue: 0,
  });
  const [formData, setFormData] = useState({
    unique_asset_id: '',
    name: '',
    asset_type: '',
    manufacturer: '',
    model: '',
    serial_number: '',
    location: '',
    purchase_date: '',
    purchase_cost: '',  // ✅ Fixed: Changed from purchase_value to purchase_cost
    status: 'Active',
    condition: 'Good',
    department: '',
  });
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  // Load assets and categories from API on component mount
  useEffect(() => {
    loadAssets();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get('/assets/categories');
      if (response.data.success && response.data.data) {
        // Extract unique asset_type values from the database categories
        const assetTypes = response.data.data
          .map((cat: any) => cat.asset_type)
          .filter((type: string) => type); // Remove any null/undefined
        const uniqueTypes = Array.from(new Set(assetTypes));
        setCategories(uniqueTypes as string[]);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      // Fallback to some basic categories if API fails
      setCategories(['Computer', 'Laptop', 'Monitor', 'Printer', 'Scanner', 'Other']);
    }
  };

  // Subscribe to global asset updates (any asset changes)
  useEffect(() => {
    console.log('📡 AssetsPage: Subscribing to global asset updates');
    
    const unsubscribe = assetUpdateService.subscribeGlobal((assetId, updateData) => {
      console.log('🔔 AssetsPage: Received global update for asset:', assetId, updateData);
      
      // Refresh the entire assets list to get latest data
      loadAssets();
      
      // Show a subtle notification
      if (updateData?.type === 'audit_completed') {
        toast.info('Asset list updated - audit completed', {
          position: 'bottom-right',
          autoClose: 2000,
        });
      }
    });

    return () => {
      console.log('📡 AssetsPage: Unsubscribing from global updates');
      unsubscribe();
    };
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      
      // Fetch both assets and stats in parallel
      const [assetsResponse, statsResponse] = await Promise.all([
        api.get('/assets'),
        api.get('/assets/stats')
      ]);
      
      // Handle new API response format with pagination
      const apiData = assetsResponse.data.data || assetsResponse.data;
      const assetsArray = apiData.data || apiData;
      
      // Transform backend data to match frontend interface
      const transformedAssets = Array.isArray(assetsArray) ? assetsArray.map((asset: any) => {
        // Handle assigned_user - it might be a string, object, or null
        let assignedUserName = '';
        if (asset.assigned_user) {
          if (typeof asset.assigned_user === 'object') {
            assignedUserName = asset.assigned_user.name || '';
          } else {
            assignedUserName = asset.assigned_user;
          }
        } else if (asset.assigned_to) {
          if (typeof asset.assigned_to === 'object') {
            assignedUserName = asset.assigned_to.name || '';
          } else {
            assignedUserName = asset.assigned_to;
          }
        }

        return {
          _id: asset._id || asset.id, // Keep _id for API calls
          id: asset._id || asset.id,
          unique_asset_id: asset.unique_asset_id,
          name: asset.name || `${asset.manufacturer} ${asset.model}`,
          asset_type: asset.asset_type,
          manufacturer: asset.manufacturer,
          model: asset.model,
          serial_number: asset.serial_number,
          status: asset.status,
          condition: asset.condition,
          location: asset.location,
          assigned_user: assignedUserName,
          purchase_date: asset.purchase_date,
          purchase_cost: asset.purchase_cost,
          warranty_expiry: asset.warranty_expiry,
          last_audit_date: asset.last_audit_date,
          last_audited_by: asset.last_audited_by, // Include audit user info
          department: asset.department,
          vendor: asset.vendor,
        };
      }) : [];
      
      setAssets(transformedAssets);
      
      // Update stats from API - DYNAMIC!
      if (statsResponse.data.success && statsResponse.data.data) {
        setStats({
          totalAssets: statsResponse.data.data.totalAssets,
          activeAssets: statsResponse.data.data.activeAssets,
          underMaintenance: statsResponse.data.data.underMaintenance,
          totalValue: statsResponse.data.data.totalValue,
        });
      }
    } catch (error) {
      console.error('Failed to load assets:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to load assets';
      toast.error(errorMsg);
      setAssets([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Handler functions for asset actions
  const handleViewAsset = async (asset: Asset) => {
    console.log('Viewing asset:', asset);
    setViewDialogOpen(true);
    
    // Show loading state with current asset data
    setSelectedAsset(asset);
    
    // Close menu only if it's open
    if (anchorEl) {
      setAnchorEl(null);
    }
    
    // Fetch latest asset data from server
    try {
      const response = await api.get(`/assets/${asset._id}`);
      if (response.data.success) {
        console.log('Fetched latest asset data:', response.data.data);
        setSelectedAsset(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch latest asset data:', error);
      // Keep using the cached data if fetch fails
      toast.warning('Showing cached data. Failed to fetch latest updates.');
    }
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    // Don't clear selectedAsset immediately to avoid UI flicker
    setTimeout(() => {
      setSelectedAsset(null);
    }, 200);
  };

  const handleCloseQRDialog = () => {
    setQrDialogOpen(false);
    // Clear QR code URL and selected asset after animation
    setTimeout(() => {
      setQrCodeUrl('');
      setSelectedAsset(null);
    }, 200);
  };

  const handleCloseTransferDialog = () => {
    setTransferDialogOpen(false);
    // Clear transfer data and selected asset after animation
    setTimeout(() => {
      setTransferData({ to_location: '', to_user: '', notes: '' });
      setSelectedAsset(null);
    }, 200);
  };

  const handleAddAsset = async () => {
    try {
      // Validation
      if (!formData.unique_asset_id || !formData.manufacturer || !formData.model || 
          !formData.serial_number || !formData.asset_type || !formData.department) {
        toast.error('Please fill in all required fields: Asset ID, Manufacturer, Model, Serial Number, Category, and Department');
        return;
      }

      const payload = {
        unique_asset_id: formData.unique_asset_id,
        manufacturer: formData.manufacturer,
        model: formData.model,
        serial_number: formData.serial_number,
        asset_type: formData.asset_type,
        department: formData.department,
        location: formData.location || 'Unknown',
        purchase_date: formData.purchase_date || new Date().toISOString(),
        purchase_cost: formData.purchase_cost ? Number(formData.purchase_cost) : 0,  // ✅ Fixed
        status: formData.status,
        condition: formData.condition,
      };

      const response = await api.post('/assets', payload);
      const createdAsset = response.data.data || response.data;
      
      toast.success('Asset added successfully');
      setAddDialogOpen(false);
      resetForm();
      
      // Generate and show QR code for the new asset
      const fullAssetData = {
        id: createdAsset._id || createdAsset.id,
        unique_asset_id: createdAsset.unique_asset_id,
        name: `${createdAsset.manufacturer} ${createdAsset.model}`,
        category: createdAsset.asset_type,
        asset_type: createdAsset.asset_type,
        manufacturer: createdAsset.manufacturer,
        model: createdAsset.model,
        serial_number: createdAsset.serial_number,
        status: createdAsset.status,
        condition: createdAsset.condition,
        location: createdAsset.location,
        purchase_date: createdAsset.purchase_date,
        purchase_cost: createdAsset.purchase_cost,  // ✅ Fixed
        department: createdAsset.department
      };
      
      // Create comprehensive QR data with all asset details
      const qrData = JSON.stringify({
        type: 'asset',
        id: fullAssetData.id,
        asset_id: fullAssetData.unique_asset_id,
        name: fullAssetData.name,
        manufacturer: fullAssetData.manufacturer,
        model: fullAssetData.model,
        serial: fullAssetData.serial_number,
        asset_type: fullAssetData.asset_type,
        location: fullAssetData.location,
        status: fullAssetData.status,
        condition: fullAssetData.condition,
        purchase_date: fullAssetData.purchase_date,
        purchase_cost: fullAssetData.purchase_cost,  // ✅ Fixed
        department: fullAssetData.department,
        scan_url: `${window.location.origin}/assets/${fullAssetData.id}`
      });
      
      setQrCodeUrl(qrData);
      setNewlyCreatedAsset(fullAssetData as any);
      setNewAssetQrDialogOpen(true);
      
      await loadAssets();
    } catch (error: any) {
      console.error('Failed to add asset:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to add asset';
      toast.error(errorMsg);
    }
  };

  const handleEditAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setFormData({
      unique_asset_id: asset.unique_asset_id,
      name: asset.name || '',
      asset_type: asset.asset_type || '',
      manufacturer: asset.manufacturer,
      model: asset.model,
      serial_number: asset.serial_number,
      location: asset.location,
      purchase_date: asset.purchase_date?.split('T')[0] || '',
      purchase_cost: asset.purchase_cost?.toString() || '',  // ✅ Fixed
      status: asset.status,
      condition: asset.condition,
      department: '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdateAsset = async () => {
    if (!selectedAsset) return;

    try {
      const payload = {
        manufacturer: formData.manufacturer,
        model: formData.model,
        serial_number: formData.serial_number,
        asset_type: formData.asset_type,
        location: formData.location,
        purchase_date: formData.purchase_date,
        purchase_cost: formData.purchase_cost ? Number(formData.purchase_cost) : undefined,  // ✅ Fixed
        status: formData.status,
        condition: formData.condition,
      };

      await api.put(`/assets/${selectedAsset.id}`, payload);
      toast.success('Asset updated successfully');
      setEditDialogOpen(false);
      resetForm();
      await loadAssets();
    } catch (error: any) {
      console.error('Failed to update asset:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to update asset';
      toast.error(errorMsg);
    }
  };

  const resetForm = () => {
    setFormData({
      unique_asset_id: '',
      name: '',
      asset_type: '',
      manufacturer: '',
      model: '',
      serial_number: '',
      location: '',
      purchase_date: '',
      purchase_cost: '',  // ✅ Fixed
      status: 'Active',
      condition: 'Good',
      department: '',
    });
    setSelectedAsset(null);
  };

  const handleBulkImport = () => {
    setBulkImportOpen(true);
  };

  const handleImportFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
        toast.error('Please select a CSV or Excel file');
        return;
      }
      
      setImportFile(file);
    }
  };

  const handleBulkImportSubmit = async () => {
    if (!importFile) {
      toast.error('Please select a file to import');
      return;
    }

    try {
      setImporting(true);
      
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await api.post('/assets/bulk-import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const { imported, failed, total } = response.data.data;
        toast.success(`Successfully imported ${imported} out of ${total} assets${failed > 0 ? `. ${failed} failed.` : ''}`);
        
        setBulkImportOpen(false);
        setImportFile(null);
        
        // Refresh assets list
        await loadAssets();
      }
    } catch (error: any) {
      console.error('Failed to import assets:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to import assets';
      toast.error(errorMsg);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Create CSV template
    const headers = ['unique_asset_id', 'manufacturer', 'model', 'serial_number', 'asset_type', 'department', 'location', 'purchase_date', 'purchase_cost', 'status', 'condition'];
    const sampleRow = ['AST-001', 'Dell', 'Latitude 5520', 'SN123456', 'IT Equipment', 'IT Department', 'Office 101', '2024-01-01', '50000', 'Active', 'Good'];
    
    const csvContent = [
      headers.join(','),
      sampleRow.join(','),
      '# Add your assets below this line (one per row)',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'asset_import_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    toast.success('Template downloaded successfully');
  };

  const handleDeleteAsset = async (asset: Asset) => {
    if (window.confirm(`Are you sure you want to delete asset: ${asset.name}?`)) {
      try {
        console.log('Deleting asset via API:', asset.id);
        
        // Call API to delete asset
        await api.delete(`/assets/${asset.id}`);
        
        // Update local state
        setAssets(prevAssets => prevAssets.filter(a => a.id !== asset.id));
        
        toast.success(`Asset "${asset.name}" has been successfully deleted.`);
        
        // Reload assets to ensure consistency with backend
        await loadAssets();
      } catch (error: any) {
        console.error('Failed to delete asset:', error);
        const errorMsg = error.response?.data?.message || error.message || 'Failed to delete asset';
        toast.error(errorMsg);
      }
    }
    handleMenuClose();
  };

  const handleTransferAsset = (asset: Asset) => {
    console.log('Transfer asset:', asset);
    setSelectedAsset(asset);
    setTransferDialogOpen(true);

    if (anchorEl) {
      setAnchorEl(null);
    }
  };

  const handleTransferSubmit = async () => {
    console.log('Transfer submit - selectedAsset:', selectedAsset);
    console.log('Transfer submit - transferData:', transferData);
    
    if (!selectedAsset || !transferData.to_location) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      // Prepare update payload
      const updatePayload: any = {
        location: transferData.to_location,
      };
      
      // Only include assigned_user if it's being changed
      if (transferData.to_user && transferData.to_user.trim() !== '') {
        updatePayload.assigned_user = transferData.to_user;
      }
      
      console.log('Update payload:', updatePayload);
      
      // Update asset location directly
      const response = await api.put(`/assets/${selectedAsset.id}`, updatePayload);
      
      console.log('Transfer successful:', response.data);

      // Build success message
      let successMsg = ` Asset transferred to ${transferData.to_location}`;
      if (transferData.to_user) {
        successMsg += `\n Assigned to ${transferData.to_user}`;
      }
      successMsg += '\n Audit log created';
      
      toast.success(successMsg);
      handleCloseTransferDialog();
      loadAssets(); // Reload assets to show updated location
    } catch (error: any) {
      console.error('Failed to transfer asset:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to transfer asset';
      toast.error(errorMessage);
    }
  };

  const handleGenerateQR = async (asset: Asset) => {
    try {
      console.log('Generating QR for asset:', asset);
      // Ensure asset has a name (fallback to manufacturer + model if needed)
      const assetName = asset.name || `${asset.manufacturer} ${asset.model}`;
      
      // Use unique_asset_id as QR code value - this is what backend expects for scanning
      // Backend API endpoint: GET /api/v1/qr/scan/:qrCode
      const qrData = asset.unique_asset_id;
      
      console.log('QR Data (unique_asset_id):', qrData);
      
      setQrCodeUrl(qrData);
      setSelectedAsset({ ...asset, name: assetName });
      
      // Use setTimeout to ensure state is updated before opening dialog
      setTimeout(() => {
        setQrDialogOpen(true);
      }, 0);
      
      // Close menu only if it's open
      if (anchorEl) {
        setAnchorEl(null);
      }
      
      toast.success(`QR Code generated for: ${assetName}`);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  const handlePrintLabel = async (asset: Asset) => {
    try {
      // Use unique_asset_id as QR code value - this is what backend expects for scanning
      const qrData = asset.unique_asset_id;

      // Create a printable label with QR code
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Asset Label - ${asset.unique_asset_id}</title>
              <meta charset="UTF-8">
              <style>
                @page {
                  size: 4in 2in;
                  margin: 0;
                }
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                body { 
                  font-family: 'Arial', sans-serif;
                  padding: 0.25in;
                  background: white;
                }
                .label-container {
                  width: 100%;
                  height: 100%;
                  border: 3px solid #000;
                  padding: 10px;
                  display: flex;
                  gap: 10px;
                }
                .label-content {
                  flex: 1;
                  display: flex;
                  flex-direction: column;
                  justify-content: space-between;
                }
                .label-header {
                  border-bottom: 2px solid #333;
                  padding-bottom: 5px;
                  margin-bottom: 8px;
                }
                .label-title {
                  font-size: 16px;
                  font-weight: bold;
                  margin-bottom: 2px;
                  color: #000;
                }
                .asset-id {
                  font-size: 14px;
                  font-weight: bold;
                  font-family: 'Courier New', monospace;
                  color: #1976d2;
                  letter-spacing: 1px;
                }
                .label-details {
                  flex: 1;
                }
                .detail-row {
                  margin: 4px 0;
                  font-size: 10px;
                  line-height: 1.3;
                }
                .detail-label {
                  font-weight: bold;
                  color: #555;
                  display: inline-block;
                  width: 60px;
                }
                .detail-value {
                  color: #000;
                }
                .label-footer {
                  border-top: 1px solid #ddd;
                  padding-top: 5px;
                  font-size: 8px;
                  color: #666;
                  text-align: center;
                }
                .qr-section {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  padding: 5px;
                  border-left: 2px solid #ddd;
                }
                #qr-code {
                  margin-bottom: 5px;
                }
                .qr-label {
                  font-size: 8px;
                  color: #666;
                  text-align: center;
                  font-weight: bold;
                }
                .status-badge {
                  display: inline-block;
                  padding: 2px 8px;
                  border-radius: 3px;
                  font-size: 9px;
                  font-weight: bold;
                  background: ${asset.status === 'Active' ? '#4caf50' : '#ff9800'};
                  color: white;
                  margin-left: 5px;
                }
                @media print {
                  body {
                    background: white;
                  }
                  .no-print {
                    display: none !important;
                  }
                }
              </style>
              <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
            </head>
            <body>
              <div class="label-container">
                <div class="label-content">
                  <div class="label-header">
                    <div class="label-title">${asset.name || `${asset.manufacturer} ${asset.model}`}</div>
                    <div class="asset-id">${asset.unique_asset_id}</div>
                  </div>
                  
                  <div class="label-details">
                    <div class="detail-row">
                      <span class="detail-label">Category:</span>
                      <span class="detail-value">${asset.asset_type || 'N/A'}</span>
                      <span class="status-badge">${asset.status}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Mfr:</span>
                      <span class="detail-value">${asset.manufacturer}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Model:</span>
                      <span class="detail-value">${asset.model}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Serial:</span>
                      <span class="detail-value">${asset.serial_number}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Location:</span>
                      <span class="detail-value">${asset.location}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Assigned:</span>
                      <span class="detail-value">${asset.assigned_user || 'Unassigned'}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Purchase:</span>
                      <span class="detail-value">${asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div class="label-footer">
                    Dead Stock Register • Generated: ${new Date().toLocaleString()}
                  </div>
                </div>
                
                <div class="qr-section">
                  <div id="qr-code"></div>
                  <div class="qr-label">SCAN ME</div>
                </div>
              </div>
              
              <script>
                window.onload = function() {
                  // Generate QR code
                  try {
                    new QRCode(document.getElementById("qr-code"), {
                      text: '${qrData.replace(/'/g, "\\'")}',
                      width: 120,
                      height: 120,
                      colorDark: "#000000",
                      colorLight: "#ffffff",
                      correctLevel: QRCode.CorrectLevel.H
                    });
                    
                    // Wait for QR code to render, then print
                    setTimeout(function() {
                      window.print();
                      setTimeout(function() {
                        window.close();
                      }, 500);
                    }, 500);
                  } catch (err) {
                    console.error('QR code generation failed:', err);
                    window.print();
                    setTimeout(function() {
                      window.close();
                    }, 500);
                  }
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
      toast.success(`✓ Label sent to printer: ${asset.name || asset.unique_asset_id}`);
    } catch (error) {
      console.error('Failed to print label:', error);
      toast.error('Failed to print label');
    }
    if (anchorEl) {
      setAnchorEl(null);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = 
      (asset.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (asset.asset_type?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (asset.unique_asset_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (asset.manufacturer?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (asset.model?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (asset.serial_number?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      asset.asset_type === selectedCategory || 
      (asset.asset_type && selectedCategory && asset.asset_type.toLowerCase().includes(selectedCategory.toLowerCase()));
    const matchesStatus = selectedStatus === 'all' || asset.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allAssetIds = filteredAssets.map(asset => asset.id || asset._id).filter((id): id is string => !!id);
      setSelectedAssets(allAssetIds);
    } else {
      setSelectedAssets([]);
    }
  };

  const handleSelectAsset = (assetId: string) => {
    setSelectedAssets(prev => {
      if (prev.includes(assetId)) {
        return prev.filter(id => id !== assetId);
      } else {
        return [...prev, assetId];
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedAssets.length === 0) {
      toast.error('No assets selected');
      return;
    }

    try {
      // Delete each asset
      await Promise.all(
        selectedAssets.map(assetId => api.delete(`/assets/${assetId}`))
      );

      toast.success(`Successfully deleted ${selectedAssets.length} asset(s)`);
      setSelectedAssets([]);
      setBulkDeleteDialogOpen(false);
      await loadAssets();
    } catch (error: any) {
      console.error('Failed to delete assets:', error);
      toast.error(error.response?.data?.message || 'Failed to delete assets');
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, asset: Asset) => {
    setAnchorEl(event.currentTarget);
    setSelectedAsset(asset);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAsset(null);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'IT Equipment':
        return <ComputerIcon />;
      case 'Mobile Device':
        return <SmartphoneIcon />;
      case 'Office Equipment':
        return <PrinterIcon />;
      case 'Furniture':
        return <FurnitureIcon />;
      default:
        return <InventoryIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Available':
        return 'info';
      case 'Under Maintenance':
        return 'warning';
      case 'Damaged':
        return 'error';
      case 'Ready for Scrap':
        return 'warning';
      case 'Disposed':
        return 'default';
      default:
        return 'default';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'Excellent':
        return 'success';
      case 'Good':
        return 'primary';
      case 'Fair':
        return 'warning';
      case 'Poor':
        return 'error';
      case 'Obsolete':
        return 'error';
      case 'Beyond Repair':
        return 'error';
      default:
        return 'default';
    }
  };

  // Stats now loaded from API (removed static calculation)

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Asset Inventory
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and track all organizational assets
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {selectedAssets.length > 0 && (
              <>
                <Chip 
                  label={`${selectedAssets.length} selected`}
                  color="primary"
                  onDelete={() => setSelectedAssets([])}
                  sx={{ height: 36, fontSize: '0.875rem' }}
                />
                <Button 
                  variant="contained" 
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setBulkDeleteDialogOpen(true)}
                >
                  Delete Selected
                </Button>
              </>
            )}
            <Button 
              variant="outlined" 
              startIcon={<QrCodeIcon />}
              onClick={() => navigate('/assets/scan-qr')}
            >
              Scan QR Code
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<UploadIcon />}
              onClick={handleBulkImport}
            >
              Bulk Import
            </Button>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
            >
              Add New Asset
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Total Assets
                    </Typography>
                    <Typography variant="h4">{stats.totalAssets}</Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: 'primary.main' }}>
                    <InventoryIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Active Assets
                    </Typography>
                    <Typography variant="h4">{stats.activeAssets}</Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: 'success.main' }}>
                    <InventoryIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Under Maintenance
                    </Typography>
                    <Typography variant="h4">{stats.underMaintenance}</Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: 'warning.main' }}>
                    <InventoryIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Total Value
                    </Typography>
                    <Typography variant="h4">₹{((stats.totalValue || 0) / 100000).toFixed(1)}L</Typography>
                  </Box>
                  <Avatar sx={{ backgroundColor: 'info.main' }}>
                    <InventoryIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search assets by name, ID, manufacturer, or serial number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    label="Category"
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={selectedStatus}
                    label="Status"
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Available">Available</MenuItem>
                    <MenuItem value="Under Maintenance">Under Maintenance</MenuItem>
                    <MenuItem value="Damaged">Damaged</MenuItem>
                    <MenuItem value="Ready for Scrap">Ready for Scrap</MenuItem>
                    <MenuItem value="Disposed">Disposed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Showing {filteredAssets.length} of {assets.length} assets
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Assets Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Asset Inventory ({filteredAssets.length})
            </Typography>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedAssets.length > 0 && selectedAssets.length < filteredAssets.length}
                        checked={filteredAssets.length > 0 && selectedAssets.length === filteredAssets.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>Asset</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Condition</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAssets.map((asset) => (
                    <TableRow 
                      key={asset.id}
                      selected={selectedAssets.includes(asset.id || asset._id || '')}
                      hover
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedAssets.includes(asset.id || asset._id || '')}
                          onChange={() => handleSelectAsset(asset.id || asset._id || '')}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            {getCategoryIcon(asset.asset_type || 'Other')}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                              {asset.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {asset.unique_asset_id} • {asset.manufacturer} {asset.model}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              S/N: {asset.serial_number}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{asset.asset_type}</TableCell>
                      <TableCell>
                        <Chip
                          label={asset.status}
                          color={getStatusColor(asset.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={asset.condition}
                          color={getConditionColor(asset.condition) as any}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{asset.location}</TableCell>
                      <TableCell>{typeof asset.assigned_user === 'object' ? asset.assigned_user?.name : asset.assigned_user || 'Unassigned'}</TableCell>
                      <TableCell>₹{asset.purchase_cost?.toLocaleString() || '0'}</TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleViewAsset(asset)}
                          title="View Asset Details"
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => handleEditAssetClick(asset)}
                          title="Edit Asset"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={(e) => handleMenuClick(e, asset)}
                          title="More Actions"
                        >
                          <MoreIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => selectedAsset && handleGenerateQR(selectedAsset)}>
            <ListItemIcon>
              <QrCodeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Generate QR Code</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => selectedAsset && handleTransferAsset(selectedAsset)}>
            <ListItemIcon>
              <TransferIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Transfer Asset</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => selectedAsset && handlePrintLabel(selectedAsset)}>
            <ListItemIcon>
              <PrintIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Print Label</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => selectedAsset && handleDeleteAsset(selectedAsset)}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete Asset</ListItemText>
          </MenuItem>
        </Menu>

        {/* Add Asset Dialog */}
        <Dialog 
          open={addDialogOpen} 
          onClose={() => setAddDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Add New Asset</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Asset ID"
                    required
                    value={formData.unique_asset_id}
                    onChange={(e) => setFormData({...formData, unique_asset_id: e.target.value})}
                    placeholder="e.g., AST-001"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Category</InputLabel>
                    <Select 
                      label="Category" 
                      value={formData.asset_type}
                      onChange={(e) => setFormData({...formData, asset_type: e.target.value})}
                    >
                      {categories.map((cat) => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Manufacturer"
                    required
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Model"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Serial Number"
                    required
                    value={formData.serial_number}
                    onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Department"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    placeholder="e.g., IT, HR, Finance"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Purchase Date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Purchase Value"
                    value={formData.purchase_cost}
                    onChange={(e) => setFormData({...formData, purchase_cost: e.target.value})}
                    InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select 
                      label="Status" 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Available">Available</MenuItem>
                      <MenuItem value="Under Maintenance">Under Maintenance</MenuItem>
                      <MenuItem value="Damaged">Damaged</MenuItem>
                      <MenuItem value="Ready for Scrap">Ready for Scrap</MenuItem>
                      <MenuItem value="Disposed">Disposed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Condition</InputLabel>
                    <Select 
                      label="Condition" 
                      value={formData.condition}
                      onChange={(e) => setFormData({...formData, condition: e.target.value})}
                    >
                      <MenuItem value="Excellent">Excellent</MenuItem>
                      <MenuItem value="Good">Good</MenuItem>
                      <MenuItem value="Fair">Fair</MenuItem>
                      <MenuItem value="Poor">Poor</MenuItem>
                      <MenuItem value="Obsolete">Obsolete</MenuItem>
                      <MenuItem value="Beyond Repair">Beyond Repair</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setAddDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleAddAsset}
            >
              Add Asset
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Asset Dialog */}
        <Dialog 
          open={editDialogOpen} 
          onClose={() => { setEditDialogOpen(false); resetForm(); }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Edit Asset</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Asset ID"
                    value={formData.unique_asset_id}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select 
                      label="Category" 
                      value={formData.asset_type}
                      onChange={(e) => setFormData({...formData, asset_type: e.target.value})}
                    >
                      {categories.map((cat) => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Model"
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Serial Number"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Purchase Date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Purchase Value"
                    value={formData.purchase_cost}
                    onChange={(e) => setFormData({...formData, purchase_cost: e.target.value})}
                    InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select 
                      label="Status" 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Available">Available</MenuItem>
                      <MenuItem value="Under Maintenance">Under Maintenance</MenuItem>
                      <MenuItem value="Damaged">Damaged</MenuItem>
                      <MenuItem value="Ready for Scrap">Ready for Scrap</MenuItem>
                      <MenuItem value="Disposed">Disposed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Condition</InputLabel>
                    <Select 
                      label="Condition" 
                      value={formData.condition}
                      onChange={(e) => setFormData({...formData, condition: e.target.value})}
                    >
                      <MenuItem value="Excellent">Excellent</MenuItem>
                      <MenuItem value="Good">Good</MenuItem>
                      <MenuItem value="Fair">Fair</MenuItem>
                      <MenuItem value="Poor">Poor</MenuItem>
                      <MenuItem value="Obsolete">Obsolete</MenuItem>
                      <MenuItem value="Beyond Repair">Beyond Repair</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setEditDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleUpdateAsset}
            >
              Update Asset
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Import Dialog */}
        <Dialog
          open={bulkImportOpen}
          onClose={() => { setBulkImportOpen(false); setImportFile(null); }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Bulk Import Assets</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="info">
                Upload a CSV or Excel file to import multiple assets at once. 
                Download the template to see the required format.
              </Alert>

              <Button
                variant="outlined"
                onClick={handleDownloadTemplate}
                fullWidth
              >
                Download Template
              </Button>

              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: importFile ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  bgcolor: importFile ? 'action.hover' : 'background.paper',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover',
                  }
                }}
                onClick={() => document.getElementById('bulk-import-file')?.click()}
              >
                <input
                  id="bulk-import-file"
                  type="file"
                  hidden
                  accept=".csv,.xlsx,.xls"
                  onChange={handleImportFileSelect}
                />
                <UploadIcon sx={{ fontSize: 48, color: importFile ? 'primary.main' : 'text.secondary', mb: 1 }} />
                {importFile ? (
                  <Box>
                    <Typography variant="body1" fontWeight="medium" color="primary">
                      {importFile.name}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Click to change file
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      Click to select a file
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Supported: CSV, Excel (.xlsx, .xls)
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setBulkImportOpen(false); setImportFile(null); }} disabled={importing}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleBulkImportSubmit}
              disabled={!importFile || importing}
              startIcon={importing ? <CircularProgress size={20} /> : <UploadIcon />}
            >
              {importing ? 'Importing...' : 'Import Assets'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Asset Details Dialog */}
        <Dialog open={viewDialogOpen} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h5">Asset Details</Typography>
              <IconButton onClick={handleCloseViewDialog} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ minHeight: 400 }}>
            {selectedAsset ? (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Basic Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Asset ID</Typography>
                          <Typography variant="body1" fontWeight="bold">{selectedAsset.unique_asset_id}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Asset Name</Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {selectedAsset.name || `${selectedAsset.manufacturer} ${selectedAsset.model}`}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Manufacturer</Typography>
                          <Typography variant="body1">{selectedAsset.manufacturer || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Model</Typography>
                          <Typography variant="body1">{selectedAsset.model || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Serial Number</Typography>
                          <Typography variant="body1">{selectedAsset.serial_number || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Category</Typography>
                          <Typography variant="body1">{selectedAsset.asset_type || 'N/A'}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Status & Condition
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Status</Typography>
                          <Chip 
                            label={selectedAsset.status} 
                            color={
                              selectedAsset.status === 'Active' ? 'success' :
                              selectedAsset.status === 'Available' ? 'info' :
                              selectedAsset.status === 'Under Maintenance' ? 'warning' :
                              selectedAsset.status === 'Damaged' ? 'error' :
                              selectedAsset.status === 'Ready for Scrap' ? 'warning' :
                              'default'
                            }
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Condition</Typography>
                          <Chip 
                            label={selectedAsset.condition}
                            color={
                              selectedAsset.condition === 'Excellent' ? 'success' :
                              selectedAsset.condition === 'Good' ? 'info' :
                              selectedAsset.condition === 'Fair' ? 'warning' :
                              selectedAsset.condition === 'Obsolete' || selectedAsset.condition === 'Beyond Repair' ? 'error' :
                              selectedAsset.condition === 'Poor' ? 'error' : 'default'
                            }
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Location</Typography>
                          <Typography variant="body1">{selectedAsset.location || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Assigned To</Typography>
                          <Typography variant="body1">{typeof selectedAsset.assigned_user === 'object' ? selectedAsset.assigned_user?.name : selectedAsset.assigned_user || 'Unassigned'}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Financial Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Purchase Date</Typography>
                          <Typography variant="body1">
                            {selectedAsset.purchase_date ? new Date(selectedAsset.purchase_date).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Purchase Cost</Typography>
                          <Typography variant="body1" fontWeight="bold">
                            ₹{selectedAsset.purchase_cost?.toLocaleString('en-IN') || '0'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Warranty Expiry</Typography>
                          <Typography variant="body1">
                            {selectedAsset.warranty_expiry ? new Date(selectedAsset.warranty_expiry).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Audit Information Section */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Audit Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Last Audit Date</Typography>
                          <Typography variant="body1">
                            {selectedAsset.last_audit_date ? new Date(selectedAsset.last_audit_date).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </Grid>
                        {selectedAsset.last_audited_by && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">Last Audited By</Typography>
                            <Typography variant="body1">
                              {typeof selectedAsset.last_audited_by === 'object' && selectedAsset.last_audited_by.name
                                ? selectedAsset.last_audited_by.name
                                : 'N/A'}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                <Typography variant="body1" color="text.secondary">
                  No asset data available
                </Typography>
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* QR Code Dialog (for existing assets) */}
        <Dialog open={qrDialogOpen} onClose={handleCloseQRDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Asset QR Code</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minHeight: 400 }}>
              {(() => {
                console.log('QR Dialog - selectedAsset:', selectedAsset);
                console.log('QR Dialog - qrCodeUrl:', qrCodeUrl);
                console.log('QR Dialog - qrDialogOpen:', qrDialogOpen);
                return null;
              })()}
              {selectedAsset && qrCodeUrl ? (
                <>
                  <Typography variant="h6">
                    {selectedAsset.name || `${selectedAsset.manufacturer} ${selectedAsset.model}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedAsset.unique_asset_id}
                  </Typography>
                  <Box id="qr-code-container" sx={{ p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                    <QRCodeCanvas
                      value={qrCodeUrl}
                      size={300}
                      level="H"
                      includeMargin={true}
                    />
                  </Box>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      const canvas = document.querySelector('#qr-code-container canvas') as HTMLCanvasElement;
                      if (canvas) {
                        canvas.toBlob((blob) => {
                          if (blob) {
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.download = `${selectedAsset.unique_asset_id}-qr.png`;
                            link.href = url;
                            link.click();
                            URL.revokeObjectURL(url);
                            toast.success('QR Code downloaded');
                          }
                        });
                      }
                    }}
                  >
                    Download QR Code
                  </Button>
                </>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                  <Typography variant="body1" color="text.secondary">
                    No QR code data available
                  </Typography>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseQRDialog}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* New Asset Success Dialog with QR Code */}
        <Dialog open={newAssetQrDialogOpen} onClose={() => setNewAssetQrDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CheckCircleIcon color="success" fontSize="large" />
              <Typography variant="h5">Asset Created Successfully!</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {newlyCreatedAsset && qrCodeUrl && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Alert severity="success" sx={{ mb: 2 }}>
                      Your asset has been created and a QR code has been generated.
                    </Alert>
                    <Typography variant="h6" gutterBottom>Asset Details:</Typography>
                    <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                      <Typography variant="body2"><strong>Asset ID:</strong> {newlyCreatedAsset.unique_asset_id}</Typography>
                      <Typography variant="body2"><strong>Name:</strong> {newlyCreatedAsset.name}</Typography>
                      <Typography variant="body2"><strong>Manufacturer:</strong> {newlyCreatedAsset.manufacturer}</Typography>
                      <Typography variant="body2"><strong>Model:</strong> {newlyCreatedAsset.model}</Typography>
                      <Typography variant="body2"><strong>Serial:</strong> {newlyCreatedAsset.serial_number}</Typography>
                      <Typography variant="body2"><strong>Category:</strong> {newlyCreatedAsset.asset_type}</Typography>
                      <Typography variant="body2"><strong>Location:</strong> {newlyCreatedAsset.location}</Typography>
                      <Typography variant="body2"><strong>Status:</strong> {newlyCreatedAsset.status}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h6">QR Code</Typography>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        Scan this QR code to view asset details
                      </Typography>
                      <Box id="new-asset-qr-container" sx={{ p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 2 }}>
                        <QRCodeCanvas
                          value={qrCodeUrl}
                          size={250}
                          level="H"
                          includeMargin={true}
                        />
                      </Box>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => {
                          const canvas = document.querySelector('#new-asset-qr-container canvas') as HTMLCanvasElement;
                          if (canvas) {
                            canvas.toBlob((blob) => {
                              if (blob) {
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.download = `${newlyCreatedAsset.unique_asset_id}-qr.png`;
                                link.href = url;
                                link.click();
                                URL.revokeObjectURL(url);
                                toast.success('QR Code downloaded successfully!');
                              }
                            });
                          }
                        }}
                      >
                        Download QR Code
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setNewAssetQrDialogOpen(false);
              setNewlyCreatedAsset(null);
            }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Transfer Asset Dialog */}
        <Dialog open={transferDialogOpen} onClose={handleCloseTransferDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Transfer Asset</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {selectedAsset && (
                <>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Transferring: <strong>{selectedAsset.name}</strong> ({selectedAsset.unique_asset_id})
                    <br />
                    Current Location: <strong>{selectedAsset.location}</strong>
                  </Alert>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="To Location"
                        required
                        value={transferData.to_location}
                        onChange={(e) => setTransferData({...transferData, to_location: e.target.value})}
                        placeholder="e.g., IT Department, Floor 3"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Assigned To (Optional)"
                        value={transferData.to_user}
                        onChange={(e) => setTransferData({...transferData, to_user: e.target.value})}
                        placeholder="Enter email or employee ID"
                        helperText="Enter the user's email address or employee ID to assign this asset"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Notes"
                        value={transferData.notes}
                        onChange={(e) => setTransferData({...transferData, notes: e.target.value})}
                        placeholder="Reason for transfer, special instructions, etc."
                      />
                    </Grid>
                  </Grid>
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseTransferDialog}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleTransferSubmit}>
              Transfer Asset
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Delete Confirmation Dialog */}
        <Dialog open={bulkDeleteDialogOpen} onClose={() => setBulkDeleteDialogOpen(false)} maxWidth="sm">
          <DialogTitle>Confirm Bulk Delete</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body1">
                Are you sure you want to delete <strong>{selectedAssets.length}</strong> selected asset(s)?
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                This action cannot be undone.
              </Typography>
            </Alert>
            {selectedAssets.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Selected Assets:
                </Typography>
                <Box sx={{ mt: 1, maxHeight: 200, overflowY: 'auto' }}>
                  {selectedAssets.slice(0, 10).map(assetId => {
                    const asset = assets.find(a => a.id === assetId);
                    return asset ? (
                      <Chip
                        key={assetId}
                        label={`${asset.unique_asset_id} - ${asset.name}`}
                        size="small"
                        sx={{ m: 0.5 }}
                      />
                    ) : null;
                  })}
                  {selectedAssets.length > 10 && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      ...and {selectedAssets.length - 10} more
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBulkDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="error" 
              onClick={handleBulkDelete}
              startIcon={<DeleteIcon />}
            >
              Delete {selectedAssets.length} Asset(s)
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default AssetsPage;