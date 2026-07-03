import {
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import api from '../../../services/api';

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; error: string; data: any }[];
}

const BulkImportPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const steps = ['Download Template', 'Upload File', 'Review & Import', 'Complete'];

  const handleDownloadTemplate = async (format: 'csv' | 'xlsx') => {
    try {
      const response = await api.get(`/bulk-operations/template?format=${format}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `asset-import-template.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Template downloaded successfully (${format.toUpperCase()})`);
      setActiveStep(1);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) { /* Error handled by API interceptor */ }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      try {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          toast.error('File appears to be empty or has no data rows');
          return;
        }

        const headerLine = lines[0];
        const headers = headerLine.split(',').map(h => 
          h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/\s+/g, '_')
        );
        
        const requiredFields = ['name', 'unique_asset_id', 'asset_type'];
        const missingFields = requiredFields.filter(field => !headers.includes(field));
        
        if (missingFields.length > 0) {
          toast.error(`Missing required columns: ${missingFields.join(', ')}`);
          return;
        }
        
        const preview: any[] = [];
        const maxPreview = Math.min(6, lines.length);
        
        for (let i = 1; i < maxPreview; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (const char of line) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim());
          
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index]?.replace(/^"|"$/g, '') || '';
          });
          
          const errors: string[] = [];
          if (!row.name) errors.push('name');
          if (!row.unique_asset_id) errors.push('unique_asset_id');
          if (!row.asset_type) errors.push('asset_type');
          
          const status = errors.length === 0 
            ? 'Valid' 
            : `Missing: ${errors.join(', ')}`;
          
          preview.push({
            name: row.name,
            unique_asset_id: row.unique_asset_id,
            asset_type: row.asset_type,
            manufacturer: row.manufacturer || '-',
            model: row.model || '-',
            status
          });
        }
        
        setPreviewData(preview);
        const validRows = preview.filter(p => p.status === 'Valid').length;
        toast.success(`File "${file.name}" loaded successfully (${validRows}/${preview.length} rows valid in preview)`);
        setActiveStep(2);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error: any) { /* Error handled by API interceptor */ }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to import');
      return;
    }

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await api.post('/bulk-operations/import-assets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const result = response.data.data || response.data;
      setImportResult({
        success: result.success || result.successCount || 0,
        failed: result.failed || result.failedCount || 0,
        errors: result.errors || []
      });
      setActiveStep(3);
      
      const successCount = result.success || result.successCount || 0;
      if (successCount > 0) {
        toast.success(`Import completed: ${successCount} assets imported successfully`);
      } else {
        toast.warning('Import completed but no assets were created');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Import failed';
      toast.error(errorMsg);
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedFile(null);
    setPreviewData([]);
    setImportResult(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-905">Bulk Asset Import</h2>
          <p className="text-sm text-slate-500 mt-1">Import multiple assets at once using CSV or Excel files</p>
        </div>

        {/* Stepper Card */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((label, idx) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                  idx <= activeStep 
                    ? 'bg-brand-600 text-white shadow-brand' 
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {idx + 1}
                </div>
                <span className={`text-xs font-semibold hidden sm:inline ${
                  idx <= activeStep ? 'text-slate-900 font-bold' : 'text-slate-400'
                }`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Steps Content Area */}
        <div className="space-y-6">
          {activeStep === 0 && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6 space-y-6">
              <div>
                <h3 className="text-base font-semibold font-display text-slate-900">Step 1: Download Template</h3>
                <hr className="border-slate-100 mt-2" />
              </div>

              <div className="p-4 bg-sky-50 border border-sky-100 text-sky-850 rounded-xl flex items-start gap-3">
                <InformationCircleIcon className="w-5 h-5 text-sky-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs leading-relaxed">
                  Download the template file and fill in your asset data. Make sure to follow the format exactly.
                </p>
              </div>

              <div className="text-xs space-y-2 text-slate-655 max-w-xl bg-slate-50 p-4 border border-slate-100 rounded-xl">
                <p className="font-bold text-slate-800">Required fields:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>name</strong> - Asset name</li>
                  <li><strong>unique_asset_id</strong> - Unique asset identifier</li>
                  <li><strong>asset_type</strong> - Asset type/category</li>
                </ul>
                <p className="font-bold text-slate-808 pt-2">Optional fields:</p>
                <p className="leading-relaxed">
                  category, manufacturer, model, serial_number, purchase_date (YYYY-MM-DD), purchase_cost (₹), warranty_expiry, status (Available/Active/Under Maintenance), condition (Excellent/Good/Fair/Poor/Damaged), location, department, description.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2 text-xs">
                <button
                  onClick={() => handleDownloadTemplate('csv')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl cursor-pointer"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Download CSV Template
                </button>
                <button
                  onClick={() => handleDownloadTemplate('xlsx')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl cursor-pointer"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 text-slate-500" />
                  Download Excel Template
                </button>
              </div>
            </div>
          )}

          {activeStep === 1 && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6 space-y-6">
              <div>
                <h3 className="text-base font-semibold font-display text-slate-900">Step 2: Upload File</h3>
                <hr className="border-slate-100 mt-2" />
              </div>

              <div
                className="border-2 border-dashed border-slate-200 hover:border-brand-500 rounded-xl p-8 text-center cursor-pointer transition-all bg-white"
                onClick={() => document.getElementById('bulk-import-file-upload-2')?.click()}
              >
                <input
                  id="bulk-import-file-upload-2"
                  type="file"
                  hidden
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                />
                <ArrowUpTrayIcon className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                <p className="font-semibold text-slate-700 text-sm">Drag and drop your file here or click to browse</p>
                <p className="text-xs text-slate-400 mt-1">Supported formats: CSV, Excel (.xlsx, .xls)</p>
              </div>

              {selectedFile && (
                <div className="p-3.5 bg-green-50 border border-green-100 text-green-800 rounded-xl text-xs">
                  File selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(2)} KB)
                </div>
              )}
            </div>
          )}

          {activeStep === 2 && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6 space-y-6">
              <div>
                <h3 className="text-base font-semibold font-display text-slate-900">Step 3: Review & Import</h3>
                <hr className="border-slate-100 mt-2" />
              </div>

              <div className="p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl flex items-start gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs leading-relaxed">
                  Please review the data below before importing. Assets with validation errors will be skipped.
                </p>
              </div>

              <div className="overflow-x-auto border border-slate-50 rounded-xl">
                <table className="w-full text-left border-collapse min-w-[700px] text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase">
                      <th className="pb-3 pt-2 pl-4">Name</th>
                      <th className="pb-3 pt-2">Asset ID</th>
                      <th className="pb-3 pt-2">Type</th>
                      <th className="pb-3 pt-2">Manufacturer</th>
                      <th className="pb-3 pt-2">Model</th>
                      <th className="pb-3 pt-2 pr-4 text-center">Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {previewData.map((row, index) => (
                      <tr key={index} className="hover:bg-slate-55/50">
                        <td className="py-3 pl-4 font-medium text-slate-900">{row.name || '-'}</td>
                        <td className="py-3 font-mono text-[10px]">{row.unique_asset_id || '-'}</td>
                        <td className="py-3">{row.asset_type || '-'}</td>
                        <td className="py-3">{row.manufacturer || '-'}</td>
                        <td className="py-3">{row.model || '-'}</td>
                        <td className="py-3 pr-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            row.status === 'Valid' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center gap-3 pt-2 text-xs">
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold rounded-xl cursor-pointer"
                >
                  {importing ? 'Importing...' : 'Import Assets'}
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-750 font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {activeStep === 3 && importResult && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6 space-y-6">
              <div>
                <h3 className="text-base font-semibold font-display text-slate-900">Import Complete</h3>
                <hr className="border-slate-100 mt-2" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                <div className="p-4 bg-green-50 border border-green-100 text-green-800 rounded-xl flex items-center gap-3">
                  <CheckCircleIcon className="w-8 h-8 text-green-600 flex-shrink-0" />
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">{importResult.success}</h4>
                    <p className="text-slate-500 font-normal">Successfully Imported</p>
                  </div>
                </div>

                <div className="p-4 bg-red-50 border border-red-105 text-red-800 rounded-xl flex items-center gap-3">
                  <XCircleIcon className="w-8 h-8 text-red-600 flex-shrink-0" />
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">{importResult.failed}</h4>
                    <p className="text-slate-500 font-normal">Failed Rows</p>
                  </div>
                </div>

                <div className="p-4 bg-sky-50 border border-sky-100 text-sky-800 rounded-xl flex items-center gap-3">
                  <InformationCircleIcon className="w-8 h-8 text-sky-600 flex-shrink-0" />
                  <div>
                    <h4 className="text-xl font-bold text-slate-905">{importResult.success + importResult.failed}</h4>
                    <p className="text-slate-500 font-normal">Total Processed</p>
                  </div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl flex items-start gap-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs leading-relaxed">
                      {importResult.errors.length} row(s) failed to import. Please review the errors below and correct your template data.
                    </p>
                  </div>

                  <div className="overflow-x-auto max-h-[300px] border border-slate-50 rounded-xl">
                    <table className="w-full text-left border-collapse min-w-[600px] text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase">
                          <th className="pb-3 pt-2 pl-4">Row #</th>
                          <th className="pb-3 pt-2">Error Message</th>
                          <th className="pb-3 pt-2">Asset ID</th>
                          <th className="pb-3 pt-2 pr-4">Name</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-slate-700">
                        {importResult.errors.map((error, index) => (
                          <tr key={index} className="hover:bg-slate-55/50">
                            <td className="py-3 pl-4 font-bold">{error.row}</td>
                            <td className="py-3 text-red-650 font-medium">{error.error}</td>
                            <td className="py-3 font-mono text-[10px]">{error.data?.unique_asset_id || '-'}</td>
                            <td className="py-3 pr-4">{error.data?.name || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Import More Assets
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BulkImportPage;
