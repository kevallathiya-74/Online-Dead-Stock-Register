import {
    BanknotesIcon,
    BellIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    PencilSquareIcon,
    PlusIcon,
    UserIcon,
    WrenchScrewdriverIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import MaintenanceModal from '../components/MaintenanceModal';
import { useAuth } from '../../../context/AuthContext';
import { usePolling } from '../../../hooks/usePolling';
import api from '../../../services/api';

interface MaintenanceRecord {
  id: string;
  asset_id: string;
  asset_name: string;
  type: 'Preventive' | 'Corrective' | 'Predictive' | 'Emergency' | 'Inspection' | 'Calibration' | 'Cleaning';
  description: string;
  scheduled_date: string; // This is from backend transformation (maintenance_date)
  completed_date?: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assigned_technician: string; // This is from backend transformation (performed_by)
  estimated_cost: number;
  actual_cost?: number;
  estimated_duration: number; // in hours
  actual_duration?: number;
  next_maintenance_date?: string;
  notes?: string;
  downtime_impact: 'Low' | 'Medium' | 'High';
}

interface Technician {
  id: string;
  name: string;
  specialization: string[];
  current_workload: number;
  rating: number;
  total_completed: number;
}

const MaintenancePage = () => {
  const { user } = useAuth();
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [tabValue, setTabValue] = useState(0);
  const [scheduleMaintenanceOpen, setScheduleMaintenanceOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);

  const loadData = async () => {
    try {
      const [maintenanceResponse, techniciansResponse] = await Promise.all([
        api.get('/maintenance'),
        api.get('/maintenance/technicians').catch(() => ({ data: { data: [] } }))
      ]);
      
      const maintenanceData = maintenanceResponse.data.data || maintenanceResponse.data;
      const technicianData = techniciansResponse.data.data || techniciansResponse.data;
      
      setMaintenanceRecords(Array.isArray(maintenanceData) ? maintenanceData : []);
      setTechnicians(Array.isArray(technicianData) ? technicianData : []);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) { /* Error handled by API interceptor */ }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    };
    loadInitialData();
  }, []);

  // Real-time polling every 30 seconds
  usePolling(async () => {
    await loadData();
  }, {
    interval: 30000,
    enabled: true
  });

  const filteredRecords = maintenanceRecords.filter((record) => {
    const matchesSearch = 
      record.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.assigned_technician.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || record.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || record.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || record.priority === selectedPriority;
    
    // Tab-based filtering
    let matchesTab = true;
    if (tabValue === 1) { // My Tasks
      const currentUserName = user?.full_name || user?.name || '';
      matchesTab = record.assigned_technician === currentUserName;
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesPriority && matchesTab;
  });

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Scheduled':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Overdue':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Cancelled':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPriorityClasses = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'High':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Medium':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Low':
      default:
        return 'bg-slate-100 text-slate-750 border-slate-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Preventive':
        return <ClockIcon className="w-4 h-4 text-slate-500" />;
      case 'Corrective':
        return <WrenchScrewdriverIcon className="w-4 h-4 text-indigo-500" />;
      case 'Predictive':
        return <ChartBarIcon className="w-4 h-4 text-emerald-500" />;
      case 'Emergency':
        return <ExclamationTriangleIcon className="w-4 h-4 text-rose-500" />;
      default:
        return <ClipboardDocumentListIcon className="w-4 h-4 text-slate-500" />;
    }
  };

  const stats = {
    totalRecords: maintenanceRecords.length,
    scheduled: maintenanceRecords.filter(r => r.status === 'Scheduled').length,
    inProgress: maintenanceRecords.filter(r => r.status === 'In Progress').length,
    overdue: maintenanceRecords.filter(r => r.status === 'Overdue').length,
    completed: maintenanceRecords.filter(r => r.status === 'Completed').length,
    totalCost: maintenanceRecords.reduce((sum, record) => sum + (record.actual_cost || record.estimated_cost), 0),
    avgDuration: maintenanceRecords.length > 0 ? 
      maintenanceRecords.reduce((sum, record) => sum + (record.actual_duration || record.estimated_duration), 0) / maintenanceRecords.length : 0,
  };

  const upcomingMaintenance = maintenanceRecords
    .filter(r => r.status === 'Scheduled' && new Date(r.scheduled_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
    .slice(0, 5);

  const handleViewRecord = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };

  const handleEditRecord = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
    setEditDialogOpen(true);
  };

  const handleUpdateStatus = async (recordId: string, newStatus: string) => {
    try {
      await api.put(`/maintenance/${recordId}`, { status: newStatus });
      await loadData(); // Reload data instead of making another GET call
      toast.success('Maintenance status updated successfully');
      setEditDialogOpen(false);
      setSelectedRecord(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) { /* Error handled by API interceptor */ }
  };

  const handleMaintenanceScheduled = async () => {
    await loadData(); // Reload data after scheduling new maintenance
    setScheduleMaintenanceOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Maintenance Management
            </h1>
            <p className="text-sm sm:text-base text-slate-500 mt-1">
              Schedule, track, and manage asset maintenance activities
            </p>
          </div>
          <button
            onClick={() => setScheduleMaintenanceOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <PlusIcon className="w-5 h-5" />
            Schedule Maintenance
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Total Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total</span>
              {loading ? (
                <div className="h-8 w-12 bg-slate-100 animate-pulse rounded-md" />
              ) : (
                <div className="text-2xl font-bold text-slate-900">{stats.totalRecords}</div>
              )}
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <ClipboardDocumentListIcon className="w-6 h-6" />
            </div>
          </div>

          {/* Scheduled Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Scheduled</span>
              {loading ? (
                <div className="h-8 w-12 bg-slate-100 animate-pulse rounded-md" />
              ) : (
                <div className="text-2xl font-bold text-slate-900">{stats.scheduled}</div>
              )}
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <ClockIcon className="w-6 h-6" />
            </div>
          </div>

          {/* In Progress Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">In Progress</span>
              {loading ? (
                <div className="h-8 w-12 bg-slate-100 animate-pulse rounded-md" />
              ) : (
                <div className="text-2xl font-bold text-slate-900">{stats.inProgress}</div>
              )}
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <WrenchScrewdriverIcon className="w-6 h-6" />
            </div>
          </div>

          {/* Overdue Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Overdue</span>
              {loading ? (
                <div className="h-8 w-12 bg-slate-100 animate-pulse rounded-md" />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-slate-900">{stats.overdue}</div>
                  {stats.overdue > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full animate-bounce">
                      {stats.overdue}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="p-3 bg-rose-50 text-rose-650 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6" />
            </div>
          </div>

          {/* Completed Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Completed</span>
              {loading ? (
                <div className="h-8 w-12 bg-slate-100 animate-pulse rounded-md" />
              ) : (
                <div className="text-2xl font-bold text-slate-900">{stats.completed}</div>
              )}
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircleIcon className="w-6 h-6" />
            </div>
          </div>

          {/* Total Cost Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Cost</span>
              {loading ? (
                <div className="h-8 w-20 bg-slate-100 animate-pulse rounded-md" />
              ) : (
                <div className="text-lg font-bold text-slate-900">
                  ₹{Number(stats.totalCost || 0).toLocaleString('en-IN')}
                </div>
              )}
            </div>
            <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
              <BanknotesIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Filters and Tables */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Tabs */}
            <div className="bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
              <nav className="flex flex-wrap gap-1" aria-label="Tabs">
                {['All Maintenance', 'My Tasks', 'Calendar View', 'Reports'].map((tabName, index) => (
                  <button
                    key={tabName}
                    onClick={() => setTabValue(index)}
                    className={`flex-1 min-w-[120px] text-center py-2 px-3 text-sm font-semibold rounded-lg transition-colors cursor-pointer
                      ${tabValue === index
                        ? 'bg-indigo-605 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    {tabName}
                  </button>
                ))}
              </nav>
            </div>

            {/* Filters (only visible for All Maintenance & My Tasks tabs) */}
            {(tabValue === 0 || tabValue === 1) && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                  
                  {/* Search */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search records..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-650"
                    />
                  </div>

                  {/* Type Filter */}
                  <div>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-650"
                    >
                      <option value="all">All Types</option>
                      <option value="Preventive">Preventive</option>
                      <option value="Corrective">Corrective</option>
                      <option value="Predictive">Predictive</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Inspection">Inspection</option>
                      <option value="Calibration">Calibration</option>
                      <option value="Cleaning">Cleaning</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-650"
                    >
                      <option value="all">All Statuses</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>

                  {/* Priority Filter */}
                  <div>
                    <select
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-650"
                    >
                      <option value="all">All Priorities</option>
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-500">
                  <span>Showing {filteredRecords.length} records</span>
                </div>
              </div>
            )}

            {/* Tab content view rendering */}
            {(tabValue === 0 || tabValue === 1) && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">
                    {tabValue === 0 ? 'Maintenance Schedule' : 'My Assigned Tasks'}
                  </h2>
                  <span className="px-2.5 py-0.5 text-xs font-semibold text-indigo-805 bg-indigo-50 border border-indigo-100 rounded-full">
                    {filteredRecords.length} total
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Asset</th>
                        <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                        <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Technician</th>
                        <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Scheduled Date</th>
                        <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Duration</th>
                        <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cost</th>
                        <th scope="col" className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded-sm w-32" /><div className="h-3 bg-slate-50 rounded-sm w-20 mt-1" /></td>
                            <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded-sm w-20" /></td>
                            <td className="px-5 py-4"><div className="h-6 bg-slate-100 rounded-full w-16" /></td>
                            <td className="px-5 py-4"><div className="h-6 bg-slate-100 rounded-full w-16" /></td>
                            <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded-sm w-24" /></td>
                            <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded-sm w-20" /></td>
                            <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded-sm w-12" /></td>
                            <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded-sm w-16" /></td>
                            <td className="px-5 py-4"><div className="h-8 bg-slate-100 rounded-md w-16 ml-auto" /></td>
                          </tr>
                        ))
                      ) : filteredRecords.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-5 py-12 text-center">
                            <ClipboardDocumentListIcon className="w-12 h-12 mx-auto text-slate-400 stroke-1" />
                            <h3 className="text-sm font-bold text-slate-900 mt-3">
                              {tabValue === 1 ? 'No tasks assigned to you' : 'No maintenance records found'}
                            </h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                              {tabValue === 1 
                                ? 'You have no maintenance tasks assigned at the moment.'
                                : searchTerm || selectedType !== 'all' || selectedStatus !== 'all' || selectedPriority !== 'all'
                                ? 'Try adjusting your filters to see more results.'
                                : 'Click "Schedule Maintenance" to create your first maintenance task.'}
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredRecords.map((record) => (
                          <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-slate-900">{record.asset_name}</div>
                              <div className="text-xs text-slate-500">{record.id} • {record.asset_id}</div>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5 text-sm text-slate-700">
                                {getTypeIcon(record.type)}
                                <span>{record.type}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusClasses(record.status)}`}>
                                {record.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getPriorityClasses(record.priority)}`}>
                                {record.priority}
                              </span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-655 uppercase border border-slate-200">
                                  {record.assigned_technician?.charAt(0) || 'T'}
                                </div>
                                <span className="text-sm text-slate-750 font-medium">{record.assigned_technician}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">
                              {new Date(record.scheduled_date).toLocaleDateString()}
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">
                              <div>{record.actual_duration || record.estimated_duration}h</div>
                              {record.actual_duration && (
                                <span className="text-[10px] text-slate-400 block">Est: {record.estimated_duration}h</span>
                              )}
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                              ₹{Number((record.actual_cost || record.estimated_cost) || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-right text-sm">
                              <div className="inline-flex gap-1.5">
                                <button
                                  onClick={() => handleViewRecord(record)}
                                  title="View Details"
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                >
                                  <EyeIcon className="w-4.5 h-4.5" />
                                </button>
                                <button
                                  onClick={() => handleEditRecord(record)}
                                  title="Update Status"
                                  className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                >
                                  <PencilSquareIcon className="w-4.5 h-4.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Calendar View Tab content */}
            {tabValue === 2 && (
              <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs text-center space-y-4">
                <ClockIcon className="w-14 h-14 mx-auto text-slate-450 stroke-1" />
                <h3 className="text-lg font-bold text-slate-900">Calendar View Coming Soon</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  View maintenance schedule in a calendar format with drag-and-drop functionality.
                </p>
                {upcomingMaintenance.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 text-left">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Upcoming Maintenance:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {upcomingMaintenance.map((record) => (
                        <button
                          key={record.id}
                          onClick={() => handleViewRecord(record)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                        >
                          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                          <span>{record.asset_name} - {new Date(record.scheduled_date).toLocaleDateString()}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reports Tab content */}
            {tabValue === 3 && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                <h3 className="text-lg font-bold text-slate-900 mb-5">Maintenance Reports</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Card 1 */}
                  <div className="border border-slate-200 rounded-xl p-5 hover:shadow-xs transition-shadow">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm mb-2">
                      <ChartBarIcon className="w-5 h-5 text-indigo-500" />
                      Maintenance Trends
                    </div>
                    <p className="text-xs text-slate-500 mb-3">View maintenance frequency and cost trends over time</p>
                    <div className="text-2xl font-bold text-slate-900">{stats.totalRecords}</div>
                    <span className="text-[10px] text-slate-400">Total Records</span>
                  </div>

                  {/* Card 2 */}
                  <div className="border border-slate-200 rounded-xl p-5 hover:shadow-xs transition-shadow">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm mb-2">
                      <UserIcon className="w-5 h-5 text-emerald-500" />
                      Technician Performance
                    </div>
                    <p className="text-xs text-slate-500 mb-3">Compare technician efficiency and completion rates</p>
                    <div className="text-2xl font-bold text-slate-900">{stats.completed}</div>
                    <span className="text-[10px] text-slate-400">Completed Tasks</span>
                  </div>

                  {/* Card 3 */}
                  <div className="border border-slate-200 rounded-xl p-5 hover:shadow-xs transition-shadow">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm mb-2">
                      <BanknotesIcon className="w-5 h-5 text-teal-500" />
                      Cost Analysis
                    </div>
                    <p className="text-xs text-slate-500 mb-3">Breakdown of maintenance costs by asset type</p>
                    <div className="text-2xl font-bold text-slate-900">
                      ₹{Number(stats.totalCost || 0).toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] text-slate-400">Total Cost</span>
                  </div>

                  {/* Card 4 */}
                  <div className="border border-slate-200 rounded-xl p-5 hover:shadow-xs transition-shadow">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm mb-2">
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                      Overdue Tasks
                    </div>
                    <p className="text-xs text-slate-500 mb-3">Track overdue maintenance tasks and impact</p>
                    <div className="text-2xl font-bold text-red-650">{stats.overdue}</div>
                    <span className="text-[10px] text-slate-400">Overdue Items</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Upcoming/Technicians Panel */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Upcoming This Week */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                <BellIcon className="w-5 h-5 text-indigo-500" />
                Upcoming This Week
              </h3>
              <div className="mt-4 space-y-4">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse space-y-2">
                      <div className="h-4 bg-slate-100 rounded w-2/3" />
                      <div className="h-3 bg-slate-50 rounded w-1/2" />
                    </div>
                  ))
                ) : upcomingMaintenance.length === 0 ? (
                  <div className="text-center py-6 text-slate-450 text-xs">
                    No maintenance scheduled for this week
                  </div>
                ) : (
                  upcomingMaintenance.map((record) => (
                    <div
                      key={record.id}
                      onClick={() => handleViewRecord(record)}
                      className="flex gap-3 items-start group cursor-pointer hover:bg-slate-50/55 p-1 rounded-lg transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 mt-0.5 group-hover:bg-indigo-50 group-hover:text-indigo-650 transition-colors">
                        {getTypeIcon(record.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-semibold text-slate-900 truncate group-hover:text-indigo-650 transition-colors">
                          {record.asset_name}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{record.description}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(record.scheduled_date).toLocaleDateString()} • {record.assigned_technician}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Technicians Workload */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                <UserIcon className="w-5 h-5 text-indigo-500" />
                Technician Workload
              </h3>
              <div className="mt-4 space-y-4">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse space-y-2">
                      <div className="h-3 bg-slate-100 rounded w-1/3" />
                      <div className="h-2 bg-slate-50 rounded w-full" />
                    </div>
                  ))
                ) : technicians.length === 0 ? (
                  <div className="text-center py-6 text-slate-450 text-xs">
                    No technicians available
                  </div>
                ) : (
                  technicians.map((tech) => {
                    const workloadPercent = Math.min((tech.current_workload / 15) * 100, 100);
                    const workloadColorClass = 
                      tech.current_workload > 10 
                        ? 'bg-rose-500' 
                        : tech.current_workload > 5 
                        ? 'bg-amber-500' 
                        : 'bg-emerald-500';

                    return (
                      <div key={tech.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-800">{tech.name}</span>
                          <span className="text-slate-500">{tech.current_workload} tasks</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${workloadColorClass}`}
                            style={{ width: `${workloadPercent}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {tech.specialization.join(', ')} • ⭐ {tech.rating}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Modal: Schedule Maintenance */}
        <MaintenanceModal
          open={scheduleMaintenanceOpen}
          onClose={() => setScheduleMaintenanceOpen(false)}
          onSubmit={handleMaintenanceScheduled}
        />

        {/* Modal: View Details */}
        {viewDialogOpen && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 max-w-2xl w-full shadow-card-xl p-6 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Maintenance Record Details</h3>
                <button
                  onClick={() => setViewDialogOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto py-4 space-y-5 flex-1 pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Asset Name</span>
                    <span className="text-sm font-semibold text-slate-900 mt-0.5 block">{selectedRecord.asset_name}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Asset ID</span>
                    <span className="text-sm font-semibold text-slate-900 mt-0.5 block">{selectedRecord.asset_id}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Maintenance Type</span>
                    <div className="inline-flex items-center gap-1.5 mt-1">
                      {getTypeIcon(selectedRecord.type)}
                      <span className="text-sm text-slate-805 font-medium">{selectedRecord.type}</span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Status</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusClasses(selectedRecord.status)}`}>
                      {selectedRecord.status}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Priority</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getPriorityClasses(selectedRecord.priority)}`}>
                      {selectedRecord.priority}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Technician</span>
                    <span className="text-sm font-medium text-slate-900 mt-0.5 block">{selectedRecord.assigned_technician}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Scheduled Date</span>
                    <span className="text-sm text-slate-900 mt-0.5 block">
                      {new Date(selectedRecord.scheduled_date).toLocaleString()}
                    </span>
                  </div>
                  {selectedRecord.completed_date && (
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Date</span>
                      <span className="text-sm text-slate-900 mt-0.5 block">
                        {new Date(selectedRecord.completed_date).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated Duration</span>
                    <span className="text-sm text-slate-900 mt-0.5 block">{selectedRecord.estimated_duration} hours</span>
                  </div>
                  {selectedRecord.actual_duration && (
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Actual Duration</span>
                      <span className="text-sm text-slate-900 mt-0.5 block">{selectedRecord.actual_duration} hours</span>
                    </div>
                  )}
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated Cost</span>
                    <span className="text-sm text-slate-900 mt-0.5 block">₹{selectedRecord.estimated_cost.toLocaleString()}</span>
                  </div>
                  {selectedRecord.actual_cost && (
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Actual Cost</span>
                      <span className="text-sm text-slate-900 mt-0.5 block">₹{selectedRecord.actual_cost.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</span>
                    <span className="text-sm text-slate-900 mt-1 block whitespace-pre-wrap">{selectedRecord.description}</span>
                  </div>
                  {selectedRecord.notes && (
                    <div className="sm:col-span-2">
                      <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Notes</span>
                      <span className="text-sm text-slate-900 mt-1 block whitespace-pre-wrap">{selectedRecord.notes}</span>
                    </div>
                  )}
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Downtime Impact</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      selectedRecord.downtime_impact === 'High' 
                        ? 'bg-rose-50 text-rose-705 border-rose-200' 
                        : selectedRecord.downtime_impact === 'Medium' 
                        ? 'bg-amber-50 text-amber-705 border-amber-200' 
                        : 'bg-emerald-50 text-emerald-705 border-emerald-200'
                    }`}>
                      {selectedRecord.downtime_impact}
                    </span>
                  </div>
                  {selectedRecord.next_maintenance_date && (
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Next Maintenance</span>
                      <span className="text-sm text-slate-900 mt-0.5 block">
                        {new Date(selectedRecord.next_maintenance_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setViewDialogOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Edit Status */}
        {editDialogOpen && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-card-xl p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Update Maintenance Status</h3>
                <button
                  onClick={() => setEditDialogOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Asset: {selectedRecord.asset_name}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Current Status: <span className="font-semibold text-slate-705">{selectedRecord.status}</span>
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleUpdateStatus(selectedRecord.id, 'In Progress')}
                  disabled={selectedRecord.status === 'In Progress'}
                  className="w-full justify-center px-4 py-2 text-sm font-semibold text-sky-750 bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Mark as In Progress
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedRecord.id, 'Completed')}
                  disabled={selectedRecord.status === 'Completed'}
                  className="w-full justify-center px-4 py-2 text-sm font-semibold text-emerald-750 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Mark as Completed
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedRecord.id, 'Cancelled')}
                  disabled={selectedRecord.status === 'Cancelled'}
                  className="w-full justify-center px-4 py-2 text-sm font-semibold text-rose-750 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Cancel Maintenance
                </button>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setEditDialogOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-750 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MaintenancePage;