import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authApi } from '../../api';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="card p-10 max-w-sm w-full text-center">
        {status === 'loading' && <><Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" /><p className="text-slate-600">Verifying your email...</p></>}
        {status === 'success' && <>
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Email Verified!</h2>
          <p className="text-slate-500 text-sm mb-6">Your account is now active. You can log in.</p>
          <Link to="/login" className="btn-primary w-full justify-center">Go to Login</Link>
        </>}
        {status === 'error' && <>
          <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Verification Failed</h2>
          <p className="text-slate-500 text-sm mb-6">The link is invalid or has expired. Please register again.</p>
          <Link to="/register" className="btn-primary w-full justify-center">Register Again</Link>
        </>}
      </div>
    </div>
  );
}
