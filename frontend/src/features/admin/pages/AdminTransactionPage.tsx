import {
    ArrowPathIcon,
    ArrowPathRoundedSquareIcon,
    ArrowTrendingUpIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    ClockIcon,
    ComputerDesktopIcon,
    EyeIcon,
    FunnelIcon,
    InformationCircleIcon,
    MagnifyingGlassIcon,
    MapPinIcon,
    PencilSquareIcon,
    PlusIcon,
    UserIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import api from '../../../services/api';

interface AdminTransaction {
  _id: string;
  id?: string;
  asset_name: string;
  asset_id: string;
  type: 'Assignment' | 'Transfer' | 'Return' | 'Maintenance' | 'Disposal' | 'Purchase';
  from_user?: string | { name: string };
  to_user?: string | { name: string };
  from_location?: string;
  to_location?: string;
  date: string;
  status: 'Completed' | 'Pending' | 'Cancelled';
  created_by: string;
  created_at: string;
  notes?: string;
  priority: 'High' | 'Medium' | 'Low';
  asset?: {
    unique_asset_id: string;
    manufacturer: string;
    model: string;
    serial_number?: string;
    location?: string;
  };
  transaction_type?: string;
  transaction_date?: string;
  quantity?: number;
  approved_by?: { name: string };
  estimated_completion?: string;
}

const AdminTransactionPage: React.FC = () => {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<AdminTransaction | null>(null);
  const [viewTransactionDialogOpen, setViewTransactionDialogOpen] = useState(false);
  const [addTransactionDialogOpen, setAddTransactionDialogOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    type: '',
    asset_id: '',
    assigned_user: '',
    assigned_department: '',
    priority: 'Medium',
    description: '',
    notes: ''
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/transactions');
      const transactionData = response.data.data || response.data;
      setTransactions(transactionData);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) { /* Error handled by API interceptor */ } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: transactions.length,
    pending: transactions.filter(t => t.status === 'Pending').length,
    approved: transactions.filter(t => t.status === 'Completed').length,
    completed: transactions.filter(t => t.status === 'Completed').length,
    recentTransactions: transactions.filter(t => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(t.created_at || t.date) >= weekAgo;
    }).length
  };

  const getTransactionsForTab = (tabIndex: number) => {
    switch (tabIndex) {
      case 0:
        return transactions;
      case 1:
        return transactions.filter(t => t.status === 'Pending');
      case 2:
        return transactions.filter(t => t.status === 'Completed');
      case 3:
        return transactions.filter(t => t.status === 'Cancelled');
      default:
        return transactions;
    }
  };

  const filteredTransactions = getTransactionsForTab(tabValue).filter((transaction) => {
    const fromUserName = typeof transaction.from_user === 'object' ? transaction.from_user?.name : transaction.from_user;
    const toUserName = typeof transaction.to_user === 'object' ? transaction.to_user?.name : transaction.to_user;
    
    const matchesSearch = 
      (transaction.asset?.unique_asset_id?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.asset?.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.asset?.model?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      transaction.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fromUserName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      toUserName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.notes && transaction.notes.toLowerCase().includes(searchTerm.toLowerCase())) || false;
    
    const matchesStatus = selectedStatus === 'all' || transaction.status === selectedStatus;
    const matchesType = selectedType === 'all' || (transaction.transaction_type || transaction.type) === selectedType;
    const matchesPriority = selectedPriority === 'all' || transaction.priority === selectedPriority;
    
    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  const paginatedTransactions = filteredTransactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleCompleteTransaction = (transactionId: string) => {
    setTransactions(prev => 
      prev.map(txn => 
        txn._id === transactionId 
          ? { ...txn, status: 'Completed' }
          : txn
      )
    );
    toast.success('Transaction completed');
  };

  const handleCancelTransaction = (transactionId: string) => {
    setTransactions(prev => 
      prev.map(txn => 
        txn._id === transactionId 
          ? { ...txn, status: 'Cancelled' }
          : txn
      )
    );
    toast.success('Transaction cancelled');
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.type || !newTransaction.asset_id || !newTransaction.assigned_user) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const transactionData = {
        asset_id: newTransaction.asset_id,
        type: newTransaction.type,
        to_user: newTransaction.assigned_user,
        department: newTransaction.assigned_department,
        priority: newTransaction.priority,
        notes: `${newTransaction.description}. ${newTransaction.notes}`.trim()
      };
      
      await api.post('/transactions', transactionData);
      await loadTransactions();
      setAddTransactionDialogOpen(false);
      setNewTransaction({
        type: '',
        asset_id: '',
        assigned_user: '',
        assigned_department: '',
        priority: 'Medium',
        description: '',
        notes: ''
      });
      toast.success('Transaction created successfully');
    } catch (error: any) {
      
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create transaction';
      toast.error(errorMsg);
    }
  };

  const handleBulkAction = async (action: string) => {
    switch (action) {
      case 'complete':
        try {
          await api.post('/transactions/bulk-update', { 
            transactionIds: bulkSelected,
            status: 'Completed'
          });
          await loadTransactions();
          toast.success(`${bulkSelected.length} transactions completed`);
        } catch (error: any) {
      
      const errorMsg = error.response?.data?.message || error.message || 'Failed to complete transactions';
          toast.error(errorMsg);
        }
        break;
      case 'cancel':
        try {
          await api.post('/transactions/bulk-update', { 
            transactionIds: bulkSelected,
            status: 'Cancelled'
          });
          await loadTransactions();
          toast.success(`${bulkSelected.length} transactions cancelled`);
        } catch (error: any) {
      
      const errorMsg = error.response?.data?.message || error.message || 'Failed to cancel transactions';
          toast.error(errorMsg);
        }
        break;
      case 'export':
        toast.info(`Exporting ${bulkSelected.length} transactions`);
        break;
      case 'delete':
        if (window.confirm(`Are you sure you want to delete ${bulkSelected.length} transactions?`)) {
          try {
            await api.post('/transactions/bulk-delete', { transactionIds: bulkSelected });
            await loadTransactions();
            toast.success(`${bulkSelected.length} transactions deleted`);
          } catch (error: any) {
      
      const errorMsg = error.response?.data?.message || error.message || 'Failed to delete transactions';
            toast.error(errorMsg);
          }
        }
        break;
    }
    setBulkSelected([]);
    setActionMenuOpen(false);
  };

  const getStatusBadge = (status: AdminTransaction['status']) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'Completed':
        return 'bg-green-50 text-green-700 border border-green-100';
      case 'Cancelled':
        return 'bg-red-50 text-red-700 border border-red-100';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-100';
    }
  };

  const getPriorityBadge = (priority: AdminTransaction['priority']) => {
    switch (priority) {
      case 'High':
        return 'bg-red-50 text-red-750 border border-red-100';
      case 'Medium':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-100';
      case 'Low':
        return 'bg-slate-50 text-slate-700 border border-slate-100';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-100';
    }
  };

  const transactionTypes = ['Asset Assignment', 'Asset Transfer', 'Check-out', 'Check-in', 'Maintenance', 'Return'];
  const priorities = ['Low', 'Medium', 'High', 'Critical'];
  const statuses = ['Pending', 'Approved', 'Completed', 'Rejected'];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-brand-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold font-display text-slate-900">
              Transaction Management
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Monitor and manage all asset transactions and approvals
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={loadTransactions}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setAddTransactionDialogOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-all shadow-brand cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" />
              New Transaction
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Txns</p>
              <h4 className="text-2xl font-bold text-slate-900 font-display mt-0.5">{stats.total}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">{stats.recentTransactions} this week</p>
            </div>
            <ArrowPathRoundedSquareIcon className="w-8 h-8 text-slate-400" />
          </div>
          
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider text-amber-505">Pending</p>
              <h4 className="text-2xl font-bold text-slate-900 font-display mt-0.5">{stats.pending}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Requires approval</p>
            </div>
            <ClockIcon className="w-8 h-8 text-amber-500" />
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider text-green-505">Approved</p>
              <h4 className="text-2xl font-bold text-slate-900 font-display mt-0.5">{stats.approved}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Ready for process</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-505" />
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider text-indigo-505">Completed</p>
              <h4 className="text-2xl font-bold text-slate-900 font-display mt-0.5">{stats.completed}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Successfully logged</p>
            </div>
            <ArrowTrendingUpIcon className="w-8 h-8 text-indigo-505" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-100 flex gap-2">
          {['All Transactions', 'Pending', 'Completed', 'Cancelled'].map((tabLabel, idx) => {
            const counts = [
              transactions.length,
              transactions.filter(t => t.status === 'Pending').length,
              transactions.filter(t => t.status === 'Completed').length,
              transactions.filter(t => t.status === 'Cancelled').length
            ];
            return (
              <button
                key={tabLabel}
                onClick={() => {
                  setTabValue(idx);
                  setPage(0);
                }}
                className={`px-4 py-2 border-b-2 text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  tabValue === idx
                    ? 'border-brand-650 text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{tabLabel}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  tabValue === idx ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {counts[idx]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters Panel */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
            <div className="relative lg:col-span-4 w-full">
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-405"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            <div className="lg:col-span-2 w-full">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="all">All Types</option>
                {transactionTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2 w-full">
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="all">All Priorities</option>
                {priorities.map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2 w-full">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="all">All Statuses</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2 w-full flex items-center justify-between sm:justify-end gap-2 pl-2">
              <span className="text-xs text-slate-500 font-semibold">{filteredTransactions.length} txn</span>
              {bulkSelected.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setActionMenuOpen(p => !p)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    <FunnelIcon className="w-3.5 h-3.5" />
                    Actions ({bulkSelected.length})
                  </button>
                  {actionMenuOpen && (
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-100 rounded-xl shadow-card-xl z-20 py-1.5 text-xs text-slate-655 font-medium">
                      <button onClick={() => handleBulkAction('complete')} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-green-600">Mark Complete</button>
                      <button onClick={() => handleBulkAction('cancel')} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-amber-600">Cancel Selected</button>
                      <button onClick={() => handleBulkAction('export')} className="w-full text-left px-4 py-2 hover:bg-slate-50">Export Selected</button>
                      <hr className="my-1 border-slate-100" />
                      <button onClick={() => handleBulkAction('delete')} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600">Delete Selected</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transactions Table Card */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-500">
                <th className="pb-3 w-10">
                  <input
                    type="checkbox"
                    checked={filteredTransactions.length > 0 && bulkSelected.length === filteredTransactions.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setBulkSelected(filteredTransactions.map(t => t._id));
                      } else {
                        setBulkSelected([]);
                      }
                    }}
                    className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                  />
                </th>
                <th className="pb-3 font-medium">Transaction Details</th>
                <th className="pb-3 font-medium">Asset Information</th>
                <th className="pb-3 font-medium">Participants</th>
                <th className="pb-3 font-medium">Status & Priority</th>
                <th className="pb-3 font-medium">Timeline</th>
                <th className="pb-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {paginatedTransactions.map((transaction) => (
                <tr 
                  key={transaction._id} 
                  className={`hover:bg-slate-50/50 transition-colors ${
                    bulkSelected.includes(transaction._id) ? 'bg-indigo-50/10' : ''
                  }`}
                >
                  <td className="py-4">
                    <input
                      type="checkbox"
                      checked={bulkSelected.includes(transaction._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBulkSelected(prev => [...prev, transaction._id]);
                        } else {
                          setBulkSelected(prev => prev.filter(id => id !== transaction._id));
                        }
                      }}
                      className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                    />
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0 text-xs">
                        <ArrowPathRoundedSquareIcon className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-xs">
                          {transaction.transaction_type || transaction.type}
                        </p>
                        <p className="text-[9px] text-slate-400 font-mono mt-0.5">ID: {transaction._id}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Quantity: {transaction.quantity || 1}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <div>
                      <p className="font-semibold text-slate-900 text-xs flex items-center gap-1">
                        <ComputerDesktopIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        {transaction.asset?.unique_asset_id || transaction.asset_id}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {transaction.asset?.manufacturer || 'N/A'} {transaction.asset?.model || ''}
                      </p>
                      <p className="text-[10px] text-slate-450 flex items-center gap-1 mt-0.5">
                        <MapPinIcon className="w-3 h-3 flex-shrink-0" />
                        <span>{transaction.from_location || 'N/A'} &rarr; {transaction.to_location || 'N/A'}</span>
                      </p>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="space-y-1 text-xs text-slate-500">
                      {transaction.from_user && (
                        <p className="flex items-center gap-1">
                          <UserIcon className="w-3 h-3 flex-shrink-0 text-slate-400" />
                          <span>From: {typeof transaction.from_user === 'object' ? transaction.from_user.name : transaction.from_user}</span>
                        </p>
                      )}
                      {transaction.to_user && (
                        <p className="flex items-center gap-1">
                          <UserIcon className="w-3 h-3 flex-shrink-0 text-slate-400" />
                          <span>To: {typeof transaction.to_user === 'object' ? transaction.to_user.name : transaction.to_user}</span>
                        </p>
                      )}
                      {transaction.approved_by && (
                        <p className="text-[9px] text-slate-400">Approved by: {transaction.approved_by.name}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="space-y-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(transaction.status)}`}>
                        {transaction.status}
                      </span>
                      <div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold ${getPriorityBadge(transaction.priority)}`}>
                          {transaction.priority} Priority
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <p className="font-semibold text-slate-900 text-xs flex items-center gap-1">
                      <CalendarDaysIcon className="w-3.5 h-3.5 text-slate-405" />
                      {new Date(transaction.transaction_date || transaction.date).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(transaction.transaction_date || transaction.date).toLocaleTimeString()}
                    </p>
                    {transaction.estimated_completion && (
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        Est. Completion: {new Date(transaction.estimated_completion).toLocaleDateString()}
                      </p>
                    )}
                  </td>
                  <td className="py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setViewTransactionDialogOpen(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                        title="View Details"
                      >
                        <EyeIcon className="w-4.5 h-4.5" />
                      </button>
                      {transaction.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleCompleteTransaction(transaction._id)}
                            className="p-1.5 rounded-lg hover:bg-green-50 text-slate-500 hover:text-green-600 transition-colors"
                            title="Complete"
                          >
                            <CheckCircleIcon className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => handleCancelTransaction(transaction._id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-650 transition-colors"
                            title="Cancel"
                          >
                            <XCircleIcon className="w-4.5 h-4.5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => toast.info(`Edit for transaction ${transaction._id} coming soon`)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-850 transition-colors"
                        title="Edit"
                      >
                        <PencilSquareIcon className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                className="border border-slate-200 rounded p-1 bg-white"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={55}>55</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <span>
                {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, filteredTransactions.length)} of {filteredTransactions.length}
              </span>
              <div className="flex gap-1">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  disabled={(page + 1) * rowsPerPage >= filteredTransactions.length}
                  onClick={() => setPage(p => p + 1)}
                  className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Transaction Details Dialog */}
      {viewTransactionDialogOpen && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-2xl w-full shadow-card-xl p-6 space-y-4 animate-fade-in-up">
            <h3 className="text-lg font-bold font-display text-slate-900">
              Transaction Details &mdash; {selectedTransaction._id}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2 text-xs text-slate-655">
                <h4 className="font-bold text-slate-900 uppercase tracking-wide">Transaction Info</h4>
                <p><strong>Type:</strong> {selectedTransaction.transaction_type || selectedTransaction.type}</p>
                <p className="flex items-center gap-1.5 mt-1">
                  <strong>Status:</strong>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(selectedTransaction.status)}`}>
                    {selectedTransaction.status}
                  </span>
                </p>
                <p className="flex items-center gap-1.5 mt-1">
                  <strong>Priority:</strong>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold ${getPriorityBadge(selectedTransaction.priority)}`}>
                    {selectedTransaction.priority}
                  </span>
                </p>
                <p><strong>Quantity:</strong> {selectedTransaction.quantity || 1}</p>
                <p><strong>Date:</strong> {new Date(selectedTransaction.transaction_date || selectedTransaction.date).toLocaleString()}</p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2 text-xs text-slate-655">
                <h4 className="font-bold text-slate-900 uppercase tracking-wide">Asset Info</h4>
                <p><strong>Asset ID:</strong> {selectedTransaction.asset?.unique_asset_id || selectedTransaction.asset_id}</p>
                <p><strong>Manufacturer:</strong> {selectedTransaction.asset?.manufacturer || 'N/A'}</p>
                <p><strong>Model:</strong> {selectedTransaction.asset?.model || 'N/A'}</p>
                {selectedTransaction.asset?.serial_number && <p><strong>Serial Number:</strong> {selectedTransaction.asset.serial_number}</p>}
                {selectedTransaction.asset?.location && <p><strong>Current Location:</strong> {selectedTransaction.asset.location}</p>}
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2 text-xs text-slate-655">
                <h4 className="font-bold text-slate-900 uppercase tracking-wide">Participants</h4>
                {selectedTransaction.from_user && (
                  <p><strong>From:</strong> {typeof selectedTransaction.from_user === 'object' ? selectedTransaction.from_user.name : selectedTransaction.from_user}</p>
                )}
                {selectedTransaction.to_user && (
                  <p><strong>To:</strong> {typeof selectedTransaction.to_user === 'object' ? selectedTransaction.to_user.name : selectedTransaction.to_user}</p>
                )}
                {selectedTransaction.approved_by && (
                  <p><strong>Approved By:</strong> {selectedTransaction.approved_by.name}</p>
                )}
                {selectedTransaction.from_location && <p><strong>From Location:</strong> {selectedTransaction.from_location}</p>}
                {selectedTransaction.to_location && <p><strong>To Location:</strong> {selectedTransaction.to_location}</p>}
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2 text-xs text-slate-655">
                <h4 className="font-bold text-slate-900 uppercase tracking-wide">Additional Details</h4>
                {selectedTransaction.notes && <p><strong>Notes:</strong> {selectedTransaction.notes}</p>}
                {selectedTransaction.estimated_completion && (
                  <p><strong>Est. Completion:</strong> {new Date(selectedTransaction.estimated_completion).toLocaleDateString()}</p>
                )}
              </div>

              {selectedTransaction.status === 'Pending' && (
                <div className="sm:col-span-2 p-3 bg-sky-50 border border-sky-100 text-sky-850 rounded-xl flex items-start gap-2.5">
                  <InformationCircleIcon className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs">
                    This transaction is pending. Use the action triggers to complete or cancel it.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setViewTransactionDialogOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>

              {selectedTransaction.status === 'Pending' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleCancelTransaction(selectedTransaction._id);
                      setViewTransactionDialogOpen(false);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel Transaction
                  </button>
                  <button
                    onClick={() => {
                      handleCompleteTransaction(selectedTransaction._id);
                      setViewTransactionDialogOpen(false);
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Complete Transaction
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Transaction Dialog */}
      {addTransactionDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-lg w-full shadow-card-xl p-6 space-y-4 animate-fade-in-up">
            <h3 className="text-lg font-bold font-display text-slate-900">Create New Transaction</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[360px] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Transaction Type *</label>
                <select
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="">Select Type</option>
                  <option value="Asset Assignment">Asset Assignment</option>
                  <option value="Asset Transfer">Asset Transfer</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Check-out">Check-out</option>
                  <option value="Check-in">Check-in</option>
                  <option value="Return">Return</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Asset ID *</label>
                <input
                  type="text"
                  value={newTransaction.asset_id}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, asset_id: e.target.value }))}
                  placeholder="e.g. AST-10001"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Assigned User *</label>
                <input
                  type="text"
                  value={newTransaction.assigned_user}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, assigned_user: e.target.value }))}
                  placeholder="Full name of user"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
                <select
                  value={newTransaction.assigned_department}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, assigned_department: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="">Select Department</option>
                  <option value="IT">IT</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Operations">Operations</option>
                  <option value="Legal">Legal</option>
                </select>
              </div>
              
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Priority</label>
                <select
                  value={newTransaction.priority}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <textarea
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the transaction purpose and details"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes (Optional)</label>
                <textarea
                  value={newTransaction.notes}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes or special instructions"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setAddTransactionDialogOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTransaction}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Create Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminTransactionPage;