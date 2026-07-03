import {
    AdjustmentsHorizontalIcon,
    ArrowDownTrayIcon,
    ExclamationTriangleIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import api from '../../../services/api';

interface BudgetCategory {
  id: string;
  name: string;
  allocatedAmount: number;
  spentAmount: number;
  committedAmount: number;
  availableAmount: number;
  utilizationPercentage: number;
  department: string;
  fiscalYear: string;
  status: 'On Track' | 'Over Budget' | 'Nearly Exceeded' | 'Under Utilized';
}

interface BudgetTransaction {
  id: string;
  date: string;
  description: string;
  category: string;
  department: string;
  amount: number;
  type: 'Allocation' | 'Expense' | 'Commitment' | 'Adjustment';
  status: 'Approved' | 'Pending' | 'Rejected';
  referenceNumber: string;
}

const BudgetTrackingPage = () => {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [transactions, setTransactions] = useState<BudgetTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBudgetData();
  }, []);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      const [categoriesResponse, transactionsResponse] = await Promise.all([
        api.get('/purchase-management/budget-categories'),
        api.get('/purchase-management/budget-transactions')
      ]);
      const categories = categoriesResponse.data.data || categoriesResponse.data;
      const transactions = transactionsResponse.data.data || transactionsResponse.data;
      setCategories(categories);
      setTransactions(transactions);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'On Track': return 'bg-green-50 text-green-700 border border-green-105';
      case 'Over Budget': return 'bg-red-50 text-red-700 border border-red-105';
      case 'Nearly Exceeded': return 'bg-amber-50 text-amber-705 border border-amber-100';
      case 'Under Utilized': return 'bg-blue-50 text-blue-700 border border-blue-105';
      default: return 'bg-slate-50 text-slate-705 border border-slate-105';
    }
  };

  const getProgressBarClass = (percentage: number) => {
    if (percentage > 100) return 'bg-red-500';
    if (percentage > 90) return 'bg-amber-500';
    if (percentage < 50) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getTransactionTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'Allocation': return 'bg-blue-50 text-blue-700 border border-blue-105';
      case 'Expense': return 'bg-red-50 text-red-707 border border-red-100';
      case 'Commitment': return 'bg-amber-50 text-amber-705 border border-amber-100';
      case 'Adjustment': return 'bg-purple-50 text-purple-700 border border-purple-105';
      default: return 'bg-slate-50 text-slate-655 border border-slate-105';
    }
  };

  const filteredCategories = categories.filter((category) => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === 'All' || category.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === 'All' || transaction.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const totalAllocated = categories.reduce((sum, cat) => sum + cat.allocatedAmount, 0);
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
  const totalCommitted = categories.reduce((sum, cat) => sum + cat.committedAmount, 0);
  const totalAvailable = categories.reduce((sum, cat) => sum + cat.availableAmount, 0);
  const overBudgetCount = categories.filter(cat => cat.status === 'Over Budget').length;
  const nearlyExceededCount = categories.filter(cat => cat.status === 'Nearly Exceeded').length;

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-655">
        
        {/* Header Action section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-905">Budget Tracking</h2>
            <p className="text-slate-455 mt-1">Track department budget allocations, transaction logs, and overall utilization</p>
          </div>
          <button
            onClick={() => toast.info('Budget report download started')}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-205 text-slate-700 font-semibold rounded-xl bg-white hover:bg-slate-50 cursor-pointer"
          >
            <ArrowDownTrayIcon className="w-4.5 h-4.5" />
            Export Report
          </button>
        </div>

        {/* Stats Summaries Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Budget Allocated</p>
            <h3 className="text-xl font-bold font-display text-slate-905 mt-1">
              ₹{Number(totalAllocated || 0).toLocaleString('en-IN')}
            </h3>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400 font-semibold text-red-600">Total Spent Amount</p>
            <h3 className="text-xl font-bold font-display text-red-650 mt-1">
              ₹{Number(totalSpent || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[9px] text-slate-400 mt-1 font-semibold">{totalAllocated > 0 ? ((totalSpent / totalAllocated) * 100).toFixed(1) : 0}% utilization rate</p>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400 font-semibold text-amber-600">Committed Funds</p>
            <h3 className="text-xl font-bold font-display text-amber-705 mt-1">
              ₹{Number(totalCommitted || 0).toLocaleString('en-IN')}
            </h3>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400">Remaining Available Balance</p>
            <h3 className={`text-xl font-bold font-display mt-1 ${totalAvailable < 0 ? 'text-red-650' : 'text-green-700'}`}>
              ₹{Number(Math.abs(totalAvailable) || 0).toLocaleString('en-IN')}
            </h3>
          </div>
        </div>

        {/* Warning Alerts */}
        {overBudgetCount > 0 && (
          <div className="p-4 bg-red-50 border border-red-105 text-red-800 rounded-xl flex items-start gap-2.5 font-semibold">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-slate-900 text-xs">Over-Budget Alarm</p>
              <p className="mt-0.5">{overBudgetCount} budget categories have exceeded their limit. Immediate attention required.</p>
            </div>
          </div>
        )}

        {nearlyExceededCount > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl flex items-start gap-2.5 font-semibold">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-slate-900 text-xs">Exceeded Warnings</p>
              <p className="mt-0.5">{nearlyExceededCount} budget categories are nearly exceeded (&gt;90% utilized).</p>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-slate-100 flex gap-4">
          <button
            onClick={() => setTabValue(0)}
            className={`py-2 px-1 font-bold font-display border-b-2 transition-all cursor-pointer ${
              tabValue === 0 ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Budget Categories
          </button>
          <button
            onClick={() => setTabValue(1)}
            className={`py-2 px-1 font-bold font-display border-b-2 transition-all cursor-pointer ${
              tabValue === 1 ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Transaction History
          </button>
        </div>

        {/* Tab content panels */}
        {tabValue === 0 ? (
          <div className="space-y-4">
            
            {/* Filters */}
            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-card grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-6 relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <MagnifyingGlassIcon className="w-4.5 h-4.5" />
                </span>
                <input
                  type="text"
                  placeholder="Search budget categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-205 rounded-xl bg-slate-50/50"
                />
              </div>

              <div className="md:col-span-3">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
                >
                  <option value="All">All Departments</option>
                  <option value="IT">IT</option>
                  <option value="Admin">Admin</option>
                  <option value="Operations">Operations</option>
                  <option value="Security">Security</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <button
                  onClick={() => toast.info('Advanced filters coming soon')}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-205 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                >
                  <AdjustmentsHorizontalIcon className="w-4.5 h-4.5" />
                  Advanced Filters
                </button>
              </div>
            </div>

            {/* Categories cards list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                <div className="col-span-2 py-8 text-center text-slate-400">Loading budget data...</div>
              ) : filteredCategories.length === 0 ? (
                <div className="col-span-2 py-8 text-center text-slate-400">No categories matching filters</div>
              ) : (
                filteredCategories.map((category) => (
                  <div key={category.id} className="bg-white border border-slate-100 rounded-xl p-5 shadow-card space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-905 font-display">{category.name}</h4>
                        <span className="inline-flex mt-1 px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-705 font-bold uppercase text-[8px]">{category.department}</span>
                      </div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusBadgeClass(category.status)}`}>
                        {category.status}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-slate-500 font-semibold">
                        <span>Utilization</span>
                        <span className="text-slate-900 font-bold">{category.utilizationPercentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getProgressBarClass(category.utilizationPercentage)}`}
                          style={{ width: `${Math.min(category.utilizationPercentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-50 text-[10px] text-slate-705">
                      <div>
                        <p className="text-slate-400">Allocated</p>
                        <p className="font-bold text-slate-900 mt-0.5">₹{Number(category.allocatedAmount || 0).toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Spent</p>
                        <p className="font-bold text-red-655 mt-0.5">₹{Number(category.spentAmount || 0).toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Committed</p>
                        <p className="font-bold text-amber-705 mt-0.5">₹{Number(category.committedAmount || 0).toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Available</p>
                        <p className={`font-bold mt-0.5 ${category.availableAmount < 0 ? 'text-red-655' : 'text-green-700'}`}>
                          ₹{Number(Math.abs(category.availableAmount) || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card space-y-4">
            <h3 className="text-sm font-bold text-slate-905 font-display pb-2 border-b border-slate-50">Recent Transactions ({filteredTransactions.length})</h3>
            
            <div className="overflow-x-auto border border-slate-50 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase">
                    <th className="pb-3 pt-2 pl-4">Date</th>
                    <th className="pb-3 pt-2">Description</th>
                    <th className="pb-3 pt-2">Category</th>
                    <th className="pb-3 pt-2">Department</th>
                    <th className="pb-3 pt-2">Type</th>
                    <th className="pb-3 pt-2 text-right">Amount</th>
                    <th className="pb-3 pt-2">Status</th>
                    <th className="pb-3 pt-2 pr-4">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-705 font-semibold">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-405">
                        <div className="inline-block w-6 h-6 rounded-full border-2 border-slate-200 border-t-brand-600 animate-spin" />
                      </td>
                    </tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">No transactions recorded</td>
                    </tr>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-slate-55/50">
                        <td className="py-3.5 pl-4 text-slate-900">{format(parseISO(transaction.date), 'MMM dd, yyyy')}</td>
                        <td className="py-3.5 text-slate-905 font-bold">{transaction.description}</td>
                        <td className="py-3.5">
                          <span className="inline-flex px-2 py-0.5 border border-slate-200 bg-slate-55 text-slate-700 font-bold uppercase text-[8px]">{transaction.category}</span>
                        </td>
                        <td className="py-3.5 text-slate-655">{transaction.department}</td>
                        <td className="py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getTransactionTypeBadgeClass(transaction.type)}`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-bold text-slate-900">
                          <span className={transaction.type === 'Expense' ? 'text-red-655' : 'text-slate-900'}>
                            {transaction.type === 'Expense' ? '-' : ''}₹{transaction.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            transaction.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-105' :
                            transaction.status === 'Pending' ? 'bg-amber-50 text-amber-705 border border-amber-100' : 'bg-red-50 text-red-700 border border-red-105'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="py-3.5 font-mono text-[10px] select-all pr-4">{transaction.referenceNumber}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default BudgetTrackingPage;