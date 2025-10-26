import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  TablePagination,
  Checkbox,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Computer as AssetIcon,
  SwapHoriz as TransactionIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

interface AdminAuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  user?: { id: string; name: string; email: string };
  action: string;
  entity_type: string;
  entity_id?: string;
  description: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  ip_address?: string;
  changes?: any;
  user_agent?: string;
  old_values?: any;
  new_values?: any;
}

const AdminAuditLogPage: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/audit-logs');
      const logData = response.data.data || response.data;
      setAuditLogs(logData);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter((log) => {
    const userName = log.user?.name || log.user_name || '';
    
    const matchesSearch = 
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip_address?.includes(searchTerm) || false;
    
    const matchesSeverity = selectedSeverity === 'all' || log.severity === selectedSeverity;
    const matchesEntityType = selectedEntityType === 'all' || log.entity_type === selectedEntityType;
    const matchesAction = selectedAction === 'all' || log.action.includes(selectedAction);
    
    return matchesSearch && matchesSeverity && matchesEntityType && matchesAction;
  });

  const paginatedLogs = filteredLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const getSeverityColor = (severity: AdminAuditLog['severity']) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'error';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (severity: AdminAuditLog['severity']) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
        return <InfoIcon color="info" />;
      default:
        return <CheckCircleIcon />;
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case 'user':
        return <PersonIcon />;
      case 'asset':
        return <AssetIcon />;
      case 'transaction':
        return <TransactionIcon />;
      case 'system':
        return <SettingsIcon />;
      default:
        return <SecurityIcon />;
    }
  };

  const handleExportLogs = () => {
    const selectedLogs = bulkSelected.length > 0 
      ? auditLogs.filter(log => bulkSelected.includes(log.id))
      : filteredLogs;
    
    toast.info(`Exporting ${selectedLogs.length} audit logs`);
    setBulkSelected([]);
  };

  const severityStats = {
    critical: auditLogs.filter(l => l.severity === 'critical').length,
    error: auditLogs.filter(l => l.severity === 'error').length,
    warning: auditLogs.filter(l => l.severity === 'warning').length,
    info: auditLogs.filter(l => l.severity === 'info').length
  };

  const entityTypes = Array.from(new Set(auditLogs.map(l => l.entity_type)));
  const actions = Array.from(new Set(auditLogs.map(l => l.action)));
  const severities = ['info', 'warning', 'error', 'critical'];

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Audit Logs
            </Typography>
            <Typography variant="body1" color="text.secondary">
              System activity monitoring and security audit trail
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadAuditLogs}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExportLogs}
            >
              Export Logs
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="overline" sx={{ opacity: 0.8 }}>
                      Total Logs
                    </Typography>
                    <Typography variant="h4">{auditLogs.length}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      All activities
                    </Typography>
                  </Box>
                  <SecurityIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="overline" sx={{ opacity: 0.8 }}>
                      Critical Issues
                    </Typography>
                    <Typography variant="h4">{severityStats.critical}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Require attention
                    </Typography>
                  </Box>
                  <ErrorIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="overline" sx={{ opacity: 0.8 }}>
                      Warnings
                    </Typography>
                    <Typography variant="h4">{severityStats.warning}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Monitor closely
                    </Typography>
                  </Box>
                  <WarningIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="overline" sx={{ opacity: 0.8 }}>
                      Info Events
                    </Typography>
                    <Typography variant="h4">{severityStats.info}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Normal activity
                    </Typography>
                  </Box>
                  <InfoIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  placeholder="Search logs..."
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
              <Grid item xs={12} sm={4} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Severity</InputLabel>
                  <Select
                    value={selectedSeverity}
                    label="Severity"
                    onChange={(e) => setSelectedSeverity(e.target.value)}
                  >
                    <MenuItem value="all">All Severities</MenuItem>
                    {severities.map(severity => (
                      <MenuItem key={severity} value={severity}>{severity}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Entity</InputLabel>
                  <Select
                    value={selectedEntityType}
                    label="Entity"
                    onChange={(e) => setSelectedEntityType(e.target.value)}
                  >
                    <MenuItem value="all">All Entities</MenuItem>
                    {entityTypes.map(entity => (
                      <MenuItem key={entity} value={entity}>{entity}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Action</InputLabel>
                  <Select
                    value={selectedAction}
                    label="Action"
                    onChange={(e) => setSelectedAction(e.target.value)}
                  >
                    <MenuItem value="all">All Actions</MenuItem>
                    {actions.map(action => (
                      <MenuItem key={action} value={action}>{action}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    {filteredLogs.length} of {auditLogs.length} logs
                  </Typography>
                  {bulkSelected.length > 0 && (
                    <Chip 
                      label={`${bulkSelected.length} selected`} 
                      color="secondary" 
                      size="small" 
                    />
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {severityStats.critical > 0 && (
          <Alert severity="error" sx={{ mb: 3 }}>
            There are {severityStats.critical} critical security events that require immediate attention.
          </Alert>
        )}

        {/* Audit Logs Table */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                System Audit Trail
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip 
                  label={`${filteredLogs.length} logs`} 
                  color="primary" 
                  variant="outlined" 
                  size="small" 
                />
              </Box>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={bulkSelected.length > 0 && bulkSelected.length < filteredLogs.length}
                        checked={filteredLogs.length > 0 && bulkSelected.length === filteredLogs.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBulkSelected(filteredLogs.map(l => l.id));
                          } else {
                            setBulkSelected([]);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>User & Action</TableCell>
                    <TableCell>Entity & Details</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Source Information</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedLogs.map((log) => (
                    <TableRow 
                      key={log.id}
                      selected={bulkSelected.includes(log.id)}
                      hover
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={bulkSelected.includes(log.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBulkSelected(prev => [...prev, log.id]);
                            } else {
                              setBulkSelected(prev => prev.filter(id => id !== log.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main', width: 32, height: 32 }}>
                            {(log.user?.name || log.user_name || 'U').charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="medium">
                              {log.user?.name || log.user_name || 'Unknown'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {log.action}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 1, bgcolor: 'secondary.main', width: 24, height: 24 }}>
                            {getEntityIcon(log.entity_type)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {log.entity_type}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                              ID: {log.entity_id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getSeverityIcon(log.severity)}
                          label={log.severity}
                          color={getSeverityColor(log.severity) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium" sx={{ fontFamily: 'monospace' }}>
                            {log.ip_address}
                          </Typography>
                          {log.user_agent && (
                            <Tooltip title={log.user_agent}>
                              <Typography variant="caption" color="text.secondary" sx={{ 
                                maxWidth: 150, 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block'
                              }}>
                                {log.user_agent.split(' ')[0]}...
                              </Typography>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {log.description}
                        </Typography>
                        {log.old_values && log.new_values && (
                          <Typography variant="caption" color="text.secondary">
                            Values changed
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={filteredLogs.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
};

export default AdminAuditLogPage;