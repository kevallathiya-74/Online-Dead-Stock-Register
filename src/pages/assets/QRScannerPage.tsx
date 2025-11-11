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
} from "@mui/material";
import {
  QrCodeScanner as ScannerIcon,
  Close as CloseIcon,
  CameraAlt as CameraIcon,
  FlashlightOn as FlashlightIcon,
  FlashlightOff as FlashlightOffIcon,
  Cameraswitch as SwitchCameraIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { BrowserQRCodeReader, NotFoundException } from "@zxing/library";
import { API_BASE_URL } from "../../config/api.config";

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
        toast.error(errorMsg);
        return;
      }

      scanningRef.current = true;
      setError("");
      setScanning(true);

      console.log("Starting camera initialization...");

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
      console.log("Requesting camera permission...");
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
      console.log("Available cameras:", cameras.length, cameras);
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
            console.log("Using preferred camera:", preferredCamera.label);
          } else {
            // Fallback to index-based selection
            selectedDeviceId = cameras[currentCameraIndex]?.deviceId;
            console.log("Using camera by index:", currentCameraIndex);
          }
        } else {
          // Only one camera available
          selectedDeviceId = cameras[0].deviceId;
          console.log("Using only available camera:", cameras[0].label);
        }
      }

      console.log("Starting QR code reader with device:", selectedDeviceId);
      toast.info("Initializing camera...");

      // Start decoding with proper error handling
      await codeReaderRef.current.decodeFromVideoDevice(
        selectedDeviceId || null,
        videoRef.current,
        (result, err) => {
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
          if (err && !(err instanceof NotFoundException)) {
            console.warn("QR Scan error:", err);
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
        console.log("✓ Camera stream attached successfully");
        toast.success("Camera ready! Point at a QR code");
      } else {
        console.warn("Stream not attached to video element");
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      scanningRef.current = false;
      setScanning(false);

      let errorMessage = "Failed to access camera. Please try again.";

      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        errorMessage =
          "Camera access denied. Please grant camera permissions in your browser settings.";
        toast.error("Camera permission denied");
      } else if (
        err.name === "NotFoundError" ||
        err.name === "DevicesNotFoundError"
      ) {
        errorMessage = "No camera found on this device.";
        toast.error("No camera found");
      } else if (err.name === "NotReadableError") {
        errorMessage =
          "Camera is already in use by another application. Please close other apps using the camera.";
        toast.error("Camera in use");
      } else if (err.name === "OverconstrainedError") {
        errorMessage =
          "Could not start camera with the requested settings. Trying alternative...";
        toast.error("Camera constraint error");
        
        // Try again with default camera
        if (facingMode === "user") {
          setFacingMode("environment");
        }
      } else {
        toast.error("Camera error: " + (err.message || "Unknown error"));
      }

      setError(errorMessage);
    }
  };

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
    setTorchOn(false);
  }, [stream]);

  const switchCamera = async () => {
    if (availableCameras.length <= 1) {
      toast.info("Only one camera available");
      return;
    }

    try {
      console.log("Switching camera...");

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
    } catch (err: any) {
      console.error("Camera switch error:", err);
      toast.error("Failed to switch camera: " + (err.message || "Unknown error"));
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
      console.error("Torch error:", err);
      toast.error("Failed to toggle flashlight");
    }
  };

  const [scannedAsset, setScannedAsset] = useState<any>(null);

  const handleQRCodeDetected = useCallback(async (data: string) => {
    console.log("==> handleQRCodeDetected called with:", data);
    console.log("==> scanningRef.current:", scanningRef.current);
    
    // Prevent multiple scans - check and set atomically
    if (!scanningRef.current) {
      console.log("Scan already in progress, ignoring duplicate");
      return;
    }
    
    // Immediately set to false to prevent duplicate processing
    scanningRef.current = false;
    console.log("==> Set scanningRef to false, calling stopScanning...");
    
    stopScanning();

    try {
      console.log("Scanned QR Code Data:", data);
      toast.info("Processing QR code...");

      // Parse QR code data if it's JSON
      let assetIdentifier = data;
      try {
        const parsed = JSON.parse(data);
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

      const token =
        localStorage.getItem("auth_token") || localStorage.getItem("token");
      
      console.log("🔐 Auth token present:", !!token);
      console.log("🔐 Token preview:", token ? `${token.substring(0, 20)}...` : 'null');
      
      // Use the API base URL from config for proper network IP detection
      const apiUrl = `${API_BASE_URL}/qr/scan/${encodeURIComponent(assetIdentifier)}`;
      console.log("📡 API Call Details:");
      console.log("  - URL:", apiUrl);
      console.log("  - API_BASE_URL:", API_BASE_URL);
      console.log("  - Method: GET");
      console.log("  - Asset Identifier:", assetIdentifier);
      console.log("  - Encoded Identifier:", encodeURIComponent(assetIdentifier));

      const requestHeaders = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      console.log("  - Headers:", requestHeaders);

      const startTime = performance.now();
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: requestHeaders,
      });
      const endTime = performance.now();

      console.log("📡 Response received:");
      console.log("  - Status:", response.status, response.statusText);
      console.log("  - Time taken:", Math.round(endTime - startTime), "ms");
      console.log("  - Headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error Response:");
        console.error("  - Status:", response.status);
        console.error("  - Raw text:", errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
          console.error("  - Parsed error:", errorData);
        } catch (e) {
          errorData = { message: errorText || "Asset not found" };
        }
        
        throw new Error(errorData.message || "Asset not found");
      }

      const result = await response.json();
      console.log("✅ Scan result:", result);

      if (result.success && result.asset) {
        toast.success("✓ Asset scanned successfully!");
        // Store the scanned asset to display in table format
        setScannedAsset(result.asset);
        setError("");
        console.log("Asset data set:", result.asset);

        // Show scan details
        console.log("Scan details:", {
          scanned_by: result.scanned_by,
          scanned_at: result.scanned_at,
          audit_logged: true,
        });
      } else {
        setError("Invalid QR code. Asset not found.");
        toast.error("Asset not found");
      }
    } catch (err: any) {
      console.error("QR scan error:", err);
      setError(
        err.message || "Invalid QR code. Please scan a valid asset QR code."
      );
      toast.error(err.message || "Failed to scan QR code");
    }
  }, [stopScanning]);

  // Update the ref whenever the callback changes
  useEffect(() => {
    handleQRCodeDetectedRef.current = handleQRCodeDetected;
  }, [handleQRCodeDetected]);

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
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
                  ✓ Asset Scanned Successfully
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
                      <TableCell>{scannedAsset.category || "N/A"}</TableCell>
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
                          ? `₹${parseFloat(
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
      </Box>
    </DashboardLayout>
  );
};

export default QRScannerPage;
