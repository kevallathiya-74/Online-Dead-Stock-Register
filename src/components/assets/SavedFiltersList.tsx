import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';

interface SavedFilter {
  id: string;
  name: string;
  description: string;
  category: string;
  filter_config: any;
  is_public: boolean;
  is_preset: boolean;
  created_by: {
    id: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
  usage_count: number;
  last_used_at?: string;
  is_owner: boolean;
}

interface SavedFiltersListProps {
  onSelectFilter: (filterConfig: any) => void;
  onRefresh?: () => void;
}

const SavedFiltersList: React.FC<SavedFiltersListProps> = ({
  onSelectFilter,
  onRefresh
}) => {
  const [filters, setFilters] = useState<SavedFilter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingFilter, setEditingFilter] = useState<SavedFilter | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newFilterData, setNewFilterData] = useState({
    name: '',
    description: '',
    is_public: false
  });

  useEffect(() => {
    fetchSavedFilters();
  }, []);

  const fetchSavedFilters = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('${API_BASE_URL}/filters/my-filters', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFilters(response.data.filters);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFilter = async (filterId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/filters/${filterId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSelectFilter(response.data.filter.filter_config);
    } catch (error) {
    }
  };

  const handleDeleteFilter = async (filterId: string) => {
    if (!confirm('Are you sure you want to delete this filter?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/filters/${filterId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSavedFilters();
      if (onRefresh) onRefresh();
    } catch (error) {
      alert('Failed to delete filter');
    }
  };

  const handleEditFilter = async (filter: SavedFilter) => {
    setEditingFilter(filter);
    setNewFilterData({
      name: filter.name,
      description: filter.description,
      is_public: filter.is_public
    });
    setShowSaveDialog(true);
  };

  const handleUpdateFilter = async () => {
    if (!editingFilter) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/filters/${editingFilter.id}`,
        newFilterData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowSaveDialog(false);
      setEditingFilter(null);
      fetchSavedFilters();
      if (onRefresh) onRefresh();
    } catch (error) {
      alert('Failed to update filter');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      status: '📊',
      condition: '⚙️',
      location: '📍',
      date: '📅',
      user: '👤',
      maintenance: '🔧',
      financial: '💰',
      custom: '🔍'
    };
    return icons[category] || '📋';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      status: '#2196F3',
      condition: '#FF9800',
      location: '#4CAF50',
      date: '#9C27B0',
      user: '#00BCD4',
      maintenance: '#F44336',
      financial: '#4CAF50',
      custom: '#607D8B'
    };
    return colors[category] || '#999';
  };

  return (
    <div className="saved-filters-list">
      <div className="list-header">
        <h2>📂 Saved Filters</h2>
        <button className="refresh-btn" onClick={fetchSavedFilters}>
          🔄 Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading filters...</div>
      ) : filters.length === 0 ? (
        <div className="no-filters">
          <p>No saved filters yet. Create a filter and save it to see it here.</p>
        </div>
      ) : (
        <div className="filters-grid">
          {filters.map(filter => (
            <div key={filter.id} className="filter-card">
              <div className="filter-header">
                <div className="filter-title">
                  <span 
                    className="category-icon"
                    style={{ color: getCategoryColor(filter.category) }}
                  >
                    {getCategoryIcon(filter.category)}
                  </span>
                  <h3>{filter.name}</h3>
                </div>
                <div className="filter-badges">
                  {filter.is_public && (
                    <span className="badge public">Public</span>
                  )}
                  {filter.is_preset && (
                    <span className="badge preset">Preset</span>
                  )}
                </div>
              </div>

              {filter.description && (
                <p className="filter-description">{filter.description}</p>
              )}

              <div className="filter-meta">
                <div className="meta-item">
                  <span className="meta-label">Category:</span>
                  <span className="meta-value">{filter.category}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Created by:</span>
                  <span className="meta-value">{filter.created_by.name}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Created:</span>
                  <span className="meta-value">{formatDate(filter.created_at)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Used:</span>
                  <span className="meta-value">{filter.usage_count} times</span>
                </div>
                {filter.last_used_at && (
                  <div className="meta-item">
                    <span className="meta-label">Last used:</span>
                    <span className="meta-value">{formatDate(filter.last_used_at)}</span>
                  </div>
                )}
              </div>

              <div className="filter-actions">
                <button
                  className="action-btn apply"
                  onClick={() => handleSelectFilter(filter.id)}
                >
                  Apply Filter
                </button>
                {filter.is_owner && !filter.is_preset && (
                  <>
                    <button
                      className="action-btn edit"
                      onClick={() => handleEditFilter(filter)}
                    >
                      Edit
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeleteFilter(filter.id)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showSaveDialog && (
        <div className="modal-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingFilter ? 'Edit Filter' : 'Save Filter'}</h3>
              <button onClick={() => setShowSaveDialog(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Filter Name *</label>
                <input
                  type="text"
                  value={newFilterData.name}
                  onChange={e => setNewFilterData({ ...newFilterData, name: e.target.value })}
                  placeholder="Enter filter name"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newFilterData.description}
                  onChange={e => setNewFilterData({ ...newFilterData, description: e.target.value })}
                  placeholder="Enter filter description"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newFilterData.is_public}
                    onChange={e => setNewFilterData({ ...newFilterData, is_public: e.target.checked })}
                  />
                  Make this filter public (visible to all users)
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowSaveDialog(false)}
              >
                Cancel
              </button>
              <button 
                className="save-btn"
                onClick={handleUpdateFilter}
                disabled={!newFilterData.name}
              >
                {editingFilter ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .saved-filters-list {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e0e0e0;
        }

        .list-header h2 {
          margin: 0;
          font-size: 24px;
          color: #333;
        }

        .refresh-btn {
          padding: 8px 16px;
          background: #2196F3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s;
        }

        .refresh-btn:hover {
          background: #1976D2;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #999;
          font-size: 16px;
        }

        .no-filters {
          text-align: center;
          padding: 60px 20px;
          background: #fafafa;
          border: 2px dashed #ddd;
          border-radius: 8px;
        }

        .no-filters p {
          margin: 0;
          color: #999;
          font-size: 16px;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .filter-card {
          background: #fafafa;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          transition: all 0.3s;
        }

        .filter-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transform: translateY(-2px);
        }

        .filter-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .filter-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .category-icon {
          font-size: 24px;
        }

        .filter-title h3 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }

        .filter-badges {
          display: flex;
          gap: 5px;
        }

        .badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .badge.public {
          background: #4CAF50;
          color: white;
        }

        .badge.preset {
          background: #FF9800;
          color: white;
        }

        .filter-description {
          margin: 0 0 15px 0;
          color: #666;
          font-size: 14px;
          line-height: 1.5;
        }

        .filter-meta {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 15px;
          padding: 15px;
          background: white;
          border-radius: 6px;
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .meta-label {
          font-size: 11px;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .meta-value {
          font-size: 13px;
          color: #333;
          font-weight: 500;
        }

        .filter-actions {
          display: flex;
          gap: 10px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
        }

        .action-btn {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s;
        }

        .action-btn.apply {
          background: #2196F3;
          color: white;
        }

        .action-btn.apply:hover {
          background: #1976D2;
        }

        .action-btn.edit {
          background: #FF9800;
          color: white;
        }

        .action-btn.edit:hover {
          background: #F57C00;
        }

        .action-btn.delete {
          background: #f44336;
          color: white;
        }

        .action-btn.delete:hover {
          background: #d32f2f;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e0e0e0;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 20px;
          color: #333;
        }

        .modal-header button {
          background: none;
          border: none;
          font-size: 24px;
          color: #666;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          line-height: 1;
        }

        .modal-body {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #333;
          font-size: 14px;
        }

        .form-group input[type="text"],
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
        }

        .form-group textarea {
          resize: vertical;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          cursor: pointer;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 20px;
          border-top: 1px solid #e0e0e0;
        }

        .cancel-btn,
        .save-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.3s;
        }

        .cancel-btn {
          background: #e0e0e0;
          color: #333;
        }

        .cancel-btn:hover {
          background: #d0d0d0;
        }

        .save-btn {
          background: #4CAF50;
          color: white;
        }

        .save-btn:hover:not(:disabled) {
          background: #45a049;
        }

        .save-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .filters-grid {
            grid-template-columns: 1fr;
          }

          .filter-meta {
            grid-template-columns: 1fr;
          }

          .filter-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default SavedFiltersList;
