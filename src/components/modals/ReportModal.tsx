import React, { useState } from 'react';
import api from '../../services/api';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Alert,
  FormControlLabel,
  Checkbox,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Close as CloseIcon,
  Assessment as ReportIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  InsertChart as ChartIcon,
  FilterList as FilterIcon,
  Schedule as ScheduleIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reportData: any) => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    report_type: '',
    date_range: 'last_30_days',
    custom_start_date: '',
    custom_end_date: '',
    format: 'pdf',
    include_charts: true,
    include_summary: true,
    filters: {
      locations: [] as string[],
      categories: [] as string[],
      status: [] as string[],
      users: [] as string[],
    },
    columns: [] as string[],
    title: '',
    description: '',
    schedule_delivery: false,
    email_recipients: '',
  });

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const reportTypes = [
    { value: 'asset_inventory', label: 'Asset Inventory Report', description: 'Complete list of all assets with details' },
    { value: 'maintenance_summary', label: 'Maintenance Summary', description: 'Maintenance activities and schedules' },
    { value: 'asset_utilization', label: 'Asset Utilization Report', description: 'Asset usage and efficiency metrics' },
    { value: 'depreciation_report', label: 'Depreciation Report', description: 'Asset depreciation calculations' },
    { value: 'audit_trail', label: 'Audit Trail Report', description: 'Complete audit history and changes' },
    { value: 'vendor_performance', label: 'Vendor Performance', description: 'Vendor ratings and performance metrics' },
    { value: 'cost_analysis', label: 'Cost Analysis Report', description: 'Asset costs and financial analysis' },
    { value: 'compliance_report', label: 'Compliance Report', description: 'Regulatory compliance status' },
  ];

  const dateRanges = [
    { value: 'today', label: 'Today' },
    { value: 'last_7_days', label: 'Last 7 Days' },
    { value: 'last_30_days', label: 'Last 30 Days' },
    { value: 'last_quarter', label: 'Last Quarter' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const formats = [
    { value: 'pdf', label: 'PDF', icon: <PdfIcon /> },
    { value: 'excel', label: 'Excel', icon: <ExcelIcon /> },
    { value: 'csv', label: 'CSV', icon: <ExcelIcon /> },
  ];

  const locations = [
    'IT Department - Floor 2',
    'Admin Office',
    'Sales Department',
    'HR Department',
    'Finance Department',
    'Warehouse',
    'Meeting Room A',
    'Meeting Room B',
  ];

  const categories = [
    'IT Equipment',
    'Office Equipment',
    'Mobile Device',
    'Furniture',
    'Machinery',
    'Vehicle',
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFilterChange = (filterType: string, values: string[]) => {
    setFormData(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [filterType]: values
      }
    }));
  };

  const generateReportTitle = () => {
    const reportTypeObj = reportTypes.find(rt => rt.value === formData.report_type);
    const dateRangeObj = dateRanges.find(dr => dr.value === formData.date_range);
    
    if (reportTypeObj && dateRangeObj) {
      return `${reportTypeObj.label} - ${dateRangeObj.label}`;
    }
    return '';
  };

  const handleSubmit = async () => {
    if (!formData.report_type) {
      toast.error('Please select a report type');
      return;
    }

    setGenerating(true);
    setProgress(0);

    try {
      // Call real API to generate report
      const response = await api.post('/reports/generate', {
        report_type: formData.report_type,
        date_range: formData.date_range,
        custom_start_date: formData.custom_start_date,
        custom_end_date: formData.custom_end_date,
        format: formData.format,
        title: formData.title || generateReportTitle(),
        include_charts: formData.include_charts,
        include_summary: formData.include_summary,
        filters: formData.filters
      });

      const reportData = response.data.data;
      onSubmit(reportData);
      
      toast.success(`Report "${reportData.title}" generated successfully!`);
      toast.info(`Downloading ${reportData.title}.${formData.format}...`);

      // Reset form
      setFormData({
        report_type: '',
        date_range: 'last_30_days',
        custom_start_date: '',
        custom_end_date: '',
        format: 'pdf',
        include_charts: true,
        include_summary: true,
        filters: {
          locations: [],
          categories: [],
          status: [],
          users: [],
        },
        columns: [],
        title: '',
        description: '',
        schedule_delivery: false,
        email_recipients: '',
      });
      setProgress(0);
      onClose();
    } catch (error) {
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const selectedReportType = reportTypes.find(rt => rt.value === formData.report_type);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReportIcon color="primary" />
            <Typography variant="h6">Generate Report</Typography>
          </Box>
          <IconButton onClick={onClose} size="small" disabled={generating}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Report Type Selection */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Report Type</Typography>
                <FormControl fullWidth required>
                  <InputLabel>Select Report Type</InputLabel>
                  <Select
                    value={formData.report_type}
                    label="Select Report Type"
                    onChange={(e) => handleInputChange('report_type', e.target.value)}
                    disabled={generating}
                  >
                    {reportTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box>
                          <Typography variant="subtitle2">{type.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {type.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {selectedReportType && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    {selectedReportType.description}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Date Range & Format */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Date Range & Format</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Date Range</InputLabel>
                      <Select
                        value={formData.date_range}
                        label="Date Range"
                        onChange={(e) => handleInputChange('date_range', e.target.value)}
                        disabled={generating}
                      >
                        {dateRanges.map((range) => (
                          <MenuItem key={range.value} value={range.value}>
                            {range.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {formData.date_range === 'custom' && (
                    <>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Start Date"
                          type="date"
                          value={formData.custom_start_date}
                          onChange={(e) => handleInputChange('custom_start_date', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          disabled={generating}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="End Date"
                          type="date"
                          value={formData.custom_end_date}
                          onChange={(e) => handleInputChange('custom_end_date', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          disabled={generating}
                        />
                      </Grid>
                    </>
                  )}

                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Output Format</InputLabel>
                      <Select
                        value={formData.format}
                        label="Output Format"
                        onChange={(e) => handleInputChange('format', e.target.value)}
                        disabled={generating}
                      >
                        {formats.map((format) => (
                          <MenuItem key={format.value} value={format.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {format.icon}
                              {format.label}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Filters */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FilterIcon />
                  Filters
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Locations</InputLabel>
                      <Select
                        multiple
                        value={formData.filters.locations}
                        onChange={(e) => handleFilterChange('locations', e.target.value as string[])}
                        disabled={generating}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(selected as string[]).map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        {locations.map((location) => (
                          <MenuItem key={location} value={location}>
                            {location}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Categories</InputLabel>
                      <Select
                        multiple
                        value={formData.filters.categories}
                        onChange={(e) => handleFilterChange('categories', e.target.value as string[])}
                        disabled={generating}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(selected as string[]).map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        {categories.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Report Options */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Report Options</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.include_charts}
                        onChange={(e) => handleInputChange('include_charts', e.target.checked)}
                        disabled={generating}
                      />
                    }
                    label="Include Charts & Graphs"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.include_summary}
                        onChange={(e) => handleInputChange('include_summary', e.target.checked)}
                        disabled={generating}
                      />
                    }
                    label="Include Executive Summary"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.schedule_delivery}
                        onChange={(e) => handleInputChange('schedule_delivery', e.target.checked)}
                        disabled={generating}
                      />
                    }
                    label="Schedule Email Delivery"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Custom Title & Description */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Report Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Report Title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder={generateReportTitle()}
                      disabled={generating}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Brief description of the report..."
                      disabled={generating}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Progress Bar */}
          {generating && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ChartIcon />
                    Generating Report...
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    sx={{ height: 8, borderRadius: 1, mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {Math.round(progress)}% Complete
                  </Typography>
                  
                  <List dense sx={{ mt: 2 }}>
                    <ListItem>
                      <ListItemIcon>
                        <ChartIcon color={progress > 20 ? 'success' : 'disabled'} />
                      </ListItemIcon>
                      <ListItemText primary="Processing data..." />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <FilterIcon color={progress > 50 ? 'success' : 'disabled'} />
                      </ListItemIcon>
                      <ListItemText primary="Applying filters..." />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ReportIcon color={progress > 80 ? 'success' : 'disabled'} />
                      </ListItemIcon>
                      <ListItemText primary="Generating report..." />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={generating}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={generating || !formData.report_type}
          startIcon={generating ? <ScheduleIcon /> : <DownloadIcon />}
        >
          {generating ? 'Generating...' : 'Generate Report'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportModal;