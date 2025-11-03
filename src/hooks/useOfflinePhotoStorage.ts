import { useState, useEffect } from 'react';

interface OfflinePhoto {
  id: string;
  assetId: string;
  dataUrl: string;
  fileName: string;
  timestamp: number;
  fileSize: number;
  attempts: number;
}

const STORAGE_KEY = 'offline_photos';
const MAX_STORAGE_SIZE = 50 * 1024 * 1024; // 50MB limit
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Custom hook for managing offline photo storage
 * Stores photos locally when offline and syncs when back online
 */
export const useOfflinePhotoStorage = () => {
  const [offlinePhotos, setOfflinePhotos] = useState<OfflinePhoto[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load offline photos from localStorage on mount
  useEffect(() => {
    loadOfflinePhotos();
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('📡 Back online - syncing offline photos...');
      syncOfflinePhotos();
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('📡 Offline mode - photos will be queued for upload');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlinePhotos]);

  const loadOfflinePhotos = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const photos = JSON.parse(stored);
        setOfflinePhotos(photos);
      }
    } catch (error) {
      console.error('Error loading offline photos:', error);
    }
  };

  const saveOfflinePhotos = (photos: OfflinePhoto[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
      setOfflinePhotos(photos);
    } catch (error) {
      console.error('Error saving offline photos:', error);
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        alert('Storage quota exceeded. Please clear some offline photos.');
      }
    }
  };

  const getCurrentStorageSize = (): number => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Blob([stored]).size : 0;
    } catch (error) {
      return 0;
    }
  };

  const addOfflinePhoto = async (
    assetId: string,
    file: File
  ): Promise<boolean> => {
    try {
      // Check storage size
      const currentSize = getCurrentStorageSize();
      const estimatedSize = file.size * 1.37; // Base64 encoding increases size by ~37%
      
      if (currentSize + estimatedSize > MAX_STORAGE_SIZE) {
        alert('Offline storage is full. Please go online to sync photos.');
        return false;
      }

      // Convert file to data URL
      const dataUrl = await fileToDataUrl(file);

      const offlinePhoto: OfflinePhoto = {
        id: `offline_${Date.now()}_${Math.random()}`,
        assetId,
        dataUrl,
        fileName: file.name,
        timestamp: Date.now(),
        fileSize: file.size,
        attempts: 0
      };

      const updatedPhotos = [...offlinePhotos, offlinePhoto];
      saveOfflinePhotos(updatedPhotos);

      console.log(`📷 Photo stored offline: ${file.name}`);
      return true;
    } catch (error) {
      console.error('Error adding offline photo:', error);
      return false;
    }
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const dataUrlToFile = (dataUrl: string, fileName: string): File => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], fileName, { type: mime });
  };

  const syncOfflinePhotos = async () => {
    if (!isOnline || offlinePhotos.length === 0 || isSyncing) {
      return;
    }

    setIsSyncing(true);
    console.log(`🔄 Syncing ${offlinePhotos.length} offline photo(s)...`);

    const apiUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    const token = localStorage.getItem('token');
    
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const photo of offlinePhotos) {
      try {
        // Convert data URL back to File
        const file = dataUrlToFile(photo.dataUrl, photo.fileName);

        // Upload to server
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('asset_id', photo.assetId);

        const response = await fetch(`${apiUrl}/api/photos/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (response.ok) {
          console.log(`✅ Synced: ${photo.fileName}`);
          results.success++;
          
          // Remove from offline storage
          const updatedPhotos = offlinePhotos.filter(p => p.id !== photo.id);
          saveOfflinePhotos(updatedPhotos);
        } else {
          throw new Error(`Server returned ${response.status}`);
        }
      } catch (error) {
        console.error(`❌ Failed to sync ${photo.fileName}:`, error);
        results.failed++;
        results.errors.push(photo.fileName);

        // Increment retry attempts
        photo.attempts++;
        
        // Remove if max attempts reached
        if (photo.attempts >= MAX_RETRY_ATTEMPTS) {
          console.log(`⚠️ Removing ${photo.fileName} after ${MAX_RETRY_ATTEMPTS} failed attempts`);
          const updatedPhotos = offlinePhotos.filter(p => p.id !== photo.id);
          saveOfflinePhotos(updatedPhotos);
        }
      }
    }

    setIsSyncing(false);

    // Show sync results
    if (results.success > 0) {
      console.log(`✅ Successfully synced ${results.success} photo(s)`);
    }
    if (results.failed > 0) {
      console.log(`❌ Failed to sync ${results.failed} photo(s)`);
    }

    return results;
  };

  const removeOfflinePhoto = (photoId: string) => {
    const updatedPhotos = offlinePhotos.filter(p => p.id !== photoId);
    saveOfflinePhotos(updatedPhotos);
  };

  const clearAllOfflinePhotos = () => {
    if (confirm('Are you sure you want to clear all offline photos? This cannot be undone.')) {
      saveOfflinePhotos([]);
      console.log('🗑️ Cleared all offline photos');
    }
  };

  const getStorageInfo = () => {
    const currentSize = getCurrentStorageSize();
    const photoCount = offlinePhotos.length;
    const percentUsed = (currentSize / MAX_STORAGE_SIZE) * 100;

    return {
      currentSize,
      maxSize: MAX_STORAGE_SIZE,
      percentUsed,
      photoCount,
      availableSpace: MAX_STORAGE_SIZE - currentSize
    };
  };

  return {
    offlinePhotos,
    isOnline,
    isSyncing,
    addOfflinePhoto,
    syncOfflinePhotos,
    removeOfflinePhoto,
    clearAllOfflinePhotos,
    getStorageInfo
  };
};

export default useOfflinePhotoStorage;
