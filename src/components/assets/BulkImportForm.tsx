import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  Upload as UploadIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Download as DownloadIcon,
  Description as FileIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';

interface BulkImportFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (importData: any[]) => void;
}

const BulkImportForm: React.FC<BulkImportFormProps> = ({ open, onClose, onSubmit }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<any[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');

  const acceptedFormats = ['.csv', '.xlsx', '.xls'];
  
  const sampleData = [
    {
      field: 'name',
      description: 'Asset Name',
      required: true,
      example: 'Dell XPS 15 Laptop'
    },
    {
      field: 'category',
      description: 'Asset Category',
      required: true,
      example: 'IT Equipment'
    },
    {
      field: 'manufacturer',
      description: 'Manufacturer',
      required: true,
      example: 'Dell'
    },
    {
      field: 'model',
      description: 'Model',
      required: false,
      example: 'XPS 15'
    },
    {
      field: 'serial_number',
      description: 'Serial Number',
      required: false,
      example: 'DLL123456789'
    },
    {
      field: 'location',
      description: 'Location',
      required: false,
      example: 'IT Department - Floor 2'
    },
    {
      field: 'assigned_user',
      description: 'Assigned User',
      required: false,
      example: 'John Employee'
    },
    {
      field: 'purchase_date',
      description: 'Purchase Date',
      required: false,
      example: '2023-06-15'
    },
    {
      field: 'purchase_cost',
      description: 'Purchase Cost',
      required: false,
      example: '85000'
    },
    {
      field: 'warranty_expiry',
      description: 'Warranty Expiry',
      required: false,
      example: '2025-06-15'
    },
    {
      field: 'condition',
      description: 'Condition',
      required: false,
      example: 'Good'
    },
    {
      field: 'status',
      description: 'Status',
      required: false,
      example: 'Active'
    },
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (acceptedFormats.includes(fileExtension)) {
        setSelectedFile(file);
        setImportStatus('idle');
        setImportResults([]);
      } else {
        toast.error('Please select a valid CSV or Excel file');
        event.target.value = '';
      }
    }
  };

  const performImport = async () => {
    setImporting(true);
    setImportStatus('processing');
    setImportProgress(0);

    try {
      // Upload file to backend
      const formData = new FormData();
      formData.append('file', selectedFile!);

      const response = await api.post('/assets/bulk-import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setImportProgress(progress);
        },
      });

      const results = response.data.data?.results || response.data.results || [];
      setImportResults(results);
      setImporting(false);
      setImportStatus('completed');

      const successCount = results.filter((r: any) => r.status === 'success').length;
      const errorCount = results.filter((r: any) => r.status === 'error').length;
      const warningCount = results.filter((r: any) => r.status === 'warning').length;

      toast.success(`Import completed: ${successCount} successful, ${warningCount} warnings, ${errorCount} errors`);
    } catch (error) {
      console.error('Import failed:', error);
      setImporting(false);
      setImportStatus('error');
      toast.error('Failed to import assets');
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      toast.error('Please select a file to import');
      return;
    }

    performImport();
  };

  const downloadTemplate = () => {
    const csvContent = [
      sampleData.map(field => field.field).join(','),
      sampleData.map(field => field.example).join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'asset_import_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Template downloaded successfully');
  };

  const resetForm = () => {
    setSelectedFile(null);
    setImportStatus('idle');
    setImportResults([]);
    setImportProgress(0);
    setImporting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '700px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <CloudUploadIcon color="primary" />
            <Typography variant="h6">Bulk Asset Import</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Instructions */}
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Upload a CSV or Excel file to import multiple assets at once. Download the template to ensure proper formatting.
            </Alert>
          </Grid>

          {/* Template Download */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  1. Download Template
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Get the proper format for your import file
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={downloadTemplate}
                  fullWidth
                >
                  Download CSV Template
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* File Upload */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  2. Upload File
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Select your prepared CSV or Excel file
                </Typography>
                <input
                  type="file"
                  accept={acceptedFormats.join(',')}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button
                    component="span"
                    variant="contained"
                    startIcon={<UploadIcon />}
                    fullWidth
                    disabled={importing}
                  >
                    Choose File
                  </Button>
                </label>
                {selectedFile && (
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FileIcon fontSize="small" />
                    <Typography variant="body2">
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Field Mapping */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Field Mapping Reference
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Field Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Required</TableCell>
                    <TableCell>Example</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sampleData.map((field) => (
                    <TableRow key={field.field}>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {field.field}
                        </Typography>
                      </TableCell>
                      <TableCell>{field.description}</TableCell>
                      <TableCell>
                        <Chip 
                          label={field.required ? 'Required' : 'Optional'} 
                          size="small" 
                          color={field.required ? 'error' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {field.example}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Import Progress */}
          {importing && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Import Progress
                  </Typography>
                  <LinearProgress variant="determinate" value={importProgress} sx={{ mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Processing... {importProgress}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Import Results */}
          {importStatus === 'completed' && importResults.length > 0 && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Import Results
                  </Typography>
                  <List dense>
                    {importResults.map((result, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          {result.status === 'success' ? (
                            <SuccessIcon color="success" />
                          ) : result.status === 'warning' ? (
                            <ErrorIcon color="warning" />
                          ) : (
                            <ErrorIcon color="error" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2">
                                Row {result.row}: {result.message}
                              </Typography>
                              {result.assetId && (
                                <Chip label={result.assetId} size="small" variant="outlined" />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        {importStatus !== 'completed' ? (
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={!selectedFile || importing}
            startIcon={importing ? undefined : <CloudUploadIcon />}
          >
            {importing ? 'Processing...' : 'Start Import'}
          </Button>
        ) : (
          <Button onClick={resetForm} variant="outlined">
            Import Another File
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BulkImportForm;