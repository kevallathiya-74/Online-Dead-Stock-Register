import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  IconButton,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  QrCodeScanner as QrIcon,
  Close as CloseIcon,
  CameraAlt as CameraIcon,
  FlashOn as FlashOnIcon,
  FlashOff as FlashOffIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { BrowserQRCodeReader } from '@zxing/library';

interface Asset {
  id: string;
  unique_asset_id: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  status: string;
  location: string;
  assigned_user: string;
  last_audit_date: string;
  condition: string;
  category?: string;
  assigned_date?: string;
  warranty_expiry?: string;
}

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  onAssetFound: (asset: Asset) => void;
  mode?: 'audit' | 'lookup' | 'checkout';
}

const QRScanner = ({ open, onClose, onAssetFound, mode = 'lookup' }: QRScannerProps) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scannedAsset, setScannedAsset] = useState<Asset | null>(null);
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);

  const handleQRCodeDetected = useCallback(async (qrText: string) => {
    try {
      // Add to scan history
      setScanHistory(prev => [qrText, ...prev.slice(0, 4)]);
      
      setLoading(true);
      
      // Mock API call to fetch asset by QR code
      // In real implementation, this would call your backend API
      const mockAsset: Asset = {
        id: '1',
        unique_asset_id: qrText,
        manufacturer: 'Dell',
        model: 'XPS 15',
        serial_number: 'DLL123456789',
        status: 'Active',
        location: 'IT Department - Floor 2',
        assigned_user: 'John Smith',
        last_audit_date: '2024-01-01',
        condition: 'Good',
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setScannedAsset(mockAsset);
      onAssetFound(mockAsset);
      
      // Auto-close after successful scan in lookup mode
      if (mode === 'lookup') {
        setTimeout(() => {
          onClose();
        }, 2000);
      }
      
    } catch (err: any) {
      console.error('Asset lookup error:', err);
      setError('Asset not found or lookup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [onAssetFound, onClose, mode]);

  const startScanning = useCallback(async (deviceId?: string) => {
    try {
      if (!codeReaderRef.current || !videoRef.current) return;

      setScanning(true);
      setError(null);

      await codeReaderRef.current.decodeFromVideoDevice(
        deviceId || null,
        videoRef.current,
        (result, error) => {
          if (result) {
            handleQRCodeDetected(result.getText());
          }
          if (error) {
            // Don't log every decode error as they're common during scanning
            if (error.name !== 'NotFoundException') {
              console.warn('QR Scan error:', error);
            }
          }
        }
      );
    } catch (err: any) {
      console.error('Scanning start error:', err);
      setError('Failed to start camera scanning. Please try again.');
      setScanning(false);
    }
  }, [handleQRCodeDetected]);

  const initializeScanner = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check camera permissions
      try {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        
        if (permission.state === 'denied') {
          setError('Camera permission denied. Please enable camera access to scan QR codes.');
          return;
        }
      } catch (permErr) {
        console.warn('Permission query not supported, continuing...');
      }

      // Initialize QR code reader
      codeReaderRef.current = new BrowserQRCodeReader();
      
      // Get available video devices
      try {
        const videoDevices = await navigator.mediaDevices.enumerateDevices();
        const cameras = videoDevices.filter(device => device.kind === 'videoinput');
        
        if (cameras.length === 0) {
          setError('No camera devices found. Please connect a camera to scan QR codes.');
          return;
        }

        // Start scanning with the first available camera
        startScanning(cameras[0].deviceId);
      } catch (deviceErr) {
        console.error('Device enumeration error:', deviceErr);
        // Fallback to default camera
        startScanning();
      }
      
    } catch (err: any) {
      console.error('Scanner initialization error:', err);
      setError('Failed to initialize camera. Please check your camera permissions and try again.');
    } finally {
      setLoading(false);
    }
  }, [startScanning]);

  useEffect(() => {
    if (open) {
      initializeScanner();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [open, initializeScanner]);

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    setScanning(false);
  };



  const toggleFlash = () => {
    // Flash toggle implementation would depend on browser support
    // This is a placeholder for the UI
    setFlashEnabled(!flashEnabled);
  };

  const restartScanning = () => {
    setScannedAsset(null);
    setError(null);
    initializeScanner();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'success';
      case 'available': return 'info';
      case 'under maintenance': return 'warning';
      case 'damaged': return 'error';
      default: return 'default';
    }
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'audit': return 'Audit Mode - Scan Asset QR Code';
      case 'checkout': return 'Check-out Asset - Scan QR Code';
      case 'lookup': return 'Asset Lookup - Scan QR Code';
      default: return 'Scan QR Code';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh', maxHeight: 800 }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <QrIcon />
            <Typography variant="h6">{getModeTitle()}</Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2} sx={{ height: '100%' }}>
          {/* Camera View */}
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ height: '100%', p: 1 }}>
                {loading && (
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    height="100%"
                    flexDirection="column"
                    gap={2}
                  >
                    <CircularProgress />
                    <Typography>Initializing camera...</Typography>
                  </Box>
                )}

                {error && (
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    height="100%"
                    flexDirection="column"
                    gap={2}
                  >
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                    <Button
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={restartScanning}
                    >
                      Try Again
                    </Button>
                  </Box>
                )}

                {!loading && !error && (
                  <Box position="relative" width="100%" height="100%">
                    <Box
                      component="video"
                      ref={videoRef}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: 2,
                        backgroundColor: '#000',
                      }}
                      autoPlay
                      playsInline
                    />
                    
                    {/* Scanning Overlay */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 200,
                        height: 200,
                        border: '2px solid #fff',
                        borderRadius: 2,
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: -2,
                          left: -2,
                          right: -2,
                          bottom: -2,
                          border: '2px solid #2196f3',
                          borderRadius: 2,
                          animation: scanning ? 'pulse 2s infinite' : 'none',
                        },
                        '@keyframes pulse': {
                          '0%': { opacity: 0.5 },
                          '50%': { opacity: 1 },
                          '100%': { opacity: 0.5 },
                        },
                      }}
                    />

                    {/* Camera Controls */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 16,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: 1,
                      }}
                    >
                      <IconButton
                        onClick={toggleFlash}
                        sx={{
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.7)',
                          },
                        }}
                      >
                        {flashEnabled ? <FlashOnIcon /> : <FlashOffIcon />}
                      </IconButton>
                      <IconButton
                        onClick={restartScanning}
                        sx={{
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.7)',
                          },
                        }}
                      >
                        <RefreshIcon />
                      </IconButton>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Asset Information */}
          <Grid item xs={12} md={4}>
            {scannedAsset ? (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="success.main">
                    Asset Found!
                  </Typography>
                  
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Asset ID
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {scannedAsset.unique_asset_id}
                    </Typography>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Asset Details
                    </Typography>
                    <Typography variant="body1">
                      {scannedAsset.manufacturer} {scannedAsset.model}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      S/N: {scannedAsset.serial_number}
                    </Typography>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={scannedAsset.status}
                      size="small"
                      color={getStatusColor(scannedAsset.status) as any}
                    />
                  </Box>

                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body2">
                      {scannedAsset.location}
                    </Typography>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Assigned To
                    </Typography>
                    <Typography variant="body2">
                      {scannedAsset.assigned_user}
                    </Typography>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Condition
                    </Typography>
                    <Typography variant="body2">
                      {scannedAsset.condition}
                    </Typography>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Last Audit
                    </Typography>
                    <Typography variant="body2">
                      {new Date(scannedAsset.last_audit_date).toLocaleDateString()}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    height={200}
                    flexDirection="column"
                    gap={2}
                  >
                    <CameraIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                    <Typography variant="body1" color="text.secondary" textAlign="center">
                      Position the QR code within the scanning area
                    </Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      Make sure the code is well-lit and clearly visible
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Scan History */}
            {scanHistory.length > 0 && (
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Recent Scans
                  </Typography>
                  <List dense>
                    {scanHistory.map((scan, index) => (
                      <Box key={index}>
                        <ListItem>
                          <ListItemText
                            primary={scan}
                            secondary={`Scan ${index + 1}`}
                          />
                        </ListItem>
                        {index < scanHistory.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {scannedAsset && mode !== 'lookup' && (
          <Button variant="contained" onClick={() => onClose()}>
            Continue with Asset
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default QRScanner;