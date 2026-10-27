import { useEffect, useState } from 'react';
import { ArrowRight, Check, Plus, Save, Trash2, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetAdminCommunityPlansQueryKey,
  getGetCommunityPlansQueryKey,
  useGetAdminCommunityPlans,
  useUpdateCommunityPlans,
} from '@workspace/api-client-react';
import type { CommunityPlan, CommunityPlansContent } from '@workspace/api-client-react';
import { toast } from '@/hooks/use-toast';

const PKR_PER_USD = 280;

function validateWhatsAppLink(value: string, type: 'group' | 'channel') {
  if (!value.trim()) return '';
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return 'Use a valid HTTPS WhatsApp link.';
    if (type === 'group' && (url.hostname !== 'chat.whatsapp.com' || !/^\/[A-Za-z0-9_-]+\/?$/.test(url.pathname))) {
      return 'Enter a WhatsApp group invite link (https://chat.whatsapp.com/…).';
    }
    if (type === 'channel' && !(['whatsapp.com', 'www.whatsapp.com'].includes(url.hostname) && /^\/channel\/[A-Za-z0-9_-]+\/?$/.test(url.pathname))) {
      return 'Enter a WhatsApp channel link (https://whatsapp.com/channel/…).';
    }
    return '';
  } catch {
    return type === 'group'
      ? 'Enter a valid WhatsApp group invite link.'
      : 'Enter a valid WhatsApp channel link.';
  }
}

function errorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string') return data.error;
  }
  if (typeof error === 'object' && error !== null && 'status' in error && error.status === 404) {
    return 'The running API server does not have the Community Plans route yet. Restart the API Server to load the latest version.';
  }
  return 'Could not save community plans. Check the API connection and try again.';
}

function PlanEditor({ name, plan, onChange, onSave, isSaving }: { name: string; plan: CommunityPlan; onChange: (plan: CommunityPlan) => void; onSave: () => void; isSaving: boolean }) {
  const fieldClass = 'form-field !border-[#d0cabd] !bg-white !text-[#211f1b]';
  const [priceUsdInput, setPriceUsdInput] = useState(String(plan.priceUsd));
  const [pricePkrInput, setPricePkrInput] = useState(String(plan.pricePkr));
  const textField = (label: string, key: 'title' | 'description' | 'billingPeriod' | 'buttonLabel', maxLength: number) => (
    <label className="grid gap-2 text-xs font-semibold text-[#5f5d55]">{label}
      <input required maxLength={maxLength} value={plan[key]} onChange={(event) => onChange({ ...plan, [key]: event.target.value })} className={fieldClass} />
    </label>
  );
  const updateUsdPrice = (value: string) => {
    setPriceUsdInput(value);
    if (value.trim() === '') return;
    const priceUsd = Number(value);
    if (!Number.isFinite(priceUsd)) return;
    const pricePkr = Math.round(priceUsd * PKR_PER_USD);
    setPricePkrInput(String(pricePkr));
    onChange({ ...plan, priceUsd, pricePkr });
  };
  const updatePkrPrice = (value: string) => {
    setPricePkrInput(value);
    if (value.trim() === '') return;
    const pricePkr = Number(value);
    if (!Number.isFinite(pricePkr)) return;
    const priceUsd = Math.round((pricePkr / PKR_PER_USD) * 100) / 100;
    setPriceUsdInput(String(priceUsd));
    onChange({ ...plan, priceUsd, pricePkr });
  };

  return <section className="rounded-2xl border border-black/10 bg-[#fbfaf6] p-5 md:p-6">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><div className="eyebrow text-[#826900]">Community membership</div><h2 className="mt-2 font-display text-2xl font-extrabold">{name} plan</h2></div><div className="flex flex-wrap items-center gap-2"><div role="group" aria-label={`${name} plan visibility`} className="flex gap-2">
      <button type="button" aria-pressed={plan.isActive} onClick={() => onChange({ ...plan, isActive: true })} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition ${plan.isActive ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-black/15 text-black/55 hover:bg-black/5'}`} data-testid={`button-${name.toLowerCase()}-plan-active`}><Check size={14} /> Active</button>
      <button type="button" aria-pressed={!plan.isActive} onClick={() => onChange({ ...plan, isActive: false })} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition ${!plan.isActive ? 'border-red-300 bg-red-50 text-red-700' : 'border-black/15 text-black/55 hover:bg-black/5'}`} data-testid={`button-${name.toLowerCase()}-plan-inactive`}><X size={14} /> Inactive</button>
    </div><button type="button" onClick={onSave} disabled={isSaving} className="btn-gold !px-4 !py-2.5 text-xs disabled:opacity-60" data-testid={`button-save-${name.toLowerCase()}-plan`}><Save size={14} />{isSaving ? 'Saving…' : 'Save changes'}</button></div></div>
    <div className="grid gap-4">
      {textField('Plan title', 'title', 120)}
      {textField('Description', 'description', 500)}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-xs font-semibold text-[#5f5d55]">Price (USD)<input type="number" min={0} max={1000000} step="0.01" required value={priceUsdInput} onChange={(event) => updateUsdPrice(event.target.value)} className={fieldClass} /></label>
        <label className="grid gap-2 text-xs font-semibold text-[#5f5d55]">Price (PKR)<input type="number" min={0} max={100000000} step="1" required value={pricePkrInput} onChange={(event) => updatePkrPrice(event.target.value)} className={fieldClass} /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {textField('Billing period', 'billingPeriod', 40)}
        {textField('Button label', 'buttonLabel', 100)}
      </div>
      <fieldset className="grid gap-3 rounded-xl border border-black/10 bg-white p-4">
        <legend className="px-2 font-display text-base font-bold">Features</legend>
        {plan.features.map((feature, index) => <div key={`feature-${index}`} className="flex items-center gap-2">
          <input required maxLength={240} value={feature} onChange={(event) => onChange({ ...plan, features: plan.features.map((item, itemIndex) => itemIndex === index ? event.target.value : item) })} aria-label={`${name} feature ${index + 1}`} className={`${fieldClass} min-w-0 flex-1`} />
          <button type="button" onClick={() => onChange({ ...plan, features: plan.features.filter((_, itemIndex) => itemIndex !== index) })} aria-label={`Remove ${name} feature ${index + 1}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
        </div>)}
        <button type="button" onClick={() => onChange({ ...plan, features: [...plan.features, ''] })} disabled={plan.features.length >= 20} className="inline-flex w-fit items-center gap-2 rounded-full border border-black/15 px-4 py-2 text-xs font-bold transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"><Plus size={14} /> Add feature</button>
      </fieldset>
    </div>
  </section>;
}

export default function AdminCommunityPanel() {
  const queryClient = useQueryClient();
  const plansQuery = useGetAdminCommunityPlans();
  const savePlans = useUpdateCommunityPlans();
  const [form, setForm] = useState<CommunityPlansContent | null>(null);
  const [savedForm, setSavedForm] = useState<CommunityPlansContent | null>(null);
  const [formError, setFormError] = useState('');
  const [linkErrors, setLinkErrors] = useState({ group: '', channel: '' });

  useEffect(() => {
    if (plansQuery.data && !form) {
      setForm(plansQuery.data);
      setSavedForm(plansQuery.data);
    }
  }, [plansQuery.data, form]);

  const saveSection = (section: 'freePlan' | 'premiumPlan' | 'links') => {
    if (!form || !savedForm) return;
    setFormError('');
    if (section === 'links') {
      const errors = {
        group: validateWhatsAppLink(form.whatsappGroupUrl, 'group'),
        channel: validateWhatsAppLink(form.whatsappChannelUrl, 'channel'),
      };
      setLinkErrors(errors);
      if (errors.group || errors.channel) return;
    }
    const data = section === 'links'
      ? { ...savedForm, whatsappGroupUrl: form.whatsappGroupUrl, whatsappChannelUrl: form.whatsappChannelUrl }
      : { ...savedForm, [section]: form[section] };
    savePlans.mutate({ data }, {
      onSuccess: async (saved) => {
        setForm(saved);
        setSavedForm(saved);
        queryClient.setQueryData(getGetCommunityPlansQueryKey(), saved);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getGetAdminCommunityPlansQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getGetCommunityPlansQueryKey() }),
        ]);
        toast({
          title: section === 'links' ? 'WhatsApp links saved successfully' : 'Community plan saved successfully',
          description: section === 'links' ? 'Your valid WhatsApp links are now available on the Free Access page.' : `${section === 'freePlan' ? 'Free' : 'Premium'} plan changes are now saved.`,
        });
      },
      onError: (error) => setFormError(errorMessage(error)),
    });
  };

  if (plansQuery.isLoading) return <section><div className="eyebrow text-[#826900]">Community</div><h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">Membership Plans</h1><p className="mt-8 text-sm text-black/50">Loading Free and Premium plans…</p></section>;
  if (plansQuery.isError) return <section><div className="eyebrow text-[#826900]">Community</div><h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">Membership Plans</h1><div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6"><p className="text-sm text-red-800">{errorMessage(plansQuery.error)}</p><button type="button" onClick={() => plansQuery.refetch()} className="btn-gold mt-4 !py-2.5 text-xs">Retry <ArrowRight size={14} /></button></div></section>;
  if (!form) return <section><div className="eyebrow text-[#826900]">Community</div><h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">Membership Plans</h1><p className="mt-8 text-sm text-black/50">Loading Free and Premium plans…</p></section>;

  return <section>
    <div><div className="eyebrow text-[#826900]">Community</div><h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">Membership Plans</h1><p className="mt-2 text-sm text-black/55">Manage the Free and Premium plans shown on the Join Community page.</p></div>
    <div className="mt-8 grid gap-6">
      <PlanEditor name="Free" plan={form.freePlan} onChange={(freePlan) => setForm((current) => current ? { ...current, freePlan } : current)} onSave={() => saveSection('freePlan')} isSaving={savePlans.isPending} />
      <PlanEditor name="Premium" plan={form.premiumPlan} onChange={(premiumPlan) => setForm((current) => current ? { ...current, premiumPlan } : current)} onSave={() => saveSection('premiumPlan')} isSaving={savePlans.isPending} />
      <section className="rounded-2xl border border-black/10 bg-[#fbfaf6] p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="eyebrow text-[#826900]">Free access links</div><h2 className="mt-2 font-display text-2xl font-extrabold">WhatsApp destinations</h2></div><button type="button" onClick={() => saveSection('links')} disabled={savePlans.isPending} className="btn-gold !px-4 !py-2.5 text-xs disabled:opacity-60" data-testid="button-save-whatsapp-links"><Save size={14} />{savePlans.isPending ? 'Saving…' : 'Save changes'}</button></div>
        <p className="mt-2 text-sm text-black/55">These links appear on the page opened by the Free Access button. Leave either field blank to keep that destination unavailable.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-xs font-semibold text-[#5f5d55]">WhatsApp Group link<input type="url" maxLength={500} value={form.whatsappGroupUrl} onChange={(event) => { const whatsappGroupUrl = event.target.value; setForm({ ...form, whatsappGroupUrl }); setLinkErrors((current) => ({ ...current, group: validateWhatsAppLink(whatsappGroupUrl, 'group') })); }} placeholder="https://chat.whatsapp.com/…" aria-invalid={Boolean(linkErrors.group)} aria-describedby={linkErrors.group ? 'whatsapp-group-link-error' : undefined} className={`form-field !bg-white !text-[#211f1b] ${linkErrors.group ? '!border-red-500' : '!border-[#d0cabd]'}`} />{linkErrors.group && <span id="whatsapp-group-link-error" role="alert" className="text-xs font-medium text-red-700">{linkErrors.group}</span>}</label>
          <label className="grid gap-2 text-xs font-semibold text-[#5f5d55]">WhatsApp Channel link<input type="url" maxLength={500} value={form.whatsappChannelUrl} onChange={(event) => { const whatsappChannelUrl = event.target.value; setForm({ ...form, whatsappChannelUrl }); setLinkErrors((current) => ({ ...current, channel: validateWhatsAppLink(whatsappChannelUrl, 'channel') })); }} placeholder="https://whatsapp.com/channel/…" aria-invalid={Boolean(linkErrors.channel)} aria-describedby={linkErrors.channel ? 'whatsapp-channel-link-error' : undefined} className={`form-field !bg-white !text-[#211f1b] ${linkErrors.channel ? '!border-red-500' : '!border-[#d0cabd]'}`} />{linkErrors.channel && <span id="whatsapp-channel-link-error" role="alert" className="text-xs font-medium text-red-700">{linkErrors.channel}</span>}</label>
        </div>
      </section>
      {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
    </div>
  </section>;
}
