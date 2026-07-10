import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { userApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { Save, Loader2 } from 'lucide-react';

const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR', 'CHF', 'SGD'];
const timezones = ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney'];

export default function Settings() {
  const { user, updateUser } = useAuthStore();
  const { register, handleSubmit, formState: { isSubmitting, isDirty } } = useForm({
    defaultValues: {
      'settings.currency': user?.settings?.currency || 'USD',
      'settings.timezone': user?.settings?.timezone || 'UTC',
      'settings.invoicePrefix': user?.settings?.invoicePrefix || 'INV',
      'settings.taxRate': user?.settings?.taxRate || 0,
      'settings.paymentTerms': user?.settings?.paymentTerms || 'Net 30',
      'settings.brandColor': user?.settings?.brandColor || '#4F46E5',
      'settings.notifications.invoicePaid': user?.settings?.notifications?.invoicePaid ?? true,
      'settings.notifications.invoiceOverdue': user?.settings?.notifications?.invoiceOverdue ?? true,
      'settings.notifications.weeklyDigest': user?.settings?.notifications?.weeklyDigest ?? true,
    },
  });

  const onSubmit = async (data) => {
    const settings = {
      currency: data['settings.currency'],
      timezone: data['settings.timezone'],
      invoicePrefix: data['settings.invoicePrefix'],
      taxRate: Number(data['settings.taxRate']),
      paymentTerms: data['settings.paymentTerms'],
      brandColor: data['settings.brandColor'],
      notifications: {
        invoicePaid: data['settings.notifications.invoicePaid'],
        invoiceOverdue: data['settings.notifications.invoiceOverdue'],
        weeklyDigest: data['settings.notifications.weeklyDigest'],
      },
    };
    try {
      const res = await userApi.updateMe({ settings });
      updateUser(res.data.data.user);
      toast.success('Settings saved!');
    } catch { toast.error('Save failed'); }
  };

  const SectionCard = ({ title, children }) => (
    <div className="card p-6">
      <h2 className="section-title mb-5">{title}</h2>
      {children}
    </div>
  );

  return (
    <div className="animate-slide-up space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Settings</h1>
        <button form="settings-form" type="submit" disabled={isSubmitting || !isDirty} className="btn-primary">
          {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Settings
        </button>
      </div>

      <form id="settings-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <SectionCard title="Invoice Defaults">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Currency</label>
              <select {...register('settings.currency')} className="input">
                {currencies.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Timezone</label>
              <select {...register('settings.timezone')} className="input">
                {timezones.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Invoice Prefix</label>
              <input {...register('settings.invoicePrefix')} className="input" placeholder="INV" />
              <p className="text-xs text-slate-400 mt-1">e.g. INV → INV-0001</p>
            </div>
            <div>
              <label className="label">Default Tax Rate (%)</label>
              <input {...register('settings.taxRate')} type="number" step="0.1" min="0" max="100" className="input" />
            </div>
            <div>
              <label className="label">Default Payment Terms</label>
              <select {...register('settings.paymentTerms')} className="input">
                {['Due on Receipt', 'Net 7', 'Net 14', 'Net 30', 'Net 60', 'Net 90'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Brand Color</label>
              <div className="flex gap-2">
                <input {...register('settings.brandColor')} type="color" className="h-10 w-16 rounded-xl border border-slate-200 cursor-pointer p-1" />
                <input {...register('settings.brandColor')} className="input flex-1" placeholder="#4F46E5" />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Email Notifications">
          <div className="space-y-4">
            {[
              ['settings.notifications.invoicePaid', 'Invoice Paid', 'Get notified when a client pays an invoice'],
              ['settings.notifications.invoiceOverdue', 'Invoice Overdue', 'Alert when invoices become overdue'],
              ['settings.notifications.weeklyDigest', 'Monthly Summary', 'Receive a monthly overview of your invoicing activity'],
            ].map(([name, label, desc]) => (
              <label key={name} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-800">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
                <input {...register(name)} type="checkbox" className="w-4 h-4 rounded text-primary-600 border-slate-300 focus:ring-primary-500 cursor-pointer" />
              </label>
            ))}
          </div>
        </SectionCard>
      </form>
    </div>
  );
}
