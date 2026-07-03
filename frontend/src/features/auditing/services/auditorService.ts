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

import api from '../../../services/api';
import type {
    AuditActivity,
    AuditItem,
    AuditorStats,
    ChartData,
    ComplianceMetrics
} from '../../../types';



// Auditor Dashboard Statistics
export const getAuditorStats = async (): Promise<AuditorStats> => {
  const response = await api.get('/dashboard/auditor/stats');
  return response.data;
};

// Get list of assets for auditing
export const getAuditItems = async (): Promise<AuditItem[]> => {
  const response = await api.get('/dashboard/auditor/audit-items');
  return response.data;
};

// Get audit progress chart data
export const getAuditProgressChart = async (): Promise<ChartData> => {
  const response = await api.get('/dashboard/auditor/progress-chart');
  return response.data;
};

// Get condition distribution chart data
export const getConditionChart = async (): Promise<ChartData> => {
  const response = await api.get('/dashboard/auditor/condition-chart');
  return response.data;
};

// Get recent audit activities
export const getAuditorActivities = async (): Promise<AuditActivity[]> => {
  const response = await api.get('/dashboard/auditor/recent-activities');
  return response.data;
};

// Get compliance metrics
export const getComplianceMetrics = async (): Promise<ComplianceMetrics> => {
  const response = await api.get('/dashboard/auditor/compliance-metrics');
  return response.data;
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
): Promise<unknown> => {
  const response = await api.put(
    `/assets/${assetId}`,
    {
      ...auditData,
      last_audit_date: auditData.last_audit_date || new Date().toISOString(),
    }
  );
  return response.data;
};

// Export audit report
export const exportAuditReport = async (format: 'json' | 'csv' = 'json'): Promise<unknown> => {
  if (format === 'csv') {
    const response = await api.post(
      '/export-import/export',
      {
        includeAssets: true,
        format: 'csv',
      },
      {
        responseType: 'blob',
      }
    );
    return response.data;
  } else {
    const response = await api.post(
      '/export-import/export',
      {
        includeAssets: true,
        format: 'json',
      }
    );
    return response.data;
  }
};

// Import audit data from CSV or JSON file
export const importAuditData = async (formData: FormData): Promise<unknown> => {
  const response = await api.post(
    '/export-import/import',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
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
