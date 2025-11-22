import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  Tab,
  Tabs,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Email as EmailIcon,
  Settings as SettingsIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import settingsService, { SystemSettings } from '../../services/settings.service';

interface SystemConfiguration {
  id: string;
  category: string;
  name: string;
  value: string | boolean | number;
  description: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  options?: string[];
  required: boolean;
  sensitive?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminSystemSettingsPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [accessibleCategories, setAccessibleCategories] = useState<string[]>([]);
  const [configDialog, setConfigDialog] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<{
    category: string;
    field: string;
    value: string | boolean | number;
    label: string;
    type: 'text' | 'number' | 'boolean' | 'select' | 'email';
  } | null>(null);
  const [editValue, setEditValue] = useState<string | boolean | number>('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    loadSystemConfiguration();
    loadAccessibleCategories();
  }, []);

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadSystemConfiguration(true);
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadSystemConfiguration = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await settingsService.getSettings();
      setSettings(data);
      setLastUpdated(new Date());
    } catch (error) {
      if (!silent) {
        toast.error('Failed to load system settings');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadAccessibleCategories = async () => {
    try {
      const categories = await settingsService.getAccessibleCategories();
      setAccessibleCategories(categories);
    } catch (error) {
      // Default to empty if error
      setAccessibleCategories([]);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const openEditDialog = (category: string, field: string, value: string | boolean | number, label: string, type: 'text' | 'number' | 'boolean' | 'select' | 'email') => {
    setSelectedConfig({ category, field, value, label, type });
    setEditValue(value);
    setConfigDialog(true);
  };

  const handleConfigSave = async () => {
    if (!selectedConfig || !settings) return;

    setLoading(true);
    try {
      const updates = {
        [selectedConfig.field]: editValue
      };
      
      const updatedSettings = await settingsService.updateCategory(
        selectedConfig.category as 'security' | 'database' | 'email' | 'application',
        updates
      );
      
      // Update local state with fresh data from server
      setSettings(updatedSettings);
      setLastUpdated(new Date());
      
      toast.success(`${selectedConfig.label} updated successfully`);
      setConfigDialog(false);
      
      // Reload to ensure consistency
      await loadSystemConfiguration(true);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || 'Failed to update setting';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickToggle = async (category: string, field: string, newValue: boolean, label: string) => {
    if (!settings) return;
    
    setLoading(true);
    try {
      const updates = {
        [field]: newValue
      };
      
      const updatedSettings = await settingsService.updateCategory(
        category as 'security' | 'database' | 'email' | 'application',
        updates
      );
      
      // Update with fresh data from server
      setSettings(updatedSettings);
      setLastUpdated(new Date());
      
      toast.success(`${label} ${newValue ? 'enabled' : 'disabled'}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || 'Failed to update setting';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderSettingField = (
    category: string,
    field: string,
    value: string | boolean | number,
    label: string,
    description: string,
    type: 'text' | 'number' | 'boolean' | 'select' | 'email' = 'text',
    sensitive = false
  ) => (
    <Card key={`${category}-${field}`} sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              {label}
              {sensitive && <Chip label="Sensitive" color="warning" size="small" sx={{ ml: 1 }} />}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {description}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon />}
            onClick={() => openEditDialog(category, field, value, label, type)}
            disabled={loading}
          >
            Edit
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {type === 'boolean' ? (
            <FormControlLabel
              control={
                <Switch
                  checked={value as boolean}
                  onChange={(e) => handleQuickToggle(category, field, e.target.checked, label)}
                  disabled={loading}
                />
              }
              label={value ? 'Enabled' : 'Disabled'}
            />
          ) : (
            <Typography variant="body1" sx={{ fontFamily: sensitive ? 'monospace' : 'inherit' }}>
              {sensitive ? '••••••••' : value?.toString()}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  if (loading && !settings) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </DashboardLayout>
    );
  }

  if (!settings) {
    return (
      <DashboardLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">Failed to load system settings</Alert>
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
              System Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Configure system-wide settings and parameters
            </Typography>
            {lastUpdated && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  size="small"
                />
              }
              label="Auto-refresh"
            />
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => loadSystemConfiguration()}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Status Alert */}
        <Alert severity="info" sx={{ mb: 3 }}>
          System is running in <strong>Production</strong> mode. Changes to sensitive settings may require application restart.
        </Alert>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            {accessibleCategories.includes('security') && (
              <Tab icon={<SecurityIcon />} label="Security" />
            )}
            {accessibleCategories.includes('database') && (
              <Tab icon={<StorageIcon />} label="Database" />
            )}
            {accessibleCategories.includes('email') && (
              <Tab icon={<EmailIcon />} label="Email" />
            )}
            {accessibleCategories.includes('application') && (
              <Tab icon={<SettingsIcon />} label="Application" />
            )}
          </Tabs>
        </Paper>

        {/* No Access Message */}
        {accessibleCategories.length === 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            You do not have access to any settings categories. Contact your administrator for access.
          </Alert>
        )}

        {/* Security Settings */}
        {accessibleCategories.includes('security') && settings?.security && (
          <TabPanel value={currentTab} index={accessibleCategories.indexOf('security')}>
            <Typography variant="h6" gutterBottom>
              Authentication & Security
            </Typography>
            {renderSettingField('security', 'sessionTimeout', settings.security.sessionTimeout, 'Session Timeout', 'Session timeout duration in minutes (5-1440)', 'number')}
            {renderSettingField('security', 'passwordExpiry', settings.security.passwordExpiry, 'Password Expiry', 'Password expiration period in days (0 = never)', 'number')}
            {renderSettingField('security', 'maxLoginAttempts', settings.security.maxLoginAttempts, 'Max Login Attempts', 'Maximum failed login attempts before account lockout (3-10)', 'number')}
            {renderSettingField('security', 'twoFactorAuth', settings.security.twoFactorAuth, 'Two-Factor Authentication', 'Enable two-factor authentication for all users', 'boolean')}
            {renderSettingField('security', 'passwordMinLength', settings.security.passwordMinLength, 'Password Minimum Length', 'Minimum password length (6-32)', 'number')}
            {renderSettingField('security', 'requireSpecialChar', settings.security.requireSpecialChar, 'Require Special Character', 'Require at least one special character in passwords', 'boolean')}
            {renderSettingField('security', 'requireNumber', settings.security.requireNumber, 'Require Number', 'Require at least one number in passwords', 'boolean')}
            {renderSettingField('security', 'requireUppercase', settings.security.requireUppercase, 'Require Uppercase', 'Require at least one uppercase letter in passwords', 'boolean')}
          </TabPanel>
        )}

        {/* Database Settings */}
        {accessibleCategories.includes('database') && settings?.database && (
          <TabPanel value={currentTab} index={accessibleCategories.indexOf('database')}>
            <Typography variant="h6" gutterBottom>
              Database Configuration
            </Typography>
            {renderSettingField('database', 'backupEnabled', settings.database.backupEnabled, 'Backup Enabled', 'Enable automatic database backups', 'boolean')}
            {renderSettingField('database', 'backupFrequency', settings.database.backupFrequency, 'Backup Frequency', 'How often to perform backups', 'text')}
            {renderSettingField('database', 'backupRetention', settings.database.backupRetention, 'Backup Retention', 'Number of days to retain backups (7-365)', 'number')}
            {renderSettingField('database', 'backupLocation', settings.database.backupLocation, 'Backup Location', 'Directory path for storing backups', 'text')}
            {renderSettingField('database', 'connectionPoolSize', settings.database.connectionPoolSize, 'Connection Pool Size', 'Maximum number of database connections (5-100)', 'number')}
            {renderSettingField('database', 'queryTimeout', settings.database.queryTimeout, 'Query Timeout', 'Database query timeout in milliseconds (5000-300000)', 'number')}
          </TabPanel>
        )}

        {/* Email Settings */}
        {accessibleCategories.includes('email') && settings?.email && (
          <TabPanel value={currentTab} index={accessibleCategories.indexOf('email')}>
            <Typography variant="h6" gutterBottom>
              Email Configuration
            </Typography>
            {renderSettingField('email', 'smtpHost', settings.email.smtpHost, 'SMTP Host', 'SMTP server hostname', 'text')}
            {renderSettingField('email', 'smtpPort', settings.email.smtpPort, 'SMTP Port', 'SMTP server port (1-65535)', 'number')}
            {renderSettingField('email', 'smtpSecure', settings.email.smtpSecure, 'SMTP Secure', 'Use TLS/SSL for SMTP connection', 'boolean')}
            {renderSettingField('email', 'smtpUser', settings.email.smtpUser, 'SMTP User', 'SMTP authentication username', 'text')}
            {renderSettingField('email', 'smtpPassword', settings.email.smtpPassword, 'SMTP Password', 'SMTP authentication password', 'text', true)}
            {renderSettingField('email', 'fromEmail', settings.email.fromEmail, 'From Email', 'Email address for outgoing emails', 'email')}
            {renderSettingField('email', 'fromName', settings.email.fromName, 'From Name', 'Display name for outgoing emails', 'text')}
            {renderSettingField('email', 'enableNotifications', settings.email.enableNotifications, 'Enable Notifications', 'Enable email notifications', 'boolean')}
          </TabPanel>
        )}

        {/* Application Settings */}
        {accessibleCategories.includes('application') && settings?.application && (
          <TabPanel value={currentTab} index={accessibleCategories.indexOf('application')}>
            <Typography variant="h6" gutterBottom>
              Application Configuration
            </Typography>
            {renderSettingField('application', 'appName', settings.application.appName, 'Application Name', 'Name of the application (3-100 characters)', 'text')}
            {renderSettingField('application', 'appVersion', settings.application.appVersion, 'Application Version', 'Current application version', 'text')}
            {renderSettingField('application', 'timezone', settings.application.timezone, 'Timezone', 'Default timezone for the application', 'text')}
            {renderSettingField('application', 'dateFormat', settings.application.dateFormat, 'Date Format', 'Default date format', 'text')}
            {renderSettingField('application', 'currency', settings.application.currency, 'Currency', 'Default currency code (3 letters)', 'text')}
            {renderSettingField('application', 'language', settings.application.language, 'Language', 'Default application language', 'text')}
            {renderSettingField('application', 'itemsPerPage', settings.application.itemsPerPage, 'Items Per Page', 'Default number of items per page (5-100)', 'number')}
            {renderSettingField('application', 'maintenanceMode', settings.application.maintenanceMode, 'Maintenance Mode', 'Enable maintenance mode', 'boolean')}
            {renderSettingField('application', 'maintenanceMessage', settings.application.maintenanceMessage, 'Maintenance Message', 'Message to display during maintenance', 'text')}
          </TabPanel>
        )}

        {/* Configuration Edit Dialog */}
        <Dialog open={configDialog} onClose={() => setConfigDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Edit Setting: {selectedConfig?.label}
          </DialogTitle>
          <DialogContent>
            {selectedConfig && (
              <Box sx={{ pt: 2 }}>
                <Divider sx={{ my: 2 }} />
                
                {selectedConfig.type === 'text' && (
                  <TextField
                    fullWidth
                    label={selectedConfig.label}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                  />
                )}

                {selectedConfig.type === 'email' && (
                  <TextField
                    fullWidth
                    label={selectedConfig.label}
                    type="email"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                  />
                )}
                
                {selectedConfig.type === 'number' && (
                  <TextField
                    fullWidth
                    label={selectedConfig.label}
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(Number(e.target.value))}
                    autoFocus
                  />
                )}
                
                {selectedConfig.type === 'boolean' && (
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={editValue as boolean}
                        onChange={(e) => setEditValue(e.target.checked)}
                      />
                    }
                    label={editValue ? 'Enabled' : 'Disabled'}
                  />
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfigDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleConfigSave}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default AdminSystemSettingsPage;