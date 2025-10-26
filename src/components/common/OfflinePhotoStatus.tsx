import React from 'react';
import useOfflinePhotoStorage from '../../hooks/useOfflinePhotoStorage';

const OfflinePhotoStatus: React.FC = () => {
  const {
    offlinePhotos,
    isOnline,
    isSyncing,
    syncOfflinePhotos,
    clearAllOfflinePhotos,
    getStorageInfo
  } = useOfflinePhotoStorage();

  const storageInfo = getStorageInfo();

  if (offlinePhotos.length === 0) {
    return null;
  }

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="offline-photo-status">
      <div className="status-header">
        <div className="status-icon">
          {isSyncing ? '🔄' : isOnline ? '📡' : '📵'}
        </div>
        <div className="status-info">
          <h4>Offline Photos</h4>
          <p>
            {isSyncing
              ? 'Syncing photos...'
              : isOnline
              ? `${offlinePhotos.length} photo(s) ready to sync`
              : `${offlinePhotos.length} photo(s) waiting for connection`}
          </p>
        </div>
      </div>

      <div className="storage-info">
        <div className="storage-bar">
          <div
            className="storage-fill"
            style={{ width: `${storageInfo.percentUsed}%` }}
          />
        </div>
        <div className="storage-text">
          {formatBytes(storageInfo.currentSize)} / {formatBytes(storageInfo.maxSize)}
          {' '}({storageInfo.percentUsed.toFixed(1)}%)
        </div>
      </div>

      <div className="photo-list">
        {offlinePhotos.map(photo => (
          <div key={photo.id} className="offline-photo-item">
            <img
              src={photo.dataUrl}
              alt={photo.fileName}
              className="photo-thumb"
            />
            <div className="photo-details">
              <span className="photo-name">{photo.fileName}</span>
              <span className="photo-meta">
                {formatBytes(photo.fileSize)} • {new Date(photo.timestamp).toLocaleString()}
              </span>
              {photo.attempts > 0 && (
                <span className="photo-attempts">
                  ⚠️ {photo.attempts} failed attempt(s)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="status-actions">
        {isOnline && !isSyncing && (
          <button
            onClick={syncOfflinePhotos}
            className="btn-sync"
          >
            🔄 Sync Now
          </button>
        )}
        <button
          onClick={clearAllOfflinePhotos}
          className="btn-clear"
          disabled={isSyncing}
        >
          🗑️ Clear All
        </button>
      </div>

      <style>{`
        .offline-photo-status {
          background: #fff3cd;
          border: 2px solid #ffc107;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }

        .status-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 15px;
        }

        .status-icon {
          font-size: 32px;
        }

        .status-info h4 {
          margin: 0 0 4px 0;
          font-size: 16px;
          color: #333;
        }

        .status-info p {
          margin: 0;
          font-size: 14px;
          color: #666;
        }

        .storage-info {
          margin-bottom: 15px;
        }

        .storage-bar {
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 5px;
        }

        .storage-fill {
          height: 100%;
          background: linear-gradient(90deg, #4CAF50 0%, #ff9800 70%, #f44336 100%);
          transition: width 0.3s;
        }

        .storage-text {
          font-size: 12px;
          color: #666;
          text-align: right;
        }

        .photo-list {
          max-height: 300px;
          overflow-y: auto;
          margin-bottom: 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
        }

        .offline-photo-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border-bottom: 1px solid #f0f0f0;
        }

        .offline-photo-item:last-child {
          border-bottom: none;
        }

        .photo-thumb {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 4px;
          border: 1px solid #ddd;
        }

        .photo-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .photo-name {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        .photo-meta {
          font-size: 12px;
          color: #666;
        }

        .photo-attempts {
          font-size: 12px;
          color: #f44336;
          font-weight: 500;
        }

        .status-actions {
          display: flex;
          gap: 10px;
        }

        .btn-sync,
        .btn-clear {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s;
        }

        .btn-sync {
          background: #4CAF50;
          color: white;
        }

        .btn-sync:hover {
          background: #388E3C;
        }

        .btn-clear {
          background: #757575;
          color: white;
        }

        .btn-clear:hover:not(:disabled) {
          background: #616161;
        }

        .btn-clear:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .offline-photo-status {
            padding: 12px;
          }

          .status-header {
            gap: 10px;
          }

          .status-icon {
            font-size: 24px;
          }

          .status-info h4 {
            font-size: 14px;
          }

          .status-info p {
            font-size: 12px;
          }

          .photo-list {
            max-height: 200px;
          }

          .photo-thumb {
            width: 50px;
            height: 50px;
          }
        }
      `}</style>
    </div>
  );
};

export default OfflinePhotoStatus;
