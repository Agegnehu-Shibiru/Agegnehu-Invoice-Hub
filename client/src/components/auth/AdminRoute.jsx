import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuthStore();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/dashboard" replace />;
  return children;
}
