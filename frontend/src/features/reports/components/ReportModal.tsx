import {
    AdjustmentsHorizontalIcon,
    ArrowDownTrayIcon,
    ArrowPathIcon,
    DocumentChartBarIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../../services/api';

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
    { value: 'pdf', label: 'PDF' },
    { value: 'excel', label: 'Excel' },
    { value: 'csv', label: 'CSV' },
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

  if (!open) return null;

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFilterChange = (filterType: string, selectedOptions: HTMLSelectElement) => {
    const values = Array.from(selectedOptions.selectedOptions, (option) => option.value);
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const selectedReportType = reportTypes.find(rt => rt.value === formData.report_type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-xs text-slate-655">
      <div className="bg-white rounded-2xl border border-slate-100 max-w-4xl w-full h-[90vh] flex flex-col shadow-card-xl animate-fade-in-up">
        
        {/* Title Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-1.5 font-bold font-display text-slate-900 text-sm">
            <DocumentChartBarIcon className="w-5 h-5 text-brand-600" />
            Generate Report
          </div>
          <button onClick={onClose} disabled={generating} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Report Type */}
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Report Category</h4>
              <div>
                <label className="block font-semibold text-slate-655 mb-1">Select Report Type *</label>
                <select
                  value={formData.report_type}
                  onChange={(e) => handleInputChange('report_type', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
                  disabled={generating}
                >
                  <option value="">Choose Type...</option>
                  {reportTypes.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              {selectedReportType && (
                <div className="p-3 bg-sky-50 border border-sky-100 text-sky-850 rounded-xl leading-relaxed">
                  {selectedReportType.description}
                </div>
              )}
            </div>

            {/* Date range & format */}
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Date Scope & Export Format</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Date Range</label>
                  <select
                    value={formData.date_range}
                    onChange={(e) => handleInputChange('date_range', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
                    disabled={generating}
                  >
                    {dateRanges.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>

                {formData.date_range === 'custom' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-655 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={formData.custom_start_date}
                        onChange={(e) => handleInputChange('custom_start_date', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                        disabled={generating}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-655 mb-1">End Date</label>
                      <input
                        type="date"
                        value={formData.custom_end_date}
                        onChange={(e) => handleInputChange('custom_end_date', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                        disabled={generating}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Output Format</label>
                  <select
                    value={formData.format}
                    onChange={(e) => handleInputChange('format', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
                    disabled={generating}
                  >
                    {formats.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <AdjustmentsHorizontalIcon className="w-4.5 h-4.5 text-slate-500" />
                Scope Filters (Ctrl+Click to multiselect)
              </h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Locations</label>
                  <select
                    multiple
                    value={formData.filters.locations}
                    onChange={(e) => handleFilterChange('locations', e.target)}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white h-20"
                    disabled={generating}
                  >
                    {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Categories</label>
                  <select
                    multiple
                    value={formData.filters.categories}
                    onChange={(e) => handleFilterChange('categories', e.target)}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white h-20"
                    disabled={generating}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Options switches */}
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Report Options</h4>
              
              <div className="flex flex-col gap-3 font-semibold text-slate-655">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.include_charts}
                    onChange={(e) => handleInputChange('include_charts', e.target.checked)}
                    disabled={generating}
                    className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                  />
                  Include Charts & Visualizations
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.include_summary}
                    onChange={(e) => handleInputChange('include_summary', e.target.checked)}
                    disabled={generating}
                    className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                  />
                  Include Executive Summary
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.schedule_delivery}
                    onChange={(e) => handleInputChange('schedule_delivery', e.target.checked)}
                    disabled={generating}
                    className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                  />
                  Schedule Automatic Email Delivery
                </label>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">Report Metadata</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-655 mb-1">Custom Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder={generateReportTitle() || 'Inventory Summary...'}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                  disabled={generating}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Custom Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter brief description of this run..."
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                  disabled={generating}
                />
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {generating && (
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <ArrowPathIcon className="w-4.5 h-4.5 text-brand-600 animate-spin" />
                Generating Report Assets...
              </h4>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-brand-600 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[10px] text-slate-400 font-semibold">{Math.round(progress)}% Complete</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0 bg-slate-50/50 font-semibold">
          <button
            onClick={onClose}
            disabled={generating}
            className="px-4 py-2 border border-slate-205 text-slate-705 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={generating || !formData.report_type}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg cursor-pointer shadow-brand"
          >
            <ArrowDownTrayIcon className="w-4.5 h-4.5" />
            {generating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;