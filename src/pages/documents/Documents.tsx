import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { toast } from 'react-toastify';
import api from '../../services/api';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Chip,
  TextField,
  InputAdornment,
  Tooltip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
  Description as DocumentIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';

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
  embedded?: boolean; // when true, don't render the outer Layout (used when embedding inside Dashboard)
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
    } catch (error: any) {
      console.error('Failed to fetch documents:', error);
      toast.error(error.response?.data?.message || 'Failed to load documents');
    } finally {
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
      console.log('Deleting document via API:', selectedDocument._id);
      
      // Call API to delete document
      await api.delete(`/documents/${selectedDocument._id}`);
      
      // Remove document from list
      setDocuments(prev => prev.filter(doc => doc._id !== selectedDocument._id));
      setDeleteDialogOpen(false);
      setSelectedDocument(null);
      setDeleteSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setDeleteSuccess(false), 3000);
    } catch (error: any) {
      console.error('Failed to delete document:', error);
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
      // Check file size (max 10MB)
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

      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Document uploaded successfully!');
      handleUploadCancel();
      
      // Refresh documents list
      await fetchDocuments();
    } catch (error: any) {
      console.error('Failed to upload document:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to upload document';
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'Invoice': return 'primary';
      case 'Repair Bill': return 'warning';
      case 'Scrap Certificate': return 'error';
      default: return 'default';
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
    <Box>
        <Typography variant="h4" gutterBottom>
          Document Management
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          Manage asset-related documents, invoices, and certificates
        </Typography>

        {deleteSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Document deleted successfully!
          </Alert>
        )}

        {/* Header Actions */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <TextField
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 300 }}
              />
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                size="large"
                onClick={handleUploadClick}
              >
                Upload Document
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Documents Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Documents ({filteredDocuments.length})
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                <CircularProgress />
              </Box>
            ) : filteredDocuments.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={400}>
                <DocumentIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Documents Found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm ? 'Try adjusting your search criteria' : 'Upload documents to get started'}
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Document Name</TableCell>
                      <TableCell>Asset</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>Uploaded By</TableCell>
                      <TableCell>Upload Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredDocuments.map((document) => (
                      <TableRow key={document._id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <DocumentIcon color="primary" />
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {document.file_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {getFileType(document.file_name)}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {document.asset_id?.asset_name || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {document.asset_id?.asset_tag || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={document.document_type}
                            size="small"
                            color={getDocumentTypeColor(document.document_type) as any}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatFileSize(document.file_size)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {document.uploaded_by?.name || 'Unknown'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(document.uploaded_at).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Tooltip title="View Document">
                              <IconButton size="small" color="primary">
                                <ViewIcon />
                              </IconButton>
                          </Tooltip>
                          <Tooltip title="Download">
                            <IconButton size="small" color="primary">
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Document">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteClick(document)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Delete Document
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete "{selectedDocument?.file_name}"?
              This action cannot be undone.
            </DialogContentText>
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary">
                <Box component="span" fontWeight="bold">Asset:</Box> {selectedDocument?.asset_id?.asset_name || 'N/A'} ({selectedDocument?.asset_id?.asset_tag || 'N/A'})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <Box component="span" fontWeight="bold">Type:</Box> {selectedDocument?.document_type}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <Box component="span" fontWeight="bold">Size:</Box> {selectedDocument ? formatFileSize(selectedDocument.file_size) : 'N/A'}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel} color="primary">
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteConfirm} 
              color="error" 
              variant="contained"
              autoFocus
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Upload Document Dialog */}
        <Dialog
          open={uploadDialogOpen}
          onClose={handleUploadCancel}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Upload Document
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Document Type</InputLabel>
                <Select
                  label="Document Type"
                  value={uploadData.document_type}
                  onChange={(e) => setUploadData({...uploadData, document_type: e.target.value as Document['document_type']})}
                >
                  <MenuItem value="Invoice">Invoice</MenuItem>
                  <MenuItem value="Scrap Certificate">Scrap Certificate</MenuItem>
                  <MenuItem value="Repair Bill">Repair Bill</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Asset ID (Optional)"
                value={uploadData.asset_id}
                onChange={(e) => setUploadData({...uploadData, asset_id: e.target.value})}
                placeholder="e.g., AST-001"
              />

              <TextField
                fullWidth
                label="Description (Optional)"
                value={uploadData.description}
                onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                multiline
                rows={2}
                placeholder="Add notes about this document..."
              />

              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: uploadFile ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  bgcolor: uploadFile ? 'action.hover' : 'background.paper',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover',
                  }
                }}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  hidden
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <CloudUploadIcon sx={{ fontSize: 48, color: uploadFile ? 'primary.main' : 'text.secondary', mb: 1 }} />
                {uploadFile ? (
                  <Box>
                    <Typography variant="body1" fontWeight="medium" color="primary">
                      {uploadFile.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(uploadFile.size)}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Click to change file
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      Click to select a file
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Supported: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleUploadCancel} disabled={uploading}>
              Cancel
            </Button>
            <Button 
              onClick={handleUploadSubmit} 
              variant="contained"
              disabled={!uploadFile || uploading}
              startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogActions>
        </Dialog>
    </Box>
  );

  if (embedded) {
    return content;
  }

  return (
    <Layout title="Documents">{content}</Layout>
  );
};

export default Documents;