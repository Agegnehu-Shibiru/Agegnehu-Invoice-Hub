import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard, FileText, Users, CreditCard, Settings,
  User, Star, LogOut, Menu, X, ChevronRight, Bell, Zap,
  Receipt
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/dashboard/invoices', icon: FileText, label: 'Invoices' },
  { to: '/dashboard/clients', icon: Users, label: 'Clients' },
  { to: '/dashboard/payments', icon: CreditCard, label: 'Payments' },
];
const bottomItems = [
  { to: '/dashboard/subscription', icon: Star, label: 'Subscription' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
  { to: '/dashboard/profile', icon: User, label: 'Profile' },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const Sidebar = ({ mobile = false }) => (
    <aside className={`flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-800 text-white ${mobile ? 'w-full' : 'w-[260px]'}`}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Receipt size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">InvoiceHub <span className="text-primary-400">Pro</span></span>
        </div>
      </div>

      {/* Plan badge */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
          <Zap size={13} className="text-yellow-400" />
          <span className="text-xs font-semibold text-slate-300 capitalize">{user?.subscription?.plan || 'free'} Plan</span>
          {user?.subscription?.plan === 'free' && (
            <NavLink to="/dashboard/subscription" className="ml-auto text-xs text-primary-400 font-semibold hover:text-primary-300">Upgrade</NavLink>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Menu</p>
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink key={to} to={to} end={exact} onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Icon size={17} />{label}
          </NavLink>
        ))}
        <div className="pt-4">
          <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Account</p>
          {bottomItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Icon size={17} />{label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {user?.avatar ? <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" /> : user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/5" title="Logout">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col fixed inset-y-0 left-0 z-30 w-[260px]">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div className="fixed inset-0 z-40 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <motion.div className="relative z-10 h-full w-72" initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'spring', damping: 30 }}>
              <Sidebar mobile />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-[260px] min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center px-4 md:px-6 gap-4 flex-shrink-0 sticky top-0 z-20">
          <button className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 relative">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full" />
          </button>
          <NavLink to="/dashboard/invoices/new" className="btn-primary text-xs px-3 py-2">
            + New Invoice
          </NavLink>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
