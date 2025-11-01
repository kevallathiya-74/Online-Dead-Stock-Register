import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Chip,
} from '@mui/material';
import {
  QrCodeScanner as ScannerIcon,
  Close as CloseIcon,
  CameraAlt as CameraIcon,
  FlashlightOn as FlashlightIcon,
  FlashlightOff as FlashlightOffIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { BrowserQRCodeReader } from '@zxing/library';

const QRScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setError('');
      const codeReader = new BrowserQRCodeReader();
      codeReaderRef.current = codeReader;

      const videoInputDevices = await codeReader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        throw new Error('No camera found');
      }

      // Prefer back camera
      const selectedDeviceId = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back')
      )?.deviceId || videoInputDevices[0].deviceId;

      setScanning(true);
      toast.success('Camera started. Point at QR code');

      codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current!,
        (result, error) => {
          if (result) {
            handleQRCodeDetected(result.getText());
          }
          // Errors are normal during scanning, ignore them
        }
      );
    } catch (err: any) {
      console.error('Camera access error:', err);
      setError('Failed to access camera. Please grant camera permissions.');
      toast.error('Camera access denied');
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setScanning(false);
  };

  const toggleTorch = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    
    try {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      const capabilities: any = track.getCapabilities();
      
      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !torchOn }]
        } as any);
        setTorchOn(!torchOn);
        toast.success(torchOn ? 'Flashlight off' : 'Flashlight on');
      } else {
        toast.info('Flashlight not available on this device');
      }
    } catch (err) {
      console.error('Torch error:', err);
      toast.error('Failed to toggle flashlight');
    }
  };

  const [scannedAsset, setScannedAsset] = useState<any>(null);

  const handleQRCodeDetected = async (data: string) => {
    stopScanning();
    
    try {
      // Call backend API to scan asset - this will create audit log and return asset details
      console.log('Scanned QR Code Data:', data);
      toast.info('Processing QR code...');
      
      const response = await fetch(`/api/v1/qr/scan/${encodeURIComponent(data)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.message || 'Asset not found');
      }

      const result = await response.json();
      console.log('Scan result:', result);
      
      if (result.success && result.asset) {
        toast.success('Asset found!');
        // Store the scanned asset to display in table format
        setScannedAsset(result.asset);
        setError('');
        console.log('Asset data set:', result.asset);
      } else {
        setError('Invalid QR code. Asset not found.');
        toast.error('Asset not found');
      }
    } catch (err: any) {
      console.error('QR scan error:', err);
      setError(err.message || 'Invalid QR code. Please scan a valid asset QR code.');
      toast.error(err.message || 'Failed to scan QR code');
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              <ScannerIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
              Scan Asset QR Code
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use your camera to scan asset QR codes for instant details
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<CloseIcon />}
            onClick={() => navigate('/assets')}
          >
            Cancel
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Card>
          <CardContent>
            {!scanning ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <ScannerIcon sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
                <Typography variant="h6" gutterBottom>
                  Ready to Scan
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                  Click the button below to activate your camera and scan a QR code
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<CameraIcon />}
                  onClick={startScanning}
                >
                  Start Camera
                </Button>
              </Box>
            ) : (
              <Box>
                <Paper sx={{ position: 'relative', bgcolor: 'black', overflow: 'hidden', borderRadius: 2 }}>
                  <video
                    ref={videoRef}
                    style={{
                      width: '100%',
                      maxHeight: '500px',
                      display: 'block',
                    }}
                    playsInline
                  />
                  
                  {/* Scanning overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    <Box
                      sx={{
                        width: '250px',
                        height: '250px',
                        border: '3px solid',
                        borderColor: 'primary.main',
                        borderRadius: 2,
                        position: 'relative',
                        '&::before, &::after': {
                          content: '""',
                          position: 'absolute',
                          width: '20px',
                          height: '20px',
                          border: '4px solid',
                          borderColor: 'primary.main',
                        },
                        '&::before': { top: -2, left: -2, borderRight: 0, borderBottom: 0 },
                        '&::after': { bottom: -2, right: -2, borderLeft: 0, borderTop: 0 },
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          width: '20px',
                          height: '20px',
                          border: '4px solid',
                          borderColor: 'primary.main',
                          top: -2,
                          right: -2,
                          borderLeft: 0,
                          borderBottom: 0,
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          width: '20px',
                          height: '20px',
                          border: '4px solid',
                          borderColor: 'primary.main',
                          bottom: -2,
                          left: -2,
                          borderRight: 0,
                          borderTop: 0,
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Control buttons */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      left: 0,
                      right: 0,
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 2,
                    }}
                  >
                    <IconButton
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' },
                      }}
                      onClick={toggleTorch}
                    >
                      {torchOn ? <FlashlightOffIcon /> : <FlashlightIcon />}
                    </IconButton>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={stopScanning}
                      startIcon={<CloseIcon />}
                    >
                      Stop Scanning
                    </Button>
                  </Box>
                </Paper>
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Tip:</strong> Hold the QR code steady within the frame. The scanner will automatically detect and show asset details.
                  </Typography>
                </Alert>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Asset Details Table - Show after successful scan */}
        {scannedAsset && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" color="success.main">
                  ✓ Asset Scanned Successfully
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setScannedAsset(null);
                    setError('');
                    startScanning();
                  }}
                >
                  Scan Another
                </Button>
              </Box>

              <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 'bold', width: '30%', bgcolor: 'grey.50' }}>
                        Asset ID
                      </TableCell>
                      <TableCell>{scannedAsset.unique_asset_id}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>
                        Asset Name
                      </TableCell>
                      <TableCell>{scannedAsset.name || `${scannedAsset.manufacturer} ${scannedAsset.model}`}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>
                        Category
                      </TableCell>
                      <TableCell>{scannedAsset.category || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>
                        Manufacturer
                      </TableCell>
                      <TableCell>{scannedAsset.manufacturer}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>
                        Model
                      </TableCell>
                      <TableCell>{scannedAsset.model}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>
                        Serial Number
                      </TableCell>
                      <TableCell>{scannedAsset.serial_number}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>
                        Status
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={scannedAsset.status} 
                          color={scannedAsset.status === 'Active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>
                        Condition
                      </TableCell>
                      <TableCell>{scannedAsset.condition}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>
                        Location
                      </TableCell>
                      <TableCell>{scannedAsset.location}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>
                        Department
                      </TableCell>
                      <TableCell>{scannedAsset.department || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>
                        Assigned To
                      </TableCell>
                      <TableCell>{scannedAsset.assigned_user?.name || 'Unassigned'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>
                        Purchase Date
                      </TableCell>
                      <TableCell>
                        {scannedAsset.purchase_date 
                          ? new Date(scannedAsset.purchase_date).toLocaleDateString() 
                          : 'N/A'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>
                        Purchase Cost
                      </TableCell>
                      <TableCell>
                        {scannedAsset.purchase_cost 
                          ? `₹${parseFloat(scannedAsset.purchase_cost).toLocaleString('en-IN')}` 
                          : 'N/A'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>
                        Warranty Expiry
                      </TableCell>
                      <TableCell>
                        {scannedAsset.warranty_expiry 
                          ? new Date(scannedAsset.warranty_expiry).toLocaleDateString() 
                          : 'N/A'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>
                        Last Audit Date
                      </TableCell>
                      <TableCell>
                        {scannedAsset.last_audit_date 
                          ? new Date(scannedAsset.last_audit_date).toLocaleDateString() 
                          : 'Not audited yet'}
                      </TableCell>
                    </TableRow>
                    {scannedAsset.vendor && (
                      <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>
                          Vendor
                        </TableCell>
                        <TableCell>{scannedAsset.vendor.name || scannedAsset.vendor.vendor_name}</TableCell>
                      </TableRow>
                    )}
                    {scannedAsset.notes && (
                      <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }}>
                          Notes
                        </TableCell>
                        <TableCell>{scannedAsset.notes}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Paper>

              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/assets')}
                >
                  View All Assets
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate(`/assets/${scannedAsset.id}`)}
                >
                  View Full Details
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </DashboardLayout>
  );
};

export default QRScannerPage;
