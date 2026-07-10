// Clients.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { clientApi } from '../../api';
import { Plus, Search, Edit2, Trash2, X, Loader2, Building2, Mail, Phone } from 'lucide-react';

function ClientModal({ client, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!client;
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: client || {} });

  const onSubmit = async (data) => {
    try {
      if (isEdit) { await clientApi.update(client._id, data); toast.success('Client updated'); }
      else { await clientApi.create(data); toast.success('Client added'); }
      qc.invalidateQueries(['clients']);
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="card w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title">{isEdit ? 'Edit Client' : 'Add Client'}</h2>
          <button onClick={onClose} className="btn-ghost p-1"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Name *</label><input {...register('name', { required: true })} className="input" placeholder="John Smith" /></div>
            <div><label className="label">Email</label><input {...register('email')} type="email" className="input" placeholder="client@example.com" /></div>
            <div><label className="label">Phone</label><input {...register('phone')} className="input" placeholder="+1 555 000 0000" /></div>
            <div><label className="label">Company</label><input {...register('company')} className="input" placeholder="ACME Corp" /></div>
            <div><label className="label">City</label><input {...register('address.city')} className="input" /></div>
            <div><label className="label">Country</label><input {...register('address.country')} className="input" defaultValue="US" /></div>
          </div>
          <div><label className="label">Notes</label><textarea {...register('notes')} className="input" rows={2} /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center">
              {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : isEdit ? 'Save Changes' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Clients() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'new' | client object

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => clientApi.getAll({ search: search || undefined }).then((r) => r.data.data.clients),
  });

  const deleteMutation = useMutation({ mutationFn: clientApi.delete, onSuccess: () => { qc.invalidateQueries(['clients']); toast.success('Client deleted'); } });

  return (
    <div className="animate-slide-up space-y-6">
      {modal && <ClientModal client={modal === 'new' ? null : modal} onClose={() => setModal(null)} />}
      <div className="flex items-center justify-between">
        <h1 className="page-title">Clients</h1>
        <button onClick={() => setModal('new')} className="btn-primary"><Plus size={16} />Add Client</button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary-500" size={24} /></div> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.length > 0 ? data.map((client) => (
            <div key={client._id} className="card p-5 hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-700 font-bold text-lg flex-shrink-0">
                  {client.name[0].toUpperCase()}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setModal(client)} className="btn-ghost p-1.5"><Edit2 size={13} /></button>
                  <button onClick={() => { if (confirm('Delete this client?')) deleteMutation.mutate(client._id); }} className="btn-ghost p-1.5 text-red-400"><Trash2 size={13} /></button>
                </div>
              </div>
              <h3 className="font-semibold text-slate-900">{client.name}</h3>
              {client.company && <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5"><Building2 size={11} />{client.company}</div>}
              {client.email && <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5"><Mail size={11} />{client.email}</div>}
              {client.phone && <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5"><Phone size={11} />{client.phone}</div>}
              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
                <div><p className="font-semibold text-slate-800">{client.stats?.totalInvoices || 0}</p><p className="text-slate-400">Invoices</p></div>
                <div><p className="font-semibold text-emerald-600">${(client.stats?.totalPaid || 0).toFixed(0)}</p><p className="text-slate-400">Paid</p></div>
              </div>
            </div>
          )) : (
            <div className="col-span-3 text-center text-slate-400 py-12 card">No clients yet. Add your first client to get started.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default Clients;
