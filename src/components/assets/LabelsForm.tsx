import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Chip,
  Switch,
  FormGroup,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  QrCode as QrCodeIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon,
  Computer as AssetIcon,
  Label as LabelIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';

interface LabelsFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (labelData: any) => void;
}

const LabelsForm: React.FC<LabelsFormProps> = ({ open, onClose, onSubmit }) => {
  const [labelOptions, setLabelOptions] = useState({
    labelType: 'qr_code',
    paperSize: 'A4',
    labelSize: 'medium',
    includeAssetId: true,
    includeAssetName: true,
    includeLocation: false,
    includeQRCode: true,
    includeCompanyLogo: true,
    columns: 3,
    rows: 10,
  });

  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // Load real assets from API
  useEffect(() => {
    if (open) {
      loadAssets();
    }
  }, [open]);

  const loadAssets = async () => {
    try {
      setLoadingAssets(true);
      const response = await api.get('/assets', { params: { limit: 100 } });
      const assets = response.data.data?.data || response.data.data || [];
      setAvailableAssets(assets.map((asset: any) => ({
        id: asset._id || asset.id,
        unique_asset_id: asset.unique_asset_id,
        name: asset.name || `${asset.manufacturer} ${asset.model}`,
        location: asset.location,
        manufacturer: asset.manufacturer,
        model: asset.model,
      })));
    } catch (error) {
      console.error('Failed to load assets:', error);
      toast.error('Failed to load assets');
      setAvailableAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  };

  const labelTypes = [
    { value: 'qr_code', label: 'QR Code Labels' },
    { value: 'barcode', label: 'Barcode Labels' },
    { value: 'text_only', label: 'Text Only Labels' },
    { value: 'custom', label: 'Custom Labels' },
  ];

  const paperSizes = [
    { value: 'A4', label: 'A4 (210 x 297 mm)' },
    { value: 'Letter', label: 'Letter (8.5 x 11 in)' },
    { value: 'Label_Sheet', label: 'Label Sheet' },
  ];

  const labelSizes = [
    { value: 'small', label: 'Small (25 x 15 mm)', dimensions: '25x15mm' },
    { value: 'medium', label: 'Medium (40 x 25 mm)', dimensions: '40x25mm' },
    { value: 'large', label: 'Large (60 x 40 mm)', dimensions: '60x40mm' },
    { value: 'custom', label: 'Custom Size', dimensions: 'Custom' },
  ];

  const handleOptionChange = (field: string, value: any) => {
    setLabelOptions(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAssetSelection = (assetId: string) => {
    setSelectedAssets(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const selectAllAssets = () => {
    setSelectedAssets(availableAssets.map(asset => asset.id));
  };

  const clearAllAssets = () => {
    setSelectedAssets([]);
  };

  const generateLabels = () => {
    if (selectedAssets.length === 0) {
      toast.error('Please select at least one asset');
      return;
    }

    const labelData = {
      assets: selectedAssets,
      options: labelOptions,
      generatedAt: new Date().toISOString(),
      labelCount: selectedAssets.length,
    };

    onSubmit(labelData);
    toast.success(`Generated ${selectedAssets.length} labels successfully!`);
    onClose();
  };

  const previewLabels = () => {
    if (selectedAssets.length === 0) {
      toast.error('Please select at least one asset to preview');
      return;
    }
    setPreviewMode(true);
    toast.info('Label preview will be implemented in next update');
  };

  const downloadTemplate = () => {
    toast.info('Label template download will be implemented in next update');
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '700px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <LabelIcon color="primary" />
            <Typography variant="h6">Generate Asset Labels</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Label Configuration */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Label Configuration
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Label Type</InputLabel>
                      <Select
                        value={labelOptions.labelType}
                        onChange={(e) => handleOptionChange('labelType', e.target.value)}
                        label="Label Type"
                      >
                        {labelTypes.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Paper Size</InputLabel>
                      <Select
                        value={labelOptions.paperSize}
                        onChange={(e) => handleOptionChange('paperSize', e.target.value)}
                        label="Paper Size"
                      >
                        {paperSizes.map((size) => (
                          <MenuItem key={size.value} value={size.value}>
                            {size.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Label Size</InputLabel>
                      <Select
                        value={labelOptions.labelSize}
                        onChange={(e) => handleOptionChange('labelSize', e.target.value)}
                        label="Label Size"
                      >
                        {labelSizes.map((size) => (
                          <MenuItem key={size.value} value={size.value}>
                            <Box>
                              <Typography variant="body2">{size.label}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {size.dimensions}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Columns"
                      value={labelOptions.columns}
                      onChange={(e) => handleOptionChange('columns', parseInt(e.target.value))}
                      inputProps={{ min: 1, max: 6 }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Rows"
                      value={labelOptions.rows}
                      onChange={(e) => handleOptionChange('rows', parseInt(e.target.value))}
                      inputProps={{ min: 1, max: 20 }}
                    />
                  </Grid>
                </Grid>

                <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
                  Label Content
                </Typography>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={labelOptions.includeAssetId}
                        onChange={(e) => handleOptionChange('includeAssetId', e.target.checked)}
                      />
                    }
                    label="Asset ID"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={labelOptions.includeAssetName}
                        onChange={(e) => handleOptionChange('includeAssetName', e.target.checked)}
                      />
                    }
                    label="Asset Name"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={labelOptions.includeLocation}
                        onChange={(e) => handleOptionChange('includeLocation', e.target.checked)}
                      />
                    }
                    label="Location"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={labelOptions.includeQRCode}
                        onChange={(e) => handleOptionChange('includeQRCode', e.target.checked)}
                      />
                    }
                    label="QR Code"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={labelOptions.includeCompanyLogo}
                        onChange={(e) => handleOptionChange('includeCompanyLogo', e.target.checked)}
                      />
                    }
                    label="Company Logo"
                  />
                </FormGroup>
              </CardContent>
            </Card>
          </Grid>

          {/* Asset Selection */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" color="primary">
                    Select Assets ({selectedAssets.length})
                  </Typography>
                  <Box>
                    <Button size="small" onClick={selectAllAssets} sx={{ mr: 1 }}>
                      Select All
                    </Button>
                    <Button size="small" onClick={clearAllAssets}>
                      Clear All
                    </Button>
                  </Box>
                </Box>

                <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {availableAssets.map((asset) => (
                    <ListItem
                      key={asset.id}
                      button
                      onClick={() => handleAssetSelection(asset.id)}
                      sx={{
                        border: 1,
                        borderColor: selectedAssets.includes(asset.id) ? 'primary.main' : 'divider',
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: selectedAssets.includes(asset.id) ? 'action.selected' : 'transparent',
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: selectedAssets.includes(asset.id) ? 'primary.main' : 'grey.400' }}>
                          <AssetIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2">{asset.name}</Typography>
                            {selectedAssets.includes(asset.id) && (
                              <Chip label="Selected" size="small" color="primary" />
                            )}
                          </Box>
                        }
                        secondary={`${asset.unique_asset_id} • ${asset.location}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Preview Section */}
          {selectedAssets.length > 0 && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Label Preview
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Grid container spacing={1}>
                      {selectedAssets.slice(0, 6).map((assetId) => {
                        const asset = availableAssets.find(a => a.id === assetId);
                        return asset ? (
                          <Grid item xs={12} sm={6} md={4} key={assetId}>
                            <Paper 
                              variant="outlined" 
                              sx={{ 
                                p: 1, 
                                textAlign: 'center', 
                                minHeight: 80,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                bgcolor: 'white'
                              }}
                            >
                              {labelOptions.includeQRCode && (
                                <QrCodeIcon sx={{ fontSize: 24, mx: 'auto', mb: 0.5 }} />
                              )}
                              {labelOptions.includeAssetId && (
                                <Typography variant="caption" fontWeight="bold">
                                  {asset.unique_asset_id}
                                </Typography>
                              )}
                              {labelOptions.includeAssetName && (
                                <Typography variant="caption">
                                  {asset.name}
                                </Typography>
                              )}
                              {labelOptions.includeLocation && (
                                <Typography variant="caption" color="text.secondary">
                                  {asset.location}
                                </Typography>
                              )}
                            </Paper>
                          </Grid>
                        ) : null;
                      })}
                    </Grid>
                    {selectedAssets.length > 6 && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                        ... and {selectedAssets.length - 6} more labels
                      </Typography>
                    )}
                  </Paper>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button 
          onClick={downloadTemplate} 
          variant="outlined" 
          startIcon={<DownloadIcon />}
          sx={{ mr: 1 }}
        >
          Download Template
        </Button>
        <Button 
          onClick={previewLabels} 
          variant="outlined" 
          startIcon={<PreviewIcon />}
          disabled={selectedAssets.length === 0}
          sx={{ mr: 1 }}
        >
          Preview
        </Button>
        <Button 
          onClick={generateLabels} 
          variant="contained" 
          color="primary"
          startIcon={<PrintIcon />}
          disabled={selectedAssets.length === 0}
        >
          Generate Labels
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LabelsForm;