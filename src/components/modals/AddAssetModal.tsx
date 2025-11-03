import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  InputAdornment,
  Chip,
  IconButton,
  Alert,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import {
  Close as CloseIcon,
  QrCode as QrCodeIcon,
  Upload as UploadIcon,
  Camera as CameraIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { QRCodeSVG } from "qrcode.react";
import api from "../../services/api";

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
    purchase_value: "",
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

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

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

    // Find the QR code SVG element
    const qrSVG = document.querySelector("svg[data-qr-code]") as SVGElement;
    if (!qrSVG) {
      // Create a new QR code SVG for download
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
          <rect width="100%" height="100%" fill="white"/>
          <text x="100" y="100" text-anchor="middle" fill="black">QR: ${generatedAssetId}</text>
        </svg>
      `;

      const svgElement = tempDiv.querySelector("svg");
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `QR_${generatedAssetId}.svg`;
        link.click();

        URL.revokeObjectURL(url);
        toast.success("QR Code downloaded as SVG!");
      }
      return;
    }

    // Convert SVG to PNG
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const size = 300;
    canvas.width = size;
    canvas.height = size;

    if (ctx) {
      // Create image from SVG
      const svgData = new XMLSerializer().serializeToString(qrSVG);
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        // Clear canvas with white background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw QR code
        ctx.drawImage(img, 0, 0, size, size);

        // Download as PNG
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const downloadUrl = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = downloadUrl;
              link.download = `QR_${generatedAssetId}.png`;
              link.click();
              URL.revokeObjectURL(downloadUrl);
              toast.success("QR Code downloaded as PNG!");
            }
          },
          "image/png",
          1.0
        );

        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate basic information
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
      // Backend will auto-generate unique_asset_id if not provided
      const newAsset = {
        name: formData.name,
        manufacturer: formData.manufacturer,
        model: formData.model,
        serial_number: formData.serial_number,
        asset_type: formData.category,
        location: formData.location || "Not Assigned",
        department: "INVENTORY", // Will be set by backend based on user's role
        status: "Available",
        condition: "Excellent",
        purchase_date:
          formData.purchase_date || new Date().toISOString().split("T")[0],
        purchase_cost: parseFloat(formData.purchase_value) || 0,
        warranty_expiry: formData.warranty_expiry,
        notes: formData.description,
      };

      // Submit to API
      const response = await api.post("/assets", newAsset);
      const createdAsset = response.data.data || response.data;

      console.log("Asset created:", createdAsset);

      // Pass the created asset to parent component to show QR dialog
      onSubmit(createdAsset);

      toast.success(
        `Asset "${formData.name}" created successfully! QR Code ready.`
      );

      // Reset form
      setFormData({
        name: "",
        category: "",
        manufacturer: "",
        model: "",
        serial_number: "",
        location: "",
        assigned_user: "",
        purchase_date: "",
        purchase_value: "",
        warranty_expiry: "",
        description: "",
        tags: [],
      });
      setActiveStep(0);
      setGeneratedAssetId("");
      setShowQRCode(false);
      onClose();
    } catch (error: any) {
      console.error("Asset creation error:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Failed to add asset";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Asset Name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
                placeholder="e.g., Dell XPS 15 Laptop"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) =>
                    handleInputChange("category", e.target.value)
                  }
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Manufacturer"
                value={formData.manufacturer}
                onChange={(e) =>
                  handleInputChange("manufacturer", e.target.value)
                }
                required
                placeholder="e.g., Dell, HP, Apple"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Model"
                value={formData.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
                placeholder="e.g., XPS 15, LaserJet Pro"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Serial Number"
                value={formData.serial_number}
                onChange={(e) =>
                  handleInputChange("serial_number", e.target.value)
                }
                placeholder="e.g., DLL123456789"
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Location</InputLabel>
                <Select
                  value={formData.location}
                  label="Location"
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                >
                  {locations.map((location) => (
                    <MenuItem key={location} value={location}>
                      {location}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Assigned User"
                value={formData.assigned_user}
                onChange={(e) =>
                  handleInputChange("assigned_user", e.target.value)
                }
                placeholder="e.g., John Employee"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Purchase Date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) =>
                  handleInputChange("purchase_date", e.target.value)
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Purchase Value"
                type="number"
                value={formData.purchase_value}
                onChange={(e) =>
                  handleInputChange("purchase_value", e.target.value)
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₹</InputAdornment>
                  ),
                }}
                placeholder="0"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Warranty Expiry"
                type="date"
                value={formData.warranty_expiry}
                onChange={(e) =>
                  handleInputChange("warranty_expiry", e.target.value)
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Additional details about the asset..."
              />
            </Grid>
            <Grid item xs={12}>
              <Box>
                <TextField
                  fullWidth
                  label="Add Tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addTag()}
                  placeholder="Type and press Enter to add tags"
                />
                <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {formData.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => removeTag(tag)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Please review the asset information before submitting.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Asset Name:
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {formData.name}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Category:
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {formData.category}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Manufacturer:
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {formData.manufacturer}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Model:
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {formData.model || "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Location:
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {formData.location || "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Purchase Value:
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {formData.purchase_value
                    ? `₹${parseFloat(formData.purchase_value).toLocaleString()}`
                    : "N/A"}
                </Typography>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {generatedAssetId ? (
                  <>
                    Asset ID: <strong>{generatedAssetId}</strong>{" "}
                    {showQRCode && "(QR Code Generated)"}
                  </>
                ) : (
                  <>
                    Asset ID will be auto-generated:{" "}
                    <strong>{generateAssetId()}</strong>
                  </>
                )}
              </Typography>

              {/* Show QR Code preview in confirmation step */}
              {showQRCode && generatedAssetId && (
                <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                  <Box
                    sx={{
                      p: 1,
                      bgcolor: "white",
                      borderRadius: 1,
                      border: 1,
                      borderColor: "divider",
                    }}
                  >
                    <QRCodeSVG
                      value={generatedAssetId}
                      size={80}
                      level="H"
                      includeMargin={true}
                      fgColor="#000000"
                      bgColor="#FFFFFF"
                    />
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: "500px" },
      }}
    >
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">Add New Asset</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {renderStepContent(activeStep)}

        {activeStep === 1 && (
          <Box sx={{ mt: 3, display: "flex", gap: 2, flexDirection: "column" }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<QrCodeIcon />}
                onClick={generateQRCode}
                size="small"
              >
                Generate QR Code
              </Button>
              <Button
                variant="outlined"
                startIcon={<CameraIcon />}
                size="small"
              >
                Take Photo
              </Button>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                size="small"
              >
                Upload Document
              </Button>
            </Box>

            {/* QR Code Display */}
            {showQRCode && generatedAssetId && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  bgcolor: "grey.50",
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Generated QR Code
                </Typography>
                <Box sx={{ p: 2, bgcolor: "white", borderRadius: 1, mb: 2 }}>
                  <QRCodeSVG
                    value={generatedAssetId}
                    size={150}
                    level="H"
                    includeMargin={true}
                    fgColor="#000000"
                    bgColor="#FFFFFF"
                    data-qr-code="true"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Asset ID: <strong>{generatedAssetId}</strong>
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={downloadQRCode}
                  sx={{ mt: 1 }}
                >
                  Download QR Code
                </Button>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Back
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button onClick={handleNext} variant="contained" disabled={loading}>
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? "Adding Asset..." : "Add Asset"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AddAssetModal;
