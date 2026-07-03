import {
    EyeIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { getOrderById, getOrders } from '../services/vendorPortal.service';
import type { VendorOrder } from '../../../types';

const VendorOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    loadOrders();
  {/* eslint-disable-next-line react-hooks/exhaustive-deps */}
  }, [page, rowsPerPage, searchTerm, statusFilter, priorityFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string | number> = {
        page: page + 1,
        limit: rowsPerPage
      };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const { orders: ordersData, pagination } = await getOrders(params);
      setOrders(ordersData);
      setTotalOrders(pagination.total);
    } catch (err: any) {
      setError((err as any).response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (orderId: string) => {
    try {
      setDetailsLoading(true);
      setDetailsOpen(true);
      const orderDetails = await getOrderById(orderId);
      setSelectedOrder(orderDetails);
    } catch (err: any) {
      setError((err as any).response?.data?.message || 'Failed to load order details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedOrder(null);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-50 text-green-700 border border-green-105';
      case 'in_progress': case 'acknowledged': return 'bg-blue-50 text-blue-700 border border-blue-100';
      case 'pending_approval': case 'approved': return 'bg-amber-50 text-amber-705 border border-amber-100';
      case 'cancelled': case 'rejected': return 'bg-red-50 text-red-700 border border-red-100';
      default: return 'bg-slate-50 text-slate-705 border border-slate-105';
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-red-50 text-red-700 border border-red-100 font-bold';
      case 'high': return 'bg-amber-50 text-amber-705 border border-amber-100';
      case 'medium': return 'bg-blue-50 text-blue-700 border border-blue-105';
      default: return 'bg-slate-50 text-slate-705 border border-slate-105';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-655">
        
        {/* Header Section */}
        <div>
          <h2 className="text-xl font-bold font-display text-slate-905">My Orders</h2>
          <p className="text-slate-455 mt-1">View and manage all your purchase orders</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center justify-between font-semibold">
            <span>{error}</span>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {/* Filters bar */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-card grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-6 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <MagnifyingGlassIcon className="w-4.5 h-4.5" />
            </span>
            <input
              type="text"
              placeholder="Search by order number..."
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
              <option value="">All Statuses</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="sent_to_vendor">Sent to Vendor</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-bold text-slate-905 font-display mb-3">Order Listing</h3>
          
          <div className="overflow-x-auto border border-slate-50 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase">
                  <th className="pb-3 pt-2 pl-4">Order Number</th>
                  <th className="pb-3 pt-2">Date</th>
                  <th className="pb-3 pt-2">Items Count</th>
                  <th className="pb-3 pt-2">Amount</th>
                  <th className="pb-3 pt-2">Status</th>
                  <th className="pb-3 pt-2">Priority</th>
                  <th className="pb-3 pt-2">Expected Delivery</th>
                  <th className="pb-3 pt-2 text-center pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 font-semibold">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      <div className="inline-block w-6 h-6 rounded-full border-2 border-slate-200 border-t-brand-600 animate-spin" />
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">No orders found.</td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id} className="hover:bg-slate-55/50">
                      <td className="py-3.5 pl-4 text-slate-900 font-bold">{order.po_number}</td>
                      <td className="py-3.5 text-slate-655">{format(new Date(order.order_date), 'MMM dd, yyyy')}</td>
                      <td className="py-3.5 text-slate-805">{order.items_count} items</td>
                      <td className="py-3.5 text-slate-900 font-bold">{formatCurrency(order.total_amount)}</td>
                      <td className="py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusBadgeClass(order.status)}`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getPriorityBadgeClass(order.priority)}`}>
                          {order.priority}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-655">{format(new Date(order.expected_delivery_date), 'MMM dd, yyyy')}</td>
                      <td className="py-3.5 text-center pr-4">
                        <button
                          onClick={() => handleViewDetails(order._id)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                          title="View Order Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Simple custom pagination */}
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
              <span className="py-1 px-2 text-slate-700">Page {page + 1} of {Math.ceil(totalOrders / rowsPerPage) || 1}</span>
              <button
                disabled={page >= Math.ceil(totalOrders / rowsPerPage) - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 border border-slate-205 rounded hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Order Details dialog sheet */}
        {detailsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 max-w-3xl w-full p-6 shadow-card-xl space-y-4 animate-fade-in-up">
              
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-base font-bold font-display text-slate-900">Order Details</h3>
                <button onClick={handleCloseDetails} className="p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-lg">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {detailsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-brand-600 animate-spin" />
                </div>
              ) : selectedOrder ? (
                <div className="space-y-4 text-slate-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400">Order Number:</p>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedOrder.po_number}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Status:</p>
                      <span className={`inline-flex px-2 py-0.5 border rounded-full text-[9px] font-bold mt-1 ${getStatusBadgeClass(selectedOrder.status)}`}>
                        {selectedOrder.status?.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Order Date:</p>
                      <p className="font-semibold text-slate-805 mt-0.5">
                        {format(new Date((selectedOrder as any).createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Expected Delivery Date:</p>
                      <p className="font-semibold text-slate-805 mt-0.5">
                        {format(new Date((selectedOrder as any).expected_delivery_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>

                  {/* Line Items table */}
                  <div className="bg-slate-55 border border-slate-100 rounded-xl p-4 space-y-2">
                    <h4 className="font-bold text-slate-905">Ordered Line Items</h4>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase">
                          <th className="pb-1.5">Description</th>
                          <th className="pb-1.5">Category</th>
                          <th className="pb-1.5 text-center">Qty</th>
                          <th className="pb-1.5 text-right">Unit Price</th>
                          <th className="pb-1.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {(selectedOrder as any).items?.map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-2">{item.description}</td>
                            <td className="py-2 text-slate-500">{item.category}</td>
                            <td className="py-2 text-center">{item.quantity}</td>
                            <td className="py-2 text-right">₹{item.unit_price?.toLocaleString()}</td>
                            <td className="py-2 text-right text-brand-600">₹{item.total_price?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Financials */}
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                    <div className="space-y-1">
                      <p>Subtotal: {formatCurrency((selectedOrder as any).subtotal)}</p>
                      {(selectedOrder as any).tax_amount > 0 && <p>Tax: {formatCurrency((selectedOrder as any).tax_amount)}</p>}
                      {(selectedOrder as any).shipping_cost > 0 && <p>Shipping: {formatCurrency((selectedOrder as any).shipping_cost)}</p>}
                    </div>
                    <h4 className="text-sm font-bold text-brand-600">
                      Total Value: {formatCurrency((selectedOrder as any).total_amount)}
                    </h4>
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end pt-3 border-t border-slate-105 font-semibold">
                <button
                  onClick={handleCloseDetails}
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

export default VendorOrdersPage;
