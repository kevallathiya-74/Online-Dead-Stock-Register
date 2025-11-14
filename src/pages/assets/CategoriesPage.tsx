import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as CategoryIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';

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
      console.log('Categories API response:', response.data);

      if (response.data?.success && Array.isArray(response.data?.data)) {
        setCategories(response.data.data);
      } else {
        setCategories([]);
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
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
        color: '#1976d2',
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
      handleCloseDialog();
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
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Asset Categories
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Manage asset categories and classifications
            </Typography>
          </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Category
        </Button>
      </Box>

      {/* Summary Card */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary">
                {categories.length}
              </Typography>
              <Typography color="text.secondary">
                Total Categories
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary">
                {totalAssets}
              </Typography>
              <Typography color="text.secondary">
                Total Assets
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary">
                {categories.length > 0 ? Math.round(totalAssets / categories.length) : 0}
              </Typography>
              <Typography color="text.secondary">
                Avg. Assets per Category
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Categories Grid */}
      {loading ? (
        <Typography align="center">Loading categories...</Typography>
      ) : (
        <Grid container spacing={3}>
          {categories.map((category) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={category._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderTop: `4px solid ${category.color || '#1976d2'}`,
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CategoryIcon sx={{ color: category.color || '#1976d2', fontSize: 40, mr: 1 }} />
                    <Box>
                      <Typography variant="h6" component="div">
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
                  <Typography variant="body2" color="text.secondary">
                    {category.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleOpenDialog(category)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteCategory(category._id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add/Edit Category Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Category Name"
              fullWidth
              required
              value={currentCategory?.name || ''}
              onChange={(e) => setCurrentCategory({ ...currentCategory!, name: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={currentCategory?.description || ''}
              onChange={(e) => setCurrentCategory({ ...currentCategory!, description: e.target.value })}
            />
            <TextField
              label="Color (Hex)"
              fullWidth
              placeholder="#1976d2"
              value={currentCategory?.color || ''}
              onChange={(e) => setCurrentCategory({ ...currentCategory!, color: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveCategory}>
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default CategoriesPage;
