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

  const handleDownloadDocument = (docRef: string) => {
    toast.info(`Download document: ${docRef}`);
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
                ₹{(totalDisposalValue / 100000).toFixed(2)}L
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
                        <IconButton size="small" color="primary">
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download Document">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleDownloadDocument(record.document_reference)}
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
      </Box>
    </DashboardLayout>
  );
};

export default DisposalRecordsPage;
