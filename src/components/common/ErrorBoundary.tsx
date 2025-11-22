import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { toast } from 'react-toastify';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    toast.error('An unexpected error occurred');
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: { xs: '300px', sm: '350px', md: '400px' },
            p: { xs: 2, sm: 3 },
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" gutterBottom color="error">
            Oops! Something went wrong.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            We apologize for the inconvenience. Please try again later.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={this.handleReset}
          >
            Try Again
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <Box sx={{ mt: 3, maxWidth: '600px', overflow: 'auto' }}>
              <Typography variant="body2" color="error" component="pre">
                {this.state.error?.toString()}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;