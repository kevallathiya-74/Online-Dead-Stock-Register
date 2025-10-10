import React, { useState, useEffect } from 'react';
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
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  LinearProgress,
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
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as OrdersIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { toast } from 'react-toastify';

interface Vendor {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  specialization: string[];
  rating: number;
  total_orders: number;
  total_value: number;
  payment_terms: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  registration_date: string;
  last_order_date: string;
  performance_score: number;
}

const VendorsPage = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  console.log('Selected vendor for menu:', selectedVendor?.name); // Use to avoid warning
  const [addVendorOpen, setAddVendorOpen] = useState(false);

  // Generate dynamic vendor data
  const generateVendorData = (): Vendor[] => {
    const vendorNames = [
      'TechCorp Solutions Pvt Ltd',
      'Office Plus Supplies',
      'Global IT Hardware',
      'Premium Furniture Co.',
      'Industrial Equipment Ltd',
      'Digital Solutions Inc',
      'Smart Systems International',
      'Advanced Technology Partners',
      'Quality Office Solutions',
      'Modern Equipment Suppliers',
      'Elite Business Systems',
      'Professional IT Services',
      'Superior Hardware Co.',
      'Innovative Tech Solutions',
      'Corporate Supply Chain',
    ];

    const specializations = [
      ['IT Equipment', 'Computers', 'Networking'],
      ['Office Supplies', 'Stationery', 'Furniture'],
      ['Hardware', 'Components', 'Accessories'],
      ['Furniture', 'Ergonomic', 'Office Design'],
      ['Industrial', 'Machinery', 'Tools'],
      ['Software', 'Licenses', 'Support'],
      ['Smart Devices', 'IoT', 'Automation'],
      ['Networking', 'Security', 'Infrastructure'],
      ['Office Management', 'Supplies', 'Services'],
      ['Equipment', 'Maintenance', 'Support'],
    ];

    const paymentTerms = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'COD', '2/10 Net 30'];
    const statuses: ('Active' | 'Inactive' | 'Suspended')[] = ['Active', 'Active', 'Active', 'Inactive', 'Suspended'];

    return vendorNames.map((name, index) => ({
      id: `VND-${(index + 1).toString().padStart(3, '0')}`,
      name,
      contact_person: ['Rajesh Kumar', 'Priya Singh', 'Amit Sharma', 'Neha Patel', 'Vikram Joshi'][index % 5],
      email: `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      address: `${Math.floor(Math.random() * 999) + 1}, Business District, ${['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune'][index % 5]}`,
      specialization: specializations[index % specializations.length],
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0 to 5.0
      total_orders: Math.floor(Math.random() * 100) + 10,
      total_value: Math.floor(Math.random() * 5000000) + 500000, // 5L to 50L
      payment_terms: paymentTerms[index % paymentTerms.length],
      status: statuses[index % statuses.length],
      registration_date: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
      last_order_date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
      performance_score: Math.floor(Math.random() * 30) + 70, // 70-100
    }));
  };

  useEffect(() => {
    const loadVendors = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        const vendorData = generateVendorData();
        setVendors(vendorData);
      } catch (error) {
        toast.error('Failed to load vendors');
      } finally {
        setLoading(false);
      }
    };

    loadVendors();
  }, []);

  const specializations = Array.from(new Set(vendors.flatMap(v => v.specialization)));

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch = 
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecialization = selectedSpecialization === 'all' || 
      vendor.specialization.some(spec => spec.includes(selectedSpecialization));
    
    const matchesStatus = selectedStatus === 'all' || vendor.status === selectedStatus;
    
    return matchesSearch && matchesSpecialization && matchesStatus;
  });

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, vendor: Vendor) => {
    setAnchorEl(event.currentTarget);
    setSelectedVendor(vendor);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedVendor(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Inactive':
        return 'default';
      case 'Suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 80) return 'warning';
    return 'error';
  };

  const stats = {
    totalVendors: vendors.length,
    activeVendors: vendors.filter(v => v.status === 'Active').length,
    totalValue: vendors.reduce((sum, vendor) => sum + vendor.total_value, 0),
    avgRating: vendors.length > 0 ? vendors.reduce((sum, vendor) => sum + vendor.rating, 0) / vendors.length : 0,
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
            onClick={() => setAddVendorOpen(true)}
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
                    <TrendingUpIcon />
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
                      Total Value
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={80} height={40} />
                    ) : (
                      <Typography variant="h4">₹{(stats.totalValue / 10000000).toFixed(1)}Cr</Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'info.main' }}>
                    <MoneyIcon />
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
                      Avg Rating
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={60} height={40} />
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h4">{stats.avgRating.toFixed(1)}</Typography>
                        <StarIcon color="warning" />
                      </Box>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'warning.main' }}>
                    <StarIcon />
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
                  <InputLabel>Specialization</InputLabel>
                  <Select
                    value={selectedSpecialization}
                    label="Specialization"
                    onChange={(e) => setSelectedSpecialization(e.target.value)}
                  >
                    <MenuItem value="all">All Specializations</MenuItem>
                    {specializations.map((spec) => (
                      <MenuItem key={spec} value={spec}>
                        {spec}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
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
                    <MenuItem value="Suspended">Suspended</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
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
                    <TableCell>Vendor</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Specialization</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Orders</TableCell>
                    <TableCell>Total Value</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Performance</TableCell>
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
                          <Skeleton variant="text" width={100} />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width={80} />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width={60} />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width={80} />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="rectangular" width={70} height={24} />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width={60} />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width={100} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    filteredVendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                              <BusinessIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                                {vendor.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {vendor.id}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <EmailIcon sx={{ fontSize: 16, mr: 0.5 }} />
                              {vendor.email}
                            </Typography>
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                              <PhoneIcon sx={{ fontSize: 16, mr: 0.5 }} />
                              {vendor.phone}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {vendor.specialization.slice(0, 2).map((spec, index) => (
                              <Chip key={index} label={spec} size="small" variant="outlined" />
                            ))}
                            {vendor.specialization.length > 2 && (
                              <Chip label={`+${vendor.specialization.length - 2}`} size="small" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Rating value={vendor.rating} precision={0.1} size="small" readOnly />
                            <Typography variant="body2">({vendor.rating})</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <OrdersIcon sx={{ fontSize: 16 }} />
                            <Typography variant="body2">{vendor.total_orders}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>₹{(vendor.total_value / 100000).toFixed(1)}L</TableCell>
                        <TableCell>
                          <Chip
                            label={vendor.status}
                            color={getStatusColor(vendor.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={vendor.performance_score}
                              color={getPerformanceColor(vendor.performance_score) as any}
                              sx={{ width: 60, height: 6, borderRadius: 1 }}
                            />
                            <Typography variant="body2" color={`${getPerformanceColor(vendor.performance_score)}.main`}>
                              {vendor.performance_score}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" color="primary">
                            <ViewIcon />
                          </IconButton>
                          <IconButton size="small" color="success">
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={(e) => handleMenuClick(e, vendor)}
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
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <ReportsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Generate Report</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <EmailIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Send Email</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Remove Vendor</ListItemText>
          </MenuItem>
        </Menu>

        {/* Add Vendor Dialog */}
        <Dialog open={addVendorOpen} onClose={() => setAddVendorOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Add New Vendor</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Vendor registration form would be implemented here with full vendor details.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddVendorOpen(false)}>Cancel</Button>
            <Button variant="contained">Add Vendor</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default VendorsPage;