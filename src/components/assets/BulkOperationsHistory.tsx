import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface BulkOperationHistory {
  _id: string;
  action: string;
  performed_by: {
    _id: string;
    name: string;
  };
  asset: {
    _id: string;
    unique_asset_id: string;
    name: string;
  };
  details: {
    batch_size?: number;
    old_value?: any;
    new_value?: any;
    notes?: string;
    [key: string]: any;
  };
  timestamp: string;
}

const BulkOperationsHistory: React.FC = () => {
  const [history, setHistory] = useState<BulkOperationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => {
    fetchHistory();
  }, [page, filterAction]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      if (filterAction) {
        params.append('action_type', filterAction);
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/bulk/history?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setHistory(response.data.operations || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAction = (action: string): string => {
    return action
      .replace('bulk_', '')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const getActionIcon = (action: string): string => {
    if (action.includes('status')) return '🔄';
    if (action.includes('assign')) return '👤';
    if (action.includes('delete')) return '🗑️';
    if (action.includes('maintenance')) return '🔧';
    if (action.includes('location')) return '📍';
    if (action.includes('condition')) return '⚙️';
    return '📝';
  };

  const getActionColor = (action: string): string => {
    if (action.includes('delete')) return '#f44336';
    if (action.includes('assign')) return '#2196F3';
    if (action.includes('maintenance')) return '#ff9800';
    if (action.includes('status')) return '#9c27b0';
    if (action.includes('location')) return '#00bcd4';
    if (action.includes('condition')) return '#4CAF50';
    return '#757575';
  };

  if (loading && history.length === 0) {
    return (
      <div className="history-loading">
        <div className="spinner">⏳</div>
        <p>Loading operation history...</p>
      </div>
    );
  }

  return (
    <div className="bulk-operations-history">
      <div className="history-header">
        <h2>📜 Bulk Operations History</h2>
        
        <div className="history-filters">
          <label>
            Filter by Action:
            <select
              value={filterAction}
              onChange={(e) => {
                setFilterAction(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Actions</option>
              <option value="bulk_status_update">Status Update</option>
              <option value="bulk_assign">Assignment</option>
              <option value="bulk_delete_soft">Soft Delete</option>
              <option value="bulk_delete_permanent">Permanent Delete</option>
              <option value="bulk_maintenance_scheduled">Maintenance Scheduled</option>
              <option value="bulk_location_update">Location Update</option>
              <option value="bulk_condition_update">Condition Update</option>
            </select>
          </label>
          
          <button onClick={fetchHistory} className="btn-refresh">
            🔄 Refresh
          </button>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="history-empty">
          <p>No bulk operations found</p>
        </div>
      ) : (
        <>
          <div className="history-timeline">
            {history.map((operation) => (
              <div key={operation._id} className="history-item">
                <div
                  className="history-icon"
                  style={{ background: getActionColor(operation.action) }}
                >
                  {getActionIcon(operation.action)}
                </div>
                
                <div className="history-content">
                  <div className="history-title">
                    <strong>{formatAction(operation.action)}</strong>
                    {operation.details.batch_size && (
                      <span className="batch-badge">
                        Batch: {operation.details.batch_size} assets
                      </span>
                    )}
                  </div>
                  
                  <div className="history-details">
                    <div className="detail-row">
                      <span className="detail-label">Performed by:</span>
                      <span className="detail-value">{operation.performed_by.name}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="detail-label">Asset:</span>
                      <span className="detail-value">
                        {operation.asset.unique_asset_id} - {operation.asset.name}
                      </span>
                    </div>
                    
                    {operation.details.old_value && (
                      <div className="detail-row">
                        <span className="detail-label">From:</span>
                        <span className="detail-value old-value">
                          {JSON.stringify(operation.details.old_value)}
                        </span>
                      </div>
                    )}
                    
                    {operation.details.new_value && (
                      <div className="detail-row">
                        <span className="detail-label">To:</span>
                        <span className="detail-value new-value">
                          {JSON.stringify(operation.details.new_value)}
                        </span>
                      </div>
                    )}
                    
                    {operation.details.notes && (
                      <div className="detail-row">
                        <span className="detail-label">Notes:</span>
                        <span className="detail-value">{operation.details.notes}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="history-timestamp">
                    {formatDate(operation.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-page"
              >
                ← Previous
              </button>
              
              <span className="page-info">
                Page {page} of {totalPages}
              </span>
              
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-page"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        .history-loading,
        .history-empty {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }

        .spinner {
          font-size: 48px;
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .bulk-operations-history {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .history-header {
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #eee;
        }

        .history-header h2 {
          margin: 0 0 15px 0;
          font-size: 24px;
        }

        .history-filters {
          display: flex;
          gap: 15px;
          align-items: flex-end;
          flex-wrap: wrap;
        }

        .history-filters label {
          display: flex;
          flex-direction: column;
          gap: 5px;
          font-weight: 500;
        }

        .history-filters select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .btn-refresh {
          padding: 8px 16px;
          background: #2196F3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-refresh:hover {
          background: #1976D2;
        }

        .history-timeline {
          position: relative;
          padding-left: 40px;
        }

        .history-timeline::before {
          content: '';
          position: absolute;
          left: 15px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #e0e0e0;
        }

        .history-item {
          position: relative;
          margin-bottom: 30px;
          display: flex;
          gap: 20px;
        }

        .history-icon {
          position: absolute;
          left: -33px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .history-content {
          flex: 1;
          background: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }

        .history-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-size: 16px;
        }

        .batch-badge {
          background: #2196F3;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .history-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 10px;
        }

        .detail-row {
          display: flex;
          gap: 10px;
          font-size: 14px;
        }

        .detail-label {
          font-weight: 500;
          color: #666;
          min-width: 100px;
        }

        .detail-value {
          color: #333;
          flex: 1;
        }

        .old-value {
          color: #f44336;
          text-decoration: line-through;
        }

        .new-value {
          color: #4CAF50;
          font-weight: 500;
        }

        .history-timestamp {
          font-size: 12px;
          color: #999;
          margin-top: 8px;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 15px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }

        .btn-page {
          padding: 8px 16px;
          background: #2196F3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-page:hover:not(:disabled) {
          background: #1976D2;
        }

        .btn-page:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .page-info {
          font-weight: 500;
          color: #666;
        }

        @media (max-width: 768px) {
          .bulk-operations-history {
            padding: 15px;
          }

          .history-timeline {
            padding-left: 30px;
          }

          .history-icon {
            left: -28px;
            width: 28px;
            height: 28px;
            font-size: 14px;
          }

          .history-content {
            padding: 12px;
          }

          .history-title {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .detail-row {
            flex-direction: column;
            gap: 4px;
          }

          .detail-label {
            min-width: auto;
          }

          .pagination {
            flex-direction: column;
            gap: 10px;
          }

          .btn-page {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default BulkOperationsHistory;
