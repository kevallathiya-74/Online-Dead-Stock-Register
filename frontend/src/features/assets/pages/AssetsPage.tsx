import {
    ArrowPathRoundedSquareIcon,
    ArrowUpTrayIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    PencilSquareIcon,
    PlusIcon,
    PrinterIcon,
    QrCodeIcon,
    TrashIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { QRCodeCanvas } from 'qrcode.react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import api from '../../../services/api';
import assetUpdateService from '../services/assetUpdateService';

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
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  location: string;
  assigned_user?: string | { _id: string; name: string; email: string };
  purchase_date: string;
  purchase_cost: number;
  current_value?: number;
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
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
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
    purchase_cost: '',
    status: 'Active',
    condition: 'good',
    department: '',
  });
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadAssets();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get('/assets/categories');
      if (response.data.success && response.data.data) {
        const categoryNames = response.data.data
          .map((cat: any) => cat.name)
          .filter((name: string) => name);
        setCategories(categoryNames as string[]);
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      setCategories(['Computer', 'Laptop', 'Monitor', 'Printer', 'Scanner', 'Other']);
    }
  };

  useEffect(() => {
    const unsubscribe = assetUpdateService.subscribeGlobal((assetId, updateData) => {
      loadAssets();
      if (updateData?.type === 'audit_completed') {
        toast.info('Asset list updated - audit completed', {
          position: 'bottom-right',
          autoClose: 2000,
        });
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const [assetsResponse, statsResponse] = await Promise.all([
        api.get('/assets'),
        api.get('/assets/stats')
      ]);
      const apiData = assetsResponse.data.data || assetsResponse.data;
      const assetsArray = apiData.data || apiData;
      
      const transformedAssets = Array.isArray(assetsArray) ? assetsArray.map((asset: any) => {
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
          _id: asset._id || asset.id,
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
          last_audited_by: asset.last_audited_by,
          department: asset.department,
          vendor: asset.vendor,
        };
      }) : [];
      
      setAssets(transformedAssets);
      
      if (statsResponse.data.success && statsResponse.data.data) {
        setStats({
          totalAssets: statsResponse.data.data.totalAssets,
          activeAssets: statsResponse.data.data.activeAssets,
          underMaintenance: statsResponse.data.data.underMaintenance,
          totalValue: statsResponse.data.data.totalValue,
        });
      }
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load assets';
      toast.error(errorMsg);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAsset = async (asset: Asset) => {
    setViewDialogOpen(true);
    setSelectedAsset(asset);
    setActiveMenuId(null);
    try {
      const response = await api.get(`/assets/${asset._id}`);
      if (response.data.success) {
        setSelectedAsset(response.data.data);
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      toast.warning('Showing cached data. Failed to fetch latest updates.');
    }
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setTimeout(() => {
      setSelectedAsset(null);
    }, 200);
  };

  const handleCloseQRDialog = () => {
    setQrDialogOpen(false);
    setTimeout(() => {
      setQrCodeUrl('');
      setSelectedAsset(null);
    }, 200);
  };

  const handleCloseTransferDialog = () => {
    setTransferDialogOpen(false);
    setTimeout(() => {
      setTransferData({ to_location: '', to_user: '', notes: '' });
      setSelectedAsset(null);
    }, 200);
  };

  const handleAddAsset = async () => {
    try {
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
        purchase_cost: formData.purchase_cost ? Number(formData.purchase_cost) : 0,
        status: formData.status,
        condition: formData.condition.toLowerCase(),
      };

      const response = await api.post('/assets', payload);
      const createdAsset = response.data.data || response.data;
      
      toast.success('Asset added successfully');
      setAddDialogOpen(false);
      resetForm();
      
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
        purchase_cost: createdAsset.purchase_cost,
        department: createdAsset.department
      };
      
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
        purchase_cost: fullAssetData.purchase_cost,
        department: fullAssetData.department,
        scan_url: `${window.location.origin}/assets/${fullAssetData.id}`
      });
      
      setQrCodeUrl(qrData);
      setNewlyCreatedAsset(fullAssetData as any);
      setNewAssetQrDialogOpen(true);
      await loadAssets();
    } catch (error: any) {
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
      purchase_cost: asset.purchase_cost !== undefined && asset.purchase_cost !== null ? asset.purchase_cost.toString() : '',
      status: asset.status,
      condition: asset.condition,
      department: asset.department || '',
    });
    setEditDialogOpen(true);
    setActiveMenuId(null);
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
        purchase_cost: formData.purchase_cost ? Number(formData.purchase_cost) : undefined,
        status: formData.status,
        condition: formData.condition.toLowerCase(),
      };

      await api.put(`/assets/${selectedAsset.id || selectedAsset._id}`, payload);
      
      if (selectedAsset.id || selectedAsset._id) {
        assetUpdateService.notifyUpdate((selectedAsset.id || selectedAsset._id) as string, { type: 'updated', asset: { ...selectedAsset, ...payload } });
      }
      
      toast.success('Asset updated successfully');
      setEditDialogOpen(false);
      resetForm();
      await loadAssets();
    } catch (error: any) {
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
      purchase_cost: '',
      status: 'Active',
      condition: 'good',
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
      const data = new FormData();
      data.append('file', importFile);
      const response = await api.post('/assets/bulk-import', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        const { imported, failed, total } = response.data.data;
        toast.success(`Successfully imported ${imported} out of ${total} assets${failed > 0 ? `. ${failed} failed.` : ''}`);
        setBulkImportOpen(false);
        setImportFile(null);
        await loadAssets();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to import assets';
      toast.error(errorMsg);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ['unique_asset_id', 'manufacturer', 'model', 'serial_number', 'asset_type', 'department', 'location', 'purchase_date', 'purchase_cost', 'status', 'condition'];
    const sampleRow = ['AST-001', 'Dell', 'Latitude 5520', 'SN123456', 'IT Equipment', 'IT Department', 'Office 101', '2024-01-01', '50000', 'Active', 'Good'];
    const csvContent = [headers.join(','), sampleRow.join(','), '# Add your assets below this line (one per row)'].join('\n');
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
    if (window.confirm(`Are you sure you want to delete asset: ${asset.name || asset.unique_asset_id}?`)) {
      try {
        const assetId = asset.id || asset._id;
        await api.delete(`/assets/${assetId}`);
        setAssets(prevAssets => prevAssets.filter(a => a.id !== assetId));
        if (assetId) {
          assetUpdateService.notifyUpdate(assetId, { type: 'deleted', asset });
        }
        toast.success(`Asset "${asset.name || asset.unique_asset_id}" has been deleted.`);
        await loadAssets();
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.message || 'Failed to delete asset';
        toast.error(errorMsg);
      }
    }
    setActiveMenuId(null);
  };

  const handleTransferAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setTransferDialogOpen(true);
    setActiveMenuId(null);
  };

  const handleTransferSubmit = async () => {
    if (!selectedAsset || !transferData.to_location) {
      toast.error('Please fill in required fields');
      return;
    }
    try {
      const updatePayload: any = { location: transferData.to_location };
      if (transferData.to_user && transferData.to_user.trim() !== '') {
        updatePayload.assigned_user = transferData.to_user;
      }
      const response = await api.put(`/assets/${selectedAsset.id || selectedAsset._id}`, updatePayload);
      if (selectedAsset.id || selectedAsset._id) {
        assetUpdateService.notifyUpdate((selectedAsset.id || selectedAsset._id) as string, { type: 'transferred', asset: response.data, transferData });
      }
      let successMsg = `Asset transferred to ${transferData.to_location}`;
      if (transferData.to_user) {
        successMsg += `\n Assigned to ${transferData.to_user}`;
      }
      toast.success(successMsg);
      handleCloseTransferDialog();
      loadAssets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to transfer asset');
    }
  };

  const handleGenerateQR = async (asset: Asset) => {
    const assetName = asset.name || `${asset.manufacturer} ${asset.model}`;
    const qrData = asset.unique_asset_id;
    setQrCodeUrl(qrData);
    setSelectedAsset({ ...asset, name: assetName });
    setTimeout(() => {
      setQrDialogOpen(true);
    }, 0);
    setActiveMenuId(null);
  };

  const handlePrintLabel = async (asset: Asset) => {
    try {
      const qrData = asset.unique_asset_id;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Asset Label - ${asset.unique_asset_id}</title>
              <meta charset="UTF-8">
              <style>
                @page { size: 4in 2in; margin: 0; }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Arial', sans-serif; padding: 0.25in; background: white; }
                .label-container { width: 100%; height: 100%; border: 3px solid #000; padding: 10px; display: flex; gap: 10px; }
                .label-content { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
                .label-header { border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 8px; }
                .label-title { font-size: 14px; font-weight: bold; }
                .asset-id { font-size: 12px; font-weight: bold; font-family: monospace; color: #1e40af; }
                .detail-row { margin: 3px 0; font-size: 9px; }
                .detail-label { font-weight: bold; color: #555; display: inline-block; width: 60px; }
                .qr-section { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5px; border-left: 2px solid #ddd; }
                #qr-code { margin-bottom: 5px; }
                .status-badge { display: inline-block; padding: 1px 5px; border-radius: 3px; font-size: 8px; font-weight: bold; background: #3b82f6; color: white; margin-left: 5px; }
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
                    <div class="detail-row"><span class="detail-label">Category:</span><span>${asset.asset_type || 'N/A'}</span><span class="status-badge">${asset.status}</span></div>
                    <div class="detail-row"><span class="detail-label">Mfr/Model:</span><span>${asset.manufacturer} ${asset.model}</span></div>
                    <div class="detail-row"><span class="detail-label">Location:</span><span>${asset.location}</span></div>
                  </div>
                </div>
                <div class="qr-section">
                  <div id="qr-code"></div>
                </div>
              </div>
              <script>
                window.onload = function() {
                  new QRCode(document.getElementById("qr-code"), {
                    text: "${qrData}",
                    width: 90,
                    height: 90,
                    correctLevel: QRCode.CorrectLevel.H
                  });
                  setTimeout(function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 500);
                  }, 500);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
      toast.success(`Label sent to printer: ${asset.name || asset.unique_asset_id}`);
    } catch { /* ignore */ }
    setActiveMenuId(null);
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
    if (selectedAssets.length === 0) return;
    try {
      await Promise.all(selectedAssets.map(assetId => api.delete(`/assets/${assetId}`)));
      toast.success(`Successfully deleted ${selectedAssets.length} asset(s)`);
      setSelectedAssets([]);
      setBulkDeleteDialogOpen(false);
      await loadAssets();
    } catch { /* ignore */ }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
      case 'Available':
        return 'bg-green-50 text-green-700 border border-green-105';
      case 'Under Maintenance':
        return 'bg-amber-50 text-amber-700 border border-amber-105';
      case 'Damaged':
      case 'Ready for Scrap':
        return 'bg-red-50 text-red-700 border border-red-105';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-105';
    }
  };

  const getConditionText = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case 'excellent':
      case 'good':
        return 'text-green-600';
      case 'fair':
        return 'text-amber-600';
      case 'poor':
      case 'damaged':
        return 'text-red-650';
      default:
        return 'text-slate-600';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-brand-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold font-display text-slate-905">Asset Inventory</h2>
            <p className="text-sm text-slate-500 mt-1">Manage and track all organizational assets</p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {selectedAssets.length > 0 && (
              <>
                <span className="text-xs bg-brand-50 text-brand-700 px-3 py-1.5 rounded-xl font-semibold border border-brand-100">
                  {selectedAssets.length} selected
                </span>
                <button
                  onClick={() => setBulkDeleteDialogOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete Selected
                </button>
              </>
            )}

            <button
              onClick={() => navigate('/assets/scan-qr')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <QrCodeIcon className="w-4 h-4 text-slate-500" />
              Scan QR
            </button>

            <button
              onClick={handleBulkImport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowUpTrayIcon className="w-4 h-4 text-slate-500" />
              Bulk Import
            </button>

            <button
              onClick={() => setAddDialogOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              <PlusIcon className="w-4.5 h-4.5" />
              Add Asset
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Assets</p>
              <h4 className="text-2xl font-bold text-slate-900 font-display mt-0.5">{stats.totalAssets}</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
              T
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-505 font-medium uppercase tracking-wider text-green-550">Active</p>
              <h4 className="text-2xl font-bold text-slate-905 font-display mt-0.5 text-green-600">{stats.activeAssets}</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-bold">
              A
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-505 font-medium uppercase tracking-wider text-amber-500">Maintenance</p>
              <h4 className="text-2xl font-bold text-slate-905 font-display mt-0.5 text-amber-600">{stats.underMaintenance}</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              M
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Value</p>
              <h4 className="text-xl font-bold text-slate-900 font-display mt-0.5">₹{stats.totalValue.toLocaleString('en-IN')}</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-605 flex items-center justify-center font-bold text-sm">
              ₹
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="relative md:col-span-6 w-full">
              <input
                type="text"
                placeholder="Search assets by name, ID, manufacturer, or serial..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            <div className="md:col-span-3 w-full">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 w-full">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Available">Available</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Damaged">Damaged</option>
                <option value="Ready for Scrap">Ready for Scrap</option>
                <option value="Disposed">Disposed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Assets Registry Table Card */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-500">
                <th className="pb-3 w-10">
                  <input
                    type="checkbox"
                    checked={filteredAssets.length > 0 && selectedAssets.length === filteredAssets.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                  />
                </th>
                <th className="pb-3 font-medium">Asset Details</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Condition</th>
                <th className="pb-3 font-medium">Location</th>
                <th className="pb-3 font-medium">Assigned To</th>
                <th className="pb-3 font-medium">Purchase Value</th>
                <th className="pb-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredAssets.map((asset) => {
                const assetId = asset.id || asset._id || '';
                return (
                  <tr 
                    key={assetId} 
                    className={`hover:bg-slate-50/50 transition-colors ${
                      selectedAssets.includes(assetId) ? 'bg-indigo-50/10' : ''
                    }`}
                  >
                    <td className="py-4">
                      <input
                        type="checkbox"
                        checked={selectedAssets.includes(assetId)}
                        onChange={() => handleSelectAsset(assetId)}
                        className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                      />
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                          {asset.manufacturer?.[0] || 'A'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-xs">{asset.name}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            {asset.unique_asset_id} &bull; {asset.manufacturer} {asset.model}
                          </p>
                          <p className="text-[9px] text-slate-400">S/N: {asset.serial_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-xs text-slate-655 font-medium">{asset.asset_type}</td>
                    <td className="py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(asset.status)}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`text-xs font-semibold ${getConditionText(asset.condition)}`}>
                        {asset.condition}
                      </span>
                    </td>
                    <td className="py-4 text-xs text-slate-655">{asset.location}</td>
                    <td className="py-4 text-xs text-slate-505">
                      {typeof asset.assigned_user === 'object' ? asset.assigned_user?.name : asset.assigned_user || 'Unassigned'}
                    </td>
                    <td className="py-4 text-xs text-slate-805 font-bold">
                      ₹{typeof asset.purchase_cost === 'number' ? asset.purchase_cost.toLocaleString('en-IN') : '0'}
                    </td>
                    <td className="py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 relative">
                        <button
                          onClick={() => handleViewAsset(asset)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditAssetClick(asset)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-550 hover:text-brand-600 transition-colors"
                          title="Edit"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === assetId ? null : assetId)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-500"
                            title="More Actions"
                          >
                            <EllipsisVerticalIcon className="w-4 h-4" />
                          </button>
                          {activeMenuId === assetId && (
                            <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-100 rounded-xl shadow-card-xl z-20 py-1.5 text-xs text-slate-655 font-medium text-left">
                              <button onClick={() => handleGenerateQR(asset)} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-1.5"><QrCodeIcon className="w-4 h-4 text-slate-400" />Generate QR</button>
                              <button onClick={() => handleTransferAsset(asset)} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-1.5"><ArrowPathRoundedSquareIcon className="w-4 h-4 text-slate-400" />Transfer Location</button>
                              <button onClick={() => handlePrintLabel(asset)} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-1.5"><PrinterIcon className="w-4 h-4 text-slate-400" />Print Label</button>
                              <hr className="my-1 border-slate-100" />
                              <button onClick={() => handleDeleteAsset(asset)} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-605 flex items-center gap-1.5"><TrashIcon className="w-4 h-4" />Delete Asset</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Dialog */}
      {addDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-xl w-full shadow-card-xl p-6 space-y-4 animate-fade-in-up">
            <h3 className="text-lg font-bold font-display text-slate-900">Add New Asset</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[365px] overflow-y-auto pr-1 text-xs">
              <div>
                <label className="block font-semibold text-slate-655 mb-1">Asset ID *</label>
                <input
                  type="text"
                  value={formData.unique_asset_id}
                  onChange={(e) => setFormData({...formData, unique_asset_id: e.target.value})}
                  placeholder="e.g. AST-001"
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Category *</label>
                <select
                  value={formData.asset_type}
                  onChange={(e) => setFormData({...formData, asset_type: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Manufacturer *</label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Model *</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Serial Number *</label>
                <input
                  type="text"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Department *</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  placeholder="e.g. IT, HR, Finance"
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Purchase Date</label>
                <input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Purchase Value</label>
                <input
                  type="number"
                  value={formData.purchase_cost}
                  onChange={(e) => setFormData({...formData, purchase_cost: e.target.value})}
                  placeholder="₹"
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Available">Available</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Ready for Scrap">Ready for Scrap</option>
                  <option value="Disposed">Disposed</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-655 mb-1">Condition</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({...formData, condition: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                  <option value="damaged">Damaged</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 text-xs">
              <button
                onClick={() => { setAddDialogOpen(false); resetForm(); }}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAsset}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Add Asset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {editDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-xl w-full shadow-card-xl p-6 space-y-4 animate-fade-in-up">
            <h3 className="text-lg font-bold font-display text-slate-900">Edit Asset</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[365px] overflow-y-auto pr-1 text-xs">
              <div>
                <label className="block font-semibold text-slate-655 mb-1">Asset ID (Locked)</label>
                <input
                  type="text"
                  value={formData.unique_asset_id}
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Category</label>
                <select
                  value={formData.asset_type}
                  onChange={(e) => setFormData({...formData, asset_type: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Manufacturer</label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Model</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Serial Number</label>
                <input
                  type="text"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Purchase Date</label>
                <input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Purchase Value</label>
                <input
                  type="number"
                  value={formData.purchase_cost}
                  onChange={(e) => setFormData({...formData, purchase_cost: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Available">Available</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Ready for Scrap">Ready for Scrap</option>
                  <option value="Disposed">Disposed</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Condition</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({...formData, condition: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                  <option value="damaged">Damaged</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 text-xs">
              <button
                onClick={() => { setEditDialogOpen(false); resetForm(); }}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateAsset}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Update Asset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Dialog */}
      {bulkImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-card-xl p-6 space-y-4 animate-fade-in-up text-xs">
            <h3 className="text-lg font-bold font-display text-slate-900">Bulk Import Assets</h3>
            
            <div className="p-4 bg-sky-50 border border-sky-100 text-sky-850 rounded-xl leading-relaxed">
              Upload a CSV or Excel file to import multiple assets at once. Download the template to see the required format.
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="w-full py-2 border border-slate-200 text-slate-705 font-semibold rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
            >
              Download Template
            </button>

            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                importFile ? 'border-brand-500 bg-slate-50/50' : 'border-slate-200 hover:border-brand-500 bg-white'
              }`}
              onClick={() => document.getElementById('bulk-import-file-upload')?.click()}
            >
              <input
                id="bulk-import-file-upload"
                type="file"
                hidden
                accept=".csv,.xlsx,.xls"
                onChange={handleImportFileSelect}
              />
              <ArrowUpTrayIcon className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              {importFile ? (
                <div>
                  <p className="font-semibold text-brand-600">{importFile.name}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Click to change file</p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-slate-700">Click to select a file</p>
                  <p className="text-[10px] text-slate-400 mt-1">Supported: CSV, Excel (.xlsx, .xls)</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => { setBulkImportOpen(false); setImportFile(null); }}
                disabled={importing}
                className="px-4 py-2 border border-slate-200 text-slate-750 font-semibold rounded-lg hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkImportSubmit}
                disabled={!importFile || importing}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {importing ? 'Importing...' : 'Import Assets'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Dialog */}
      {viewDialogOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-2xl w-full shadow-card-xl p-6 space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold font-display text-slate-900">Asset Details</h3>
              <button onClick={handleCloseViewDialog} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-750">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1 text-xs text-slate-655">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wide">Basic Info</h4>
                <p><strong>Asset ID:</strong> {selectedAsset.unique_asset_id}</p>
                <p><strong>Name:</strong> {selectedAsset.name || `${selectedAsset.manufacturer} ${selectedAsset.model}`}</p>
                <p><strong>Manufacturer:</strong> {selectedAsset.manufacturer || 'N/A'}</p>
                <p><strong>Model:</strong> {selectedAsset.model || 'N/A'}</p>
                <p><strong>Serial Number:</strong> {selectedAsset.serial_number || 'N/A'}</p>
                <p><strong>Category:</strong> {selectedAsset.asset_type || 'N/A'}</p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wide">Status & Location</h4>
                <p className="flex items-center gap-1.5 mt-1">
                  <strong>Status:</strong>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(selectedAsset.status)}`}>
                    {selectedAsset.status}
                  </span>
                </p>
                <p className="flex items-center gap-1.5 mt-1">
                  <strong>Condition:</strong>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold ${getConditionText(selectedAsset.condition)}`}>
                    {selectedAsset.condition}
                  </span>
                </p>
                <p><strong>Location:</strong> {selectedAsset.location || 'N/A'}</p>
                <p><strong>Assigned To:</strong> {typeof selectedAsset.assigned_user === 'object' ? selectedAsset.assigned_user?.name : selectedAsset.assigned_user || 'Unassigned'}</p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wide">Financial</h4>
                <p><strong>Purchase Date:</strong> {selectedAsset.purchase_date ? new Date(selectedAsset.purchase_date).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Purchase Cost:</strong> ₹{typeof selectedAsset.purchase_cost === 'number' ? selectedAsset.purchase_cost.toLocaleString('en-IN') : '0'}</p>
                <p><strong>Current Value:</strong> ₹{typeof selectedAsset.current_value === 'number' && selectedAsset.current_value > 0 ? selectedAsset.current_value.toLocaleString('en-IN') : (selectedAsset.purchase_cost || 0).toLocaleString('en-IN')}</p>
                <p><strong>Warranty Expiry:</strong> {selectedAsset.warranty_expiry ? new Date(selectedAsset.warranty_expiry).toLocaleDateString() : 'N/A'}</p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wide">Audit Details</h4>
                <p><strong>Last Audit:</strong> {selectedAsset.last_audit_date ? new Date(selectedAsset.last_audit_date).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Audited By:</strong> {typeof selectedAsset.last_audited_by === 'object' ? selectedAsset.last_audited_by?.name : 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 text-xs">
              <button
                onClick={handleCloseViewDialog}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleCloseViewDialog();
                  handleEditAssetClick(selectedAsset);
                }}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Edit Asset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Dialog */}
      {qrDialogOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full shadow-card-xl p-6 space-y-4 animate-fade-in-up text-center text-xs">
            <h3 className="text-lg font-bold font-display text-slate-900">Asset QR Code</h3>
            
            <p className="font-bold text-slate-800">{selectedAsset.name || `${selectedAsset.manufacturer} ${selectedAsset.model}`}</p>
            <p className="text-slate-400 font-mono">{selectedAsset.unique_asset_id}</p>

            <div className="flex justify-center" id="qr-code-display-wrap">
              <div className="bg-white p-3 rounded-2xl shadow-card border border-slate-150">
                <QRCodeCanvas
                  value={qrCodeUrl}
                  size={240}
                  level="H"
                  includeMargin
                />
              </div>
            </div>

            <button
              onClick={() => {
                const canvas = document.querySelector('#qr-code-display-wrap canvas') as HTMLCanvasElement;
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
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-all cursor-pointer"
            >
              Download QR Code
            </button>

            <div className="pt-2">
              <button
                onClick={handleCloseQRDialog}
                className="px-4 py-2 border border-slate-205 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Asset Success Dialog */}
      {newAssetQrDialogOpen && newlyCreatedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-2xl w-full shadow-card-xl p-6 space-y-4 animate-fade-in-up">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-sm font-bold">✓</span>
              <h3 className="text-lg font-bold font-display text-slate-900">Asset Created Successfully!</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 text-xs">
              <div className="space-y-4">
                <div className="p-3.5 bg-green-50/50 border border-green-100 text-green-800 rounded-xl leading-relaxed">
                  Your asset has been created and a QR code has been generated.
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2 text-slate-655">
                  <p><strong>Asset ID:</strong> {newlyCreatedAsset.unique_asset_id}</p>
                  <p><strong>Name:</strong> {newlyCreatedAsset.name}</p>
                  <p><strong>Manufacturer:</strong> {newlyCreatedAsset.manufacturer}</p>
                  <p><strong>Model:</strong> {newlyCreatedAsset.model}</p>
                  <p><strong>Serial:</strong> {newlyCreatedAsset.serial_number}</p>
                  <p><strong>Category:</strong> {newlyCreatedAsset.asset_type}</p>
                  <p><strong>Location:</strong> {newlyCreatedAsset.location}</p>
                  <p><strong>Status:</strong> {newlyCreatedAsset.status}</p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <p className="font-semibold text-slate-900">QR Code Preview</p>
                <div className="bg-white p-3 rounded-2xl shadow-card border border-slate-150" id="new-asset-qr-success-wrap">
                  <QRCodeCanvas
                    value={qrCodeUrl}
                    size={200}
                    level="H"
                    includeMargin
                  />
                </div>
                <button
                  onClick={() => {
                    const canvas = document.querySelector('#new-asset-qr-success-wrap canvas') as HTMLCanvasElement;
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
                  className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Download QR Code
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 text-xs">
              <button
                onClick={() => {
                  setNewAssetQrDialogOpen(false);
                  setNewlyCreatedAsset(null);
                }}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Asset Dialog */}
      {transferDialogOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full shadow-card-xl p-6 space-y-4 animate-fade-in-up text-xs">
            <h3 className="text-lg font-bold font-display text-slate-900">Transfer Asset</h3>
            
            <div className="p-3.5 bg-sky-50 border border-sky-100 text-sky-850 rounded-xl leading-relaxed">
              Transferring: <strong>{selectedAsset.name}</strong> ({selectedAsset.unique_asset_id})
              <br />
              Current Location: <strong>{selectedAsset.location}</strong>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-655 mb-1">To Location *</label>
                <input
                  type="text"
                  value={transferData.to_location}
                  onChange={(e) => setTransferData({...transferData, to_location: e.target.value})}
                  placeholder="e.g. IT Department, Floor 3"
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Assigned To (Optional)</label>
                <input
                  type="text"
                  value={transferData.to_user}
                  onChange={(e) => setTransferData({...transferData, to_user: e.target.value})}
                  placeholder="Enter email or employee ID"
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Assign the asset to a specific user by ID or email.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Notes</label>
                <textarea
                  value={transferData.notes}
                  onChange={(e) => setTransferData({...transferData, notes: e.target.value})}
                  placeholder="Reason for transfer, special instructions..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={handleCloseTransferDialog}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleTransferSubmit}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Transfer Asset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirm Dialog */}
      {bulkDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full shadow-card-xl p-6 space-y-4 animate-fade-in-up text-xs">
            <h3 className="text-lg font-bold font-display text-slate-900">Confirm Bulk Delete</h3>
            
            <div className="p-3.5 bg-red-50 border border-red-100 text-red-750 rounded-xl leading-relaxed">
              <p className="font-bold">Are you sure you want to delete {selectedAssets.length} selected asset(s)?</p>
              <p className="mt-1 text-[10px] text-red-600 font-medium">This action cannot be undone.</p>
            </div>

            {selectedAssets.length > 0 && (
              <div className="space-y-1">
                <p className="text-slate-500 font-semibold">Selected Assets:</p>
                <div className="max-h-28 overflow-y-auto p-2 bg-slate-50 border border-slate-100 rounded-xl flex flex-wrap gap-1">
                  {selectedAssets.slice(0, 10).map(assetId => {
                    const asset = assets.find(a => a.id === assetId || a._id === assetId);
                    return asset ? (
                      <span key={assetId} className="px-2 py-0.5 bg-slate-200 text-slate-700 font-bold rounded text-[9px]">
                        {asset.unique_asset_id}
                      </span>
                    ) : null;
                  })}
                  {selectedAssets.length > 10 && (
                    <span className="text-[10px] text-slate-400 font-medium ml-1">
                      ...and {selectedAssets.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setBulkDeleteDialogOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-650 hover:bg-red-750 text-white font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Delete {selectedAssets.length} Asset(s)
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AssetsPage;
