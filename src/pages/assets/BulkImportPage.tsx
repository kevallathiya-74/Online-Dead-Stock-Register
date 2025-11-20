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
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          toast.error('File appears to be empty or has no data rows');
          return;
        }

        // Parse headers - handle both quoted and unquoted CSV
        const headerLine = lines[0];
        const headers = headerLine.split(',').map(h => 
          h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/\s+/g, '_')
        );
        
        // Check required fields
        const requiredFields = ['name', 'unique_asset_id', 'asset_type'];
        const missingFields = requiredFields.filter(field => !headers.includes(field));
        
        if (missingFields.length > 0) {
          toast.error(`Missing required columns: ${missingFields.join(', ')}`);
          return;
        }
        
        const preview: any[] = [];
        const maxPreview = Math.min(6, lines.length);
        
        for (let i = 1; i < maxPreview; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Simple CSV parsing (handles basic quoted values)
          const values: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (let char of line) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim());
          
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index]?.replace(/^"|"$/g, '') || '';
          });
          
          // Validate this row
          const errors: string[] = [];
          if (!row.name) errors.push('name');
          if (!row.unique_asset_id) errors.push('unique_asset_id');
          if (!row.asset_type) errors.push('asset_type');
          
          const status = errors.length === 0 
            ? 'Valid' 
            : `Missing: ${errors.join(', ')}`;
          
          preview.push({
            name: row.name,
            unique_asset_id: row.unique_asset_id,
            asset_type: row.asset_type,
            manufacturer: row.manufacturer || '-',
            model: row.model || '-',
            status
          });
        }
        
        setPreviewData(preview);
        const validRows = preview.filter(p => p.status === 'Valid').length;
        toast.success(`File "${file.name}" loaded successfully (${validRows}/${preview.length} rows valid in preview)`);
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

      const result = response.data.data || response.data;
      setImportResult({
        success: result.success || result.successCount || 0,
        failed: result.failed || result.failedCount || 0,
        errors: result.errors || []
      });
      setActiveStep(3);
      
      const successCount = result.success || result.successCount || 0;
      if (successCount > 0) {
        toast.success(`Import completed: ${successCount} assets imported successfully`);
      } else {
        toast.warning('Import completed but no assets were created');
      }
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
                    <li><strong>name</strong> - Asset name</li>
                    <li><strong>unique_asset_id</strong> - Unique asset identifier</li>
                    <li><strong>asset_type</strong> - Asset type/category</li>
                    <li>category - Sub-category (optional)</li>
                    <li>manufacturer - Manufacturer name (optional)</li>
                    <li>model - Model name/number (optional)</li>
                    <li>serial_number - Serial number (optional)</li>
                    <li>purchase_date - Date in YYYY-MM-DD format (optional)</li>
                    <li>purchase_cost - Purchase cost in ₹ (optional)</li>
                    <li>warranty_expiry - Warranty expiry date (optional)</li>
                    <li>status - Available, Active, Under Maintenance, etc. (optional)</li>
                    <li>condition - Excellent, Good, Fair, Poor, Damaged (optional)</li>
                    <li>location - Physical location (optional)</li>
                    <li>department - Department name (optional)</li>
                    <li>description - Asset description (optional)</li>
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
                          <TableCell>Name</TableCell>
                          <TableCell>Asset ID</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Manufacturer</TableCell>
                          <TableCell>Model</TableCell>
                          <TableCell>Validation</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {previewData.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>{row.name || '-'}</TableCell>
                            <TableCell>{row.unique_asset_id || '-'}</TableCell>
                            <TableCell>{row.asset_type || '-'}</TableCell>
                            <TableCell>{row.manufacturer || '-'}</TableCell>
                            <TableCell>{row.model || '-'}</TableCell>
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
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        {importResult.errors.length} row(s) failed to import. Please review the errors below and correct your data.
                      </Alert>
                      <Typography variant="subtitle1" gutterBottom>
                        Import Errors:
                      </Typography>
                      <TableContainer component={Paper} elevation={0} sx={{ mb: 3, maxHeight: 400, overflow: 'auto' }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Row #</TableCell>
                              <TableCell>Error Message</TableCell>
                              <TableCell>Asset ID</TableCell>
                              <TableCell>Name</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {importResult.errors.map((error, index) => (
                              <TableRow key={index}>
                                <TableCell>{error.row}</TableCell>
                                <TableCell>
                                  <Typography variant="body2" color="error">
                                    {error.error}
                                  </Typography>
                                </TableCell>
                                <TableCell>{error.data?.unique_asset_id || '-'}</TableCell>
                                <TableCell>{error.data?.name || '-'}</TableCell>
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
