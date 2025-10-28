import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; error: string; data: any }[];
}

const BulkImportPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const steps = ['Download Template', 'Upload File', 'Review & Import', 'Complete'];

  const handleDownloadTemplate = async (format: 'csv' | 'xlsx') => {
    try {
      const response = await api.get(`/bulk-operations/template?format=${format}`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `asset-import-template.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Template downloaded successfully (${format.toUpperCase()})`);
      setActiveStep(1);
    } catch (error: any) {
      console.error('Failed to download template:', error);
      toast.error('Failed to download template');
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      try {
        // Parse and preview the file
        const text = await file.text();
        const rows = text.split('\n');
        const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        const preview: any[] = [];
        for (let i = 1; i < Math.min(6, rows.length); i++) {
          if (rows[i].trim()) {
            const values = rows[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            
            // Validate required fields
            const status = (!row.name || !row.unique_asset_id || !row.asset_type) 
              ? 'Missing required fields' 
              : 'Valid';
            
            preview.push({
              name: row.name || row.asset_name,
              unique_asset_id: row.unique_asset_id || row.asset_id,
              asset_type: row.asset_type || row.type,
              status
            });
          }
        }
        
        setPreviewData(preview);
        toast.success(`File "${file.name}" loaded successfully (${preview.length} rows preview)`);
        setActiveStep(2);
      } catch (error) {
        console.error('Error parsing file:', error);
        toast.error('Failed to parse file. Please ensure it is a valid CSV format.');
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to import');
      return;
    }

    try {
      setImporting(true);
      
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Call bulk import API
      const response = await api.post('/bulk-operations/import-assets', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImportResult(response.data);
      setActiveStep(3);
      
      toast.success(`Import completed: ${response.data.success} assets imported successfully`);
    } catch (error: any) {
      console.error('Import failed:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Import failed';
      toast.error(errorMsg);
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedFile(null);
    setPreviewData([]);
    setImportResult(null);
  };

  return (
    <DashboardLayout>
      <Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Bulk Asset Import
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Import multiple assets at once using CSV or Excel files
          </Typography>
        </Box>

        {/* Stepper */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Grid container spacing={3}>
          {/* Step 0: Download Template */}
          {activeStep === 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Step 1: Download Template
                  </Typography>
                  <Divider sx={{ mb: 3 }} />

                  <Alert severity="info" sx={{ mb: 3 }}>
                    Download the template file and fill in your asset data. Make sure to follow the format exactly.
                  </Alert>

                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Required columns:
                  </Typography>
                  <Box component="ul" sx={{ mb: 3 }}>
                    <li>Asset Name</li>
                    <li>Unique Asset ID</li>
                    <li>Asset Type</li>
                    <li>Manufacturer</li>
                    <li>Model</li>
                    <li>Serial Number</li>
                    <li>Purchase Date</li>
                    <li>Purchase Value</li>
                    <li>Status</li>
                    <li>Location</li>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownloadTemplate('csv')}
                    >
                      Download CSV Template
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownloadTemplate('xlsx')}
                    >
                      Download Excel Template
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Step 1: Upload File */}
          {activeStep === 1 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Step 2: Upload File
                  </Typography>
                  <Divider sx={{ mb: 3 }} />

                  <Box
                    sx={{
                      border: '2px dashed',
                      borderColor: 'grey.300',
                      borderRadius: 2,
                      p: 4,
                      textAlign: 'center',
                      mb: 3,
                    }}
                  >
                    <UploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                    <Typography variant="body1" gutterBottom>
                      Drag and drop your file here or click to browse
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Supported formats: CSV, Excel (.xlsx, .xls)
                    </Typography>
                    <input
                      accept=".csv,.xlsx,.xls"
                      style={{ display: 'none' }}
                      id="upload-file"
                      type="file"
                      onChange={handleFileSelect}
                    />
                    <label htmlFor="upload-file">
                      <Button variant="contained" component="span">
                        Choose File
                      </Button>
                    </label>
                  </Box>

                  {selectedFile && (
                    <Alert severity="success">
                      File selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Step 2: Review & Import */}
          {activeStep === 2 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Step 3: Review & Import
                  </Typography>
                  <Divider sx={{ mb: 3 }} />

                  <Alert severity="warning" sx={{ mb: 3 }}>
                    Please review the data below before importing. Assets with errors will be skipped.
                  </Alert>

                  <TableContainer component={Paper} elevation={0} sx={{ mb: 3 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Asset Name</TableCell>
                          <TableCell>Asset ID</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {previewData.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>{row.name}</TableCell>
                            <TableCell>{row.unique_asset_id || '-'}</TableCell>
                            <TableCell>{row.asset_type}</TableCell>
                            <TableCell>
                              <Chip
                                label={row.status}
                                color={row.status === 'Valid' ? 'success' : 'error'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleImport}
                      disabled={importing}
                    >
                      {importing ? 'Importing...' : 'Import Assets'}
                    </Button>
                    <Button variant="outlined" onClick={handleReset}>
                      Cancel
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Step 3: Complete */}
          {activeStep === 3 && importResult && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Import Complete
                  </Typography>
                  <Divider sx={{ mb: 3 }} />

                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SuccessIcon />
                          <Box>
                            <Typography variant="h4">{importResult.success}</Typography>
                            <Typography variant="body2">Successful</Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ErrorIcon />
                          <Box>
                            <Typography variant="h4">{importResult.failed}</Typography>
                            <Typography variant="body2">Failed</Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <WarningIcon />
                          <Box>
                            <Typography variant="h4">
                              {importResult.success + importResult.failed}
                            </Typography>
                            <Typography variant="body2">Total Processed</Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>

                  {importResult.errors.length > 0 && (
                    <>
                      <Typography variant="subtitle1" gutterBottom>
                        Errors:
                      </Typography>
                      <TableContainer component={Paper} elevation={0} sx={{ mb: 3 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Row</TableCell>
                              <TableCell>Error</TableCell>
                              <TableCell>Data</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {importResult.errors.map((error, index) => (
                              <TableRow key={index}>
                                <TableCell>{error.row}</TableCell>
                                <TableCell>{error.error}</TableCell>
                                <TableCell>{JSON.stringify(error.data)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  )}

                  <Button variant="contained" onClick={handleReset}>
                    Import More Assets
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>
    </DashboardLayout>
  );
};

export default BulkImportPage;
