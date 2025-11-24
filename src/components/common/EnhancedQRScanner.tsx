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
  manufacturer?: string;
  model?: string;
  location?: string;
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
  const initializingRef = useRef(false); // Prevent simultaneous initialization

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
          
          // Call parent callback - parent component will show success toast
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
                asset_id: asset.id || asset._id,
                unique_asset_id: asset.unique_asset_id,
                name: asset.name || `${asset.manufacturer} ${asset.model}`,
                manufacturer: asset.manufacturer,
                model: asset.model,
                location: asset.location,
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
            data?: { message?: string; error?: string; suggestions?: string[] };
            status?: number;
          }; 
          message?: string;
          code?: string;
        };
        
        console.error('Error details:', {
          status: apiError.response?.status,
          message: apiError.response?.data?.message || apiError.response?.data?.error || apiError.message,
          code: apiError.code,
          suggestions: apiError.response?.data?.suggestions
        });
        
        let errorMessage = "Asset not found or lookup failed";
        
        // Extract actual error message from backend
        if (apiError.response?.data?.message) {
          errorMessage = apiError.response.data.message;
          
          // Add suggestions if available
          if (apiError.response.data.suggestions && Array.isArray(apiError.response.data.suggestions)) {
            errorMessage += '\n\nSuggestions:\n' + apiError.response.data.suggestions.join('\n');
          }
        } else if (apiError.response?.data?.error) {
          errorMessage = apiError.response.data.error;
        } else if (apiError.response?.status === 500) {
          errorMessage = 'Server error occurred. Please check backend logs and try again.';
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
              name: "Not Found",
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
      mode,
      isBatchScanning,
    ]
  );

  // Update the ref whenever the callback changes
  useEffect(() => {
    handleQRCodeDetectedRef.current = handleQRCodeDetected;
  }, [handleQRCodeDetected]);

  // Stop scanning - defined first so it can be used by other functions
  const stopScanning = useCallback(() => {
    console.log('🛑 Stopping scanner...');
    
    // Always reset these flags
    scanningRef.current = false;
    initializingRef.current = false;
    setScanning(false);

    // Stop all video tracks from stream ref
    if (stream) {
      console.log('📹 Stopping video tracks from stream ref');
      try {
        stream.getTracks().forEach((track) => {
          console.log(`  - Stopping track: ${track.kind}, state: ${track.readyState}`);
          track.stop();
        });
      } catch (err) {
        console.warn('⚠️ Error stopping tracks from stream ref:', err);
      }
      setStream(null);
    }

    // Also stop tracks from video element srcObject
    if (videoRef.current && videoRef.current.srcObject) {
      console.log('📹 Stopping video tracks from video element');
      try {
        const videoStream = videoRef.current.srcObject as MediaStream;
        videoStream.getTracks().forEach((track) => {
          console.log(`  - Stopping video element track: ${track.kind}, state: ${track.readyState}`);
          track.stop();
        });
      } catch (err) {
        console.warn('⚠️ Error stopping video element tracks:', err);
      }
      videoRef.current.srcObject = null;
      // Force video to pause
      try {
        videoRef.current.pause();
      } catch (err) {
        // Ignore
      }
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

    setFlashEnabled(false);
    console.log('✅ Scanner stopped and cleaned up');
  }, [stream]);

  // Start scanning
  const startScanning = useCallback(
    async (deviceId?: string) => {
      try {
        console.log('🎥 Starting camera...', { deviceId, facingMode });
        
        // Prevent multiple simultaneous scan attempts with mutex
        if (initializingRef.current) {
          console.log('⚠️ Camera initialization already in progress, skipping');
          return;
        }
        
        if (scanningRef.current) {
          console.log('⚠️ Already scanning, skipping');
          return;
        }
        
        // Set initialization lock
        initializingRef.current = true;

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
          throw new Error(errorMsg);
        }

        // Ensure video element is available
        if (!videoRef.current) {
          console.error('❌ Video element not found in DOM');
          throw new Error("Video element not available. Please try again.");
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
            // First, try to enumerate devices to check if we already have permission
            let devices = await navigator.mediaDevices.enumerateDevices();
            let cameras = devices.filter(device => device.kind === "videoinput");
            
            // If we don't have camera labels, we need to request permission
            if (cameras.length === 0 || !cameras[0].label) {
              console.log('📋 Requesting camera permission for device enumeration...');
              const permissionStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                  facingMode: facingMode,
                  width: { ideal: 1280 },
                  height: { ideal: 720 }
                },
              });

              console.log('✅ Camera permission granted');

              // Stop the permission stream immediately and wait for release
              permissionStream.getTracks().forEach((track) => {
                track.stop();
                console.log(`  - Stopped permission track: ${track.kind}`);
              });
              
              // Wait for camera to fully release
              await new Promise(resolve => setTimeout(resolve, 300));

              // Re-enumerate devices with proper labels after permission granted
              devices = await navigator.mediaDevices.enumerateDevices();
              cameras = devices.filter(device => device.kind === "videoinput");
            }
            
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
            const error = permErr as { name?: string; message?: string };
            
            // If NotReadableError at permission stage, throw with specific message
            if (error.name === 'NotReadableError') {
              throw new Error('Camera is currently locked by another application or browser tab. Please close all other camera-using applications and tabs, wait 10 seconds, then try again.');
            }
            
            throw permErr;
          }
        }
        
        // Suppress "already playing" warning by ensuring video play state
        if (videoRef.current) {
          try {
            // Pause first to avoid "already playing" warning
            if (!videoRef.current.paused) {
              videoRef.current.pause();
            }
          } catch (e) {
            // Ignore - video might not be ready
          }
        }
        
        // Use specific device ID or constraints to avoid conflicts
        const videoConstraints = deviceId 
          ? { deviceId: { exact: deviceId } }
          : { facingMode: facingMode };
        
        console.log('📸 Using video constraints:', videoConstraints);
        
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

        // Wait for video to start with better readyState checking
        if (videoRef.current) {
          console.log('⏳ Waiting for video stream...');
          await new Promise<void>((resolve) => {
            const video = videoRef.current;
            if (!video) {
              resolve();
              return;
            }

            const checkVideo = () => {
              // Check if video element has a valid srcObject first
              if (!video.srcObject) {
                console.warn('⚠️ Video element has no srcObject yet');
                setTimeout(() => {
                  if (video.srcObject) {
                    checkVideo();
                  } else {
                    resolve(); // Resolve anyway to prevent hanging
                  }
                }, 100);
                return;
              }

              // Wait for HAVE_CURRENT_DATA (readyState >= 2)
              if (video.readyState >= 2) {
                console.log('✅ Video stream ready');
                resolve();
              } else {
                const loadHandler = () => {
                  console.log('✅ Video data loaded');
                  resolve();
                };
                
                video.addEventListener("loadeddata", loadHandler, { once: true });
                
                // Fallback timeout
                setTimeout(() => {
                  video.removeEventListener("loadeddata", loadHandler);
                  resolve();
                }, 2000);
              }
            };

            checkVideo();
          });
        }

        // Wait a bit more for stream to be fully attached
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Store stream reference and verify it's active
        if (videoRef.current && videoRef.current.srcObject) {
          const mediaStream = videoRef.current.srcObject as MediaStream;
          
          // Verify stream is actually active
          if (!mediaStream.active) {
            console.error('❌ Media stream is not active');
            throw new Error('Camera stream is inactive');
          }
          
          const videoTracks = mediaStream.getVideoTracks();
          if (videoTracks.length === 0) {
            console.error('❌ No video tracks in stream');
            throw new Error('No video tracks available');
          }
          
          // Check if track is enabled and not muted
          const track = videoTracks[0];
          if (!track.enabled || track.muted) {
            console.warn('⚠️ Video track is disabled or muted');
          }
          
          setStream(mediaStream);
          console.log('✅ Camera started successfully');
          console.log('Stream details:', {
            active: mediaStream.active,
            tracks: mediaStream.getTracks().length,
            videoTracks: videoTracks.length,
            trackState: track.readyState,
            trackEnabled: track.enabled
          });
          console.log('🟢 scanningRef.current:', scanningRef.current);
          
          // Release initialization lock AFTER successful start
          initializingRef.current = false;
        } else {
          const errorMsg = '⚠️ Video source object not set - camera may not have started properly';
          console.error(errorMsg);
          throw new Error('Camera initialization incomplete - no video stream');
        }
      } catch (err: unknown) {
        console.error('❌ Camera start failed:', err);
        
        // Release locks and cleanup
        initializingRef.current = false;
        scanningRef.current = false;
        setScanning(false);
        
        // Force cleanup any partial streams
        if (videoRef.current && videoRef.current.srcObject) {
          try {
            const partialStream = videoRef.current.srcObject as MediaStream;
            partialStream.getTracks().forEach((track) => track.stop());
            videoRef.current.srcObject = null;
          } catch (cleanupErr) {
            console.warn('⚠️ Error cleaning up partial stream:', cleanupErr);
          }
        }

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
            "Camera is busy or unavailable. This can happen if:\n" +
            "• Another tab or app is using the camera\n" +
            "• The camera didn't fully release from a previous session\n" +
            "• Browser needs a refresh\n\n" +
            "Try: Close other tabs, restart browser, or wait a few seconds and try again.";
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
        // Don't show toast here - let the calling function (initializeScanner) handle user notification
      }
    },
    [facingMode, currentCameraIndex]
  );

  // Initialize scanner
  const initializeScanner = useCallback(async () => {
    let initSuccess = false;
    try {
      console.log('🚀 Initializing scanner...');
      console.log('Current state:', { 
        scanning: scanningRef.current, 
        initializing: initializingRef.current,
        loading, 
        error, 
        stream: !!stream 
      });
      
      // Check if already initializing
      if (initializingRef.current) {
        console.log('⚠️ Already initializing, skipping duplicate call');
        return;
      }
      
      setLoading(true);
      setError(null);

      // Force complete cleanup of any previous state
      if (scanningRef.current || stream || videoRef.current?.srcObject) {
        console.log('🧹 Force cleaning up previous scanner instance...');
        stopScanning();
        // Wait longer for full cleanup - camera needs time to release
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Additional safety check - query all media tracks and stop any orphaned ones
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        console.log('🔍 Device check - available cameras:', allDevices.filter(d => d.kind === 'videoinput').length);
      } catch (e) {
        console.warn('⚠️ Could not enumerate devices:', e);
      }
      
      // Wait for DOM to be fully ready
      await new Promise(resolve => setTimeout(resolve, 200));

      // Initialize QR code reader
      if (!codeReaderRef.current) {
        console.log('📱 Creating BrowserQRCodeReader instance');
        codeReaderRef.current = new BrowserQRCodeReader();
      } else {
        console.log('ℹ️ Reusing existing BrowserQRCodeReader instance');
      }

      // Start scanning with retry logic for NotReadableError
      console.log('🎬 Starting camera...');
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries && isMountedRef.current) {
        try {
          await startScanning();
          
          // Verify we actually have a valid stream before declaring success
          if (videoRef.current?.srcObject) {
            const checkStream = videoRef.current.srcObject as MediaStream;
            if (checkStream.active && checkStream.getVideoTracks().length > 0) {
              console.log('✅ Scanner initialized successfully');
              initSuccess = true;
              break; // Success - exit retry loop
            } else {
              console.warn('⚠️ Stream exists but is not active or has no tracks');
              throw new Error('Camera stream is not properly initialized');
            }
          } else {
            throw new Error('Camera started but no video stream available');
          }
        } catch (startErr: unknown) {
          const error = startErr as { name?: string; message?: string };
          
          // Check if component is still mounted before retrying
          if (!isMountedRef.current) {
            console.log('⚠️ Component unmounted during initialization, aborting');
            return;
          }
          
          // If NotReadableError and we have retries left, wait and retry
          if (error.name === 'NotReadableError' && retryCount < maxRetries) {
            retryCount++;
            console.log(`🔄 Retry ${retryCount}/${maxRetries} after NotReadableError - waiting 1.5 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 1500));
            continue;
          }
          
          // No more retries or different error - throw it
          throw startErr;
        }
      }
      
      if (!initSuccess && isMountedRef.current) {
        throw new Error('Failed to initialize camera after retries');
      }
    } catch (err: unknown) {
      console.error('❌ Scanner initialization failed:', err);
      const error = err as { message?: string; name?: string };
      let errorMsg = error.message || "Failed to initialize camera. Please check permissions and try again.";
      
      // Add helpful context for NotReadableError
      if (error.name === 'NotReadableError') {
        errorMsg = "🚫 CAMERA LOCKED - The camera is being used by another process.\n\n" +
                   "STEPS TO FIX:\n" +
                   "1. Close ALL browser tabs (including this one)\n" +
                   "2. Check for other apps using camera (Zoom, Teams, Skype, etc.)\n" +
                   "3. Wait 10-15 seconds\n" +
                   "4. Reopen this page\n\n" +
                   "Still not working? Restart your browser or computer.";
      } else if (error.message && error.message.includes('locked')) {
        errorMsg = error.message; // Use our custom locked message from permission stage
      }
      
      // Clean up on failure
      initializingRef.current = false;
      scanningRef.current = false;
      setScanning(false);
      setError(errorMsg);
      toast.error(errorMsg, { autoClose: 8000 });
    } finally {
      setLoading(false);
      if (!initSuccess) {
        console.log('❌ Scanner initialization completed with errors');
      }
    }
  }, [startScanning, stopScanning]);

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

      console.log('📤 Submitting batch scan:', qrCodes.length, 'codes');

      const response = await api.post("/qr/batch-scan", {
        qr_codes: qrCodes,
        mode,
      });

      console.log('✅ Batch scan response:', response.data);

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
          toast.success(message, {
            position: 'top-center',
            autoClose: 7000,
          });
        } else if (not_found > found) {
          toast.warning(message, {
            position: 'top-center',
            autoClose: 7000,
          });
        } else {
          toast.info(message, {
            position: 'top-center',
            autoClose: 7000,
          });
        }
        
        setBatchScans([]);
        setIsBatchScanning(false);
        stopScanning();
      } else {
        toast.error(response.data.message || "Batch scan failed");
      }
    } catch (error: any) {
      console.error('❌ Batch scan submission failed:', error);
      const errorMessage = error.response?.data?.message || "Failed to submit batch scan";
      const suggestions = error.response?.data?.suggestions;
      
      if (suggestions && suggestions.length > 0) {
        toast.error(`${errorMessage}\n\nSuggestions:\n${suggestions.join("\n")}`, {
          position: 'top-center',
          autoClose: 8000,
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load scan history
  const loadScanHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      setError(null);
      const response = await api.get("/qr/history", {
        params: {
          limit: 20,
          page: 1,
          mode,
        },
      });

      if (response.data.success && response.data.scans) {
        setScanHistory(response.data.scans);
        console.log('✅ Loaded scan history:', response.data.scans.length, 'items');
      } else {
        console.warn('⚠️ No scan history found in response');
        setScanHistory([]);
      }
    } catch (error: any) {
      console.error('❌ Failed to load scan history:', error);
      const errorMsg = error.response?.data?.message || 'Failed to load scan history';
      toast.warning(errorMsg);
      setScanHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [mode]);

  // Remove batch scan item
  const removeBatchScanItem = (index: number) => {
    setBatchScans((prev) => prev.filter((_, i) => i !== index));
  };

  // Manual start camera
  const handleStartCamera = async () => {
    console.log('👆 User clicked Start Camera');
    
    // Prevent multiple clicks
    if (loading) {
      console.log('⚠️ Camera initialization already in progress');
      return;
    }
    
    try {
      // Ensure clean state before starting
      if (scanningRef.current) {
        console.log('⚠️ Scanner already running, stopping first...');
        stopScanning();
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Clear any previous errors
      setError(null);
      
      await initializeScanner();
    } catch (error) {
      console.error('❌ Failed to start camera from button click:', error);
    }
  };

  // Effects
  const isInitialMount = useRef(true);
  const prevOpenRef = useRef(open);
  const prevTabRef = useRef(activeTab);
  
  useEffect(() => {
    // Skip cleanup on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevOpenRef.current = open;
      prevTabRef.current = activeTab;
      return;
    }
    
    // Only cleanup when dialog is actually closing or switching away from camera tab
    const isClosing = prevOpenRef.current && !open;
    const isSwitchingAwayFromCamera = prevTabRef.current === 0 && activeTab !== 0;
    
    // Don't cleanup if just staying on the same tab or switching to camera tab
    if (isClosing || isSwitchingAwayFromCamera) {
      console.log('🧹 Cleaning up scanner on tab change or close');
      stopScanning();
    }
    
    // Update previous values
    prevOpenRef.current = open;
    prevTabRef.current = activeTab;
  }, [open, activeTab, stopScanning]);
  
  // Cleanup on unmount - CRITICAL to prevent camera lock
  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      // Only cleanup if dialog is actually closing, not just re-rendering
      if (!open) {
        isMountedRef.current = false;
        console.log('🧹 Component unmounting - cleaning up camera resources');
        
        // Force stop everything
        initializingRef.current = false;
        scanningRef.current = false;
        
        // Stop all tracks
        if (stream) {
          stream.getTracks().forEach((track) => {
            if (track.readyState !== 'ended') {
              track.stop();
            }
          });
        }
        
        if (videoRef.current?.srcObject) {
          const videoStream = videoRef.current.srcObject as MediaStream;
          videoStream.getTracks().forEach((track) => {
            if (track.readyState !== 'ended') {
              track.stop();
            }
          });
          videoRef.current.srcObject = null;
        }
        
        if (codeReaderRef.current) {
          try {
            codeReaderRef.current.reset();
          } catch (err) {
            // Ignore
          }
        }
      }
    };
  }, [stream, open]);

  useEffect(() => {
    if (open && activeTab === 1 && enableHistory) {
      loadScanHistory();
    }
  }, [open, activeTab, enableHistory, loadScanHistory]);

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
          {enableHistory && <Tab icon={<HistoryIcon />} label="History" />}
        </Tabs>
      </DialogTitle>

      <DialogContent>
        {/* Scanner Tab */}
        {activeTab === 0 && (
          <Box sx={{ height: "100%" }}>
            {/* Camera View */}
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ height: "100%", p: 1, position: "relative" }}>
                  {/* Video element - always rendered in DOM */}
                  <Box
                    component="video"
                    ref={videoRef}
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      minHeight: { xs: "300px", sm: "400px", md: "500px" },
                      objectFit: "cover",
                      borderRadius: 2,
                      backgroundColor: "#000",
                      display: scanning ? "block" : "none",
                      zIndex: scanning ? 1 : 0,
                    }}
                    autoPlay
                    playsInline
                    muted
                  />

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
                      zIndex={2}
                      sx={{
                        pointerEvents: 'none', // Allow clicks to pass through to controls
                        '& > *': {
                          pointerEvents: 'auto' // Re-enable for child elements
                        }
                      }}
                    >

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
                          zIndex: 10
                        }}
                      >
                        <Tooltip title="Toggle Flash">
                          <IconButton
                            onClick={toggleFlash}
                            sx={{
                              backgroundColor: "rgba(0,0,0,0.6)",
                              color: "white",
                              "&:hover": {
                                backgroundColor: "rgba(0,0,0,0.8)",
                              },
                            }}
                          >
                            {flashEnabled ? <FlashOnIcon /> : <FlashOffIcon />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
          </Box>
        )}

        {/* History Tab */}
        {activeTab === 1 && enableHistory && (
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
              <Box display="flex" justifyContent="center" p={4} flexDirection="column" alignItems="center" gap={2}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary">
                  Loading scan history...
                </Typography>
              </Box>
            ) : scanHistory.length === 0 ? (
              <Box textAlign="center" py={4}>
                <HistoryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Scan History
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  Your recent QR scans will appear here
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Asset</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Timestamp</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scanHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.asset ? (
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {item.asset.unique_asset_id}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.asset.name || `${item.asset.manufacturer} ${item.asset.model}`}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.disabled">
                              Asset not found
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.action.replace(/_/g, ' ').toUpperCase()}
                            size="small"
                            color={item.action.includes('audit') ? 'primary' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {item.asset?.location || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {item.asset?.status && (
                            <Chip
                              label={item.asset.status}
                              size="small"
                              color={getStatusColor(item.asset.status) as any}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(item.timestamp).toLocaleString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedQRScanner;
