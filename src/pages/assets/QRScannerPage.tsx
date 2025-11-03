import React, { useState, useEffect, useRef } from "react";
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

  useEffect(() => {
    // Get available cameras on mount
    const getCameras = async () => {
      try {
        // Request camera permission first to get device labels
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        stream.getTracks().forEach((track) => track.stop());

        // Now enumerate devices with proper labels
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(
          (device) => device.kind === "videoinput"
        );
        console.log("Available cameras:", cameras.length);
        setAvailableCameras(cameras);
      } catch (err) {
        console.error("Error enumerating devices:", err);
        // Fallback: try to get cameras without permission
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const cameras = devices.filter(
            (device) => device.kind === "videoinput"
          );
          setAvailableCameras(cameras);
        } catch (e) {
          console.error("Fallback enumeration failed:", e);
        }
      }
    };

    getCameras();

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setError("");
      setScanning(true);

      // Wait for video element to be mounted in the DOM
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!videoRef.current) {
        console.error("Video element not ready after waiting");
        throw new Error("Video element not found");
      }

      toast.info("Starting camera...");

      // Initialize QR code reader
      const codeReader = new BrowserQRCodeReader();
      codeReaderRef.current = codeReader;

      // Get device ID for selected camera
      const deviceId =
        availableCameras.length > 0 && availableCameras[currentCameraIndex]
          ? availableCameras[currentCameraIndex].deviceId
          : null;

      console.log("Starting camera with device:", deviceId || "default");

      // Use ZXing's built-in continuous scanning method
      // This method returns a promise that resolves when scanning starts
      const controls = await codeReader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            console.log("✓ QR Code detected:", result.getText());
            handleQRCodeDetected(result.getText());
          }
          // Only log actual errors, not NotFoundException which is normal
          if (err && !(err instanceof NotFoundException)) {
            console.error("QR Scan error:", err);
          }
        }
      );

      // Wait a moment for the video to start
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Store the stream reference from video element
      if (videoRef.current && videoRef.current.srcObject) {
        setStream(videoRef.current.srcObject as MediaStream);
        console.log("Stream attached successfully");
      }

      toast.success("Camera started. Point at QR code");
    } catch (err: any) {
      console.error("Camera access error:", err);
      setScanning(false);

      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        setError(
          "Camera access denied. Please grant camera permissions in your browser settings."
        );
        toast.error("Camera access denied");
      } else if (
        err.name === "NotFoundError" ||
        err.name === "DevicesNotFoundError"
      ) {
        setError("No camera found on this device.");
        toast.error("No camera found");
      } else {
        setError(
          "Failed to access camera. Please check your camera and try again."
        );
        toast.error("Camera error: " + (err.message || "Unknown error"));
      }
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      try {
        // Reset stops all streams and cleans up
        codeReaderRef.current.reset();
        console.log("Scanner stopped and reset");
      } catch (err) {
        console.warn("Error resetting code reader:", err);
      }
      codeReaderRef.current = null;
    }
    setScanning(false);
    setStream(null);
  };

  const switchCamera = async () => {
    if (availableCameras.length <= 1) {
      toast.info("Only one camera available");
      return;
    }

    try {
      // Stop current scanning
      stopScanning();

      // Switch to next camera
      const nextIndex = (currentCameraIndex + 1) % availableCameras.length;
      setCurrentCameraIndex(nextIndex);

      // Toggle facing mode
      const newFacingMode =
        facingMode === "environment" ? "user" : "environment";
      setFacingMode(newFacingMode);

      // Give time for state to update and previous stream to close
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Restart scanning with new camera
      await startScanning();

      toast.info(
        `Switched to ${
          newFacingMode === "environment" ? "back" : "front"
        } camera`
      );
    } catch (err: any) {
      console.error("Camera switch error:", err);
      toast.error("Failed to switch camera");
      setScanning(false);
    }
  };

  const toggleTorch = async () => {
    if (!scanning || !videoRef.current || !videoRef.current.srcObject) {
      toast.info("Start camera first");
      return;
    }

    try {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      const capabilities: any = track.getCapabilities();

      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !torchOn }],
        } as any);
        setTorchOn(!torchOn);
        toast.success(torchOn ? "Flashlight off" : "Flashlight on");
      } else {
        toast.info("Flashlight not available on this device");
      }
    } catch (err) {
      console.error("Torch error:", err);
      toast.error("Failed to toggle flashlight");
    }
  };

  const [scannedAsset, setScannedAsset] = useState<any>(null);

  const handleQRCodeDetected = async (data: string) => {
    stopScanning();

    try {
      // Call backend API to scan asset - this will create audit log and return asset details
      console.log("Scanned QR Code Data:", data);
      toast.info("Processing QR code...");

      const token =
        localStorage.getItem("auth_token") || localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/v1/qr/scan/${encodeURIComponent(data)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.message || "Asset not found");
      }

      const result = await response.json();
      console.log("Scan result:", result);

      if (result.success && result.asset) {
        toast.success("Asset scanned successfully! Audit log created.");
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
  };

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
