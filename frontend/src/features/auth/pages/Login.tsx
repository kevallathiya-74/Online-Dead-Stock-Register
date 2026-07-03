import { ExclamationCircleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { yupResolver } from '@hookform/resolvers/yup';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import { useAuth } from '../../../context/AuthContext';
import BrandLogo from '../../../components/common/BrandLogo';
import { UserRole } from '../../../types';

const getRedirectPath = (role: UserRole): string => {
  switch (role) {
    case UserRole.ADMIN:
      return '/admin/dashboard';
    case UserRole.AUDITOR:
      return '/auditor/dashboard';
    case UserRole.VENDOR:
      return '/vendor/dashboard';
    case UserRole.INVENTORY_MANAGER:
    case UserRole.IT_MANAGER:
    default:
      return '/dashboard';
  }
};

interface LoginFormInputs {
  email: string;
  password: string;
}

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
}).required();

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: yupResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const user = await login(data.email, data.password);
      const redirectPath = getRedirectPath(user.role);
      setTimeout(() => navigate(redirectPath, { replace: true }), 100);
    } catch (error: any) {
      setErrorMsg(error instanceof Error ? error.message : 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: '#F8FAFC',
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.05) 0%, transparent 60%)',
      }}
    >
      {/* Back to home */}
      <div className="fixed top-5 left-5">
        <RouterLink
          to="/"
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <BrandLogo variant="default" width={120} />
        </RouterLink>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-card-xl animate-fade-in-up">
        <div className="p-8 sm:p-10">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-4">
              <BrandLogo variant="mark" width={48} />
            </div>
            <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Sign in to manage your Dead Stock Register
            </p>
          </div>

          {/* Error alert */}
          {errorMsg && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-6">
              <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                {...register('email')}
                className={`w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border rounded-xl placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                  errors.email ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 hover:border-slate-300'
                }`}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <ExclamationCircleIcon className="w-3.5 h-3.5" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full px-3.5 py-2.5 pr-10 text-sm text-slate-900 bg-white border rounded-xl placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                    errors.password ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 hover:border-slate-300'
                  }`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword
                    ? <EyeSlashIcon className="w-4.5 h-4.5" />
                    : <EyeIcon className="w-4.5 h-4.5" />
                  }
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <ExclamationCircleIcon className="w-3.5 h-3.5" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Forgot */}
            <div className="flex justify-end">
              <RouterLink
                to="/forgot-password"
                className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
              >
                Forgot password?
              </RouterLink>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white font-semibold rounded-xl text-sm hover:bg-brand-700 active:bg-brand-800 transition-all shadow-brand hover:shadow-brand-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-slate-500 mt-6">
            {/* eslint-disable-next-line react/no-unescaped-entities */}
            Don't have an account?{' '}
            <RouterLink to="/register" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
              Sign up
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;