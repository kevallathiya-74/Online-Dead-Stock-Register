import React, { useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Grid } from '@mui/material';
import { QRCodeCanvas } from 'qrcode.react';

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
    unique_asset_id: asset.unique_asset_id || asset.uniqueAssetId || asset.uniqueAssetId || asset.unique_asset_id,
    name: asset.name || `${asset.manufacturer || ''} ${asset.model || ''}`.trim(),
    manufacturer: asset.manufacturer,
    model: asset.model,
    serial_number: asset.serial_number,
    category: asset.asset_type || asset.category,
    location: asset.location,
    status: asset.status,
    condition: asset.condition,
    purchase_date: asset.purchase_date,
    purchase_value: asset.purchase_cost || asset.purchase_value || asset.purchasePrice,
    department: asset.department,
  };

  // Use only unique_asset_id for QR code - this is what the backend expects
  const qrValue = fullAssetData.unique_asset_id;

  const downloadQr = () => {
    const canvas = containerRef.current?.querySelector('canvas') as HTMLCanvasElement | undefined;
    if (canvas) {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fullAssetData.unique_asset_id || fullAssetData.id}-qr.png`;
        link.click();
        URL.revokeObjectURL(url);
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Asset Created - QR Code</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Asset Details</Typography>
              <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                <Typography variant="body2"><strong>Asset ID:</strong> {fullAssetData.unique_asset_id}</Typography>
                <Typography variant="body2"><strong>Name:</strong> {fullAssetData.name}</Typography>
                <Typography variant="body2"><strong>Manufacturer:</strong> {fullAssetData.manufacturer}</Typography>
                <Typography variant="body2"><strong>Model:</strong> {fullAssetData.model}</Typography>
                <Typography variant="body2"><strong>Serial:</strong> {fullAssetData.serial_number}</Typography>
                <Typography variant="body2"><strong>Category:</strong> {fullAssetData.category}</Typography>
                <Typography variant="body2"><strong>Location:</strong> {fullAssetData.location}</Typography>
                <Typography variant="body2"><strong>Status:</strong> {fullAssetData.status}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Typography variant="subtitle1">QR Code</Typography>
                <Box ref={containerRef} sx={{ bgcolor: 'white', p: 2, borderRadius: 1, boxShadow: 2 }}>
                  <QRCodeCanvas value={qrValue} size={260} level="H" includeMargin={true} />
                </Box>
                <Button variant="contained" onClick={downloadQr}>Download QR Code</Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssetQRCodeDialog;
