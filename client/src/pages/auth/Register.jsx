// Register.jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { authApi } from '../../api';
import { Eye, EyeOff, Loader2, Receipt, CheckCircle2 } from 'lucide-react';
// Import icons from react-icons
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook, FaXTwitter } from 'react-icons/fa6';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Min 8 characters').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain uppercase, lowercase, and number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export default function Register() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });
  const [showPass, setShowPass] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      await authApi.register({ name: data.name, email: data.email, password: data.password });
      setSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  const oauthLogin = (provider) => { window.location.href = `/api/v1/auth/${provider}`; };

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-primary-50 px-4">
      <motion.div className="text-center max-w-md" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Check your email!</h2>
        <p className="text-slate-500">We sent a verification link to your email address. Click it to activate your account.</p>
        <Link to="/login" className="btn-primary mt-6 inline-flex">Go to Login</Link>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-primary-50 px-4 py-12">
      <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="card p-8">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center"><Receipt size={16} className="text-white" /></div>
            <span className="font-bold text-slate-900">InvoiceHub Pro</span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Create your account</h2>
          <p className="text-slate-500 mb-6">Free forever. No credit card required.</p>

          {/* OAuth buttons (same as login) */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button onClick={() => oauthLogin('google')} className="flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <FcGoogle size={18} /> Google
            </button>
            <button onClick={() => oauthLogin('facebook')} className="flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <FaFacebook size={18} className="text-[#1877F2]" /> Facebook
            </button>
            <button onClick={() => oauthLogin('twitter')} className="flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <FaXTwitter size={18} /> 
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <div className="relative flex justify-center text-xs text-slate-400 bg-white px-3"><span>or sign up with email</span></div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input {...register('name')} className="input" placeholder="John Smith" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Email address</label>
              <input {...register('email')} type="email" className="input" placeholder="you@example.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input {...register('password')} type={showPass ? 'text' : 'password'} className="input pr-10" placeholder="Min 8 chars, uppercase + number" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input {...register('confirmPassword')} type="password" className="input" placeholder="••••••••" />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-3">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <p className="text-xs text-slate-400 mt-4 text-center">
            By creating an account you agree to our <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.
          </p>
          <p className="text-center text-sm text-slate-500 mt-4">
            Already have an account? <Link to="/login" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}