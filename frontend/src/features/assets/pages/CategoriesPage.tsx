import {
    PencilSquareIcon,
    PlusIcon,
    TagIcon,
    TrashIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import api from '../../../services/api';

interface AssetCategory {
  _id: string;
  name: string;
  description: string;
  count: number;
  icon?: string;
  color?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentCategory, setCurrentCategory] = useState<AssetCategory | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/assets/categories');
      if (response.data?.success && Array.isArray(response.data?.data)) {
        setCategories(response.data.data);
      } else {
        setCategories([]);
      }
    } catch (error: any) {
      setCategories([]);
      toast.error(error?.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category?: AssetCategory) => {
    if (category) {
      setEditMode(true);
      setCurrentCategory(category);
    } else {
      setEditMode(false);
      setCurrentCategory({
        _id: '',
        name: '',
        description: '',
        count: 0,
        color: '#4f46e5',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentCategory(null);
    setEditMode(false);
  };

  const handleSaveCategory = async () => {
    if (!currentCategory?.name?.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      const payload = {
        name: currentCategory.name.trim(),
        description: currentCategory.description?.trim() || '',
        color: currentCategory.color || '#4f46e5',
      };

      if (editMode && currentCategory._id) {
        const response = await api.put(`/assets/categories/${currentCategory._id}`, payload);
        if (response.data?.success) {
          toast.success('Category updated successfully');
        }
      } else {
        const response = await api.post('/assets/categories', payload);
        if (response.data?.success) {
          toast.success('Category created successfully');
        }
      }
      await fetchCategories();
      handleCloseDialog();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to save category';
      toast.error(errorMsg);
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string, assetCount: number) => {
    if (assetCount > 0) {
      toast.warning(`Cannot delete "${categoryName}". This category has ${assetCount} asset${assetCount > 1 ? 's' : ''} assigned to it. Please reassign or remove the assets first.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the "${categoryName}" category? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await api.delete(`/assets/categories/${categoryId}`);
      if (response.data?.success) {
        toast.success('Category deleted successfully');
        await fetchCategories();
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || 'Failed to delete category';
      toast.error(errorMsg);
    }
  };

  const totalAssets = categories.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold font-display text-slate-905">Asset Categories</h2>
            <p className="text-sm text-slate-500 mt-1">Manage asset categories and classifications</p>
          </div>
          <div>
            <button
              onClick={() => handleOpenDialog()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-brand hover:shadow-brand-lg"
            >
              <PlusIcon className="w-4 h-4" />
              Add Category
            </button>
          </div>
        </div>

        {/* Stats Grid Card */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
          <div className="grid grid-cols-3 gap-6 text-center divide-x divide-slate-100">
            <div>
              <h4 className="text-3xl font-bold text-slate-900 font-display">{categories.length}</h4>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Total Categories</p>
            </div>
            <div>
              <h4 className="text-3xl font-bold text-slate-900 font-display">{totalAssets}</h4>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Total Assets</p>
            </div>
            <div>
              <h4 className="text-3xl font-bold text-slate-900 font-display">
                {categories.length > 0 ? Math.round(totalAssets / categories.length) : 0}
              </h4>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Avg. Assets per Cat</p>
            </div>
          </div>
        </div>

        {/* Categories list */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-brand-600 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {categories.map((category) => (
              <div
                key={category._id}
                className="bg-white rounded-2xl border border-slate-100 shadow-card flex flex-col justify-between overflow-hidden"
                style={{ borderTop: `4px solid ${category.color || '#4f46e5'}` }}
              >
                <div className="p-5 flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-brand-600 flex-shrink-0">
                      <TagIcon className="w-5 h-5" style={{ color: category.color }} />
                    </div>
                    <span className="text-[10px] font-bold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full border border-brand-100">
                      {category.count} Assets
                    </span>
                  </div>

                  <div>
                    <h4 className="font-semibold font-display text-slate-900 text-sm">{category.name}</h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-3">
                      {category.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-3.5 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleOpenDialog(category)}
                    className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
                    title="Edit category"
                  >
                    <PencilSquareIcon className="w-4.5 h-4.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteCategory(category._id, category.name, category.count)}
                    disabled={category.count > 0}
                    className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title={category.count > 0 ? `Cannot delete - assigned to assets` : 'Delete category'}
                  >
                    <TrashIcon className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog overlay */}
      {openDialog && currentCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full shadow-card-xl p-6 space-y-4 animate-fade-in-up text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold font-display text-slate-900">
                {editMode ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button onClick={handleCloseDialog} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
                <XMarkIcon className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-655 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={currentCategory.name}
                  onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                  placeholder="e.g. IT Equipment"
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Description</label>
                <textarea
                  value={currentCategory.description}
                  onChange={(e) => setCurrentCategory({ ...currentCategory, description: e.target.value })}
                  placeholder="Description of category..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Theme Color (Hex)</label>
                <input
                  type="text"
                  value={currentCategory.color}
                  onChange={(e) => setCurrentCategory({ ...currentCategory, color: e.target.value })}
                  placeholder="#4f46e5"
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={handleCloseDialog}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {editMode ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CategoriesPage;
