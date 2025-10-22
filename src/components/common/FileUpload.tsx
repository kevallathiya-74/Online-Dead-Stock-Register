import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-toastify';

export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  uploadedAt: string;
  documentType: string;
}

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  onDelete?: (fileId: string) => Promise<void>;
  files?: UploadedFile[];
  isLoading?: boolean;
  acceptedFiles?: string[];
  maxSize?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  onDelete,
  files = [],
  isLoading = false,
  acceptedFiles = ['image/*', 'application/pdf', '.doc,.docx'],
  maxSize = 5 * 1024 * 1024 // 5MB
}) => {
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles?.length > 0) {
      const file = acceptedFiles[0];
      
      if (file.size > maxSize) {
        toast.error('File is too large. Maximum size is 5MB.');
        return;
      }

      try {
        setUploadProgress(0);
        await onUpload(file);
        toast.success('File uploaded successfully');
      } catch (error) {
        toast.error('Failed to upload file');
      } finally {
        setUploadProgress(null);
      }
    }
  }, [onUpload, maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false,
    maxSize
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      <Paper
        {...getRootProps()}
        sx={{
          border: '2px dashed #ccc',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          mb: 2,
          '&:hover': {
            borderColor: 'primary.main'
          }
        }}
      >
        <input {...getInputProps()} />
        {isLoading || uploadProgress !== null ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress />
            {uploadProgress !== null && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Uploading... {uploadProgress}%
              </Typography>
            )}
          </Box>
        ) : (
          <>
            <CloudUploadIcon sx={{ fontSize: 48, mb: 2 }} />
            <Typography>
              {isDragActive
                ? 'Drop the file here'
                : 'Drag & drop a file here, or click to select'}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Allowed files: Images, PDF, DOC/DOCX (max {formatFileSize(maxSize)})
            </Typography>
          </>
        )}
      </Paper>

      {files.length > 0 && (
        <List>
          {files.map((file) => (
            <ListItem
              key={file.id}
              secondaryAction={
                onDelete && (
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => onDelete(file.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                )
              }
            >
              <ListItemText
                primary={file.originalName}
                secondary={`${file.documentType} - ${formatFileSize(file.size)}`}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};