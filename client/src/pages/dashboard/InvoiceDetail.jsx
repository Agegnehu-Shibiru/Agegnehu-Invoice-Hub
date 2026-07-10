// InvoiceDetail.jsx
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { invoiceApi } from '../../api';
import { ArrowLeft, Send, Download, Copy, CheckCircle, Loader2, DollarSign } from 'lucide-react';

const fmt = (v, cur = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(v);

export default function InvoiceDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({ queryKey: ['invoice', id], queryFn: () => invoiceApi.getOne(id).then((r) => r.data.data.invoice) });
  const sendMutation = useMutation({ mutationFn: () => invoiceApi.send(id), onSuccess: () => { qc.invalidateQueries(['invoice', id]); toast.success('Invoice sent!'); } });
  const markPaidMutation = useMutation({ mutationFn: () => invoiceApi.markPaid(id, { paymentMethod: 'manual' }), onSuccess: () => { qc.invalidateQueries(['invoice', id]); toast.success('Marked as paid!'); } });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-500" size={28} /></div>;
  if (!data) return <div className="text-center text-slate-500 py-12">Invoice not found.</div>;

  const shareUrl = `${window.location.origin}/pay/${data.shareToken}`;

  return (
    <div className="animate-slide-up space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <h1 className="page-title">{data.invoiceNumber}</h1>
          <div className="flex items-center gap-2 mt-1"><span className={`badge-${data.status}`}>{data.status}</span><span className="text-slate-400 text-xs">· {data.client?.name}</span></div>
        </div>
        <div className="flex gap-2">
          {data.status === 'draft' && <button onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending} className="btn-primary"><Send size={15} />Send</button>}
          {['sent', 'viewed', 'overdue'].includes(data.status) && <button onClick={() => markPaidMutation.mutate()} className="btn-primary bg-emerald-600 hover:bg-emerald-700"><CheckCircle size={15} />Mark Paid</button>}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Invoice view */}
        <div className="lg:col-span-2 card p-8 font-[sans-serif]">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-bold text-primary-600">INVOICE</h2>
              <p className="text-slate-500 text-sm mt-1">{data.invoiceNumber}</p>
            </div>
            <div className="text-right text-sm text-slate-600">
              <p className="font-semibold">Issue Date: {new Date(data.issueDate).toLocaleDateString()}</p>
              <p className={data.status === 'overdue' ? 'text-red-600 font-semibold' : ''}>Due: {new Date(data.dueDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">From</p>
              <p className="font-semibold text-slate-800">{data.user?.name || 'Your Business'}</p>
              <p className="text-sm text-slate-500">{data.user?.email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">To</p>
              <p className="font-semibold text-slate-800">{data.client?.name}</p>
              {data.client?.company && <p className="text-sm text-slate-500">{data.client.company}</p>}
              <p className="text-sm text-slate-500">{data.client?.email}</p>
            </div>
          </div>

          <table className="w-full text-sm mb-6">
            <thead className="bg-slate-50 border-y border-slate-200">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Description</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase w-16">Qty</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase w-24">Rate</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase w-24">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.lineItems.map((item, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="px-3 py-3 text-slate-700">{item.description}</td>
                  <td className="px-3 py-3 text-center text-slate-500">{item.quantity}</td>
                  <td className="px-3 py-3 text-right text-slate-500">{fmt(item.rate, data.currency)}</td>
                  <td className="px-3 py-3 text-right font-medium">{fmt(item.amount, data.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{fmt(data.subtotal, data.currency)}</span></div>
              {data.discountAmount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{fmt(data.discountAmount, data.currency)}</span></div>}
              {data.taxAmount > 0 && <div className="flex justify-between"><span className="text-slate-500">Tax ({data.taxRate}%)</span><span>{fmt(data.taxAmount, data.currency)}</span></div>}
              <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-2">
                <span>Total</span><span className="text-primary-600">{fmt(data.total, data.currency)}</span>
              </div>
            </div>
          </div>

          {data.notes && <div className="mt-6 p-4 bg-slate-50 rounded-xl text-sm text-slate-600"><strong>Notes:</strong> {data.notes}</div>}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-slate-800 mb-3">Payment Link</h3>
            <div className="flex gap-2">
              <input readOnly value={shareUrl} className="input text-xs flex-1" />
              <button onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success('Copied!'); }} className="btn-secondary px-3"><Copy size={14} /></button>
            </div>
          </div>

          <div className="card p-5 space-y-2">
            <h3 className="font-semibold text-slate-800 mb-1">Details</h3>
            {[['Currency', data.currency], ['Payment Terms', data.paymentTerms], ['Views', data.viewCount]].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm"><span className="text-slate-500">{k}</span><span className="font-medium">{v}</span></div>
            ))}
            {data.paidAt && <div className="flex justify-between text-sm"><span className="text-slate-500">Paid At</span><span className="font-medium text-emerald-600">{new Date(data.paidAt).toLocaleDateString()}</span></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
