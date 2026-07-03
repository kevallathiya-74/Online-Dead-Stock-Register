import {
    AdjustmentsHorizontalIcon,
    ArrowDownTrayIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import api from '../../../services/api';

interface DisposalRecord {
  id: string;
  asset_id: string;
  asset_name: string;
  category: string;
  disposal_date: string;
  disposal_method: string;
  disposal_value: number;
  approved_by: string;
  document_reference: string;
  status: string;
  remarks: string;
}

const DisposalRecordsPage: React.FC = () => {
  const [records, setRecords] = useState<DisposalRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [viewModalOpen, setViewModalOpen] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<DisposalRecord | null>(null);

  useEffect(() => {
    fetchDisposalRecords();
  }, []);

  const fetchDisposalRecords = async () => {
    try {
      setLoading(true);
      const response = await api.get('/inventory/disposal-records');
      if (response.data?.success && response.data?.data) {
        setRecords(response.data.data);
      } else {
        setRecords([]);
        toast.error('No disposal records found');
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      setRecords([]);
      toast.error('Failed to load disposal records');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter((record) =>
    searchTerm === '' ||
    record.asset_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.disposal_method?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.approved_by?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-50 text-green-700 border border-green-105';
      case 'in_progress': return 'bg-blue-50 text-blue-700 border border-blue-105';
      case 'pending': return 'bg-amber-50 text-amber-705 border border-amber-100';
      default: return 'bg-slate-50 text-slate-705 border border-slate-105';
    }
  };

  const handleExport = () => {
    toast.info('Export functionality will be implemented');
  };

  const handleViewDetails = (record: DisposalRecord) => {
    setSelectedRecord(record);
    setViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setViewModalOpen(false);
    setSelectedRecord(null);
  };

  const handleDownloadDocument = async (docRef: string, assetId: string) => {
    try {
      const response = await api.get(`/inventory/disposal-records/${assetId}/document`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Disposal_${docRef}_${assetId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Document downloaded successfully');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      const record = records.find(r => r.document_reference === docRef);
      if (record) {
        const content = `DISPOSAL RECORD DOCUMENT\n\n` +
          `Document Reference: ${docRef}\n` +
          `Asset ID: ${record.asset_id}\n` +
          `Asset Name: ${record.asset_name}\n` +
          `Category: ${record.category}\n` +
          `Disposal Date: ${new Date(record.disposal_date).toLocaleDateString()}\n` +
          `Disposal Method: ${record.disposal_method}\n` +
          `Disposal Value: ₹${record.disposal_value}\n` +
          `Approved By: ${record.approved_by}\n` +
          `Status: ${record.status.toUpperCase()}\n` +
          `Remarks: ${record.remarks || 'N/A'}\n`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Disposal_${docRef}_${record.asset_id}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Document downloaded as text file');
      } else {
        toast.error('Failed to download document');
      }
    }
  };

  const totalDisposalValue = filteredRecords.reduce((sum, record) => sum + (record.disposal_value || 0), 0);
  const completedDisposals = filteredRecords.filter(r => r.status === 'completed').length;

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-655">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-905">Disposal Records</h2>
            <p className="text-slate-455 mt-1">Audit log of decommissioned, scrap, and sold inventory stock items</p>
          </div>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-205 text-slate-700 font-semibold rounded-xl bg-white hover:bg-slate-50 cursor-pointer"
          >
            <ArrowDownTrayIcon className="w-4.5 h-4.5" />
            Export Report
          </button>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Disposal Records</p>
            <h3 className="text-xl font-bold font-display text-slate-905 mt-1">{filteredRecords.length}</h3>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Disposal Recoveries</p>
            <h3 className="text-xl font-bold font-display text-green-700 mt-1">
              ₹{Number(totalDisposalValue || 0).toLocaleString('en-IN')}
            </h3>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400">Completed Disposals</p>
            <h3 className="text-xl font-bold font-display text-blue-700 mt-1">{completedDisposals}</h3>
          </div>
        </div>

        {/* Search controls */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-card flex items-center justify-between gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <MagnifyingGlassIcon className="w-4.5 h-4.5" />
            </span>
            <input
              type="text"
              placeholder="Search disposal records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-205 rounded-xl bg-slate-50/50"
            />
          </div>
          <button className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-205 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer">
            <AdjustmentsHorizontalIcon className="w-4.5 h-4.5" />
            Filters
          </button>
        </div>

        {/* Disposal Table */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-bold text-slate-905 font-display mb-3">Decommissioned Assets Registry</h3>
          
          <div className="overflow-x-auto border border-slate-50 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase">
                  <th className="pb-3 pt-2 pl-4">Asset ID</th>
                  <th className="pb-3 pt-2">Asset Name</th>
                  <th className="pb-3 pt-2">Category</th>
                  <th className="pb-3 pt-2">Disposal Date</th>
                  <th className="pb-3 pt-2">Method</th>
                  <th className="pb-3 pt-2 text-right">Value (₹)</th>
                  <th className="pb-3 pt-2">Approved By</th>
                  <th className="pb-3 pt-2">Document Ref</th>
                  <th className="pb-3 pt-2">Status</th>
                  <th className="pb-3 pt-2 text-center pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 font-semibold">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      <div className="inline-block w-6 h-6 rounded-full border-2 border-slate-200 border-t-brand-600 animate-spin" />
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">No disposal records found</td>
                  </tr>
                ) : (
                  filteredRecords
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((record) => (
                      <tr key={record.id || `${record.asset_id}-${record.document_reference}`} className="hover:bg-slate-55/50">
                        <td className="py-3.5 pl-4 text-slate-900 font-bold font-mono">{record.asset_id}</td>
                        <td className="py-3.5 text-slate-900 font-bold">{record.asset_name}</td>
                        <td className="py-3.5 text-slate-655">{record.category}</td>
                        <td className="py-3.5 text-slate-655">
                          {record.disposal_date
                            ? new Date(record.disposal_date).toLocaleDateString('en-IN')
                            : '—'}
                        </td>
                        <td className="py-3.5 text-slate-805">{record.disposal_method}</td>
                        <td className="py-3.5 text-right font-bold text-green-700">₹{record.disposal_value?.toLocaleString('en-IN')}</td>
                        <td className="py-3.5 text-slate-655">{record.approved_by}</td>
                        <td className="py-3.5 text-slate-455 font-mono text-[10px]">{record.document_reference}</td>
                        <td className="py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusBadgeClass(record.status)}`}>
                            {record.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 text-center pr-4 flex justify-center gap-1.5">
                          <button
                            onClick={() => handleViewDetails(record)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                            title="View Details"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadDocument(record.document_reference, record.asset_id)}
                            className="p-1.5 text-slate-400 hover:text-green-650 hover:bg-slate-50 rounded-lg cursor-pointer"
                            title="Download Certificate"
                          >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-4 font-semibold text-slate-500">
            <div>
              <label className="mr-2">Rows per page:</label>
              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
                className="px-2 py-1 border border-slate-205 rounded bg-white"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 border border-slate-205 rounded hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                Prev
              </button>
              <span className="py-1 px-2 text-slate-700">Page {page + 1} of {Math.ceil(filteredRecords.length / rowsPerPage) || 1}</span>
              <button
                disabled={page >= Math.ceil(filteredRecords.length / rowsPerPage) - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 border border-slate-205 rounded hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* View record detail dialog */}
        {viewModalOpen && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 max-w-lg w-full p-6 shadow-card-xl space-y-4 animate-fade-in-up">
              
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-base font-bold font-display text-slate-900">Disposal Certificate Details</h3>
                <button onClick={handleCloseModal} className="p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-lg">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-slate-700">
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-905 border-b border-slate-50 pb-1 uppercase text-[10px] tracking-wider text-slate-405">Asset Description</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-slate-400">Asset ID:</p>
                      <p className="font-bold text-slate-900">{selectedRecord.asset_id}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Asset Name:</p>
                      <p className="font-semibold text-slate-805">{selectedRecord.asset_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Category Group:</p>
                      <p className="font-semibold text-slate-805">{selectedRecord.category}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Status Check:</p>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold mt-1 ${getStatusBadgeClass(selectedRecord.status)}`}>
                        {selectedRecord.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <h4 className="font-bold text-slate-905 border-b border-slate-50 pb-1 uppercase text-[10px] tracking-wider text-slate-405">Disposal Particulars</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-slate-400">Decommission Date:</p>
                      <p className="font-semibold text-slate-805">{new Date(selectedRecord.disposal_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Disposal Method:</p>
                      <p className="font-semibold text-slate-805">{selectedRecord.disposal_method}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Salvage Value (INR):</p>
                      <p className="font-bold text-green-700">₹{selectedRecord.disposal_value?.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Authorization Officer:</p>
                      <p className="font-semibold text-slate-805">{selectedRecord.approved_by}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-slate-400">Document Reference ID:</p>
                      <p className="font-semibold text-slate-805 font-mono text-[10px] mt-0.5">{selectedRecord.document_reference}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-slate-400">Audit Remarks / Notes:</p>
                      <p className="font-normal text-slate-500 leading-relaxed mt-0.5">{selectedRecord.remarks || 'No remarks provided.'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-105 font-semibold">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-slate-205 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDownloadDocument(selectedRecord.document_reference, selectedRecord.asset_id);
                    handleCloseModal();
                  }}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg cursor-pointer flex items-center gap-1.5 shadow-brand"
                >
                  <ArrowDownTrayIcon className="w-4.5 h-4.5" />
                  Download Document
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default DisposalRecordsPage;
