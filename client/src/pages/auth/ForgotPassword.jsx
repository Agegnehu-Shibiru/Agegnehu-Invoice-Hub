// ForgotPassword.jsx
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { authApi } from '../../api';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';

export function ForgotPassword() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();
  const [sent, setSent] = useState(false);

  const onSubmit = async ({ email }) => {
    try { await authApi.forgotPassword(email); setSent(true); }
    catch { setSent(true); } // Always show success to prevent enumeration
  };

  if (sent) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="card p-8 text-center max-w-sm w-full">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Check your inbox</h2>
        <p className="text-slate-500 text-sm mb-6">If an account exists, we've sent a password reset link. Check your spam folder too.</p>
        <Link to="/login" className="btn-primary w-full justify-center">Back to Login</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="card p-8 max-w-sm w-full">
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mb-4"><Mail size={20} className="text-primary-600" /></div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Forgot your password?</h2>
        <p className="text-slate-500 text-sm mb-6">Enter your email and we'll send you a reset link.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Email address</label>
            <input {...register('email', { required: true })} type="email" className="input" placeholder="you@example.com" />
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Send Reset Link'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-4"><Link to="/login" className="text-primary-600 hover:underline">← Back to login</Link></p>
      </div>
    </div>
  );
}

export default ForgotPassword;
