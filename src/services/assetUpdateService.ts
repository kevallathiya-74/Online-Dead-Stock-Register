/**
 * Asset Update Service
 * Manages real-time asset updates and notifications across components
 */

type AssetUpdateListener = (assetId: string, updateData?: any) => void;

class AssetUpdateService {
  private listeners: Map<string, Set<AssetUpdateListener>> = new Map();
  private globalListeners: Set<AssetUpdateListener> = new Set();

  /**
   * Subscribe to updates for a specific asset
   */
  subscribe(assetId: string, callback: AssetUpdateListener): () => void {
    if (!this.listeners.has(assetId)) {
      this.listeners.set(assetId, new Set());
    }
    
    this.listeners.get(assetId)!.add(callback);
    
    console.log(`🔔 Subscribed to asset updates: ${assetId}`);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(assetId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(assetId);
        }
      }
      console.log(`🔕 Unsubscribed from asset updates: ${assetId}`);
    };
  }

  /**
   * Subscribe to all asset updates
   */
  subscribeGlobal(callback: AssetUpdateListener): () => void {
    this.globalListeners.add(callback);
    console.log('🔔 Subscribed to all asset updates');
    
    // Return unsubscribe function
    return () => {
      this.globalListeners.delete(callback);
      console.log('🔕 Unsubscribed from all asset updates');
    };
  }

  /**
   * Notify that an asset has been updated
   */
  notifyUpdate(assetId: string, updateData?: any): void {
    console.log(`📢 Asset update notification: ${assetId}`, updateData);
    
    // Notify specific asset listeners
    const assetListeners = this.listeners.get(assetId);
    if (assetListeners) {
      assetListeners.forEach(callback => {
        try {
          callback(assetId, updateData);
        } catch (error) {
          console.error('Error in asset update listener:', error);
        }
      });
    }
    
    // Notify global listeners
    this.globalListeners.forEach(callback => {
      try {
        callback(assetId, updateData);
      } catch (error) {
        console.error('Error in global update listener:', error);
      }
    });

    // Also use localStorage for cross-tab communication
    localStorage.setItem(`asset_updated_${assetId}`, JSON.stringify({
      timestamp: Date.now(),
      data: updateData
    }));
  }

  /**
   * Notify after audit completion
   */
  notifyAuditComplete(assetId: string, auditData: any): void {
    console.log(`✅ Audit completed for asset: ${assetId}`, auditData);
    this.notifyUpdate(assetId, {
      type: 'audit_completed',
      audit: auditData,
      timestamp: Date.now()
    });
  }

  /**
   * Notify after asset status change
   */
  notifyStatusChange(assetId: string, oldStatus: string, newStatus: string): void {
    console.log(`🔄 Asset status changed: ${assetId} (${oldStatus} → ${newStatus})`);
    this.notifyUpdate(assetId, {
      type: 'status_changed',
      oldStatus,
      newStatus,
      timestamp: Date.now()
    });
  }

  /**
   * Get all active subscriptions (for debugging)
   */
  getActiveSubscriptions(): { assetId: string; count: number }[] {
    return Array.from(this.listeners.entries()).map(([assetId, listeners]) => ({
      assetId,
      count: listeners.size
    }));
  }
}

// Singleton instance
export const assetUpdateService = new AssetUpdateService();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).assetUpdateService = assetUpdateService;
}

export default assetUpdateService;
