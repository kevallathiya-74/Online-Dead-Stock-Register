import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface AssetPhoto {
  _id: string;
  url: string;
  thumbnail_url?: string;
  uploaded_at: string;
  uploaded_by: {
    _id: string;
    name: string;
  };
  metadata?: {
    exif?: any;
    original_size?: number;
    compressed_size?: number;
  };
}

interface AssetPhotoGalleryProps {
  assetId: string;
  onPhotoDeleted?: () => void;
}

const AssetPhotoGallery: React.FC<AssetPhotoGalleryProps> = ({
  assetId,
  onPhotoDeleted
}) => {
  const [photos, setPhotos] = useState<AssetPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<AssetPhoto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, [assetId]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/photos/asset/${assetId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setPhotos(response.data.photos || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const deletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      setIsDeleting(true);
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/photos/${photoId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Remove from local state
      setPhotos(prev => prev.filter(p => p._id !== photoId));
      setSelectedPhoto(null);

      if (onPhotoDeleted) {
        onPhotoDeleted();
      }

      alert('Photo deleted successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete photo');
    } finally {
      setIsDeleting(false);
    }
  };

  const downloadPhoto = (photo: AssetPhoto) => {
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = `asset_${assetId}_${photo._id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="photo-gallery-loading">
        <div className="spinner">⏳</div>
        <p>Loading photos...</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="photo-gallery-empty">
        <div className="empty-icon">📷</div>
        <h3>No Photos Yet</h3>
        <p>Upload photos to document this asset's condition and appearance.</p>
      </div>
    );
  }

  return (
    <div className="asset-photo-gallery">
      <div className="gallery-header">
        <h3>📸 Asset Photos ({photos.length})</h3>
        <button onClick={fetchPhotos} className="btn-refresh">
          🔄 Refresh
        </button>
      </div>

      <div className="photo-grid">
        {photos.map(photo => (
          <div
            key={photo._id}
            className="photo-card"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img
              src={photo.thumbnail_url || photo.url}
              alt="Asset photo"
              className="photo-thumbnail"
              loading="lazy"
            />
            <div className="photo-info">
              <span className="photo-date">{formatDate(photo.uploaded_at)}</span>
              <span className="photo-uploader">{photo.uploaded_by.name}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div className="photo-modal" onClick={() => setSelectedPhoto(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Photo Details</h3>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="btn-close-modal"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <img
                src={selectedPhoto.url}
                alt="Asset photo full size"
                className="photo-full"
              />

              <div className="photo-metadata">
                <div className="metadata-section">
                  <h4>Upload Information</h4>
                  <div className="metadata-item">
                    <span className="label">Uploaded By:</span>
                    <span className="value">{selectedPhoto.uploaded_by.name}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">Upload Date:</span>
                    <span className="value">{formatDate(selectedPhoto.uploaded_at)}</span>
                  </div>
                </div>

                {selectedPhoto.metadata && (
                  <div className="metadata-section">
                    <h4>File Information</h4>
                    {selectedPhoto.metadata.original_size && (
                      <div className="metadata-item">
                        <span className="label">Original Size:</span>
                        <span className="value">
                          {formatFileSize(selectedPhoto.metadata.original_size)}
                        </span>
                      </div>
                    )}
                    {selectedPhoto.metadata.compressed_size && (
                      <div className="metadata-item">
                        <span className="label">Compressed Size:</span>
                        <span className="value">
                          {formatFileSize(selectedPhoto.metadata.compressed_size)}
                        </span>
                      </div>
                    )}
                    {selectedPhoto.metadata.exif && (
                      <>
                        {selectedPhoto.metadata.exif.Make && (
                          <div className="metadata-item">
                            <span className="label">Camera:</span>
                            <span className="value">
                              {selectedPhoto.metadata.exif.Make} {selectedPhoto.metadata.exif.Model}
                            </span>
                          </div>
                        )}
                        {selectedPhoto.metadata.exif.DateTime && (
                          <div className="metadata-item">
                            <span className="label">Photo Taken:</span>
                            <span className="value">{selectedPhoto.metadata.exif.DateTime}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  onClick={() => downloadPhoto(selectedPhoto)}
                  className="btn-action btn-download"
                >
                  ⬇️ Download
                </button>
                <button
                  onClick={() => deletePhoto(selectedPhoto._id)}
                  className="btn-action btn-delete"
                  disabled={isDeleting}
                >
                  {isDeleting ? '⏳ Deleting...' : '🗑️ Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .photo-gallery-loading,
        .photo-gallery-empty {
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

        .empty-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .photo-gallery-empty h3 {
          margin: 10px 0;
          color: #333;
        }

        .asset-photo-gallery {
          background: white;
          border-radius: 8px;
          padding: 20px;
        }

        .gallery-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .gallery-header h3 {
          margin: 0;
          font-size: 20px;
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

        .photo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
        }

        .photo-card {
          border: 2px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s;
        }

        .photo-card:hover {
          border-color: #2196F3;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .photo-thumbnail {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
          display: block;
        }

        .photo-info {
          padding: 10px;
          background: #f5f5f5;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .photo-date {
          font-size: 12px;
          color: #666;
        }

        .photo-uploader {
          font-size: 12px;
          color: #333;
          font-weight: 500;
        }

        .photo-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          max-width: 900px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #ddd;
        }

        .modal-header h3 {
          margin: 0;
        }

        .btn-close-modal {
          background: #f44336;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 18px;
        }

        .modal-body {
          padding: 20px;
        }

        .photo-full {
          width: 100%;
          height: auto;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .photo-metadata {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .metadata-section {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
        }

        .metadata-section h4 {
          margin: 0 0 15px 0;
          font-size: 16px;
          color: #333;
        }

        .metadata-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #ddd;
        }

        .metadata-item:last-child {
          border-bottom: none;
        }

        .metadata-item .label {
          font-weight: 500;
          color: #666;
        }

        .metadata-item .value {
          color: #333;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        .btn-action {
          padding: 12px 24px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.3s;
        }

        .btn-download {
          background: #4CAF50;
          color: white;
        }

        .btn-download:hover {
          background: #388E3C;
        }

        .btn-delete {
          background: #f44336;
          color: white;
        }

        .btn-delete:hover:not(:disabled) {
          background: #d32f2f;
        }

        .btn-delete:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .photo-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          }

          .modal-content {
            max-width: 100%;
            max-height: 100vh;
            border-radius: 0;
          }

          .photo-metadata {
            grid-template-columns: 1fr;
          }

          .modal-actions {
            flex-direction: column;
          }

          .btn-action {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default AssetPhotoGallery;
