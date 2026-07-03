import { ExclamationCircleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as yup from 'yup';
import { authService } from '../services/auth.service';
import { Department, UserRole } from '../../../types';
import BrandLogo from '../../../components/common/BrandLogo';

interface RegisterFormInputs {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  department: Department;
  role: UserRole;
}

const schema = yup.object({
  fullName: yup.string().required('Full name is required').min(2).max(100).matches(/^[a-zA-Z\s'-]+$/, 'Letters, spaces, hyphens and apostrophes only'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required').min(8, 'At least 8 characters').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include uppercase, lowercase and number'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Please confirm your password'),
  department: yup.mixed<Department>().oneOf(Object.values(Department)).required('Department is required'),
  role: yup.mixed<UserRole>().oneOf(Object.values(UserRole)).required('Role is required'),
}).required();

const departments = [
  { value: Department.INVENTORY, label: 'Inventory' },
  { value: Department.IT, label: 'Information Technology' },
  { value: Department.ADMIN, label: 'Administration' },
];

const roles = [
  { value: UserRole.AUDITOR,           label: 'Auditor' },
  { value: UserRole.INVENTORY_MANAGER, label: 'Inventory Manager' },
  { value: UserRole.ADMIN,             label: 'Admin' },
];

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
      <ExclamationCircleIcon className="w-3.5 h-3.5" />{message}
    </p>
  ) : null;

const Register = () => {
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, control, formState: { errors } } = useForm<RegisterFormInputs>({
    resolver: yupResolver(schema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', department: Department.INVENTORY, role: UserRole.AUDITOR },
  });

  const onSubmit = async (data: RegisterFormInputs) => {
    try {
      setIsLoading(true);
      const response = await authService.signUp({ email: data.email, password: data.password, full_name: data.fullName, department: data.department, role: data.role });
      if (response.error) { toast.error(response.error.message); return; }
      if (response.token && response.user) { toast.success('Registration successful'); setTimeout(() => navigate('/dashboard', { replace: true }), 1000); }
      else { toast.success('Registration successful! Please log in.'); navigate('/login'); }
    // eslint-disable-next-line no-empty
    } catch { } finally { setIsLoading(false); }
  };

  const inputClass = (hasError: boolean) =>
    `w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border rounded-xl placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 ${
      hasError ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-slate-200 hover:border-slate-300 focus:ring-brand-500 focus:border-brand-500'
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F8FAFC', backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.05) 0%, transparent 60%)' }}>
      <div className="fixed top-5 left-5">
        <RouterLink to="/" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <BrandLogo variant="default" width={120} />
        </RouterLink>
      </div>

      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-100 shadow-card-xl animate-fade-in-up my-8">
        <div className="p-8 sm:p-10">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-4"><BrandLogo variant="mark" width={48} /></div>
            <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight">Create Account</h1>
            <p className="text-sm text-slate-500 mt-1">Join DSR to manage assets efficiently</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input id="reg-name" type="text" placeholder="e.g. John Doe" {...register('fullName')} className={inputClass(!!errors.fullName)} />
              <FieldError message={errors.fullName?.message} />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input id="reg-email" type="email" placeholder="you@company.com" {...register('email')} className={inputClass(!!errors.email)} />
              <FieldError message={errors.email?.message} />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input id="reg-password" type={showPwd ? 'text' : 'password'} placeholder="Min. 8 characters" {...register('password')} className={inputClass(!!errors.password) + ' pr-10'} />
                <button type="button" tabIndex={-1} onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPwd ? <EyeSlashIcon className="w-4.5 h-4.5" /> : <EyeIcon className="w-4.5 h-4.5" />}</button>
              </div>
              <FieldError message={errors.password?.message} />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="reg-confirm" className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input id="reg-confirm" type={showConfirm ? 'text' : 'password'} placeholder="Repeat password" {...register('confirmPassword')} className={inputClass(!!errors.confirmPassword) + ' pr-10'} />
                <button type="button" tabIndex={-1} onClick={() => setShowConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showConfirm ? <EyeSlashIcon className="w-4.5 h-4.5" /> : <EyeIcon className="w-4.5 h-4.5" />}</button>
              </div>
              <FieldError message={errors.confirmPassword?.message} />
            </div>

            {/* Department */}
            <Controller name="department" control={control} render={({ field }) => (
              <div>
                <label htmlFor="reg-dept" className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
                <select id="reg-dept" {...field} className={inputClass(!!errors.department) + ' appearance-none'}>
                  {departments.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
                <FieldError message={errors.department?.message} />
              </div>
            )} />

            {/* Role */}
            <Controller name="role" control={control} render={({ field }) => (
              <div>
                <label htmlFor="reg-role" className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                <select id="reg-role" {...field} className={inputClass(!!errors.role) + ' appearance-none'}>
                  {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <FieldError message={errors.role?.message} />
              </div>
            )} />

            <button id="register-submit" type="submit" disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white font-semibold rounded-xl text-sm hover:bg-brand-700 transition-all shadow-brand hover:shadow-brand-lg disabled:opacity-60 disabled:cursor-not-allowed mt-2">
              {isLoading ? (<><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Creating Account…</>) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">Already have an account?{' '}<RouterLink to="/login" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">Sign in</RouterLink></p>
        </div>
      </div>
    </div>
  );
};

export default Register;