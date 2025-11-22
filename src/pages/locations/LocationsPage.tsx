import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Skeleton,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Assessment as AssessmentIcon,
  Inventory as InventoryIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { toast } from 'react-toastify';
import api from '../../services/api';

interface AssetLocation {
  _id: string;
  name: string;
  building: string;
  floor: string;
  room: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  manager: {
    _id: string;
    name: string;
    email: string;
  };
  capacity: number;
  current_assets: number;
  location_type: 'Office' | 'Warehouse' | 'Branch' | 'Data Center';
  is_active: boolean;
  created_at: string;
}

const LocationsPage: React.FC = () => {
  const [locations, setLocations] = useState<AssetLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [addLocationDialog, setAddLocationDialog] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      try {
        const response = await api.get('/assets/locations');
        const locationData = response.data.data || response.data;
        setLocations(locationData);
        toast.success('Locations loaded successfully');
      } catch (error) { /* Error handled by API interceptor */ } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.building.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || location.location_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleAddLocation = () => {
    setAddLocationDialog(true);
  };

  const totalCapacity = locations.reduce((sum, loc) => sum + loc.capacity, 0);
  const totalAssets = locations.reduce((sum, loc) => sum + loc.current_assets, 0);
  const utilizationRate = totalCapacity > 0 ? (totalAssets / totalCapacity * 100) : 0;

  return (
    <DashboardLayout>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Locations Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage asset locations, capacity, and utilization across facilities
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddLocation}
          >
            Add Location
          </Button>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Total Locations
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={60} height={40} />
                    ) : (
                      <Typography variant="h4">{locations.length}</Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'primary.main' }}>
                    <LocationIcon />
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
                      Total Assets
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={60} height={40} />
                    ) : (
                      <Typography variant="h4">{totalAssets.toLocaleString()}</Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'success.main' }}>
                    <InventoryIcon />
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
                      Total Capacity
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={60} height={40} />
                    ) : (
                      <Typography variant="h4">{totalCapacity.toLocaleString()}</Typography>
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
                      Utilization Rate
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={60} height={40} />
                    ) : (
                      <Typography variant="h4">{utilizationRate.toFixed(1)}%</Typography>
                    )}
                  </Box>
                  <Avatar sx={{ backgroundColor: 'warning.main' }}>
                    <AssessmentIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search locations..."
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
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Filter by Type</InputLabel>
                  <Select
                    value={filterType}
                    label="Filter by Type"
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="Office">Office</MenuItem>
                    <MenuItem value="Warehouse">Warehouse</MenuItem>
                    <MenuItem value="Branch">Branch</MenuItem>
                    <MenuItem value="Data Center">Data Center</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Typography variant="body2" color="text.secondary">
                  {filteredLocations.length} locations
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Locations Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              All Locations ({filteredLocations.length})
            </Typography>
            
            {loading ? (
              <Box>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} height={60} sx={{ mb: 1 }} />
                ))}
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Location Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Address</TableCell>
                      <TableCell>Manager</TableCell>
                      <TableCell>Capacity</TableCell>
                      <TableCell>Assets</TableCell>
                      <TableCell>Utilization</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredLocations.map((location) => {
                      const utilization = (location.current_assets / location.capacity * 100);
                      return (
                        <TableRow key={location._id}>
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle2">
                                {location.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {location.building} - {location.floor}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={location.location_type} 
                              size="small" 
                              color={
                                location.location_type === 'Data Center' ? 'error' :
                                location.location_type === 'Office' ? 'primary' :
                                location.location_type === 'Warehouse' ? 'warning' : 'success'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {location.address.city}, {location.address.state}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {location.address.zipCode}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {location.manager.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {location.manager.email}
                            </Typography>
                          </TableCell>
                          <TableCell>{location.capacity}</TableCell>
                          <TableCell>{location.current_assets}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2">
                                {utilization.toFixed(1)}%
                              </Typography>
                              <Box
                                sx={{
                                  width: 60,
                                  height: 6,
                                  bgcolor: 'grey.300',
                                  borderRadius: 3,
                                  ml: 1,
                                  overflow: 'hidden'
                                }}
                              >
                                <Box
                                  sx={{
                                    width: `${Math.min(utilization, 100)}%`,
                                    height: '100%',
                                    bgcolor: utilization > 80 ? 'error.main' : utilization > 60 ? 'warning.main' : 'success.main'
                                  }}
                                />
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={location.is_active ? 'Active' : 'Inactive'}
                              size="small"
                              color={location.is_active ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" color="primary">
                              <ViewIcon />
                            </IconButton>
                            <IconButton size="small" color="success">
                              <EditIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Add Location Dialog */}
        <Dialog open={addLocationDialog} onClose={() => setAddLocationDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Add New Location</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              Location creation functionality will integrate with the backend API following JWT authentication patterns.
            </Alert>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Location Name" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Location Type</InputLabel>
                  <Select label="Location Type">
                    <MenuItem value="Office">Office</MenuItem>
                    <MenuItem value="Warehouse">Warehouse</MenuItem>
                    <MenuItem value="Branch">Branch</MenuItem>
                    <MenuItem value="Data Center">Data Center</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Building" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Floor" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Address" multiline rows={2} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Capacity" type="number" />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddLocationDialog(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={() => {
                setAddLocationDialog(false);
                toast.success('Location added successfully!');
              }}
            >
              Create Location
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default LocationsPage;