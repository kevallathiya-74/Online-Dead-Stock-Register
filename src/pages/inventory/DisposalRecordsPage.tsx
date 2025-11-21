import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  FileDownload as ExportIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

interface DisposalRecord {
  id: string;
  asset_id: string;
  asset_name: string;
  category: string;
  disposal_date: string;
  disposal_method: string;
  disposal_value: number;
  approved_by: string;
  document_reference: string;
  status: string;
  remarks: string;
}

const DisposalRecordsPage: React.FC = () => {
  const [records, setRecords] = useState<DisposalRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [viewModalOpen, setViewModalOpen] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<DisposalRecord | null>(null);

  useEffect(() => {
    fetchDisposalRecords();
  }, []);

  const fetchDisposalRecords = async () => {
    try {
      setLoading(true);
      const response = await api.get('/inventory/disposal-records');

      if (response.data?.success && response.data?.data) {
        setRecords(response.data.data);
      } else {
        setRecords([]);
        toast.error('No disposal records found');
      }
    } catch (error) {
      console.error('Error fetching disposal records:', error);
      setRecords([]);
      toast.error('Failed to load disposal records');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter((record) =>
    searchTerm === '' ||
    record.asset_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.disposal_method?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.approved_by?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleExport = () => {
    toast.info('Export functionality will be implemented');
  };

  const handleViewDetails = (record: DisposalRecord) => {
    setSelectedRecord(record);
    setViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setViewModalOpen(false);
    setSelectedRecord(null);
  };

  const handleDownloadDocument = async (docRef: string, assetId: string) => {
    try {
      // Generate a disposal document/certificate
      const response = await api.get(`/inventory/disposal-records/${assetId}/document`, {
        responseType: 'blob'
      });
      
      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Disposal_${docRef}_${assetId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Document downloaded successfully');
    } catch (error: any) {
      console.error('Error downloading document:', error);
      // Fallback: Generate a simple text file with disposal details
      const record = records.find(r => r.document_reference === docRef);
      if (record) {
        const content = `DISPOSAL RECORD DOCUMENT\n\n` +
          `Document Reference: ${docRef}\n` +
          `Asset ID: ${record.asset_id}\n` +
          `Asset Name: ${record.asset_name}\n` +
          `Category: ${record.category}\n` +
          `Disposal Date: ${new Date(record.disposal_date).toLocaleDateString()}\n` +
          `Disposal Method: ${record.disposal_method}\n` +
          `Disposal Value: ₹${record.disposal_value}\n` +
          `Approved By: ${record.approved_by}\n` +
          `Status: ${record.status.toUpperCase()}\n` +
          `Remarks: ${record.remarks || 'N/A'}\n`;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Disposal_${docRef}_${record.asset_id}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success('Document downloaded as text file');
      } else {
        toast.error('Failed to download document');
      }
    }
  };

  const totalDisposalValue = filteredRecords.reduce((sum, record) => sum + (record.disposal_value || 0), 0);
  const completedDisposals = filteredRecords.filter(r => r.status === 'completed').length;

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Disposal Records
          </Typography>
        <Button
          variant="outlined"
          startIcon={<ExportIcon />}
          onClick={handleExport}
        >
          Export Report
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Disposal Records
              </Typography>
              <Typography variant="h4" component="div">
                {filteredRecords.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Disposal Value (₹)
              </Typography>
              <Typography variant="h4" component="div">
                ₹{Number(totalDisposalValue || 0).toLocaleString('en-IN')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Completed Disposals
              </Typography>
              <Typography variant="h4" component="div">
                {completedDisposals}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Search disposal records..."
            variant="outlined"
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="outlined" startIcon={<FilterIcon />}>
            Filters
          </Button>
        </Box>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Asset ID</strong></TableCell>
              <TableCell><strong>Asset Name</strong></TableCell>
              <TableCell><strong>Category</strong></TableCell>
              <TableCell><strong>Disposal Date</strong></TableCell>
              <TableCell><strong>Method</strong></TableCell>
              <TableCell><strong>Value (₹)</strong></TableCell>
              <TableCell><strong>Approved By</strong></TableCell>
              <TableCell><strong>Document Ref</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  No disposal records found
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((record) => (
                  <TableRow key={record.id || `${record.asset_id}-${record.document_reference}`} hover>
                    <TableCell>{record.asset_id}</TableCell>
                    <TableCell>{record.asset_name}</TableCell>
                    <TableCell>{record.category}</TableCell>
                    <TableCell>
                      {record.disposal_date
                        ? new Date(record.disposal_date).toLocaleDateString('en-IN')
                        : ''}
                    </TableCell>
                    <TableCell>{record.disposal_method}</TableCell>
                    <TableCell>₹{record.disposal_value?.toLocaleString('en-IN')}</TableCell>
                    <TableCell>{record.approved_by}</TableCell>
                    <TableCell>{record.document_reference}</TableCell>
                    <TableCell>
                      <Chip
                        label={record.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(record.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleViewDetails(record)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download Document">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleDownloadDocument(record.document_reference, record.asset_id)}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredRecords.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* View Details Modal */}
      <Dialog
        open={viewModalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" component="div" fontWeight="bold">
            Disposal Record Details
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedRecord && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" color="primary" gutterBottom>
                  Asset Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Asset ID
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {selectedRecord.asset_id}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Asset Name
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {selectedRecord.asset_name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {selectedRecord.category}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={selectedRecord.status.replace('_', ' ').toUpperCase()}
                  color={getStatusColor(selectedRecord.status)}
                  size="small"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
                  Disposal Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Disposal Date
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {new Date(selectedRecord.disposal_date).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Disposal Method
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {selectedRecord.disposal_method}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Disposal Value
                </Typography>
                <Typography variant="body1" fontWeight="medium" color="success.main">
                  ₹{selectedRecord.disposal_value?.toLocaleString('en-IN')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Approved By
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {selectedRecord.approved_by}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Document Reference
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {selectedRecord.document_reference}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Remarks
                </Typography>
                <Typography variant="body1">
                  {selectedRecord.remarks || 'No remarks available'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Close</Button>
          {selectedRecord && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={() => {
                handleDownloadDocument(selectedRecord.document_reference, selectedRecord.asset_id);
                handleCloseModal();
              }}
            >
              Download Document
            </Button>
          )}
        </DialogActions>
      </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default DisposalRecordsPage;
