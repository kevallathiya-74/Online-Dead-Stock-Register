/**
 * Asset Update Service
 * Manages real-time asset updates and notifications across components
 */

type AssetUpdateListener = (assetId: string, updateData?: Record<string, unknown>) => void;

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
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(assetId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(assetId);
        }
      }
    };
  }

  /**
   * Subscribe to all asset updates
   */
  subscribeGlobal(callback: AssetUpdateListener): () => void {
    this.globalListeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.globalListeners.delete(callback);
    };
  }

  /**
   * Notify that an asset has been updated
   */
  notifyUpdate(assetId: string, updateData?: Record<string, unknown>): void {
    
    // Notify specific asset listeners
    const assetListeners = this.listeners.get(assetId);
    if (assetListeners) {
      assetListeners.forEach(callback => {
        try {
          callback(assetId, updateData);
        } catch (error) {
        }
      });
    }
    
    // Notify global listeners
    this.globalListeners.forEach(callback => {
      try {
        callback(assetId, updateData);
      } catch (error) {
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
  notifyAuditComplete(assetId: string, auditData: Record<string, unknown>): void {
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
