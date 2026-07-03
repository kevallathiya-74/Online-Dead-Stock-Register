import {
    AdjustmentsHorizontalIcon,
    ArrowDownTrayIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    PrinterIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { usePolling } from '../../../hooks/usePolling';
import api from '../../../services/api';

interface Invoice {
  _id: string;
  invoice_number: string;
  purchase_order: {
    _id: string;
    po_number: string;
    status: string;
  };
  vendor: {
    _id: string;
    vendor_name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
  };
  vendor_gstin: string;
  invoice_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'received' | 'approved' | 'paid' | 'overdue' | 'cancelled';
  total_amount: number;
  tax_amount: number;
  subtotal: number;
  payment_method: 'bank_transfer' | 'cheque' | 'cash' | 'upi' | 'credit_card' | 'other';
  payment_date?: string;
  payment_reference?: string;
  items: InvoiceItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  totalAmount: number;
}

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadInvoiceData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/purchase-management/invoices');
      const data = response.data.data || response.data;
      setInvoices(Array.isArray(data) ? data : []);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      toast.error('Failed to load invoice data');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  usePolling(loadInvoiceData, {
    interval: 30000,
    enabled: true
  });

  useEffect(() => {
    loadInvoiceData();
  }, []);

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'bg-slate-50 text-slate-705 border-slate-105';
      case 'sent': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'received': return 'bg-sky-50 text-sky-700 border-sky-100';
      case 'approved': return 'bg-amber-50 text-amber-705 border-amber-100';
      case 'paid': return 'bg-green-50 text-green-700 border-green-105';
      case 'overdue': case 'cancelled': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-slate-50 text-slate-705 border-slate-105';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
      case 'overdue': return <ExclamationTriangleIcon className="w-4 h-4 text-red-650" />;
      case 'approved': case 'received': return <ClockIcon className="w-4 h-4 text-amber-600" />;
      default: return <DocumentTextIcon className="w-4 h-4 text-slate-500" />;
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.vendor?.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.purchase_order?.po_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || invoice.status === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setSelectedInvoice(null);
    setIsDetailModalOpen(false);
  };

  const handleApproveInvoice = async (invoice: Invoice) => {
    try {
      await api.patch(`/purchase-management/invoices/${invoice._id}/status`, {
        status: 'approved'
      });
      toast.success(`Invoice ${invoice.invoice_number} approved for payment`);
      loadInvoiceData();
    } catch { /* ignore */ }
  };

  const handleMarkAsPaid = async (invoice: Invoice) => {
    try {
      await api.patch(`/purchase-management/invoices/${invoice._id}/status`, {
        status: 'paid',
        payment_date: new Date().toISOString()
      });
      toast.success(`Invoice ${invoice.invoice_number} marked as paid`);
      loadInvoiceData();
    } catch { /* ignore */ }
  };

  const paidCount = invoices.filter(inv => inv.status === 'paid').length;
  const pendingCount = invoices.filter(inv => ['received', 'approved'].includes(inv.status)).length;
  const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;
  const totalPaidAmount = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total_amount, 0);

  const formatPaymentMethod = (method: string) => {
    return method.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-655">
        
        {/* Header section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-905">Invoice Management</h2>
            <p className="text-slate-450 mt-1">Audit, approve, and record payments for vendor invoices</p>
          </div>
          <div className="flex gap-2 font-semibold">
            <button
              onClick={() => toast.info('Create invoice feature coming soon')}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-205 text-slate-700 rounded-xl bg-white hover:bg-slate-50 cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" />
              Create Invoice
            </button>
            <button
              onClick={() => toast.info('Invoice report download started')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-205 text-slate-700 rounded-xl bg-white hover:bg-slate-50 cursor-pointer"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Paid Invoices</p>
              <h3 className="text-lg font-bold text-green-700 font-display mt-1">{paidCount}</h3>
              <p className="text-[9.5px] text-slate-455 mt-0.5">Total: ₹{totalPaidAmount.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <CheckCircleIcon className="w-5.5 h-5.5" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Pending Payments</p>
              <h3 className="text-lg font-bold text-amber-700 font-display mt-1">{pendingCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ClockIcon className="w-5.5 h-5.5" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Overdue Status</p>
              <h3 className="text-lg font-bold text-red-700 font-display mt-1">{overdueCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <ExclamationTriangleIcon className="w-5.5 h-5.5" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Run</p>
              <h3 className="text-lg font-bold text-slate-905 font-display mt-1">{invoices.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <DocumentTextIcon className="w-5.5 h-5.5" />
            </div>
          </div>
        </div>

        {/* Search filter controls */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-card grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-6 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <MagnifyingGlassIcon className="w-4.5 h-4.5" />
            </span>
            <input
              type="text"
              placeholder="Search by invoice number, vendor name, PO number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-205 rounded-xl bg-slate-50/50"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Received">Received</option>
              <option value="Approved">Approved</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <button
              onClick={() => toast.info('Advanced filters coming soon')}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-205 text-slate-700 font-semibold rounded-xl bg-white hover:bg-slate-50 cursor-pointer"
            >
              <AdjustmentsHorizontalIcon className="w-4.5 h-4.5" />
              Advanced Filters
            </button>
          </div>
        </div>

        {/* Table directory */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-bold text-slate-905 font-display mb-3">Invoices List ({filteredInvoices.length})</h3>
          
          <div className="overflow-x-auto border border-slate-50 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase">
                  <th className="pb-3 pt-2 pl-4">Invoice</th>
                  <th className="pb-3 pt-2">Vendor</th>
                  <th className="pb-3 pt-2">Purchase Order</th>
                  <th className="pb-3 pt-2">Invoice Date</th>
                  <th className="pb-3 pt-2">Due Date</th>
                  <th className="pb-3 pt-2">Status</th>
                  <th className="pb-3 pt-2 text-right">Total Amount</th>
                  <th className="pb-3 pt-2">Payment Method</th>
                  <th className="pb-3 pt-2 text-center pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 font-semibold">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">Loading invoice data...</td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">No invoices matched search filters.</td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice._id} className="hover:bg-slate-55/50">
                      <td className="py-3.5 pl-4">
                        <p className="font-bold text-slate-900">{invoice.invoice_number}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">GSTIN: {invoice.vendor_gstin || 'N/A'}</p>
                      </td>
                      <td className="py-3.5 text-slate-805">{invoice.vendor?.vendor_name || 'N/A'}</td>
                      <td className="py-3.5 font-mono text-slate-900">{invoice.purchase_order?.po_number || 'N/A'}</td>
                      <td className="py-3.5 text-slate-655">{format(parseISO(invoice.invoice_date), 'MMM dd, yyyy')}</td>
                      <td className={`py-3.5 ${invoice.status === 'overdue' ? 'text-red-600 font-bold' : ''}`}>
                        {format(parseISO(invoice.due_date), 'MMM dd, yyyy')}
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-full text-[9px] font-bold ${getStatusBadgeClass(invoice.status)}`}>
                          {getStatusIcon(invoice.status)}
                          {invoice.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <p className="font-bold text-slate-900">₹{invoice.total_amount.toLocaleString('en-IN')}</p>
                        <p className="text-[9px] text-slate-400 font-normal">Tax: ₹{invoice.tax_amount.toLocaleString()}</p>
                      </td>
                      <td className="py-3.5">
                        <span className="inline-flex px-2 py-0.5 border border-slate-150 bg-slate-50 text-slate-655 rounded-full text-[9px]">
                          {formatPaymentMethod(invoice.payment_method)}
                        </span>
                      </td>
                      <td className="py-3.5 text-center pr-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewDetails(invoice)}
                            className="p-1.5 text-slate-405 hover:text-brand-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                            title="View Details"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toast.info(`Printing invoice ${invoice.invoice_number}`)}
                            className="p-1.5 text-slate-405 hover:text-green-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                            title="Print Invoice"
                          >
                            <PrinterIcon className="w-4 h-4" />
                          </button>
                          {invoice.status === 'received' && (
                            <button
                              onClick={() => handleApproveInvoice(invoice)}
                              className="p-1.5 text-slate-405 hover:text-green-700 hover:bg-slate-50 rounded-lg cursor-pointer"
                              title="Approve Invoice"
                            >
                              <CheckCircleIcon className="w-4 h-4 text-green-600" />
                            </button>
                          )}
                          {invoice.status === 'approved' && (
                            <button
                              onClick={() => handleMarkAsPaid(invoice)}
                              className="p-1.5 text-slate-405 hover:text-brand-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                              title="Mark as Paid"
                            >
                              <DocumentTextIcon className="w-4 h-4 text-brand-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice details popup */}
        {isDetailModalOpen && selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 max-w-3xl w-full p-6 shadow-card-xl space-y-4 animate-fade-in-up">
              
              <div className="flex items-center justify-between pb-2 border-b border-slate-105">
                <h3 className="text-base font-bold font-display text-slate-900">
                  Invoice Details - {selectedInvoice.invoice_number}
                </h3>
                <button onClick={handleCloseDetailModal} className="p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-lg">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1.5">
                    <h4 className="font-bold text-slate-900 mb-1">Invoice Information</h4>
                    <p><strong>Invoice No:</strong> {selectedInvoice.invoice_number}</p>
                    <p><strong>PO Reference:</strong> {selectedInvoice.purchase_order?.po_number || 'N/A'}</p>
                    <p><strong>Invoice Date:</strong> {format(parseISO(selectedInvoice.invoice_date), 'MMM dd, yyyy')}</p>
                    <p><strong>Due Date:</strong> {format(parseISO(selectedInvoice.due_date), 'MMM dd, yyyy')}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <strong>Status:</strong>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${getStatusBadgeClass(selectedInvoice.status)}`}>
                        {selectedInvoice.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1.5">
                    <h4 className="font-bold text-slate-900 mb-1">Vendor Information</h4>
                    <p><strong>Vendor Name:</strong> {selectedInvoice.vendor?.vendor_name || 'N/A'}</p>
                    <p><strong>GSTIN Number:</strong> {selectedInvoice.vendor_gstin || 'N/A'}</p>
                    <p><strong>Payment Method:</strong> {formatPaymentMethod(selectedInvoice.payment_method)}</p>
                    {selectedInvoice.payment_date && (
                      <p><strong>Payment Date:</strong> {format(parseISO(selectedInvoice.payment_date), 'MMM dd, yyyy')}</p>
                    )}
                    {selectedInvoice.payment_reference && (
                      <p><strong>Payment Ref:</strong> {selectedInvoice.payment_reference}</p>
                    )}
                  </div>
                </div>

                {/* Items details table */}
                <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-2">
                  <h4 className="font-bold text-slate-905">Invoice Items</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                          <th className="pb-2">Description</th>
                          <th className="pb-2 text-right">Qty</th>
                          <th className="pb-2 text-right">Unit Price</th>
                          <th className="pb-2 text-right">Tax Rate</th>
                          <th className="pb-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                        {selectedInvoice.items.map((item) => (
                          <tr key={item.id}>
                            <td className="py-2">{item.description}</td>
                            <td className="py-2 text-right">{item.quantity}</td>
                            <td className="py-2 text-right">₹{item.unitPrice.toLocaleString()}</td>
                            <td className="py-2 text-right">{item.taxRate}%</td>
                            <td className="py-2 text-right text-brand-600">₹{item.totalAmount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                  <div className="space-y-1">
                    <p>Subtotal: ₹{selectedInvoice.subtotal.toLocaleString()}</p>
                    <p>Tax Amount: ₹{selectedInvoice.tax_amount.toLocaleString()}</p>
                  </div>
                  <h4 className="text-sm font-bold text-brand-600">
                    Total Amount: ₹{selectedInvoice.total_amount.toLocaleString()}
                  </h4>
                </div>

                {selectedInvoice.notes && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <h4 className="font-bold text-slate-900 mb-1">Additional Notes</h4>
                    <p className="text-slate-500 leading-relaxed">{selectedInvoice.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 font-semibold">
                <button
                  onClick={handleCloseDetailModal}
                  className="px-4 py-2 border border-slate-200 text-slate-750 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    toast.info(`Printing invoice ${selectedInvoice.invoice_number}`);
                    handleCloseDetailModal();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-205 text-slate-705 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <PrinterIcon className="w-4 h-4" />
                  Print
                </button>
                {selectedInvoice.status === 'received' && (
                  <button
                    onClick={() => {
                      handleApproveInvoice(selectedInvoice);
                      handleCloseDetailModal();
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg cursor-pointer"
                  >
                    Approve Invoice
                  </button>
                )}
                {selectedInvoice.status === 'approved' && (
                  <button
                    onClick={() => {
                      handleMarkAsPaid(selectedInvoice);
                      handleCloseDetailModal();
                    }}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg cursor-pointer"
                  >
                    Mark as Paid
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default InvoicesPage;