import {
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
    CameraIcon,
    InformationCircleIcon,
    QrCodeIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { QRCodeSVG } from "qrcode.react";
import React, { useState } from "react";
import { toast } from "react-toastify";
import api from "../../../services/api";

interface AddAssetModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (assetData: any) => void;
}

const AddAssetModal: React.FC<AddAssetModalProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    manufacturer: "",
    model: "",
    serial_number: "",
    location: "",
    assigned_user: "",
    purchase_date: "",
    purchase_cost: "",
    warranty_expiry: "",
    description: "",
    tags: [] as string[],
  });

  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedAssetId, setGeneratedAssetId] = useState("");
  const [showQRCode, setShowQRCode] = useState(false);

  const steps = ["Basic Information", "Details & Location", "Confirmation"];

  const categories = [
    "IT Equipment",
    "Office Equipment",
    "Mobile Device",
    "Furniture",
    "Machinery",
    "Vehicle",
    "Tools",
    "Other",
  ];

  const locations = [
    "IT Department - Floor 2",
    "Admin Office",
    "Sales Department",
    "Warehouse",
    "Meeting Room A",
    "Meeting Room B",
    "Reception",
    "Maintenance Room",
  ];

  if (!open) return null;

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const generateAssetId = () => {
    const prefix = "AST";
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, "0");
    return `${prefix}-${timestamp}${random}`;
  };

  const generateQRCode = () => {
    const assetId = generateAssetId();
    setGeneratedAssetId(assetId);
    setShowQRCode(true);
    toast.success(`QR Code generated for Asset ID: ${assetId}`);
    return assetId;
  };

  const downloadQRCode = () => {
    if (!generatedAssetId) return;
    const qrSVG = document.querySelector("svg[data-qr-code]") as SVGElement;
    if (!qrSVG) {
      toast.error("QR Code SVG preview not ready");
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const size = 300;
    canvas.width = size;
    canvas.height = size;

    if (ctx) {
      const svgData = new XMLSerializer().serializeToString(qrSVG);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, size, size);
        canvas.toBlob((blob) => {
          if (blob) {
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = `QR_${generatedAssetId}.png`;
            link.click();
            URL.revokeObjectURL(downloadUrl);
            toast.success("QR Code downloaded successfully!");
          }
        }, "image/png", 1.0);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!formData.name || !formData.category || !formData.manufacturer) {
        toast.error("Please fill in all required fields");
        return;
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const newAsset = {
        name: formData.name,
        manufacturer: formData.manufacturer,
        model: formData.model,
        serial_number: formData.serial_number,
        asset_type: formData.category,
        location: formData.location || "Not Assigned",
        department: "INVENTORY",
        status: "Available",
        condition: "excellent",
        purchase_date: formData.purchase_date || new Date().toISOString().split("T")[0],
        purchase_cost: parseFloat(formData.purchase_cost) || 0,
        warranty_expiry: formData.warranty_expiry,
        notes: formData.description,
      };

      const response = await api.post("/assets", newAsset);
      const createdAsset = response.data.data || response.data;
      onSubmit(createdAsset);

      toast.success(`Asset "${formData.name}" created successfully! QR Code ready.`);
      setFormData({
        name: "",
        category: "",
        manufacturer: "",
        model: "",
        serial_number: "",
        location: "",
        assigned_user: "",
        purchase_date: "",
        purchase_cost: "",
        warranty_expiry: "",
        description: "",
        tags: [],
      });
      setActiveStep(0);
      setGeneratedAssetId("");
      setShowQRCode(false);
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to add asset";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-xs text-slate-655">
      <div className="bg-white rounded-2xl border border-slate-100 max-w-2xl w-full shadow-card-xl flex flex-col h-[90vh] animate-fade-in-up">
        
        {/* Header Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <h3 className="text-base font-bold font-display text-slate-900">Add New Asset</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-step Navigation Stepper */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            {steps.map((label, idx) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                  idx <= activeStep ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {idx + 1}
                </div>
                <span className={`font-semibold ${idx === activeStep ? 'text-brand-600' : 'text-slate-500'}`}>{label}</span>
                {idx < steps.length - 1 && <span className="text-slate-305 font-light">&rarr;</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeStep === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-655 mb-1">Asset Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g. Dell XPS 15 Laptop"
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Manufacturer *</label>
                <input
                  type="text"
                  required
                  value={formData.manufacturer}
                  onChange={(e) => handleInputChange("manufacturer", e.target.value)}
                  placeholder="e.g. Dell, HP, Apple"
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Model</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => handleInputChange("model", e.target.value)}
                  placeholder="e.g. XPS 15, LaserJet Pro"
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Serial Number</label>
                <input
                  type="text"
                  value={formData.serial_number}
                  onChange={(e) => handleInputChange("serial_number", e.target.value)}
                  placeholder="e.g. DLL123456789"
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                />
              </div>
            </div>
          )}

          {activeStep === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-655 mb-1">Location</label>
                <select
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
                >
                  <option value="">Select Location</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Assigned User</label>
                <input
                  type="text"
                  value={formData.assigned_user}
                  onChange={(e) => handleInputChange("assigned_user", e.target.value)}
                  placeholder="e.g. John Employee"
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Purchase Date</label>
                <input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => handleInputChange("purchase_date", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Purchase Cost (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.purchase_cost}
                  onChange={(e) => handleInputChange("purchase_cost", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Warranty Expiry</label>
                <input
                  type="date"
                  value={formData.warranty_expiry}
                  onChange={(e) => handleInputChange("warranty_expiry", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-655 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Additional details..."
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none"
                />
              </div>

              {/* Action shortcuts */}
              <div className="sm:col-span-2 flex gap-3 pt-1">
                <button
                  onClick={generateQRCode}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl cursor-pointer"
                >
                  <QrCodeIcon className="w-4 h-4" />
                  Generate QR
                </button>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl cursor-pointer">
                  <CameraIcon className="w-4 h-4" />
                  Take Photo
                </button>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl cursor-pointer">
                  <ArrowUpTrayIcon className="w-4 h-4" />
                  Doc Upload
                </button>
              </div>

              {/* QR Code SVG */}
              {showQRCode && generatedAssetId && (
                <div className="sm:col-span-2 bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center space-y-3">
                  <p className="font-bold text-slate-900">Generated QR Code</p>
                  <div className="p-3 bg-white border border-slate-150 rounded-xl">
                    <QRCodeSVG
                      value={generatedAssetId}
                      size={140}
                      level="H"
                      includeMargin={true}
                      fgColor="#000000"
                      bgColor="#FFFFFF"
                      data-qr-code="true"
                    />
                  </div>
                  <p className="font-bold text-slate-700">Asset ID: {generatedAssetId}</p>
                  <button
                    onClick={downloadQRCode}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl cursor-pointer shadow-brand"
                  >
                    <ArrowDownTrayIcon className="w-4.5 h-4.5" />
                    Download QR Code
                  </button>
                </div>
              )}
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-sky-50 border border-sky-100 text-sky-850 rounded-xl flex items-start gap-2">
                <InformationCircleIcon className="w-4.5 h-4.5 text-sky-600 mt-0.5 flex-shrink-0" />
                <p>Please review the asset information before submitting.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400">Asset Name:</p>
                  <p className="font-bold text-slate-900 mt-0.5">{formData.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Category:</p>
                  <p className="font-bold text-slate-900 mt-0.5">{formData.category}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Manufacturer:</p>
                  <p className="font-bold text-slate-900 mt-0.5">{formData.manufacturer}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Model:</p>
                  <p className="font-bold text-slate-900 mt-0.5">{formData.model || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Location:</p>
                  <p className="font-bold text-slate-900 mt-0.5">{formData.location || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Purchase Value:</p>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {formData.purchase_cost ? `₹${parseFloat(formData.purchase_cost).toLocaleString('en-IN')}` : "N/A"}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-[11px] leading-relaxed">
                {generatedAssetId ? (
                  <p>Asset ID: <strong className="text-slate-900">{generatedAssetId}</strong> {showQRCode && "(QR code created)"}</p>
                ) : (
                  <p>Asset ID will be auto-generated: <strong className="text-slate-900">{generateAssetId()}</strong></p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0 bg-slate-50/50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-slate-205 text-slate-705 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          {activeStep > 0 && (
            <button
              onClick={handleBack}
              disabled={loading}
              className="px-4 py-2 border border-slate-205 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Back
            </button>
          )}
          {activeStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors cursor-pointer shadow-brand"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors cursor-pointer shadow-brand"
            >
              {loading && <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
              {loading ? "Adding Asset..." : "Add Asset"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddAssetModal;
