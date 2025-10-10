import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../../components/layout/Layout';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  Assignment as AuditIcon,
  QrCodeScanner as QrIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Inventory as InventoryIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  DateRange as DateIcon,
  Assessment as ReportIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import StatCard from '../../components/dashboard/StatCard';
import ChartComponent from '../../components/dashboard/ChartComponent';
import QRScanner from '../../components/common/QRScanner';

interface AuditItem {
  id: string;
  asset_id: string;
  asset_name: string;
  location: string;
  assigned_user: string;
  last_audit_date: string;
  status: 'pending' | 'verified' | 'discrepancy' | 'missing';
  condition: string;
  notes?: string;
}

interface Asset {
  id: string;
  unique_asset_id: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  status: string;
  location: string;
  assigned_user: string;
  last_audit_date: string;
  condition: string;
}

const AuditorDashboard = () => {
  const navigate = useNavigate();
  
  const [auditItems, setAuditItems] = useState<AuditItem[]>([
    {
      id: '1',
      asset_id: 'ASSET-001',
      asset_name: 'Dell XPS 15',
      location: 'IT Department - Floor 2',
      assigned_user: 'John Smith',
      last_audit_date: '2024-01-01',
      status: 'pending',
      condition: 'Good',
    },
    {
      id: '2',
      asset_id: 'ASSET-002',
      asset_name: 'MacBook Pro',
      location: 'Design Department - Floor 3',
      assigned_user: 'Sarah Johnson',
      last_audit_date: '2023-12-15',
      status: 'verified',
      condition: 'Excellent',
    },
    {
      id: '3',
      asset_id: 'ASSET-003',
      asset_name: 'HP Printer',
      location: 'Admin - Floor 1',
      assigned_user: 'Mike Wilson',
      last_audit_date: '2023-11-20',
      status: 'discrepancy',
      condition: 'Fair',
      notes: 'Location mismatch - found in different floor',
    },
  ]);

  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [auditForm, setAuditForm] = useState({
    condition: '',
    status: 'verified',
    notes: '',
    location_verified: true,
    user_verified: true,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock statistics
  const auditStats = {
    total_assigned: 156,
    completed: 89,
    pending: 52,
    discrepancies: 15,
    completion_rate: 57,
  };

  // Chart data for audit progress
  const auditProgressData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Audited Assets',
        data: [12, 19, 25, 32, 28, 35],
        backgroundColor: 'rgba(76, 175, 80, 0.6)',
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 2,
      },
      {
        label: 'Discrepancies Found',
        data: [2, 3, 1, 4, 2, 3],
        backgroundColor: 'rgba(255, 152, 0, 0.6)',
        borderColor: 'rgba(255, 152, 0, 1)',
        borderWidth: 2,
      },
    ],
  };

  // Condition distribution chart
  const conditionData = {
    labels: ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'],
    datasets: [
      {
        label: 'Asset Condition',
        data: [35, 45, 15, 3, 2],
        backgroundColor: [
          '#4CAF50',
          '#8BC34A',
          '#FF9800',
          '#FF5722',
          '#F44336',
        ],
      },
    ],
  };

  const handleQRScan = (asset: Asset) => {
    setSelectedAsset(asset);
    setAuditForm({
      condition: asset.condition,
      status: 'verified',
      notes: '',
      location_verified: true,
      user_verified: true,
    });
    setQrScannerOpen(false);
    setAuditDialogOpen(true);
  };

  const handleAuditSubmit = () => {
    if (!selectedAsset) return;

    // Update audit item
    const newAuditItem: AuditItem = {
      id: Date.now().toString(),
      asset_id: selectedAsset.unique_asset_id,
      asset_name: `${selectedAsset.manufacturer} ${selectedAsset.model}`,
      location: selectedAsset.location,
      assigned_user: selectedAsset.assigned_user,
      last_audit_date: new Date().toISOString().split('T')[0],
      status: auditForm.status as any,
      condition: auditForm.condition,
      notes: auditForm.notes,
    };

    setAuditItems(prev => [newAuditItem, ...prev.filter(item => item.asset_id !== selectedAsset.unique_asset_id)]);
    setAuditDialogOpen(false);
    setSelectedAsset(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'discrepancy': return 'error';
      case 'missing': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckIcon />;
      case 'pending': return <WarningIcon />;
      case 'discrepancy': return <ErrorIcon />;
      case 'missing': return <ErrorIcon />;
      default: return <InventoryIcon />;
    }
  };

  const filteredAuditItems = auditItems.filter(item => {
    const matchesSearch = item.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.asset_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.assigned_user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout title="Auditor Dashboard">
      <Box>
        <Typography variant="h4" gutterBottom>
          Auditor Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          Physical asset verification and audit management
      </Typography>

      {/* Quick Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<QrIcon />}
              onClick={() => setQrScannerOpen(true)}
              size="large"
            >
              Scan Asset QR Code
            </Button>
            <Button
              variant="outlined"
              startIcon={<ReportIcon />}
              size="large"
              onClick={() => {
                toast.success('Generating comprehensive audit report...');
                navigate('/reports');
              }}
            >
              Generate Audit Report
            </Button>
            <Button
              variant="outlined"
              startIcon={<DateIcon />}
              size="large"
              onClick={() => {
                toast.info('Opening audit scheduling interface...');
                // Navigate to audit scheduling page (when available)
                // navigate('/audit/schedule');
              }}
            >
              Schedule Audit
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Audit Statistics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Total Assigned"
            value={auditStats.total_assigned}
            icon={<AuditIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Completed"
            value={auditStats.completed}
            icon={<CheckIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Pending"
            value={auditStats.pending}
            icon={<WarningIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Discrepancies"
            value={auditStats.discrepancies}
            icon={<ErrorIcon />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Completion Rate
              </Typography>
              <Typography variant="h4" color="info.main" gutterBottom>
                {auditStats.completion_rate}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={auditStats.completion_rate} 
                color="info"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          <ChartComponent
            title="Audit Progress Over Time"
            type="line"
            data={auditProgressData}
            height={300}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <ChartComponent
            title="Asset Condition Distribution"
            type="doughnut"
            data={conditionData}
            height={300}
          />
        </Grid>
      </Grid>

      {/* Audit Items List */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Audit Items ({filteredAuditItems.length})
            </Typography>
            <Box display="flex" gap={2}>
              <TextField
                size="small"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="verified">Verified</MenuItem>
                  <MenuItem value="discrepancy">Discrepancy</MenuItem>
                  <MenuItem value="missing">Missing</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          <List>
            {filteredAuditItems.map((item, index) => (
              <Box key={item.id}>
                <ListItem>
                  <ListItemIcon>
                    {getStatusIcon(item.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1">
                          {item.asset_name}
                        </Typography>
                        <Chip
                          label={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          size="small"
                          color={getStatusColor(item.status) as any}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Box display="flex" alignItems="center" gap={2} mt={0.5}>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <InventoryIcon fontSize="small" />
                            <Typography variant="caption">
                              {item.asset_id}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <LocationIcon fontSize="small" />
                            <Typography variant="caption">
                              {item.location}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <PersonIcon fontSize="small" />
                            <Typography variant="caption">
                              {item.assigned_user}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <DateIcon fontSize="small" />
                            <Typography variant="caption">
                              Last audit: {new Date(item.last_audit_date).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                        {item.notes && (
                          <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                            Note: {item.notes}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => {
                      toast.info(`Starting audit for ${item.asset_name} (${item.asset_id})`);
                      // Open audit form or QR scanner for this specific asset
                      setQrScannerOpen(true);
                    }}
                  >
                    <QrIcon />
                  </IconButton>
                </ListItem>
                {index < filteredAuditItems.length - 1 && <Divider />}
              </Box>
            ))}
          </List>

          {filteredAuditItems.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                No audit items found matching your criteria
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* QR Scanner Dialog */}
      <QRScanner
        open={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
        onAssetFound={handleQRScan}
        mode="audit"
      />

      {/* Audit Form Dialog */}
      <Dialog
        open={auditDialogOpen}
        onClose={() => setAuditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Audit Asset: {selectedAsset?.unique_asset_id}
        </DialogTitle>
        <DialogContent>
          {selectedAsset && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Asset scanned successfully! Please verify the details and update the audit information.
              </Alert>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Asset Information
                  </Typography>
                  <Typography variant="body2">
                    <Box component="span" fontWeight="bold">ID:</Box> {selectedAsset.unique_asset_id}
                  </Typography>
                  <Typography variant="body2">
                    <Box component="span" fontWeight="bold">Device:</Box> {selectedAsset.manufacturer} {selectedAsset.model}
                  </Typography>
                  <Typography variant="body2">
                    <Box component="span" fontWeight="bold">Serial:</Box> {selectedAsset.serial_number}
                  </Typography>
                  <Typography variant="body2">
                    <Box component="span" fontWeight="bold">Location:</Box> {selectedAsset.location}
                  </Typography>
                  <Typography variant="body2">
                    <Box component="span" fontWeight="bold">Assigned To:</Box> {selectedAsset.assigned_user}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Audit Information
                  </Typography>
                  
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Condition</InputLabel>
                    <Select
                      value={auditForm.condition}
                      onChange={(e) => setAuditForm(prev => ({ ...prev, condition: e.target.value }))}
                      label="Condition"
                    >
                      <MenuItem value="Excellent">Excellent</MenuItem>
                      <MenuItem value="Good">Good</MenuItem>
                      <MenuItem value="Fair">Fair</MenuItem>
                      <MenuItem value="Poor">Poor</MenuItem>
                      <MenuItem value="Damaged">Damaged</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth margin="normal">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={auditForm.status}
                      onChange={(e) => setAuditForm(prev => ({ ...prev, status: e.target.value }))}
                      label="Status"
                    >
                      <MenuItem value="verified">Verified</MenuItem>
                      <MenuItem value="discrepancy">Discrepancy Found</MenuItem>
                      <MenuItem value="missing">Asset Missing</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={3}
                    value={auditForm.notes}
                    onChange={(e) => setAuditForm(prev => ({ ...prev, notes: e.target.value }))}
                    margin="normal"
                    placeholder="Add any observations or discrepancies..."
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAuditDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAuditSubmit}
            disabled={!auditForm.condition}
          >
            Submit Audit
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Layout>
  );
};

export default AuditorDashboard;