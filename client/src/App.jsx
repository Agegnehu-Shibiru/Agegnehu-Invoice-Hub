import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';

// Layouts
import PublicLayout from './components/layout/PublicLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import AdminLayout from './components/layout/AdminLayout';

// Auth guards
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';

// Public pages
import Landing from './pages/public/Landing';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import Career from './pages/public/Career';
import Security from './pages/public/Security';
import Pricing from './pages/public/Pricing';
import Privacy from './pages/public/Privacy';
import Terms from './pages/public/Terms';
import Blog from './pages/public/Blog';
import BlogPostDetails from './pages/public/BlogPostDetails';
import PublicInvoice from './pages/public/PublicInvoice';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';

// Dashboard pages
import DashboardHome from './pages/dashboard/DashboardHome';
import Invoices from './pages/dashboard/Invoices';
import InvoiceNew from './pages/dashboard/InvoiceNew';
import InvoiceDetail from './pages/dashboard/InvoiceDetail';
import Clients from './pages/dashboard/Clients';
import Payments from './pages/dashboard/Payments';
import Profile from './pages/dashboard/Profile';
import Settings from './pages/dashboard/Settings';
import Subscription from './pages/dashboard/Subscription';

// Admin pages
import AdminHome from './pages/admin/AdminHome';
import AdminUsers from './pages/admin/AdminUsers';
import AdminInvoices from './pages/admin/AdminInvoices';
import AdminApiTracker from './pages/admin/AdminApiTracker';
import AdminEmailLogs from './pages/admin/AdminEmailLogs';

export default function App() {
  const { fetchUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/career" element={<Career />} />
        <Route path="/security" element={<Security />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPostDetails />} />
        <Route path="/pay/:shareToken" element={<PublicInvoice />} />
      </Route>

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />

      {/* Dashboard */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardHome />} />
        <Route path="/dashboard/invoices" element={<Invoices />} />
        <Route path="/dashboard/invoices/new" element={<InvoiceNew />} />
        <Route path="/dashboard/invoices/:id" element={<InvoiceDetail />} />
        <Route path="/dashboard/clients" element={<Clients />} />
        <Route path="/dashboard/payments" element={<Payments />} />
        <Route path="/dashboard/profile" element={<Profile />} />
        <Route path="/dashboard/settings" element={<Settings />} />
        <Route path="/dashboard/subscription" element={<Subscription />} />
      </Route>

      {/* Admin */}
      <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/invoices" element={<AdminInvoices />} />
        <Route path="/admin/api-tracker" element={<AdminApiTracker />} />
        <Route path="/admin/email-logs" element={<AdminEmailLogs />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
