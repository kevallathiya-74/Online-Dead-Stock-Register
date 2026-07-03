import { ArrowLeftIcon, CheckCircleIcon, EnvelopeIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as yup from 'yup';
import { API_ENDPOINTS } from '../../../config/api.config';
import api from '../../../services/api';

interface ForgotPasswordFormInputs { email: string; }

const schema = yup.object({ email: yup.string().email('Invalid email').required('Email is required') }).required();

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormInputs>({ resolver: yupResolver(schema) });

  const onSubmit = async (data: ForgotPasswordFormInputs) => {
    try {
      setIsLoading(true);
      await api.post(API_ENDPOINTS.FORGOT_PASSWORD, { email: data.email });
      setIsEmailSent(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to send reset email.');
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F8FAFC', backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.05) 0%, transparent 60%)' }}>
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-card-xl animate-fade-in-up">
        <div className="p-8 sm:p-10">
          {isEmailSent ? (
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mb-4"><CheckCircleIcon className="w-8 h-8 text-green-600" /></div>
              <h1 className="text-2xl font-bold font-display text-slate-900 mb-2">Check Your Email</h1>
              {/* eslint-disable-next-line react/no-unescaped-entities */}
              <p className="text-sm text-slate-500 leading-relaxed mb-6">We've sent a password reset link to your email address. Please check your inbox.</p>
              <RouterLink to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                <ArrowLeftIcon className="w-4 h-4" /> Back to Sign In
              </RouterLink>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mb-4"><EnvelopeIcon className="w-7 h-7 text-brand-600" /></div>
                <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight">Forgot Password?</h1>
                {/* eslint-disable-next-line react/no-unescaped-entities */}
                <p className="text-sm text-slate-500 mt-1">Enter your email and we'll send you a reset link</p>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                  <input id="forgot-email" type="email" placeholder="you@company.com" {...register('email')}
                    className={`w-full px-3.5 py-2.5 text-sm border rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${errors.email ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 hover:border-slate-300 focus:ring-brand-500 focus:border-brand-500'}`} />
                  {errors.email && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><ExclamationCircleIcon className="w-3.5 h-3.5" />{errors.email.message}</p>}
                </div>
                <button type="submit" disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white font-semibold rounded-xl text-sm hover:bg-brand-700 transition-all shadow-brand disabled:opacity-60 disabled:cursor-not-allowed">
                  {isLoading ? (<><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Sending…</>) : 'Send Reset Link'}
                </button>
              </form>
              <p className="text-center text-sm text-slate-500 mt-6">
                <RouterLink to="/login" className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700"><ArrowLeftIcon className="w-3.5 h-3.5" />Back to Sign In</RouterLink>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;