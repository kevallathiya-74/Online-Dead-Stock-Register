/**
 * AUDITOR SERVICE - Real API Integration
 * 
 * Connected Backend Endpoints:
 * - GET /api/v1/dashboard/auditor/stats - Fetch auditor statistics
 * - GET /api/v1/dashboard/auditor/audit-items - Get list of audit items
 * - GET /api/v1/dashboard/auditor/progress-chart - Audit progress chart data
 * - GET /api/v1/dashboard/auditor/condition-chart - Asset condition distribution
 * - GET /api/v1/dashboard/auditor/recent-activities - Recent audit activities
 * - GET /api/v1/dashboard/auditor/compliance-metrics - Compliance metrics
 * - PUT /api/v1/assets/:id - Update asset audit status
 * - POST /api/v1/export-import/export - Export audit report
 * - POST /api/v1/export-import/import - Import audit data
 * 
 * Data Flow: Frontend → Service → Backend Controller → MongoDB
 * Authentication: Bearer token in Authorization header
 * Role Access: ADMIN, AUDITOR roles only (enforced by backend RBAC)
 */

import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';
import type { 
  AuditorStats, 
  AuditItem, 
  AuditActivity, 
  ComplianceMetrics, 
  ChartData 
} from '../types';

const API_URL = `${API_BASE_URL}/dashboard`;

// Get authentication token from localStorage (key: 'token')
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  return token ? `Bearer ${token}` : '';
};

// Auditor Dashboard Statistics
export const getAuditorStats = async (): Promise<AuditorStats> => {
  try {
    const response = await axios.get(`${API_URL}/auditor/stats`, {
      headers: {
        Authorization: getAuthToken(),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching auditor stats:', error);
    throw error;
  }
};

// Get list of assets for auditing
export const getAuditItems = async (): Promise<AuditItem[]> => {
  try {
    const response = await axios.get(`${API_URL}/auditor/audit-items`, {
      headers: {
        Authorization: getAuthToken(),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching audit items:', error);
    throw error;
  }
};

// Get audit progress chart data
export const getAuditProgressChart = async (): Promise<ChartData> => {
  try {
    const response = await axios.get(`${API_URL}/auditor/progress-chart`, {
      headers: {
        Authorization: getAuthToken(),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching audit progress chart:', error);
    throw error;
  }
};

// Get condition distribution chart data
export const getConditionChart = async (): Promise<ChartData> => {
  try {
    const response = await axios.get(`${API_URL}/auditor/condition-chart`, {
      headers: {
        Authorization: getAuthToken(),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching condition chart:', error);
    throw error;
  }
};

// Get recent audit activities
export const getAuditorActivities = async (): Promise<AuditActivity[]> => {
  try {
    const response = await axios.get(`${API_URL}/auditor/recent-activities`, {
      headers: {
        Authorization: getAuthToken(),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching auditor activities:', error);
    throw error;
  }
};

// Get compliance metrics
export const getComplianceMetrics = async (): Promise<ComplianceMetrics> => {
  try {
    const response = await axios.get(`${API_URL}/auditor/compliance-metrics`, {
      headers: {
        Authorization: getAuthToken(),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching compliance metrics:', error);
    throw error;
  }
};

// Update asset audit status
export const updateAuditStatus = async (
  assetId: string,
  auditData: {
    condition?: string;
    status?: string;
    notes?: string;
    last_audit_date?: string;
  }
): Promise<any> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/assets/${assetId}`,
      {
        ...auditData,
        last_audit_date: auditData.last_audit_date || new Date().toISOString(),
      },
      {
        headers: {
          Authorization: getAuthToken(),
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating audit status:', error);
    throw error;
  }
};

// Export audit report
export const exportAuditReport = async (format: 'json' | 'csv' = 'json'): Promise<any> => {
  try {
    if (format === 'csv') {
      // For CSV, we need to handle the response as a blob
      const response = await axios.post(
        `${API_BASE_URL}/export-import/export?type=assets&format=csv`,
        {},
        {
          headers: {
            Authorization: getAuthToken(),
          },
          responseType: 'blob', // Important for file download
        }
      );
      return response.data;
    } else {
      // JSON format
      const response = await axios.post(
        `${API_BASE_URL}/export-import/export`,
        {
          type: 'assets',
          format: format,
        },
        {
          headers: {
            Authorization: getAuthToken(),
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    }
  } catch (error) {
    console.error('Error exporting audit report:', error);
    throw error;
  }
};

// Import audit data from CSV or JSON file
export const importAuditData = async (formData: FormData): Promise<any> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/export-import/import`,
      formData,
      {
        headers: {
          Authorization: getAuthToken(),
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error importing audit data:', error);
    throw error;
  }
};

const auditorService = {
  getAuditorStats,
  getAuditItems,
  getAuditProgressChart,
  getConditionChart,
  getAuditorActivities,
  getComplianceMetrics,
  updateAuditStatus,
  exportAuditReport,
  importAuditData,
};

export default auditorService;
