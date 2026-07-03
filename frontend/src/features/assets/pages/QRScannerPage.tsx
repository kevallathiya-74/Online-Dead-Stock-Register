import {
    ArrowPathIcon,
    CameraIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    LightBulbIcon,
    PaperAirplaneIcon,
    QrCodeIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { BrowserQRCodeReader } from "@zxing/library";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { API_BASE_URL } from "../../../config/api.config";
import assetUpdateService from "../services/assetUpdateService";

const QRScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(true);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const scanningRef = useRef(false);
  const handleQRCodeDetectedRef = useRef<((data: string) => Promise<void>) | null>(null);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  {/* eslint-disable-next-line react-hooks/exhaustive-deps */}
  }, []);

  const stopScanning = useCallback(async () => {
    scanningRef.current = false;
    if (torchOn && stream) {
      try {
        const track = stream.getVideoTracks()[0];
        if (track) {
          await track.applyConstraints({
            advanced: [{ torch: false } as any]
          });
        }
      } catch { /* ignore */ }
    }
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      setStream(null);
    }
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
      } catch { /* ignore */ }
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
    setTorchOn(false);
  }, [stream, torchOn]);

  const startScanning = async () => {
    try {
      if (scanningRef.current) return;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMsg = "Camera access is not supported on this device. Please use HTTPS for camera access on mobile devices.";
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      scanningRef.current = true;
      setError("");
      setScanning(true);

      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!videoRef.current) {
        throw new Error("Video element not found");
      }

      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserQRCodeReader();
      }

      const permissionStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          advanced: [{ torch: true }]
        },
      });
      
      permissionStream.getTracks().forEach((track) => track.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((device) => device.kind === "videoinput");
      setAvailableCameras(cameras);

      let selectedDeviceId: string | undefined;
      
      if (cameras.length > 0) {
        if (cameras.length > 1) {
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
            selectedDeviceId = cameras[currentCameraIndex]?.deviceId;
          }
        } else {
          selectedDeviceId = cameras[0].deviceId;
        }
      }

      await codeReaderRef.current.decodeFromVideoDevice(
        selectedDeviceId || null,
        videoRef.current,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (result, err) => {
          if (result && scanningRef.current) {
            const qrText = result.getText();
            if (handleQRCodeDetectedRef.current) {
              handleQRCodeDetectedRef.current(qrText);
            }
          }
        }
      );

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
              video.addEventListener("loadeddata", () => resolve(), { once: true });
            }
          };
          checkVideo();
          setTimeout(() => resolve(), 2000);
        });
      }

      if (videoRef.current && videoRef.current.srcObject) {
        const mediaStream = videoRef.current.srcObject as MediaStream;
        setStream(mediaStream);
        
        const videoTrack = mediaStream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities: any = videoTrack.getCapabilities();
          const hasTorch = 'torch' in capabilities;
          const hasFillLight = capabilities.fillLightMode && Array.isArray(capabilities.fillLightMode);
          setTorchSupported(hasTorch || hasFillLight);
        }
      }
    } catch (err: any) {
      scanningRef.current = false;
      setScanning(false);
      let errorMessage = "Failed to access camera. Please try again.";
      if ((err as any).name === "NotAllowedError" || (err as any).name === "PermissionDeniedError") {
        errorMessage = "Camera access denied. Please grant camera permissions in settings.";
      } else if ((err as any).name === "NotFoundError" || (err as any).name === "DevicesNotFoundError") {
        errorMessage = "No camera found on this device.";
      } else if ((err as any).name === "NotReadableError") {
        errorMessage = "Camera is already in use by another application.";
      }
      setError(errorMessage);
    }
  };

  const switchCamera = async () => {
    if (availableCameras.length <= 1) {
      toast.info("Only one camera available");
      return;
    }
    try {
      stopScanning();
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newFacingMode = facingMode === "environment" ? "user" : "environment";
      setFacingMode(newFacingMode);
      const nextIndex = (currentCameraIndex + 1) % availableCameras.length;
      setCurrentCameraIndex(nextIndex);
      await startScanning();
      toast.success(`Switched to ${newFacingMode === "environment" ? "back" : "front"} camera`);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err: any) {
      toast.error("Failed to switch camera");
      setScanning(false);
      scanningRef.current = false;
    }
  };

  const toggleTorch = async () => {
    if (!scanning || !stream) {
      toast.warning("Please start the camera first");
      return;
    }
    const newTorchState = !torchOn;
    try {
      const track = stream.getVideoTracks()[0];
      if (!track) {
        toast.error("No video track available");
        return;
      }
      const capabilities: any = track.getCapabilities();
      const hasTorchCapability = 'torch' in capabilities;
      const hasFillLightMode = capabilities.fillLightMode && Array.isArray(capabilities.fillLightMode);
      
      if (!hasTorchCapability && !hasFillLightMode) {
        throw new Error('DEVICE_NO_TORCH_HARDWARE');
      }

      if (!track.enabled) {
        track.enabled = true;
      }

      let success = false;
      if (hasTorchCapability) {
        try {
          await track.applyConstraints({ advanced: [{ torch: newTorchState } as any] });
          await new Promise(resolve => setTimeout(resolve, 200));
          const verifySettings: any = track.getSettings();
          if (verifySettings.torch === newTorchState) {
            success = true;
          }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-empty
        } catch (e: any) {}
      }

      if (!success && hasFillLightMode) {
        try {
          const fillMode = capabilities.fillLightMode.includes('flash') ? 'flash' : 'torch';
          await track.applyConstraints({
            advanced: [{ fillLightMode: newTorchState ? fillMode : 'off' } as any]
          });
          success = true;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-empty
        } catch (e: any) {}
      }

      if (success) {
        setTorchOn(newTorchState);
      } else {
        throw new Error('Flashlight control failed');
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err: any) {
      setTorchOn(false);
      toast.error("Flashlight control not supported by hardware/camera mode");
    }
  };

  const [scannedAsset, setScannedAsset] = useState<any>(null);
  const [issueDescription, setIssueDescription] = useState("");
  const [issueType, setIssueType] = useState("Other");
  const [severity, setSeverity] = useState("Medium");
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const [existingIssues, setExistingIssues] = useState<any[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(false);

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
        if (result.data.issues && result.data.issues.length > 0) {
          const latestIssue = result.data.issues[0];
          setIssueDescription(latestIssue.issue_description);
          setIssueType(latestIssue.issue_type);
          setSeverity(latestIssue.severity);
        } else {
          setIssueDescription("");
          setIssueType("Other");
          setSeverity("Medium");
        }
      }
    } catch { /* ignore */ } finally {
      setLoadingIssues(false);
    }
  };

  const handleQRCodeDetected = useCallback(async (data: string) => {
    if (!scanningRef.current) return;
    scanningRef.current = false;
    stopScanning();

    try {
      let assetIdentifier = data;
      try {
        const parsed = JSON.parse(data);
        if (parsed.asset_id) assetIdentifier = parsed.asset_id;
        else if (parsed.unique_asset_id) assetIdentifier = parsed.unique_asset_id;
        else if (parsed.serial) assetIdentifier = parsed.serial;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-empty
      } catch (e: any) {}

      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      const apiUrl = `${API_BASE_URL}/qr/scan/${encodeURIComponent(assetIdentifier)}`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        let errData;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        try { errData = JSON.parse(errText); } catch (e: any) { errData = { message: errText || "Asset not found" }; }
        throw new Error(errData.message || "Asset not found");
      }

      const result = await response.json();
      if (result.success && result.asset) {
        toast.success("Asset scanned successfully!");
        setScannedAsset(result.asset);
        setError("");
        await fetchAssetIssues(result.asset.id || result.asset._id);
        const assetId = result.asset._id || result.asset.id;
        if (assetId) {
          assetUpdateService.notifyAuditComplete(assetId, {
            scanned_at: result.scanned_at,
            scanned_by: result.scanned_by,
            asset: result.asset
          });
          localStorage.setItem(`asset_updated_${assetId}`, Date.now().toString());
        }
      } else {
        setError("Invalid QR code. Asset not found.");
        toast.error("Asset not found");
      }
    } catch (err: any) {
      setError((err as any).message || "Invalid QR code. Please scan a valid asset QR code.");
      toast.error((err as any).message || "Failed to scan QR code");
    }
  }, [stopScanning]);

  useEffect(() => {
    handleQRCodeDetectedRef.current = handleQRCodeDetected;
  }, [handleQRCodeDetected]);

  const handleSubmitIssue = async () => {
    if (!scannedAsset) return;
    if (!issueDescription.trim()) {
      toast.error("Please enter an issue description");
      return;
    }
    try {
      setSubmittingIssue(true);
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      const assetId = scannedAsset.id || scannedAsset._id;
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

      toast.success(isUpdate ? "Issue updated successfully!" : "Issue reported successfully!");
      await fetchAssetIssues(assetId);
    } catch (error: any) {
      toast.error((error as Error).message || "Failed to save issue");
    } finally {
      setSubmittingIssue(false);
    }
  };

  const handleClearIssue = () => {
    setIssueDescription("");
    setIssueType("Other");
    setSeverity("Medium");
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-display text-slate-905 flex items-center gap-2">
              <QrCodeIcon className="w-7 h-7 text-brand-600" />
              Scan Asset QR Code
            </h2>
            <p className="text-xs text-slate-500 mt-1">Use your camera to scan asset QR codes for instant details</p>
          </div>
          <button
            onClick={() => navigate("/assets")}
            className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-100 text-red-800 rounded-xl text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-800 font-bold">×</button>
          </div>
        )}

        {/* Scan Camera Card */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
          {!scanning ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-605 flex items-center justify-center mx-auto">
                <QrCodeIcon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Ready to Scan</h3>
                <p className="text-xs text-slate-400 mt-1">Click below to activate your camera and scan a QR code label</p>
              </div>
              <button
                onClick={startScanning}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl cursor-pointer"
              >
                <CameraIcon className="w-4.5 h-4.5" />
                Start Camera
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-slate-950 rounded-xl overflow-hidden shadow-inner max-w-lg mx-auto aspect-video flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                
                {/* Aiming Reticle Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-brand-500 rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-brand-500 -mt-1 -ml-1" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-brand-500 -mt-1 -mr-1" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-brand-500 -mb-1 -ml-1" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-brand-500 -mb-1 -mr-1" />
                  </div>
                </div>

                {/* Control Action Overlays */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                  {torchSupported && (
                    <button
                      onClick={toggleTorch}
                      className="p-2.5 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md cursor-pointer"
                      title="Toggle flashlight"
                    >
                      <LightBulbIcon className={`w-5 h-5 ${torchOn ? 'text-amber-500' : 'text-slate-505'}`} />
                    </button>
                  )}
                  {availableCameras.length > 1 && (
                    <button
                      onClick={switchCamera}
                      className="p-2.5 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md cursor-pointer"
                      title="Switch Camera"
                    >
                      <ArrowPathIcon className="w-5 h-5 text-slate-600" />
                    </button>
                  )}
                  <button
                    onClick={stopScanning}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-red-650 hover:bg-red-750 text-white font-semibold text-xs rounded-xl cursor-pointer"
                  >
                    <XMarkIcon className="w-4.5 h-4.5" />
                    Stop
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 leading-relaxed text-center">
                <strong>Tip:</strong> Position the barcode label steadily in the box target. The browser reader decodes automatically.
              </div>
            </div>
          )}
        </div>

        {/* Scan Result Data Card */}
        {scannedAsset && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-green-600 font-display">Scanned Asset Found</h3>
              <button
                onClick={async () => {
                  setScannedAsset(null);
                  setError("");
                  await startScanning();
                }}
                className="px-3 py-1 border border-slate-200 text-slate-700 text-xs rounded-lg hover:bg-slate-50 transition-all cursor-pointer font-semibold"
              >
                Scan Another
              </button>
            </div>

            <div className="overflow-hidden border border-slate-50 rounded-xl text-xs">
              <table className="w-full text-left border-collapse">
                <tbody className="divide-y divide-slate-50 text-slate-700">
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-500 w-1/3 bg-slate-50/30">Asset ID</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{scannedAsset.unique_asset_id}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-500 bg-slate-50/30">Name</td>
                    <td className="p-3 font-semibold text-slate-900">{scannedAsset.name || `${scannedAsset.manufacturer} ${scannedAsset.model}`}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-500 bg-slate-50/30">Category</td>
                    <td className="p-3">{scannedAsset.asset_type || "N/A"}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-500 bg-slate-50/30">Manufacturer / Model</td>
                    <td className="p-3">{scannedAsset.manufacturer} {scannedAsset.model}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-500 bg-slate-50/30">Serial S/N</td>
                    <td className="p-3 font-mono text-[10px]">{scannedAsset.serial_number}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-500 bg-slate-50/30">Status</td>
                    <td className="p-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {scannedAsset.status}
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-500 bg-slate-50/30">Location</td>
                    <td className="p-3">{scannedAsset.location}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-500 bg-slate-50/30">Assigned User</td>
                    <td className="p-3">{scannedAsset.assigned_user?.name || "Unassigned"}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-500 bg-slate-50/30">Purchase Cost</td>
                    <td className="p-3 font-semibold text-slate-900">
                      {scannedAsset.purchase_cost ? `₹${Number(scannedAsset.purchase_cost).toLocaleString('en-IN')}` : 'N/A'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Issue Reporting Section */}
        {scannedAsset && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6 space-y-4 text-xs">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold font-display text-slate-900">
                {existingIssues.length > 0 ? 'Update Asset Issue' : 'Report Asset Issue'}
              </h3>
            </div>

            {existingIssues.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl leading-relaxed">
                This asset has open issues. Submitting will update the active ticket.
              </div>
            )}

            {loadingIssues ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-brand-650 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Issue Description *</label>
                  <textarea
                    rows={3}
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="Describe the physical condition or issue with this asset..."
                    disabled={submittingIssue}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-655 mb-1">Issue Type</label>
                    <select
                      value={issueType}
                      onChange={(e) => setIssueType(e.target.value)}
                      disabled={submittingIssue}
                      className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    >
                      <option value="Damage">Damage</option>
                      <option value="Missing Part">Missing Part</option>
                      <option value="Maintenance Required">Maintenance Required</option>
                      <option value="Performance Issue">Performance Issue</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-655 mb-1">Severity</label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                      disabled={submittingIssue}
                      className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 text-xs">
                  <button
                    onClick={handleSubmitIssue}
                    disabled={submittingIssue || !issueDescription.trim()}
                    className="inline-flex items-center gap-1 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold rounded-xl cursor-pointer"
                  >
                    <PaperAirplaneIcon className="w-4 h-4" />
                    {submittingIssue ? 'Submitting...' : (existingIssues.length > 0 ? 'Update Issue' : 'Submit Issue')}
                  </button>
                  <button
                    onClick={handleClearIssue}
                    disabled={submittingIssue}
                    className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-750 font-semibold rounded-xl cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Issue History Logs */}
            {existingIssues.length > 1 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-1.5">
                  <ClockIcon className="w-4 h-4 text-slate-400" />
                  <h4 className="font-semibold text-slate-800">Issue History</h4>
                </div>
                <div className="divide-y divide-slate-50 max-h-40 overflow-y-auto">
                  {existingIssues.slice(1).map((issue: any) => (
                    <div key={issue._id} className="py-2.5 space-y-1">
                      <p className="font-medium text-slate-900">{issue.issue_description}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-semibold text-slate-600">
                          {issue.issue_type}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          issue.severity === 'Critical' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-705'
                        }`}>
                          {issue.severity}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Reported by {issue.reported_by?.name || 'Unknown'} on {new Date(issue.reported_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default QRScannerPage;
