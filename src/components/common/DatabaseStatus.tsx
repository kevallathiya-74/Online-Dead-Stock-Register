import React, { useState, useEffect } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Refresh as RefreshIcon, Info as InfoIcon } from '@mui/icons-material';
import api from '../../services/api';
import { toast } from 'react-toastify';

interface DatabaseStatusProps {
  onDataSeeded?: () => void;
}

/**
 * DatabaseStatus Component
 * 
 * Checks if the database has data and provides options to:
 * 1. Seed the database with test data (dev only)
 * 2. Refresh the page to see newly seeded data
 * 
 * Usage: <DatabaseStatus onDataSeeded={() => window.location.reload()} />
 */
const DatabaseStatus: React.FC<DatabaseStatusProps> = ({ onDataSeeded }) => {
  const [isEmpty, setIsEmpty] = useState(false);
  const [checking, setChecking] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [showSeedDialog, setShowSeedDialog] = useState(false);

  // Check if database has data
  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    try {
      setChecking(true);
      const response = await api.get('/assets/stats');
      
      if (response.data.success) {
        const { totalAssets } = response.data.data;
        setIsEmpty(totalAssets === 0);
      }
    } catch (error) {
      console.error('Failed to check database status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleSeedDatabase = async () => {
    try {
      setSeeding(true);
      const response = await api.post('/dev/seed-database');
      
      if (response.data.success) {
        toast.success('Database seeded successfully! Refreshing page...');
        setShowSeedDialog(false);
        
        // Wait a moment for data to propagate, then reload or callback
        setTimeout(() => {
          if (onDataSeeded) {
            onDataSeeded();
          } else {
            window.location.reload();
          }
        }, 1000);
      }
    } catch (error: any) {
      console.error('Failed to seed database:', error);
      const message = error.response?.data?.message || 'Failed to seed database';
      toast.error(message);
    } finally {
      setSeeding(false);
    }
  };

  if (checking) {
    return null; // Don't show anything while checking
  }

  if (!isEmpty) {
    return null; // Database has data, no need to show anything
  }

  return (
    <>
      <Alert 
        severity="info" 
        icon={<InfoIcon />}
        sx={{ mb: 3 }}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              size="small" 
              color="inherit" 
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
            <Button 
              size="small" 
              variant="outlined" 
              color="inherit"
              onClick={() => setShowSeedDialog(true)}
            >
              Seed Database
            </Button>
          </Box>
        }
      >
        <AlertTitle>No Data Found</AlertTitle>
        The database appears to be empty. You can:
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li><strong>Refresh the page</strong> if data was recently added</li>
          <li><strong>Seed the database</strong> with sample data for testing (development only)</li>
          <li><strong>Add assets manually</strong> using the "Add New Asset" button</li>
        </ul>
      </Alert>

      <Dialog
        open={showSeedDialog}
        onClose={() => !seeding && setShowSeedDialog(false)}
      >
        <DialogTitle>Seed Database with Test Data?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will populate the database with sample data including:
          </DialogContentText>
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
              <li>10 sample assets (laptops, servers, network equipment)</li>
              <li>5 vendor records (Dell, HP, Cisco, Lenovo, Microsoft)</li>
              <li>2 maintenance records</li>
              <li>Realistic purchase values and dates</li>
            </Typography>
          </Box>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <AlertTitle>Development Only</AlertTitle>
            This feature should only be used in development environment.
            The page will automatically refresh after seeding.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowSeedDialog(false)} 
            disabled={seeding}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSeedDatabase} 
            variant="contained"
            disabled={seeding}
            startIcon={seeding ? <CircularProgress size={20} /> : undefined}
          >
            {seeding ? 'Seeding...' : 'Seed Database'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DatabaseStatus;
