import {
    ArrowPathIcon,
    Cog6ToothIcon,
    EnvelopeIcon,
    ExclamationCircleIcon,
    PencilSquareIcon,
    ServerIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import settingsService, { SystemSettings } from '../services/settings.service';

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      setAccessibleCategories([]);
    }
  };

  const openEditDialog = (
    category: string,
    field: string,
    value: string | boolean | number,
    label: string,
    type: 'text' | 'number' | 'boolean' | 'select' | 'email'
  ) => {
    setSelectedConfig({ category, field, value, label, type });
    setEditValue(value);
    setConfigDialog(true);
  };

  const handleConfigSave = async () => {
    if (!selectedConfig || !settings) return;

    setLoading(true);
    try {
      const updates = { [selectedConfig.field]: editValue };
      const updatedSettings = await settingsService.updateCategory(
        selectedConfig.category as 'security' | 'database' | 'email' | 'application',
        updates
      );
      setSettings(updatedSettings);
      setLastUpdated(new Date());
      toast.success(`${selectedConfig.label} updated successfully`);
      setConfigDialog(false);
      await loadSystemConfiguration(true);
    } catch (error: any) {
      const errObj: any = error;
      const errorMessage = errObj.response?.data?.message || 'Failed to update setting';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickToggle = async (category: string, field: string, newValue: boolean, label: string) => {
    if (!settings) return;
    
    setLoading(true);
    try {
      const updates = { [field]: newValue };
      const updatedSettings = await settingsService.updateCategory(
        category as 'security' | 'database' | 'email' | 'application',
        updates
      );
      setSettings(updatedSettings);
      setLastUpdated(new Date());
      toast.success(`${label} ${newValue ? 'enabled' : 'disabled'}`);
    } catch (error: any) {
      const errObj: any = error;
      const errorMessage = errObj.response?.data?.message || 'Failed to update setting';
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
    <div key={`${category}-${field}`} className="bg-white rounded-xl border border-slate-100 shadow-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-semibold text-slate-900 font-display flex items-center gap-2">
            {label}
            {sensitive && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                Sensitive
              </span>
            )}
          </h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
        </div>
        <button
          onClick={() => openEditDialog(category, field, value, label, type)}
          disabled={loading}
          className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 cursor-pointer flex-shrink-0"
        >
          <PencilSquareIcon className="w-3.5 h-3.5" />
          Edit
        </button>
      </div>
      
      <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
        {type === 'boolean' ? (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={value as boolean}
              disabled={loading}
              onChange={(e) => handleQuickToggle(category, field, e.target.checked, label)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600" />
            <span className="ml-2 text-xs font-semibold text-slate-600">
              {value ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        ) : (
          <span className={`text-sm font-semibold text-slate-900 ${sensitive ? 'font-mono tracking-widest' : ''}`}>
            {sensitive ? '••••••••' : value?.toString()}
          </span>
        )}
      </div>
    </div>
  );

  if (loading && !settings) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-brand-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!settings) {
    return (
      <DashboardLayout>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
          <p>Failed to load system settings</p>
        </div>
      </DashboardLayout>
    );
  }

  // Active Category Name
  const activeCategory = accessibleCategories[currentTab];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold font-display text-slate-900">
              System Settings
            </h2>
            <p className="text-sm text-slate-500 mt-1">Configure system-wide settings and parameters</p>
            {lastUpdated && (
              <span className="text-[10px] text-slate-400 block mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4 self-end sm:self-auto">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600" />
              <span className="ml-2 text-xs font-semibold text-slate-600">Auto-refresh</span>
            </label>

            <button
              onClick={() => loadSystemConfiguration()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 disabled:opacity-60 transition-all cursor-pointer"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Status Alert */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-sm">
          <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-sky-600" />
          <p>System is running in <span className="font-semibold text-sky-900">Production</span> mode. Changes to sensitive settings may require application restart.</p>
        </div>

        {/* Categories Tab Navigation */}
        {accessibleCategories.length > 0 && (
          <div className="border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
            {accessibleCategories.includes('security') && (
              <button
                onClick={() => setCurrentTab(accessibleCategories.indexOf('security'))}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium text-sm transition-all cursor-pointer ${
                  activeCategory === 'security'
                    ? 'border-brand-650 text-brand-600 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheckIcon className="w-4 h-4" />
                Security
              </button>
            )}
            {accessibleCategories.includes('database') && (
              <button
                onClick={() => setCurrentTab(accessibleCategories.indexOf('database'))}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium text-sm transition-all cursor-pointer ${
                  activeCategory === 'database'
                    ? 'border-brand-650 text-brand-600 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ServerIcon className="w-4 h-4" />
                Database
              </button>
            )}
            {accessibleCategories.includes('email') && (
              <button
                onClick={() => setCurrentTab(accessibleCategories.indexOf('email'))}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium text-sm transition-all cursor-pointer ${
                  activeCategory === 'email'
                    ? 'border-brand-650 text-brand-600 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <EnvelopeIcon className="w-4 h-4" />
                Email
              </button>
            )}
            {accessibleCategories.includes('application') && (
              <button
                onClick={() => setCurrentTab(accessibleCategories.indexOf('application'))}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium text-sm transition-all cursor-pointer ${
                  activeCategory === 'application'
                    ? 'border-brand-650 text-brand-600 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Cog6ToothIcon className="w-4 h-4" />
                Application
              </button>
            )}
          </div>
        )}

        {accessibleCategories.length === 0 && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
            <p>You do not have access to any settings categories. Contact your administrator for access.</p>
          </div>
        )}

        {/* Tab Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeCategory === 'security' && settings.security && (
            <>
              {renderSettingField('security', 'sessionTimeout', settings.security.sessionTimeout, 'Session Timeout', 'Session timeout duration in minutes (5-1440)', 'number')}
              {renderSettingField('security', 'passwordExpiry', settings.security.passwordExpiry, 'Password Expiry', 'Password expiration period in days (0 = never)', 'number')}
              {renderSettingField('security', 'maxLoginAttempts', settings.security.maxLoginAttempts, 'Max Login Attempts', 'Maximum failed login attempts before lockout (3-10)', 'number')}
              {renderSettingField('security', 'twoFactorAuth', settings.security.twoFactorAuth, 'Two-Factor Authentication', 'Enable two-factor authentication for all users', 'boolean')}
              {renderSettingField('security', 'passwordMinLength', settings.security.passwordMinLength, 'Password Minimum Length', 'Minimum password length (6-32)', 'number')}
              {renderSettingField('security', 'requireSpecialChar', settings.security.requireSpecialChar, 'Require Special Character', 'Require at least one special character in passwords', 'boolean')}
              {renderSettingField('security', 'requireNumber', settings.security.requireNumber, 'Require Number', 'Require at least one number in passwords', 'boolean')}
              {renderSettingField('security', 'requireUppercase', settings.security.requireUppercase, 'Require Uppercase', 'Require at least one uppercase letter in passwords', 'boolean')}
            </>
          )}

          {activeCategory === 'database' && settings.database && (
            <>
              {renderSettingField('database', 'backupEnabled', settings.database.backupEnabled, 'Backup Enabled', 'Enable automatic database backups', 'boolean')}
              {renderSettingField('database', 'backupFrequency', settings.database.backupFrequency, 'Backup Frequency', 'How often to perform backups', 'text')}
              {renderSettingField('database', 'backupRetention', settings.database.backupRetention, 'Backup Retention', 'Number of days to retain backups (7-365)', 'number')}
              {renderSettingField('database', 'backupLocation', settings.database.backupLocation, 'Backup Location', 'Directory path for storing backups', 'text')}
              {renderSettingField('database', 'connectionPoolSize', settings.database.connectionPoolSize, 'Connection Pool Size', 'Maximum number of database connections (5-100)', 'number')}
              {renderSettingField('database', 'queryTimeout', settings.database.queryTimeout, 'Query Timeout', 'Database query timeout in milliseconds (5000-300000)', 'number')}
            </>
          )}

          {activeCategory === 'email' && settings.email && (
            <>
              {renderSettingField('email', 'smtpHost', settings.email.smtpHost, 'SMTP Host', 'SMTP server hostname', 'text')}
              {renderSettingField('email', 'smtpPort', settings.email.smtpPort, 'SMTP Port', 'SMTP server port (1-65535)', 'number')}
              {renderSettingField('email', 'smtpSecure', settings.email.smtpSecure, 'SMTP Secure', 'Use TLS/SSL for SMTP connection', 'boolean')}
              {renderSettingField('email', 'smtpUser', settings.email.smtpUser, 'SMTP User', 'SMTP authentication username', 'text')}
              {renderSettingField('email', 'smtpPassword', settings.email.smtpPassword, 'SMTP Password', 'SMTP authentication password', 'text', true)}
              {renderSettingField('email', 'fromEmail', settings.email.fromEmail, 'From Email', 'Email address for outgoing emails', 'email')}
              {renderSettingField('email', 'fromName', settings.email.fromName, 'From Name', 'Display name for outgoing emails', 'text')}
              {renderSettingField('email', 'enableNotifications', settings.email.enableNotifications, 'Enable Notifications', 'Enable email notifications', 'boolean')}
            </>
          )}

          {activeCategory === 'application' && settings.application && (
            <>
              {renderSettingField('application', 'appName', settings.application.appName, 'Application Name', 'Name of the application (3-100 characters)', 'text')}
              {renderSettingField('application', 'appVersion', settings.application.appVersion, 'Application Version', 'Current application version', 'text')}
              {renderSettingField('application', 'timezone', settings.application.timezone, 'Timezone', 'Default timezone for the application', 'text')}
              {renderSettingField('application', 'dateFormat', settings.application.dateFormat, 'Date Format', 'Default date format', 'text')}
              {renderSettingField('application', 'currency', settings.application.currency, 'Currency', 'Default currency code (3 letters)', 'text')}
              {renderSettingField('application', 'language', settings.application.language, 'Language', 'Default application language', 'text')}
              {renderSettingField('application', 'itemsPerPage', settings.application.itemsPerPage, 'Items Per Page', 'Default number of items per page (5-100)', 'number')}
              {renderSettingField('application', 'maintenanceMode', settings.application.maintenanceMode, 'Maintenance Mode', 'Enable maintenance mode', 'boolean')}
              {renderSettingField('application', 'maintenanceMessage', settings.application.maintenanceMessage, 'Maintenance Message', 'Message to display during maintenance', 'text')}
            </>
          )}
        </div>
      </div>

      {/* Configuration Edit Dialog */}
      {configDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-card-xl p-6 space-y-4 animate-fade-in-up">
            <h3 className="text-lg font-bold font-display text-slate-900">
              Edit Setting: {selectedConfig?.label}
            </h3>
            
            <div className="space-y-4 pt-2">
              {selectedConfig?.type === 'text' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{selectedConfig.label}</label>
                  <input
                    type="text"
                    value={editValue as string}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    autoFocus
                  />
                </div>
              )}

              {selectedConfig?.type === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{selectedConfig.label}</label>
                  <input
                    type="email"
                    value={editValue as string}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    autoFocus
                  />
                </div>
              )}
              
              {selectedConfig?.type === 'number' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{selectedConfig.label}</label>
                  <input
                    type="number"
                    value={editValue as number}
                    onChange={(e) => setEditValue(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    autoFocus
                  />
                </div>
              )}
              
              {selectedConfig?.type === 'boolean' && (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editValue as boolean}
                    onChange={(e) => setEditValue(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600" />
                  <span className="ml-2 text-xs font-semibold text-slate-650">
                    {editValue ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfigDialog(false)}
                disabled={loading}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-55 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfigSave}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-55 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminSystemSettingsPage;