import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
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
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { UserRole } from '../../types';

interface AdminRegisterFormInputs {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  department: Department;
  role: UserRole;
}

const schema = yup.object({
  username: yup.string().required('Username is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  department: yup
    .mixed<Department>()
    .oneOf(Object.values(Department))
    .required('Department is required'),
  role: yup.mixed<UserRole>().oneOf(Object.values(UserRole)).required('Role is required'),
}).required();

import { Department } from '../../types';

const departments = [
  { value: Department.IT, label: 'Information Technology' },
  { value: Department.INVENTORY, label: 'Inventory' },
  { value: Department.ADMIN, label: 'Administration' },
];

const AdminRegister = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AdminRegisterFormInputs>({
    resolver: yupResolver(schema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      department: Department.INVENTORY,
      role: UserRole.EMPLOYEE,
    },
  });

  const onSubmit = async (data: AdminRegisterFormInputs) => {
    try {
      setIsLoading(true);
      
      // For demo purposes, we'll create a simple mock registration
      // In production, this would call the real backend API
      const mockUser = {
        id: `user-${Date.now()}`,
        email: data.email,
        username: data.username,
        role: data.role,
        department: data.department,
        created_at: new Date().toISOString(),
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store in localStorage for demo purposes
      const existingUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
      
      // Check if user already exists
      if (existingUsers.some((user: any) => user.email === data.email)) {
        toast.error('Email already exists');
        return;
      }
      
      existingUsers.push(mockUser);
      localStorage.setItem('demo_users', JSON.stringify(existingUsers));
      
      toast.success(`${data.role} account created successfully!`);
      navigate('/login');
    } catch (error: any) {
      toast.error('Registration failed');
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
      <Card sx={{ maxWidth: 500, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Admin Registration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create accounts with specific roles for testing
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            This is a demo registration system. In production, admin registration would require proper authentication and authorization.
          </Alert>

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              margin="normal"
              {...register('username')}
              error={!!errors.username}
              helperText={errors.username?.message}
            />

            <TextField
              fullWidth
              label="Email"
              variant="outlined"
              margin="normal"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              margin="normal"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              variant="outlined"
              margin="normal"
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Controller
              name="department"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth margin="normal">
                  <InputLabel>Department</InputLabel>
                  <Select
                    {...field}
                    label="Department"
                    error={!!errors.department}
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.department && (
                    <Typography variant="caption" color="error">
                      {errors.department.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />

            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth margin="normal">
                  <InputLabel>Role</InputLabel>
                  <Select
                    {...field}
                    label="Role"
                    error={!!errors.role}
                  >
                    <MenuItem value={UserRole.EMPLOYEE}>Employee</MenuItem>
                    <MenuItem value={UserRole.INVENTORY_MANAGER}>Inventory Manager</MenuItem>
                    <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
                  </Select>
                  {errors.role && (
                    <Typography variant="caption" color="error">
                      {errors.role.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ mt: 3 }}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
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
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminRegister;