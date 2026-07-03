import {
    ArchiveBoxIcon,
    ArrowPathIcon,
    ArrowTrendingUpIcon,
    BanknotesIcon,
    EyeIcon,
    ShoppingCartIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { getRecentOrders, getVendorStats } from '../services/vendorPortal.service';
import type { VendorOrder, VendorStats } from '../../../types';

const VendorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, ordersData] = await Promise.all([
        getVendorStats(),
        getRecentOrders()
      ]);
      setStats(statsData);
      setRecentOrders(ordersData);
    } catch (err: any) {
      const errorMessage = (err as any).response?.data?.message || 'Failed to load dashboard data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const intervalId = setInterval(loadDashboardData, 120000);
    return () => clearInterval(intervalId);
  }, []);

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-50 text-green-700 border border-green-100';
      case 'in_progress': case 'acknowledged': return 'bg-blue-50 text-blue-700 border border-blue-105';
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

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-brand-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center justify-between font-semibold text-xs">
          <span>{error}</span>
          <button onClick={loadDashboardData} className="px-3 py-1 bg-red-650 hover:bg-red-700 text-white rounded-lg">Retry</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-655">
        
        {/* Header Title Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-905">Vendor Dashboard</h2>
            {/* eslint-disable-next-line react/no-unescaped-entities */}
            <p className="text-slate-455 mt-1">Welcome back! Here's an overview of your business operations.</p>
          </div>
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-205 text-slate-700 font-semibold rounded-xl bg-white hover:bg-slate-50 cursor-pointer"
          >
            <ArrowPathIcon className="w-4 h-4 animate-spin-hover" />
            Refresh
          </button>
        </div>

        {/* Stats Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div 
            onClick={() => navigate('/vendor/orders')}
            className="bg-white border border-slate-100 rounded-xl p-5 shadow-card flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
          >
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Orders</p>
              <h3 className="text-lg font-bold text-slate-905 font-display mt-1">{stats?.totalOrders || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <ShoppingCartIcon className="w-5.5 h-5.5" />
            </div>
          </div>

          <div 
            onClick={() => navigate('/vendor/orders?status=pending')}
            className="bg-white border border-slate-100 rounded-xl p-5 shadow-card flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
          >
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Pending Orders</p>
              <h3 className="text-lg font-bold text-amber-705 font-display mt-1">{stats?.pendingOrders || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ArrowTrendingUpIcon className="w-5.5 h-5.5" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Revenue</p>
              <h3 className="text-md font-bold text-green-700 font-display mt-1">{formatCurrency(stats?.totalRevenue || 0)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <BanknotesIcon className="w-5.5 h-5.5" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Performance Score</p>
              <h3 className="text-lg font-bold text-purple-700 font-display mt-1">{stats?.performanceScore || 0}%</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-650 flex items-center justify-center">
              <ArrowTrendingUpIcon className="w-5.5 h-5.5" />
            </div>
          </div>
        </div>

        {/* Quick Stats Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div 
            onClick={() => navigate('/vendor/products')}
            className="bg-white border border-slate-100 rounded-xl p-5 shadow-card flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div>
              <h4 className="font-bold text-slate-905 text-sm">Active Catalog Products</h4>
              <p className="text-3xl font-bold font-display text-brand-600 mt-2">{stats?.activeProducts || 0}</p>
            </div>
            <ArchiveBoxIcon className="w-12 h-12 text-slate-200" />
          </div>

          <div 
            onClick={() => navigate('/vendor/orders?status=completed')}
            className="bg-white border border-slate-100 rounded-xl p-5 shadow-card flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div>
              <h4 className="font-bold text-slate-905 text-sm">Completed Fulfilments</h4>
              <p className="text-3xl font-bold font-display text-green-600 mt-2">{stats?.completedOrders || 0}</p>
            </div>
            <ShoppingCartIcon className="w-12 h-12 text-slate-200" />
          </div>

          <div 
            onClick={() => navigate('/vendor/invoices')}
            className="bg-white border border-slate-100 rounded-xl p-5 shadow-card flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div>
              <h4 className="font-bold text-slate-905 text-sm">Open Outstanding Invoices</h4>
              <p className="text-3xl font-bold font-display text-amber-600 mt-2">{stats?.pendingInvoices || 0}</p>
            </div>
            <BanknotesIcon className="w-12 h-12 text-slate-200" />
          </div>
        </div>

        {/* Recent Orders table */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-905 font-display">Recent Orders Overview</h3>
            <button
              onClick={() => navigate('/vendor/orders')}
              className="text-brand-600 hover:text-brand-700 font-bold"
            >
              View All Orders →
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-50 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase">
                  <th className="pb-3 pt-2 pl-4">Order Number</th>
                  <th className="pb-3 pt-2">Order Date</th>
                  <th className="pb-3 pt-2">Items</th>
                  <th className="pb-3 pt-2">Amount</th>
                  <th className="pb-3 pt-2">Status</th>
                  <th className="pb-3 pt-2">Priority</th>
                  <th className="pb-3 pt-2 text-center pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 font-semibold">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-slate-55/50">
                      <td className="py-3.5 pl-4 text-slate-900 font-bold">{order.po_number}</td>
                      <td className="py-3.5 text-slate-655">{format(new Date(order.order_date), 'MMM dd, yyyy')}</td>
                      <td className="py-3.5 text-slate-805">{order.items_count} items</td>
                      <td className="py-3.5 text-slate-900 font-bold">{formatCurrency(order.total_amount)}</td>
                      <td className="py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusBadgeClass(order.status)}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getPriorityBadgeClass(order.priority)}`}>
                          {order.priority}
                        </span>
                      </td>
                      <td className="py-3.5 text-center pr-4">
                        <button
                          onClick={() => navigate(`/vendor/orders`)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold">No recent orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default VendorDashboard;
