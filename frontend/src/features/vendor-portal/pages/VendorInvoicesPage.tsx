import {
    CheckCircleIcon,
    CurrencyRupeeIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { getInvoices } from '../services/vendorPortal.service';
import type { VendorInvoice } from '../../../types';

const VendorInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadInvoices();
  {/* eslint-disable-next-line react-hooks/exhaustive-deps */}
  }, [statusFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;

      const { invoices: invoicesData, summary: summaryData } = await getInvoices(params);
      setInvoices(invoicesData);
      setSummary(summaryData);
    } catch (err: any) {
      setError((err as any).response?.data?.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'bg-green-50 text-green-700 border border-green-100';
      case 'pending': return 'bg-amber-50 text-amber-705 border border-amber-100';
      case 'overdue': return 'bg-red-50 text-red-700 border border-red-100';
      default: return 'bg-slate-50 text-slate-705 border border-slate-105';
    }
  };

  const formatCurrency = (amount: string | number, currency: string = 'INR') => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(numAmount);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-655">
        
        {/* Header Section */}
        <div>
          <h2 className="text-xl font-bold font-display text-slate-905">Invoices</h2>
          <p className="text-slate-455 mt-1">Track all your payment invoices and statuses</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center justify-between font-semibold">
            <span>{error}</span>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Invoices</p>
                <h3 className="text-lg font-bold text-slate-905 font-display mt-1">{summary.totalInvoices || 0}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <DocumentTextIcon className="w-5.5 h-5.5" />
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Paid Amount</p>
                <h3 className="text-md font-bold text-green-700 font-display mt-1">
                  {formatCurrency(summary.paidAmount, summary.currency)}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <CheckCircleIcon className="w-5.5 h-5.5" />
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Pending Amount</p>
                <h3 className="text-md font-bold text-amber-705 font-display mt-1">
                  {formatCurrency(summary.pendingAmount, summary.currency)}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <CurrencyRupeeIcon className="w-5.5 h-5.5" />
              </div>
            </div>
          </div>
        )}

        {/* Filter controls */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-card flex items-center justify-between">
          <div className="w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
            >
              <option value="">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-bold text-slate-905 font-display mb-3">Invoices Inventory</h3>
          
          <div className="overflow-x-auto border border-slate-50 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase">
                  <th className="pb-3 pt-2 pl-4">Invoice Number</th>
                  <th className="pb-3 pt-2">Order Number</th>
                  <th className="pb-3 pt-2">Invoice Date</th>
                  <th className="pb-3 pt-2">Due Date</th>
                  <th className="pb-3 pt-2">Amount</th>
                  <th className="pb-3 pt-2">Status</th>
                  <th className="pb-3 pt-2">Payment Method</th>
                  <th className="pb-3 pt-2 text-center pr-4">Items Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 font-semibold">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-405">
                      <div className="inline-block w-6 h-6 rounded-full border-2 border-slate-200 border-t-brand-600 animate-spin" />
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">No invoices found</td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice._id} className="hover:bg-slate-55/50">
                      <td className="py-3.5 pl-4 text-slate-900 font-bold">{invoice.invoice_number}</td>
                      <td className="py-3.5 text-slate-805">{invoice.order_number}</td>
                      <td className="py-3.5 text-slate-655">
                        {format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}
                      </td>
                      <td className="py-3.5 text-slate-655">
                        {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                      </td>
                      <td className="py-3.5 text-slate-900 font-bold">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusBadgeClass(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-3.5 uppercase">{invoice.payment_method || 'N/A'}</td>
                      <td className="py-3.5 text-center pr-4 font-normal text-slate-400">{invoice.items_count} items</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default VendorInvoicesPage;
