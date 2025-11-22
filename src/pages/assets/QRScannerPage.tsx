import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import {
  QrCodeScanner as ScannerIcon,
  Close as CloseIcon,
  CameraAlt as CameraIcon,
  FlashlightOn as FlashlightIcon,
  FlashlightOff as FlashlightOffIcon,
  Cameraswitch as SwitchCameraIcon,
  Warning as WarningIcon,
  Send as SendIcon,
  Clear as ClearIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { BrowserQRCodeReader, NotFoundException } from "@zxing/library";
import { API_BASE_URL } from "../../config/api.config";
import assetUpdateService from "../../services/assetUpdateService";

const QRScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [torchOn, setTorchOn] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>(
    []
  );
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const scanningRef = useRef(false);
  const handleQRCodeDetectedRef = useRef<((data: string) => Promise<void>) | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      // Prevent multiple simultaneous scan attempts
      if (scanningRef.current) {
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
        toast.error(errorMsg);
        return;
      }

      scanningRef.current = true;
      setError("");
      setScanning(true);

      // Wait for video element to be ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!videoRef.current) {
        throw new Error("Video element not found");
      }

      // Initialize QR code reader if not already initialized
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserQRCodeReader();
      }

      // Request camera permission and enumerate devices
      const permissionStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
      });
      
      // Stop the permission stream immediately
      permissionStream.getTracks().forEach((track) => track.stop());

      // Now enumerate devices with proper labels
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(
        (device) => device.kind === "videoinput"
      );
      setAvailableCameras(cameras);

      // Determine which camera to use
      let selectedDeviceId: string | undefined;
      
      if (cameras.length > 0) {
        // If we have multiple cameras, try to use the one matching facingMode
        if (cameras.length > 1) {
          // Try to find camera by label (back camera usually has "back" or "rear" in label)
          const preferredCamera = cameras.find((camera) => {
            const label = camera.label.toLowerCase();
            if (facingMode === "environment") {
              return label.includes("back") || label.includes("rear") || label.includes("environment");
            } else {
              return label.includes("front") || label.includes("user") || label.includes("face");
            }
          });
          
          if (preferredCamera) {
            selectedDeviceId = preferredCamera.deviceId;
          } else {
            // Fallback to index-based selection
            selectedDeviceId = cameras[currentCameraIndex]?.deviceId;
          }
        } else {
          // Only one camera available
          selectedDeviceId = cameras[0].deviceId;
        }
      }
      toast.info("Initializing camera...");

      // Start decoding with proper error handling
      await codeReaderRef.current.decodeFromVideoDevice(
        selectedDeviceId || null,
        videoRef.current,
        (result, err) => {
          if (result && scanningRef.current) {
            const qrText = result.getText();
            // Call handler via ref to always get the latest version
            if (handleQRCodeDetectedRef.current) {
              handleQRCodeDetectedRef.current(qrText);
            } else {
            }
          }
          // Only log actual errors, not NotFoundException which is normal
          if (err && !(err instanceof NotFoundException)) {
          }
        }
      );

      // Wait for the video to start playing
      if (videoRef.current) {
        await new Promise<void>((resolve) => {
          const video = videoRef.current;
          if (!video) {
            resolve();
            return;
          }

          const checkVideo = () => {
            if (video.readyState >= 2) {
              // HAVE_CURRENT_DATA or better
              resolve();
            } else {
              video.addEventListener("loadeddata", () => resolve(), {
                once: true,
              });
            }
          };

          checkVideo();

          // Timeout fallback
          setTimeout(() => resolve(), 2000);
        });
      }

      // Store the stream reference
      if (videoRef.current && videoRef.current.srcObject) {
        const mediaStream = videoRef.current.srcObject as MediaStream;
        setStream(mediaStream);
        toast.success("Camera ready! Point at a QR code");
      } else {
      }
    } catch (err: unknown) {
      scanningRef.current = false;
      setScanning(false);

      let errorMessage = "Failed to access camera. Please try again.";

      if (
        (err as any).name === "NotAllowedError" ||
        (err as any).name === "PermissionDeniedError"
      ) {
        errorMessage =
          "Camera access denied. Please grant camera permissions in your browser settings.";
        toast.error("Camera permission denied");
      } else if (
        (err as any).name === "NotFoundError" ||
        (err as any).name === "DevicesNotFoundError"
      ) {
        errorMessage = "No camera found on this device.";
        toast.error("No camera found");
      } else if ((err as any).name === "NotReadableError") {
        errorMessage =
          "Camera is already in use by another application. Please close other apps using the camera.";
        toast.error("Camera in use");
      } else if ((err as any).name === "OverconstrainedError") {
        errorMessage =
          "Could not start camera with the requested settings. Trying alternative...";
        toast.error("Camera constraint error");
        
        // Try again with default camera
        if (facingMode === "user") {
          setFacingMode("environment");
        }
      } else {
        toast.error("Camera error: " + ((err as any).message || "Unknown error"));
      }

      setError(errorMessage);
    }
  };

  const stopScanning = useCallback(() => {
    scanningRef.current = false;

    // Stop all video tracks
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      setStream(null);
    }

    // Reset code reader
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
      } catch (err) {
      }
    }

    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanning(false);
    setTorchOn(false);
  }, [stream]);

  const switchCamera = async () => {
    if (availableCameras.length <= 1) {
      toast.info("Only one camera available");
      return;
    }

    try {

      // Stop current scanning completely
      stopScanning();

      // Wait for cleanup to complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Toggle facing mode
      const newFacingMode = facingMode === "environment" ? "user" : "environment";
      setFacingMode(newFacingMode);

      // Switch to next camera index
      const nextIndex = (currentCameraIndex + 1) % availableCameras.length;
      setCurrentCameraIndex(nextIndex);

      console.log(`Switching to ${newFacingMode} camera (index: ${nextIndex})`);

      // Restart scanning with new camera
      await startScanning();

      toast.success(
        `Switched to ${newFacingMode === "environment" ? "back" : "front"} camera`
      );
    } catch (err: unknown) {
      toast.error("Failed to switch camera: " + ((err as any).message || "Unknown error"));
      setScanning(false);
      scanningRef.current = false;
    }
  };

  const toggleTorch = async () => {
    if (!scanning || !stream) {
      toast.info("Start camera first");
      return;
    }

    try {
      const track = stream.getVideoTracks()[0];
      if (!track) {
        toast.info("No video track available");
        return;
      }

      const capabilities: any = track.getCapabilities();

      if (!capabilities.torch) {
        toast.info("Flashlight not available on this device");
        return;
      }

      await track.applyConstraints({
        advanced: [{ torch: !torchOn } as any],
      });

      setTorchOn(!torchOn);
      toast.success(torchOn ? "Flashlight off" : "Flashlight on");
    } catch (err) {
      toast.error("Failed to toggle flashlight");
    }
  };

  const [scannedAsset, setScannedAsset] = useState<any>(null);
  const [issueDescription, setIssueDescription] = useState("");
  const [issueType, setIssueType] = useState("Other");
  const [severity, setSeverity] = useState("Medium");
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const [existingIssues, setExistingIssues] = useState<any[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(false);

  const handleQRCodeDetected = useCallback(async (data: string) => {
    
    // Prevent multiple scans - check and set atomically
    if (!scanningRef.current) {
      return;
    }
    
    // Immediately set to false to prevent duplicate processing
    scanningRef.current = false;
    
    stopScanning();

    try {
      toast.info("Processing QR code...");

      // Parse QR code data if it's JSON
      let assetIdentifier = data;
      try {
        const parsed = JSON.parse(data);
        if (parsed.asset_id) {
          assetIdentifier = parsed.asset_id;
        } else if (parsed.unique_asset_id) {
          assetIdentifier = parsed.unique_asset_id;
        } else if (parsed.serial) {
          assetIdentifier = parsed.serial;
        }
      } catch (parseError) {
        // Not JSON, use as-is
      }

      const token =
        localStorage.getItem("auth_token") || localStorage.getItem("token");
      console.log("?? Token preview:", token ? `${token.substring(0, 20)}...` : 'null');
      
      // Use the API base URL from config for proper network IP detection
      const apiUrl = `${API_BASE_URL}/qr/scan/${encodeURIComponent(assetIdentifier)}`;
      console.log("  - Encoded Identifier:", encodeURIComponent(assetIdentifier));

      const requestHeaders = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const startTime = performance.now();
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: requestHeaders,
      });
      const endTime = performance.now();
      console.log("  - Time taken:", Math.round(endTime - startTime), "ms");
      console.log("  - Headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText || "Asset not found" };
        }
        
        throw new Error(errorData.message || "Asset not found");
      }

      const result = await response.json();

      if (result.success && result.asset) {
        toast.success("? Asset scanned successfully!");
        // Store the scanned asset to display in table format
        setScannedAsset(result.asset);
        setError("");

        // Fetch existing issues for this asset
        await fetchAssetIssues(result.asset.id || result.asset._id);

        // Show scan details

        // Notify via update service for real-time synchronization
        if (result.asset._id || result.asset.id) {
          const assetId = result.asset._id || result.asset.id;
          
          // Use update service for proper event propagation
          assetUpdateService.notifyAuditComplete(assetId, {
            scanned_at: result.scanned_at,
            scanned_by: result.scanned_by,
            asset: result.asset
          });
          
          // Fallback: localStorage for cross-tab communication
          localStorage.setItem(`asset_updated_${assetId}`, Date.now().toString());
          
          // Legacy: Try global refresh function if available
          if ((window as any).refreshAssetDetails) {
            (window as any).refreshAssetDetails();
          }
        }
      } else {
        setError("Invalid QR code. Asset not found.");
        toast.error("Asset not found");
      }
    } catch (err: unknown) {
      setError(
        (err as any).message || "Invalid QR code. Please scan a valid asset QR code."
      );
      toast.error((err as any).message || "Failed to scan QR code");
    }
  }, [stopScanning]);

  // Update the ref whenever the callback changes
  useEffect(() => {
    handleQRCodeDetectedRef.current = handleQRCodeDetected;
  }, [handleQRCodeDetected]);

  // Fetch existing issues for the scanned asset
  const fetchAssetIssues = async (assetId: string) => {
    try {
      setLoadingIssues(true);
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      
      const response = await fetch(`${API_BASE_URL}/assets/${assetId}/issues?status=Open`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        setExistingIssues(result.data.issues || []);
        
        // Auto-fill the latest open issue if exists
        if (result.data.issues && result.data.issues.length > 0) {
          const latestIssue = result.data.issues[0];
          setIssueDescription(latestIssue.issue_description);
          setIssueType(latestIssue.issue_type);
          setSeverity(latestIssue.severity);
          toast.info(`Found ${result.data.issues.length} existing issue(s) for this asset`);
        } else {
          // Clear form for new issue
          setIssueDescription("");
          setIssueType("Other");
          setSeverity("Medium");
        }
      }
    } catch (error) {
    } finally {
      setLoadingIssues(false);
    }
  };

  // Submit new issue or update existing one
  const handleSubmitIssue = async () => {
    if (!scannedAsset) {
      toast.error("No asset scanned");
      return;
    }

    if (!issueDescription.trim()) {
      toast.error("Please enter an issue description");
      return;
    }

    try {
      setSubmittingIssue(true);
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      const assetId = scannedAsset.id || scannedAsset._id;

      // Check if we're updating an existing issue or creating new one
      const isUpdate = existingIssues.length > 0;
      const method = isUpdate ? "PUT" : "POST";
      const url = isUpdate
        ? `${API_BASE_URL}/assets/${assetId}/issues/${existingIssues[0]._id}`
        : `${API_BASE_URL}/assets/${assetId}/issues`;

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          issue_description: issueDescription.trim(),
          issue_type: issueType,
          severity: severity,
          scan_location: "QR Scanner Page",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit issue");
      }

      const result = await response.json();
      toast.success(
        isUpdate
          ? "? Issue updated successfully!"
          : "? Issue reported successfully!"
      );

      // Refresh issues list
      await fetchAssetIssues(assetId);
    } catch (error) { /* Error handled by API interceptor */ } finally {
      setSubmittingIssue(false);
    }
  };

  // Clear issue form
  const handleClearIssue = () => {
    setIssueDescription("");
    setIssueType("Other");
    setSeverity("Medium");
  };

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: { xs: '100%', sm: '100%', md: 800 }, mx: "auto", p: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            mb: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              <ScannerIcon sx={{ mr: 1, verticalAlign: "bottom" }} />
              Scan Asset QR Code
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use your camera to scan asset QR codes for instant details
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<CloseIcon />}
            onClick={() => navigate("/assets")}
          >
            Cancel
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <Card>
          <CardContent>
            {!scanning ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <ScannerIcon
                  sx={{ fontSize: 80, color: "primary.main", mb: 3 }}
                />
                <Typography variant="h6" gutterBottom>
                  Ready to Scan
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 4 }}
                >
                  Click the button below to activate your camera and scan a QR
                  code
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
                <Paper
                  sx={{
                    position: "relative",
                    bgcolor: "black",
                    overflow: "hidden",
                    borderRadius: 2,
                  }}
                >
                  <video
                    ref={videoRef}
                    style={{
                      width: "100%",
                      maxHeight: "500px",
                      display: "block",
                      objectFit: "cover",
                    }}
                    autoPlay
                    playsInline
                    muted
                  />

                  {/* Scanning overlay */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <Box
                      sx={{
                        width: "250px",
                        height: "250px",
                        border: "3px solid",
                        borderColor: "primary.main",
                        borderRadius: 2,
                        position: "relative",
                        "&::before, &::after": {
                          content: '""',
                          position: "absolute",
                          width: "20px",
                          height: "20px",
                          border: "4px solid",
                          borderColor: "primary.main",
                        },
                        "&::before": {
                          top: -2,
                          left: -2,
                          borderRight: 0,
                          borderBottom: 0,
                        },
                        "&::after": {
                          bottom: -2,
                          right: -2,
                          borderLeft: 0,
                          borderTop: 0,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          width: "20px",
                          height: "20px",
                          border: "4px solid",
                          borderColor: "primary.main",
                          top: -2,
                          right: -2,
                          borderLeft: 0,
                          borderBottom: 0,
                        }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          width: "20px",
                          height: "20px",
                          border: "4px solid",
                          borderColor: "primary.main",
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
                      position: "absolute",
                      bottom: 16,
                      left: 0,
                      right: 0,
                      display: "flex",
                      justifyContent: "center",
                      gap: 2,
                    }}
                  >
                    <IconButton
                      sx={{
                        bgcolor: "rgba(255, 255, 255, 0.9)",
                        "&:hover": { bgcolor: "rgba(255, 255, 255, 1)" },
                      }}
                      onClick={toggleTorch}
                      title="Toggle flashlight"
                    >
                      {torchOn ? <FlashlightOffIcon /> : <FlashlightIcon />}
                    </IconButton>
                    {availableCameras.length > 1 && (
                      <IconButton
                        sx={{
                          bgcolor: "rgba(255, 255, 255, 0.9)",
                          "&:hover": { bgcolor: "rgba(255, 255, 255, 1)" },
                        }}
                        onClick={switchCamera}
                        title="Switch camera"
                      >
                        <SwitchCameraIcon />
                      </IconButton>
                    )}
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
                    <strong>Tip:</strong> Hold the QR code steady within the
                    frame. The scanner will automatically detect and show asset
                    details.
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
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6" color="success.main">
                  ? Asset Scanned Successfully
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={async () => {
                    setScannedAsset(null);
                    setError("");
                    await startScanning();
                  }}
                >
                  Scan Another
                </Button>
              </Box>

              <Paper sx={{ width: "100%", overflow: "hidden" }}>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell
                        component="th"
                        sx={{
                          fontWeight: "bold",
                          width: "30%",
                          bgcolor: "grey.50",
                        }}
                      >
                        Asset ID
                      </TableCell>
                      <TableCell>{scannedAsset.unique_asset_id}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        component="th"
                        sx={{ fontWeight: "bold", bgcolor: "grey.50" }}
                      >
                        Asset Name
                      </TableCell>
                      <TableCell>
                        {scannedAsset.name ||
                          `${scannedAsset.manufacturer} ${scannedAsset.model}`}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        component="th"
                        sx={{ fontWeight: "bold", bgcolor: "grey.50" }}
                      >
                        Category
                      </TableCell>
                      <TableCell>{scannedAsset.asset_type || "N/A"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        component="th"
                        sx={{ fontWeight: "bold", bgcolor: "grey.50" }}
                      >
                        Manufacturer
                      </TableCell>
                      <TableCell>{scannedAsset.manufacturer}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        component="th"
                        sx={{ fontWeight: "bold", bgcolor: "grey.50" }}
                      >
                        Model
                      </TableCell>
                      <TableCell>{scannedAsset.model}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        component="th"
                        sx={{ fontWeight: "bold", bgcolor: "grey.50" }}
                      >
                        Serial Number
                      </TableCell>
                      <TableCell>{scannedAsset.serial_number}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        component="th"
                        sx={{ fontWeight: "bold", bgcolor: "grey.50" }}
                      >
                        Status
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={scannedAsset.status}
                          color={
                            scannedAsset.status === "Active"
                              ? "success"
                              : "default"
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        component="th"
                        sx={{ fontWeight: "bold", bgcolor: "grey.50" }}
                      >
                        Condition
                      </TableCell>
                      <TableCell>{scannedAsset.condition}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        component="th"
                        sx={{ fontWeight: "bold", bgcolor: "grey.50" }}
                      >
                        Location
                      </TableCell>
                      <TableCell>{scannedAsset.location}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        component="th"
                        sx={{ fontWeight: "bold", bgcolor: "grey.50" }}
                      >
                        Department
                      </TableCell>
                      <TableCell>{scannedAsset.department || "N/A"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        component="th"
                        sx={{ fontWeight: "bold", bgcolor: "grey.50" }}
                      >
                        Assigned To
                      </TableCell>
                      <TableCell>
                        {scannedAsset.assigned_user?.name || "Unassigned"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        component="th"
                        sx={{ fontWeight: "bold", bgcolor: "grey.50" }}
                      >
                        Purchase Date
                      </TableCell>
                      <TableCell>
                        {scannedAsset.purchase_date
                          ? new Date(
                              scannedAsset.purchase_date
                            ).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        component="th"
                        sx={{ fontWeight: "bold", bgcolor: "grey.50" }}
                      >
                        Purchase Cost
                      </TableCell>
                      <TableCell>
                        {scannedAsset.purchase_cost
                          ? `?${parseFloat(
                              scannedAsset.purchase_cost
                            ).toLocaleString("en-IN")}`
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        component="th"
                        sx={{ fontWeight: "bold", bgcolor: "grey.50" }}
                      >
                        Warranty Expiry
                      </TableCell>
                      <TableCell>
                        {scannedAsset.warranty_expiry
                          ? new Date(
                              scannedAsset.warranty_expiry
                            ).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        component="th"
                        sx={{ fontWeight: "bold", bgcolor: "grey.50" }}
                      >
                        Last Audit Date
                      </TableCell>
                      <TableCell>
                        {scannedAsset.last_audit_date
                          ? new Date(
                              scannedAsset.last_audit_date
                            ).toLocaleDateString()
                          : "Not audited yet"}
                      </TableCell>
                    </TableRow>
                    {scannedAsset.last_audited_by && (
                      <TableRow>
                        <TableCell
                          component="th"
                          sx={{ fontWeight: "bold", bgcolor: "grey.50" }}
                        >
                          Last Audited By
                        </TableCell>
                        <TableCell>
                          {typeof scannedAsset.last_audited_by === 'object'
                            ? scannedAsset.last_audited_by.name
                            : scannedAsset.last_audited_by}
                        </TableCell>
                      </TableRow>
                    )}
                    {scannedAsset.vendor && (
                      <TableRow>
                        <TableCell
                          component="th"
                          sx={{ fontWeight: "bold", bgcolor: "grey.50" }}
                        >
                          Vendor
                        </TableCell>
                        <TableCell>
                          {scannedAsset.vendor.name ||
                            scannedAsset.vendor.vendor_name}
                        </TableCell>
                      </TableRow>
                    )}
                    {scannedAsset.notes && (
                      <TableRow>
                        <TableCell
                          component="th"
                          sx={{ fontWeight: "bold", bgcolor: "grey.50" }}
                        >
                          Notes
                        </TableCell>
                        <TableCell>{scannedAsset.notes}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Paper>

              <Box
                sx={{
                  mt: 3,
                  display: "flex",
                  gap: 2,
                  justifyContent: "flex-end",
                }}
              >
                <Button variant="outlined" onClick={() => navigate("/assets")}>
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

        {/* Issue Reporting Section - Show after successful scan */}
        {scannedAsset && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <WarningIcon color="warning" />
                <Typography variant="h6">
                  {existingIssues.length > 0 ? 'Update Asset Issue' : 'Report Asset Issue'}
                </Typography>
              </Box>

              {/* Show existing issues count */}
              {existingIssues.length > 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  This asset has {existingIssues.length} existing issue(s). Submitting will update the latest issue.
                </Alert>
              )}

              {loadingIssues ? (
                <Box display="flex" justifyContent="center" py={3}>
                  <CircularProgress size={30} />
                </Box>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Issue Description"
                      value={issueDescription}
                      onChange={(e) => setIssueDescription(e.target.value)}
                      placeholder="Describe the issue with this asset..."
                      disabled={submittingIssue}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Issue Type</InputLabel>
                      <Select
                        value={issueType}
                        label="Issue Type"
                        onChange={(e) => setIssueType(e.target.value)}
                        disabled={submittingIssue}
                      >
                        <MenuItem value="Damage">Damage</MenuItem>
                        <MenuItem value="Missing Part">Missing Part</MenuItem>
                        <MenuItem value="Maintenance Required">Maintenance Required</MenuItem>
                        <MenuItem value="Performance Issue">Performance Issue</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Severity</InputLabel>
                      <Select
                        value={severity}
                        label="Severity"
                        onChange={(e) => setSeverity(e.target.value)}
                        disabled={submittingIssue}
                      >
                        <MenuItem value="Low">Low</MenuItem>
                        <MenuItem value="Medium">Medium</MenuItem>
                        <MenuItem value="High">High</MenuItem>
                        <MenuItem value="Critical">Critical</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <Box display="flex" gap={2}>
                      <Button
                        variant="contained"
                        startIcon={submittingIssue ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                        onClick={handleSubmitIssue}
                        disabled={submittingIssue || !issueDescription.trim()}
                      >
                        {submittingIssue ? 'Submitting...' : (existingIssues.length > 0 ? 'Update Issue' : 'Submit Issue')}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<ClearIcon />}
                        onClick={handleClearIssue}
                        disabled={submittingIssue}
                      >
                        Clear
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              )}

              {/* Issue History */}
              {existingIssues.length > 1 && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <HistoryIcon />
                    <Typography variant="subtitle1">Issue History</Typography>
                  </Box>
                  <List>
                    {existingIssues.slice(1).map((issue: any) => (
                      <ListItem key={issue._id} divider>
                        <ListItemText
                          primary={issue.issue_description}
                          secondary={
                            <>
                              <Chip label={issue.issue_type} size="small" sx={{ mr: 1, mt: 0.5 }} />
                              <Chip 
                                label={issue.severity} 
                                size="small" 
                                color={
                                  issue.severity === 'Critical' ? 'error' :
                                  issue.severity === 'High' ? 'warning' : 'default'
                                } 
                                sx={{ mr: 1, mt: 0.5 }} 
                              />
                              <br />
                              Reported by {issue.reported_by?.name || 'Unknown'} on{' '}
                              {new Date(issue.reported_at).toLocaleDateString()}
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    </DashboardLayout>
  );
};

export default QRScannerPage;
