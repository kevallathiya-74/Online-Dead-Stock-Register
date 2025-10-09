import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Link,
} from '@mui/material';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/api.config';

interface ForgotPasswordFormInputs {
  email: string;
}

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
}).required();

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormInputs>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: ForgotPasswordFormInputs) => {
    try {
      setIsLoading(true);
      await api.post(API_ENDPOINTS.FORGOT_PASSWORD, {
        email: data.email,
      });
      setIsEmailSent(true);
      toast.success('Password reset instructions have been sent to your email');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'grey.100',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Forgot Password?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter your email to receive password reset instructions
            </Typography>
          </Box>

          {!isEmailSent ? (
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <TextField
                fullWidth
                label="Email"
                variant="outlined"
                margin="normal"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{ mt: 3 }}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body1" paragraph>
                Please check your email for instructions to reset your password.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Didn't receive the email? Check your spam folder or try again.
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setIsEmailSent(false)}
                sx={{ mt: 2 }}
              >
                Try Again
              </Button>
            </Box>
          )}

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Remember your password?{' '}
              <Link
                component={RouterLink}
                to="/login"
                variant="body2"
                underline="hover"
              >
                Sign in
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ForgotPassword;