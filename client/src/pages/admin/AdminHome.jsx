// AdminHome.jsx
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api';
import { Users, FileText, DollarSign, TrendingDown, Activity, Loader2 } from 'lucide-react';

const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0);

export function AdminHome() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: () => adminApi.getStats().then((r) => r.data.data.stats) });
  const s = data || {};

  const cards = [
    { label: 'Total Users', value: s.totalUsers || 0, icon: Users, color: 'text-blue-400' },
    { label: 'Total Invoices', value: s.totalInvoices || 0, icon: FileText, color: 'text-purple-400' },
    { label: 'MRR', value: fmt(s.mrr), icon: DollarSign, color: 'text-emerald-400' },
    { label: 'Active Subscriptions', value: s.activeSubscriptions || 0, icon: Activity, color: 'text-cyan-400' },
    { label: 'New Users (This Month)', value: s.newUsersThisMonth || 0, icon: Users, color: 'text-yellow-400' },
    { label: 'Churn (This Month)', value: s.churnThisMonth || 0, icon: TrendingDown, color: 'text-red-400' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-slate-400 mt-1">Real-time stats across all users and invoices.</p>
      </div>
      {isLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-400" size={28} /></div> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-400 text-sm">{c.label}</p>
                <c.icon size={16} className={c.color} />
              </div>
              <p className="text-3xl font-bold text-white">{c.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminHome;
