import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';

interface Asset {
  _id: string;
  unique_asset_id: string;
  name: string;
  status: string;
  condition: string;
  category: string;
  asset_type: string;
  location: string;
  purchase_cost?: number;
  purchase_date?: string;
  assigned_user?: {
    name: string;
    email: string;
  };
}

interface FilterResultsPreviewProps {
  filterConfig: any;
  onExport?: (format: 'csv' | 'excel') => void;
}

const FilterResultsPreview: React.FC<FilterResultsPreviewProps> = ({
  filterConfig,
  onExport
}) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (Object.keys(filterConfig).length > 0) {
      fetchResults();
    }
  }, [filterConfig, page, sortBy, sortOrder]);

  const fetchResults = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/filters/apply?page=${page}&limit=20&sort_by=${sortBy}&sort_order=${sortOrder}&include_count=true`,
        filterConfig,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setAssets(response.data.assets);
      setTotalCount(response.data.pagination.total);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching filtered results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch all results (no pagination limit)
      const response = await axios.post(
        `${API_BASE_URL}/filters/apply?page=1&limit=10000&include_count=false`,
        filterConfig,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const allAssets = response.data.assets;

      if (format === 'csv') {
        exportToCSV(allAssets);
      } else {
        exportToExcel(allAssets);
      }

      if (onExport) {
        onExport(format);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  };

  const exportToCSV = (data: Asset[]) => {
    const headers = [
      'Asset ID',
      'Name',
      'Status',
      'Condition',
      'Category',
      'Location',
      'Purchase Cost',
      'Purchase Date',
      'Assigned To'
    ];

    const rows = data.map(asset => [
      asset.unique_asset_id,
      asset.name,
      asset.status,
      asset.condition,
      asset.category,
      asset.location,
      asset.purchase_cost || '',
      asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '',
      asset.assigned_user?.name || 'Unassigned'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    downloadFile(csvContent, 'filtered-assets.csv', 'text/csv');
  };

  const exportToExcel = (data: Asset[]) => {
    // Simple TSV format (Tab-Separated Values) which Excel can open
    const headers = [
      'Asset ID',
      'Name',
      'Status',
      'Condition',
      'Category',
      'Location',
      'Purchase Cost',
      'Purchase Date',
      'Assigned To'
    ];

    const rows = data.map(asset => [
      asset.unique_asset_id,
      asset.name,
      asset.status,
      asset.condition,
      asset.asset_type,
      asset.location,
      asset.purchase_cost || '',
      asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '',
      asset.assigned_user?.name || 'Unassigned'
    ]);

    const tsvContent = [
      headers.join('\t'),
      ...rows.map(row => row.join('\t'))
    ].join('\n');

    downloadFile(tsvContent, 'filtered-assets.xls', 'application/vnd.ms-excel');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      Active: '#4CAF50',
      Inactive: '#9E9E9E',
      'Under Maintenance': '#FF9800',
      Damaged: '#f44336',
      Disposed: '#607D8B',
      Lost: '#000000'
    };
    return colors[status] || '#999';
  };

  const getConditionColor = (condition: string) => {
    const normalizedCondition = condition.toLowerCase();
    const colors: { [key: string]: string } = {
      excellent: '#4CAF50',
      good: '#8BC34A',
      fair: '#FF9800',
      poor: '#f44336',
      damaged: '#000000'
    };
    return colors[normalizedCondition] || '#999';
  };

  if (Object.keys(filterConfig).length === 0) {
    return (
      <div className="filter-results-preview">
        <div className="no-filters-applied">
          <p>Apply filters to see results preview</p>
        </div>
        <style>{previewStyles}</style>
      </div>
    );
  }

  return (
    <div className="filter-results-preview">
      <div className="results-header">
        <div className="results-info">
          <h2>📊 Results Preview</h2>
          <div className="count-badge">
            {totalCount} {totalCount === 1 ? 'asset' : 'assets'} found
          </div>
        </div>
        
        <div className="results-actions">
          <div className="sort-controls">
            <label>Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="created_at">Created Date</option>
              <option value="name">Name</option>
              <option value="status">Status</option>
              <option value="purchase_cost">Purchase Cost</option>
              <option value="purchase_date">Purchase Date</option>
            </select>
            <button 
              className="sort-order-btn"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
          
          <div className="export-buttons">
            <button 
              className="export-btn csv"
              onClick={() => handleExport('csv')}
              disabled={totalCount === 0}
            >
              📄 Export CSV
            </button>
            <button 
              className="export-btn excel"
              onClick={() => handleExport('excel')}
              disabled={totalCount === 0}
            >
              📊 Export Excel
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading results...</div>
      ) : assets.length === 0 ? (
        <div className="no-results">
          <p>No assets match the applied filters</p>
        </div>
      ) : (
        <>
          <div className="results-table-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Condition</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Purchase Cost</th>
                  <th>Assigned To</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(asset => (
                  <tr key={asset._id}>
                    <td className="asset-id">{asset.unique_asset_id}</td>
                    <td className="asset-name">{asset.name}</td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ background: getStatusColor(asset.status) }}
                      >
                        {asset.status}
                      </span>
                    </td>
                    <td>
                      <span 
                        className="condition-badge"
                        style={{ background: getConditionColor(asset.condition) }}
                      >
                        {asset.condition}
                      </span>
                    </td>
                    <td>{asset.asset_type}</td>
                    <td>{asset.location}</td>
                    <td className="cost">
                      {asset.purchase_cost ? formatCurrency(asset.purchase_cost) : '-'}
                    </td>
                    <td>{asset.assigned_user?.name || 'Unassigned'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                ← Previous
              </button>
              <span className="page-info">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      <style>{previewStyles}</style>
    </div>
  );
};

const previewStyles = `
  .filter-results-preview {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .no-filters-applied {
    text-align: center;
    padding: 60px 20px;
    background: #fafafa;
    border: 2px dashed #ddd;
    border-radius: 8px;
  }

  .no-filters-applied p {
    margin: 0;
    color: #999;
    font-size: 16px;
  }

  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #e0e0e0;
    flex-wrap: wrap;
    gap: 15px;
  }

  .results-info {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .results-info h2 {
    margin: 0;
    font-size: 24px;
    color: #333;
  }

  .count-badge {
    background: #2196F3;
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
  }

  .results-actions {
    display: flex;
    gap: 20px;
    align-items: center;
    flex-wrap: wrap;
  }

  .sort-controls {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .sort-controls label {
    font-size: 14px;
    color: #666;
  }

  .sort-controls select {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }

  .sort-order-btn {
    padding: 8px 12px;
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-size: 18px;
    transition: background 0.3s;
  }

  .sort-order-btn:hover {
    background: #e0e0e0;
  }

  .export-buttons {
    display: flex;
    gap: 10px;
  }

  .export-btn {
    padding: 10px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s;
    color: white;
  }

  .export-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .export-btn.csv {
    background: #4CAF50;
  }

  .export-btn.csv:hover:not(:disabled) {
    background: #45a049;
  }

  .export-btn.excel {
    background: #2196F3;
  }

  .export-btn.excel:hover:not(:disabled) {
    background: #1976D2;
  }

  .loading {
    text-align: center;
    padding: 40px;
    color: #999;
    font-size: 16px;
  }

  .no-results {
    text-align: center;
    padding: 60px 20px;
    background: #fafafa;
    border: 2px dashed #ddd;
    border-radius: 8px;
  }

  .no-results p {
    margin: 0;
    color: #999;
    font-size: 16px;
  }

  .results-table-container {
    overflow-x: auto;
    margin-bottom: 20px;
  }

  .results-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
  }

  .results-table th {
    background: #f5f5f5;
    padding: 12px;
    text-align: left;
    font-weight: 600;
    color: #333;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #ddd;
  }

  .results-table td {
    padding: 12px;
    border-bottom: 1px solid #e0e0e0;
    font-size: 14px;
    color: #555;
  }

  .results-table tbody tr:hover {
    background: #f9f9f9;
  }

  .asset-id {
    font-family: monospace;
    font-weight: 600;
    color: #2196F3;
  }

  .asset-name {
    font-weight: 500;
    color: #333;
  }

  .status-badge,
  .condition-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    color: white;
    text-transform: uppercase;
  }

  .cost {
    font-weight: 600;
    color: #4CAF50;
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
    padding-top: 20px;
    border-top: 1px solid #e0e0e0;
  }

  .pagination button {
    padding: 10px 20px;
    background: #2196F3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background 0.3s;
  }

  .pagination button:hover:not(:disabled) {
    background: #1976D2;
  }

  .pagination button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .page-info {
    font-size: 14px;
    color: #666;
  }

  @media (max-width: 1024px) {
    .results-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .results-actions {
      width: 100%;
      justify-content: space-between;
    }
  }

  @media (max-width: 768px) {
    .results-info {
      flex-direction: column;
      align-items: flex-start;
    }

    .results-actions {
      flex-direction: column;
      align-items: flex-start;
    }

    .export-buttons {
      width: 100%;
    }

    .export-btn {
      flex: 1;
    }

    .results-table {
      font-size: 12px;
    }

    .results-table th,
    .results-table td {
      padding: 8px;
    }
  }
`;

export default FilterResultsPreview;
