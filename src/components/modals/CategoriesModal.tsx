import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  TextField,
  Chip,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as CategoryIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';

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
      console.log('Categories API response:', response.data);

      if (response.data?.success && Array.isArray(response.data?.data)) {
        setCategories(response.data.data);
      } else {
        setCategories([]);
        console.warn('No categories in response or invalid format');
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
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
      console.error('Error saving category:', error);
      const errorMsg = error?.response?.data?.message || 'Failed to save category';
      toast.error(errorMsg);
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
      console.error('Error deleting category:', error);
      const errorMsg = error?.response?.data?.message || 'Failed to delete category';
      toast.error(errorMsg);
    }
  };

  const totalAssets = categories.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: '80vh',
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h5" component="div" fontWeight="bold">
                Asset Categories
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage asset categories and classifications
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => handleOpenCategoryDialog()}
              >
                Add Category
              </Button>
              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {/* Summary Card */}
          <Paper sx={{ p: 2, mb: 3 }} elevation={0} variant="outlined">
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {categories.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Categories
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {totalAssets}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Assets
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {categories.length > 0 ? Math.round(totalAssets / categories.length) : 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg. per Category
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Categories Grid */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
              <CircularProgress />
            </Box>
          ) : categories.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CategoryIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No categories found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Get started by creating your first asset category
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenCategoryDialog()}
              >
                Add Category
              </Button>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {categories.map((category) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={category._id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderTop: `4px solid ${category.color || '#1976d2'}`,
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                        <CategoryIcon
                          sx={{
                            color: category.color || '#1976d2',
                            fontSize: 36,
                            mr: 1.5,
                          }}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" component="div" sx={{ mb: 0.5 }}>
                            {category.name}
                          </Typography>
                          <Chip
                            label={`${category.count} Assets`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        {category.description || 'No description'}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenCategoryDialog(category)}
                        title="Edit category"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteCategory(category._id)}
                        title="Delete category"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Category Dialog */}
      <Dialog
        open={openCategoryDialog}
        onClose={handleCloseCategoryDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editMode ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Category Name"
              fullWidth
              required
              value={currentCategory?.name || ''}
              onChange={(e) =>
                setCurrentCategory({ ...currentCategory!, name: e.target.value })
              }
              placeholder="e.g., Computers, Furniture, Vehicles"
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={currentCategory?.description || ''}
              onChange={(e) =>
                setCurrentCategory({ ...currentCategory!, description: e.target.value })
              }
              placeholder="Brief description of this category"
            />
            <TextField
              label="Color (Hex)"
              fullWidth
              placeholder="#1976d2"
              value={currentCategory?.color || ''}
              onChange={(e) =>
                setCurrentCategory({ ...currentCategory!, color: e.target.value })
              }
              helperText="Choose a color to identify this category visually"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseCategoryDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveCategory}>
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CategoriesModal;
