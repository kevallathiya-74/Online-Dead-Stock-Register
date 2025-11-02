import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface FilterPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  filter_config: any;
  is_preset: boolean;
}

interface FilterPresetsProps {
  onApplyPreset: (filterConfig: any) => void;
}

const FilterPresets: React.FC<FilterPresetsProps> = ({ onApplyPreset }) => {
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('${API_BASE_URL}/filters/presets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPresets(response.data.presets);
    } catch (error) {
      console.error('Error fetching presets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPreset = (preset: FilterPreset) => {
    setSelectedPreset(preset.id);
    onApplyPreset(preset.filter_config);
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

  const getPresetGradient = (category: string) => {
    const gradients: { [key: string]: string } = {
      status: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      condition: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      location: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      date: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      user: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      maintenance: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      financial: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      custom: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
    };
    return gradients[category] || 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)';
  };

  return (
    <div className="filter-presets">
      <div className="presets-header">
        <h2>⚡ Quick Filters</h2>
        <p>Apply commonly used filters with one click</p>
      </div>

      {isLoading ? (
        <div className="loading">Loading presets...</div>
      ) : (
        <div className="presets-grid">
          {presets.map(preset => (
            <div
              key={preset.id}
              className={`preset-card ${selectedPreset === preset.id ? 'selected' : ''}`}
              onClick={() => handleApplyPreset(preset)}
            >
              <div 
                className="preset-header"
                style={{ background: getPresetGradient(preset.category) }}
              >
                <span className="preset-icon">
                  {getCategoryIcon(preset.category)}
                </span>
              </div>
              
              <div className="preset-body">
                <h3>{preset.name}</h3>
                <p>{preset.description}</p>
                
                <div className="preset-category">
                  <span 
                    className="category-badge"
                    style={{ 
                      background: getCategoryColor(preset.category),
                      color: 'white'
                    }}
                  >
                    {preset.category}
                  </span>
                </div>
              </div>

              {selectedPreset === preset.id && (
                <div className="selected-indicator">
                   Applied
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .filter-presets {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .presets-header {
          margin-bottom: 30px;
          text-align: center;
        }

        .presets-header h2 {
          margin: 0 0 10px 0;
          font-size: 28px;
          color: #333;
        }

        .presets-header p {
          margin: 0;
          color: #666;
          font-size: 16px;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #999;
          font-size: 16px;
        }

        .presets-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
        }

        .preset-card {
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
        }

        .preset-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
          border-color: #2196F3;
        }

        .preset-card.selected {
          border-color: #4CAF50;
          box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
        }

        .preset-header {
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .preset-icon {
          font-size: 48px;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
        }

        .preset-body {
          padding: 20px;
        }

        .preset-body h3 {
          margin: 0 0 10px 0;
          font-size: 18px;
          color: #333;
        }

        .preset-body p {
          margin: 0 0 15px 0;
          color: #666;
          font-size: 14px;
          line-height: 1.5;
          min-height: 40px;
        }

        .preset-category {
          display: flex;
          justify-content: center;
        }

        .category-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .selected-indicator {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #4CAF50;
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(76, 175, 80, 0.4);
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 1200px) {
          .presets-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .presets-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 15px;
          }

          .preset-header {
            height: 100px;
          }

          .preset-icon {
            font-size: 36px;
          }

          .preset-body {
            padding: 15px;
          }

          .preset-body h3 {
            font-size: 16px;
          }

          .preset-body p {
            font-size: 13px;
            min-height: 35px;
          }
        }

        @media (max-width: 480px) {
          .presets-grid {
            grid-template-columns: 1fr;
          }

          .preset-card {
            display: flex;
            border-radius: 8px;
          }

          .preset-header {
            width: 100px;
            height: auto;
            min-height: 100px;
          }

          .preset-icon {
            font-size: 32px;
          }

          .preset-body {
            flex: 1;
          }

          .preset-body p {
            min-height: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default FilterPresets;
