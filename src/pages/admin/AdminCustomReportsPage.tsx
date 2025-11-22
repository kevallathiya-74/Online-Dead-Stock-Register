import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  Chip,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import {
  Preview as PreviewIcon,
  Save as SaveIcon,
  DataObject as DataIcon,
  TableChart as TableIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Filter as FilterIcon,
  CheckCircle as CheckIcon,
  ArrowBack as BackIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { toast } from 'react-toastify';
import api from '../../services/api';

interface DataSource {
  id: string;
  name: string;
  type: string;
  tables: string[];
  description: string;
}

interface ReportField {
  id: string;
  name: string;
  type: string;
  source: string;
  selected: boolean;
}

interface Filter {
  id: string;
  field: string;
  operator: string;
  value: string;
}

const steps = ['Data Source', 'Fields & Filters', 'Visualization', 'Schedule & Recipients'];

const AdminCustomReportsPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [selectedDataSource, setSelectedDataSource] = useState('');
  const [reportType, setReportType] = useState('table');
  const [availableFields, setAvailableFields] = useState<ReportField[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [schedule, setSchedule] = useState('manual');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [previewDialog, setPreviewDialog] = useState(false);

  const dataSources: DataSource[] = [
    {
      id: 'assets',
      name: 'Assets Database',
      type: 'SQL',
      tables: ['assets', 'asset_categories', 'asset_locations', 'asset_assignments'],
      description: 'Complete asset management data including categories, locations, and assignments'
    },
    {
      id: 'users',
      name: 'Users & Permissions',
      type: 'SQL',
      tables: ['users', 'roles', 'permissions', 'user_sessions'],
      description: 'User management data including roles, permissions, and activity logs'
    },
    {
      id: 'transactions',
      name: 'Financial Transactions',
      type: 'SQL',
      tables: ['transactions', 'purchases', 'vendors', 'invoices'],
      description: 'Financial data including purchases, vendor information, and transaction history'
    },
    {
      id: 'analytics',
      name: 'Analytics & Metrics',
      type: 'NoSQL',
      tables: ['usage_metrics', 'performance_data', 'audit_logs'],
      description: 'System analytics, performance metrics, and comprehensive audit trails'
    }
  ];

  useEffect(() => {
    loadSavedReports();
  }, []);

  useEffect(() => {
    if (selectedDataSource) {
      loadAvailableFields();
    }
  }, [selectedDataSource]);

  const loadSavedReports = async () => {
    try {
      const response = await api.get('/reports/templates');
      if (response.data.success) {
        const reports = response.data.data.map((template: any) => ({
          id: template._id,
          name: template.name,
          type: template.type?.toLowerCase() || 'table',
          created: template.lastGenerated || template.createdAt || new Date().toISOString()
        }));
        setSavedReports(reports);
      }
    } catch (error) {
      toast.error('Failed to load saved reports');
      setSavedReports([]);
    }
  };

  const loadAvailableFields = () => {
    // Generate fields based on selected data source
    let fields: ReportField[] = [];
    
    if (selectedDataSource === 'assets') {
      fields = [
        { id: '1', name: 'unique_asset_id', type: 'string', source: 'assets', selected: false },
        { id: '2', name: 'name', type: 'string', source: 'assets', selected: false },
        { id: '3', name: 'asset_type', type: 'string', source: 'assets', selected: false },
        { id: '4', name: 'location', type: 'string', source: 'assets', selected: false },
        { id: '5', name: 'status', type: 'string', source: 'assets', selected: false },
        { id: '6', name: 'purchase_date', type: 'date', source: 'assets', selected: false },
        { id: '7', name: 'purchase_cost', type: 'number', source: 'assets', selected: false },
        { id: '8', name: 'assigned_user', type: 'string', source: 'assets', selected: false },
        { id: '9', name: 'department', type: 'string', source: 'assets', selected: false },
        { id: '10', name: 'last_audit_date', type: 'date', source: 'assets', selected: false },
        { id: '11', name: 'manufacturer', type: 'string', source: 'assets', selected: false },
        { id: '12', name: 'model', type: 'string', source: 'assets', selected: false },
        { id: '13', name: 'serial_number', type: 'string', source: 'assets', selected: false },
        { id: '14', name: 'condition', type: 'string', source: 'assets', selected: false },
        { id: '15', name: 'warranty_expiry', type: 'date', source: 'assets', selected: false }
      ];
    } else if (selectedDataSource === 'users') {
      fields = [
        { id: '1', name: 'name', type: 'string', source: 'users', selected: false },
        { id: '2', name: 'email', type: 'string', source: 'users', selected: false },
        { id: '3', name: 'role', type: 'string', source: 'users', selected: false },
        { id: '4', name: 'department', type: 'string', source: 'users', selected: false },
        { id: '5', name: 'employee_id', type: 'string', source: 'users', selected: false },
        { id: '6', name: 'is_active', type: 'boolean', source: 'users', selected: false },
        { id: '7', name: 'last_login', type: 'date', source: 'users', selected: false }
      ];
    } else if (selectedDataSource === 'transactions') {
      fields = [
        { id: '1', name: 'vendor_name', type: 'string', source: 'vendors', selected: false },
        { id: '2', name: 'contact_email', type: 'string', source: 'vendors', selected: false },
        { id: '3', name: 'performance_rating', type: 'number', source: 'vendors', selected: false },
        { id: '4', name: 'is_active', type: 'boolean', source: 'vendors', selected: false }
      ];
    } else if (selectedDataSource === 'analytics') {
      fields = [
        { id: '1', name: 'action', type: 'string', source: 'audit_logs', selected: false },
        { id: '2', name: 'user', type: 'string', source: 'audit_logs', selected: false },
        { id: '3', name: 'timestamp', type: 'date', source: 'audit_logs', selected: false },
        { id: '4', name: 'severity', type: 'string', source: 'audit_logs', selected: false }
      ];
    }
    
    setAvailableFields(fields);
  };

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const validateStep = () => {
    switch (activeStep) {
      case 0:
        if (!selectedDataSource) {
          toast.error('Please select a data source');
          return false;
        }
        break;
      case 1:
        if (selectedFields.length === 0) {
          toast.error('Please select at least one field');
          return false;
        }
        break;
      case 2:
        if (!reportType) {
          toast.error('Please select a report type');
          return false;
        }
        break;
    }
    return true;
  };

  const handleFieldToggle = (fieldId: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const addFilter = () => {
    const newFilter: Filter = {
      id: Date.now().toString(),
      field: '',
      operator: 'equals',
      value: ''
    };
    setFilters([...filters, newFilter]);
  };

  const updateFilter = (filterId: string, updates: Partial<Filter>) => {
    setFilters(filters.map(filter => 
      filter.id === filterId ? { ...filter, ...updates } : filter
    ));
  };

  const removeFilter = (filterId: string) => {
    setFilters(filters.filter(filter => filter.id !== filterId));
  };

  const handleSaveReport = () => {
    if (!reportName.trim()) {
      toast.error('Please enter a report name');
      return;
    }

    const newReport = {
      id: Date.now().toString(),
      name: reportName,
      description: reportDescription,
      dataSource: selectedDataSource,
      fields: selectedFields,
      filters,
      type: reportType,
      schedule,
      recipients,
      created: new Date().toISOString()
    };

    setSavedReports([...savedReports, newReport]);
    toast.success('Custom report saved successfully!');
    
    // Reset form
    setActiveStep(0);
    setReportName('');
    setReportDescription('');
    setSelectedDataSource('');
    setSelectedFields([]);
    setFilters([]);
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Data Source
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose the primary data source for your custom report
            </Typography>
            
            <Grid container spacing={3}>
              {dataSources.map((source) => (
                <Grid item xs={12} md={6} key={source.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      border: selectedDataSource === source.id ? 2 : 1,
                      borderColor: selectedDataSource === source.id ? 'primary.main' : 'divider'
                    }}
                    onClick={() => setSelectedDataSource(source.id)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <DataIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6">{source.name}</Typography>
                          <Chip label={source.type} size="small" />
                        </Box>
                        {selectedDataSource === source.id && (
                          <CheckIcon color="primary" sx={{ ml: 'auto' }} />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {source.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tables: {source.tables.join(', ')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Fields & Configure Filters
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Available Fields
                </Typography>
                <Card sx={{ maxHeight: 400, overflow: 'auto' }}>
                  <List>
                    {availableFields.map((field) => (
                      <ListItem key={field.id} button onClick={() => handleFieldToggle(field.id)}>
                        <ListItemIcon>
                          <Checkbox checked={selectedFields.includes(field.id)} />
                        </ListItemIcon>
                        <ListItemText
                          primary={field.name}
                          secondary={`${field.type} • ${field.source}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1">
                    Filters ({filters.length})
                  </Typography>
                  <Button
                    startIcon={<FilterIcon />}
                    onClick={addFilter}
                    size="small"
                  >
                    Add Filter
                  </Button>
                </Box>
                
                <Card sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {filters.length === 0 ? (
                    <Box sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No filters added yet
                      </Typography>
                    </Box>
                  ) : (
                    <List>
                      {filters.map((filter, index) => (
                        <ListItem key={filter.id}>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={4}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Field</InputLabel>
                                <Select
                                  value={filter.field}
                                  label="Field"
                                  onChange={(e) => updateFilter(filter.id, { field: e.target.value })}
                                >
                                  {availableFields.map((field) => (
                                    <MenuItem key={field.id} value={field.name}>
                                      {field.name}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={3}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Operator</InputLabel>
                                <Select
                                  value={filter.operator}
                                  label="Operator"
                                  onChange={(e) => updateFilter(filter.id, { operator: e.target.value })}
                                >
                                  <MenuItem value="equals">Equals</MenuItem>
                                  <MenuItem value="contains">Contains</MenuItem>
                                  <MenuItem value="greater">Greater Than</MenuItem>
                                  <MenuItem value="less">Less Than</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={4}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Value"
                                value={filter.value}
                                onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                              />
                            </Grid>
                            <Grid item xs={1}>
                              <IconButton 
                                size="small" 
                                onClick={() => removeFilter(filter.id)}
                                color="error"
                              >
                                ×
                              </IconButton>
                            </Grid>
                          </Grid>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Choose Visualization Type
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select how you want to display your report data
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: reportType === 'table' ? 2 : 1,
                    borderColor: reportType === 'table' ? 'primary.main' : 'divider'
                  }}
                  onClick={() => setReportType('table')}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <TableIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6">Table Report</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Traditional tabular format with rows and columns
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: reportType === 'chart' ? 2 : 1,
                    borderColor: reportType === 'chart' ? 'primary.main' : 'divider'
                  }}
                  onClick={() => setReportType('chart')}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <BarChartIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                    <Typography variant="h6">Chart Report</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Visual charts and graphs for data analysis
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: reportType === 'dashboard' ? 2 : 1,
                    borderColor: reportType === 'dashboard' ? 'primary.main' : 'divider'
                  }}
                  onClick={() => setReportType('dashboard')}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <PieChartIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                    <Typography variant="h6">Dashboard</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Interactive dashboard with multiple visualizations
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 4 }}>
              <TextField
                fullWidth
                label="Report Name"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                sx={{ mb: 2 }}
                required
              />
              <TextField
                fullWidth
                label="Report Description"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                multiline
                rows={3}
              />
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Schedule & Recipients
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Schedule</InputLabel>
                  <Select
                    value={schedule}
                    label="Schedule"
                    onChange={(e) => setSchedule(e.target.value)}
                  >
                    <MenuItem value="manual">Manual (On-demand)</MenuItem>
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  fullWidth
                  label="Email Recipients"
                  placeholder="Enter email addresses separated by commas"
                  multiline
                  rows={3}
                  value={recipients.join(', ')}
                  onChange={(e) => setRecipients(e.target.value.split(',').map(email => email.trim()))}
                  helperText="Recipients will receive the report via email when scheduled"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Report Summary
                </Typography>
                <Card sx={{ bgcolor: 'grey.50' }}>
                  <CardContent>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Name:</strong> {reportName || 'Untitled Report'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Data Source:</strong> {dataSources.find(ds => ds.id === selectedDataSource)?.name || 'None'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Fields:</strong> {selectedFields.length} selected
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Filters:</strong> {filters.length} applied
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Type:</strong> {reportType}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Schedule:</strong> {schedule}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ flexGrow: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Custom Reports
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create custom reports with advanced filtering and visualization options
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={() => window.history.back()}
          >
            Back to Analytics
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Report Builder */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Report Builder
                </Typography>
                
                {/* Stepper */}
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>

                {/* Step Content */}
                <Box sx={{ mb: 4 }}>
                  {getStepContent(activeStep)}
                </Box>

                {/* Navigation Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<PreviewIcon />}
                      onClick={() => setPreviewDialog(true)}
                      disabled={selectedFields.length === 0}
                    >
                      Preview
                    </Button>
                    
                    {activeStep === steps.length - 1 ? (
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveReport}
                      >
                        Save Report
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={handleNext}
                      >
                        Next
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Saved Reports */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Saved Reports ({savedReports.length})
                  </Typography>
                  <IconButton size="small" onClick={loadSavedReports}>
                    <RefreshIcon />
                  </IconButton>
                </Box>
                
                <List>
                  {savedReports.map((report) => (
                    <ListItem key={report.id} sx={{ px: 0 }}>
                      <ListItemIcon>
                        {report.type === 'table' && <TableIcon />}
                        {report.type === 'chart' && <BarChartIcon />}
                        {report.type === 'dashboard' && <PieChartIcon />}
                      </ListItemIcon>
                      <ListItemText
                        primary={report.name}
                        secondary={`Created: ${new Date(report.created).toLocaleDateString()}`}
                      />
                      <IconButton size="small">
                        <DownloadIcon />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
                
                {savedReports.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No saved reports yet
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Preview Dialog */}
        <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Report Preview</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              This is a preview of your report structure. The actual data will be populated when the report is generated.
            </Alert>
            
            <Typography variant="h6" gutterBottom>Selected Fields:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {selectedFields.map((fieldId) => {
                const field = availableFields.find(f => f.id === fieldId);
                return field ? (
                  <Chip key={fieldId} label={field.name} size="small" />
                ) : null;
              })}
            </Box>
            
            {filters.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom>Applied Filters:</Typography>
                <List dense>
                  {filters.map((filter) => (
                    <ListItem key={filter.id}>
                      <ListItemText
                        primary={`${filter.field} ${filter.operator} "${filter.value}"`}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewDialog(false)}>Close</Button>
            <Button variant="contained" onClick={() => setPreviewDialog(false)}>
              Continue Building
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default AdminCustomReportsPage;