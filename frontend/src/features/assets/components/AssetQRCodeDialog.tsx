import { QRCodeCanvas } from "qrcode.react";
import React, { useEffect, useRef } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  asset: any | null;
}

const AssetQRCodeDialog: React.FC<Props> = ({ open, onClose, asset }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      // cleanup
      {/* eslint-disable-next-line react-hooks/exhaustive-deps */}
      const c = containerRef.current;
      if (c) {
        // nothing special
      }
    };
  }, []);

  if (!asset) return null;

  const fullAssetData = {
    id: asset._id || asset.id,
    unique_asset_id: asset.unique_asset_id || asset.uniqueAssetId,
    name:
      asset.name || `${asset.manufacturer || ""} ${asset.model || ""}`.trim(),
    manufacturer: asset.manufacturer,
    model: asset.model,
    serial_number: asset.serial_number,
    category: asset.asset_type,
    location: asset.location,
    status: asset.status,
    condition: asset.condition,
    purchase_date: asset.purchase_date,
    purchase_cost: asset.purchase_cost,
    department: asset.department,
  };

  const qrValue = fullAssetData.unique_asset_id;

  if (!qrValue) {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-card-xl p-6 space-y-4 animate-fade-in-up">
          <h3 className="text-lg font-bold font-display text-red-600">Error</h3>
          <p className="text-sm text-slate-600">
            Asset does not have a valid unique_asset_id. Cannot generate QR code.
          </p>
          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-205 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const downloadQr = () => {
    const canvas = containerRef.current?.querySelector("canvas") as
      | HTMLCanvasElement
      | undefined;
    if (canvas) {
      canvas.toBlob((blob) => {
        if (!blob) {
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Asset-${fullAssetData.unique_asset_id}-QR.png`;
        link.click();
        URL.revokeObjectURL(url);
      });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-100 max-w-2xl w-full shadow-card-xl p-6 space-y-4 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-lg font-bold font-display text-slate-900">
            ✓ Asset Created Successfully!
          </h3>
          <span className="bg-green-50 text-green-700 border border-green-100 text-xs px-2 py-0.5 rounded-full font-bold">
            QR Code Ready
          </span>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Details */}
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-905 text-sm">
              Asset Details
            </h4>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs space-y-2 text-slate-655">
              <p>
                <strong>Asset ID:</strong>{" "}
                <span className="text-brand-600 font-semibold">
                  {fullAssetData.unique_asset_id}
                </span>
              </p>
              <p><strong>Name:</strong> {fullAssetData.name}</p>
              <p><strong>Manufacturer:</strong> {fullAssetData.manufacturer}</p>
              <p><strong>Model:</strong> {fullAssetData.model}</p>
              <p><strong>Serial:</strong> {fullAssetData.serial_number}</p>
              <p><strong>Category:</strong> {fullAssetData.category}</p>
              <p><strong>Location:</strong> {fullAssetData.location}</p>
              <p><strong>Status:</strong> {fullAssetData.status}</p>
            </div>

            <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl text-[11px] text-sky-850 space-y-1">
              <p className="font-bold">📱 How to Use This QR Code:</p>
              <p className="leading-relaxed">
                1. Print or save this QR code
                <br />
                2. Attach it to the physical asset
                <br />
                {/* eslint-disable-next-line react/no-unescaped-entities */}
                3. Use "Scan Asset QR Code" to instantly view asset details
                <br />
                4. Backend API will fetch all information from the database
              </p>
            </div>
          </div>

          {/* QR Scan Area */}
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <h4 className="font-semibold text-slate-905 text-sm">
              Scannable QR Code
            </h4>
            <div
              ref={containerRef}
              className="bg-white p-4 sm:p-5 rounded-2xl shadow-card border border-slate-150"
            >
              <QRCodeCanvas
                value={qrValue}
                size={220}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-[10px] text-slate-400">
              Encoded Value: <strong className="text-slate-700">{qrValue}</strong>
            </p>
            <button
              onClick={downloadQr}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm transition-all shadow-brand cursor-pointer"
            >
              Download QR Code
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssetQRCodeDialog;
