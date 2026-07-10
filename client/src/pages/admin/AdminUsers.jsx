import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '../../api';
import { Search, Ban, Shield, Loader2, ChevronDown } from 'lucide-react';

export default function AdminUsers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, page, roleFilter],
    queryFn: () => adminApi.getUsers({ search: search || undefined, page, limit: 20, role: roleFilter || undefined }).then((r) => r.data.data),
  });

  const banMutation = useMutation({
    mutationFn: (id) => adminApi.banUser(id),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success('User banned'); },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => adminApi.updateUser(id, { role }),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success('Role updated'); },
  });

  const planColor = (plan) => ({ free: 'text-slate-400', pro: 'text-primary-400', business: 'text-violet-400' })[plan] || 'text-slate-400';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <span className="text-slate-400 text-sm">{data?.pagination?.total || 0} total</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500">
          <option value="">All Roles</option>
          {['user', 'admin', 'superadmin'].map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900">
              <tr>
                {['User', 'Email', 'Role', 'Plan', 'Verified', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-400 mx-auto" /></td></tr>
              ) : data?.users?.map((user) => (
                <tr key={user._id} className="border-t border-slate-700/50 hover:bg-slate-750">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-white font-medium truncate max-w-[120px]">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs">{user.email}</td>
                  <td className="px-4 py-3">
                    <select value={user.role} onChange={(e) => updateRoleMutation.mutate({ id: user._id, role: e.target.value })}
                      className="bg-slate-700 border-0 text-xs text-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer">
                      {['user', 'admin', 'superadmin'].map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3"><span className={`text-xs font-semibold capitalize ${planColor(user.subscription?.plan)}`}>{user.subscription?.plan || 'free'}</span></td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${user.isEmailVerified ? 'text-emerald-400' : 'text-amber-400'}`}>{user.isEmailVerified ? '✓ Yes' : '✗ No'}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => { if (confirm('Ban this user?')) banMutation.mutate(user._id); }}
                      className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded-lg hover:bg-red-900/20">
                      <Ban size={12} />Ban
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data?.pagination?.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
            <span className="text-slate-500 text-xs">Page {page} of {data.pagination.pages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="text-xs text-slate-400 hover:text-white px-3 py-1.5 bg-slate-700 rounded-lg disabled:opacity-40">Prev</button>
              <button disabled={page >= data.pagination.pages} onClick={() => setPage(p => p + 1)} className="text-xs text-slate-400 hover:text-white px-3 py-1.5 bg-slate-700 rounded-lg disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
