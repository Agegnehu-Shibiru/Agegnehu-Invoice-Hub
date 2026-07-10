// Payments.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '../../api';
import { Download, Loader2, CreditCard, CheckCircle, XCircle } from 'lucide-react';

const fmt = (v, cur = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(v);

export function Payments() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['payments', page],
    queryFn: () => paymentApi.getHistory({ page, limit: 20 }).then((r) => r.data.data),
  });

  const exportCSV = () => {
    const rows = [['Date', 'Invoice', 'Client', 'Amount', 'Currency', 'Provider', 'Status']];
    data?.payments?.forEach((p) => {
      rows.push([new Date(p.createdAt).toLocaleDateString(), p.invoice?.invoiceNumber || '—', p.client?.name || '—', p.amount, p.currency, p.provider, p.status]);
    });
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'payments.csv'; a.click();
  };

  const statusIcon = (s) => s === 'succeeded' ? <CheckCircle size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-red-400" />;

  return (
    <div className="animate-slide-up space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Payment History</h1>
        <button onClick={exportCSV} disabled={!data?.payments?.length} className="btn-secondary">
          <Download size={15} /> Export CSV
        </button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th><th>Invoice</th><th>Client</th><th>Amount</th>
                <th>Provider</th><th>Status</th><th>Transaction ID</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-500 mx-auto" /></td></tr>
              ) : data?.payments?.length > 0 ? data.payments.map((p) => (
                <tr key={p._id}>
                  <td className="text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="font-medium text-primary-600">{p.invoice?.invoiceNumber || '—'}</td>
                  <td>{p.client?.name || '—'}</td>
                  <td className="font-semibold text-emerald-600">{fmt(p.amount, p.currency)}</td>
                  <td><span className="capitalize inline-flex items-center gap-1.5 text-xs font-medium"><CreditCard size={12} />{p.provider}</span></td>
                  <td><span className={`inline-flex items-center gap-1.5 text-xs font-medium ${p.status === 'succeeded' ? 'text-emerald-600' : 'text-red-500'}`}>{statusIcon(p.status)} {p.status}</span></td>
                  <td className="text-xs font-mono text-slate-400 max-w-[120px] truncate">{p.providerPaymentId || p._id}</td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="text-center text-slate-400 py-12">No payments recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {data?.pagination?.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-sm text-slate-500">Page {page} of {data.pagination.pages}</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1.5 px-3 text-xs">Previous</button>
              <button disabled={page >= data.pagination.pages} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1.5 px-3 text-xs">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Payments;
