import React, { useState } from 'react';
import BulkOperationsPanel from './BulkOperationsPanel';
import BulkOperationsHistory from './BulkOperationsHistory';

interface Asset {
  _id: string;
  unique_asset_id: string;
  name: string;
  status: string;
  condition: string;
  location: string;
  department?: string;
  assigned_user?: {
    _id: string;
    name: string;
  };
  category?: string;
}

interface BulkOperationsManagerProps {
  assets: Asset[];
  onRefresh?: () => void;
}

const BulkOperationsManager: React.FC<BulkOperationsManagerProps> = ({
  assets,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'operations' | 'history'>('operations');

  const handleOperationComplete = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <div className="bulk-operations-manager">
      <div className="manager-header">
        <h1>🔧 Bulk Operations Manager</h1>
        <p className="manager-description">
          Perform batch operations on multiple assets simultaneously
        </p>
      </div>

      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'operations' ? 'active' : ''}`}
          onClick={() => setActiveTab('operations')}
        >
          ⚙️ Operations
          <span className="tab-badge">{assets.length} Assets</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📜 History
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'operations' && (
          <BulkOperationsPanel
            assets={assets}
            onOperationComplete={handleOperationComplete}
          />
        )}

        {activeTab === 'history' && (
          <BulkOperationsHistory />
        )}
      </div>

      <style>{`
        .bulk-operations-manager {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .manager-header {
          margin-bottom: 30px;
        }

        .manager-header h1 {
          margin: 0 0 10px 0;
          font-size: 32px;
          color: #333;
        }

        .manager-description {
          margin: 0;
          color: #666;
          font-size: 16px;
        }

        .tab-navigation {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 2px solid #ddd;
        }

        .tab-btn {
          padding: 12px 24px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          font-size: 16px;
          color: #666;
          transition: all 0.3s;
          margin-bottom: -2px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tab-btn:hover {
          color: #2196F3;
        }

        .tab-btn.active {
          color: #2196F3;
          border-bottom-color: #2196F3;
          font-weight: 500;
        }

        .tab-badge {
          background: #2196F3;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .tab-content {
          min-height: 600px;
        }

        @media (max-width: 768px) {
          .bulk-operations-manager {
            padding: 15px;
          }

          .manager-header h1 {
            font-size: 24px;
          }

          .manager-description {
            font-size: 14px;
          }

          .tab-btn {
            padding: 10px 16px;
            font-size: 14px;
          }

          .tab-badge {
            font-size: 11px;
            padding: 3px 6px;
          }
        }
      `}</style>
    </div>
  );
};

export default BulkOperationsManager;
