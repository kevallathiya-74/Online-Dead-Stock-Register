import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';

interface User {
  _id: string;
  name: string;
  email: string;
  department: string;
}

interface ChecklistItem {
  item: string;
  is_required: boolean;
  order: number;
}

interface ScheduleAuditFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  editingAudit?: any;
}

const ScheduleAuditForm: React.FC<ScheduleAuditFormProps> = ({
  onSuccess,
  onCancel,
  editingAudit
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    recurrence_type: 'once' as 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    start_date: '',
    end_date: '',
    audit_type: 'full',
    scope_type: 'all',
    scope_config: {} as any,
    assigned_auditors: [] as string[],
    auto_assign: false,
    reminder_settings: {
      enabled: true,
      days_before: 1,
      send_email: true,
      send_notification: true
    },
    checklist_items: [] as ChecklistItem[],
    notification_recipients: [] as string[]
  });

  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    fetchUsers();
    fetchMetadata();
    
    if (editingAudit) {
      populateForm(editingAudit);
    }
  }, [editingAudit]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('${API_BASE_URL}/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMetadata = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('${API_BASE_URL}/assets/metadata', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = response.data;
      setDepartments(data.departments || ['IT', 'HR', 'Finance', 'Operations']);
      setLocations(data.locations || ['Building A', 'Building B', 'Warehouse']);
      setCategories(data.categories || ['Electronics', 'Furniture', 'Vehicles', 'IT Equipment']);
    } catch (error) {
      console.error('Error fetching metadata:', error);
      // Use defaults
      setDepartments(['IT', 'HR', 'Finance', 'Operations', 'Inventory', 'Admin']);
      setCategories(['Electronics', 'Furniture', 'Vehicles', 'Machinery', 'IT Equipment', 'Office Supplies']);
    }
  };

  const populateForm = (audit: any) => {
    setFormData({
      name: audit.name,
      description: audit.description || '',
      recurrence_type: audit.recurrence_type,
      start_date: audit.start_date ? new Date(audit.start_date).toISOString().split('T')[0] : '',
      end_date: audit.end_date ? new Date(audit.end_date).toISOString().split('T')[0] : '',
      audit_type: audit.audit_type || 'full',
      scope_type: audit.scope_type,
      scope_config: audit.scope_config || {},
      assigned_auditors: audit.assigned_auditors?.map((a: any) => a._id || a) || [],
      auto_assign: audit.auto_assign || false,
      reminder_settings: audit.reminder_settings || {
        enabled: true,
        days_before: 1,
        send_email: true,
        send_notification: true
      },
      checklist_items: audit.checklist_items || [],
      notification_recipients: audit.notification_recipients?.map((r: any) => r._id || r) || []
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.start_date) {
      setError('Name and start date are required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const url = editingAudit 
        ? `${API_BASE_URL}/scheduled-audits/${editingAudit._id}`
        : '${API_BASE_URL}/scheduled-audits';
      
      const method = editingAudit ? 'put' : 'post';
      
      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to schedule audit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateScopeConfig = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      scope_config: { ...prev.scope_config, [field]: value }
    }));
  };

  const addChecklistItem = () => {
    const newItem: ChecklistItem = {
      item: '',
      is_required: false,
      order: formData.checklist_items.length + 1
    };
    setFormData(prev => ({
      ...prev,
      checklist_items: [...prev.checklist_items, newItem]
    }));
  };

  const updateChecklistItem = (index: number, field: keyof ChecklistItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      checklist_items: prev.checklist_items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeChecklistItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      checklist_items: prev.checklist_items.filter((_, i) => i !== index)
    }));
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
        <div className="step-number">1</div>
        <div className="step-label">Basic Info</div>
      </div>
      <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
        <div className="step-number">2</div>
        <div className="step-label">Schedule</div>
      </div>
      <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
        <div className="step-number">3</div>
        <div className="step-label">Scope</div>
      </div>
      <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
        <div className="step-number">4</div>
        <div className="step-label">Auditors</div>
      </div>
      <div className={`step ${currentStep >= 5 ? 'active' : ''}`}>
        <div className="step-number">5</div>
        <div className="step-label">Checklist</div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="form-step">
      <h3>📋 Basic Information</h3>
      
      <div className="form-group">
        <label>Audit Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateFormData('name', e.target.value)}
          placeholder="e.g., Monthly IT Equipment Audit"
          required
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          placeholder="Describe the purpose of this audit..."
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>Audit Type</label>
        <select
          value={formData.audit_type}
          onChange={(e) => updateFormData('audit_type', e.target.value)}
        >
          <option value="full">Full Audit - All asset details</option>
          <option value="partial">Partial Audit - Key fields only</option>
          <option value="spot_check">Spot Check - Random sample</option>
          <option value="condition">Condition Check - Physical condition only</option>
          <option value="location">Location Verification - Location only</option>
        </select>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="form-step">
      <h3>📅 Schedule Configuration</h3>
      
      <div className="form-group">
        <label>Recurrence Type *</label>
        <div className="radio-group">
          {[
            { value: 'once', label: '⚪ Once', desc: 'One-time audit' },
            { value: 'daily', label: '🔵 Daily', desc: 'Every day' },
            { value: 'weekly', label: '🟢 Weekly', desc: 'Every week' },
            { value: 'monthly', label: '🟠 Monthly', desc: 'Every month' },
            { value: 'quarterly', label: '🟣 Quarterly', desc: 'Every 3 months' },
            { value: 'yearly', label: '🔴 Yearly', desc: 'Every year' }
          ].map(option => (
            <label key={option.value} className="radio-label">
              <input
                type="radio"
                name="recurrence"
                value={option.value}
                checked={formData.recurrence_type === option.value}
                onChange={(e) => updateFormData('recurrence_type', e.target.value)}
              />
              <span className="radio-content">
                <strong>{option.label}</strong>
                <small>{option.desc}</small>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Start Date *</label>
          <input
            type="date"
            value={formData.start_date}
            onChange={(e) => updateFormData('start_date', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        {formData.recurrence_type !== 'once' && (
          <div className="form-group">
            <label>End Date (Optional)</label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => updateFormData('end_date', e.target.value)}
              min={formData.start_date}
            />
          </div>
        )}
      </div>

      <div className="info-box">
        <strong>ℹ️ Reminder Settings</strong>
        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.reminder_settings.enabled}
              onChange={(e) => updateFormData('reminder_settings', {
                ...formData.reminder_settings,
                enabled: e.target.checked
              })}
            />
            Enable reminders
          </label>
        </div>

        {formData.reminder_settings.enabled && (
          <>
            <div className="form-group">
              <label>Days before audit</label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.reminder_settings.days_before}
                onChange={(e) => updateFormData('reminder_settings', {
                  ...formData.reminder_settings,
                  days_before: parseInt(e.target.value)
                })}
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.reminder_settings.send_email}
                  onChange={(e) => updateFormData('reminder_settings', {
                    ...formData.reminder_settings,
                    send_email: e.target.checked
                  })}
                />
                Send email reminders
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.reminder_settings.send_notification}
                  onChange={(e) => updateFormData('reminder_settings', {
                    ...formData.reminder_settings,
                    send_notification: e.target.checked
                  })}
                />
                Send in-app notifications
              </label>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="form-step">
      <h3>🎯 Audit Scope</h3>
      
      <div className="form-group">
        <label>Scope Type *</label>
        <select
          value={formData.scope_type}
          onChange={(e) => {
            updateFormData('scope_type', e.target.value);
            updateFormData('scope_config', {});
          }}
        >
          <option value="all">All Assets</option>
          <option value="department">By Department</option>
          <option value="location">By Location</option>
          <option value="category">By Category</option>
          <option value="custom_filter">Custom Filter</option>
        </select>
      </div>

      {formData.scope_type === 'department' && (
        <div className="form-group">
          <label>Select Department</label>
          <select
            value={formData.scope_config.department || ''}
            onChange={(e) => updateScopeConfig('department', e.target.value)}
          >
            <option value="">Choose department...</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      )}

      {formData.scope_type === 'location' && (
        <div className="form-group">
          <label>Select Location</label>
          <input
            type="text"
            value={formData.scope_config.location || ''}
            onChange={(e) => updateScopeConfig('location', e.target.value)}
            placeholder="Enter location..."
            list="locations-list"
          />
          <datalist id="locations-list">
            {locations.map(loc => (
              <option key={loc} value={loc} />
            ))}
          </datalist>
        </div>
      )}

      {formData.scope_type === 'category' && (
        <div className="form-group">
          <label>Select Category</label>
          <select
            value={formData.scope_config.category || ''}
            onChange={(e) => updateScopeConfig('category', e.target.value)}
          >
            <option value="">Choose category...</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      )}

      {formData.scope_type === 'custom_filter' && (
        <div className="info-box">
          <p>Custom filters allow you to define complex criteria. Configure additional filter parameters:</p>
          <div className="form-group">
            <label>Status</label>
            <select
              value={formData.scope_config.status || ''}
              onChange={(e) => updateScopeConfig('status', e.target.value)}
            >
              <option value="">Any status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Under Maintenance">Under Maintenance</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="form-step">
      <h3>👥 Assign Auditors</h3>
      
      <div className="form-group checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.auto_assign}
            onChange={(e) => updateFormData('auto_assign', e.target.checked)}
          />
          Auto-assign auditors based on department
        </label>
      </div>

      {!formData.auto_assign && (
        <div className="form-group">
          <label>Select Auditors</label>
          <div className="user-select-grid">
            {users
              .filter(u => u._id)
              .map(user => (
              <label key={user._id} className="user-checkbox">
                <input
                  type="checkbox"
                  checked={formData.assigned_auditors.includes(user._id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      updateFormData('assigned_auditors', [...formData.assigned_auditors, user._id]);
                    } else {
                      updateFormData('assigned_auditors', formData.assigned_auditors.filter(id => id !== user._id));
                    }
                  }}
                />
                <div className="user-info">
                  <strong>{user.name}</strong>
                  <small>{user.department} • {user.email}</small>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="form-group">
        <label>Additional Notification Recipients</label>
        <p className="field-help">Receive notifications but not assigned to audit</p>
        <div className="user-select-grid">
          {users
            .filter(u => u._id && !formData.assigned_auditors.includes(u._id))
            .map(user => (
            <label key={user._id} className="user-checkbox">
              <input
                type="checkbox"
                checked={formData.notification_recipients.includes(user._id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateFormData('notification_recipients', [...formData.notification_recipients, user._id]);
                  } else {
                    updateFormData('notification_recipients', formData.notification_recipients.filter(id => id !== user._id));
                  }
                }}
              />
              <div className="user-info">
                <strong>{user.name}</strong>
                <small>{user.email}</small>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="form-step">
      <h3>✅ Audit Checklist</h3>
      
      <p className="field-help">Define items that auditors need to verify during the audit</p>

      <div className="checklist-items">
        {formData.checklist_items.map((item, index) => (
          <div key={index} className="checklist-item-form">
            <input
              type="text"
              value={item.item}
              onChange={(e) => updateChecklistItem(index, 'item', e.target.value)}
              placeholder="Checklist item..."
            />
            <label className="checkbox-label inline">
              <input
                type="checkbox"
                checked={item.is_required}
                onChange={(e) => updateChecklistItem(index, 'is_required', e.target.checked)}
              />
              Required
            </label>
            <button
              type="button"
              className="remove-btn"
              onClick={() => removeChecklistItem(index)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button type="button" className="add-checklist-btn" onClick={addChecklistItem}>
        + Add Checklist Item
      </button>
    </div>
  );

  return (
    <form className="schedule-audit-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h2>{editingAudit ? 'Edit Scheduled Audit' : '📅 Schedule New Audit'}</h2>
        {onCancel && (
          <button type="button" className="close-btn" onClick={onCancel}>
            ✕
          </button>
        )}
      </div>

      {renderStepIndicator()}

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      <div className="form-content">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
      </div>

      <div className="form-footer">
        <div className="footer-left">
          {currentStep > 1 && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              ← Previous
            </button>
          )}
        </div>
        
        <div className="footer-right">
          {currentStep < 5 ? (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setCurrentStep(currentStep + 1)}
            >
              Next →
            </button>
          ) : (
            <button
              type="submit"
              className="btn-success"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : editingAudit ? 'Update Audit' : 'Schedule Audit'}
            </button>
          )}
        </div>
      </div>

      <style>{`
        .schedule-audit-form {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          max-width: 900px;
          margin: 0 auto;
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 2px solid #e0e0e0;
        }

        .form-header h2 {
          margin: 0;
          font-size: 28px;
          color: #333;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 28px;
          color: #666;
          cursor: pointer;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          transition: background 0.3s;
        }

        .close-btn:hover {
          background: #f5f5f5;
        }

        .step-indicator {
          display: flex;
          justify-content: space-between;
          padding: 24px;
          background: #f9f9f9;
          gap: 12px;
        }

        .step {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          opacity: 0.4;
          transition: opacity 0.3s;
        }

        .step.active {
          opacity: 1;
        }

        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          color: #666;
        }

        .step.active .step-number {
          background: #2196F3;
          color: white;
        }

        .step-label {
          font-size: 12px;
          font-weight: 600;
          color: #666;
          text-align: center;
        }

        .error-message {
          background: #ffebee;
          border: 1px solid #ef5350;
          color: #c62828;
          padding: 12px;
          border-radius: 6px;
          margin: 20px 24px;
        }

        .form-content {
          padding: 24px;
          min-height: 400px;
        }

        .form-step h3 {
          margin: 0 0 24px 0;
          font-size: 22px;
          color: #333;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }

        .form-group input[type="text"],
        .form-group input[type="date"],
        .form-group input[type="number"],
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
          transition: border-color 0.3s;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: #2196F3;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .radio-group {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .radio-label {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .radio-label:hover {
          border-color: #2196F3;
          background: #f5f9ff;
        }

        .radio-label input[type="radio"] {
          cursor: pointer;
        }

        .radio-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .radio-content strong {
          font-size: 14px;
          color: #333;
        }

        .radio-content small {
          font-size: 12px;
          color: #666;
        }

        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-size: 14px;
        }

        .checkbox-label input[type="checkbox"] {
          cursor: pointer;
          width: 18px;
          height: 18px;
        }

        .info-box {
          background: #e3f2fd;
          border: 1px solid #90caf9;
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
        }

        .info-box strong {
          display: block;
          margin-bottom: 12px;
          color: #1976D2;
        }

        .field-help {
          font-size: 13px;
          color: #666;
          margin: 0 0 12px 0;
        }

        .user-select-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
          max-height: 300px;
          overflow-y: auto;
          padding: 12px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
        }

        .user-checkbox {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .user-checkbox:hover {
          background: #f5f5f5;
          border-color: #2196F3;
        }

        .user-checkbox input[type="checkbox"] {
          cursor: pointer;
          width: 18px;
          height: 18px;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .user-info strong {
          font-size: 14px;
          color: #333;
        }

        .user-info small {
          font-size: 12px;
          color: #666;
        }

        .checklist-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }

        .checklist-item-form {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .checklist-item-form input[type="text"] {
          flex: 1;
        }

        .checkbox-label.inline {
          margin: 0;
          white-space: nowrap;
        }

        .remove-btn {
          padding: 8px 12px;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: background 0.3s;
        }

        .remove-btn:hover {
          background: #d32f2f;
        }

        .add-checklist-btn {
          padding: 10px 20px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: background 0.3s;
        }

        .add-checklist-btn:hover {
          background: #45a049;
        }

        .form-footer {
          display: flex;
          justify-content: space-between;
          padding: 20px 24px;
          border-top: 2px solid #e0e0e0;
          background: #f9f9f9;
        }

        .footer-left, .footer-right {
          display: flex;
          gap: 12px;
        }

        .btn-secondary, .btn-primary, .btn-success {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          transition: all 0.3s;
        }

        .btn-secondary {
          background: #e0e0e0;
          color: #333;
        }

        .btn-secondary:hover {
          background: #d0d0d0;
        }

        .btn-primary {
          background: #2196F3;
          color: white;
        }

        .btn-primary:hover {
          background: #1976D2;
        }

        .btn-success {
          background: #4CAF50;
          color: white;
          min-width: 150px;
        }

        .btn-success:hover:not(:disabled) {
          background: #45a049;
        }

        .btn-success:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .form-header,
          .form-content,
          .form-footer {
            padding: 16px;
          }

          .step-indicator {
            overflow-x: auto;
            padding: 16px;
          }

          .step-label {
            font-size: 10px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .radio-group {
            grid-template-columns: 1fr;
          }

          .user-select-grid {
            grid-template-columns: 1fr;
          }

          .form-footer {
            flex-direction: column;
            gap: 12px;
          }

          .footer-left, .footer-right {
            width: 100%;
          }

          .btn-secondary, .btn-primary, .btn-success {
            width: 100%;
          }
        }
      `}</style>
    </form>
  );
};

export default ScheduleAuditForm;
