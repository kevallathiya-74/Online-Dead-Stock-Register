import React, { useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Stack,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Security as SecurityIcon,
  Assessment as ReportIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: <InventoryIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Asset Management',
      description: 'Track and manage all your organizational assets efficiently with QR code scanning.',
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Role-Based Access',
      description: 'Secure access control with different permission levels for admins, managers, auditors, and vendors.',
    },
    {
      icon: <ReportIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Comprehensive Reports',
      description: 'Generate detailed reports and analytics for better decision making.',
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Real-time Updates',
      description: 'Get instant notifications and real-time updates on asset status and movements.',
    },
  ];

  // Show loading if still checking authentication
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        {/* You can add a loading spinner here */}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        component="header"
        sx={{
          py: 2,
          px: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
          Dead Stock Register
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            sx={{
              color: 'white',
              borderColor: 'white',
              '&:hover': {
                borderColor: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
            component={RouterLink}
            to="/login"
          >
            Sign In
          </Button>
          <Button
            variant="contained"
            sx={{
              backgroundColor: 'white',
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
              },
            }}
            component={RouterLink}
            to="/register"
          >
            Get Started
          </Button>
        </Stack>
      </Box>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <Box sx={{ textAlign: 'center', color: 'white', py: 8 }}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              mb: 3,
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            Manage Your Assets
            <br />
            Like Never Before
          </Typography>
          
          <Typography
            variant="h5"
            component="p"
            sx={{
              mb: 4,
              opacity: 0.9,
              maxWidth: { xs: '100%', sm: 500, md: 600 },
              mx: 'auto',
              lineHeight: 1.6,
            }}
          >
            A comprehensive dead stock register system that helps organizations 
            track, audit, and manage their assets efficiently with role-based access control.
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            sx={{ mb: 6 }}
          >
            <Button
              variant="contained"
              size="large"
              sx={{
                backgroundColor: 'white',
                color: 'primary.main',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                },
              }}
              component={RouterLink}
              to="/register"
            >
              Start Free Trial
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                color: 'white',
                borderColor: 'white',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
              component={RouterLink}
              to="/login"
            >
              Sign In
            </Button>
          </Stack>

          {/* Features Grid */}
          <Grid container spacing={3} sx={{ mt: 4 }}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Box sx={{ mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          textAlign: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          © {new Date().getFullYear()} Dead Stock Register. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default Landing;