import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

interface BulkOperationsPanelProps {
  assets: Asset[];
  onOperationComplete?: () => void;
}

type OperationType = 
  | 'update-status'
  | 'assign'
  | 'delete'
  | 'schedule-maintenance'
  | 'update-location'
  | 'update-condition';

interface ValidationResult {
  valid_count: number;
  invalid_count: number;
  warnings: string[];
  can_proceed: boolean;
}

const BulkOperationsPanel: React.FC<BulkOperationsPanelProps> = ({
  assets,
  onOperationComplete
}) => {
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [operationType, setOperationType] = useState<OperationType>('update-status');
  const [operationParams, setOperationParams] = useState<any>({});
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [forceMode, setForceMode] = useState(false);

  // Users and other data for dropdowns
  const [users, setUsers] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setUsers(response.data.users || []);
      setTechnicians(response.data.users?.filter((u: any) => 
        u.role === 'ADMIN' || u.role === 'INVENTORY_MANAGER'
      ) || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const toggleAssetSelection = (assetId: string) => {
    const newSelection = new Set(selectedAssets);
    if (newSelection.has(assetId)) {
      newSelection.delete(assetId);
    } else {
      newSelection.add(assetId);
    }
    setSelectedAssets(newSelection);
  };

  const selectAll = () => {
    if (selectedAssets.size === assets.length) {
      setSelectedAssets(new Set());
    } else {
      setSelectedAssets(new Set(assets.map(a => a._id)));
    }
  };

  const validateOperation = async () => {
    if (selectedAssets.size === 0) {
      alert('Please select at least one asset');
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/bulk/validate`,
        {
          asset_ids: Array.from(selectedAssets),
          operation: operationType,
          ...operationParams
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setValidationResult(response.data);
      
      if (response.data.can_proceed || forceMode) {
        setShowConfirmation(true);
      } else {
        alert('Operation cannot proceed. Please check the warnings.');
      }
    } catch (error: any) {
      console.error('Validation error:', error);
      alert(error.response?.data?.message || 'Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  const executeOperation = async () => {
    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const endpoint = `/api/bulk/${operationType}`;
      const url = forceMode 
        ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${endpoint}?force=true`
        : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${endpoint}`;

      const response = await axios.post(
        url,
        {
          asset_ids: Array.from(selectedAssets),
          ...operationParams
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setExecutionResult(response.data);
      setShowConfirmation(false);
      
      // Reset selections and params
      setSelectedAssets(new Set());
      setOperationParams({});
      setValidationResult(null);
      setForceMode(false);

      if (onOperationComplete) {
        onOperationComplete();
      }

      alert(response.data.message || 'Operation completed successfully');
    } catch (error: any) {
      console.error('Execution error:', error);
      alert(error.response?.data?.message || 'Operation failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const renderOperationForm = () => {
    switch (operationType) {
      case 'update-status':
        return (
          <div className="operation-form">
            <label>
              New Status:
              <select
                value={operationParams.status || ''}
                onChange={(e) => setOperationParams({ ...operationParams, status: e.target.value })}
                required
              >
                <option value="">Select Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Damaged">Damaged</option>
                <option value="Disposed">Disposed</option>
                <option value="Lost">Lost</option>
              </select>
            </label>
            <label>
              Notes (optional):
              <textarea
                value={operationParams.notes || ''}
                onChange={(e) => setOperationParams({ ...operationParams, notes: e.target.value })}
                placeholder="Reason for status change"
              />
            </label>
          </div>
        );

      case 'assign':
        return (
          <div className="operation-form">
            <label>
              Assign To User:
              <select
                value={operationParams.user_id || ''}
                onChange={(e) => setOperationParams({ ...operationParams, user_id: e.target.value })}
                required
              >
                <option value="">Select User</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.department})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Department (optional):
              <input
                type="text"
                value={operationParams.department || ''}
                onChange={(e) => setOperationParams({ ...operationParams, department: e.target.value })}
                placeholder="IT, HR, Finance, etc."
              />
            </label>
            <label>
              Notes (optional):
              <textarea
                value={operationParams.notes || ''}
                onChange={(e) => setOperationParams({ ...operationParams, notes: e.target.value })}
                placeholder="Assignment notes"
              />
            </label>
          </div>
        );

      case 'delete':
        return (
          <div className="operation-form">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={operationParams.permanent || false}
                onChange={(e) => setOperationParams({ ...operationParams, permanent: e.target.checked })}
              />
              <span className="warning-text">⚠️ Permanent Delete (Cannot be undone)</span>
            </label>
            <label>
              Reason:
              <textarea
                value={operationParams.reason || ''}
                onChange={(e) => setOperationParams({ ...operationParams, reason: e.target.value })}
                placeholder="Reason for deletion"
                required
              />
            </label>
          </div>
        );

      case 'schedule-maintenance':
        return (
          <div className="operation-form">
            <label>
              Maintenance Type:
              <select
                value={operationParams.maintenance_type || ''}
                onChange={(e) => setOperationParams({ ...operationParams, maintenance_type: e.target.value })}
                required
              >
                <option value="">Select Type</option>
                <option value="Preventive">Preventive</option>
                <option value="Corrective">Corrective</option>
                <option value="Inspection">Inspection</option>
                <option value="Calibration">Calibration</option>
                <option value="Cleaning">Cleaning</option>
              </select>
            </label>
            <label>
              Scheduled Date:
              <input
                type="datetime-local"
                value={operationParams.scheduled_date || ''}
                onChange={(e) => setOperationParams({ ...operationParams, scheduled_date: e.target.value })}
                required
              />
            </label>
            <label>
              Priority:
              <select
                value={operationParams.priority || 'medium'}
                onChange={(e) => setOperationParams({ ...operationParams, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
            <label>
              Assigned Technician (optional):
              <select
                value={operationParams.assigned_technician || ''}
                onChange={(e) => setOperationParams({ ...operationParams, assigned_technician: e.target.value })}
              >
                <option value="">Select Technician</option>
                {technicians.map(tech => (
                  <option key={tech._id} value={tech._id}>
                    {tech.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Description:
              <textarea
                value={operationParams.description || ''}
                onChange={(e) => setOperationParams({ ...operationParams, description: e.target.value })}
                placeholder="Maintenance description"
                required
              />
            </label>
          </div>
        );

      case 'update-location':
        return (
          <div className="operation-form">
            <label>
              New Location:
              <input
                type="text"
                value={operationParams.location || ''}
                onChange={(e) => setOperationParams({ ...operationParams, location: e.target.value })}
                placeholder="e.g., Building A, Floor 3, Room 301"
                required
              />
            </label>
            <label>
              Notes (optional):
              <textarea
                value={operationParams.notes || ''}
                onChange={(e) => setOperationParams({ ...operationParams, notes: e.target.value })}
                placeholder="Reason for location change"
              />
            </label>
          </div>
        );

      case 'update-condition':
        return (
          <div className="operation-form">
            <label>
              New Condition:
              <select
                value={operationParams.condition || ''}
                onChange={(e) => setOperationParams({ ...operationParams, condition: e.target.value })}
                required
              >
                <option value="">Select Condition</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
                <option value="Non-functional">Non-functional</option>
              </select>
            </label>
            <label>
              Notes (optional):
              <textarea
                value={operationParams.notes || ''}
                onChange={(e) => setOperationParams({ ...operationParams, notes: e.target.value })}
                placeholder="Condition assessment notes"
              />
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bulk-operations-panel">
      <div className="panel-header">
        <h2>🔧 Bulk Operations</h2>
        <div className="selection-info">
          <span className="selection-count">
            {selectedAssets.size} of {assets.length} selected
          </span>
          <button onClick={selectAll} className="btn-select-all">
            {selectedAssets.size === assets.length ? '❌ Deselect All' : '✅ Select All'}
          </button>
        </div>
      </div>

      {/* Asset Selection Table */}
      <div className="asset-selection-table">
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedAssets.size === assets.length && assets.length > 0}
                  onChange={selectAll}
                />
              </th>
              <th>Asset ID</th>
              <th>Name</th>
              <th>Status</th>
              <th>Condition</th>
              <th>Location</th>
              <th>Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {assets.map(asset => (
              <tr
                key={asset._id}
                className={selectedAssets.has(asset._id) ? 'selected' : ''}
                onClick={() => toggleAssetSelection(asset._id)}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selectedAssets.has(asset._id)}
                    onChange={() => toggleAssetSelection(asset._id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td>{asset.unique_asset_id}</td>
                <td>{asset.name}</td>
                <td>
                  <span className={`status-badge status-${asset.status.toLowerCase().replace(' ', '-')}`}>
                    {asset.status}
                  </span>
                </td>
                <td>{asset.condition}</td>
                <td>{asset.location}</td>
                <td>{asset.assigned_user?.name || 'Unassigned'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Operation Configuration */}
      <div className="operation-config">
        <h3>Configure Operation</h3>
        
        <label>
          Operation Type:
          <select
            value={operationType}
            onChange={(e) => {
              setOperationType(e.target.value as OperationType);
              setOperationParams({});
              setValidationResult(null);
            }}
          >
            <option value="update-status">Update Status</option>
            <option value="assign">Assign to User</option>
            <option value="delete">Delete Assets</option>
            <option value="schedule-maintenance">Schedule Maintenance</option>
            <option value="update-location">Update Location</option>
            <option value="update-condition">Update Condition</option>
          </select>
        </label>

        {renderOperationForm()}

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={forceMode}
            onChange={(e) => setForceMode(e.target.checked)}
          />
          <span className="warning-text">⚠️ Force Mode (Override warnings)</span>
        </label>

        <div className="operation-actions">
          <button
            onClick={validateOperation}
            className="btn-validate"
            disabled={selectedAssets.size === 0 || isValidating}
          >
            {isValidating ? '⏳ Validating...' : '🔍 Validate Operation'}
          </button>
        </div>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <div className={`validation-results ${validationResult.can_proceed ? 'success' : 'warning'}`}>
          <h4>Validation Results</h4>
          <div className="validation-stats">
            <span className="stat-valid">✅ Valid: {validationResult.valid_count}</span>
            <span className="stat-invalid">❌ Invalid: {validationResult.invalid_count}</span>
          </div>
          
          {validationResult.warnings.length > 0 && (
            <div className="warnings-list">
              <h5>⚠️ Warnings:</h5>
              <ul>
                {validationResult.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {!validationResult.can_proceed && !forceMode && (
            <p className="error-message">
              ❌ Operation cannot proceed. Enable force mode to override.
            </p>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="confirmation-dialog-overlay">
          <div className="confirmation-dialog">
            <h3>⚠️ Confirm Bulk Operation</h3>
            <p>
              You are about to perform <strong>{operationType.replace('-', ' ')}</strong> on{' '}
              <strong>{selectedAssets.size} asset(s)</strong>.
            </p>
            
            {validationResult && validationResult.warnings.length > 0 && (
              <div className="warning-box">
                <p><strong>Warnings:</strong></p>
                <ul>
                  {validationResult.warnings.slice(0, 3).map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                  {validationResult.warnings.length > 3 && (
                    <li>...and {validationResult.warnings.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}

            <p className="confirmation-question">
              Are you sure you want to continue?
            </p>

            <div className="dialog-actions">
              <button
                onClick={executeOperation}
                className="btn-confirm"
                disabled={isExecuting}
              >
                {isExecuting ? '⏳ Executing...' : '✅ Confirm'}
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                className="btn-cancel"
                disabled={isExecuting}
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Execution Result */}
      {executionResult && (
        <div className="execution-result success">
          <h4>✅ Operation Completed</h4>
          <p>{executionResult.message}</p>
          {executionResult.updated_count && (
            <p>Updated: {executionResult.updated_count} asset(s)</p>
          )}
          {executionResult.assigned_count && (
            <p>Assigned: {executionResult.assigned_count} asset(s)</p>
          )}
          {executionResult.deleted_count && (
            <p>Deleted: {executionResult.deleted_count} asset(s)</p>
          )}
          {executionResult.notifications_sent && (
            <p>Notifications sent: {executionResult.notifications_sent}</p>
          )}
        </div>
      )}

      <style>{`
        .bulk-operations-panel {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #eee;
        }

        .panel-header h2 {
          margin: 0;
          font-size: 24px;
        }

        .selection-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .selection-count {
          font-weight: bold;
          color: #2196F3;
          font-size: 16px;
        }

        .btn-select-all {
          padding: 8px 16px;
          background: #2196F3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-select-all:hover {
          background: #1976D2;
        }

        .asset-selection-table {
          margin-bottom: 30px;
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        th {
          background: #f5f5f5;
          font-weight: 600;
          position: sticky;
          top: 0;
        }

        tbody tr {
          cursor: pointer;
          transition: background 0.2s;
        }

        tbody tr:hover {
          background: #f9f9f9;
        }

        tbody tr.selected {
          background: #e3f2fd;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-active { background: #4CAF50; color: white; }
        .status-inactive { background: #757575; color: white; }
        .status-under-maintenance { background: #ff9800; color: white; }
        .status-damaged { background: #f44336; color: white; }
        .status-disposed { background: #9e9e9e; color: white; }
        .status-lost { background: #d32f2f; color: white; }

        .operation-config {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .operation-config h3 {
          margin: 0 0 15px 0;
          font-size: 18px;
        }

        .operation-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin: 15px 0;
        }

        label {
          display: flex;
          flex-direction: column;
          gap: 5px;
          font-weight: 500;
        }

        .checkbox-label {
          flex-direction: row;
          align-items: center;
          gap: 10px;
        }

        input[type="text"],
        input[type="datetime-local"],
        select,
        textarea {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        textarea {
          min-height: 80px;
          resize: vertical;
        }

        .warning-text {
          color: #f44336;
          font-weight: 500;
        }

        .operation-actions {
          margin-top: 20px;
        }

        .btn-validate {
          padding: 12px 24px;
          background: #2196F3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
        }

        .btn-validate:hover:not(:disabled) {
          background: #1976D2;
        }

        .btn-validate:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .validation-results {
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .validation-results.success {
          background: #e8f5e9;
          border: 2px solid #4CAF50;
        }

        .validation-results.warning {
          background: #fff3e0;
          border: 2px solid #ff9800;
        }

        .validation-results h4 {
          margin: 0 0 15px 0;
        }

        .validation-stats {
          display: flex;
          gap: 20px;
          margin-bottom: 15px;
        }

        .stat-valid { color: #4CAF50; font-weight: 500; }
        .stat-invalid { color: #f44336; font-weight: 500; }

        .warnings-list {
          margin-top: 15px;
        }

        .warnings-list h5 {
          margin: 0 0 10px 0;
        }

        .warnings-list ul {
          margin: 0;
          padding-left: 20px;
        }

        .warnings-list li {
          margin: 5px 0;
        }

        .error-message {
          color: #f44336;
          font-weight: 500;
          margin: 10px 0 0 0;
        }

        .confirmation-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .confirmation-dialog {
          background: white;
          border-radius: 8px;
          padding: 30px;
          max-width: 500px;
          width: 90%;
        }

        .confirmation-dialog h3 {
          margin: 0 0 15px 0;
          color: #f44336;
        }

        .warning-box {
          background: #fff3e0;
          padding: 15px;
          border-radius: 4px;
          margin: 15px 0;
        }

        .warning-box ul {
          margin: 10px 0 0 0;
          padding-left: 20px;
        }

        .confirmation-question {
          font-weight: 500;
          margin: 20px 0;
        }

        .dialog-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .btn-confirm,
        .btn-cancel {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .btn-confirm {
          background: #4CAF50;
          color: white;
        }

        .btn-confirm:hover:not(:disabled) {
          background: #388E3C;
        }

        .btn-cancel {
          background: #757575;
          color: white;
        }

        .btn-cancel:hover:not(:disabled) {
          background: #616161;
        }

        .btn-confirm:disabled,
        .btn-cancel:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .execution-result {
          padding: 20px;
          border-radius: 8px;
          margin-top: 20px;
        }

        .execution-result.success {
          background: #e8f5e9;
          border: 2px solid #4CAF50;
        }

        .execution-result h4 {
          margin: 0 0 10px 0;
        }

        .execution-result p {
          margin: 5px 0;
        }

        @media (max-width: 768px) {
          .panel-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .selection-info {
            width: 100%;
            justify-content: space-between;
          }

          .asset-selection-table {
            font-size: 12px;
          }

          th, td {
            padding: 8px;
          }

          .operation-config {
            padding: 15px;
          }

          .confirmation-dialog {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default BulkOperationsPanel;
