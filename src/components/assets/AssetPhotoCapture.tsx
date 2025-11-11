import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

interface Photo {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface AssetPhotoCaptureProps {
  assetId: string;
  onUploadComplete?: (photos: any[]) => void;
  onClose?: () => void;
  maxPhotos?: number;
}

const AssetPhotoCapture: React.FC<AssetPhotoCaptureProps> = ({
  assetId,
  onUploadComplete,
  onClose,
  maxPhotos = 10
}) => {
  const [mode, setMode] = useState<'capture' | 'gallery'>('capture');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [uploadStats, setUploadStats] = useState({
    total: 0,
    uploaded: 0,
    failed: 0
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize camera
  useEffect(() => {
    if (mode === 'capture') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [mode, facingMode]);

  const startCamera = async () => {
    try {
      // Check if camera API is available (requires HTTPS on mobile)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Camera API not available:', {
          navigator: !!navigator,
          mediaDevices: !!navigator.mediaDevices,
          getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
          protocol: window.location.protocol,
          hostname: window.location.hostname
        });
        
        const protocol = window.location.protocol;
        const errorMsg = protocol === 'http:' && window.location.hostname !== 'localhost'
          ? 'Camera access requires HTTPS on mobile devices. Please use HTTPS or access via localhost for testing.'
          : 'Camera access is not supported on this device.';
        
        alert(errorMsg);
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      setStream(mediaStream);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const preview = URL.createObjectURL(blob);

        const newPhoto: Photo = {
          id: `photo_${Date.now()}`,
          file,
          preview,
          status: 'pending',
          progress: 0
        };

        setPhotos(prev => [...prev, newPhoto]);
      }
    }, 'image/jpeg', 0.9);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newPhotos: Photo[] = Array.from(files).slice(0, maxPhotos - photos.length).map(file => ({
      id: `file_${Date.now()}_${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      progress: 0
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const removePhoto = (photoId: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === photoId);
      if (photo) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter(p => p.id !== photoId);
    });
  };

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Calculate new dimensions (max 1920x1080)
          let width = img.width;
          let height = img.height;
          const maxWidth = 1920;
          const maxHeight = 1080;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            0.8
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const uploadPhoto = async (photo: Photo): Promise<void> => {
    try {
      // Update status to uploading
      setPhotos(prev => prev.map(p =>
        p.id === photo.id ? { ...p, status: 'uploading', progress: 0 } : p
      ));

      // Compress image before upload
      const compressedFile = await compressImage(photo.file);

      const formData = new FormData();
      formData.append('photo', compressedFile);
      formData.append('asset_id', assetId);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/photos/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;

            setPhotos(prev => prev.map(p =>
              p.id === photo.id ? { ...p, progress: percentCompleted } : p
            ));
          }
        }
      );

      // Update status to success
      setPhotos(prev => prev.map(p =>
        p.id === photo.id ? { ...p, status: 'success', progress: 100 } : p
      ));

      setUploadStats(prev => ({ ...prev, uploaded: prev.uploaded + 1 }));

      return response.data;
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Update status to error
      setPhotos(prev => prev.map(p =>
        p.id === photo.id
          ? { ...p, status: 'error', error: error.response?.data?.message || 'Upload failed' }
          : p
      ));

      setUploadStats(prev => ({ ...prev, failed: prev.failed + 1 }));
      throw error;
    }
  };

  const uploadAllPhotos = async () => {
    const pendingPhotos = photos.filter(p => p.status === 'pending');
    
    if (pendingPhotos.length === 0) {
      alert('No photos to upload');
      return;
    }

    setIsUploading(true);
    setUploadStats({
      total: pendingPhotos.length,
      uploaded: 0,
      failed: 0
    });

    try {
      // Upload photos sequentially to avoid overwhelming the server
      for (const photo of pendingPhotos) {
        try {
          await uploadPhoto(photo);
        } catch (error) {
          console.error(`Failed to upload photo ${photo.id}:`, error);
        }
      }

      // Check if all uploads were successful
      const successPhotos = photos.filter(p => p.status === 'success');
      
      if (onUploadComplete) {
        onUploadComplete(successPhotos);
      }

      if (uploadStats.failed === 0) {
        alert(`Successfully uploaded ${uploadStats.uploaded} photo(s)`);
        setPhotos([]);
      } else {
        alert(`Uploaded ${uploadStats.uploaded} photo(s), ${uploadStats.failed} failed`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const retryFailedUploads = async () => {
    const failedPhotos = photos.filter(p => p.status === 'error');
    
    setIsUploading(true);
    setUploadStats(prev => ({
      ...prev,
      total: prev.total + failedPhotos.length
    }));

    try {
      for (const photo of failedPhotos) {
        try {
          await uploadPhoto(photo);
        } catch (error) {
          console.error(`Retry failed for photo ${photo.id}:`, error);
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  const pendingCount = photos.filter(p => p.status === 'pending').length;
  const uploadingCount = photos.filter(p => p.status === 'uploading').length;
  const successCount = photos.filter(p => p.status === 'success').length;
  const errorCount = photos.filter(p => p.status === 'error').length;

  return (
    <div className="asset-photo-capture">
      <div className="photo-capture-header">
        <h2>📸 Asset Photo Capture</h2>
        <button onClick={onClose} className="btn-close">✕</button>
      </div>

      {/* Mode Toggle */}
      <div className="mode-toggle">
        <button
          className={`btn-mode ${mode === 'capture' ? 'active' : ''}`}
          onClick={() => setMode('capture')}
        >
          📷 Camera
        </button>
        <button
          className={`btn-mode ${mode === 'gallery' ? 'active' : ''}`}
          onClick={() => setMode('gallery')}
        >
          🖼️ Gallery
        </button>
      </div>

      {/* Camera Mode */}
      {mode === 'capture' && (
        <div className="camera-container">
          <div className="video-wrapper">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="video-preview"
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          <div className="camera-controls">
            <button
              onClick={switchCamera}
              className="btn-camera-control"
              disabled={isUploading}
            >
              🔄 Switch Camera
            </button>
            <button
              onClick={capturePhoto}
              className="btn-capture"
              disabled={isUploading || photos.length >= maxPhotos}
            >
              📸 Capture ({photos.length}/{maxPhotos})
            </button>
          </div>
        </div>
      )}

      {/* Gallery Mode */}
      {mode === 'gallery' && (
        <div className="gallery-container">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-select-files"
            disabled={isUploading || photos.length >= maxPhotos}
          >
            📁 Select Photos ({photos.length}/{maxPhotos})
          </button>
        </div>
      )}

      {/* Photo Queue */}
      {photos.length > 0 && (
        <div className="photo-queue">
          <div className="queue-header">
            <h3>Photo Queue</h3>
            <div className="queue-stats">
              {pendingCount > 0 && <span className="stat-pending">⏳ {pendingCount} pending</span>}
              {uploadingCount > 0 && <span className="stat-uploading">📤 {uploadingCount} uploading</span>}
              {successCount > 0 && <span className="stat-success">✅ {successCount} uploaded</span>}
              {errorCount > 0 && <span className="stat-error">❌ {errorCount} failed</span>}
            </div>
          </div>

          <div className="photo-grid">
            {photos.map(photo => (
              <div key={photo.id} className={`photo-item photo-${photo.status}`}>
                <img src={photo.preview} alt="Preview" className="photo-preview" />
                
                <div className="photo-overlay">
                  {photo.status === 'pending' && (
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="btn-remove"
                      disabled={isUploading}
                    >
                      🗑️
                    </button>
                  )}
                  
                  {photo.status === 'uploading' && (
                    <div className="upload-progress">
                      <div
                        className="progress-bar"
                        style={{ width: `${photo.progress}%` }}
                      />
                      <span className="progress-text">{photo.progress}%</span>
                    </div>
                  )}
                  
                  {photo.status === 'success' && (
                    <div className="status-badge success">✅ Uploaded</div>
                  )}
                  
                  {photo.status === 'error' && (
                    <div className="status-badge error">
                      ❌ Failed
                      {photo.error && <span className="error-text">{photo.error}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Upload Controls */}
          <div className="upload-controls">
            <button
              onClick={uploadAllPhotos}
              className="btn-upload-all"
              disabled={isUploading || pendingCount === 0}
            >
              {isUploading ? '⏳ Uploading...' : `📤 Upload ${pendingCount} Photo(s)`}
            </button>

            {errorCount > 0 && (
              <button
                onClick={retryFailedUploads}
                className="btn-retry"
                disabled={isUploading}
              >
                🔄 Retry Failed ({errorCount})
              </button>
            )}

            <button
              onClick={() => {
                photos.forEach(photo => URL.revokeObjectURL(photo.preview));
                setPhotos([]);
              }}
              className="btn-clear"
              disabled={isUploading}
            >
              🗑️ Clear All
            </button>
          </div>
        </div>
      )}

      {/* Upload Progress Summary */}
      {isUploading && uploadStats.total > 0 && (
        <div className="upload-summary">
          <div className="summary-bar">
            <div
              className="summary-progress"
              style={{
                width: `${((uploadStats.uploaded + uploadStats.failed) / uploadStats.total) * 100}%`
              }}
            />
          </div>
          <div className="summary-text">
            Uploading: {uploadStats.uploaded + uploadStats.failed} / {uploadStats.total}
          </div>
        </div>
      )}

      <style>{`
        .asset-photo-capture {
          background: white;
          border-radius: 8px;
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .photo-capture-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .photo-capture-header h2 {
          margin: 0;
          font-size: 24px;
        }

        .btn-close {
          background: #f44336;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 18px;
        }

        .mode-toggle {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .btn-mode {
          flex: 1;
          padding: 12px;
          border: 2px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.3s;
        }

        .btn-mode.active {
          background: #2196F3;
          color: white;
          border-color: #2196F3;
        }

        .camera-container {
          margin-bottom: 20px;
        }

        .video-wrapper {
          position: relative;
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          border-radius: 8px;
          overflow: hidden;
          background: #000;
        }

        .video-preview {
          width: 100%;
          height: auto;
          display: block;
        }

        .camera-controls {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-top: 15px;
        }

        .btn-camera-control,
        .btn-capture {
          padding: 12px 24px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.3s;
        }

        .btn-camera-control {
          background: #757575;
          color: white;
        }

        .btn-capture {
          background: #4CAF50;
          color: white;
          font-weight: bold;
        }

        .btn-capture:disabled,
        .btn-camera-control:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .gallery-container {
          text-align: center;
          padding: 40px;
        }

        .btn-select-files {
          padding: 16px 32px;
          background: #2196F3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }

        .btn-select-files:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .photo-queue {
          margin-top: 30px;
          border-top: 2px solid #eee;
          padding-top: 20px;
        }

        .queue-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .queue-header h3 {
          margin: 0;
        }

        .queue-stats {
          display: flex;
          gap: 15px;
          font-size: 14px;
        }

        .stat-pending { color: #ff9800; }
        .stat-uploading { color: #2196F3; }
        .stat-success { color: #4CAF50; }
        .stat-error { color: #f44336; }

        .photo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .photo-item {
          position: relative;
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          border: 2px solid #ddd;
        }

        .photo-item.photo-uploading {
          border-color: #2196F3;
        }

        .photo-item.photo-success {
          border-color: #4CAF50;
        }

        .photo-item.photo-error {
          border-color: #f44336;
        }

        .photo-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .photo-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.3);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .photo-item:hover .photo-overlay {
          opacity: 1;
        }

        .btn-remove {
          background: #f44336;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 18px;
        }

        .upload-progress {
          width: 80%;
          background: rgba(255,255,255,0.9);
          border-radius: 4px;
          padding: 8px;
        }

        .progress-bar {
          height: 8px;
          background: #4CAF50;
          border-radius: 4px;
          transition: width 0.3s;
        }

        .progress-text {
          display: block;
          text-align: center;
          margin-top: 4px;
          font-size: 12px;
          font-weight: bold;
        }

        .status-badge {
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: bold;
        }

        .status-badge.success {
          background: #4CAF50;
          color: white;
        }

        .status-badge.error {
          background: #f44336;
          color: white;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .error-text {
          font-size: 11px;
          font-weight: normal;
        }

        .upload-controls {
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        .btn-upload-all,
        .btn-retry,
        .btn-clear {
          padding: 12px 24px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.3s;
        }

        .btn-upload-all {
          background: #4CAF50;
          color: white;
        }

        .btn-retry {
          background: #ff9800;
          color: white;
        }

        .btn-clear {
          background: #757575;
          color: white;
        }

        .btn-upload-all:disabled,
        .btn-retry:disabled,
        .btn-clear:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .upload-summary {
          margin-top: 20px;
          padding: 15px;
          background: #e3f2fd;
          border-radius: 4px;
        }

        .summary-bar {
          height: 8px;
          background: #ddd;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .summary-progress {
          height: 100%;
          background: #2196F3;
          transition: width 0.3s;
        }

        .summary-text {
          text-align: center;
          font-weight: bold;
          color: #1976D2;
        }

        @media (max-width: 768px) {
          .photo-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          }

          .upload-controls {
            flex-direction: column;
          }

          .btn-upload-all,
          .btn-retry,
          .btn-clear {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default AssetPhotoCapture;
