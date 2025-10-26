import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';

interface Document {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  uploadedBy: string;
  uploadedAt: string;
  assetId: string;
  assetName: string;
  documentType: 'Invoice' | 'Scrap Certificate' | 'Repair Bill' | 'Other';
}

const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      fileName: 'Dell_XPS_15_Invoice.pdf',
      fileType: 'PDF',
      fileSize: '2.4 MB',
      uploadedBy: 'John Smith',
      uploadedAt: '2024-01-15',
      assetId: 'ASSET-001',
      assetName: 'Dell XPS 15',
      documentType: 'Invoice',
    },
    {
      id: '2',
      fileName: 'MacBook_Repair_Bill.pdf',
      fileType: 'PDF',
      fileSize: '1.8 MB',
      uploadedBy: 'Sarah Johnson',
      uploadedAt: '2024-01-10',
      assetId: 'ASSET-002',
      assetName: 'MacBook Pro',
      documentType: 'Repair Bill',
    },
    {
      id: '3',
      fileName: 'HP_Printer_Scrap_Certificate.pdf',
      fileType: 'PDF',
      fileSize: '956 KB',
      uploadedBy: 'Mike Wilson',
      uploadedAt: '2023-12-20',
      assetId: 'ASSET-003',
      assetName: 'HP Printer',
      documentType: 'Scrap Certificate',
    },
    {
      id: '4',
      fileName: 'Warranty_Document_Scanner.jpg',
      fileType: 'Image',
      fileSize: '3.2 MB',
      uploadedBy: 'Lisa Davis',
      uploadedAt: '2024-01-08',
      assetId: 'ASSET-004',
      assetName: 'Canon Scanner',
      documentType: 'Other',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const filteredDocuments = documents.filter(doc => 
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (document: Document) => {
    setSelectedDocument(document);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDocument) return;
    
    try {
      console.log('Deleting document via API:', selectedDocument.id);
      
      // Call API to delete document
      await api.delete(`/documents/${selectedDocument.id}`);
      
      // Remove document from list
      setDocuments(prev => prev.filter(doc => doc.id !== selectedDocument.id));
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

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'Invoice': return 'primary';
      case 'Repair Bill': return 'warning';
      case 'Scrap Certificate': return 'error';
      default: return 'default';
    }
  };

  return (
    <Layout title="Documents">
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
                    <TableRow key={document.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <DocumentIcon color="primary" />
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {document.fileName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {document.fileType}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {document.assetName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {document.assetId}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={document.documentType}
                          size="small"
                          color={getDocumentTypeColor(document.documentType) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {document.fileSize}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {document.uploadedBy}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(document.uploadedAt).toLocaleDateString()}
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

            {filteredDocuments.length === 0 && (
              <Box textAlign="center" py={4}>
                <DocumentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No documents found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm ? 'Try adjusting your search terms' : 'Upload your first document to get started'}
                </Typography>
              </Box>
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
              Are you sure you want to delete "{selectedDocument?.fileName}"?
              This action cannot be undone.
            </DialogContentText>
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary">
                <Box component="span" fontWeight="bold">Asset:</Box> {selectedDocument?.assetName} ({selectedDocument?.assetId})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <Box component="span" fontWeight="bold">Type:</Box> {selectedDocument?.documentType}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <Box component="span" fontWeight="bold">Size:</Box> {selectedDocument?.fileSize}
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
      </Box>
    </Layout>
  );
};

export default Documents;