import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';

export interface UploadResponse {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  size: number;
  documentType: string;
  uploadedAt: string;
}

class UploadService {
  private baseUrl = `${API_BASE_URL}/upload`;

  async uploadDocument(file: File, assetId?: string, documentType?: string): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('document', file);
    
    if (assetId) {
      formData.append('assetId', assetId);
    }
    
    if (documentType) {
      formData.append('documentType', documentType);
    }

    const response = await axios.post(`${this.baseUrl}/document`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  }

  async getDocument(id: string): Promise<UploadResponse> {
    const response = await axios.get(`${this.baseUrl}/document/${id}`);
    return response.data;
  }

  async deleteDocument(id: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/document/${id}`);
  }
}

export const uploadService = new UploadService();