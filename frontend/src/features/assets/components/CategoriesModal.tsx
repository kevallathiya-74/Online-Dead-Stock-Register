import {
    PencilSquareIcon,
    PlusIcon,
    TagIcon,
    TrashIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
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

interface CategoriesModalProps {
  open: boolean;
  onClose: () => void;
}

const CategoriesModal: React.FC<CategoriesModalProps> = ({ open, onClose }) => {
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [openCategoryDialog, setOpenCategoryDialog] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentCategory, setCurrentCategory] = useState<AssetCategory | null>(null);

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

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

  const handleOpenCategoryDialog = (category?: AssetCategory) => {
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
        color: '#1976d2',
      });
    }
    setOpenCategoryDialog(true);
  };

  const handleCloseCategoryDialog = () => {
    setOpenCategoryDialog(false);
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
        color: currentCategory.color || '#1976d2',
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
      handleCloseCategoryDialog();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.delete(`/assets/categories/${categoryId}`);
      if (response.data?.success) {
        toast.success('Category deleted successfully');
        await fetchCategories();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete category');
    }
  };

  if (!open) return null;

  const totalAssets = categories.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-xs text-slate-655">
      <div className="bg-white rounded-2xl border border-slate-100 max-w-4xl w-full h-[85vh] flex flex-col shadow-card-xl animate-fade-in-up">
        
        {/* Header Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-base font-bold font-display text-slate-900">Asset Categories</h3>
            <p className="text-[10px] text-slate-450 mt-0.5">Manage asset categories and classifications</p>
          </div>
          <div className="flex items-center gap-3 font-semibold">
            <button
              onClick={() => handleOpenCategoryDialog()}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" />
              Add Category
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-605 hover:bg-slate-50 rounded-lg cursor-pointer">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Summary Banner Statistics */}
          <div className="grid grid-cols-3 gap-4 bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
            <div>
              <p className="text-lg font-bold text-brand-600 font-display">{categories.length}</p>
              <p className="text-[10px] text-slate-450 mt-0.5">Total Categories</p>
            </div>
            <div>
              <p className="text-lg font-bold text-brand-600 font-display">{totalAssets}</p>
              <p className="text-[10px] text-slate-455 mt-0.5">Total Assets</p>
            </div>
            <div>
              <p className="text-lg font-bold text-brand-600 font-display">
                {categories.length > 0 ? Math.round(totalAssets / categories.length) : 0}
              </p>
              <p className="text-[10px] text-slate-450 mt-0.5">Avg. per Category</p>
            </div>
          </div>

          {/* Categories Cards Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-brand-600 animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <TagIcon className="w-12 h-12 text-slate-350 mx-auto" />
              <h4 className="font-bold text-slate-800">No Categories Found</h4>
              <p className="text-slate-450 text-[10px]">Create classifications to organize your assets.</p>
              <button
                onClick={() => handleOpenCategoryDialog()}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg cursor-pointer"
              >
                Add Category
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((c) => (
                <div
                  key={c._id}
                  style={{ borderTopColor: c.color || '#1976d2' }}
                  className="bg-white border-t-4 border border-slate-100 rounded-xl p-4 shadow-card hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <TagIcon className="w-5 h-5 flex-shrink-0" style={{ color: c.color || '#1976d2' }} />
                        <h4 className="font-bold text-slate-900 truncate max-w-[120px]">{c.name}</h4>
                      </div>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-150 rounded-full font-bold text-[9px]">{c.count} Assets</span>
                    </div>
                    <p className="text-slate-450 leading-relaxed min-h-[30px] line-clamp-2">{c.description || 'No description provided'}</p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-50 mt-3">
                    <button
                      onClick={() => handleOpenCategoryDialog(c)}
                      className="p-1.5 text-slate-450 hover:text-brand-600 hover:bg-brand-50/50 rounded-lg cursor-pointer"
                      title="Edit Category"
                    >
                      <PencilSquareIcon className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(c._id)}
                      className="p-1.5 text-slate-405 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                      title="Delete Category"
                    >
                      <TrashIcon className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0 bg-slate-50/50 font-semibold">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-205 text-slate-705 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Embedded dialog for Category Edit/Add */}
      {openCategoryDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-card-xl p-6 space-y-4 animate-fade-in-up">
            <h3 className="text-base font-bold font-display text-slate-900 border-b border-slate-50 pb-2">
              {editMode ? 'Edit Category' : 'Add New Category'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-655 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={currentCategory?.name || ''}
                  onChange={(e) => setCurrentCategory({ ...currentCategory!, name: e.target.value })}
                  placeholder="e.g. Computers, Furniture"
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={currentCategory?.description || ''}
                  onChange={(e) => setCurrentCategory({ ...currentCategory!, description: e.target.value })}
                  placeholder="Describe classification use cases..."
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Color (Hex)</label>
                <input
                  type="text"
                  placeholder="#1976d2"
                  value={currentCategory?.color || ''}
                  onChange={(e) => setCurrentCategory({ ...currentCategory!, color: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-50 font-semibold">
              <button
                onClick={handleCloseCategoryDialog}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg cursor-pointer"
              >
                {editMode ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesModal;
