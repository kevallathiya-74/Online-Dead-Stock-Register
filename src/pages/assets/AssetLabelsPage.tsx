import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  QrCode as QrCodeIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const AssetLabelsPage: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState('');
  const [labelType, setLabelType] = useState('qr');
  const [labelSize, setLabelSize] = useState('medium');

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/assets');
      setAssets(response.data);
    } catch (error: any) {
      console.error('Failed to load assets:', error);
      toast.error('Failed to load assets');
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLabel = () => {
    if (!selectedAsset) {
      toast.error('Please select an asset');
      return;
    }

    const asset = assets.find(a => a._id === selectedAsset);
    toast.success(`Generating ${labelType.toUpperCase()} label for: ${asset?.name}`);
    
    // In a real implementation, this would generate and download the label
  };

  const handlePrintLabel = () => {
    if (!selectedAsset) {
      toast.error('Please select an asset');
      return;
    }

    const asset = assets.find(a => a._id === selectedAsset);
    toast.success(`Printing label for: ${asset?.name}`);
    
    // In a real implementation, this would trigger print dialog
  };

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
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Asset Labels & QR Codes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Generate and print labels and QR codes for assets
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Configuration Card */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Label Configuration
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Select Asset</InputLabel>
                      <Select
                        value={selectedAsset}
                        label="Select Asset"
                        onChange={(e) => setSelectedAsset(e.target.value)}
                      >
                        <MenuItem value="">
                          <em>Select an asset</em>
                        </MenuItem>
                        {assets.map((asset) => (
                          <MenuItem key={asset._id} value={asset._id}>
                            {asset.name} ({asset.unique_asset_id})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Label Type</InputLabel>
                      <Select
                        value={labelType}
                        label="Label Type"
                        onChange={(e) => setLabelType(e.target.value)}
                      >
                        <MenuItem value="qr">QR Code</MenuItem>
                        <MenuItem value="barcode">Barcode</MenuItem>
                        <MenuItem value="text">Text Label</MenuItem>
                        <MenuItem value="combined">Combined (QR + Text)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Label Size</InputLabel>
                      <Select
                        value={labelSize}
                        label="Label Size"
                        onChange={(e) => setLabelSize(e.target.value)}
                      >
                        <MenuItem value="small">Small (2x1 inch)</MenuItem>
                        <MenuItem value="medium">Medium (3x2 inch)</MenuItem>
                        <MenuItem value="large">Large (4x3 inch)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<QrCodeIcon />}
                        onClick={handleGenerateLabel}
                        fullWidth
                      >
                        Generate Label
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<PrintIcon />}
                        onClick={handlePrintLabel}
                        fullWidth
                      >
                        Print
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Preview Card */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Label Preview
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: 300,
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                    p: 3,
                  }}
                >
                  {selectedAsset ? (
                    <Box sx={{ textAlign: 'center' }}>
                      <QrCodeIcon sx={{ fontSize: 120, color: 'grey.600', mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        {assets.find(a => a._id === selectedAsset)?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {assets.find(a => a._id === selectedAsset)?.unique_asset_id}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Select an asset to see preview
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Bulk Operations */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Bulk Label Generation
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Alert severity="info" sx={{ mb: 3 }}>
                  Generate labels for multiple assets at once. Perfect for new asset batches.
                </Alert>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<QrCodeIcon />}
                  >
                    Generate All Active Assets
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                  >
                    Download Batch Template
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
};

export default AssetLabelsPage;
