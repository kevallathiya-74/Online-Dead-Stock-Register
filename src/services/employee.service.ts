import api from './api';

// Employee-specific interfaces
export interface EmployeeAsset {
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
  category?: string;
  assigned_date?: string;
  warranty_expiry?: string;
}

export interface MaintenanceRequest {
  id: string;
  asset_id: string;
  asset_name: string;
  issue_description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed';
  created_date: string;
}

export interface EmployeeStats {
  total_assets: number;
  active_assets: number;
  pending_maintenance: number;
  warranties_expiring: number;
}

export interface AssetActivity {
  id: string;
  type: 'assignment' | 'maintenance' | 'audit' | 'transfer' | 'checkin';
  title: string;
  description: string;
  timestamp: string;  
  asset_id: string;
  status: 'completed' | 'pending' | 'in_progress';
}

export interface AssetRequest {
  id?: string;
  asset_type: string;
  category: string;
  description: string;
  business_justification: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status?: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  requested_date?: string;
  expected_delivery?: string;
}

class EmployeeService {
  // Get employee's assigned assets
  async getMyAssets(): Promise<EmployeeAsset[]> {
    try {
      const response = await api.get('/employee/my-assets');
      return response.data;
    } catch (error) {
      console.error('Error fetching my assets:', error);
      throw new Error('Failed to fetch assigned assets');
    }
  }

  // Get employee dashboard statistics
  async getEmployeeStats(): Promise<EmployeeStats> {
    try {
      const response = await api.get('/employee/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching employee stats:', error);
      throw new Error('Failed to fetch employee statistics');
    }
  }

  // Get employee's maintenance requests
  async getMaintenanceRequests(): Promise<MaintenanceRequest[]> {
    try {
      const response = await api.get('/employee/maintenance-requests');
      return response.data;
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
      throw new Error('Failed to fetch maintenance requests');
    }
  }

  // Submit maintenance request
  async submitMaintenanceRequest(requestData: {
    asset_id: string;
    issue_description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<MaintenanceRequest> {
    try {
      const response = await api.post('/employee/maintenance-requests', requestData);
      return response.data;
    } catch (error) {
      console.error('Error submitting maintenance request:', error);
      throw new Error('Failed to submit maintenance request');
    }
  }

  // Get asset by QR code (for employee verification)
  async getAssetByQRCode(qrCode: string): Promise<EmployeeAsset> {
    try {
      const response = await api.get(`/assets/scan/${qrCode}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching asset by QR code:', error);
      throw new Error('Asset not found or lookup failed');
    }
  }

  // Check-in asset (return to inventory)
  async checkInAsset(assetId: string, notes?: string): Promise<void> {
    try {
      await api.post(`/employee/checkin-asset/${assetId}`, { notes });
    } catch (error) {
      console.error('Error checking in asset:', error);
      throw new Error('Failed to check-in asset');
    }
  }

  // Submit new asset request
  async submitAssetRequest(requestData: AssetRequest): Promise<AssetRequest> {
    try {
      const response = await api.post('/employee/asset-requests', requestData);
      return response.data;
    } catch (error) {
      console.error('Error submitting asset request:', error);
      throw new Error('Failed to submit asset request');
    }
  }

  // Get employee's asset requests
  async getAssetRequests(): Promise<AssetRequest[]> {
    try {
      const response = await api.get('/employee/asset-requests');
      return response.data;
    } catch (error) {
      console.error('Error fetching asset requests:', error);
      throw new Error('Failed to fetch asset requests');
    }
  }

  // Get employee's activity history
  async getActivityHistory(): Promise<AssetActivity[]> {
    try {
      const response = await api.get('/employee/activity-history');
      return response.data;
    } catch (error) {
      console.error('Error fetching activity history:', error);
      throw new Error('Failed to fetch activity history');
    }
  }

  // Verify asset assignment (for QR scanning)
  async verifyAssetAssignment(assetId: string): Promise<{
    isAssigned: boolean;
    asset?: EmployeeAsset;
  }> {
    try {
      const response = await api.get(`/employee/verify-asset/${assetId}`);
      return response.data;
    } catch (error) {
      console.error('Error verifying asset assignment:', error);
      throw new Error('Failed to verify asset assignment');
    }
  }

  // Submit feedback
  async submitFeedback(feedbackData: {
    category: string;
    subject: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
  }): Promise<void> {
    try {
      await api.post('/employee/feedback', feedbackData);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw new Error('Failed to submit feedback');
    }
  }

  // Get warranties expiring soon
  async getExpiringWarranties(): Promise<EmployeeAsset[]> {
    try {
      const response = await api.get('/employee/expiring-warranties');
      return response.data;
    } catch (error) {
      console.error('Error fetching expiring warranties:', error);
      throw new Error('Failed to fetch expiring warranties');
    }
  }

  // Update maintenance request status (for tracking)
  async updateMaintenanceRequest(requestId: string, status: string): Promise<MaintenanceRequest> {
    try {
      const response = await api.put(`/employee/maintenance-requests/${requestId}`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating maintenance request:', error);
      throw new Error('Failed to update maintenance request');
    }
  }

  // Get detailed asset information
  async getAssetDetails(assetId: string): Promise<EmployeeAsset> {
    try {
      const response = await api.get(`/employee/assets/${assetId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching asset details:', error);
      throw new Error('Failed to fetch asset details');
    }
  }
}

const employeeService = new EmployeeService();
export default employeeService;