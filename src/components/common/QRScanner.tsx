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
import api from '../../services/api';

interface Asset {
  id: string;
  unique_asset_id: string;
  name?: string;
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

  const restartScanningRef = useRef<(() => void) | undefined>(undefined);

  const handleQRCodeDetected = useCallback(async (qrText: string) => {
    try {
      // Add to scan history
      setScanHistory(prev => [qrText, ...prev.slice(0, 4)]);
      
      setLoading(true);
      setScanning(false);
      
      // Stop scanning to prevent multiple scans
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
      
      try {
        // Call backend API to scan asset - this creates audit log automatically
        const response = await api.get(`/qr/scan/${encodeURIComponent(qrText)}`, {
          params: {
            mode: mode,
            include_history: true
          }
        });
        
        const result = response.data;
        
        if (result.success && result.asset) {
          // Map backend response to frontend Asset interface
          const asset: Asset = {
            id: result.asset.id,
            unique_asset_id: result.asset.unique_asset_id,
            manufacturer: result.asset.manufacturer,
            model: result.asset.model,
            serial_number: result.asset.serial_number,
            status: result.asset.status,
            location: result.asset.location,
            assigned_user: result.asset.assigned_user?.name || 'Unassigned',
            last_audit_date: result.asset.last_audit_date,
            condition: result.asset.condition,
            category: result.asset.category,
            assigned_date: result.asset.assigned_user?.assigned_date,
            warranty_expiry: result.asset.warranty_expiry
          };
          
          setScannedAsset(asset);
          onAssetFound(asset);
          
          // Auto-close after successful scan in lookup mode
          if (mode === 'lookup') {
            setTimeout(() => {
              onClose();
            }, 2000);
          }
        } else {
          throw new Error('Asset not found');
        }
      } catch (error: any) {
        console.error('Error scanning asset:', error);
        const errorMessage = error.response?.data?.message || 'Asset not found';
        setError(errorMessage);
        // Restart scanning after error
        setTimeout(() => {
          setError(null);
          if (restartScanningRef.current) {
            restartScanningRef.current();
          }
        }, 2000);
      }
      
    } catch (err: any) {
      console.error('Asset scan error:', err);
      setError('Scan failed. Please try again.');
      setTimeout(() => {
        setError(null);
        if (restartScanningRef.current) {
          restartScanningRef.current();
        }
      }, 2000);
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

  // Store reference to startScanning for use in handleQRCodeDetected
  useEffect(() => {
    restartScanningRef.current = startScanning;
  }, [startScanning]);

  const initializeScanner = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setScannedAsset(null);

      // Check camera permissions first
      try {
        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        // Stop the test stream
        stream.getTracks().forEach(track => track.stop());
      } catch (permErr: any) {
        console.error('Camera permission error:', permErr);
        setError('Camera access denied. Please grant camera permissions and try again.');
        setLoading(false);
        return;
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
                      minHeight: { xs: '250px', sm: '350px', md: '450px' },
                      objectFit: 'cover',
                      borderRadius: 2,
                      backgroundColor: '#000',
                    }}
                    autoPlay
                    playsInline
                    muted
                  />
                    
                    {/* Scanning Overlay */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: { xs: 180, sm: 200, md: 220 },
                        height: { xs: 180, sm: 200, md: 220 },
                        border: '3px solid #fff',
                        borderRadius: 2,
                        boxShadow: '0 0 0 4px rgba(33, 150, 243, 0.3)',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: -2,
                          left: -2,
                          right: -2,
                          bottom: -2,
                          border: '3px solid #2196f3',
                          borderRadius: 2,
                          animation: scanning ? 'pulse 2s infinite' : 'none',
                        },
                        '@keyframes pulse': {
                          '0%': { opacity: 0.4 },
                          '50%': { opacity: 1 },
                          '100%': { opacity: 0.4 },
                        },
                      }}
                    >
                      {/* Corner markers */}
                      <Box sx={{
                        position: 'absolute',
                        top: -3, left: -3,
                        width: 20, height: 20,
                        borderTop: '4px solid #fff',
                        borderLeft: '4px solid #fff',
                      }} />
                      <Box sx={{
                        position: 'absolute',
                        top: -3, right: -3,
                        width: 20, height: 20,
                        borderTop: '4px solid #fff',
                        borderRight: '4px solid #fff',
                      }} />
                      <Box sx={{
                        position: 'absolute',
                        bottom: -3, left: -3,
                        width: 20, height: 20,
                        borderBottom: '4px solid #fff',
                        borderLeft: '4px solid #fff',
                      }} />
                      <Box sx={{
                        position: 'absolute',
                        bottom: -3, right: -3,
                        width: 20, height: 20,
                        borderBottom: '4px solid #fff',
                        borderRight: '4px solid #fff',
                      }} />
                    </Box>                    {/* Camera Controls */}
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