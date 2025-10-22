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
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { authService } from '../../services/auth.service';
import { UserRole, Department } from '../../types';

interface RegisterFormInputs {
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
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
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

const departments = [
  { value: Department.INVENTORY, label: 'Inventory' },
  { value: Department.IT, label: 'Information Technology' },
  { value: Department.ADMIN, label: 'Administration' }
];

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormInputs>({
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

  const onSubmit = async (data: RegisterFormInputs) => {
    try {
      setIsLoading(true);
      const response = await authService.signUp({
        email: data.email,
        password: data.password,
        full_name: data.username,
        department: data.department,
        role: data.role,
      });

      if (response.error) {
        toast.error(response.error.message);
      } else {
        toast.success('Registration successful! Please log in.');
        navigate('/login');
      }
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
              Create Account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Join Dead Stock Register to manage assets efficiently
            </Typography>
          </Box>

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

export default Register;