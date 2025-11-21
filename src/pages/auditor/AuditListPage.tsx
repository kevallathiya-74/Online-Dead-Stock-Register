import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  PendingActions as PendingIcon,
  FileDownload as FileDownloadIcon,
  FileUpload as FileUploadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import auditorService from '../../services/auditorService';
import type { AuditItem } from '../../types';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const AuditListPage: React.FC = () => {
  const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AuditItem | null>(null);
  const [editData, setEditData] = useState({
    condition: '',
    status: '',
    notes: '',
  });
  
  // CSV Import states
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [searchQuery, statusFilter, auditItems]);

  const fetchAuditItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await auditorService.getAuditItems();
      setAuditItems(data);
      setFilteredItems(data);
    } catch (err: any) {
      console.error('Error fetching audit items:', err);
      setError(err.response?.data?.message || 'Failed to load audit items');
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = auditItems;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.asset_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.asset_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.assigned_user.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    setFilteredItems(filtered);
  };

  const handleEditClick = (item: AuditItem) => {
    setSelectedItem(item);
    setEditData({
      condition: item.condition?.toLowerCase() || 'good',
      status: item.status?.toLowerCase() || 'pending',
      notes: item.notes || '',
    });
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setSelectedItem(null);
    setEditData({
      condition: '',
      status: '',
      notes: '',
    });
  };

  const handleEditSave = async () => {
    if (!selectedItem) return;

    try {
      // Map audit status to valid asset status
      let assetStatus = 'Available';
      switch (editData.status.toLowerCase()) {
        case 'verified':
          assetStatus = 'Active';
          break;
        case 'pending':
          assetStatus = 'Available';
          break;
        case 'discrepancy':
          assetStatus = 'Under Maintenance';
          break;
        case 'missing':
          assetStatus = 'Damaged';
          break;
        default:
          assetStatus = 'Available';
      }

      await auditorService.updateAuditStatus(selectedItem.id, {
        condition: editData.condition.toLowerCase(),
        status: assetStatus,
        notes: editData.notes,
        last_audit_date: new Date().toISOString(),
      });

      toast.success('Audit status updated successfully');
      handleEditClose();
      fetchAuditItems();
    } catch (err: any) {
      console.error('Error updating audit status:', err);
      toast.error(err.response?.data?.message || 'Failed to update audit status');
    }
  };

  const handleExport = async () => {
    try {
      // Handle CSV export (blob response)
      const blob = await auditorService.exportAuditReport('csv');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Audit report exported successfully as CSV');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export audit report');
    }
  };

  const handleImportClick = () => {
    setImportDialogOpen(true);
    setImportFile(null);
    setImportErrors([]);
    setImportSuccess(null);
  };

  const handleImportClose = () => {
    setImportDialogOpen(false);
    setImportFile(null);
    setImportErrors([]);
    setImportSuccess(null);
    setImportProgress(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    // Check file size (15MB limit)
    const maxSize = 15 * 1024 * 1024; // 15MB in bytes
    if (file.size > maxSize) {
      toast.error('File size exceeds 15MB limit');
      return;
    }

    setImportFile(file);
    setImportErrors([]);
    setImportSuccess(null);
  };

  const handleImportSubmit = async () => {
    if (!importFile) {
      toast.error('Please select a file to import');
      return;
    }

    setImportProgress(true);
    setImportErrors([]);
    setImportSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('format', 'csv');

      const result = await auditorService.importAuditData(formData);

      if (result.errors && result.errors.length > 0) {
        setImportErrors(result.errors);
        toast.warning(`Import completed with ${result.errors.length} errors`);
      } else {
        setImportSuccess(`Successfully imported ${result.imported || 0} records`);
        toast.success(`Successfully imported ${result.imported || 0} records`);
        
        // Refresh the audit list
        setTimeout(() => {
          fetchAuditItems();
          handleImportClose();
        }, 2000);
      }
    } catch (err: any) {
      console.error('Import error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to import data';
      setImportErrors([errorMsg]);
      toast.error(errorMsg);
    } finally {
      setImportProgress(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircleIcon color="success" fontSize="small" />;
      case 'pending':
        return <PendingIcon color="warning" fontSize="small" />;
      case 'discrepancy':
        return <WarningIcon color="error" fontSize="small" />;
      case 'missing':
        return <ErrorIcon color="error" fontSize="small" />;
      default:
        return null;
    }
  };

  const getStatusColor = (
    status: string
  ): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'verified':
        return 'success';
      case 'pending':
        return 'warning';
      case 'discrepancy':
        return 'error';
      case 'missing':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="80vh"
        >
          <CircularProgress size={60} />
        </Box>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              Audit List
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View and manage asset audits ({filteredItems.length} items)
            </Typography>
          </Box>
          <Box display="flex" gap={2} alignItems="center">
            <Button
              variant="outlined"
              startIcon={<FileUploadIcon />}
              onClick={handleImportClick}
              color="primary"
            >
              Import CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<FileDownloadIcon />}
              onClick={handleExport}
              color="primary"
            >
              Export CSV
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box display="flex" gap={2}>
            <TextField
              fullWidth
              placeholder="Search by Asset ID, Name, Location, or User..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="verified">Verified</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="discrepancy">Discrepancy</MenuItem>
                <MenuItem value="missing">Missing</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* Audit Items Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Asset ID</TableCell>
                <TableCell>Asset Name</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Assigned User</TableCell>
                <TableCell>Last Audit</TableCell>
                <TableCell>Condition</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary" py={4}>
                      No audit items found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {item.asset_id}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.asset_name}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>{item.assigned_user}</TableCell>
                    <TableCell>
                      {item.last_audit_date && item.last_audit_date !== '1970-01-01'
                        ? format(new Date(item.last_audit_date), 'MMM dd, yyyy')
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={item.condition ? item.condition.charAt(0).toUpperCase() + item.condition.slice(1).toLowerCase() : 'Unknown'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(item.status?.toLowerCase() || 'pending') || undefined}
                        label={item.status ? item.status.toUpperCase() : 'PENDING'}
                        color={getStatusColor(item.status?.toLowerCase() || 'pending')}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit Audit">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditClick(item)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
          <DialogTitle>Update Audit Status</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Asset ID"
                value={selectedItem?.asset_id || ''}
                disabled
                fullWidth
              />
              <TextField
                label="Asset Name"
                value={selectedItem?.asset_name || ''}
                disabled
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Condition</InputLabel>
                <Select
                  value={editData.condition}
                  label="Condition"
                  onChange={(e) => setEditData({ ...editData, condition: e.target.value })}
                >
                  <MenuItem value="excellent">Excellent</MenuItem>
                  <MenuItem value="good">Good</MenuItem>
                  <MenuItem value="fair">Fair</MenuItem>
                  <MenuItem value="poor">Poor</MenuItem>
                  <MenuItem value="damaged">Damaged</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editData.status}
                  label="Status"
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                >
                  <MenuItem value="verified">Verified</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="discrepancy">Discrepancy</MenuItem>
                  <MenuItem value="missing">Missing</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Notes"
                value={editData.notes}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditClose}>Cancel</Button>
            <Button onClick={handleEditSave} variant="contained" color="primary">
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* Import Data Dialog */}
        <Dialog open={importDialogOpen} onClose={handleImportClose} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Import Audit Data</Typography>
              <IconButton onClick={handleImportClose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* File Upload Area */}
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: importFile ? 'primary.main' : 'grey.300',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  backgroundColor: importFile ? 'primary.50' : 'grey.50',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'primary.50',
                  },
                }}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <FileUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {importFile ? importFile.name : 'Choose a CSV file or drag it here'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supports CSV files only (max 15MB)
                </Typography>
                {importFile && (
                  <Box mt={2}>
                    <Chip
                      label={`${(importFile.size / 1024).toFixed(2)} KB`}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                )}
              </Box>

              {/* Import Instructions */}
              <Alert severity="info">
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  CSV Import Instructions:
                </Typography>
                <Typography variant="body2" component="div">
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    <li>First row must contain column headers</li>
                    <li>Required columns: Asset ID, Asset Name, Location</li>
                    <li>Optional columns: Condition, Status, Notes, Assigned User</li>
                    <li>Date format: YYYY-MM-DD</li>
                    <li>Maximum file size: 15MB</li>
                  </ul>
                </Typography>
              </Alert>

              {/* Success Message */}
              {importSuccess && (
                <Alert severity="success">
                  <Typography variant="body2">{importSuccess}</Typography>
                </Alert>
              )}

              {/* Error Messages */}
              {importErrors.length > 0 && (
                <Alert severity="error">
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    Import Errors ({importErrors.length}):
                  </Typography>
                  <Box
                    sx={{
                      maxHeight: 200,
                      overflowY: 'auto',
                      mt: 1,
                    }}
                  >
                    {importErrors.map((error, index) => (
                      <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                        • {error}
                      </Typography>
                    ))}
                  </Box>
                </Alert>
              )}

              {/* Progress Indicator */}
              {importProgress && (
                <Box display="flex" alignItems="center" gap={2}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" color="text.secondary">
                    Importing data, please wait...
                  </Typography>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleImportClose} disabled={importProgress}>
              Cancel
            </Button>
            <Button
              onClick={handleImportSubmit}
              variant="contained"
              color="primary"
              disabled={!importFile || importProgress}
              startIcon={importProgress ? <CircularProgress size={20} /> : <FileUploadIcon />}
            >
              {importProgress ? 'Importing...' : 'Import'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </DashboardLayout>
  );
};

export default AuditListPage;
