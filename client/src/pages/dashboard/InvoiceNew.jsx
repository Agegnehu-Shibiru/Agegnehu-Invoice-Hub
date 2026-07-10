import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { invoiceApi, clientApi } from '../../api';
import { Plus, Trash2, Loader2, Send, Save, Eye } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const schema = z.object({
  client: z.string().min(1, 'Select a client'),
  dueDate: z.string().min(1, 'Due date required'),
  currency: z.string().default('USD'),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  discountType: z.enum(['fixed', 'percentage']).default('fixed'),
  discountValue: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  paymentTerms: z.string().optional(),
  lineItems: z.array(z.object({
    description: z.string().min(1, 'Description required'),
    quantity: z.coerce.number().min(0.01, 'Qty > 0'),
    rate: z.coerce.number().min(0, 'Rate >= 0'),
  })).min(1, 'Add at least one item'),
});

const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR'];

export default function InvoiceNew() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: clientsData } = useQuery({ queryKey: ['clients-all'], queryFn: () => clientApi.getAll({ limit: 100 }).then((r) => r.data.data.clients) });

  const { register, handleSubmit, watch, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { currency: user?.settings?.currency || 'USD', taxRate: user?.settings?.taxRate || 0, discountType: 'fixed', discountValue: 0, paymentTerms: user?.settings?.paymentTerms || 'Net 30', lineItems: [{ description: '', quantity: 1, rate: 0 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });
  const watchedValues = watch();

  const calcTotals = useCallback(() => {
    const items = watchedValues.lineItems || [];
    const subtotal = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.rate) || 0), 0);
    const disc = watchedValues.discountType === 'percentage' ? (subtotal * (Number(watchedValues.discountValue) || 0)) / 100 : (Number(watchedValues.discountValue) || 0);
    const taxable = subtotal - disc;
    const tax = (taxable * (Number(watchedValues.taxRate) || 0)) / 100;
    return { subtotal, discountAmount: disc, taxAmount: tax, total: taxable + tax };
  }, [watchedValues]);

  const totals = calcTotals();
  const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: watchedValues.currency || 'USD' }).format(v);

  const onSubmit = async (data, action = 'draft') => {
    setSaving(true);
    try {
      const res = await invoiceApi.create({ ...data, status: action === 'send' ? 'draft' : 'draft' });
      const invoice = res.data.data.invoice;
      if (action === 'send') {
        await invoiceApi.send(invoice._id);
        toast.success('Invoice sent to client!');
      } else {
        toast.success('Invoice saved as draft');
      }
      navigate(`/dashboard/invoices/${invoice._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">New Invoice</h1>
          <p className="text-slate-500 text-sm mt-0.5">Fill in the details below to create your invoice</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPreview(!preview)} className="btn-secondary">
            <Eye size={15} /> {preview ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>

      <form className="grid lg:grid-cols-5 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-3 space-y-6">
          {/* Client & Dates */}
          <div className="card p-6 space-y-4">
            <h2 className="section-title">Invoice Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Client *</label>
                <select {...register('client')} className="input">
                  <option value="">Select client...</option>
                  {clientsData?.map((c) => <option key={c._id} value={c._id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
                </select>
                {errors.client && <p className="text-red-500 text-xs mt-1">{errors.client.message}</p>}
              </div>
              <div>
                <label className="label">Due Date *</label>
                <input {...register('dueDate')} type="date" className="input" min={new Date().toISOString().split('T')[0]} />
                {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate.message}</p>}
              </div>
              <div>
                <label className="label">Currency</label>
                <select {...register('currency')} className="input">
                  {currencies.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Payment Terms</label>
                <select {...register('paymentTerms')} className="input">
                  {['Net 7', 'Net 14', 'Net 30', 'Net 60', 'Due on Receipt'].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="card p-6">
            <h2 className="section-title mb-4">Line Items</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide px-1">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>
              {fields.map((field, i) => {
                const qty = Number(watchedValues.lineItems?.[i]?.quantity) || 0;
                const rate = Number(watchedValues.lineItems?.[i]?.rate) || 0;
                return (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-6">
                      <input {...register(`lineItems.${i}.description`)} className="input" placeholder="Service or product description" />
                      {errors.lineItems?.[i]?.description && <p className="text-red-500 text-xs mt-0.5">{errors.lineItems[i].description.message}</p>}
                    </div>
                    <div className="col-span-2">
                      <input {...register(`lineItems.${i}.quantity`)} type="number" step="0.01" min="0" className="input text-center" placeholder="1" />
                    </div>
                    <div className="col-span-2">
                      <input {...register(`lineItems.${i}.rate`)} type="number" step="0.01" min="0" className="input text-right" placeholder="0.00" />
                    </div>
                    <div className="col-span-1 flex items-center justify-end pt-2.5 text-sm font-medium text-slate-700">{fmt(qty * rate)}</div>
                    <div className="col-span-1 flex items-center justify-center pt-2">
                      {fields.length > 1 && <button type="button" onClick={() => remove(i)} className="text-slate-300 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>}
                    </div>
                  </div>
                );
              })}
              {errors.lineItems?.root && <p className="text-red-500 text-xs">{errors.lineItems.root.message}</p>}
            </div>
            <button type="button" onClick={() => append({ description: '', quantity: 1, rate: 0 })} className="btn-ghost mt-4 text-primary-600 hover:text-primary-700 hover:bg-primary-50">
              <Plus size={15} /> Add Line Item
            </button>
          </div>

          {/* Notes */}
          <div className="card p-6">
            <label className="label">Notes</label>
            <textarea {...register('notes')} className="input" rows={3} placeholder="Payment instructions, thank you note, or any other details..." />
          </div>
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-6 space-y-4 sticky top-24">
            <h2 className="section-title">Summary</h2>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium">{fmt(totals.subtotal)}</span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-slate-500 flex-1">Discount</span>
                  <select {...register('discountType')} className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white">
                    <option value="fixed">Fixed</option>
                    <option value="percentage">%</option>
                  </select>
                  <input {...register('discountValue')} type="number" min="0" step="0.01" className="w-20 text-xs border border-slate-200 rounded-lg px-2 py-1 text-right bg-white" placeholder="0" />
                </div>
                {totals.discountAmount > 0 && <div className="flex justify-between text-sm text-emerald-600"><span>—</span><span>-{fmt(totals.discountAmount)}</span></div>}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 flex-1">Tax (%)</span>
                <input {...register('taxRate')} type="number" min="0" max="100" step="0.1" className="w-20 text-xs border border-slate-200 rounded-lg px-2 py-1 text-right bg-white" placeholder="0" />
              </div>
              {totals.taxAmount > 0 && <div className="flex justify-between text-sm text-slate-500"><span>Tax</span><span>+{fmt(totals.taxAmount)}</span></div>}
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
              <span className="font-bold text-slate-900">Total</span>
              <span className="text-2xl font-bold text-primary-600">{fmt(totals.total)}</span>
            </div>

            <div className="space-y-2 pt-2">
              <button type="button" onClick={handleSubmit((d) => onSubmit(d, 'send'))} disabled={isSubmitting || saving} className="btn-primary w-full justify-center">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Save & Send Invoice
              </button>
              <button type="button" onClick={handleSubmit((d) => onSubmit(d, 'draft'))} disabled={isSubmitting || saving} className="btn-secondary w-full justify-center">
                <Save size={15} /> Save as Draft
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
