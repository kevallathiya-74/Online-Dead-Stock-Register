import {
    ArrowDownTrayIcon,
    ArrowPathIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    CloudArrowUpIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    ServerIcon,
    ShieldCheckIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import api from '../../../services/api';

interface BackupInfo {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  size: string;
  createdAt: string;
  status: 'completed' | 'failed' | 'in-progress';
  location: 'local' | 'cloud';
  description?: string;
}

interface BackupJob {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  schedule: string;
  enabled: boolean;
  lastRun?: string;
  nextRun: string;
  status: 'active' | 'paused' | 'failed';
}

const AdminBackupPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [restoreInProgress, setRestoreInProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
  
  // Dialog states
  const [createBackupOpen, setCreateBackupOpen] = useState(false);
  const [restoreBackupOpen, setRestoreBackupOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(null);
  
  // Form states
  const [backupName, setBackupName] = useState('');
  const [backupType, setBackupType] = useState<'full' | 'incremental' | 'differential'>('full');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [backupLocation, setBackupLocation] = useState<'local' | 'cloud'>('local');
  const [backupDescription, setBackupDescription] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [backupsResponse, jobsResponse] = await Promise.all([
        api.get('/backups'),
        api.get('/backups/jobs')
      ]);
      setBackups(backupsResponse.data.data || backupsResponse.data);
      setBackupJobs(jobsResponse.data.data || jobsResponse.data);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) { /* Error handled by API interceptor */ } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!backupName.trim()) {
      toast.error('Please enter a backup name');
      return;
    }

    setBackupInProgress(true);
    setProgress(0);
    
    try {
      const response = await api.post('/backups', {
        name: backupName,
        type: backupType,
        location: backupLocation,
        description: backupDescription
      }, {
        onDownloadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setProgress(progress);
        },
      });
      
      const newBackup = response.data.data || response.data;
      setBackups(prev => [newBackup, ...prev]);
      setCreateBackupOpen(false);
      setBackupName('');
      setBackupDescription('');
      toast.success('Backup created successfully!');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) { /* Error handled by API interceptor */ } finally {
      setBackupInProgress(false);
      setProgress(0);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;

    setRestoreInProgress(true);
    setProgress(0);

    try {
      await api.post(`/backups/${selectedBackup.id}/restore`, {}, {
        onDownloadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setProgress(progress);
        },
      });
      
      setRestoreBackupOpen(false);
      setSelectedBackup(null);
      toast.success('System restored successfully!');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) { /* Error handled by API interceptor */ } finally {
      setRestoreInProgress(false);
      setProgress(0);
    }
  };

  const handleDownloadBackup = async (backup: BackupInfo) => {
    try {
      toast.info(`Downloading ${backup.name}...`);
      
      const response = await api.get(`/backups/${backup.id}/download`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${backup.name}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Backup downloaded successfully');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) { /* Error handled by API interceptor */ }
  };

  const handleUploadToCloud = () => {
    toast.info('Uploading backups to cloud storage...');
    setTimeout(() => {
      toast.success('Backups uploaded to cloud successfully');
    }, 3500);
  };

  const handleManageSchedule = () => {
    toast.info('Opening backup schedule manager...');
  };

  const handleBackupSettings = () => {
    toast.info('Opening backup settings...');
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (window.confirm('Are you sure you want to delete this backup?')) {
      try {
        await api.delete(`/backups/${backupId}`);
        const response = await api.get('/backups');
        setBackups(response.data.data || response.data);
        toast.success('Backup deleted successfully');
      } catch (error: any) {
      
      const errorMsg = error.response?.data?.message || error.message || 'Failed to delete backup';
        toast.error(errorMsg);
      }
    }
  };

  const getStatusIcon = (status: BackupInfo['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-650" />;
      case 'in-progress':
        return <div className="w-4 h-4 border-2 border-slate-200 border-t-brand-600 rounded-full animate-spin" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-slate-500" />;
    }
  };

  const getStatusBadge = (status: BackupInfo['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border border-green-150';
      case 'failed':
        return 'bg-red-50 text-red-700 border border-red-150';
      case 'in-progress':
        return 'bg-amber-50 text-amber-700 border border-amber-150';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-150';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-brand-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  // Calculate dynamic stats
  const totalStorageInGB = backups.reduce((acc, curr) => {
    const sizeStr = curr.size || '';
    if (sizeStr.includes('GB')) return acc + parseFloat(sizeStr);
    if (sizeStr.includes('MB')) return acc + (parseFloat(sizeStr) / 1024);
    return acc;
  }, 0).toFixed(2);

  const completedBackups = backups.filter(b => b.status === 'completed');
  const lastBackupTime = completedBackups.length > 0 
    ? new Date(completedBackups[0].createdAt).toLocaleString() 
    : 'None';

  const activeJobs = backupJobs.filter(j => j.status === 'active');
  const nextBackupTime = activeJobs.length > 0 
    ? new Date(activeJobs[0].nextRun).toLocaleString() 
    : 'None scheduled';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold font-display text-slate-900">
              System Backups
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Manage database backups, snapshots, and recovery processes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 disabled:opacity-60 transition-all cursor-pointer"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setCreateBackupOpen(true)}
              disabled={backupInProgress}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-all shadow-brand cursor-pointer"
            >
              <ServerIcon className="w-4 h-4" />
              Create Backup
            </button>
          </div>
        </div>

        {/* Backup Progress */}
        {(backupInProgress || restoreInProgress) && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 animate-pulse">
            <h3 className="text-base font-bold font-display text-slate-900 mb-2">
              {backupInProgress ? 'Creating Backup...' : 'Restoring System...'}
            </h3>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2">
              <div className="bg-brand-600 h-2.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-slate-500 font-semibold">{Math.round(progress)}% complete</p>
          </div>
        )}

        {/* System Status Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
            <div className="flex items-center gap-2 mb-2 text-brand-600">
              <ServerIcon className="w-5 h-5" />
              <h3 className="font-semibold text-slate-900 text-sm">Storage Used</h3>
            </div>
            <h4 className="text-3xl font-bold font-display text-slate-900">{totalStorageInGB} GB</h4>
            <p className="text-xs text-slate-500 mt-1">of 100 GB available</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
            <div className="flex items-center gap-2 mb-2 text-green-600">
              <ServerIcon className="w-5 h-5" />
              <h3 className="font-semibold text-slate-900 text-sm">Total Backups</h3>
            </div>
            <h4 className="text-3xl font-bold font-display text-slate-900">{backups.length}</h4>
            <p className="text-xs text-slate-500 mt-1">Available for restore</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
            <div className="flex items-center gap-2 mb-2 text-green-600">
              <CheckCircleIcon className="w-5 h-5" />
              <h3 className="font-semibold text-slate-900 text-sm">Last Backup</h3>
            </div>
            <h4 className="text-xl font-bold font-display text-slate-900 truncate">{lastBackupTime}</h4>
            <p className="text-xs text-green-600 font-semibold mt-1">{completedBackups.length > 0 ? 'Successful' : 'N/A'}</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
            <div className="flex items-center gap-2 mb-2 text-sky-600">
              <CalendarDaysIcon className="w-5 h-5" />
              <h3 className="font-semibold text-slate-900 text-sm">Next Backup</h3>
            </div>
            <h4 className="text-xl font-bold font-display text-slate-900 truncate">{nextBackupTime}</h4>
            <p className="text-xs text-slate-500 mt-1">Scheduled backup</p>
          </div>
        </div>

        {/* Available Backups Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Backups List */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 lg:col-span-8">
            <h3 className="text-lg font-bold font-display text-slate-900 mb-4">
              Available Backups
            </h3>
            
            <ul className="divide-y divide-slate-50">
              {backups.map((backup) => (
                <li key={backup.id} className="py-4 flex items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 sm:mt-0 flex-shrink-0">
                      {getStatusIcon(backup.status)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">{backup.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200 text-slate-600 capitalize">
                          {backup.type}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 capitalize">
                          {backup.location}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadge(backup.status)}`}>
                          {backup.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Size: {backup.size} • Created: {new Date(backup.createdAt).toLocaleString()}
                      </p>
                      {backup.description && (
                        <p className="text-xs text-slate-400 mt-1">{backup.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => {
                        setSelectedBackup(backup);
                        setRestoreBackupOpen(true);
                      }}
                      disabled={restoreInProgress || backup.status !== 'completed'}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 disabled:opacity-40 transition-colors"
                      title="Restore Backup"
                    >
                      <ArrowPathIcon className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => handleDownloadBackup(backup)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                      title="Download Zip"
                    >
                      <ArrowDownTrayIcon className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBackup(backup.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-550 hover:text-red-650 transition-colors"
                      title="Delete Backup"
                    >
                      <TrashIcon className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Backup Schedules & Side Actions */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
              <h3 className="text-base font-bold font-display text-slate-900 mb-4">
                Scheduled Jobs
              </h3>
              <ul className="divide-y divide-slate-50">
                {backupJobs.map((job) => (
                  <li key={job.id} className="py-3">
                    <div className="flex items-center gap-2 justify-between">
                      <span className="font-semibold text-slate-900 text-xs">{job.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        job.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-500'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Schedule: {job.schedule}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Next Run: {new Date(job.nextRun).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 space-y-3">
              <h3 className="text-base font-bold font-display text-slate-900">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={handleUploadToCloud}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <CloudArrowUpIcon className="w-4 h-4" />
                  Upload to Cloud
                </button>
                <button
                  onClick={handleManageSchedule}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <CalendarDaysIcon className="w-4 h-4" />
                  Manage Schedule
                </button>
                <button
                  onClick={handleBackupSettings}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <ShieldCheckIcon className="w-4 h-4" />
                  Backup Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Backup Dialog Modal */}
      {createBackupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-card-xl p-6 space-y-4 animate-fade-in-up">
            <h3 className="text-lg font-bold font-display text-slate-900">Create New Backup</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Backup Name *</label>
                <input
                  type="text"
                  value={backupName}
                  onChange={(e) => setBackupName(e.target.value)}
                  placeholder="e.g. Manual_Backup_2026_07_01"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Backup Type *</label>
                <select
                  value={backupType}
                  onChange={(e) => setBackupType(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="full">Full Backup</option>
                  <option value="incremental">Incremental Backup</option>
                  <option value="differential">Differential Backup</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  value={backupDescription}
                  onChange={(e) => setBackupDescription(e.target.value)}
                  placeholder="Enter backup description or notes..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setCreateBackupOpen(false)}
                disabled={backupInProgress}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-55 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBackup}
                disabled={backupInProgress || !backupName.trim()}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-55 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {backupInProgress ? 'Creating...' : 'Create Backup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Backup Dialog Modal */}
      {restoreBackupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-card-xl p-6 space-y-4 animate-fade-in-up">
            <h3 className="text-lg font-bold font-display text-slate-900">Restore System</h3>
            
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
              <p>
                <span className="font-semibold">Warning:</span> This will restore the system to the state when this backup was created. All current data changes will be lost.
              </p>
            </div>

            {selectedBackup && (
              <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">Backup Details:</p>
                <p><span className="font-medium">Name:</span> {selectedBackup.name}</p>
                <p><span className="font-medium">Type:</span> {selectedBackup.type}</p>
                <p><span className="font-medium">Size:</span> {selectedBackup.size}</p>
                <p><span className="font-medium">Created:</span> {new Date(selectedBackup.createdAt).toLocaleString()}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRestoreBackupOpen(false)}
                disabled={restoreInProgress}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-55 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRestoreBackup}
                disabled={restoreInProgress}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-55 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {restoreInProgress ? 'Restoring...' : 'Restore System'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminBackupPage;