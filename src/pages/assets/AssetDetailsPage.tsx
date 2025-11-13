import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  Paper,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  QrCode as QrCodeIcon,
  Print as PrintIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  CalendarToday as CalendarIcon,
  CurrencyRupee as MoneyIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { QRCodeCanvas } from 'qrcode.react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import assetUpdateService from '../../services/assetUpdateService';

interface AssetDetails {
  _id: string;
  unique_asset_id: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  asset_type: string;
  location: string;
  status: string;
  department: string;
  purchase_date: string;
  purchase_cost: number;
  warranty_expiry?: string;
  condition: string;
  assigned_user?: {
    name: string;
    email: string;
    department?: string;
  };
  last_audited_by?: {
    name: string;
    email: string;
  };
  last_audit_date?: string;
  location_verified?: boolean;
  last_location_verification_date?: string;
  audit_history?: any[];
  createdAt: string;
  updatedAt: string;
}

const AssetDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [asset, setAsset] = useState<AssetDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Function to handle back navigation intelligently
  const handleBackNavigation = () => {
    // Check if we came from a specific page via state
    const fromPage = (location.state as any)?.from;
    
    if (fromPage) {
      navigate(fromPage);
    } else if (window.history.length > 2) {
      // Use browser back if there's history
      navigate(-1);
    } else {
      // Default fallback to assets page
      navigate('/assets');
    }
  };

  useEffect(() => {
    loadAssetDetails();
  }, [id]);

  // Auto-refresh every 10 seconds to capture audit updates
  useEffect(() => {
    if (!autoRefresh || !id) return;

    const intervalId = setInterval(() => {
      loadAssetDetails(true); // Silent refresh
    }, 10000); // 10 seconds

    return () => clearInterval(intervalId);
  }, [id, autoRefresh]);

  // Listen for storage events (cross-tab communication)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `asset_updated_${id}`) {
        console.log('Asset update detected from another tab/window');
        loadAssetDetails(true);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [id]);

  const loadAssetDetails = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const response = await api.get(`/assets/${id}`);
      const assetData = response.data.data || response.data;
      
      setAsset(assetData);
      setLastUpdated(new Date());
      setError('');
      
      if (!silent) {
        console.log('Asset details loaded:', assetData);
      }
    } catch (error: any) {
      console.error('Failed to load asset details:', error);
      setError(error.response?.data?.message || 'Failed to load asset details');
      if (!silent) {
        toast.error('Failed to load asset details');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Public method to trigger refresh (can be called from audit components)
  const refreshAssetDetails = () => {
    console.log('Manual refresh triggered');
    loadAssetDetails();
  };

  // Expose refresh method globally for audit completion callbacks
  useEffect(() => {
    (window as any).refreshAssetDetails = refreshAssetDetails;
    return () => {
      delete (window as any).refreshAssetDetails;
    };
  }, [id]);

  // Subscribe to asset update service
  useEffect(() => {
    if (!id) return;

    const unsubscribe = assetUpdateService.subscribe(id, (assetId, updateData) => {
      console.log(`🔔 Received update notification for asset ${assetId}:`, updateData);
      
      // Show notification based on update type
      if (updateData?.type === 'audit_completed') {
        toast.success('Asset audit completed! Refreshing data...', {
          autoClose: 3000
        });
      } else if (updateData?.type === 'status_changed') {
        toast.info(`Asset status changed: ${updateData.oldStatus} → ${updateData.newStatus}`, {
          autoClose: 3000
        });
      }
      
      // Refresh the asset details
      loadAssetDetails(true);
    });

    return unsubscribe;
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Under Maintenance':
        return 'warning';
      case 'Available':
        return 'info';
      case 'Damaged':
        return 'error';
      default:
        return 'default';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'Excellent':
        return 'success';
      case 'Good':
        return 'info';
      case 'Fair':
        return 'warning';
      case 'Poor':
        return 'error';
      default:
        return 'default';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQR = () => {
    const canvas = document.querySelector('#asset-qr-canvas canvas') as HTMLCanvasElement;
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `${asset?.unique_asset_id}-qr.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          toast.success('QR Code downloaded');
        }
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (error || !asset) {
    return (
      <DashboardLayout>
        <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
          <Alert severity="error">{error || 'Asset not found'}</Alert>
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={handleBackNavigation}
            sx={{ mt: 2 }}
          >
            Back to Assets
          </Button>
        </Box>
      </DashboardLayout>
    );
  }

  const qrData = JSON.stringify({
    type: 'asset',
    id: asset._id,
    asset_id: asset.unique_asset_id,
    name: `${asset.manufacturer} ${asset.model}`,
    manufacturer: asset.manufacturer,
    model: asset.model,
    serial: asset.serial_number,
    category: asset.asset_type,
    location: asset.location,
    status: asset.status,
    condition: asset.condition,
    purchase_date: asset.purchase_date,
    purchase_cost: asset.purchase_cost,
    department: asset.department,
    scan_url: `${window.location.origin}/assets/${asset._id}`
  });

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        {/* Header with Real-time Update Indicator */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button 
              startIcon={<ArrowBackIcon />}
              onClick={handleBackNavigation}
            >
              Back
            </Button>
            <Typography variant="h4" component="h1">
              Asset Details
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {/* Auto-refresh indicator */}
            <Chip
              label={autoRefresh ? `Auto-updating` : 'Auto-update paused'}
              color={autoRefresh ? 'success' : 'default'}
              size="small"
              onClick={() => setAutoRefresh(!autoRefresh)}
              sx={{ cursor: 'pointer' }}
            />
            <Typography variant="caption" color="text.secondary">
              Updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<QrCodeIcon />}
              onClick={() => setShowQR(!showQR)}
            >
              {showQR ? 'Hide' : 'Show'} QR Code
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
            >
              Print
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/assets?edit=${asset._id}`)}
            >
              Edit Asset
            </Button>
          </Box>
        </Box>

        {/* Last Audit Info Banner */}
        {asset.last_audit_date && (
          <Alert 
            severity="info" 
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={() => loadAssetDetails()}>
                Refresh
              </Button>
            }
          >
            Last audited {new Date(asset.last_audit_date).toLocaleString()}
            {asset.last_audited_by && ` by ${asset.last_audited_by.name}`}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Main Info Card */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64 }}>
                    <BusinessIcon fontSize="large" />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {asset.manufacturer} {asset.model}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {asset.unique_asset_id}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <CategoryIcon color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Category
                        </Typography>
                        <Typography variant="body1">{asset.asset_type}</Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <LocationIcon color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Location
                        </Typography>
                        <Typography variant="body1">{asset.location}</Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Status
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          label={asset.status}
                          color={getStatusColor(asset.status) as any}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Condition
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          label={asset.condition}
                          color={getConditionColor(asset.condition) as any}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Serial Number
                    </Typography>
                    <Typography variant="body1">{asset.serial_number}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Department
                    </Typography>
                    <Typography variant="body1">{asset.department}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon color="action" fontSize="small" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Purchase Date
                        </Typography>
                        <Typography variant="body1">
                          {asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MoneyIcon color="action" fontSize="small" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Purchase Cost
                        </Typography>
                        <Typography variant="body1">
                          ₹{asset.purchase_cost ? asset.purchase_cost.toLocaleString() : '0'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {asset.warranty_expiry && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Warranty Expiry
                      </Typography>
                      <Typography variant="body1">
                        {new Date(asset.warranty_expiry).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  )}

                  {asset.assigned_user && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon color="action" fontSize="small" />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Assigned To
                          </Typography>
                          <Typography variant="body1">{asset.assigned_user.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {asset.assigned_user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  {asset.last_audit_date && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Last Audit
                      </Typography>
                      <Typography variant="body1">
                        {new Date(asset.last_audit_date).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* QR Code and Additional Info */}
          <Grid item xs={12} md={4}>
            {showQR && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom align="center">
                    Asset QR Code
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Paper sx={{ p: 2, bgcolor: 'white' }} id="asset-qr-canvas">
                      <QRCodeCanvas
                        value={qrData}
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    </Paper>
                  </Box>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleDownloadQR}
                  >
                    Download QR Code
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Information
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body2">
                    {new Date(asset.createdAt).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body2">
                    {new Date(asset.updatedAt).toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Audit History Section */}
        {asset.audit_history && asset.audit_history.length > 0 && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Audit History
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {asset.audit_history.map((audit: any, index: number) => (
                  <Paper
                    key={audit._id || index}
                    sx={{
                      p: 2,
                      mb: 1,
                      bgcolor: 'background.default',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box>
                        <Chip
                          label={audit.action.replace(/_/g, ' ').toUpperCase()}
                          size="small"
                          color={audit.action.includes('completed') ? 'success' : 'default'}
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="body2">
                          {audit.description}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(audit.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                    
                    {audit.user_id && (
                      <Typography variant="caption" color="text.secondary">
                        By: {audit.user_id.name} ({audit.user_id.email})
                      </Typography>
                    )}
                    
                    {audit.new_values && (
                      <Box sx={{ mt: 1, p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                        <Typography variant="caption" fontWeight="bold">
                          Updated Values:
                        </Typography>
                        {audit.new_values.condition && (
                          <Typography variant="caption" display="block">
                            Condition: {audit.new_values.condition}
                          </Typography>
                        )}
                        {audit.new_values.status && (
                          <Typography variant="caption" display="block">
                            Status: {audit.new_values.status}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </DashboardLayout>
  );
};

export default AssetDetailsPage;
