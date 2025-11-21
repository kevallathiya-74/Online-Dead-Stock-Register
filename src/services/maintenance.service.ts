import api from './api';

export interface MaintenanceRecord {
  _id?: string;
  id?: string;
  asset_id: string;
  asset_name?: string;
  type?: string;
  maintenance_type?: string;
  description: string;
  scheduled_date?: string;
  maintenance_date?: string;
  completed_date?: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assigned_technician?: string;
  performed_by?: string;
  estimated_cost?: number;
  cost?: number;
  actual_cost?: number;
  estimated_duration: number;
  actual_duration?: number;
  next_maintenance_date?: string;
  notes?: string;
  downtime_impact: 'Low' | 'Medium' | 'High';
}

export interface CreateMaintenanceData {
  asset_id: string;
  maintenance_type: string;
  priority?: string;
  maintenance_date: string;
  estimated_duration?: number;
  performed_by?: string;
  description?: string;
  cost?: number;
  downtime_impact?: string;
  status?: string;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  specialization: string[];
  current_workload: number;
  rating: number;
  total_completed: number;
}

class MaintenanceService {
  /**
   * Get all maintenance records
   */
  async getMaintenanceRecords(): Promise<{ success: boolean; data: MaintenanceRecord[] }> {
    const response = await api.get('/maintenance');
    return response.data;
  }

  /**
   * Get maintenance record by ID
   */
  async getMaintenanceById(id: string): Promise<{ success: boolean; data: MaintenanceRecord }> {
    const response = await api.get(`/maintenance/${id}`);
    return response.data;
  }

  /**
   * Create new maintenance record
   */
  async createMaintenance(data: CreateMaintenanceData): Promise<{ success: boolean; message: string; data: MaintenanceRecord }> {
    const response = await api.post('/maintenance', data);
    return response.data;
  }

  /**
   * Update maintenance record
   */
  async updateMaintenance(id: string, data: Partial<MaintenanceRecord>): Promise<{ success: boolean; message: string; data: MaintenanceRecord }> {
    const response = await api.put(`/maintenance/${id}`, data);
    return response.data;
  }

  /**
   * Delete maintenance record
   */
  async deleteMaintenance(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/maintenance/${id}`);
    return response.data;
  }

  /**
   * Get all technicians
   */
  async getTechnicians(): Promise<{ success: boolean; data: Technician[] }> {
    const response = await api.get('/maintenance/technicians');
    return response.data;
  }

  /**
   * Update maintenance status
   */
  async updateStatus(id: string, status: string): Promise<{ success: boolean; message: string; data: MaintenanceRecord }> {
    const response = await api.put(`/maintenance/${id}`, { status });
    return response.data;
  }

  /**
   * Get maintenance statistics
   */
  async getStats(): Promise<{
    totalRecords: number;
    scheduled: number;
    inProgress: number;
    overdue: number;
    completed: number;
    totalCost: number;
  }> {
    const response = await api.get('/maintenance/stats');
    return response.data.data;
  }
}

export const maintenanceService = new MaintenanceService();
export default maintenanceService;
