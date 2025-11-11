import React, { useState, useRef, useEffect, useCallback } from "react";
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
  enableOfflineCache?: boolean;
}

const EnhancedQRScanner: React.FC<EnhancedQRScannerProps> = ({
  open,
  onClose,
  onAssetFound,
  mode = "lookup",
  enableBatchScan = true,
  enableHistory = true,
  enableOfflineCache = false,
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
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  };

  // Handle QR code detected
  const handleQRCodeDetected = useCallback(
    async (qrText: string) => {
      // Prevent duplicate scans
      if (!scanningRef.current) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log("Processing QR code:", qrText);

        // Parse QR code data if it's JSON
        let assetIdentifier = qrText;
        try {
          const parsed = JSON.parse(qrText);
          if (parsed.asset_id) {
            assetIdentifier = parsed.asset_id;
            console.log("Parsed JSON QR code, using asset_id:", assetIdentifier);
          } else if (parsed.unique_asset_id) {
            assetIdentifier = parsed.unique_asset_id;
            console.log("Parsed JSON QR code, using unique_asset_id:", assetIdentifier);
          } else if (parsed.serial) {
            assetIdentifier = parsed.serial;
            console.log("Parsed JSON QR code, using serial:", assetIdentifier);
          }
        } catch (parseError) {
          // Not JSON, use as-is
          console.log("QR code is plain text, using directly");
        }

        // Call API to get asset details
        const response = await api.get(
          `/qr/scan/${encodeURIComponent(assetIdentifier)}`,
          {
            params: {
              mode,
              include_history: enableHistory,
            },
          }
        );

        console.log("API response:", response.data);

        if (response.data.success) {
          const asset = response.data.asset;
          setScannedAsset(asset);
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
              console.log('Triggering global asset details refresh from QR scanner');
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

          // Cache offline if enabled
          if (enableOfflineCache) {
            cacheAssetOffline(asset);
          }

          // Auto-close after successful scan in lookup mode
          if (mode === "lookup" && !isBatchScanning) {
            setTimeout(() => {
              onClose();
            }, 2000);
          }
        }
      } catch (err: any) {
        console.error("Asset lookup error:", err);
        const errorMessage =
          err.response?.data?.message || "Asset not found or lookup failed";
        setError(errorMessage);

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
      enableOfflineCache,
      isBatchScanning,
    ]
  );

  // Update the ref whenever the callback changes
  useEffect(() => {
    handleQRCodeDetectedRef.current = handleQRCodeDetected;
  }, [handleQRCodeDetected]);

  // Cache asset offline
  const cacheAssetOffline = (asset: Asset) => {
    try {
      const cachedAssets = JSON.parse(
        localStorage.getItem("cached_assets") || "[]"
      );
      const exists = cachedAssets.find((a: Asset) => a.id === asset.id);

      if (!exists) {
        cachedAssets.push({
          ...asset,
          cached_at: new Date().toISOString(),
        });

        // Keep only last 50 cached assets
        if (cachedAssets.length > 50) {
          cachedAssets.shift();
        }

        localStorage.setItem("cached_assets", JSON.stringify(cachedAssets));
      }
    } catch (error) {
      console.error("Error caching asset:", error);
    }
  };

  // Start scanning
  const startScanning = useCallback(
    async (deviceId?: string) => {
      try {
        // Prevent multiple simultaneous scan attempts
        if (scanningRef.current) {
          console.log("Scanning already in progress");
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

        console.log("Starting camera initialization...");

        // Wait for video element to be ready
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (!videoRef.current) {
          console.error("Video element not ready");
          throw new Error("Video element not available");
        }

        scanningRef.current = true;
        setScanning(true);
        setError(null);

        // Initialize QR code reader if not already initialized
        if (!codeReaderRef.current) {
          codeReaderRef.current = new BrowserQRCodeReader();
        }

        // Request camera permission and enumerate devices if not provided
        if (!deviceId) {
          console.log("Requesting camera permission...");
          const permissionStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
          });

          // Stop the permission stream immediately
          permissionStream.getTracks().forEach((track) => track.stop());

          // Enumerate devices with proper labels
          const devices = await navigator.mediaDevices.enumerateDevices();
          const cameras = devices.filter(
            (device) => device.kind === "videoinput"
          );
          console.log("Available cameras:", cameras.length, cameras);
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
                : cameras[currentCameraIndex]?.deviceId;
              console.log("Selected camera:", preferredCamera?.label || deviceId);
            } else {
              deviceId = cameras[0].deviceId;
              console.log("Using only available camera:", cameras[0].label);
            }
          }
        }

        console.log("Starting QR code reader with device:", deviceId);

        // Start decoding
        await codeReaderRef.current.decodeFromVideoDevice(
          deviceId || null,
          videoRef.current,
          (result, error) => {
            if (result && scanningRef.current) {
              const qrText = result.getText();
              console.log("✓ QR Code detected:", qrText);
              console.log("Invoking handler via ref...");
              // Call handler via ref to always get the latest version
              if (handleQRCodeDetectedRef.current) {
                console.log("Handler ref exists, calling it now");
                handleQRCodeDetectedRef.current(qrText);
              } else {
                console.error("Handler ref is null!");
              }
            }
            // Only log actual errors, not NotFoundException which is normal
            if (error && !(error instanceof NotFoundException)) {
              console.warn("QR Scan error:", error);
            }
          }
        );

        // Wait for video to start
        if (videoRef.current) {
          await new Promise<void>((resolve) => {
            const video = videoRef.current;
            if (!video) {
              resolve();
              return;
            }

            const checkVideo = () => {
              if (video.readyState >= 2) {
                resolve();
              } else {
                video.addEventListener("loadeddata", () => resolve(), {
                  once: true,
                });
              }
            };

            checkVideo();
            setTimeout(() => resolve(), 2000);
          });
        }

        // Store stream reference
        if (videoRef.current && videoRef.current.srcObject) {
          const mediaStream = videoRef.current.srcObject as MediaStream;
          setStream(mediaStream);
          console.log("✓ Camera stream attached successfully");
        }
      } catch (err: any) {
        console.error("Scanning start error:", err);
        scanningRef.current = false;
        setScanning(false);

        let errorMessage = "Failed to start camera. Please try again.";

        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          errorMessage =
            "Camera permission denied. Please grant camera access.";
        } else if (
          err.name === "NotFoundError" ||
          err.name === "DevicesNotFoundError"
        ) {
          errorMessage = "No camera found on this device.";
        } else if (err.name === "NotReadableError") {
          errorMessage =
            "Camera is in use by another application.";
        } else if (err.name === "OverconstrainedError") {
          errorMessage =
            "Could not start camera with requested settings.";
          // Try again with opposite facing mode
          if (facingMode === "user") {
            setFacingMode("environment");
          }
        }

        setError(errorMessage);
      }
    },
    [handleQRCodeDetected, facingMode, currentCameraIndex]
  );

  // Initialize scanner
  const initializeScanner = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Initializing scanner...");

      // Initialize QR code reader
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserQRCodeReader();
      }

      // Start scanning
      await startScanning();
    } catch (err: any) {
      console.error("Scanner initialization error:", err);
      setError(
        "Failed to initialize camera. Please check permissions and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [startScanning]);

  // Stop scanning
  const stopScanning = useCallback(() => {
    console.log("Stopping scanner...");
    scanningRef.current = false;

    // Stop all video tracks
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
        console.log("Stopped track:", track.kind);
      });
      setStream(null);
    }

    // Reset code reader
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
        console.log("Code reader reset");
      } catch (err) {
        console.warn("Error resetting code reader:", err);
      }
    }

    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanning(false);
    setFlashEnabled(false);
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
      console.error("Flash toggle error:", err);
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
      console.log("Switching camera...");
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
    } catch (err: any) {
      console.error("Camera switch error:", err);
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
        .map((item) => item.qr_code);

      const response = await api.post("/qr/batch-scan", {
        qr_codes: qrCodes,
        mode,
      });

      alert(
        `Batch scan completed!\nFound: ${response.data.found}\nNot Found: ${response.data.not_found}`
      );
      setBatchScans([]);
      setIsBatchScanning(false);
    } catch (error) {
      console.error("Error submitting batch scan:", error);
      setError("Failed to submit batch scan");
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
      console.error("Error loading scan history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Remove batch scan item
  const removeBatchScanItem = (index: number) => {
    setBatchScans((prev) => prev.filter((_, i) => i !== index));
  };

  // Effects
  useEffect(() => {
    if (open && activeTab === 0) {
      initializeScanner();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [open, activeTab, initializeScanner]);

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
