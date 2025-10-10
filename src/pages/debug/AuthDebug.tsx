import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const AuthDebug = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Authentication Debug
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 2 }}>
            <strong>Loading:</strong> {loading ? 'true' : 'false'}
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 2 }}>
            <strong>User:</strong> {user ? 'Authenticated' : 'Not authenticated'}
          </Typography>
          
          {user && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1">
                <strong>Email:</strong> {user.email}
              </Typography>
              <Typography variant="body1">
                <strong>Role:</strong> {user.role}
              </Typography>
              <Typography variant="body1">
                <strong>Full Name:</strong> {user.full_name}
              </Typography>
              <Typography variant="body1">
                <strong>ID:</strong> {user.id}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/login')}
            >
              Go to Login
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AuthDebug;