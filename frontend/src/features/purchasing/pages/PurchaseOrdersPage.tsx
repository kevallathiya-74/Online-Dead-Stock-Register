import {
    ArrowDownTrayIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentTextIcon,
    EnvelopeIcon,
    ExclamationTriangleIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    PrinterIcon,
    ShoppingCartIcon,
    TruckIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import PurchaseOrderModal from '../components/PurchaseOrderModal';
import { usePolling } from '../../../hooks/usePolling';
import api from '../../../services/api';

interface PurchaseOrder {
  _id: string;
  po_number: string;
  vendor: {
    _id: string;
    name: string;
    vendor_code: string;
    contact_person?: string;
  };
  requested_by: {
    _id: string;
    name: string;
    email: string;
  };
  approved_by?: {
    _id: string;
    name: string;
    email: string;
  };
  department: string;
  items: Array<{
    description: string;
    category: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  currency: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent_to_vendor' | 'acknowledged' | 'in_progress' | 'partially_received' | 'completed' | 'cancelled' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expected_delivery_date: string;
  actual_delivery_date?: string;
  payment_terms: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const PurchaseOrdersPage = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [createPOOpen, setCreatePOOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [viewPOOpen, setViewPOOpen] = useState(false);

  const loadData = async () => {
    try {
      const response = await api.get('/purchase-management/orders');
      const poData = response.data.purchase_orders || response.data.data || response.data || [];
      setPurchaseOrders(Array.isArray(poData) ? poData : []);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    };
    loadInitialData();
  }, []);

  usePolling(async () => {
    await loadData();
  }, {
    interval: 30000,
    enabled: true
  });

  const filteredOrders = purchaseOrders.filter((order) => {
    const matchesSearch = 
      order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.requested_by?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || order.priority === selectedPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-50 text-slate-700 border-slate-100';
      case 'pending_approval': return 'bg-amber-50 text-amber-705 border-amber-100';
      case 'approved': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'sent_to_vendor': return 'bg-sky-50 text-sky-700 border-sky-100';
      case 'acknowledged': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'in_progress': return 'bg-brand-50 text-brand-700 border-brand-100';
      case 'partially_received': return 'bg-amber-50 text-amber-705 border-amber-105';
      case 'completed': return 'bg-green-50 text-green-700 border-green-100';
      case 'cancelled': case 'rejected': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-slate-50 text-slate-705 border-slate-105';
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-50 text-red-700 border-red-100 font-bold';
      case 'high': return 'bg-amber-50 text-amber-705 border-amber-100';
      case 'medium': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'low': return 'bg-slate-50 text-slate-655 border-slate-105';
      default: return 'bg-slate-50 text-slate-655 border-slate-105';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircleIcon className="w-5 h-5 text-blue-600" />;
      case 'completed': return <TruckIcon className="w-5 h-5 text-green-600" />;
      case 'cancelled': case 'rejected': return <XMarkIcon className="w-5 h-5 text-red-600" />;
      case 'pending_approval': return <ClockIcon className="w-5 h-5 text-amber-600" />;
      default: return <ShoppingCartIcon className="w-5 h-5 text-slate-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getPriorityLabel = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const handleCreatePO = async () => {
    await loadData();
    setCreatePOOpen(false);
  };

  const handleViewPO = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setViewPOOpen(true);
  };

  const stats = {
    totalOrders: purchaseOrders.length,
    pendingApproval: purchaseOrders.filter(o => o.status === 'pending_approval').length,
    approved: purchaseOrders.filter(o => o.status === 'approved' || o.status === 'sent_to_vendor').length,
    delivered: purchaseOrders.filter(o => o.status === 'completed').length,
    totalValue: purchaseOrders.reduce((sum, order) => sum + order.total_amount, 0),
    avgOrderValue: purchaseOrders.length > 0 ? 
      purchaseOrders.reduce((sum, order) => sum + order.total_amount, 0) / purchaseOrders.length : 0,
  };

  const recentOrders = purchaseOrders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const urgentOrders = purchaseOrders
    .filter(o => o.priority === 'urgent' && !['completed', 'cancelled', 'rejected'].includes(o.status))
    .slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-655">
        
        {/* Header Title Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-905">Purchase Orders</h2>
            <p className="text-slate-450 mt-1">Manage procurement, vendor orders, and delivery tracking</p>
          </div>
          <button
            onClick={() => setCreatePOOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl cursor-pointer shadow-brand"
          >
            <PlusIcon className="w-4.5 h-4.5" />
            Create Purchase Order
          </button>
        </div>

        {/* Statistics Panels Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-card flex items-center justify-between">
            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400">Total Orders</p>
              <h3 className="text-sm font-bold text-slate-905 font-display mt-0.5">{loading ? '...' : stats.totalOrders}</h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <ShoppingCartIcon className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-card flex items-center justify-between">
            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400">Pending</p>
              <h3 className="text-sm font-bold text-slate-905 font-display mt-0.5">
                {loading ? '...' : stats.pendingApproval}
              </h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center relative">
              <ClockIcon className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-card flex items-center justify-between">
            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400">Approved</p>
              <h3 className="text-sm font-bold text-slate-905 font-display mt-0.5">{loading ? '...' : stats.approved}</h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircleIcon className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-card flex items-center justify-between">
            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400">Delivered</p>
              <h3 className="text-sm font-bold text-slate-905 font-display mt-0.5">{loading ? '...' : stats.delivered}</h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <TruckIcon className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-card flex items-center justify-between col-span-1 md:col-span-1">
            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400">Total Value</p>
              <h3 className="text-[11px] font-bold text-slate-905 font-display mt-0.5">₹{loading ? '...' : Number(stats.totalValue).toLocaleString('en-IN')}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-card flex items-center justify-between col-span-1 md:col-span-1">
            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400">Avg Order</p>
              <h3 className="text-[11px] font-bold text-slate-905 font-display mt-0.5">₹{loading ? '...' : Math.round(stats.avgOrderValue).toLocaleString('en-IN')}</h3>
            </div>
          </div>
        </div>

        {/* Dashboard layouts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Search and Table row */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Filters panel */}
            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-card grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-5 relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <MagnifyingGlassIcon className="w-4.5 h-4.5" />
                </span>
                <input
                  type="text"
                  placeholder="Search purchase orders, vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-205 rounded-xl bg-slate-50/50"
                />
              </div>

              <div className="md:col-span-3">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="sent_to_vendor">Sent to Vendor</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="in_progress">In Progress</option>
                  <option value="partially_received">Partially Received</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="md:col-span-2 text-right text-slate-450 font-bold">
                {filteredOrders.length} of {purchaseOrders.length} matches
              </div>
            </div>

            {/* Main PO Directory table */}
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
              <h3 className="text-sm font-bold text-slate-905 font-display mb-3">Procurement Orders ({filteredOrders.length})</h3>
              
              <div className="overflow-x-auto border border-slate-50 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase">
                      <th className="pb-3 pt-2 pl-4">PO Number</th>
                      <th className="pb-3 pt-2">Vendor</th>
                      <th className="pb-3 pt-2">Status</th>
                      <th className="pb-3 pt-2">Priority</th>
                      <th className="pb-3 pt-2">Dates</th>
                      <th className="pb-3 pt-2 text-right">Amount</th>
                      <th className="pb-3 pt-2 text-center pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700 font-semibold">
                    {loading ? (
                      [1, 2, 3].map(i => (
                        <tr key={i} className="animate-pulse">
                          <td className="py-4 pl-4" colSpan={7}><div className="h-4 bg-slate-100 rounded w-full" /></td>
                        </tr>
                      ))
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold">
                          No purchase orders found.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-slate-55/50">
                          <td className="py-3.5 pl-4">
                            <div className="flex items-center gap-2.5">
                              {getStatusIcon(order.status)}
                              <div>
                                <p className="font-bold text-slate-900">{order.po_number}</p>
                                <p className="text-[9px] text-slate-400 mt-0.5">by {order.requested_by?.name || 'Staff'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5">
                            <p className="font-bold text-slate-905">{order.vendor?.name || 'N/A'}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5 font-mono">{order.vendor?.vendor_code || ''}</p>
                          </td>
                          <td className="py-3.5">
                            <span className={`inline-flex px-2 py-0.5 border rounded-full text-[9px] font-bold ${getStatusBadgeClass(order.status)}`}>
                              {getStatusLabel(order.status)}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <span className={`inline-flex px-2 py-0.5 border rounded-full text-[9px] font-bold ${getPriorityBadgeClass(order.priority)}`}>
                              {getPriorityLabel(order.priority)}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <p className="text-slate-900">Order: {new Date(order.createdAt).toLocaleDateString()}</p>
                            <p className="text-[9.5px] text-slate-450 mt-0.5">Expected: {new Date(order.expected_delivery_date).toLocaleDateString()}</p>
                          </td>
                          <td className="py-3.5 text-right font-bold text-slate-900">
                            <p>₹{Number(order.total_amount || 0).toLocaleString('en-IN')}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5 font-normal">{order.items.length} items</p>
                          </td>
                          <td className="py-3.5 text-center pr-4">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleViewPO(order)}
                                className="p-1.5 text-slate-405 hover:text-brand-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                                title="View PO Details"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toast.info('PDF download coming soon')}
                                className="p-1.5 text-slate-405 hover:text-green-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                                title="Download PDF"
                              >
                                <ArrowDownTrayIcon className="w-4 h-4" />
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

          </div>

          {/* Right sidebars */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Recent Orders List */}
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
              <h4 className="font-bold text-slate-905 text-xs flex items-center gap-1.5 mb-3">
                <ShoppingCartIcon className="w-4.5 h-4.5 text-slate-500" />
                Recent Orders
              </h4>
              
              {loading ? (
                <div className="h-20 bg-slate-50 rounded-xl animate-pulse" />
              ) : recentOrders.length === 0 ? (
                <p className="text-slate-400 text-center py-4">No recent orders</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {recentOrders.map((order) => (
                    <div key={order._id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{order.po_number}</p>
                        <p className="text-[10px] text-slate-450 mt-0.5 truncate max-w-[150px]">{order.vendor?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">₹{Math.round(order.total_amount).toLocaleString('en-IN')}</p>
                        <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[8.5px] font-bold mt-0.5 ${getStatusBadgeClass(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Urgent Deliveries progress */}
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
              <h4 className="font-bold text-slate-905 text-xs flex items-center gap-1.5 mb-3">
                <ExclamationTriangleIcon className="w-4.5 h-4.5 text-red-550" />
                Urgent Lead Tracks
              </h4>
              
              {loading ? (
                <div className="h-24 bg-slate-50 rounded-xl animate-pulse" />
              ) : urgentOrders.length === 0 ? (
                <p className="text-slate-400 text-center py-4">No urgent open orders</p>
              ) : (
                <div className="space-y-4">
                  {urgentOrders.map((order) => {
                    const elapsed = new Date().getTime() - new Date(order.createdAt).getTime();
                    const total = new Date(order.expected_delivery_date).getTime() - new Date(order.createdAt).getTime();
                    const percent = total > 0 ? Math.min((elapsed / total) * 100, 100) : 100;
                    return (
                      <div key={order._id} className="space-y-1.5">
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-slate-900">{order.po_number}</span>
                          <span className="text-[10px] text-slate-400">Due: {new Date(order.expected_delivery_date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{order.vendor?.name}</p>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-red-500 h-full" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Create PO Modal Form wrapper */}
        <PurchaseOrderModal
          open={createPOOpen}
          onClose={() => setCreatePOOpen(false)}
          onSubmit={handleCreatePO}
        />

        {/* View PO Details popup sheet */}
        {viewPOOpen && selectedPO && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 max-w-4xl w-full h-[85vh] flex flex-col shadow-card-xl animate-fade-in-up">
              
              {/* Header title */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <DocumentTextIcon className="w-5 h-5 text-brand-600" />
                  <h3 className="text-base font-bold font-display text-slate-905">
                    Purchase Order Details - {selectedPO.po_number}
                  </h3>
                </div>
                <button onClick={() => setViewPOOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable specs summary sheets */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
                    <h4 className="font-bold text-slate-900 mb-1">Order Information</h4>
                    <p><strong>Vendor Name:</strong> {selectedPO.vendor?.name || 'N/A'}</p>
                    <p><strong>Vendor Code:</strong> {selectedPO.vendor?.vendor_code || 'N/A'}</p>
                    <p><strong>Order Created:</strong> {new Date(selectedPO.createdAt).toLocaleString()}</p>
                    <p><strong>Expected Delivery:</strong> {new Date(selectedPO.expected_delivery_date).toLocaleDateString()}</p>
                    <p><strong>Payment Terms:</strong> {selectedPO.payment_terms}</p>
                    <p><strong>Department Scope:</strong> {selectedPO.department}</p>
                    <div className="pt-1 flex items-center gap-1">
                      <strong>Current Status:</strong>
                      <span className={`px-2 py-0.5 border rounded-full text-[9px] font-bold ${getStatusBadgeClass(selectedPO.status)}`}>
                        {getStatusLabel(selectedPO.status)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
                    <h4 className="font-bold text-slate-900 mb-1">Financial Summary</h4>
                    <p><strong>Subtotal Value:</strong> ₹{Number(selectedPO.subtotal || 0).toLocaleString('en-IN')}</p>
                    <p><strong>Tax Value:</strong> ₹{Number(selectedPO.tax_amount || 0).toLocaleString('en-IN')}</p>
                    <p><strong>Shipping Cost:</strong> ₹{Number(selectedPO.shipping_cost || 0).toLocaleString('en-IN')}</p>
                    <p className="text-slate-900 font-bold border-t border-slate-200 pt-1">
                      <strong>Total Amount:</strong> ₹{Number(selectedPO.total_amount || 0).toLocaleString('en-IN')}
                    </p>
                    <p><strong>Currency:</strong> {selectedPO.currency}</p>
                  </div>
                </div>

                {/* Items detail list table */}
                <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-slate-905">Ordered Line Items</h4>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                        <th className="pb-2">Description</th>
                        <th className="pb-2">Category</th>
                        <th className="pb-2 text-center">Qty</th>
                        <th className="pb-2 text-right">Unit Price</th>
                        <th className="pb-2 text-right">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                      {selectedPO.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2">{item.description}</td>
                          <td className="py-2 text-slate-500">{item.category}</td>
                          <td className="py-2 text-center">{item.quantity}</td>
                          <td className="py-2 text-right">₹{Number(item.unit_price).toLocaleString('en-IN')}</td>
                          <td className="py-2 text-right text-brand-600">₹{Number(item.total_price).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
                  <h4 className="font-bold text-slate-900 mb-1">Authorization Context</h4>
                  <p><strong>Requested staff:</strong> {selectedPO.requested_by?.name} ({selectedPO.requested_by?.email})</p>
                  {selectedPO.approved_by && (
                    <p className="mt-1"><strong>Approved Supervisor:</strong> {selectedPO.approved_by.name} ({selectedPO.approved_by.email})</p>
                  )}
                </div>

                {selectedPO.notes && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <h4 className="font-bold text-slate-900 mb-1">Additional Notes</h4>
                    <p className="leading-relaxed whitespace-pre-wrap">{selectedPO.notes}</p>
                  </div>
                )}

              </div>

              {/* Action buttons footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0 bg-slate-50/50 font-semibold">
                <button
                  onClick={() => toast.info('Printing coming soon')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-205 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <PrinterIcon className="w-4 h-4" />
                  Print
                </button>
                <button
                  onClick={() => toast.info('Email notification coming soon')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-205 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <EnvelopeIcon className="w-4 h-4" />
                  Email Vendor
                </button>
                <button
                  onClick={() => setViewPOOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg cursor-pointer"
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

export default PurchaseOrdersPage;