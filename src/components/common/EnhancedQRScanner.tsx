import React, { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
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
  Tabs,
  Tab,
  Badge,
  Tooltip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import {
  QrCodeScanner as QrIcon,
  Close as CloseIcon,
  CameraAlt as CameraIcon,
  FlashOn as FlashOnIcon,
  FlashOff as FlashOffIcon,
  Refresh as RefreshIcon,
  QrCodeScanner as QrCodeScannerIcon,
  History as HistoryIcon,
  ViewList as BatchIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  Cameraswitch as SwitchCameraIcon,
} from "@mui/icons-material";
import { BrowserQRCodeReader, NotFoundException } from "@zxing/library";
import api from "../../services/api";
import assetUpdateService from "../../services/assetUpdateService";

interface Asset {
  id: string;
  unique_asset_id: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  status: string;
  location: string;
  assigned_user: string | null;
  last_audit_date: string;
  condition: string;
  category?: string;
  name?: string;
}

interface ScanHistoryItem {
  id: string;
  action: string;
  asset: Asset | null;
  timestamp: string;
  details?: any;
}

interface BatchScanItem {
  qr_code: string;
  asset_id?: string;
  unique_asset_id?: string;
  name?: string;
  status?: string;
  error?: string;
}

interface EnhancedQRScannerProps {
  open: boolean;
  onClose: () => void;
  onAssetFound: (asset: Asset) => void;
  mode?: "audit" | "lookup" | "checkout";
  enableBatchScan?: boolean;
  enableHistory?: boolean;
}

const EnhancedQRScanner: React.FC<EnhancedQRScannerProps> = ({
  open,
  onClose,
  onAssetFound,
  mode = "lookup",
  enableBatchScan = true,
  enableHistory = true,
}) => {
  // Scanning state
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scannedAsset, setScannedAsset] = useState<Asset | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Batch scan state
  const [batchScans, setBatchScans] = useState<BatchScanItem[]>([]);
  const [batchProgress, setBatchProgress] = useState(0);
  const [isBatchScanning, setIsBatchScanning] = useState(false);

  // History state
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const scanningRef = useRef(false);
  const handleQRCodeDetectedRef = useRef<((qrText: string) => Promise<void>) | null>(null);

  // Vibrate on successful scan (mobile)
  const vibrate = (pattern: number | number[] = 200) => {
    try {
      if ("vibrate" in navigator && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (err) {
      // Vibration not supported, ignore
    }
  };

  // Handle QR code detected
  const handleQRCodeDetected = useCallback(
    async (qrText: string) => {
      // Prevent duplicate scans
      if (!scanningRef.current) {
        console.log('⚠️ Scan blocked - scanner not active');
        return;
      }

      // Validate QR code
      if (!qrText || qrText.trim().length === 0) {
        console.error('❌ Invalid QR code - empty string');
        toast.warning('Invalid QR code detected. Please try again.');
        return;
      }

      console.log('🔍 Processing QR code:', qrText);
      
      // Pause scanning while processing to prevent duplicates
      const wasScanning = scanningRef.current;
      scanningRef.current = false;

      try {
        setLoading(true);
        setError(null);

        // Parse QR code data if it's JSON
        let assetIdentifier = qrText.trim();
        try {
          const parsed = JSON.parse(qrText);
          if (parsed.asset_id) {
            assetIdentifier = parsed.asset_id;
            console.log('📋 Using asset_id from JSON:', assetIdentifier);
          } else if (parsed.unique_asset_id) {
            assetIdentifier = parsed.unique_asset_id;
            console.log('📋 Using unique_asset_id from JSON:', assetIdentifier);
          } else if (parsed.serial_number || parsed.serial) {
            assetIdentifier = parsed.serial_number || parsed.serial;
            console.log('📋 Using serial from JSON:', assetIdentifier);
          } else if (parsed.qr_code) {
            assetIdentifier = parsed.qr_code;
            console.log('📋 Using qr_code from JSON:', assetIdentifier);
          }
        } catch (parseError) {
          // Not JSON, use as-is
          console.log('📋 Using raw QR code value:', assetIdentifier);
        }

        // Validate asset identifier before API call
        if (!assetIdentifier || assetIdentifier.length === 0) {
          throw new Error('Invalid asset identifier after parsing');
        }

        console.log('🌐 Calling API with identifier:', assetIdentifier);

        // Call API to get asset details
        const response = await api.get(
          `/qr/scan/${encodeURIComponent(assetIdentifier)}`,
          {
            params: {
              mode,
              include_history: enableHistory,
            },
            timeout: 10000, // 10 second timeout
          }
        );

        console.log('✅ API Response:', response.data);

        if (response.data && response.data.success && response.data.asset) {
          const asset = response.data.asset;
          console.log('✅ Asset found:', asset.unique_asset_id, asset.name);
          console.log('Asset details:', {
            id: asset.id,
            unique_asset_id: asset.unique_asset_id,
            name: asset.name,
            manufacturer: asset.manufacturer,
            model: asset.model,
            status: asset.status,
            location: asset.location
          });
          
          setScannedAsset(asset);
          
          // Show success toast
          const assetName = asset.name || `${asset.manufacturer} ${asset.model}`;
          toast.success(`✅ Asset found: ${assetName}`, {
            position: 'top-center',
            autoClose: 3000
          });
          
          // Call parent callback
          console.log('📤 Calling onAssetFound callback...');
          onAssetFound(asset);

          // Vibrate on success
          vibrate([100, 50, 100]);

          // Notify via update service for real-time synchronization
          if (asset._id || asset.id) {
            const assetId = asset._id || asset.id;
            
            // Use update service for proper event propagation
            assetUpdateService.notifyAuditComplete(assetId, {
              scanned_at: new Date(),
              mode: mode,
              asset: asset
            });
            
            // Fallback: localStorage for cross-tab communication
            localStorage.setItem(`asset_updated_${assetId}`, Date.now().toString());
            
            // Legacy: Try global refresh function if available
            if ((window as any).refreshAssetDetails) {
              (window as any).refreshAssetDetails();
            }
          }

          // Add to batch scans if batch mode is enabled
          if (enableBatchScan && isBatchScanning) {
            setBatchScans((prev) => [
              ...prev,
              {
                qr_code: qrText,
                asset_id: asset.id,
                unique_asset_id: asset.unique_asset_id,
                name: asset.name || `${asset.manufacturer} ${asset.model}`,
                status: "success",
              },
            ]);
            
            // Continue scanning in batch mode
            scanningRef.current = true;
          } else {
            // Stop scanning in single scan mode
            scanningRef.current = false;
          }

          // Auto-close after successful scan in lookup mode
          if (mode === "lookup" && !isBatchScanning) {
            setTimeout(() => {
              onClose();
            }, 2000);
          }
        }
      } catch (err: unknown) {
        console.error('❌ QR scan error:', err);
        const apiError = err as { 
          response?: { 
            data?: { message?: string; suggestions?: string[] };
            status?: number;
          }; 
          message?: string;
          code?: string;
        };
        
        console.error('Error details:', {
          status: apiError.response?.status,
          message: apiError.response?.data?.message || apiError.message,
          code: apiError.code,
          suggestions: apiError.response?.data?.suggestions
        });
        
        let errorMessage = "Asset not found or lookup failed";
        
        if (apiError.response?.data?.message) {
          errorMessage = apiError.response.data.message;
          
          // Add suggestions if available
          if (apiError.response.data.suggestions && Array.isArray(apiError.response.data.suggestions)) {
            errorMessage += '\n\nSuggestions:\n' + apiError.response.data.suggestions.join('\n');
          }
        } else if (apiError.message) {
          if (apiError.code === 'ECONNABORTED' || apiError.message.includes('timeout')) {
            errorMessage = 'Request timeout. Please check your internet connection and try again.';
          } else if (apiError.message.includes('Network Error')) {
            errorMessage = 'Network error. Please check your internet connection.';
          } else {
            errorMessage = apiError.message;
          }
        }
        
        console.error('Final error message:', errorMessage);
        setError(errorMessage);
        toast.error(errorMessage, {
          position: 'top-center',
          autoClose: 5000
        });

        // Vibrate on error
        vibrate([100, 100, 100, 100]);

        // Add to batch scans as error if batch mode
        if (enableBatchScan && isBatchScanning) {
          setBatchScans((prev) => [
            ...prev,
            {
              qr_code: qrText,
              error: errorMessage,
              status: "error",
            },
          ]);
          
          // Continue scanning
          scanningRef.current = true;
        } else {
          scanningRef.current = false;
        }
      } finally {
        setLoading(false);
      }
    },
    [
      onAssetFound,
      onClose,
      mode,
      enableHistory,
      enableBatchScan,
      isBatchScanning,
    ]
  );

  // Update the ref whenever the callback changes
  useEffect(() => {
    handleQRCodeDetectedRef.current = handleQRCodeDetected;
  }, [handleQRCodeDetected]);

  // Start scanning
  const startScanning = useCallback(
    async (deviceId?: string) => {
      try {
        console.log('🎥 Starting camera...', { deviceId, facingMode });
        
        // Prevent multiple simultaneous scan attempts
        if (scanningRef.current) {
          console.log('⚠️ Already scanning, skipping');
          return;
        }

        // Check for camera API support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          const errorMsg = "Camera access is not supported on this device. " +
            (window.location.protocol === 'http:' && window.location.hostname !== 'localhost' 
              ? "Please use HTTPS for camera access on mobile devices." 
              : "Your browser may not support camera access.");
          
          console.error("Camera API not available:", {
            hasNavigator: !!navigator,
            hasMediaDevices: !!navigator.mediaDevices,
            hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            protocol: window.location.protocol,
            hostname: window.location.hostname
          });
          
          setError(errorMsg);
          return;
        }

        // Wait for video element to be ready
        await new Promise((resolve) => setTimeout(resolve, 200));

        if (!videoRef.current) {
          console.error('❌ Video element not ready');
          throw new Error("Video element not available");
        }

        console.log('✅ Video element ready');

        scanningRef.current = true;
        setScanning(true);
        setError(null);

        // Initialize QR code reader if not already initialized
        if (!codeReaderRef.current) {
          console.log('📱 Creating new BrowserQRCodeReader');
          codeReaderRef.current = new BrowserQRCodeReader();
        }

        // Request camera permission and enumerate devices if not provided
        if (!deviceId) {
          console.log('🔍 Requesting camera permission...');
          
          try {
            const permissionStream = await navigator.mediaDevices.getUserMedia({
              video: { 
                facingMode: facingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 }
              },
            });

            console.log('✅ Camera permission granted');

            // Stop the permission stream immediately
            permissionStream.getTracks().forEach((track) => track.stop());

            // Enumerate devices with proper labels
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter(
              (device) => device.kind === "videoinput"
            );
            
            console.log(`📹 Found ${cameras.length} camera(s)`, cameras.map(c => ({ id: c.deviceId, label: c.label })));
            setAvailableCameras(cameras);

            // Determine which camera to use
            if (cameras.length > 0) {
              if (cameras.length > 1) {
                // Try to find camera by label matching facingMode
                const preferredCamera = cameras.find((camera) => {
                  const label = camera.label.toLowerCase();
                  if (facingMode === "environment") {
                    return (
                      label.includes("back") ||
                      label.includes("rear") ||
                      label.includes("environment")
                    );
                  } else {
                    return (
                      label.includes("front") ||
                      label.includes("user") ||
                      label.includes("face")
                    );
                  }
                });

                deviceId = preferredCamera
                  ? preferredCamera.deviceId
                  : cameras[currentCameraIndex]?.deviceId || cameras[0].deviceId;
              } else {
                deviceId = cameras[0].deviceId;
              }
              
              console.log('🎯 Selected camera:', deviceId);
            }
          } catch (permErr) {
            console.error('❌ Permission error:', permErr);
            throw permErr;
          }
        }

        // Start decoding
        console.log('🔄 Starting QR code detection...');
        await codeReaderRef.current.decodeFromVideoDevice(
          deviceId || null,
          videoRef.current,
          (result, error) => {
            if (result && scanningRef.current) {
              const qrText = result.getText();
              console.log('✅ QR Code detected:', qrText);
              // Call handler via ref to always get the latest version
              if (handleQRCodeDetectedRef.current) {
                handleQRCodeDetectedRef.current(qrText);
              } else {
              }
            }
            // Only log actual errors, not NotFoundException which is normal
            if (error && !(error instanceof NotFoundException)) {
            }
          }
        );

        // Wait for video to start
        if (videoRef.current) {
          console.log('⏳ Waiting for video stream...');
          await new Promise<void>((resolve) => {
            const video = videoRef.current;
            if (!video) {
              resolve();
              return;
            }

            const checkVideo = () => {
              if (video.readyState >= 2) {
                console.log('✅ Video stream ready');
                resolve();
              } else {
                video.addEventListener("loadeddata", () => {
                  console.log('✅ Video data loaded');
                  resolve();
                }, {
                  once: true,
                });
              }
            };

            checkVideo();
            // Fallback timeout
            setTimeout(() => {
              console.log('⏰ Video timeout - proceeding anyway');
              resolve();
            }, 3000);
          });
        }

        // Store stream reference
        if (videoRef.current && videoRef.current.srcObject) {
          const mediaStream = videoRef.current.srcObject as MediaStream;
          setStream(mediaStream);
          console.log('✅ Camera started successfully');
          console.log('Stream details:', {
            active: mediaStream.active,
            tracks: mediaStream.getTracks().length,
            videoTracks: mediaStream.getVideoTracks().length
          });
          console.log('🟢 scanningRef.current:', scanningRef.current);
          toast.success('🎬 Camera started! Point at a QR code to scan.');
        } else {
          console.warn('⚠️ Video source object not set');
        }
      } catch (err: unknown) {
        console.error('❌ Camera start failed:', err);
        scanningRef.current = false;
        setScanning(false);

        let errorMessage = "Failed to start camera. Please try again.";
        const error = err as { name?: string; message?: string };

        console.error('Error details:', { name: error.name, message: error.message });

        if (
          error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError"
        ) {
          errorMessage =
            "Camera permission denied. Please allow camera access in your browser settings and refresh the page.";
        } else if (
          error.name === "NotFoundError" ||
          error.name === "DevicesNotFoundError"
        ) {
          errorMessage = "No camera found on this device. Please ensure your device has a camera.";
        } else if (error.name === "NotReadableError") {
          errorMessage =
            "Camera is in use by another application. Please close other apps using the camera and try again.";
        } else if (error.name === "OverconstrainedError") {
          errorMessage =
            "Could not start camera with requested settings. Trying alternate camera...";
          // Try again with opposite facing mode
          setFacingMode(facingMode === "user" ? "environment" : "user");
          setTimeout(() => {
            startScanning();
          }, 500);
          return;
        } else if (error.message) {
          errorMessage = `Camera error: ${error.message}`;
        }

        setError(errorMessage);
        toast.error(errorMessage);
      }
    },
    [facingMode, currentCameraIndex]
  );

  // Initialize scanner
  const initializeScanner = useCallback(async () => {
    try {
      console.log('🚀 Initializing scanner...');
      console.log('Current state:', { scanning: scanningRef.current, loading, error, stream: !!stream });
      setLoading(true);
      setError(null);

      // Clear any previous state
      if (scanningRef.current || stream) {
        console.log('🧹 Cleaning up previous scanner instance...');
        stopScanning();
        // Wait for cleanup to complete
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Small delay to ensure cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Initialize QR code reader
      if (!codeReaderRef.current) {
        console.log('📱 Creating BrowserQRCodeReader instance');
        codeReaderRef.current = new BrowserQRCodeReader();
      } else {
        console.log('ℹ️ Reusing existing BrowserQRCodeReader instance');
      }

      // Start scanning
      console.log('🎬 Starting camera...');
      await startScanning();
      console.log('✅ Scanner initialized successfully');
    } catch (err: unknown) {
      console.error('❌ Scanner initialization failed:', err);
      const error = err as { message?: string; name?: string };
      const errorMsg = error.message || "Failed to initialize camera. Please check permissions and try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [startScanning]);

  // Stop scanning
  const stopScanning = useCallback(() => {
    console.log('🛑 Stopping scanner...');
    
    // Don't stop if not currently scanning
    if (!scanningRef.current && !stream) {
      console.log('ℹ️ Scanner not active, skipping stop');
      return;
    }
    
    scanningRef.current = false;
    setScanning(false);

    // Stop all video tracks
    if (stream) {
      console.log('📹 Stopping video tracks');
      try {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      } catch (err) {
        console.warn('⚠️ Error stopping tracks:', err);
      }
      setStream(null);
    }

    // Reset code reader
    if (codeReaderRef.current) {
      try {
        console.log('🔄 Resetting QR reader');
        codeReaderRef.current.reset();
      } catch (err) {
        console.warn('⚠️ Error resetting QR reader:', err);
      }
    }

    // Clear video source
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject = null;
    }

    setFlashEnabled(false);
    console.log('✅ Scanner stopped');
  }, [stream]);

  // Toggle flash (placeholder - depends on browser support)
  const toggleFlash = async () => {
    if (!scanning || !stream) {
      return;
    }

    try {
      const track = stream.getVideoTracks()[0];
      if (!track) {
        return;
      }

      const capabilities: any = track.getCapabilities();

      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any],
        });
        setFlashEnabled(!flashEnabled);
      }
    } catch (err) {
    }
  };

  // Restart scanning
  const restartScanning = () => {
    setScannedAsset(null);
    setError(null);
    stopScanning();
    // Wait for cleanup
    setTimeout(() => {
      initializeScanner();
    }, 300);
  };

  // Switch camera
  const switchCamera = async () => {
    if (availableCameras.length <= 1) {
      return;
    }

    try {
      stopScanning();

      // Wait for cleanup
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Toggle facing mode
      const newFacingMode = facingMode === "environment" ? "user" : "environment";
      setFacingMode(newFacingMode);

      // Switch camera index
      const nextIndex = (currentCameraIndex + 1) % availableCameras.length;
      setCurrentCameraIndex(nextIndex);

      // Restart with new camera
      await startScanning();
    } catch (err: unknown) {
      setError("Failed to switch camera");
      setScanning(false);
      scanningRef.current = false;
    }
  };

  // Start batch scanning
  const startBatchScanning = () => {
    setIsBatchScanning(true);
    setBatchScans([]);
    setBatchProgress(0);
    restartScanning();
  };

  // Stop batch scanning
  const stopBatchScanning = () => {
    setIsBatchScanning(false);
    stopScanning();
  };

  // Submit batch scan
  const submitBatchScan = async () => {
    try {
      setLoading(true);
      const qrCodes = batchScans
        .filter((item) => item.status === "success")
        .map((item) => item.qr_code)
        .filter((code) => code && code.trim() !== ""); // Filter empty codes

      if (qrCodes.length === 0) {
        toast.error("No valid QR codes to submit");
        setLoading(false);
        return;
      }

      if (qrCodes.length > 100) {
        toast.warning("Maximum 100 QR codes allowed per batch. Submitting first 100.");
        qrCodes.splice(100); // Keep only first 100
      }

      const response = await api.post("/qr/batch-scan", {
        qr_codes: qrCodes,
        mode,
      });

      if (response.data.success) {
        const { found, not_found, invalid } = response.data;
        const total = qrCodes.length;
        const successRate = ((found / total) * 100).toFixed(1);
        
        let message = `Batch scan completed!\n`;
        message += `✅ Found: ${found}\n`;
        if (not_found > 0) message += `❌ Not Found: ${not_found}\n`;
        if (invalid > 0) message += `⚠️ Invalid: ${invalid}\n`;
        message += `📊 Success Rate: ${successRate}%`;
        
        if (found > 0) {
          toast.success(message);
        } else if (not_found > found) {
          toast.warning(message);
        } else {
          toast.info(message);
        }
        
        setBatchScans([]);
        setIsBatchScanning(false);
      } else {
        toast.error(response.data.message || "Batch scan failed");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to submit batch scan";
      const suggestions = error.response?.data?.suggestions;
      
      if (suggestions && suggestions.length > 0) {
        toast.error(`${errorMessage}\n${suggestions.join("\n")}`);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load scan history
  const loadScanHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await api.get("/qr/history", {
        params: {
          limit: 20,
          mode,
        },
      });

      if (response.data.success) {
        setScanHistory(response.data.scans);
      }
    } catch (error) {
    } finally {
      setLoadingHistory(false);
    }
  };

  // Remove batch scan item
  const removeBatchScanItem = (index: number) => {
    setBatchScans((prev) => prev.filter((_, i) => i !== index));
  };

  // Manual start camera
  const handleStartCamera = async () => {
    console.log('👆 User clicked Start Camera');
    try {
      // Ensure clean state before starting
      if (scanningRef.current) {
        console.log('⚠️ Scanner already running, stopping first...');
        stopScanning();
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      await initializeScanner();
    } catch (error) {
      console.error('❌ Failed to start camera:', error);
      toast.error('Failed to start camera. Please try again.');
    }
  };

  // Effects
  useEffect(() => {
    // Cleanup function - only stop when closing dialog or switching tabs
    return () => {
      if (!open || activeTab !== 0) {
        console.log('🧹 Cleaning up scanner on tab change or close');
        stopScanning();
      }
    };
  }, [open, activeTab]);

  useEffect(() => {
    if (open && activeTab === 2 && enableHistory) {
      loadScanHistory();
    }
  }, [open, activeTab, enableHistory]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "success";
      case "available":
        return "info";
      case "under maintenance":
        return "warning";
      case "damaged":
        return "error";
      default:
        return "default";
    }
  };

  // Get mode title
  const getModeTitle = () => {
    switch (mode) {
      case "audit":
        return "Audit Mode - Scan Asset QR Code";
      case "checkout":
        return "Check-out Asset - Scan QR Code";
      case "lookup":
        return "Asset Lookup - Scan QR Code";
      default:
        return "Scan QR Code";
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: "90vh", maxHeight: 900 },
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

        {/* Tabs */}
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab icon={<CameraIcon />} label="Scanner" />
          {enableBatchScan && (
            <Tab
              icon={
                <Badge badgeContent={batchScans.length} color="primary">
                  <BatchIcon />
                </Badge>
              }
              label="Batch Scan"
            />
          )}
          {enableHistory && <Tab icon={<HistoryIcon />} label="History" />}
        </Tabs>
      </DialogTitle>

      <DialogContent>
        {/* Scanner Tab */}
        {activeTab === 0 && (
          <Grid container spacing={2} sx={{ height: "100%" }}>
            {/* Camera View */}
            <Grid item xs={12} md={8}>
              <Card sx={{ height: "100%" }}>
                <CardContent sx={{ height: "100%", p: 1 }}>
                  {loading && (
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      height="100%"
                      minHeight="400px"
                      flexDirection="column"
                      gap={2}
                    >
                      <CircularProgress size={60} />
                      <Typography variant="h6" color="text.secondary">Initializing camera...</Typography>
                      <Typography variant="body2" color="text.disabled">Please allow camera permissions</Typography>
                    </Box>
                  )}

                  {error && (
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      height="100%"
                      minHeight="400px"
                      flexDirection="column"
                      gap={2}
                    >
                      <Alert severity="error" sx={{ mb: 2, maxWidth: 400 }}>
                        {error}
                      </Alert>
                      <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={<CameraIcon />}
                        onClick={handleStartCamera}
                      >
                        Start Camera
                      </Button>
                      <Typography variant="caption" color="text.disabled" sx={{ mt: 1 }}>
                        Click to retry camera initialization
                      </Typography>
                    </Box>
                  )}

                  {!loading && !error && !scanning && (
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      height="100%"
                      minHeight="400px"
                      flexDirection="column"
                      gap={3}
                      sx={{ backgroundColor: 'background.default' }}
                    >
                      <QrCodeScannerIcon sx={{ fontSize: 80, color: 'primary.main' }} />
                      <Typography variant="h5" fontWeight="600">Ready to Scan</Typography>
                      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 400 }}>
                        Click the button below to activate your camera and scan a QR code
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={<CameraIcon />}
                        onClick={handleStartCamera}
                        sx={{ mt: 2, px: 4, py: 1.5 }}
                      >
                        Start Camera
                      </Button>
                    </Box>
                  )}

                  {!loading && !error && scanning && (
                    <Box
                      position="relative"
                      width="100%"
                      height="100%"
                      minHeight="400px"
                    >
                      <Box
                        component="video"
                        ref={videoRef}
                        sx={{
                          width: "100%",
                          height: "100%",
                          minHeight: { xs: "300px", sm: "400px", md: "500px" },
                          objectFit: "cover",
                          borderRadius: 2,
                          backgroundColor: "#000",
                          display: "block",
                        }}
                        autoPlay
                        playsInline
                        muted
                      />

                      {/* Scanning Status Indicator */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 16,
                          left: "50%",
                          transform: "translateX(-50%)",
                          backgroundColor: scanning && scanningRef.current ? "rgba(76, 175, 80, 0.9)" : "rgba(255, 152, 0, 0.9)",
                          color: "white",
                          px: 3,
                          py: 1,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          boxShadow: 2
                        }}
                      >
                        {scanning && scanningRef.current ? (
                          <>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                backgroundColor: "white",
                                animation: "blink 1s infinite"
                              }}
                            />
                            <Typography variant="body2" fontWeight="600">
                              Scanning... Point at QR code
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body2" fontWeight="600">
                            {loading ? "Processing..." : "Ready"}
                          </Typography>
                        )}
                      </Box>

                      {/* Scanning Overlay */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          width: 250,
                          height: 250,
                          border: "3px solid #fff",
                          borderRadius: 2,
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            top: -3,
                            left: -3,
                            right: -3,
                            bottom: -3,
                            border: "3px solid #2196f3",
                            borderRadius: 2,
                            animation: scanning ? "pulse 2s infinite" : "none",
                          },
                          "@keyframes pulse": {
                            "0%": { opacity: 0.5 },
                            "50%": { opacity: 1 },
                            "100%": { opacity: 0.5 },
                          },
                          "@keyframes blink": {
                            "0%, 100%": { opacity: 1 },
                            "50%": { opacity: 0.3 },
                          },
                        }}
                      />

                      {/* Camera Controls */}
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 16,
                          left: "50%",
                          transform: "translateX(-50%)",
                          display: "flex",
                          gap: 1,
                        }}
                      >
                        <Tooltip title="Toggle Flash">
                          <IconButton
                            onClick={toggleFlash}
                            sx={{
                              backgroundColor: "rgba(0,0,0,0.5)",
                              color: "white",
                              "&:hover": {
                                backgroundColor: "rgba(0,0,0,0.7)",
                              },
                            }}
                          >
                            {flashEnabled ? <FlashOnIcon /> : <FlashOffIcon />}
                          </IconButton>
                        </Tooltip>
                        {availableCameras.length > 1 && (
                          <Tooltip title="Switch Camera">
                            <IconButton
                              onClick={switchCamera}
                              sx={{
                                backgroundColor: "rgba(0,0,0,0.5)",
                                color: "white",
                                "&:hover": {
                                  backgroundColor: "rgba(0,0,0,0.7)",
                                },
                              }}
                            >
                              <SwitchCameraIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Restart Camera">
                          <IconButton
                            onClick={restartScanning}
                            sx={{
                              backgroundColor: "rgba(0,0,0,0.5)",
                              color: "white",
                              "&:hover": {
                                backgroundColor: "rgba(0,0,0,0.7)",
                              },
                            }}
                          >
                            <RefreshIcon />
                          </IconButton>
                        </Tooltip>
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
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <SuccessIcon color="success" />
                      <Typography variant="h6" color="success.main">
                        Asset Found!
                      </Typography>
                    </Box>

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
                        Condition
                      </Typography>
                      <Typography variant="body2">
                        {scannedAsset.condition}
                      </Typography>
                    </Box>

                    {isBatchScanning && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Batch scanning active. Continue scanning or submit
                        batch.
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent>
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      height={300}
                      flexDirection="column"
                      gap={2}
                    >
                      <CameraIcon
                        sx={{ fontSize: 64, color: "text.secondary" }}
                      />
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        textAlign="center"
                      >
                        Position the QR code within the scanning area
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        textAlign="center"
                      >
                        Make sure the code is well-lit and clearly visible
                      </Typography>

                      {enableBatchScan && !isBatchScanning && (
                        <Button
                          variant="outlined"
                          startIcon={<BatchIcon />}
                          onClick={startBatchScanning}
                        >
                          Start Batch Scan
                        </Button>
                      )}

                      {isBatchScanning && (
                        <Button
                          variant="contained"
                          color="error"
                          onClick={stopBatchScanning}
                        >
                          Stop Batch Scan
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        )}

        {/* Batch Scan Tab */}
        {activeTab === 1 && enableBatchScan && (
          <Box>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6">
                Batch Scan Results ({batchScans.length})
              </Typography>
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => setBatchScans([])}
                  sx={{ mr: 1 }}
                >
                  Clear
                </Button>
                <Button
                  variant="contained"
                  disabled={batchScans.length === 0 || isBatchScanning}
                  onClick={submitBatchScan}
                >
                  Submit Batch
                </Button>
              </Box>
            </Box>

            {batchScans.length > 0 && (
              <LinearProgress
                variant="determinate"
                value={
                  (batchScans.filter((s) => s.status === "success").length /
                    batchScans.length) *
                  100
                }
                sx={{ mb: 2 }}
              />
            )}

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>QR Code</TableCell>
                    <TableCell>Asset ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {batchScans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No scans yet. Start batch scanning to add items.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    batchScans.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.qr_code}</TableCell>
                        <TableCell>{item.unique_asset_id || "-"}</TableCell>
                        <TableCell>{item.name || "-"}</TableCell>
                        <TableCell>
                          {item.error ? (
                            <Chip
                              label="Error"
                              size="small"
                              color="error"
                              icon={<ErrorIcon />}
                            />
                          ) : (
                            <Chip
                              label="Success"
                              size="small"
                              color="success"
                              icon={<SuccessIcon />}
                            />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => removeBatchScanItem(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* History Tab */}
        {activeTab === 2 && enableHistory && (
          <Box>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6">Scan History</Typography>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadScanHistory}
                disabled={loadingHistory}
              >
                Refresh
              </Button>
            </Box>

            {loadingHistory ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : scanHistory.length === 0 ? (
              <Alert severity="info">No scan history found.</Alert>
            ) : (
              <List>
                {scanHistory.map((item) => (
                  <React.Fragment key={item.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={
                          item.asset
                            ? `${item.asset.unique_asset_id} - ${item.asset.manufacturer} ${item.asset.model}`
                            : "Asset not found"
                        }
                        secondary={
                          <>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.primary"
                            >
                              {item.action} -{" "}
                            </Typography>
                            {new Date(item.timestamp).toLocaleString()}
                          </>
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnhancedQRScanner;
