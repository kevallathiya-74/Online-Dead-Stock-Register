import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Tooltip,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Description as DescriptionIcon,
  Folder as FolderIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { toast } from 'react-toastify';

interface Document {
  id: string;
  name: string;
  type: string;
  category: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  lastModified: string;
  status: 'Active' | 'Archived' | 'Draft';
  fileType: string;
  tags: string[];
  description?: string;
}

const AdminDocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      // Generate mock documents data
      const mockDocuments: Document[] = [
        {
          id: '1',
          name: 'Asset Management Policy',
          type: 'PDF',
          category: 'Policies',
          size: '2.5 MB',
          uploadedBy: 'John Smith',
          uploadedAt: '2024-01-15',
          lastModified: '2024-01-20',
          status: 'Active',
          fileType: 'application/pdf',
          tags: ['policy', 'assets', 'management'],
          description: 'Comprehensive asset management policy document'
        },
        {
          id: '2',
          name: 'Q4 Asset Report',
          type: 'Excel',
          category: 'Reports',
          size: '1.8 MB',
          uploadedBy: 'Jane Doe',
          uploadedAt: '2024-01-10',
          lastModified: '2024-01-18',
          status: 'Active',
          fileType: 'application/vnd.ms-excel',
          tags: ['report', 'quarterly', 'assets'],
          description: 'Fourth quarter asset utilization report'
        },
        {
          id: '3',
          name: 'Vendor Agreement Template',
          type: 'Word',
          category: 'Templates',
          size: '0.5 MB',
          uploadedBy: 'Mike Johnson',
          uploadedAt: '2024-01-08',
          lastModified: '2024-01-12',
          status: 'Active',
          fileType: 'application/msword',
          tags: ['template', 'vendor', 'agreement'],
          description: 'Standard vendor agreement template'
        },
        {
          id: '4',
          name: 'IT Equipment Inventory',
          type: 'PDF',
          category: 'Inventory',
          size: '3.2 MB',
          uploadedBy: 'Sarah Wilson',
          uploadedAt: '2024-01-05',
          lastModified: '2024-01-15',
          status: 'Archived',
          fileType: 'application/pdf',
          tags: ['inventory', 'IT', 'equipment'],
          description: 'Complete IT equipment inventory listing'
        },
        {
          id: '5',
          name: 'Maintenance Schedule 2024',
          type: 'Excel',
          category: 'Schedules',
          size: '1.2 MB',
          uploadedBy: 'David Brown',
          uploadedAt: '2023-12-28',
          lastModified: '2024-01-10',
          status: 'Active',
          fileType: 'application/vnd.ms-excel',
          tags: ['maintenance', 'schedule', '2024'],
          description: 'Annual maintenance schedule for all assets'
        }
      ];
      
      setDocuments(mockDocuments);
    } catch (error) {
      toast.error('Failed to load documents');
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <PdfIcon color="error" />;
    if (fileType.includes('image')) return <ImageIcon color="primary" />;
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return <FileIcon color="success" />;
    if (fileType.includes('word') || fileType.includes('document')) return <FileIcon color="info" />;
    return <FileIcon />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Archived': return 'default';
      case 'Draft': return 'warning';
      default: return 'default';
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, document: Document) => {
    setAnchorEl(event.currentTarget);
    setSelectedDocument(document);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDocument(null);
  };

  const handleDownload = (document: Document) => {
    toast.success(`Downloading ${document.name}`);
    handleMenuClose();
  };

  const handleDelete = (document: Document) => {
    toast.success(`${document.name} deleted successfully`);
    setDocuments(prev => prev.filter(d => d.id !== document.id));
    handleMenuClose();
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setViewDialogOpen(true);
  };

  const handleEditDocument = (document: Document) => {
    setSelectedDocument(document);
    setEditDialogOpen(true);
    handleMenuClose();
  };

  return (
    <DashboardLayout>
      <Box sx={{ flexGrow: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Documents
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage organizational documents, policies, and files
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload Document
          </Button>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <DescriptionIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4">{documents.length}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Documents
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <FolderIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4">
                      {Array.from(new Set(documents.map(d => d.category))).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Categories
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <UploadIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4">
                      {documents.filter(d => d.status === 'Active').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Documents
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <FilterIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4">
                      {documents.filter(d => d.status === 'Archived').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Archived
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Search */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
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
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filterCategory}
                    label="Category"
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    <MenuItem value="Policies">Policies</MenuItem>
                    <MenuItem value="Reports">Reports</MenuItem>
                    <MenuItem value="Templates">Templates</MenuItem>
                    <MenuItem value="Inventory">Inventory</MenuItem>
                    <MenuItem value="Schedules">Schedules</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Archived">Archived</MenuItem>
                    <MenuItem value="Draft">Draft</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <Typography variant="body2" color="text.secondary">
                  {filteredDocuments.length} of {documents.length} documents
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Documents Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Document</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Uploaded By</TableCell>
                    <TableCell>Last Modified</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDocuments.map((document) => (
                    <TableRow key={document.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {getFileIcon(document.fileType)}
                          <Box>
                            <Typography variant="subtitle2">
                              {document.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {document.type}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={document.category} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{document.size}</TableCell>
                      <TableCell>{document.uploadedBy}</TableCell>
                      <TableCell>{document.lastModified}</TableCell>
                      <TableCell>
                        <Chip 
                          label={document.status} 
                          size="small" 
                          color={getStatusColor(document.status) as any}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View">
                          <IconButton 
                            size="small"
                            onClick={() => handleViewDocument(document)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download">
                          <IconButton 
                            size="small"
                            onClick={() => handleDownload(document)}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="More options">
                          <IconButton 
                            size="small"
                            onClick={(e) => handleMenuClick(e, document)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => {
            if (selectedDocument) handleDownload(selectedDocument);
          }}>
            <DownloadIcon sx={{ mr: 1 }} />
            Download
          </MenuItem>
          <MenuItem onClick={() => {
            if (selectedDocument) handleEditDocument(selectedDocument);
          }}>
            <EditIcon sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <ShareIcon sx={{ mr: 1 }} />
            Share
          </MenuItem>
          <MenuItem 
            onClick={() => {
              if (selectedDocument) handleDelete(selectedDocument);
            }}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>

        {/* View Document Dialog */}
        <Dialog 
          open={viewDialogOpen} 
          onClose={() => setViewDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {selectedDocument && getFileIcon(selectedDocument.fileType)}
              <Box>
                <Typography variant="h6">
                  {selectedDocument?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedDocument?.type} • {selectedDocument?.size}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedDocument && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Category
                    </Typography>
                    <Chip 
                      label={selectedDocument.category} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Status
                    </Typography>
                    <Chip 
                      label={selectedDocument.status} 
                      size="small" 
                      color={getStatusColor(selectedDocument.status) as any}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      File Size
                    </Typography>
                    <Typography variant="body2">
                      {selectedDocument.size}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Uploaded By
                    </Typography>
                    <Typography variant="body2">
                      {selectedDocument.uploadedBy}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Upload Date
                    </Typography>
                    <Typography variant="body2">
                      {selectedDocument.uploadedAt}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Last Modified
                    </Typography>
                    <Typography variant="body2">
                      {selectedDocument.lastModified}
                    </Typography>
                  </Box>
                </Grid>

                {selectedDocument.description && (
                  <Grid item xs={12}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Description
                      </Typography>
                      <Typography variant="body2">
                        {selectedDocument.description}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Tags
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {selectedDocument.tags.map((tag, index) => (
                        <Chip 
                          key={index}
                          label={tag} 
                          size="small" 
                          variant="outlined"
                          color="primary"
                        />
                      ))}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            <Button 
              variant="contained" 
              startIcon={<DownloadIcon />}
              onClick={() => {
                if (selectedDocument) handleDownload(selectedDocument);
                setViewDialogOpen(false);
              }}
            >
              Download
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Document Dialog */}
        <Dialog 
          open={editDialogOpen} 
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Edit Document
          </DialogTitle>
          <DialogContent>
            {selectedDocument && (
              <Box sx={{ pt: 2 }}>
                <TextField
                  fullWidth
                  label="Document Name"
                  defaultValue={selectedDocument.name}
                  sx={{ mb: 2 }}
                />
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    defaultValue={selectedDocument.category}
                    label="Category"
                  >
                    <MenuItem value="Policies">Policies</MenuItem>
                    <MenuItem value="Reports">Reports</MenuItem>
                    <MenuItem value="Templates">Templates</MenuItem>
                    <MenuItem value="Inventory">Inventory</MenuItem>
                    <MenuItem value="Schedules">Schedules</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    defaultValue={selectedDocument.status}
                    label="Status"
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Archived">Archived</MenuItem>
                    <MenuItem value="Draft">Draft</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  defaultValue={selectedDocument.description}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Tags (comma separated)"
                  defaultValue={selectedDocument.tags.join(', ')}
                  helperText="Enter tags separated by commas"
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={() => {
                toast.success('Document updated successfully');
                setEditDialogOpen(false);
              }}
            >
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* Upload Dialog */}
        <Dialog 
          open={uploadDialogOpen} 
          onClose={() => setUploadDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Upload Document</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Upload a new document to the system
            </Typography>
            <Box sx={{ 
              border: '2px dashed', 
              borderColor: 'grey.300', 
              borderRadius: 2, 
              p: 4, 
              textAlign: 'center',
              mt: 2
            }}>
              <UploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Drag and drop files here
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                or click to browse
              </Typography>
              <Button variant="outlined" sx={{ mt: 2 }}>
                Choose Files
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={() => {
                toast.success('Document uploaded successfully');
                setUploadDialogOpen(false);
              }}
            >
              Upload
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default AdminDocumentsPage;