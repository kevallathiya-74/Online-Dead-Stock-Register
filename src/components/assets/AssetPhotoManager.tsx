import React, { useState } from 'react';
import AssetPhotoCapture from './AssetPhotoCapture';
import AssetPhotoGallery from './AssetPhotoGallery';

interface AssetPhotoManagerProps {
  assetId: string;
  assetName?: string;
}

const AssetPhotoManager: React.FC<AssetPhotoManagerProps> = ({
  assetId,
  assetName
}) => {
  const [activeTab, setActiveTab] = useState<'gallery' | 'capture'>('gallery');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadComplete = () => {
    // Refresh gallery after successful upload
    setRefreshKey(prev => prev + 1);
    setActiveTab('gallery');
  };

  const handlePhotoDeleted = () => {
    // Refresh gallery after deletion
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="asset-photo-manager">
      <div className="manager-header">
        <h2>📸 Asset Photos</h2>
        {assetName && <p className="asset-name">{assetName}</p>}
      </div>

      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'gallery' ? 'active' : ''}`}
          onClick={() => setActiveTab('gallery')}
        >
          🖼️ Gallery
        </button>
        <button
          className={`tab-btn ${activeTab === 'capture' ? 'active' : ''}`}
          onClick={() => setActiveTab('capture')}
        >
          📷 Capture / Upload
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'gallery' && (
          <AssetPhotoGallery
            key={refreshKey}
            assetId={assetId}
            onPhotoDeleted={handlePhotoDeleted}
          />
        )}

        {activeTab === 'capture' && (
          <AssetPhotoCapture
            assetId={assetId}
            onUploadComplete={handleUploadComplete}
            onClose={() => setActiveTab('gallery')}
          />
        )}
      </div>

      <style>{`
        .asset-photo-manager {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .manager-header {
          margin-bottom: 20px;
        }

        .manager-header h2 {
          margin: 0 0 8px 0;
          font-size: 24px;
          color: #333;
        }

        .asset-name {
          margin: 0;
          color: #666;
          font-size: 14px;
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
        }

        .tab-btn:hover {
          color: #2196F3;
        }

        .tab-btn.active {
          color: #2196F3;
          border-bottom-color: #2196F3;
          font-weight: 500;
        }

        .tab-content {
          min-height: 400px;
        }

        @media (max-width: 768px) {
          .asset-photo-manager {
            padding: 15px;
          }

          .manager-header h2 {
            font-size: 20px;
          }

          .tab-btn {
            padding: 10px 16px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default AssetPhotoManager;
