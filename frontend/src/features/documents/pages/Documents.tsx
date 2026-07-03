import {
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
    CloudArrowUpIcon,
    DocumentIcon,
    ExclamationCircleIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import api from '../../../services/api';

interface Document {
  _id: string;
  file_name: string;
  file_size: number;
  uploaded_by: {
    _id: string;
    name: string;
    email: string;
  };
  uploaded_at: string;
  asset_id: {
    _id: string;
    asset_name: string;
    asset_tag: string;
  };
  document_type: 'Invoice' | 'Scrap Certificate' | 'Repair Bill' | 'Other';
  file_path: string;
}

interface DocumentsProps {
  embedded?: boolean; // when true, don&apos;t render the outer Layout (used when embedding inside Dashboard)
}

const Documents: React.FC<DocumentsProps> = ({ embedded = false }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    document_type: 'Invoice' as Document['document_type'],
    asset_id: '',
    description: ''
  });
  const [uploading, setUploading] = useState(false);

  // Fetch documents from API
  useEffect(() => {
    fetchDocuments();
  {/* eslint-disable-next-line react-hooks/exhaustive-deps */}
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/documents', {
        params: {
          limit: 100,
          search: searchTerm
        }
      });
      
      if (response.data.success) {
        setDocuments(response.data.data);
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) { /* Error handled by API interceptor */ } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => 
    doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.asset_id?.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.uploaded_by?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (document: Document) => {
    setSelectedDocument(document);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDocument) return;
    
    try {
      await api.delete(`/documents/${selectedDocument._id}`);
      setDocuments(prev => prev.filter(doc => doc._id !== selectedDocument._id));
      setDeleteDialogOpen(false);
      setSelectedDocument(null);
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 3000);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to delete document';
      toast.error(errorMsg);
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedDocument(null);
  };

  const handleUploadClick = () => {
    setUploadDialogOpen(true);
  };

  const handleUploadCancel = () => {
    setUploadDialogOpen(false);
    setUploadFile(null);
    setUploadData({
      document_type: 'Invoice',
      asset_id: '',
      description: ''
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setUploadFile(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!uploadData.document_type) {
      toast.error('Please select a document type');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('document', uploadFile);
      formData.append('document_type', uploadData.document_type);
      if (uploadData.asset_id) {
        formData.append('asset_id', uploadData.asset_id);
      }
      if (uploadData.description) {
        formData.append('description', uploadData.description);
      }

      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Document uploaded successfully!');
      handleUploadCancel();
      await fetchDocuments();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to upload document';
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const getDocumentTypeBadge = (type: string) => {
    switch (type) {
      case 'Invoice':
        return 'bg-brand-50 text-brand-700 border border-brand-100';
      case 'Repair Bill':
        return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'Scrap Certificate':
        return 'bg-red-50 text-red-700 border border-red-100';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-100';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toUpperCase();
    return ext || 'Unknown';
  };

  const content = (
    <div className="space-y-6">
      {!embedded && (
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-900">
            Document Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage asset-related documents, invoices, and certificates
          </p>
        </div>
      )}

      {deleteSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
          <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
          <p>Document deleted successfully!</p>
        </div>
      )}

      {/* Header Actions */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 placeholder:text-slate-400"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
          <button
            onClick={handleUploadClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-all shadow-brand cursor-pointer w-full sm:w-auto justify-center"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            Upload Document
          </button>
        </div>
      </div>

      {/* Documents Grid / Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
        <h3 className="text-lg font-bold font-display text-slate-900 mb-4">
          Documents ({filteredDocuments.length})
        </h3>
        
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="w-8 h-8 rounded-full border-4 border-slate-100 border-t-brand-600 animate-spin" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-6">
            <DocumentIcon className="w-16 h-16 text-slate-300 mb-3" />
            <h4 className="text-base font-semibold text-slate-900">No Documents Found</h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              {searchTerm ? 'Try adjusting your search criteria' : 'Upload documents to get started'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-500">
                  <th className="pb-3 font-medium">Document Name</th>
                  <th className="pb-3 font-medium">Asset</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Size</th>
                  <th className="pb-3 font-medium">Uploaded By</th>
                  <th className="pb-3 font-medium">Upload Date</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {filteredDocuments.map((document) => (
                  <tr key={document._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <DocumentIcon className="w-8 h-8 text-brand-500 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-900 truncate max-w-[200px]">{document.file_name}</p>
                          <span className="text-xs text-slate-400">{getFileType(document.file_name)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div>
                        <p className="text-slate-900 font-medium">{document.asset_id?.asset_name || 'N/A'}</p>
                        <span className="text-xs text-slate-400">{document.asset_id?.asset_tag || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getDocumentTypeBadge(document.document_type)}`}>
                        {document.document_type}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600">
                      {formatFileSize(document.file_size)}
                    </td>
                    <td className="py-3 text-slate-600">
                      {document.uploaded_by?.name || 'Unknown'}
                    </td>
                    <td className="py-3 text-slate-500">
                      {new Date(document.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors" title="View Document">
                          <EyeIcon className="w-4.5 h-4.5" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors" title="Download">
                          <ArrowDownTrayIcon className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(document)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                          title="Delete Document"
                        >
                          <TrashIcon className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-card-xl p-6 space-y-4 animate-fade-in-up">
            <h3 className="text-lg font-bold font-display text-slate-900">Delete Document</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              {/* eslint-disable-next-line react/no-unescaped-entities */}
              Are you sure you want to delete <span className="font-semibold text-slate-800">"{selectedDocument?.file_name}"</span>? This action cannot be undone.
            </p>
            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 space-y-1">
              <p><span className="font-semibold text-slate-700">Asset:</span> {selectedDocument?.asset_id?.asset_name || 'N/A'} ({selectedDocument?.asset_id?.asset_tag || 'N/A'})</p>
              <p><span className="font-semibold text-slate-700">Type:</span> {selectedDocument?.document_type}</p>
              <p><span className="font-semibold text-slate-700">Size:</span> {selectedDocument ? formatFileSize(selectedDocument.file_size) : 'N/A'}</p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Dialog */}
      {uploadDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-card-xl p-6 space-y-4 animate-fade-in-up">
            <h3 className="text-lg font-bold font-display text-slate-900">Upload Document</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Document Type *</label>
                <select
                  value={uploadData.document_type}
                  onChange={(e) => setUploadData({...uploadData, document_type: e.target.value as Document['document_type']})}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
                >
                  <option value="Invoice">Invoice</option>
                  <option value="Scrap Certificate">Scrap Certificate</option>
                  <option value="Repair Bill">Repair Bill</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Asset ID (Optional)</label>
                <input
                  type="text"
                  value={uploadData.asset_id}
                  onChange={(e) => setUploadData({...uploadData, asset_id: e.target.value})}
                  placeholder="e.g., AST-001"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                  placeholder="Add notes about this document..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* File Dropzone */}
              <div
                onClick={() => document.getElementById('file-upload')?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-slate-50 ${
                  uploadFile ? 'border-brand-500 bg-brand-50/10' : 'border-slate-200'
                }`}
              >
                <input
                  id="file-upload"
                  type="file"
                  hidden
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <CloudArrowUpIcon className={`w-10 h-10 mx-auto mb-2 ${uploadFile ? 'text-brand-600 animate-pulse' : 'text-slate-400'}`} />
                {uploadFile ? (
                  <div>
                    <p className="text-sm font-semibold text-brand-600 truncate">{uploadFile.name}</p>
                    <span className="text-xs text-slate-500">{formatFileSize(uploadFile.size)}</span>
                    <span className="block text-[10px] text-slate-400 mt-2">Click to change file</span>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-slate-700">Click to select a file</p>
                    <p className="text-xs text-slate-400 mt-0.5">Supported: PDF, DOC, DOCX, JPG, PNG (Max 10MB)</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleUploadCancel}
                disabled={uploading}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-55 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadSubmit}
                disabled={!uploadFile || uploading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-55 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <ArrowUpTrayIcon className="w-4 h-4" />
                    Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return content;
  }

  return <DashboardLayout>{content}</DashboardLayout>;
};

export default Documents;