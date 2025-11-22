import api from './api';
import { ApiResponse } from '../types';

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  data_type: 'assets' | 'users' | 'transactions' | 'vendors' | 'maintenance' | 'reports';
  filters?: any;
  columns?: string[];
  date_range?: {
    start_date: string;
    end_date: string;
  };
}

export interface ImportResult {
  success: boolean;
  total_records: number;
  imported_records: number;
  failed_records: number;
  errors: string[];
  warnings: string[];
}

export interface ExportResult {
  success: boolean;
  file_url: string;
  file_name: string;
  file_size: number;
  generated_at: string;
}

class ExportImportService {
  // Export data
  async exportData(options: ExportOptions): Promise<ExportResult> {
    try {
      const response = await api.post<ApiResponse<ExportResult>>('/export', options);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to export data');
    } catch (error: unknown) {
      throw new Error((error as any).response?.data?.message || (error as any).message || 'Failed to export data');
    }
  }

  // Import data
  async importData(file: File, dataType: string, options?: Record<string, unknown>): Promise<ImportResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('data_type', dataType);
      if (options) {
        formData.append('options', JSON.stringify(options));
      }

      const response = await api.post<ApiResponse<ImportResult>>('/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to import data');
    } catch (error: unknown) {
      throw new Error((error as any).response?.data?.message || (error as any).message || 'Failed to import data');
    }
  }

  // Get import template
  async getImportTemplate(dataType: string): Promise<Blob> {
    try {
      const response = await api.get(`/import/template/${dataType}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error: unknown) {
      throw new Error((error as any).response?.data?.message || (error as any).message || 'Failed to download import template');
    }
  }

  // Validate import file
  async validateImportFile(file: File, dataType: string): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    preview_data: any[];
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('data_type', dataType);

      const response = await api.post<ApiResponse<any>>('/import/validate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to validate import file');
    } catch (error: unknown) {
      throw new Error((error as any).response?.data?.message || (error as any).message || 'Failed to validate import file');
    }
  }

  // Get export history
  async getExportHistory(): Promise<ExportResult[]> {
    try {
      const response = await api.get<ApiResponse<ExportResult[]>>('/export/history');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch export history');
    } catch (error: unknown) {
      throw new Error((error as any).response?.data?.message || (error as any).message || 'Failed to fetch export history');
    }
  }

  // Download exported file
  async downloadExportedFile(fileId: string): Promise<Blob> {
    try {
      const response = await api.get(`/export/download/${fileId}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error: unknown) {
      throw new Error((error as any).response?.data?.message || (error as any).message || 'Failed to download exported file');
    }
  }
}

export const exportImportService = new ExportImportService();
export default exportImportService;