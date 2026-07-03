import {
    ArrowDownTrayIcon,
    ArrowLeftIcon,
    ArrowPathIcon,
    ChartBarIcon,
    CheckIcon,
    CircleStackIcon,
    DocumentTextIcon,
    FunnelIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import api from '../../../services/api';

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
  {/* eslint-disable-next-line react-hooks/exhaustive-deps */}
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      toast.error('Failed to load saved reports');
      setSavedReports([]);
    }
  };

  const loadAvailableFields = () => {
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
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">Select Data Source</h3>
              <p className="text-xs text-slate-500 mt-1">Choose the primary database schema for your custom report</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dataSources.map((source) => (
                <div 
                  key={source.id}
                  onClick={() => setSelectedDataSource(source.id)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    selectedDataSource === source.id
                      ? 'border-brand-600 bg-brand-50/20 ring-1 ring-brand-500'
                      : 'border-slate-100 bg-white hover:border-slate-200 shadow-card'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                          <CircleStackIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{source.name}</h4>
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold text-[9px] uppercase">
                            {source.type}
                          </span>
                        </div>
                      </div>
                      {selectedDataSource === source.id && (
                        <CheckIcon className="w-5 h-5 text-brand-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-normal">{source.description}</p>
                  </div>
                  <div className="border-t border-slate-100/60 pt-3 mt-4 text-[10px] text-slate-400 font-mono">
                    Tables: {source.tables.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">Select Fields & Configure Filters</h3>
              <p className="text-xs text-slate-500 mt-1">Check the columns to include in your output and optionally apply rules</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fields List */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Available Fields</h4>
                <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-50 pr-1">
                  {availableFields.map((field) => (
                    <label key={field.id} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field.id)}
                        onChange={() => handleFieldToggle(field.id)}
                        className="w-4 h-4 rounded text-brand-600 border-slate-305 focus:ring-brand-500"
                      />
                      <div>
                        <p className="text-xs font-semibold text-slate-950">{field.name}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{field.type} • Source: {field.source}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Filters Config */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Filters ({filters.length})</h4>
                  <button
                    onClick={addFilter}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    <FunnelIcon className="w-3.5 h-3.5" />
                    Add Filter
                  </button>
                </div>
                
                <div className="max-h-[290px] overflow-y-auto space-y-3 pr-1">
                  {filters.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      No query filter conditions added yet. All records will be selected.
                    </div>
                  ) : (
                    filters.map((filter) => (
                      <div key={filter.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 relative pr-6">
                        <div className="col-span-4">
                          <select
                            value={filter.field}
                            onChange={(e) => updateFilter(filter.id, { field: e.target.value })}
                            className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white"
                          >
                            <option value="">Choose Field</option>
                            {availableFields.map((field) => (
                              <option key={field.id} value={field.name}>
                                {field.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-4">
                          <select
                            value={filter.operator}
                            onChange={(e) => updateFilter(filter.id, { operator: e.target.value })}
                            className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white"
                          >
                            <option value="equals">Equals</option>
                            <option value="contains">Contains</option>
                            <option value="greater">Greater Than</option>
                            <option value="less">Less Than</option>
                          </select>
                        </div>
                        <div className="col-span-4">
                          <input
                            type="text"
                            placeholder="Value..."
                            value={filter.value}
                            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                            className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg"
                          />
                        </div>
                        <button
                          onClick={() => removeFilter(filter.id)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-600 font-bold text-sm cursor-pointer"
                        >
                          &times;
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">Choose Visualization Type</h3>
              <p className="text-xs text-slate-500 mt-1">Select the format style to layout your report metrics</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div 
                onClick={() => setReportType('table')}
                className={`p-5 rounded-2xl border text-center cursor-pointer transition-all ${
                  reportType === 'table'
                    ? 'border-brand-600 bg-brand-50/20 ring-1 ring-brand-500'
                    : 'border-slate-100 bg-white hover:border-slate-205 shadow-card'
                }`}
              >
                <DocumentTextIcon className="w-10 h-10 mx-auto text-brand-600 mb-2" />
                <h4 className="font-bold text-slate-900 text-sm">Table Report</h4>
                <p className="text-[11px] text-slate-400 mt-1">Traditional rows and columns spreadsheet grid layout</p>
              </div>
              
              <div 
                onClick={() => setReportType('chart')}
                className={`p-5 rounded-2xl border text-center cursor-pointer transition-all ${
                  reportType === 'chart'
                    ? 'border-brand-600 bg-brand-50/20 ring-1 ring-brand-500'
                    : 'border-slate-100 bg-white hover:border-slate-205 shadow-card'
                }`}
              >
                <ChartBarIcon className="w-10 h-10 mx-auto text-green-600 mb-2" />
                <h4 className="font-bold text-slate-900 text-sm">Chart Report</h4>
                <p className="text-[11px] text-slate-400 mt-1">Visual bars, pies and line graphs for analytics analysis</p>
              </div>
              
              <div 
                onClick={() => setReportType('dashboard')}
                className={`p-5 rounded-2xl border text-center cursor-pointer transition-all ${
                  reportType === 'dashboard'
                    ? 'border-brand-600 bg-brand-50/20 ring-1 ring-brand-500'
                    : 'border-slate-100 bg-white hover:border-slate-205 shadow-card'
                }`}
              >
                <ChartBarIconCustom className="w-10 h-10 mx-auto text-amber-600 mb-2" />
                <h4 className="font-bold text-slate-900 text-sm">Dashboard Layout</h4>
                <p className="text-[11px] text-slate-400 mt-1">Interactive tiles with multi-chart canvas configurations</p>
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Report Name *</label>
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. Asset_Utilization_Q3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Summarize the report output context..."
                  rows={2}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">Schedule & Recipients</h3>
              <p className="text-xs text-slate-500 mt-1">Configure automated run frequencies and delivery inbox targets</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Run Frequency *</label>
                  <select
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option value="manual">Manual (On-demand)</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Recipients</label>
                  <textarea
                    rows={2}
                    value={recipients.join(', ')}
                    onChange={(e) => setRecipients(e.target.value.split(',').map(email => email.trim()))}
                    placeholder="manager@company.com, auditor@company.com"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Recipients will receive the report via email when scheduled</p>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-3">
                <h4 className="text-xs font-bold font-display uppercase tracking-wider text-slate-500">Report Draft Summary</h4>
                <div className="text-xs text-slate-655 space-y-1.5">
                  <p><strong>Name:</strong> {reportName || 'Untitled Report'}</p>
                  <p><strong>Data Source:</strong> {dataSources.find(ds => ds.id === selectedDataSource)?.name || 'None'}</p>
                  <p><strong>Columns Chosen:</strong> {selectedFields.length} selected</p>
                  <p><strong>Query Constraints:</strong> {filters.length} filters applied</p>
                  <p><strong>Visual Layout:</strong> {reportType}</p>
                  <p><strong>Run Trigger:</strong> {schedule}</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold font-display text-slate-900">
              Custom Reports
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Create custom reports with advanced filtering and visualization options
            </p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Analytics
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Builder Step Form */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6 lg:col-span-8 space-y-6">
            <h3 className="text-lg font-bold font-display text-slate-900">Report Builder</h3>
            
            {/* Stepper Progress bar */}
            <div className="flex items-center justify-between max-w-lg mx-auto relative mb-6">
              {steps.map((label, index) => (
                <div key={label} className="flex flex-col items-center z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs transition-all duration-300 ${
                    activeStep > index
                      ? 'bg-green-600 text-white'
                      : activeStep === index
                      ? 'bg-brand-650 text-white shadow-brand'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {activeStep > index ? <CheckIcon className="w-4 h-4" /> : index + 1}
                  </div>
                  <span className="text-[10px] text-slate-550 mt-1.5 text-center hidden sm:block">{label}</span>
                </div>
              ))}
              <div className="absolute top-4 left-[8%] right-[8%] h-0.5 bg-slate-100 z-0">
                <div 
                  className="h-full bg-brand-600 transition-all duration-305" 
                  style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Step Body */}
            <div className="pt-2">{getStepContent(activeStep)}</div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <button
                disabled={activeStep === 0}
                onClick={handleBack}
                className="px-4 py-2 border border-slate-200 text-slate-705 text-sm font-semibold rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
              >
                Back
              </button>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPreviewDialog(true)}
                  disabled={selectedFields.length === 0}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Preview Layout
                </button>
                
                {activeStep === steps.length - 1 ? (
                  <button
                    onClick={handleSaveReport}
                    className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-brand transition-colors cursor-pointer"
                  >
                    Save Report
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="px-5 py-2.5 bg-brand-650 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-brand transition-colors cursor-pointer"
                  >
                    Next Step
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Saved Custom Reports Panel */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 lg:col-span-4 space-y-4 self-start">
            <div className="flex items-center justify-between pb-2 border-b border-slate-50">
              <h3 className="font-bold font-display text-slate-900 text-sm">
                Saved Reports ({savedReports.length})
              </h3>
              <button
                onClick={loadSavedReports}
                className="p-1 rounded hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <ArrowPathIcon className="w-4 h-4" />
              </button>
            </div>
            
            <ul className="divide-y divide-slate-50">
              {savedReports.map((report) => (
                <li key={report.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {report.type === 'table' && <DocumentTextIcon className="w-4 h-4 text-brand-600" />}
                    {report.type === 'chart' && <ChartBarIcon className="w-4 h-4 text-green-600" />}
                    {report.type === 'dashboard' && <ChartBarIconCustom className="w-4 h-4 text-amber-600" />}
                    <div>
                      <p className="font-semibold text-slate-900">{report.name}</p>
                      <p className="text-[10px] text-slate-400">Created: {new Date(report.created).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button className="p-1 text-slate-400 hover:text-slate-750">
                    <ArrowDownTrayIcon className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
            
            {savedReports.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs">
                No custom reports created yet. Complete the wizard to save one.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      {previewDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-lg w-full shadow-card-xl p-6 space-y-4 animate-fade-in-up">
            <h3 className="text-lg font-bold font-display text-slate-900">Report Preview</h3>
            
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-100 text-sky-850 text-xs">
              This represents a layout outline of your columns. Live queries are performed at report runtime.
            </div>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-1.5">Columns Selected:</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFields.map((fieldId) => {
                    const field = availableFields.find(f => f.id === fieldId);
                    return field ? (
                      <span key={fieldId} className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-700 font-semibold border">
                        {field.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
              
              {filters.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-1">Filters:</h4>
                  <ul className="space-y-1 text-xs text-slate-500">
                    {filters.map((filter) => (
                      <li key={filter.id}>
                        {/* eslint-disable-next-line react/no-unescaped-entities */}
                        &bull; {filter.field} <span className="font-semibold text-slate-700">{filter.operator}</span> "{filter.value}"
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setPreviewDialog(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => setPreviewDialog(false)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Continue Building
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

// Custom Pie/Dashboard icon replacement helper
const ChartBarIconCustom = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
  </svg>
);

export default AdminCustomReportsPage;