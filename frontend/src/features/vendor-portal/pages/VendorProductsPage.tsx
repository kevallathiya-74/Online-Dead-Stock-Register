import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { getProducts } from '../services/vendorPortal.service';
import type { VendorProduct } from '../../../types';

const VendorProductsPage: React.FC = () => {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    loadProducts();
  {/* eslint-disable-next-line react-hooks/exhaustive-deps */}
  }, [page, rowsPerPage, searchTerm, categoryFilter, statusFilter]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string | number> = {
        page: page + 1,
        limit: rowsPerPage
      };
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;

      const { products: productsData, pagination } = await getProducts(params);
      setProducts(productsData);
      setTotalProducts(pagination.total);
    } catch (err: any) {
      setError((err as any).response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-50 text-green-700 border border-green-105';
      case 'in_maintenance': return 'bg-amber-50 text-amber-705 border border-amber-100';
      case 'disposed': return 'bg-red-50 text-red-700 border border-red-100';
      default: return 'bg-slate-50 text-slate-705 border border-slate-105';
    }
  };

  const getConditionBadgeClass = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'excellent': return 'bg-green-50 text-green-705 border border-green-100';
      case 'good': return 'bg-blue-50 text-blue-700 border border-blue-100';
      case 'fair': return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'poor': case 'damaged': return 'bg-red-50 text-red-700 border border-red-100';
      default: return 'bg-slate-50 text-slate-705 border border-slate-105';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-655">
        
        {/* Header Section */}
        <div>
          <h2 className="text-xl font-bold font-display text-slate-905">My Products</h2>
          <p className="text-slate-455 mt-1">View all products (assets) supplied by your company</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center justify-between font-semibold">
            <span>{error}</span>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {/* Filters control Row */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-card grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-6 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <MagnifyingGlassIcon className="w-4.5 h-4.5" />
            </span>
            <input
              type="text"
              placeholder="Search by product name, ID, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-205 rounded-xl bg-slate-50/50"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
            >
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Furniture">Furniture</option>
              <option value="Equipment">Equipment</option>
              <option value="Vehicles">Vehicles</option>
              <option value="Tools">Tools</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="in_maintenance">In Maintenance</option>
              <option value="disposed">Disposed</option>
            </select>
          </div>
        </div>

        {/* Products Directory table */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-bold text-slate-905 font-display mb-3">Products Supplied</h3>
          
          <div className="overflow-x-auto border border-slate-50 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase">
                  <th className="pb-3 pt-2 pl-4">Asset ID</th>
                  <th className="pb-3 pt-2">Product Name</th>
                  <th className="pb-3 pt-2">Category</th>
                  <th className="pb-3 pt-2">Status</th>
                  <th className="pb-3 pt-2">Condition</th>
                  <th className="pb-3 pt-2 text-right">Purchase Price</th>
                  <th className="pb-3 pt-2 text-right">Current Value</th>
                  <th className="pb-3 pt-2">Purchase Date</th>
                  <th className="pb-3 pt-2 pr-4">Assigned To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 font-semibold">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      <div className="inline-block w-6 h-6 rounded-full border-2 border-slate-200 border-t-brand-600 animate-spin" />
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">No products found</td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product._id} className="hover:bg-slate-55/50">
                      <td className="py-3.5 pl-4 text-slate-900 font-bold font-mono">{product.asset_id}</td>
                      <td className="py-3.5">
                        <p className="font-bold text-slate-905">{product.name}</p>
                        {product.description && (
                          <p className="text-[10px] text-slate-400 font-normal mt-0.5 max-w-xs truncate">
                            {product.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 text-slate-655">{product.category}</td>
                      <td className="py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusBadgeClass(product.status)}`}>
                          {product.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getConditionBadgeClass(product.condition)}`}>
                          {product.condition}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-bold text-slate-900">{formatCurrency(product.purchase_cost)}</td>
                      <td className="py-3.5 text-right font-bold text-brand-605">{formatCurrency(product.current_value)}</td>
                      <td className="py-3.5 text-slate-655">{format(new Date(product.purchase_date), 'MMM dd, yyyy')}</td>
                      <td className="py-3.5 pr-4">
                        {product.assigned_to ? (
                          <div>
                            <p className="font-bold text-slate-900">{product.assigned_to.name}</p>
                            <p className="text-[9px] text-slate-405 mt-0.5">{product.assigned_to.department}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400">Unassigned</span>
                        )}
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
                <option value={10}>10</option>
                <option value={20}>20</option>
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
              <span className="py-1 px-2 text-slate-700">Page {page + 1} of {Math.ceil(totalProducts / rowsPerPage) || 1}</span>
              <button
                disabled={page >= Math.ceil(totalProducts / rowsPerPage) - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 border border-slate-205 rounded hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default VendorProductsPage;
