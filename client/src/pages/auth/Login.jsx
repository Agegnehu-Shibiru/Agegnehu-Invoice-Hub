// ── Login.jsx ──────────────────────────────────────────────────────────────────
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { authApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { Eye, EyeOff, Loader2, Receipt } from 'lucide-react';
// Import icons from react-icons
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook, FaXTwitter } from 'react-icons/fa6';

const schema = z.object({ email: z.string().email('Valid email required'), password: z.string().min(1, 'Password required') });

export function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const onSubmit = async (data) => {
    try {
      const res = await authApi.login(data);
      login(res.data.data.user);
      navigate(from, { replace: true });
      toast.success('Welcome back!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  const oauthLogin = (provider) => { window.location.href = `/api/v1/auth/${provider}`; };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-primary-50">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-slate-900 to-primary-900 p-12">
        <div className="text-white max-w-md">
          <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center mb-8">
            <Receipt size={24} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">Invoice smarter.<br/>Get paid faster.</h1>
          <p className="text-slate-300 text-lg leading-relaxed">Join thousands of freelancers and small businesses who use InvoiceHub Pro to manage their invoicing effortlessly.</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center"><Receipt size={16} className="text-white" /></div>
              <span className="font-bold text-slate-900">InvoiceHub Pro</span>
            </Link>
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 mt-1">Sign in to your account to continue</p>
          </div>

          {/* OAuth buttons with icons */}
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
            <div className="relative flex justify-center text-xs text-slate-400 bg-white px-3"><span>or continue with email</span></div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input {...register('email')} type="email" className="input" placeholder="you@example.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary-600 hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input {...register('password')} type={showPass ? 'text' : 'password'} className="input pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-3">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 font-semibold hover:underline">Create one free</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default Login;