import React, { useState, useEffect } from 'react';
import { usePolling } from '../../hooks/usePolling';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Assessment as ReportsIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import VendorFormDialog from './VendorFormDialog';
import { toast } from 'react-toastify';
import api from '../../services/api';

interface Vendor {
  _id: string;
  vendor_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  };
  payment_terms?: string;
  is_active: boolean;
  created_at: string;
}

const VendorsPage = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const loadVendors = async () => {
    setLoading(true);
    try {
      const response = await api.get('/vendors');
      const vendorData = response.data.data || response.data;
      setVendors(Array.isArray(vendorData) ? vendorData : []);
    } catch (error) {
      console.error('Failed to load vendors:', error);
      toast.error('Failed to load vendors');
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  // Real-time polling every 30 seconds
  usePolling(loadVendors, {
    interval: 30000,
    enabled: true
  });

  useEffect(() => {
    loadVendors();
  }, []);

  const handleAddVendor = async (formData: any) => {
    try {
      const response = await api.post('/vendors', formData);
      const newVendor = response.data?.data || response.data;
      setVendors((prev) => [...prev, newVendor]);
      toast.success('Vendor added successfully');
      setFormDialogOpen(false);
    } catch (error: any) {
      console.error('Failed to add vendor:', error);
      toast.error(error.response?.data?.message || 'Failed to add vendor');
      throw error;
    }
  };

  const handleUpdateVendor = async (formData: any) => {
    if (!selectedVendor) return;
    
    try {
      const response = await api.put(`/vendors/${selectedVendor._id}`, formData);
      const updatedVendor = response.data?.data || response.data;
      setVendors((prev) =>
        prev.map((v) => (v._id === selectedVendor._id ? updatedVendor : v))
      );
      toast.success('Vendor updated successfully');
      setFormDialogOpen(false);
      setSelectedVendor(null);
    } catch (error: any) {
      console.error('Failed to update vendor:', error);
      toast.error(error.response?.data?.message || 'Failed to update vendor');
      throw error;
    }
  };

  const handleDeleteVendor = async () => {
    if (!selectedVendor) return;

    try {
      await api.delete(`/vendors/${selectedVendor._id}`);
      setVendors((prev) => prev.filter((v) => v._id !== selectedVendor._id));
      toast.success('Vendor deleted successfully');
      setDeleteConfirmOpen(false);
      setSelectedVendor(null);
    } catch (error: any) {
      console.error('Failed to delete vendor:', error);
      toast.error(error.response?.data?.message || 'Failed to delete vendor');
    }
  };

  const openAddDialog = () => {
    setSelectedVendor(null);
    setIsEditMode(false);
    setFormDialogOpen(true);
  };

  const openEditDialog = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsEditMode(true);
    setFormDialogOpen(true);
    setAnchorEl(null); // Close menu but keep selectedVendor
  };

  const openDeleteConfirm = () => {
    setDeleteConfirmOpen(true);
    setAnchorEl(null); // Close menu but keep selectedVendor
  };

  const handleGenerateReport = () => {
    if (!selectedVendor) return;
    
    // Create a simple vendor report
    const reportContent = `
VENDOR REPORT
=============

Vendor Information:
------------------
Name: ${selectedVendor.vendor_name}
Contact Person: ${selectedVendor.contact_person || 'N/A'}
Email: ${selectedVendor.email || 'N/A'}
Phone: ${selectedVendor.phone || 'N/A'}

Address:
--------
${selectedVendor.address?.street || 'N/A'}
${selectedVendor.address?.city || ''} ${selectedVendor.address?.state || ''} ${selectedVendor.address?.zip_code || ''}
${selectedVendor.address?.country || ''}

Business Details:
----------------
Payment Terms: ${selectedVendor.payment_terms || 'N/A'}
Status: ${selectedVendor.is_active ? 'Active' : 'Inactive'}
Vendor ID: ${selectedVendor._id}
Created: ${selectedVendor.created_at ? new Date(selectedVendor.created_at).toLocaleDateString() : 'N/A'}

Generated on: ${new Date().toLocaleString()}
    `.trim();

    // Create and download the report as a text file
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vendor-report-${selectedVendor.vendor_name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success(`Report generated for ${selectedVendor.vendor_name}`);
    handleMenuClose();
  };

  const handleSendEmail = () => {
    if (!selectedVendor) return;
    
    // Create email template
    const subject = encodeURIComponent(`Regarding: ${selectedVendor.vendor_name}`);
    const body = encodeURIComponent(`Dear ${selectedVendor.contact_person || selectedVendor.vendor_name},\n\n\n\nBest regards,\nOnline Dead Stock Register Team`);
    const email = selectedVendor.email;
    
    if (!email) {
      toast.error('No email address found for this vendor');
      return;
    }
    
    // Open default email client with pre-filled template
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    
    toast.success(`Opening email to ${selectedVendor.vendor_name}`);
    handleMenuClose();
  };

  const filteredVendors = vendors.filter((vendor) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      vendor.vendor_name?.toLowerCase().includes(searchLower) ||
      vendor.contact_person?.toLowerCase().includes(searchLower) ||
      vendor.email?.toLowerCase().includes(searchLower) ||
      vendor._id?.toLowerCase().includes(searchLower);
    
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'Active' && vendor.is_active) ||
      (selectedStatus === 'Inactive' && !vendor.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const handleViewVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setViewDialogOpen(true);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, vendor: Vendor) => {
    setAnchorEl(event.currentTarget);
    setSelectedVendor(vendor);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedVendor(null);
  };

  const stats = {
    totalVendors: vendors.length,
    activeVendors: vendors.filter(v => v.is_active).length,
    inactiveVendors: vendors.filter(v => !v.is_active).length,
  };

  return (
    <DashboardLayout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Vendor Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage suppliers, vendors, and business partners
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAddDialog}
          >
            Add New Vendor
          </Button>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Total Vendors
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={60} height={40} />
                    ) : (
                      <Typography variant="h4">{stats.totalVendors}</Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'primary.main' }}>
                    <BusinessIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Active Vendors
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={60} height={40} />
                    ) : (
                      <Typography variant="h4">{stats.activeVendors}</Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'success.main' }}>
                    <BusinessIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Inactive Vendors
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={80} height={40} />
                    ) : (
                      <Typography variant="h4">{stats.inactiveVendors}</Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'info.main' }}>
                    <BusinessIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Registration Date
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={60} height={40} />
                    ) : (
                      <Typography variant="body2">
                        {vendors.length > 0 ? new Date(vendors[0].created_at).toLocaleDateString() : 'N/A'}
                      </Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'warning.main' }}>
                    <BusinessIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search vendors by name, contact, email, or ID..."
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
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={selectedStatus}
                    label="Status"
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={5}>
                <Typography variant="body2" color="text.secondary">
                  Showing {filteredVendors.length} of {vendors.length} vendors
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Vendors Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Vendor Directory ({filteredVendors.length})
            </Typography>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Vendor Name</TableCell>
                    <TableCell>Contact Person</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Payment Terms</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    [1, 2, 3, 4, 5].map((item) => (
                      <TableRow key={item}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                            <Box>
                              <Skeleton variant="text" width={150} />
                              <Skeleton variant="text" width={100} />
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width={120} />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width={180} />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width={120} />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width={100} />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="rectangular" width={70} height={24} />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width={100} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredVendors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                          No vendors found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVendors.map((vendor) => (
                      <TableRow key={vendor._id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                              <BusinessIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                                {vendor.vendor_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {vendor._id.slice(-8)}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {vendor.contact_person || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                            <EmailIcon sx={{ fontSize: 16, mr: 0.5 }} />
                            {vendor.email || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                            <PhoneIcon sx={{ fontSize: 16, mr: 0.5 }} />
                            {vendor.phone || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {vendor.payment_terms || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={vendor.is_active ? 'Active' : 'Inactive'}
                            color={vendor.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleViewVendor(vendor)}
                            title="View Vendor Details"
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="success"
                            onClick={() => openEditDialog(vendor)}
                            title="Edit Vendor"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={(e) => handleMenuClick(e, vendor)}
                            title="More Actions"
                          >
                            <MoreIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleGenerateReport}>
            <ListItemIcon>
              <ReportsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Generate Report</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleSendEmail}>
            <ListItemIcon>
              <EmailIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Send Email</ListItemText>
          </MenuItem>
          <MenuItem onClick={openDeleteConfirm} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete Vendor</ListItemText>
          </MenuItem>
        </Menu>

        {/* View Vendor Details Dialog */}
        <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h5">Vendor Details</Typography>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {selectedVendor && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Basic Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Vendor ID</Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {selectedVendor._id?.slice(-8) || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Vendor Name</Typography>
                          <Typography variant="body1" fontWeight="bold">{selectedVendor.vendor_name}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Contact Person</Typography>
                          <Typography variant="body1">{selectedVendor.contact_person || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Status</Typography>
                          <Chip 
                            label={selectedVendor.is_active ? 'Active' : 'Inactive'}
                            color={selectedVendor.is_active ? 'success' : 'default'}
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Contact Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Email</Typography>
                          <Typography variant="body1">{selectedVendor.email || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Phone</Typography>
                          <Typography variant="body1">{selectedVendor.phone || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">Address</Typography>
                          <Typography variant="body1">
                            {selectedVendor.address ? (
                              <>
                                {selectedVendor.address.street && `${selectedVendor.address.street}, `}
                                {selectedVendor.address.city && `${selectedVendor.address.city}, `}
                                {selectedVendor.address.state && `${selectedVendor.address.state} `}
                                {selectedVendor.address.zip_code && `${selectedVendor.address.zip_code}, `}
                                {selectedVendor.address.country}
                              </>
                            ) : 'N/A'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Business Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">Payment Terms</Typography>
                          <Typography variant="body1">{selectedVendor.payment_terms || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">Registration Date</Typography>
                          <Typography variant="body1">
                            {selectedVendor.created_at ? new Date(selectedVendor.created_at).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : 'N/A'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)} variant="outlined">
              Close
            </Button>
            <Button 
              variant="contained"
              startIcon={<EmailIcon />}
              onClick={() => {
                if (selectedVendor) {
                  window.location.href = `mailto:${selectedVendor.email}`;
                }
              }}
            >
              Send Email
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add/Edit Vendor Dialog */}
        <VendorFormDialog
          open={formDialogOpen}
          onClose={() => {
            setFormDialogOpen(false);
            setSelectedVendor(null);
            setIsEditMode(false);
          }}
          onSubmit={isEditMode ? handleUpdateVendor : handleAddVendor}
          initialData={selectedVendor ? {
            vendor_name: selectedVendor.vendor_name,
            contact_person: selectedVendor.contact_person || '',
            email: selectedVendor.email || '',
            phone: selectedVendor.phone || '',
            address: {
              street: selectedVendor.address?.street || '',
              city: selectedVendor.address?.city || '',
              state: selectedVendor.address?.state || '',
              zip_code: selectedVendor.address?.zip_code || '',
              country: selectedVendor.address?.country || ''
            },
            payment_terms: selectedVendor.payment_terms || '',
            is_active: selectedVendor.is_active
          } : undefined}
          isEdit={isEditMode}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => {
            setDeleteConfirmOpen(false);
            setSelectedVendor(null);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete vendor{' '}
              <strong>{selectedVendor?.vendor_name}</strong>? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setDeleteConfirmOpen(false);
              setSelectedVendor(null);
            }}>Cancel</Button>
            <Button
              onClick={handleDeleteVendor}
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default VendorsPage;