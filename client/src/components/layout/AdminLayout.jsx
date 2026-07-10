import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LayoutDashboard, Users, FileText, Activity, Mail, LogOut, Shield, Receipt } from 'lucide-react';

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview', exact: true },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/invoices', icon: FileText, label: 'Invoices' },
  { to: '/admin/api-tracker', icon: Activity, label: 'API Tracker' },
  { to: '/admin/email-logs', icon: Mail, label: 'Email Logs' },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <aside className="w-64 flex flex-col bg-slate-900 border-r border-slate-800 flex-shrink-0">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2.5">
          <Shield size={18} className="text-red-400" />
          <span className="font-bold text-white">Admin Panel</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {adminNav.map(({ to, icon: Icon, label, exact }) => (
            <NavLink key={to} to={to} end={exact}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${isActive ? 'text-white bg-slate-700' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <Icon size={16} />{label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-red-900 flex items-center justify-center text-sm font-bold text-red-200">{user?.name?.[0]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <NavLink to="/dashboard" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white mb-1 px-1"><Receipt size={13} />Client Dashboard</NavLink>
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-slate-400 hover:text-red-400 px-1"><LogOut size={13} />Sign Out</button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
