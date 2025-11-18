import React, { useState, useEffect, useRef } from 'react';
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
  Paper,
} from '@mui/material';
import {
  QrCode as QrCodeIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { QRCodeCanvas } from 'qrcode.react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const AssetLabelsPage: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState('');
  const [selectedAssetData, setSelectedAssetData] = useState<any>(null);
  const [labelType, setLabelType] = useState('qr');
  const [labelSize, setLabelSize] = useState('medium');
  const [generating, setGenerating] = useState(false);
  const qrCodeRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  useEffect(() => {
    if (selectedAsset) {
      const asset = assets.find(a => a._id === selectedAsset || a.id === selectedAsset);
      setSelectedAssetData(asset || null);
    } else {
      setSelectedAssetData(null);
    }
  }, [selectedAsset, assets]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/assets');
      // Backend returns { data: { assets: [] } } or { data: [] } or { assets: [] }
      const assetsData = response.data.data || response.data.assets || response.data;
      setAssets(Array.isArray(assetsData) ? assetsData : []);
    } catch (error: any) {
      console.error('Failed to load assets:', error);
      toast.error('Failed to load assets');
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const getQRData = (asset: any) => {
    return JSON.stringify({
      type: 'asset',
      id: asset._id || asset.id,
      asset_id: asset.unique_asset_id,
      name: asset.name || `${asset.manufacturer} ${asset.model}`,
      manufacturer: asset.manufacturer,
      model: asset.model,
      serial: asset.serial_number,
      category: asset.asset_type,
      location: asset.location,
      status: asset.status,
      condition: asset.condition,
      scan_url: `${window.location.origin}/assets/${asset._id || asset.id}`
    });
  };

  const handleGenerateLabel = async () => {
    if (!selectedAsset) {
      toast.error('Please select an asset');
      return;
    }

    if (!selectedAssetData) {
      toast.error('Asset data not found');
      return;
    }

    try {
      setGenerating(true);

      // Wait for QR code to render
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!qrCodeRef.current) {
        toast.error('QR code not ready. Please try again.');
        return;
      }

      // Get the canvas element
      const canvas = qrCodeRef.current;
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Failed to generate QR code image');
          return;
        }

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${selectedAssetData.unique_asset_id}_${labelType}_label.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(`${labelType.toUpperCase()} label generated and downloaded for: ${selectedAssetData.name || selectedAssetData.unique_asset_id}`);
      });
    } catch (error) {
      console.error('Failed to generate label:', error);
      toast.error('Failed to generate label');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrintLabel = () => {
    if (!selectedAsset) {
      toast.error('Please select an asset');
      return;
    }

    if (!selectedAssetData) {
      toast.error('Asset data not found');
      return;
    }

    // Open print dialog for the QR code
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print labels');
      return;
    }

    const qrData = getQRData(selectedAssetData);
    const assetName = selectedAssetData.name || `${selectedAssetData.manufacturer} ${selectedAssetData.model}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Label - ${selectedAssetData.unique_asset_id}</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { margin: 0.5cm; }
            }
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
            }
            .label {
              text-align: center;
              padding: 20px;
              border: 2px solid #000;
              max-width: ${labelSize === 'small' ? '2in' : labelSize === 'medium' ? '3in' : '4in'};
            }
            .label h2 { margin: 10px 0; font-size: 14px; }
            .label p { margin: 5px 0; font-size: 12px; }
            .qr-container { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="qr-container" id="qr-container"></div>
            <h2>${assetName}</h2>
            <p><strong>${selectedAssetData.unique_asset_id}</strong></p>
            <p>${selectedAssetData.location || 'N/A'}</p>
            <p>Status: ${selectedAssetData.status || 'N/A'}</p>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
          <script>
            const qrData = ${JSON.stringify(qrData)};
            const qrSize = ${labelSize === 'small' ? '150' : labelSize === 'medium' ? '200' : '250'};
            
            QRCode.toCanvas(qrData, { width: qrSize, margin: 1 }, function (error, canvas) {
              if (error) {
                console.error(error);
                document.getElementById('qr-container').innerHTML = '<p>Failed to generate QR code</p>';
              } else {
                document.getElementById('qr-container').appendChild(canvas);
                // Auto-print after QR is loaded
                setTimeout(() => window.print(), 500);
              }
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();

    toast.success('Opening print dialog...');
  };

  const handleBulkGenerate = async () => {
    const activeAssets = assets.filter(a => a.status === 'Active' || a.status === 'Available');
    
    if (activeAssets.length === 0) {
      toast.error('No active assets found');
      return;
    }

    try {
      setGenerating(true);
      toast.info(`Generating labels for ${activeAssets.length} active assets...`);

      // Create a print window with all QR codes
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow popups to generate bulk labels');
        return;
      }

      let htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Bulk Asset Labels</title>
            <style>
              @media print {
                body { margin: 0; }
                @page { margin: 0.5cm; }
                .label { page-break-inside: avoid; }
              }
              body { font-family: Arial, sans-serif; padding: 20px; }
              .label-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 20px;
                margin: 20px 0;
              }
              .label {
                text-align: center;
                padding: 15px;
                border: 2px solid #000;
              }
              .label h3 { margin: 10px 0; font-size: 14px; }
              .label p { margin: 5px 0; font-size: 12px; }
              .qr-container { margin: 10px 0; }
            </style>
          </head>
          <body>
            <h1>Asset Labels (${activeAssets.length} items)</h1>
            <div class="label-grid">
      `;

      activeAssets.forEach((asset, index) => {
        const assetName = asset.name || `${asset.manufacturer} ${asset.model}`;
        htmlContent += `
          <div class="label">
            <div class="qr-container" id="qr-${index}"></div>
            <h3>${assetName}</h3>
            <p><strong>${asset.unique_asset_id}</strong></p>
            <p>${asset.location || 'N/A'}</p>
          </div>
        `;
      });

      htmlContent += `
            </div>
            <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
            <script>
              const assets = ${JSON.stringify(activeAssets.map(a => getQRData(a)))};
              let generated = 0;
              
              assets.forEach((qrData, index) => {
                QRCode.toCanvas(qrData, { width: 150, margin: 1 }, function (error, canvas) {
                  if (!error) {
                    document.getElementById('qr-' + index).appendChild(canvas);
                  }
                  generated++;
                  if (generated === assets.length) {
                    setTimeout(() => window.print(), 500);
                  }
                });
              });
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      toast.success(`Generated labels for ${activeAssets.length} active assets`);
    } catch (error) {
      console.error('Failed to generate bulk labels:', error);
      toast.error('Failed to generate bulk labels');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = [
      ['Asset ID', 'Name', 'Manufacturer', 'Model', 'Serial Number', 'Location', 'Status'].join(','),
      ['AST-001', 'Sample Asset', 'Dell', 'Latitude 5520', 'SN123456', 'Office 101', 'Active'].join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'bulk_label_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    toast.success('Template downloaded successfully');
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
                        {assets.map((asset) => {
                          const assetName = asset.name || `${asset.manufacturer} ${asset.model}` || 'Unknown Asset';
                          return (
                            <MenuItem key={asset._id || asset.id} value={asset._id || asset.id}>
                              {assetName} ({asset.unique_asset_id})
                            </MenuItem>
                          );
                        })}
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
                        startIcon={<DownloadIcon />}
                        onClick={handleGenerateLabel}
                        disabled={!selectedAsset || generating}
                        fullWidth
                      >
                        {generating ? 'Generating...' : 'Download Label'}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<PrintIcon />}
                        onClick={handlePrintLabel}
                        disabled={!selectedAsset}
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
                  {selectedAssetData ? (
                    <Box sx={{ textAlign: 'center' }}>
                      {/* Hidden QR Canvas for download */}
                      <Box sx={{ display: 'none' }}>
                        <QRCodeCanvas
                          ref={qrCodeRef}
                          value={getQRData(selectedAssetData)}
                          size={labelSize === 'small' ? 200 : labelSize === 'medium' ? 300 : 400}
                          level="H"
                          includeMargin
                        />
                      </Box>
                      {/* Visible QR Preview */}
                      <Paper elevation={3} sx={{ p: 2, display: 'inline-block' }}>
                        <QRCodeCanvas
                          value={getQRData(selectedAssetData)}
                          size={labelSize === 'small' ? 150 : labelSize === 'medium' ? 200 : 250}
                          level="H"
                          includeMargin
                        />
                      </Paper>
                      <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
                        {selectedAssetData.name || `${selectedAssetData.manufacturer} ${selectedAssetData.model}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedAssetData.unique_asset_id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {selectedAssetData.location || 'No location'} • {selectedAssetData.status || 'Unknown status'}
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

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    startIcon={<QrCodeIcon />}
                    onClick={handleBulkGenerate}
                    disabled={generating || assets.length === 0}
                  >
                    {generating ? 'Generating...' : 'Generate All Active Assets'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadTemplate}
                  >
                    Download Batch Template
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={loadAssets}
                    disabled={loading}
                  >
                    Refresh Assets
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
