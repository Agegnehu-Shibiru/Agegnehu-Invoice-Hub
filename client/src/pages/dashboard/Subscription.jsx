import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { paymentApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { Check, Zap, Star, Building2, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const PLANS = [
  {
    id: 'free', name: 'Free', icon: Zap, price: { monthly: 0, yearly: 0 }, color: 'slate',
    features: ['5 invoices per month', '2 clients', 'Basic templates', 'PDF download', 'Email support'],
    limits: ['No custom branding', 'No payment links', 'No email reminders'],
  },
  {
    id: 'pro', name: 'Pro', icon: Star, price: { monthly: 19, yearly: 190 }, color: 'primary', popular: true,
    features: ['Unlimited invoices', 'Unlimited clients', 'Custom branding', 'All templates', 'PDF export', 'Payment links (Stripe & PayPal)', 'Automated email reminders', 'CSV exports', 'Priority support'],
    limits: [],
  },
  {
    id: 'business', name: 'Business', icon: Building2, price: { monthly: 49, yearly: 490 }, color: 'violet',
    features: ['Everything in Pro', 'Team members (up to 5)', 'API access', 'Advanced analytics', 'White-label invoices', 'Custom email domain', 'Dedicated account manager', 'SLA uptime guarantee'],
    limits: [],
  },
];

export default function Subscription() {
  const [interval, setInterval] = useState('monthly');
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const currentPlan = user?.subscription?.plan || 'free';
  const isSuccess = searchParams.get('success');

  const upgradeMutation = useMutation({
    mutationFn: ({ plan, interval }) => paymentApi.stripeSubscription(plan, interval),
    onSuccess: (res) => { window.location.href = res.data.data.url; },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to start checkout'),
  });

  const handleUpgrade = (plan) => {
    if (plan === 'free' || plan === currentPlan) return;
    upgradeMutation.mutate({ plan, interval });
  };

  const savings = (p) => p.price.monthly > 0 ? Math.round((1 - p.price.yearly / (p.price.monthly * 12)) * 100) : 0;

  return (
    <div className="animate-slide-up space-y-8 max-w-5xl">
      <div>
        <h1 className="page-title">Subscription</h1>
        <p className="text-slate-500 mt-1">Manage your plan and billing</p>
      </div>

      {isSuccess && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
          <Check size={18} className="text-emerald-500 flex-shrink-0" />
          <div>
            <p className="font-semibold">Subscription activated!</p>
            <p className="text-sm text-emerald-600">Your plan has been upgraded. Enjoy all the new features!</p>
          </div>
        </motion.div>
      )}

      {/* Current plan banner */}
      <div className="card p-5 flex items-center gap-4 border-l-4 border-primary-500">
        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
          <Star size={18} className="text-primary-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-900 capitalize">{currentPlan} Plan — {user?.subscription?.status || 'active'}</p>
          {user?.subscription?.currentPeriodEnd && (
            <p className="text-sm text-slate-500">Renews on {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}</p>
          )}
        </div>
        {user?.subscription?.cancelAtPeriodEnd && (
          <div className="flex items-center gap-2 text-amber-600 text-sm"><AlertTriangle size={15} />Cancels at period end</div>
        )}
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => setInterval('monthly')} className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${interval === 'monthly' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>Monthly</button>
        <button onClick={() => setInterval('yearly')} className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${interval === 'yearly' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
          Yearly <span className="ml-1.5 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Save up to 17%</span>
        </button>
      </div>

      {/* Plan cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan, i) => {
          const isCurrent = plan.id === currentPlan;
          const price = interval === 'yearly' ? plan.price.yearly : plan.price.monthly;
          const Icon = plan.icon;
          return (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={`card p-6 relative flex flex-col ${plan.popular ? 'ring-2 ring-primary-500 shadow-xl' : ''} ${isCurrent ? 'bg-slate-50' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">Most Popular</span>
                </div>
              )}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${plan.popular ? 'bg-primary-100' : 'bg-slate-100'}`}>
                <Icon size={18} className={plan.popular ? 'text-primary-600' : 'text-slate-600'} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
              <div className="mt-2 mb-4">
                <span className="text-3xl font-bold text-slate-900">${price}</span>
                {price > 0 && <span className="text-slate-400 text-sm">/{interval === 'yearly' ? 'yr' : 'mo'}</span>}
                {price === 0 && <span className="text-slate-400 text-sm"> forever</span>}
                {interval === 'yearly' && plan.price.monthly > 0 && (
                  <p className="text-xs text-emerald-600 font-medium mt-0.5">Save {savings(plan)}% vs monthly</p>
                )}
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <Check size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />{f}
                  </li>
                ))}
                {plan.limits.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-400 line-through">
                    <span className="w-3.5 h-3.5 flex-shrink-0 mt-0.5">✕</span>{f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrent || plan.id === 'free' || upgradeMutation.isPending}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2
                  ${isCurrent ? 'bg-slate-100 text-slate-400 cursor-default' : plan.popular
                    ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-md' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}>
                {upgradeMutation.isPending ? <Loader2 size={15} className="animate-spin" /> :
                  isCurrent ? '✓ Current Plan' : plan.id === 'free' ? 'Downgrade' : `Upgrade to ${plan.name}`}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Billing history note */}
      <div className="card p-5 flex items-center gap-3 text-sm text-slate-600">
        <ExternalLink size={16} className="text-slate-400 flex-shrink-0" />
        <p>To view invoices, update payment method, or cancel your subscription, visit the <strong>Stripe customer portal</strong>. Contact <a href="mailto:support@invoicehubpro.com" className="text-primary-600 hover:underline">support@invoicehubpro.com</a> for help.</p>
      </div>
    </div>
  );
}
