import React, { useState } from 'react';
import FilterBuilder from './FilterBuilder';
import FilterPresets from './FilterPresets';
import SavedFiltersList from './SavedFiltersList';
import FilterResultsPreview from './FilterResultsPreview';
import SaveFilterDialog from './SaveFilterDialog';

interface CustomFiltersManagerProps {
  onFilterApplied?: (assets: any[]) => void;
}

const CustomFiltersManager: React.FC<CustomFiltersManagerProps> = ({
  onFilterApplied
}) => {
  const [activeTab, setActiveTab] = useState<'builder' | 'presets' | 'saved'>('builder');
  const [currentFilter, setCurrentFilter] = useState<any>({});
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFilterApply = (filterConfig: any) => {
    setCurrentFilter(filterConfig);
  };

  const handlePresetApply = (filterConfig: any) => {
    setCurrentFilter(filterConfig);
    setActiveTab('builder');
  };

  const handleSavedFilterSelect = (filterConfig: any) => {
    setCurrentFilter(filterConfig);
    setActiveTab('builder');
  };

  const handleSaveFilter = () => {
    setShowSaveDialog(true);
  };

  const handleFilterSaved = () => {
    setRefreshKey(prev => prev + 1);
  };

  const hasActiveFilters = Object.keys(currentFilter).length > 0;

  return (
    <div className="custom-filters-manager">
      <div className="manager-header">
        <div className="header-content">
          <h1>🔍 Advanced Filtering System</h1>
          <p className="header-description">
            Build complex filters, save them for later, or use quick presets
          </p>
        </div>
        
        {hasActiveFilters && activeTab === 'builder' && (
          <button className="save-filter-btn" onClick={handleSaveFilter}>
            💾 Save Current Filter
          </button>
        )}
      </div>

      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'builder' ? 'active' : ''}`}
          onClick={() => setActiveTab('builder')}
        >
          <span className="tab-icon">🔧</span>
          <span className="tab-label">Filter Builder</span>
          {hasActiveFilters && <span className="active-indicator">●</span>}
        </button>
        
        <button
          className={`tab-btn ${activeTab === 'presets' ? 'active' : ''}`}
          onClick={() => setActiveTab('presets')}
        >
          <span className="tab-icon">⚡</span>
          <span className="tab-label">Quick Presets</span>
        </button>
        
        <button
          className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          <span className="tab-icon">📂</span>
          <span className="tab-label">Saved Filters</span>
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'builder' && (
          <div className="builder-layout">
            <div className="builder-section">
              <FilterBuilder
                onApply={handleFilterApply}
                initialFilters={currentFilter}
                showResultCount={true}
              />
            </div>
            
            {hasActiveFilters && (
              <div className="results-section">
                <FilterResultsPreview
                  filterConfig={currentFilter}
                  onExport={(format) => console.log(`Exported as ${format}`)}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'presets' && (
          <FilterPresets onApplyPreset={handlePresetApply} />
        )}

        {activeTab === 'saved' && (
          <SavedFiltersList
            key={refreshKey}
            onSelectFilter={handleSavedFilterSelect}
            onRefresh={() => setRefreshKey(prev => prev + 1)}
          />
        )}
      </div>

      <SaveFilterDialog
        filterConfig={currentFilter}
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleFilterSaved}
      />

      <style>{`
        .custom-filters-manager {
          padding: 20px;
          max-width: 1600px;
          margin: 0 auto;
          min-height: 100vh;
          background: #f5f5f5;
        }

        .manager-header {
          background: white;
          border-radius: 12px;
          padding: 30px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .header-content h1 {
          margin: 0 0 10px 0;
          font-size: 32px;
          color: #333;
          font-weight: 700;
        }

        .header-description {
          margin: 0;
          color: #666;
          font-size: 16px;
          line-height: 1.5;
        }

        .save-filter-btn {
          padding: 14px 28px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          white-space: nowrap;
        }

        .save-filter-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        .tab-navigation {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          background: white;
          border-radius: 12px;
          padding: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .tab-btn {
          flex: 1;
          padding: 16px 24px;
          background: none;
          border: 2px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          color: #666;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          position: relative;
          font-weight: 500;
        }

        .tab-btn:hover {
          background: #f5f5f5;
          color: #333;
        }

        .tab-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .tab-icon {
          font-size: 24px;
        }

        .tab-label {
          font-size: 16px;
        }

        .active-indicator {
          position: absolute;
          top: 8px;
          right: 8px;
          color: #4CAF50;
          font-size: 12px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .tab-content {
          min-height: 600px;
        }

        .builder-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        .builder-section,
        .results-section {
          animation: fadeInUp 0.4s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .custom-filters-manager {
            padding: 15px;
          }

          .manager-header {
            flex-direction: column;
            align-items: flex-start;
            padding: 20px;
          }

          .save-filter-btn {
            width: 100%;
          }
        }

        @media (max-width: 768px) {
          .header-content h1 {
            font-size: 24px;
          }

          .header-description {
            font-size: 14px;
          }

          .tab-navigation {
            flex-direction: column;
            gap: 8px;
          }

          .tab-btn {
            padding: 14px 20px;
          }

          .tab-icon {
            font-size: 20px;
          }

          .tab-label {
            font-size: 14px;
          }

          .builder-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .custom-filters-manager {
            padding: 10px;
          }

          .manager-header {
            padding: 15px;
          }

          .header-content h1 {
            font-size: 20px;
          }

          .save-filter-btn {
            padding: 12px 20px;
            font-size: 14px;
          }
        }

        /* Print Styles */
        @media print {
          .manager-header,
          .tab-navigation,
          .save-filter-btn {
            display: none;
          }

          .custom-filters-manager {
            background: white;
          }

          .tab-content {
            min-height: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomFiltersManager;
