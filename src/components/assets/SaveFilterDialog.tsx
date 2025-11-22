import React, { useState } from 'react';
import axios from 'axios';

interface SaveFilterDialogProps {
  filterConfig: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const SaveFilterDialog: React.FC<SaveFilterDialogProps> = ({
  filterConfig,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'custom',
    is_public: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { value: 'status', label: 'Status Filters' },
    { value: 'condition', label: 'Condition Filters' },
    { value: 'location', label: 'Location Filters' },
    { value: 'date', label: 'Date Filters' },
    { value: 'user', label: 'User/Assignment Filters' },
    { value: 'maintenance', label: 'Maintenance Filters' },
    { value: 'financial', label: 'Financial Filters' },
    { value: 'custom', label: 'Custom Filters' }
  ];

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Filter name is required');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/filters/save',
        {
          ...formData,
          filter_config: filterConfig
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Reset form
      setFormData({
        name: '',
        description: '',
        category: 'custom',
        is_public: false
      });

      onSave();
      onClose();
    } catch (err: unknown) {
      setError((err as any).response?.data?.message || 'Failed to save filter');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="save-filter-dialog">
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>💾 Save Filter</h3>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="modal-body">
            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            <div className="form-group">
              <label>Filter Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Active IT Equipment"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this filter is used for..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={e => setFormData({ ...formData, is_public: e.target.checked })}
                />
                <span>
                  Make this filter public
                  <small>Other users will be able to view and use this filter</small>
                </span>
              </label>
            </div>

            <div className="filter-preview">
              <h4>Filter Configuration:</h4>
              <div className="config-summary">
                {Object.keys(filterConfig).length === 0 ? (
                  <p className="no-config">No filters configured</p>
                ) : (
                  <ul>
                    {Object.entries(filterConfig).map(([key, value]) => (
                      <li key={key}>
                        <strong>{formatKey(key)}:</strong>{' '}
                        {formatValue(value)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              className="save-btn"
              onClick={handleSave}
              disabled={isSaving || !formData.name.trim()}
            >
              {isSaving ? 'Saving...' : 'Save Filter'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .save-filter-dialog .modal-overlay {
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
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .save-filter-dialog .modal-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .save-filter-dialog .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 25px;
          border-bottom: 2px solid #e0e0e0;
        }

        .save-filter-dialog .modal-header h3 {
          margin: 0;
          font-size: 24px;
          color: #333;
        }

        .save-filter-dialog .close-btn {
          background: none;
          border: none;
          font-size: 28px;
          color: #666;
          cursor: pointer;
          padding: 0;
          width: 35px;
          height: 35px;
          line-height: 1;
          border-radius: 50%;
          transition: all 0.3s;
        }

        .save-filter-dialog .close-btn:hover {
          background: #f5f5f5;
          color: #333;
        }

        .save-filter-dialog .modal-body {
          padding: 25px;
        }

        .save-filter-dialog .error-message {
          background: #ffebee;
          border: 1px solid #ef5350;
          color: #c62828;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .save-filter-dialog .form-group {
          margin-bottom: 20px;
        }

        .save-filter-dialog .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }

        .save-filter-dialog .form-group input[type="text"],
        .save-filter-dialog .form-group textarea,
        .save-filter-dialog .form-group select {
          width: 100%;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
          transition: border-color 0.3s;
        }

        .save-filter-dialog .form-group input[type="text"]:focus,
        .save-filter-dialog .form-group textarea:focus,
        .save-filter-dialog .form-group select:focus {
          outline: none;
          border-color: #2196F3;
        }

        .save-filter-dialog .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }

        .save-filter-dialog .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          padding: 12px;
          background: #f5f5f5;
          border-radius: 6px;
          transition: background 0.3s;
        }

        .save-filter-dialog .checkbox-label:hover {
          background: #e8e8e8;
        }

        .save-filter-dialog .checkbox-label input[type="checkbox"] {
          margin-top: 3px;
          cursor: pointer;
          width: 18px;
          height: 18px;
        }

        .save-filter-dialog .checkbox-label span {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .save-filter-dialog .checkbox-label small {
          color: #666;
          font-size: 12px;
        }

        .save-filter-dialog .filter-preview {
          background: #f9f9f9;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          padding: 15px;
          margin-top: 20px;
        }

        .save-filter-dialog .filter-preview h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .save-filter-dialog .config-summary {
          background: white;
          border-radius: 4px;
          padding: 12px;
          max-height: 200px;
          overflow-y: auto;
        }

        .save-filter-dialog .config-summary ul {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .save-filter-dialog .config-summary li {
          padding: 6px 0;
          border-bottom: 1px solid #f0f0f0;
          font-size: 13px;
          color: #555;
        }

        .save-filter-dialog .config-summary li:last-child {
          border-bottom: none;
        }

        .save-filter-dialog .config-summary strong {
          color: #333;
        }

        .save-filter-dialog .no-config {
          margin: 0;
          color: #999;
          font-style: italic;
          text-align: center;
        }

        .save-filter-dialog .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px 25px;
          border-top: 2px solid #e0e0e0;
          background: #fafafa;
        }

        .save-filter-dialog .cancel-btn,
        .save-filter-dialog .save-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          transition: all 0.3s;
        }

        .save-filter-dialog .cancel-btn {
          background: #e0e0e0;
          color: #333;
        }

        .save-filter-dialog .cancel-btn:hover {
          background: #d0d0d0;
        }

        .save-filter-dialog .save-btn {
          background: #4CAF50;
          color: white;
          min-width: 130px;
        }

        .save-filter-dialog .save-btn:hover:not(:disabled) {
          background: #45a049;
          box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
        }

        .save-filter-dialog .save-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .save-filter-dialog .modal-content {
            width: 95%;
            max-height: 95vh;
          }

          .save-filter-dialog .modal-header,
          .save-filter-dialog .modal-body,
          .save-filter-dialog .modal-footer {
            padding: 20px;
          }

          .save-filter-dialog .modal-footer {
            flex-direction: column;
          }

          .save-filter-dialog .cancel-btn,
          .save-filter-dialog .save-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

// Helper functions
const formatKey = (key: string): string => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

const formatValue = (value: any): string => {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
};

export default SaveFilterDialog;
