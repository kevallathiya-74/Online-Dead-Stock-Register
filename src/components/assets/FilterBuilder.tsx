import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface FilterConfig {
  // Status filters
  status?: string[];
  condition?: string[];
  category?: string[];
  department?: string[];
  
  // Location
  location?: string;
  
  // Date ranges
  purchase_date_from?: string;
  purchase_date_to?: string;
  warranty_expiry_from?: string;
  warranty_expiry_to?: string;
  last_audit_date_from?: string;
  last_audit_date_to?: string;
  
  // Financial
  purchase_cost_min?: number;
  purchase_cost_max?: number;
  
  // Assignment
  assigned_user?: string;
  
  // Details
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  vendor?: string;
  
  // Advanced
  search_text?: string;
  has_images?: boolean;
  warranty_expired?: boolean;
  audit_overdue_days?: number;
  maintenance_status?: string;
  
  [key: string]: any;
}

interface FilterField {
  name: string;
  type: string;
  options?: string[];
  special?: string[];
  description?: string;
}

interface FilterFieldGroup {
  basic: FilterField[];
  location: FilterField[];
  dates: FilterField[];
  financial: FilterField[];
  assignment: FilterField[];
  details: FilterField[];
  advanced: FilterField[];
}

interface FilterBuilderProps {
  onApply: (filters: FilterConfig) => void;
  initialFilters?: FilterConfig;
  showResultCount?: boolean;
}

const FilterBuilder: React.FC<FilterBuilderProps> = ({
  onApply,
  initialFilters = {},
  showResultCount = true
}) => {
  const [filters, setFilters] = useState<FilterConfig>(initialFilters);
  const [availableFields, setAvailableFields] = useState<FilterFieldGroup | null>(null);
  const [activeFields, setActiveFields] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resultCount, setResultCount] = useState<number | null>(null);
  const [showFieldSelector, setShowFieldSelector] = useState(false);

  useEffect(() => {
    fetchAvailableFields();
    // Initialize active fields from initial filters
    if (initialFilters && Object.keys(initialFilters).length > 0) {
      setActiveFields(Object.keys(initialFilters));
    }
  }, []);

  const fetchAvailableFields = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/filters/fields', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableFields(response.data.fields);
    } catch (error) {
      console.error('Error fetching filter fields:', error);
    }
  };

  const addField = (fieldName: string) => {
    if (!activeFields.includes(fieldName)) {
      setActiveFields([...activeFields, fieldName]);
    }
    setShowFieldSelector(false);
  };

  const removeField = (fieldName: string) => {
    setActiveFields(activeFields.filter(f => f !== fieldName));
    const newFilters = { ...filters };
    delete newFilters[fieldName];
    // Remove related fields for date/number ranges
    if (fieldName.includes('_date')) {
      delete newFilters[`${fieldName}_from`];
      delete newFilters[`${fieldName}_to`];
    }
    if (fieldName === 'purchase_cost') {
      delete newFilters.purchase_cost_min;
      delete newFilters.purchase_cost_max;
    }
    setFilters(newFilters);
  };

  const updateFilter = (fieldName: string, value: any) => {
    setFilters({
      ...filters,
      [fieldName]: value
    });
  };

  const handleArrayToggle = (fieldName: string, value: string) => {
    const currentValues = filters[fieldName] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v: string) => v !== value)
      : [...currentValues, value];
    updateFilter(fieldName, newValues);
  };

  const applyFilters = async () => {
    setIsLoading(true);
    try {
      if (showResultCount) {
        const token = localStorage.getItem('token');
        const response = await axios.post(
          'http://localhost:5000/api/filters/apply?page=1&limit=1&include_count=true',
          filters,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setResultCount(response.data.pagination.total);
      }
      onApply(filters);
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllFilters = () => {
    setFilters({});
    setActiveFields([]);
    setResultCount(null);
  };

  const getFieldDefinition = (fieldName: string): FilterField | undefined => {
    if (!availableFields) return undefined;
    
    const allFields = [
      ...availableFields.basic,
      ...availableFields.location,
      ...availableFields.dates,
      ...availableFields.financial,
      ...availableFields.assignment,
      ...availableFields.details,
      ...availableFields.advanced
    ];
    
    return allFields.find(f => f.name === fieldName);
  };

  const renderFieldInput = (fieldName: string) => {
    const field = getFieldDefinition(fieldName);
    if (!field) return null;

    switch (field.type) {
      case 'select':
        if (field.options) {
          return (
            <div className="filter-field-input">
              <label>{formatFieldName(fieldName)}</label>
              <div className="checkbox-group">
                {field.options.map(option => (
                  <label key={option} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={(filters[fieldName] || []).includes(option)}
                      onChange={() => handleArrayToggle(fieldName, option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          );
        }
        return null;

      case 'text':
        return (
          <div className="filter-field-input">
            <label>{formatFieldName(fieldName)}</label>
            <input
              type="text"
              value={filters[fieldName] || ''}
              onChange={(e) => updateFilter(fieldName, e.target.value)}
              placeholder={field.description || `Enter ${formatFieldName(fieldName)}`}
            />
          </div>
        );

      case 'date_range':
        return (
          <div className="filter-field-input">
            <label>{formatFieldName(fieldName)}</label>
            <div className="date-range-inputs">
              <div>
                <label className="sub-label">From</label>
                <input
                  type="date"
                  value={filters[`${fieldName}_from`] || ''}
                  onChange={(e) => updateFilter(`${fieldName}_from`, e.target.value)}
                />
              </div>
              <div>
                <label className="sub-label">To</label>
                <input
                  type="date"
                  value={filters[`${fieldName}_to`] || ''}
                  onChange={(e) => updateFilter(`${fieldName}_to`, e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 'number_range':
        return (
          <div className="filter-field-input">
            <label>{formatFieldName(fieldName)}</label>
            <div className="number-range-inputs">
              <div>
                <label className="sub-label">Min</label>
                <input
                  type="number"
                  value={filters[`${fieldName}_min`] || ''}
                  onChange={(e) => updateFilter(`${fieldName}_min`, parseFloat(e.target.value))}
                  placeholder="Min"
                />
              </div>
              <div>
                <label className="sub-label">Max</label>
                <input
                  type="number"
                  value={filters[`${fieldName}_max`] || ''}
                  onChange={(e) => updateFilter(`${fieldName}_max`, parseFloat(e.target.value))}
                  placeholder="Max"
                />
              </div>
            </div>
          </div>
        );

      case 'boolean':
        return (
          <div className="filter-field-input">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters[fieldName] === true}
                onChange={(e) => updateFilter(fieldName, e.target.checked)}
              />
              {formatFieldName(fieldName)}
            </label>
          </div>
        );

      case 'number':
        return (
          <div className="filter-field-input">
            <label>{formatFieldName(fieldName)}</label>
            <input
              type="number"
              value={filters[fieldName] || ''}
              onChange={(e) => updateFilter(fieldName, parseInt(e.target.value))}
              placeholder={field.description}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const formatFieldName = (fieldName: string): string => {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const getAllAvailableFields = (): FilterField[] => {
    if (!availableFields) return [];
    return [
      ...availableFields.basic,
      ...availableFields.location,
      ...availableFields.dates,
      ...availableFields.financial,
      ...availableFields.assignment,
      ...availableFields.details,
      ...availableFields.advanced
    ];
  };

  const getFieldsByCategory = (category: keyof FilterFieldGroup): FilterField[] => {
    return availableFields ? availableFields[category] : [];
  };

  return (
    <div className="filter-builder">
      <div className="filter-builder-header">
        <h2>🔍 Filter Builder</h2>
        <div className="header-actions">
          {activeFields.length > 0 && (
            <button className="clear-btn" onClick={clearAllFilters}>
              Clear All
            </button>
          )}
          <button 
            className="add-field-btn"
            onClick={() => setShowFieldSelector(!showFieldSelector)}
          >
            + Add Filter
          </button>
        </div>
      </div>

      {showFieldSelector && availableFields && (
        <div className="field-selector">
          <div className="field-selector-header">
            <h3>Select Fields to Filter</h3>
            <button onClick={() => setShowFieldSelector(false)}>✕</button>
          </div>
          
          <div className="field-categories">
            {Object.entries(availableFields).map(([category, fields]) => (
              <div key={category} className="field-category">
                <h4>{formatFieldName(category)}</h4>
                <div className="field-buttons">
                  {fields.map((field: FilterField) => (
                    <button
                      key={field.name}
                      className={`field-option ${activeFields.includes(field.name) ? 'active' : ''}`}
                      onClick={() => addField(field.name)}
                      disabled={activeFields.includes(field.name)}
                    >
                      {formatFieldName(field.name)}
                      {field.description && <span className="field-desc">{field.description}</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="active-filters">
        {activeFields.length === 0 ? (
          <div className="no-filters">
            <p>No filters applied. Click "Add Filter" to get started.</p>
          </div>
        ) : (
          <div className="filter-fields">
            {activeFields.map(fieldName => (
              <div key={fieldName} className="filter-field">
                <button 
                  className="remove-field-btn"
                  onClick={() => removeField(fieldName)}
                  title="Remove filter"
                >
                  ✕
                </button>
                {renderFieldInput(fieldName)}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="filter-actions">
        <button
          className="apply-btn"
          onClick={applyFilters}
          disabled={isLoading || activeFields.length === 0}
        >
          {isLoading ? 'Loading...' : 'Apply Filters'}
        </button>
        
        {resultCount !== null && (
          <div className="result-count">
            Found <strong>{resultCount}</strong> matching assets
          </div>
        )}
      </div>

      <style>{`
        .filter-builder {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .filter-builder-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e0e0e0;
        }

        .filter-builder-header h2 {
          margin: 0;
          font-size: 24px;
          color: #333;
        }

        .header-actions {
          display: flex;
          gap: 10px;
        }

        .add-field-btn {
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

        .add-field-btn:hover {
          background: #1976D2;
        }

        .clear-btn {
          padding: 10px 20px;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.3s;
        }

        .clear-btn:hover {
          background: #d32f2f;
        }

        .field-selector {
          background: #f5f5f5;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          max-height: 500px;
          overflow-y: auto;
        }

        .field-selector-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .field-selector-header h3 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }

        .field-selector-header button {
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

        .field-categories {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .field-category h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .field-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .field-option {
          padding: 8px 16px;
          background: white;
          border: 2px solid #ddd;
          border-radius: 20px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.3s;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .field-option:hover:not(:disabled) {
          border-color: #2196F3;
          color: #2196F3;
        }

        .field-option.active,
        .field-option:disabled {
          background: #e0e0e0;
          border-color: #bbb;
          color: #999;
          cursor: not-allowed;
        }

        .field-desc {
          font-size: 11px;
          color: #999;
          margin-top: 4px;
        }

        .active-filters {
          min-height: 200px;
          margin-bottom: 20px;
        }

        .no-filters {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          background: #fafafa;
          border: 2px dashed #ddd;
          border-radius: 8px;
        }

        .no-filters p {
          color: #999;
          font-size: 16px;
        }

        .filter-fields {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .filter-field {
          position: relative;
          background: #fafafa;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 15px;
          padding-top: 10px;
        }

        .remove-field-btn {
          position: absolute;
          top: 5px;
          right: 5px;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
          transition: background 0.3s;
        }

        .remove-field-btn:hover {
          background: #d32f2f;
        }

        .filter-field-input {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-field-input > label {
          font-weight: 500;
          color: #333;
          font-size: 14px;
        }

        .filter-field-input input[type="text"],
        .filter-field-input input[type="number"],
        .filter-field-input input[type="date"] {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #555;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          cursor: pointer;
        }

        .date-range-inputs,
        .number-range-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .sub-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
          display: block;
        }

        .filter-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 20px;
          border-top: 2px solid #e0e0e0;
        }

        .apply-btn {
          padding: 12px 30px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          transition: background 0.3s;
        }

        .apply-btn:hover:not(:disabled) {
          background: #45a049;
        }

        .apply-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .result-count {
          font-size: 16px;
          color: #333;
        }

        .result-count strong {
          color: #2196F3;
          font-size: 20px;
        }

        @media (max-width: 768px) {
          .filter-fields {
            grid-template-columns: 1fr;
          }

          .filter-builder-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }

          .filter-actions {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default FilterBuilder;
