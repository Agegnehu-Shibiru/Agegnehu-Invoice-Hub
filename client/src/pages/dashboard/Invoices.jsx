// Invoices.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { invoiceApi } from '../../api';
import { Plus, Search, Filter, Send, Trash2, Eye, CheckCircle, Loader2 } from 'lucide-react';

const statusOptions = ['all', 'draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'];
const fmt = (v, cur = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(v);

export default function Invoices() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ status: 'all', search: '', page: 1 });

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => invoiceApi.getAll({ ...filters, status: filters.status === 'all' ? undefined : filters.status }).then((r) => r.data.data),
  });

  const deleteMutation = useMutation({ mutationFn: invoiceApi.delete, onSuccess: () => { qc.invalidateQueries(['invoices']); toast.success('Invoice deleted'); } });
  const sendMutation = useMutation({ mutationFn: invoiceApi.send, onSuccess: () => { qc.invalidateQueries(['invoices']); toast.success('Invoice sent!'); } });

  return (
    <div className="animate-slide-up space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Invoices</h1>
        <Link to="/dashboard/invoices/new" className="btn-primary"><Plus size={16} />New Invoice</Link>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search by invoice number..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} />
        </div>
        <select className="input sm:w-40" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}>
          {statusOptions.map((s) => <option key={s} value={s}>{s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Invoice #</th><th>Client</th><th>Amount</th><th>Issue Date</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-500 mx-auto" /></td></tr>
              ) : data?.invoices?.length > 0 ? data.invoices.map((inv) => (
                <tr key={inv._id}>
                  <td><Link to={`/dashboard/invoices/${inv._id}`} className="text-primary-600 font-semibold hover:underline">{inv.invoiceNumber}</Link></td>
                  <td>
                    <div className="font-medium text-slate-800">{inv.client?.name || '—'}</div>
                    {inv.client?.company && <div className="text-xs text-slate-400">{inv.client.company}</div>}
                  </td>
                  <td className="font-semibold">{fmt(inv.total, inv.currency)}</td>
                  <td className="text-slate-500 text-xs">{new Date(inv.issueDate).toLocaleDateString()}</td>
                  <td className="text-slate-500 text-xs">{new Date(inv.dueDate).toLocaleDateString()}</td>
                  <td><span className={`badge-${inv.status}`}>{inv.status}</span></td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Link to={`/dashboard/invoices/${inv._id}`} className="btn-ghost p-1.5"><Eye size={14} /></Link>
                      {inv.status === 'draft' && (
                        <button onClick={() => sendMutation.mutate(inv._id)} className="btn-ghost p-1.5 text-primary-600"><Send size={14} /></button>
                      )}
                      <button onClick={() => { if (confirm('Delete this invoice?')) deleteMutation.mutate(inv._id); }} className="btn-ghost p-1.5 text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="text-center text-slate-400 py-12">
                  No invoices found. <Link to="/dashboard/invoices/new" className="text-primary-600 hover:underline">Create your first invoice</Link>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && data.pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-sm text-slate-500">Showing page {filters.page} of {data.pagination.pages}</p>
            <div className="flex gap-2">
              <button disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })} className="btn-secondary py-1.5 px-3 text-xs">Previous</button>
              <button disabled={filters.page >= data.pagination.pages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })} className="btn-secondary py-1.5 px-3 text-xs">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
