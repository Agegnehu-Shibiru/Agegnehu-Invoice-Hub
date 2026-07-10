import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { invoiceApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, DollarSign, Clock, AlertTriangle, Plus, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = ['#4f46e5', '#22d3ee', '#f59e0b', '#ef4444'];

const formatCurrency = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function DashboardHome() {
  const { user } = useAuthStore();
  const { data: statsData, isLoading } = useQuery({ queryKey: ['invoice-stats'], queryFn: () => invoiceApi.getStats().then((r) => r.data.data.stats) });
  const { data: recentData } = useQuery({ queryKey: ['invoices', { page: 1, limit: 5 }], queryFn: () => invoiceApi.getAll({ page: 1, limit: 5 }).then((r) => r.data.data) });

  const stats = statsData || {};
  const revenueChartData = (stats.revenueData || []).map((d) => ({ month: monthNames[(d._id.month || 1) - 1], revenue: d.revenue || 0 }));

  const pieData = [
    { name: 'Paid', value: stats.paid || 0 },
    { name: 'Outstanding', value: (stats.total || 0) - (stats.paid || 0) - (stats.overdue || 0) },
    { name: 'Overdue', value: stats.overdue || 0 },
  ].filter((d) => d.value > 0);

  const statCards = [
    { label: 'Total Invoices', value: stats.total || 0, icon: FileText, color: 'text-primary-600 bg-primary-50', change: 'All time' },
    { label: 'Paid Invoices', value: stats.paid || 0, icon: DollarSign, color: 'text-emerald-600 bg-emerald-50', change: 'Collected' },
    { label: 'Outstanding', value: formatCurrency(stats.outstanding || 0), icon: Clock, color: 'text-amber-600 bg-amber-50', change: 'Awaiting payment' },
    { label: 'Overdue', value: stats.overdue || 0, icon: AlertTriangle, color: 'text-red-600 bg-red-50', change: 'Needs attention' },
  ];

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-slate-500 mt-1">Here's what's happening with your invoices today.</p>
        </div>
        <Link to="/dashboard/invoices/new" className="btn-primary hidden sm:inline-flex">
          <Plus size={16} /> New Invoice
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={card.label} className="stat-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{isLoading ? '...' : card.value}</p>
            <p className="text-sm font-medium text-slate-600 mt-0.5">{card.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{card.change}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">Revenue Overview</h2>
            <span className="text-xs text-slate-400">Last 12 months</span>
          </div>
          {revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px' }} />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2.5} fill="url(#colorRevenue)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">No revenue data yet. Create and send invoices to see your analytics.</div>
          )}
        </div>

        {/* Status pie */}
        <div className="card p-6">
          <h2 className="section-title mb-6">Invoice Status</h2>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                      <span className="text-slate-600">{entry.name}</span>
                    </div>
                    <span className="font-semibold text-slate-800">{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm text-center">Create invoices to see status breakdown.</div>
          )}
        </div>
      </div>

      {/* Recent invoices */}
      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="section-title">Recent Invoices</h2>
          <Link to="/dashboard/invoices" className="text-sm text-primary-600 hover:underline flex items-center gap-1">View all <ArrowRight size={14} /></Link>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Invoice</th><th>Client</th><th>Amount</th><th>Due Date</th><th>Status</th></tr></thead>
            <tbody>
              {recentData?.invoices?.length > 0 ? recentData.invoices.map((inv) => (
                <tr key={inv._id}>
                  <td><Link to={`/dashboard/invoices/${inv._id}`} className="text-primary-600 font-medium hover:underline">{inv.invoiceNumber}</Link></td>
                  <td className="text-slate-600">{inv.client?.name || '—'}</td>
                  <td className="font-semibold">{formatCurrency(inv.total)}</td>
                  <td className="text-slate-500 text-xs">{new Date(inv.dueDate).toLocaleDateString()}</td>
                  <td><span className={`badge-${inv.status}`}>{inv.status}</span></td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="text-center text-slate-400 py-8">No invoices yet. <Link to="/dashboard/invoices/new" className="text-primary-600 hover:underline">Create your first</Link></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
