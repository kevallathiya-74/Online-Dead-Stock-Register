import {
    ArrowPathIcon,
    CheckCircleIcon,
    ClipboardDocumentIcon,
    ExclamationTriangleIcon,
    EyeIcon,
    XCircleIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import api from '../../../services/api';

interface Approval {
  _id: string;
  request_type: 'Repair' | 'Upgrade' | 'Scrap' | 'New Asset' | 'Other';
  requested_by: {
    _id: string;
    name: string;
    email: string;
    employee_id?: string;
  };
  asset_id?: {
    _id: string;
    name?: string;
    unique_asset_id: string;
  };
  status: 'Pending' | 'Accepted' | 'Rejected';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  request_data: {
    reason: string;
    from_location?: string;
    to_location?: string;
    estimated_cost?: number;
    maintenance_type?: string;
    priority?: string;
    specifications?: string;
  };
  created_at: string;
  approved_at?: string;
  comments?: string;
}

const ApprovalsPage: React.FC = () => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [approvalComments, setApprovalComments] = useState('');

  const fetchApprovals = async () => {
    try {
      setError(null);
      const response = await api.get('/approvals');
      const approvalData = response.data.data || response.data;
      setApprovals(Array.isArray(approvalData) ? approvalData : []);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to load approvals';
      setError(errorMessage);
      if (error.response?.status !== 401) {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchApprovals();
    const interval = setInterval(fetchApprovals, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleApproval = async (approvalId: string, action: 'Accepted' | 'Rejected') => {
    try {
      const endpoint = action === 'Accepted' ? 'approve' : 'reject';
      await api.put(`/approvals/${approvalId}/${endpoint}`, {
        comments: approvalComments || `Request ${action.toLowerCase()} by manager`
      });
      await fetchApprovals();
      setViewDialog(false);
      setApprovalComments('');
      toast.success(`Request ${action.toLowerCase()} successfully`);
    } catch { /* ignore */ }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-50 text-red-700 border border-red-105';
      case 'HIGH': return 'bg-amber-50 text-amber-705 border border-amber-100';
      case 'MEDIUM': return 'bg-blue-50 text-blue-700 border border-blue-105';
      default: return 'bg-slate-55 text-slate-705 border border-slate-150';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Accepted': return 'bg-green-50 text-green-700 border border-green-105';
      case 'Rejected': return 'bg-red-50 text-red-707 border border-red-100';
      default: return 'bg-amber-50 text-amber-705 border border-amber-100';
    }
  };

  const getRequestTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'New Asset': return 'bg-green-50 text-green-700 border border-green-105';
      case 'Repair': return 'bg-amber-50 text-amber-705 border border-amber-100';
      case 'Upgrade': return 'bg-blue-50 text-blue-700 border border-blue-105';
      case 'Scrap': return 'bg-red-50 text-red-707 border border-red-100';
      default: return 'bg-slate-55 text-slate-705 border border-slate-150';
    }
  };

  const pendingApprovals = approvals.filter(a => a.status === 'Pending');
  const processedApprovals = approvals.filter(a => a.status !== 'Pending');
  const currentApprovals = selectedTab === 0 ? pendingApprovals : 
                          selectedTab === 1 ? processedApprovals : approvals;

  const totalPending = pendingApprovals.length;
  const highPriorityPending = pendingApprovals.filter(a => 
    (a.request_data?.priority?.toUpperCase() === 'HIGH' || 
     a.request_data?.priority?.toUpperCase() === 'CRITICAL')
  ).length;

  const avgProcessingTime = processedApprovals.length > 0 ? 
    processedApprovals.reduce((sum, approval) => {
      if (approval.approved_at) {
        const processingTime = (new Date(approval.approved_at).getTime() - new Date(approval.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return sum + processingTime;
      }
      return sum;
    }, 0) / processedApprovals.length : 0;
  
  const approvalRate = processedApprovals.length > 0 ? 
    (processedApprovals.filter(a => a.status === 'Accepted').length / processedApprovals.length * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-655">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-905">My Approvals</h2>
            <p className="text-slate-455 mt-1">Review and manage pending approval authorization requests from your team</p>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => {
                setLoading(true);
                fetchApprovals();
              }}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-205 text-slate-700 font-semibold rounded-xl bg-white hover:bg-slate-50 cursor-pointer disabled:opacity-50"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Refresh
            </button>
            <div className="relative">
              <ClipboardDocumentIcon className="w-8 h-8 text-slate-400" />
              {totalPending > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {totalPending}
                </span>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-105 text-red-800 rounded-xl font-semibold flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-505 font-bold hover:text-red-800">×</button>
          </div>
        )}

        {/* Stats Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400">Pending Approvals</p>
            <h3 className="text-xl font-bold font-display text-slate-905 mt-1">{totalPending}</h3>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400 font-semibold text-red-600">High Priority Requests</p>
            <h3 className="text-xl font-bold font-display text-red-650 mt-1">{highPriorityPending}</h3>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400">Approval Authorization Rate</p>
            <h3 className="text-xl font-bold font-display text-green-700 mt-1">{approvalRate.toFixed(1)}%</h3>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400">Avg. Processing Duration</p>
            <h3 className="text-xl font-bold font-display text-slate-905 mt-1">
              {avgProcessingTime >= 1 ? `${Math.round(avgProcessingTime)}d` : avgProcessingTime > 0 ? '<1d' : '0d'}
            </h3>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-slate-100 flex gap-4">
          <button
            onClick={() => setSelectedTab(0)}
            className={`py-2 px-1 font-bold font-display border-b-2 transition-all cursor-pointer ${
              selectedTab === 0 ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Pending ({totalPending})
          </button>
          <button
            onClick={() => setSelectedTab(1)}
            className={`py-2 px-1 font-bold font-display border-b-2 transition-all cursor-pointer ${
              selectedTab === 1 ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Processed ({processedApprovals.length})
          </button>
          <button
            onClick={() => setSelectedTab(2)}
            className={`py-2 px-1 font-bold font-display border-b-2 transition-all cursor-pointer ${
              selectedTab === 2 ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            All ({approvals.length})
          </button>
        </div>

        {/* Table List of Approvals */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
          {loading ? (
            <div className="py-8 text-center text-slate-400">
              <div className="inline-block w-6 h-6 rounded-full border-2 border-slate-200 border-t-brand-600 animate-spin" />
            </div>
          ) : currentApprovals.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <ClipboardDocumentIcon className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold font-display text-slate-800">No approval requests found</h4>
              <p className="text-slate-450">
                {selectedTab === 0 ? 'All caught up! No pending approvals at the moment.' : 'No approval requests have been processed yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-50 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase">
                    <th className="pb-3 pt-2 pl-4">Request Reason</th>
                    <th className="pb-3 pt-2">Requested By</th>
                    <th className="pb-3 pt-2">Request Type</th>
                    <th className="pb-3 pt-2">Asset Details</th>
                    <th className="pb-3 pt-2">Priority</th>
                    <th className="pb-3 pt-2">Status</th>
                    <th className="pb-3 pt-2">Date</th>
                    <th className="pb-3 pt-2 text-center pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700 font-semibold">
                  {currentApprovals.map((approval) => (
                    <tr key={approval._id} className="hover:bg-slate-55/50">
                      <td className="py-3.5 pl-4">
                        <p className="font-bold text-slate-900 leading-normal">{approval.request_data?.reason || 'No reason provided'}</p>
                        {approval.request_data?.estimated_cost && (
                          <p className="text-[10px] text-slate-405 font-normal mt-0.5">Est. Cost: ₹{approval.request_data.estimated_cost.toLocaleString('en-IN')}</p>
                        )}
                      </td>
                      <td className="py-3.5">
                        <p className="font-bold text-slate-900">{approval.requested_by?.name || 'Unknown'}</p>
                        <p className="text-[9px] text-slate-405 font-normal mt-0.5">{approval.requested_by?.employee_id || approval.requested_by?.email}</p>
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${getRequestTypeBadgeClass(approval.request_type)}`}>
                          {approval.request_type}
                        </span>
                      </td>
                      <td className="py-3.5">
                        {approval.asset_id ? (
                          <>
                            <p className="font-bold text-slate-805">{approval.asset_id.name || 'Unnamed Asset'}</p>
                            <p className="text-[9px] text-slate-400 font-mono mt-0.5">{approval.asset_id.unique_asset_id}</p>
                          </>
                        ) : (
                          <span className="text-slate-400 font-normal">N/A</span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex px-2 py-0.5 border rounded-full text-[9px] font-bold ${getPriorityBadgeClass(approval.request_data?.priority || approval.priority || 'MEDIUM')}`}>
                          {(approval.request_data?.priority || approval.priority || 'MEDIUM').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusBadgeClass(approval.status)}`}>
                          {approval.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-805">{new Date(approval.created_at).toLocaleDateString()}</td>
                      <td className="py-3.5 text-center pr-4 flex justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedApproval(approval);
                            setViewDialog(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                          title="View Request Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        {approval.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleApproval(approval._id, 'Accepted')}
                              className="p-1.5 text-slate-450 hover:text-green-700 hover:bg-slate-50 rounded-lg cursor-pointer"
                              title="Approve Request"
                            >
                              <CheckCircleIcon className="w-4 h-4 text-green-600" />
                            </button>
                            <button
                              onClick={() => handleApproval(approval._id, 'Rejected')}
                              className="p-1.5 text-slate-450 hover:text-red-700 hover:bg-slate-50 rounded-lg cursor-pointer"
                              title="Reject Request"
                            >
                              <XCircleIcon className="w-4 h-4 text-red-650" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* View Approval Detail Dialog Modal */}
        {viewDialog && selectedApproval && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 max-w-2xl w-full p-6 shadow-card-xl space-y-4 animate-fade-in-up">
              
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-base font-bold font-display text-slate-905">Approval Request Details</h3>
                <button onClick={() => setViewDialog(false)} className="p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-lg">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl text-sky-800 font-semibold leading-relaxed flex gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-sky-600 flex-shrink-0" />
                <span>Review the request details below and specify comments before submitting your decision.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-705 text-xs">
                <div>
                  <h4 className="font-bold text-slate-905 border-b border-slate-50 pb-1 uppercase text-[10px] tracking-wider text-slate-405">Request parameters</h4>
                  <p className="mt-1.5"><strong>Type of Authorization:</strong> {selectedApproval.request_type.replace('_', ' ')}</p>
                  <p className="flex items-center gap-1.5 mt-1"><strong>Priority Level:</strong>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${getPriorityBadgeClass(selectedApproval.request_data?.priority || selectedApproval.priority || 'MEDIUM')}`}>
                      {(selectedApproval.request_data?.priority || selectedApproval.priority || 'MEDIUM').toUpperCase()}
                    </span>
                  </p>
                  <p className="mt-1"><strong>Requested On:</strong> {new Date(selectedApproval.created_at).toLocaleDateString()}</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-905 border-b border-slate-50 pb-1 uppercase text-[10px] tracking-wider text-slate-405">Applicant Info</h4>
                  <p className="mt-1.5"><strong>Name:</strong> {selectedApproval.requested_by?.name || 'Unknown'}</p>
                  <p className="mt-1"><strong>Email:</strong> {selectedApproval.requested_by?.email}</p>
                  {selectedApproval.requested_by?.employee_id && <p className="mt-1"><strong>Employee ID:</strong> {selectedApproval.requested_by.employee_id}</p>}
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <h4 className="font-bold text-slate-905 border-b border-slate-50 pb-1 uppercase text-[10px] tracking-wider text-slate-405">Justification Reason</h4>
                  <p className="bg-slate-50 border border-slate-100 p-3 rounded-xl leading-relaxed mt-1">{selectedApproval.request_data.reason}</p>
                </div>

                {selectedApproval.request_data.estimated_cost && (
                  <div className="sm:col-span-2">
                    <p><strong>Estimated Financial Commitment:</strong> <span className="font-bold text-slate-900">₹{selectedApproval.request_data.estimated_cost.toLocaleString()}</span></p>
                  </div>
                )}

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block font-bold text-slate-905 uppercase text-[10px] tracking-wider text-slate-405">Approval Comments / Audit Notes</label>
                  <textarea
                    rows={3}
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                    placeholder="Provide justification notes or feedback comments..."
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl text-slate-900 text-xs focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-105 font-semibold">
                <button
                  onClick={() => setViewDialog(false)}
                  className="px-4 py-2 border border-slate-205 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Close
                </button>
                {selectedApproval?.status === 'Pending' && (
                  <>
                    <button
                      onClick={() => handleApproval(selectedApproval._id, 'Rejected')}
                      className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white rounded-lg cursor-pointer font-display"
                    >
                      Reject Request
                    </button>
                    <button
                      onClick={() => handleApproval(selectedApproval._id, 'Accepted')}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg cursor-pointer shadow-brand font-display"
                    >
                      Authorize Approve
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default ApprovalsPage;