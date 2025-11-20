import React, { useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Chip,
} from "@mui/material";
import { QRCodeCanvas } from "qrcode.react";

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
    purchase_cost:
      asset.purchase_cost,
    department: asset.department,
  };

  // Use only unique_asset_id for QR code - this is what the backend expects
  // The QR scanner will call: GET /api/v1/qr/scan/:qrCode with this value
  const qrValue = fullAssetData.unique_asset_id;

  if (!qrValue) {
    console.error("Asset does not have a unique_asset_id:", asset);
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <Typography color="error">
            Asset does not have a valid unique_asset_id. Cannot generate QR
            code.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  const downloadQr = () => {
    const canvas = containerRef.current?.querySelector("canvas") as
      | HTMLCanvasElement
      | undefined;
    if (canvas) {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error("Failed to create blob from canvas");
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Asset-${fullAssetData.unique_asset_id}-QR.png`;
        link.click();
        URL.revokeObjectURL(url);
        console.log("QR code downloaded:", fullAssetData.unique_asset_id);
      });
    } else {
      console.error("Canvas not found for QR code download");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6">✓ Asset Created Successfully!</Typography>
          <Chip label="QR Code Ready" color="success" size="small" />
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Asset Details
              </Typography>
              <Box
                sx={{
                  bgcolor: "grey.50",
                  p: 2,
                  borderRadius: 1,
                  border: 1,
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Asset ID:</strong>{" "}
                  <span style={{ color: "#1976d2", fontWeight: 600 }}>
                    {fullAssetData.unique_asset_id}
                  </span>
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Name:</strong> {fullAssetData.name}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Manufacturer:</strong> {fullAssetData.manufacturer}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Model:</strong> {fullAssetData.model}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Serial:</strong> {fullAssetData.serial_number}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Category:</strong> {fullAssetData.category}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Location:</strong> {fullAssetData.location}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong> {fullAssetData.status}
                </Typography>
              </Box>

              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: "info.lighter",
                  borderRadius: 1,
                  border: 1,
                  borderColor: "info.light",
                }}
              >
                <Typography
                  variant="caption"
                  color="info.dark"
                  fontWeight="bold"
                >
                  📱 How to Use This QR Code:
                </Typography>
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  1. Print or save this QR code
                  <br />
                  2. Attach it to the physical asset
                  <br />
                  3. Use "Scan Asset QR Code" to instantly view asset details
                  <br />
                  4. Backend API will fetch all information from the database
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Typography variant="subtitle1" fontWeight="bold">
                  Scannable QR Code
                </Typography>
                <Box
                  ref={containerRef}
                  sx={{
                    bgcolor: "white",
                    p: 3,
                    borderRadius: 2,
                    boxShadow: 3,
                    border: 2,
                    borderColor: "primary.main",
                  }}
                >
                  <QRCodeCanvas
                    value={qrValue}
                    size={260}
                    level="H"
                    includeMargin={true}
                    imageSettings={{
                      src: "",
                      excavate: true,
                      width: 40,
                      height: 40,
                    }}
                  />
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  align="center"
                >
                  Encoded Value: <strong>{qrValue}</strong>
                </Typography>
                <Button
                  variant="contained"
                  onClick={downloadQr}
                  fullWidth
                  size="large"
                >
                  Download QR Code
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssetQRCodeDialog;
