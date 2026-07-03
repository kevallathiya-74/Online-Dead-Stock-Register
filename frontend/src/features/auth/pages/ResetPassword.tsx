import { CheckCircleIcon, ExclamationCircleIcon, EyeIcon, EyeSlashIcon, KeyIcon } from '@heroicons/react/24/outline';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as yup from 'yup';
import { API_ENDPOINTS } from '../../../config/api.config';
import api from '../../../services/api';

interface ResetPasswordFormInputs {
  password: string;
  confirmPassword: string;
}

const schema = yup.object({
  password: yup.string().required('Password is required').min(8, 'At least 8 characters').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include uppercase, lowercase and number'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Please confirm your password'),
}).required();

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormInputs>({ resolver: yupResolver(schema) });

  const onSubmit = async (data: ResetPasswordFormInputs) => {
    if (!token) { toast.error('Invalid or expired reset link.'); return; }
    try {
      setIsLoading(true);
      await api.post(API_ENDPOINTS.RESET_PASSWORD, { token, password: data.password });
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to reset password.');
    } finally { setIsLoading(false); }
  };

  const inputClass = (hasError: boolean) =>
    `w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border rounded-xl placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 ${hasError ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-slate-200 hover:border-slate-300 focus:ring-brand-500 focus:border-brand-500'}`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F8FAFC', backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.05) 0%, transparent 60%)' }}>
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-card-xl animate-fade-in-up">
        <div className="p-8 sm:p-10">
          {isSuccess ? (
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold font-display text-slate-900 mb-2">Password Reset!</h1>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">Your password has been reset successfully. Redirecting to login…</p>
              <RouterLink to="/login" className="text-sm font-semibold text-brand-600 hover:text-brand-700">Go to Sign In</RouterLink>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mb-4"><KeyIcon className="w-7 h-7 text-brand-600" /></div>
                <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight">Reset Password</h1>
                <p className="text-sm text-slate-500 mt-1">Enter your new password below</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                <div>
                  <label htmlFor="reset-password" className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <input id="reset-password" type={showPwd ? 'text' : 'password'} placeholder="Min. 8 characters" {...register('password')} className={inputClass(!!errors.password) + ' pr-10'} />
                    <button type="button" tabIndex={-1} onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPwd ? <EyeSlashIcon className="w-4.5 h-4.5" /> : <EyeIcon className="w-4.5 h-4.5" />}</button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><ExclamationCircleIcon className="w-3.5 h-3.5" />{errors.password.message}</p>}
                </div>

                <div>
                  <label htmlFor="reset-confirm" className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <input id="reset-confirm" type={showConfirm ? 'text' : 'password'} placeholder="Repeat password" {...register('confirmPassword')} className={inputClass(!!errors.confirmPassword) + ' pr-10'} />
                    <button type="button" tabIndex={-1} onClick={() => setShowConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showConfirm ? <EyeSlashIcon className="w-4.5 h-4.5" /> : <EyeIcon className="w-4.5 h-4.5" />}</button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><ExclamationCircleIcon className="w-3.5 h-3.5" />{errors.confirmPassword.message}</p>}
                </div>

                <button type="submit" disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white font-semibold rounded-xl text-sm hover:bg-brand-700 transition-all shadow-brand disabled:opacity-60 disabled:cursor-not-allowed">
                  {isLoading ? (<><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Resetting…</>) : 'Reset Password'}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-6">
                <RouterLink to="/login" className="font-semibold text-brand-600 hover:text-brand-700">Back to Sign In</RouterLink>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;