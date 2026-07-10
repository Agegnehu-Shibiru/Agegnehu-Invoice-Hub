// AdminInvoices.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi, invoiceApi } from '../../api';
import { Loader2, Search } from 'lucide-react';

export function AdminInvoices() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // Reuse invoice API with admin flag - in production, create a dedicated admin invoices endpoint
  const { data, isLoading } = useQuery({
    queryKey: ['admin-invoices', page, search],
    queryFn: () => invoiceApi.getAll({ page, limit: 20, search: search || undefined }).then((r) => r.data.data),
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">All Invoices</h1>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500" placeholder="Search invoice #..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900">
              <tr>{['Invoice #', 'Client', 'Amount', 'Status', 'Created'].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr>
            </thead>
            <tbody>
              {isLoading ? <tr><td colSpan={5} className="text-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary-400 mx-auto" /></td></tr> :
                data?.invoices?.map((inv) => (
                  <tr key={inv._id} className="border-t border-slate-700/50">
                    <td className="px-4 py-3 text-primary-400 font-mono text-xs">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-slate-300">{inv.client?.name || '—'}</td>
                    <td className="px-4 py-3 text-white font-semibold">${inv.total?.toFixed(2)}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-semibold capitalize px-2 py-1 rounded-full ${inv.status === 'paid' ? 'bg-emerald-900/40 text-emerald-400' : inv.status === 'overdue' ? 'bg-red-900/40 text-red-400' : 'bg-slate-700 text-slate-300'}`}>{inv.status}</span></td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(inv.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// AdminApiTracker.jsx
export function AdminApiTracker() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-api-tracker', page],
    queryFn: () => adminApi.getApiTracker({ page, limit: 30 }).then((r) => r.data.data),
  });

  const statusColor = (code) => code >= 500 ? 'text-red-400' : code >= 400 ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">API Tracker</h1>
      {data?.endpointStats && (
        <div className="grid sm:grid-cols-3 gap-4">
          {data.endpointStats.slice(0, 3).map((ep) => (
            <div key={ep._id.endpoint + ep._id.method} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <p className="text-xs font-mono text-slate-400 truncate">{ep._id.method} {ep._id.endpoint}</p>
              <p className="text-2xl font-bold text-white mt-1">{ep.count}</p>
              <p className="text-xs text-slate-500">Avg {Math.round(ep.avgResponseTime)}ms</p>
            </div>
          ))}
        </div>
      )}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-900"><tr>{['Time', 'User', 'Method', 'Endpoint', 'Status', 'Time(ms)'].map((h) => <th key={h} className="px-4 py-3 text-left text-slate-500 uppercase font-semibold tracking-wide">{h}</th>)}</tr></thead>
            <tbody>
              {isLoading ? <tr><td colSpan={6} className="text-center py-10"><Loader2 className="animate-spin text-primary-400 mx-auto" size={20} /></td></tr> :
                data?.logs?.map((log) => (
                  <tr key={log._id} className="border-t border-slate-700/50">
                    <td className="px-4 py-2.5 text-slate-500">{new Date(log.createdAt).toLocaleTimeString()}</td>
                    <td className="px-4 py-2.5 text-slate-400 truncate max-w-[100px]">{log.user?.email || log.ip || '—'}</td>
                    <td className="px-4 py-2.5"><span className="font-mono font-bold text-slate-300">{log.method}</span></td>
                    <td className="px-4 py-2.5 text-slate-400 font-mono truncate max-w-[200px]">{log.endpoint}</td>
                    <td className="px-4 py-2.5"><span className={`font-bold ${statusColor(log.statusCode)}`}>{log.statusCode}</span></td>
                    <td className="px-4 py-2.5 text-slate-400">{log.responseTime}ms</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {data?.pagination?.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
            <span className="text-slate-500 text-xs">Page {page} of {data.pagination.pages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="text-xs text-slate-400 px-3 py-1.5 bg-slate-700 rounded-lg disabled:opacity-40">Prev</button>
              <button disabled={page >= data.pagination.pages} onClick={() => setPage(p => p + 1)} className="text-xs text-slate-400 px-3 py-1.5 bg-slate-700 rounded-lg disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// AdminEmailLogs.jsx
export function AdminEmailLogs() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-email-logs', page],
    queryFn: () => adminApi.getEmailLogs({ page, limit: 20 }).then((r) => r.data.data),
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">Email Logs</h1>
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900"><tr>{['Sent At', 'To', 'Subject', 'Template', 'Status'].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr></thead>
            <tbody>
              {isLoading ? <tr><td colSpan={5} className="text-center py-10"><Loader2 className="animate-spin text-primary-400 mx-auto" size={20} /></td></tr> :
                data?.emails?.map((log) => (
                  <tr key={log._id} className="border-t border-slate-700/50">
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-300 text-xs truncate max-w-[150px]">{log.to}</td>
                    <td className="px-4 py-3 text-slate-300 text-xs truncate max-w-[200px]">{log.subject}</td>
                    <td className="px-4 py-3"><span className="text-xs font-mono text-slate-400">{log.template}</span></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${log.status === 'sent' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>{log.status}</span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminInvoices;
