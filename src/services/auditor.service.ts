import api from './api';

// Auditor-specific interfaces
export interface AuditStats {
  total_assigned: number;
  completed: number;
  pending: number;
  discrepancies: number;
  missing: number;
  completion_rate: number;
}

export interface AuditItem {
  id: string;
  asset_id: string;
  asset_name: string;
  location: string;
  assigned_user: string;
  last_audit_date: string;
  status: 'pending' | 'verified' | 'discrepancy' | 'missing';
  condition: string;
  notes?: string;
}

export interface Asset {
  id: string;
  unique_asset_id: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  status: string;
  location: string;
  assigned_user: string;
  last_audit_date: string;
  condition: string;
}

export interface AuditProgressData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  }>;
}

export interface ConditionData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string[];
  }>;
}

export interface AuditActivity {
  id: string;
  type: 'audit_completed' | 'discrepancy_found' | 'asset_missing' | 'compliance_check';
  title: string;
  description: string;
  timestamp: string;
  asset_id?: string;
  location?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

class AuditorService {
  // Get audit statistics
  async getAuditStats(): Promise<AuditStats> {
    try {
      const response = await api.get('/dashboard/auditor/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching audit stats:', error);
      throw new Error('Failed to fetch audit statistics');
    }
  }

  // Get audit items (assets assigned for auditing)
  async getAuditItems(): Promise<AuditItem[]> {
    try {
      const response = await api.get('/dashboard/auditor/audit-items');
      return response.data;
    } catch (error) {
      console.error('Error fetching audit items:', error);
      throw new Error('Failed to fetch audit items');
    }
  }

  // Get audit progress chart data
  async getAuditProgressData(): Promise<AuditProgressData> {
    try {
      const response = await api.get('/dashboard/auditor/progress-chart');
      return response.data;
    } catch (error) {
      console.error('Error fetching audit progress data:', error);
      throw new Error('Failed to fetch audit progress data');
    }
  }

  // Get asset condition distribution data
  async getConditionData(): Promise<ConditionData> {
    try {
      const response = await api.get('/dashboard/auditor/condition-chart');
      return response.data;
    } catch (error) {
      console.error('Error fetching condition data:', error);
      throw new Error('Failed to fetch condition data');
    }
  }

  // Get recent audit activities
  async getRecentActivities(): Promise<AuditActivity[]> {
    try {
      const response = await api.get('/dashboard/auditor/recent-activities');
      return response.data;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw new Error('Failed to fetch recent activities');
    }
  }

  // Search asset by QR code
  async getAssetByQRCode(qrCode: string): Promise<Asset> {
    try {
      const response = await api.get(`/assets/scan/${qrCode}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching asset by QR code:', error);
      throw new Error('Asset not found or lookup failed');
    }
  }

  // Submit audit result
  async submitAudit(auditData: {
    asset_id: string;
    condition: string;
    status: 'verified' | 'discrepancy' | 'missing';
    notes?: string;
    location_verified: boolean;
    user_verified: boolean;
  }): Promise<void> {
    try {
      await api.post('/auditor/submit-audit', auditData);
    } catch (error) {
      console.error('Error submitting audit:', error);
      throw new Error('Failed to submit audit');
    }
  }

  // Update audit item
  async updateAuditItem(itemId: string, updateData: Partial<AuditItem>): Promise<AuditItem> {
    try {
      const response = await api.put(`/auditor/audit-items/${itemId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating audit item:', error);
      throw new Error('Failed to update audit item');
    }
  }

  // Get assets pending audit
  async getPendingAudits(): Promise<Asset[]> {
    try {
      const response = await api.get('/auditor/pending-audits');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending audits:', error);
      throw new Error('Failed to fetch pending audits');
    }
  }

  // Generate audit report
  async generateAuditReport(filters?: {
    startDate?: string;
    endDate?: string;
    location?: string;
    status?: string;
  }): Promise<{ reportId: string; downloadUrl: string }> {
    try {
      const response = await api.post('/auditor/generate-report', filters);
      return response.data;
    } catch (error) {
      console.error('Error generating audit report:', error);
      throw new Error('Failed to generate audit report');
    }
  }

  // Get compliance metrics
  async getComplianceMetrics(): Promise<{
    overallScore: number;
    categoryScores: Record<string, number>;
    trends: Array<{ date: string; score: number }>;
  }> {
    try {
      const response = await api.get('/dashboard/auditor/compliance-metrics');
      return response.data;
    } catch (error) {
      console.error('Error fetching compliance metrics:', error);
      throw new Error('Failed to fetch compliance metrics');
    }
  }

  // Search assets for audit
  async searchAssets(query: string, filters?: {
    location?: string;
    status?: string;
    condition?: string;
  }): Promise<Asset[]> {
    try {
      const params = new URLSearchParams({ q: query });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }
      const response = await api.get(`/auditor/search-assets?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error searching assets:', error);
      throw new Error('Failed to search assets');
    }
  }
}

const auditorService = new AuditorService();
export default auditorService;