import {
    ArrowPathIcon,
    CameraIcon,
    LightBulbIcon,
    QrCodeIcon,
    XMarkIcon
} from "@heroicons/react/24/outline";
import { BrowserQRCodeReader } from "@zxing/library";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import api from "../../services/api";
import assetUpdateService from "../../features/assets/services/assetUpdateService";

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
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [scannedAsset, setScannedAsset] = useState<Asset | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [activeTab, setActiveTab] = useState(0);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [batchScans, setBatchScans] = useState<BatchScanItem[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isBatchScanning, setIsBatchScanning] = useState(false);

  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const scanningRef = useRef(false);
  const handleQRCodeDetectedRef = useRef<((qrText: string) => Promise<void>) | null>(null);
  const initializingRef = useRef(false);

  const vibrate = (pattern: number | number[] = 200) => {
    try {
      if ("vibrate" in navigator && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch { /* ignore */ }
  };

  const handleQRCodeDetected = useCallback(
    async (qrText: string) => {
      if (!scanningRef.current) return;
      if (!qrText || qrText.trim().length === 0) return;
      
      scanningRef.current = false;
      try {
        setLoading(true);
        setError(null);

        let assetIdentifier = qrText.trim();
        try {
          const parsed = JSON.parse(qrText);
          if (parsed.asset_id) assetIdentifier = parsed.asset_id;
          else if (parsed.unique_asset_id) assetIdentifier = parsed.unique_asset_id;
          else if (parsed.serial_number || parsed.serial) assetIdentifier = parsed.serial_number || parsed.serial;
          else if (parsed.qr_code) assetIdentifier = parsed.qr_code;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-empty
        } catch (e: any) {}

        const response = await api.get(
          `/qr/scan/${encodeURIComponent(assetIdentifier)}`,
          {
            params: { mode, include_history: enableHistory },
            timeout: 10000,
          }
        );

        if (response.data && response.data.success && response.data.asset) {
          const asset = response.data.asset;
          setScannedAsset(asset);
          onAssetFound(asset);
          vibrate([100, 50, 100]);

          const assetId = asset._id || asset.id;
          if (assetId) {
            assetUpdateService.notifyAuditComplete(assetId, {
              scanned_at: new Date(),
              mode: mode,
              asset: asset
            });
            localStorage.setItem(`asset_updated_${assetId}`, Date.now().toString());
          }

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
            scanningRef.current = true;
          } else {
            scanningRef.current = false;
          }

          if (mode === "lookup" && !isBatchScanning) {
            setTimeout(() => {
              onClose();
            }, 2000);
          }
        }
      } catch (err: any) {
        const apiError = err as any;
        const errorMessage = apiError.response?.data?.message || apiError.response?.data?.error || apiError.message || "Asset not found";
        setError(errorMessage);
        toast.error(errorMessage);
        vibrate([100, 100, 100, 100]);

        if (enableBatchScan && isBatchScanning) {
          setBatchScans((prev) => [
            ...prev,
            { qr_code: qrText, error: errorMessage, status: "error", name: "Not Found" },
          ]);
          scanningRef.current = true;
        } else {
          scanningRef.current = false;
        }
      } finally {
        setLoading(false);
      }
    },
    [onAssetFound, mode, isBatchScanning, enableBatchScan, onClose, enableHistory]
  );

  useEffect(() => {
    handleQRCodeDetectedRef.current = handleQRCodeDetected;
  }, [handleQRCodeDetected]);

  const stopScanning = useCallback(() => {
    scanningRef.current = false;
    initializingRef.current = false;
    setScanning(false);

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const videoStream = videoRef.current.srcObject as MediaStream;
      videoStream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
      } catch { /* ignore */ }
    }
    setFlashEnabled(false);
  }, [stream]);

  const startScanning = useCallback(
    async (deviceId?: string) => {
      try {
        if (initializingRef.current || scanningRef.current) return;
        initializingRef.current = true;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          const errorMsg = "Camera access is not supported. Please use HTTPS.";
          setError(errorMsg);
          throw new Error(errorMsg);
        }

        if (!videoRef.current) throw new Error("Video element not available");

        scanningRef.current = true;
        setScanning(true);
        setError(null);

        if (!codeReaderRef.current) {
          codeReaderRef.current = new BrowserQRCodeReader();
        }

        if (!deviceId) {
          // eslint-disable-next-line no-useless-catch
          try {
            let devices = await navigator.mediaDevices.enumerateDevices();
            let cameras = devices.filter(device => device.kind === "videoinput");
            
            if (cameras.length === 0 || !cameras[0].label) {
              const permissionStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingMode }
              });
              permissionStream.getTracks().forEach((track) => track.stop());
              await new Promise(resolve => setTimeout(resolve, 300));
              devices = await navigator.mediaDevices.enumerateDevices();
              cameras = devices.filter(device => device.kind === "videoinput");
            }
            
            setAvailableCameras(cameras);
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
                deviceId = preferredCamera ? preferredCamera.deviceId : cameras[currentCameraIndex]?.deviceId || cameras[0].deviceId;
              } else {
                deviceId = cameras[0].deviceId;
              }
            }
          } catch (permErr) {
            throw permErr;
          }
        }
        
        await codeReaderRef.current.decodeFromVideoDevice(
          deviceId || null,
          videoRef.current,
          (result) => {
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
            if (!video) { resolve(); return; }
            const checkVideo = () => {
              if (video.readyState >= 2) resolve();
              else video.addEventListener("loadeddata", () => resolve(), { once: true });
            };
            checkVideo();
            setTimeout(() => resolve(), 2000);
          });
        }

        await new Promise(resolve => setTimeout(resolve, 200));
        
        if (videoRef.current && videoRef.current.srcObject) {
          const mediaStream = videoRef.current.srcObject as MediaStream;
          setStream(mediaStream);
          initializingRef.current = false;
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err: any) {
        initializingRef.current = false;
        scanningRef.current = false;
        setScanning(false);
        setError("Failed to start camera. Please verify permission settings.");
      }
    },
    [facingMode, currentCameraIndex]
  );

  const initializeScanner = useCallback(async () => {
    let initSuccess = false;
    try {
      setLoading(true);
      setError(null);
      if (scanningRef.current || stream) {
        stopScanning();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      await startScanning();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      initSuccess = true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err: any) {
      setError("Failed to initialize camera");
    } finally {
      setLoading(false);
    }
  }, [startScanning, stopScanning, stream]);

  const toggleFlash = async () => {
    if (!scanning || !stream) return;
    try {
      const track = stream.getVideoTracks()[0];
      if (!track) return;
      const capabilities: any = track.getCapabilities();
      if (capabilities.torch) {
        await track.applyConstraints({ advanced: [{ torch: !flashEnabled } as any] });
        setFlashEnabled(!flashEnabled);
      }
    } catch { /* ignore */ }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const restartScanning = () => {
    setScannedAsset(null);
    setError(null);
    stopScanning();
    setTimeout(() => {
      initializeScanner();
    }, 300);
  };

  const switchCamera = async () => {
    if (availableCameras.length <= 1) return;
    try {
      stopScanning();
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newFacingMode = facingMode === "environment" ? "user" : "environment";
      setFacingMode(newFacingMode);
      const nextIndex = (currentCameraIndex + 1) % availableCameras.length;
      setCurrentCameraIndex(nextIndex);
      await startScanning();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err: any) {
      setError("Failed to switch camera");
    }
  };

  const loadScanHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      setError(null);
      const response = await api.get("/qr/history", {
        params: { limit: 20, page: 1, mode },
      });
      if (response.data.success && response.data.scans) {
        setScanHistory(response.data.scans);
      } else {
        setScanHistory([]);
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      setScanHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [mode]);

  useEffect(() => {
    if (open && activeTab === 0) {
      initializeScanner();
    }
    return () => {
      stopScanning();
    };
  {/* eslint-disable-next-line react-hooks/exhaustive-deps */}
  }, [open, activeTab]);

  useEffect(() => {
    if (open && activeTab === 1 && enableHistory) {
      loadScanHistory();
    }
  }, [open, activeTab, enableHistory, loadScanHistory]);

  if (!open) return null;

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "available":
        return "bg-green-50 text-green-700 border border-green-100";
      case "under maintenance":
        return "bg-amber-50 text-amber-700 border border-amber-100";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-100";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-xs text-slate-655">
      <div className="bg-white rounded-2xl border border-slate-100 max-w-4xl w-full h-[90vh] flex flex-col shadow-card-xl animate-fade-in-up">
        {/* Header Title */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
              <QrCodeIcon className="w-5.5 h-5.5 text-brand-600" />
              {mode === "audit" ? "Audit Mode - Scan QR" : mode === "checkout" ? "Check-out Asset - Scan QR" : "Asset Lookup - Scan QR"}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 border-b border-slate-100 flex items-center gap-4 flex-shrink-0 bg-slate-50/50">
          <button
            onClick={() => setActiveTab(0)}
            className={`py-3.5 px-1 font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 0 ? "border-brand-605 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Scanner Camera
          </button>
          {enableHistory && (
            <button
              onClick={() => setActiveTab(1)}
              className={`py-3.5 px-1 font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 1 ? "border-brand-605 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              Scan History
            </button>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 0 && (
            <div className="h-full flex flex-col space-y-4">
              <div className="relative bg-slate-950 rounded-xl overflow-hidden shadow-inner flex-1 min-h-[300px] flex items-center justify-center">
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${scanning ? 'block' : 'hidden'}`}
                  autoPlay
                  playsInline
                  muted
                />

                {loading && (
                  <div className="text-center space-y-2">
                    <div className="w-10 h-10 rounded-full border-4 border-slate-700 border-t-white animate-spin mx-auto" />
                    <p className="text-slate-300 font-medium">Starting Camera...</p>
                  </div>
                )}

                {error && (
                  <div className="text-center p-6 space-y-3 max-w-sm">
                    <div className="p-3 bg-red-900/30 border border-red-500/30 text-red-200 rounded-xl text-[11px] leading-relaxed">
                      {error}
                    </div>
                    <button
                      onClick={initializeScanner}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl cursor-pointer"
                    >
                      <CameraIcon className="w-4.5 h-4.5" />
                      Retry Camera
                    </button>
                  </div>
                )}

                {!loading && !error && !scanning && (
                  <div className="text-center space-y-3 p-6 max-w-sm">
                    <QrCodeIcon className="w-12 h-12 text-slate-600 mx-auto" />
                    <h3 className="font-bold text-slate-200">Scanner Offline</h3>
                    <p className="text-slate-400 text-[11px]">Click the button below to turn on the camera</p>
                    <button
                      onClick={initializeScanner}
                      className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl cursor-pointer"
                    >
                      Start Camera
                    </button>
                  </div>
                )}

                {!loading && !error && scanning && (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-52 h-52 border-2 border-brand-500 rounded-2xl relative animate-pulse">
                        <div className="absolute top-0 left-0 w-3 h-3 border-t-4 border-l-4 border-brand-500 -mt-1 -ml-1" />
                        <div className="absolute top-0 right-0 w-3 h-3 border-t-4 border-r-4 border-brand-500 -mt-1 -mr-1" />
                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-4 border-l-4 border-brand-500 -mb-1 -ml-1" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-4 border-r-4 border-brand-500 -mb-1 -mr-1" />
                      </div>
                    </div>

                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                      <button
                        onClick={toggleFlash}
                        className="p-2 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md cursor-pointer"
                      >
                        <LightBulbIcon className={`w-4.5 h-4.5 ${flashEnabled ? 'text-amber-500' : 'text-slate-500'}`} />
                      </button>
                      {availableCameras.length > 1 && (
                        <button
                          onClick={switchCamera}
                          className="p-2 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md cursor-pointer"
                        >
                          <ArrowPathIcon className="w-4.5 h-4.5 text-slate-600" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 1 && enableHistory && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 font-display">Recent Scans</h3>
                <button
                  onClick={loadScanHistory}
                  disabled={loadingHistory}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-205 text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer"
                >
                  <ArrowPathIcon className="w-4 h-4 text-slate-500" />
                  Refresh
                </button>
              </div>

              {loadingHistory ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-brand-600 animate-spin" />
                </div>
              ) : scanHistory.length === 0 ? (
                <div className="text-center py-10 text-slate-400 bg-slate-50 border border-slate-100 rounded-xl">
                  No scan history found.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-50 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase">
                        <th className="pb-3 pt-2 pl-4">Asset ID</th>
                        <th className="pb-3 pt-2">Action</th>
                        <th className="pb-3 pt-2">Location</th>
                        <th className="pb-3 pt-2">Status</th>
                        <th className="pb-3 pt-2 pr-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700">
                      {scanHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-55/50">
                          <td className="py-3 pl-4">
                            {item.asset ? (
                              <div>
                                <p className="font-bold text-slate-900">{item.asset.unique_asset_id}</p>
                                <p className="text-[10px] text-slate-400">{item.asset.name || `${item.asset.manufacturer} ${item.asset.model}`}</p>
                              </div>
                            ) : (
                              <span className="text-slate-400">Asset not found</span>
                            )}
                          </td>
                          <td className="py-3">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700">
                              {item.action.replace(/_/g, " ").toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 text-slate-500">{item.asset?.location || "-"}</td>
                          <td className="py-3">
                            {item.asset?.status && (
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${getStatusBadge(item.asset.status)}`}>
                                {item.asset.status}
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-slate-400">{new Date(item.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedQRScanner;
