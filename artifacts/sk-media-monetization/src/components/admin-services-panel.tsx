import { useEffect, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetAdminServicesContentQueryKey,
  getGetServicesContentQueryKey,
  useGetAdminServicesContent,
  useUpdateServicesContent,
} from '@workspace/api-client-react';
import type { ServiceCardContent, ServicesPageContent, ServiceProcessStep } from '@workspace/api-client-react';
import { toast } from '@/hooks/use-toast';
import { ServiceLogoInput } from '@/components/service-logo-input';

const emptyContent: ServicesPageContent = {
  heroKicker: 'A strategy that meets you where you are',
  heroTitle: 'Make your content work smarter',
  heroIntro: 'Platform monetization, creator growth, and the strategy that ties it together. Practical services designed around your channel—not a cookie-cutter checklist.',
  servicesLabel: 'Our services',
  servicesTitle: 'A clear path, platform by platform.',
  serviceCards: [
    { number: '01', title: 'YouTube monetization', description: 'Get to partner status, unlock revenue, and make every upload work harder.', icon: 'youtube', features: ['YPP eligibility roadmap', 'Channel & content audit', 'AdSense setup guidance'], ctaLabel: 'Explore the service' },
    { number: '02', title: 'Facebook monetization', description: 'Build a stronger presence and turn your videos into a dependable income stream.', icon: 'users', features: ['In-stream ads readiness', 'Stars & fan support setup', 'Rights and policy guidance'], ctaLabel: 'Explore the service' },
    { number: '03', title: 'TikTok growth & earnings', description: 'Create with a point of view, grow an audience, and find the right creator rewards.', icon: 'video', features: ['Account health review', 'Content growth plan', 'Brand deal positioning'], ctaLabel: 'Explore the service' },
    { number: '04', title: 'Content strategy', description: 'A clear creative direction that helps your content reach the right people.', icon: 'clapperboard', features: ['Audience & niche mapping', 'Format and publishing plan', 'Performance-led iteration'], ctaLabel: 'Explore the service' },
  ],
  processLabel: 'How we work together',
  processTitle: 'Less guessing. More forward.',
  processSteps: [
    { number: '01', title: 'Listen', description: 'We learn about your content, audience, and ambition.' },
    { number: '02', title: 'Map it', description: 'We build a focused plan from where you are right now.' },
    { number: '03', title: 'Make progress', description: 'We support the next steps and adapt as your channel grows.' },
  ],
};

function errorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string') return data.error;
  }
  return 'Could not save Services page content. Check the API connection and try again.';
}

function nextNumber(length: number) {
  return String(length + 1).padStart(2, '0');
}

export default function AdminServicesPanel() {
  const queryClient = useQueryClient();
  const contentQuery = useGetAdminServicesContent();
  const saveContent = useUpdateServicesContent();
  const [form, setForm] = useState<ServicesPageContent>(emptyContent);
  const [formError, setFormError] = useState('');
  const [hasLoadedContent, setHasLoadedContent] = useState(false);

  useEffect(() => {
    if (!contentQuery.data || hasLoadedContent) return;
    setForm(contentQuery.data);
    setHasLoadedContent(true);
  }, [contentQuery.data, hasLoadedContent]);

  const setField = <K extends keyof ServicesPageContent>(key: K, value: ServicesPageContent[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };
  const updateCard = (index: number, update: Partial<ServiceCardContent>) => {
    setField('serviceCards', form.serviceCards.map((card, cardIndex) => cardIndex === index ? { ...card, ...update } : card));
  };
  const updateStep = (index: number, update: Partial<ServiceProcessStep>) => {
    setField('processSteps', form.processSteps.map((step, stepIndex) => stepIndex === index ? { ...step, ...update } : step));
  };
  const moveItem = <T,>(items: T[], index: number, offset: number, save: (nextItems: T[]) => void) => {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
    save(reordered);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    saveContent.mutate({ data: form }, {
      onSuccess: async (saved) => {
        setForm(saved);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getGetAdminServicesContentQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getGetServicesContentQueryKey() }),
        ]);
        toast({ title: 'Services page updated', description: 'Your page header, service cards, and process are now live.' });
      },
      onError: (error) => setFormError(errorMessage(error)),
    });
  };

  const textField = (label: string, key: 'heroKicker' | 'heroTitle' | 'heroIntro' | 'servicesLabel' | 'servicesTitle' | 'processLabel' | 'processTitle', maxLength: number, multiline = false) => (
    <label className="grid gap-2 text-xs font-semibold text-[#5f5d55]">
      {label}
      {multiline
        ? <textarea required maxLength={maxLength} rows={4} value={form[key]} onChange={(event) => setField(key, event.target.value)} className="form-field min-h-[100px] resize-y !border-[#d0cabd] !bg-white !text-[#211f1b]" />
        : <input required maxLength={maxLength} value={form[key]} onChange={(event) => setField(key, event.target.value)} className="form-field !border-[#d0cabd] !bg-white !text-[#211f1b]" />}
    </label>
  );

  if (contentQuery.isLoading) return <section><div className="eyebrow text-[#826900]">Website content</div><h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">Services</h1><p className="mt-8 text-sm text-black/50">Loading Services page content…</p></section>;
  if (contentQuery.isError) return <section><div className="eyebrow text-[#826900]">Website content</div><h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">Services</h1><div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6"><p className="text-sm text-red-800">We couldn’t load Services page content.</p><button type="button" onClick={() => contentQuery.refetch()} className="btn-gold mt-4 !py-2.5 text-xs">Retry <ArrowRight size={14} /></button></div></section>;

  return <section>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="eyebrow text-[#826900]">Website content</div><h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">Services</h1><p className="mt-2 text-sm text-black/55">Edit all three Services page sections, including the number of cards, features, and steps.</p></div><button form="admin-services-content-form" type="submit" disabled={saveContent.isPending} className="btn-gold w-fit !px-5 !py-3 text-sm disabled:opacity-60"><Save size={16} />{saveContent.isPending ? 'Saving…' : 'Save changes'}</button></div>
    <form id="admin-services-content-form" onSubmit={submit} className="mt-8 grid gap-6">
      <section className="rounded-2xl border border-black/10 bg-[#fbfaf6] p-5 md:p-7"><div className="mb-5"><h2 className="font-display text-xl font-extrabold tracking-[-.04em]">Page intro</h2><p className="mt-1 text-xs text-black/45">The centered hero at the top of the Services page.</p></div><div className="grid gap-4">{textField('Eyebrow', 'heroKicker', 120)}{textField('Headline', 'heroTitle', 240)}{textField('Introduction', 'heroIntro', 1000, true)}</div></section>

      <section className="rounded-2xl border border-black/10 bg-[#fbfaf6] p-5 md:p-7"><div className="mb-5"><h2 className="font-display text-xl font-extrabold tracking-[-.04em]">Service cards</h2><p className="mt-1 text-xs text-black/45">Add, remove, reorder, or edit cards and their checklist items.</p></div><div className="grid gap-4">{textField('Section eyebrow', 'servicesLabel', 120)}{textField('Section heading', 'servicesTitle', 240)}
        {form.serviceCards.map((card, index) => <article key={`card-${index}`} className="rounded-xl border border-black/10 bg-white p-4 md:p-5"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-display font-bold">Service {index + 1}</h3><div className="flex items-center gap-2"><button type="button" onClick={() => moveItem(form.serviceCards, index, -1, (items) => setField('serviceCards', items))} disabled={index === 0} aria-label="Move service up" className="grid h-9 w-9 place-items-center rounded-lg border border-black/15 disabled:opacity-30"><ArrowUp size={15} /></button><button type="button" onClick={() => moveItem(form.serviceCards, index, 1, (items) => setField('serviceCards', items))} disabled={index === form.serviceCards.length - 1} aria-label="Move service down" className="grid h-9 w-9 place-items-center rounded-lg border border-black/15 disabled:opacity-30"><ArrowDown size={15} /></button><button type="button" onClick={() => setField('serviceCards', form.serviceCards.filter((_, cardIndex) => cardIndex !== index))} aria-label="Remove service" className="grid h-9 w-9 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"><Trash2 size={15} /></button></div></div>
          <div className="grid gap-4 md:grid-cols-2"><div className="md:col-span-2"><ServiceLogoInput value={card.logo ?? ''} onChange={(logo) => updateCard(index, { logo })} /></div><label className="grid gap-2 text-xs font-semibold text-[#5f5d55] md:col-span-2">Title<input required maxLength={160} value={card.title} onChange={(event) => updateCard(index, { title: event.target.value })} className="form-field !border-[#d0cabd] !bg-white !text-[#211f1b]" /></label><label className="grid gap-2 text-xs font-semibold text-[#5f5d55] md:col-span-2">Description<textarea required maxLength={1000} rows={3} value={card.description} onChange={(event) => updateCard(index, { description: event.target.value })} className="form-field resize-y !border-[#d0cabd] !bg-white !text-[#211f1b]" /></label><label className="grid gap-2 text-xs font-semibold text-[#5f5d55] md:col-span-2">Link label<input required maxLength={80} value={card.ctaLabel} onChange={(event) => updateCard(index, { ctaLabel: event.target.value })} className="form-field !border-[#d0cabd] !bg-white !text-[#211f1b]" /></label></div>
          <div className="mt-4 grid gap-2"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-[#5f5d55]">Card features</span><button type="button" onClick={() => updateCard(index, { features: [...card.features, ''] })} disabled={card.features.length >= 12} className="inline-flex items-center gap-1 text-xs font-bold text-[#826900] disabled:opacity-40"><Plus size={14} /> Add feature</button></div>{card.features.map((feature, featureIndex) => <div key={`feature-${featureIndex}`} className="flex gap-2"><input required maxLength={180} value={feature} onChange={(event) => { const features = [...card.features]; features[featureIndex] = event.target.value; updateCard(index, { features }); }} className="form-field min-w-0 !border-[#d0cabd] !bg-white !text-[#211f1b]" aria-label={`Feature ${featureIndex + 1}`} /><button type="button" onClick={() => updateCard(index, { features: card.features.filter((_, itemIndex) => itemIndex !== featureIndex) })} aria-label="Remove feature" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"><Trash2 size={15} /></button></div>)}</div>
        </article>)}
        <button type="button" onClick={() => setField('serviceCards', [...form.serviceCards, { number: nextNumber(form.serviceCards.length), title: '', description: '', icon: 'sparkles', logo: '', features: [], ctaLabel: 'Explore the service' }])} disabled={form.serviceCards.length >= 12} className="inline-flex w-fit items-center gap-2 rounded-full border border-black/15 px-4 py-2.5 text-xs font-bold transition hover:bg-black/5 disabled:opacity-40"><Plus size={15} /> Add service card</button>
      </div></section>

      <section className="rounded-2xl border border-black/10 bg-[#fbfaf6] p-5 md:p-7"><div className="mb-5"><h2 className="font-display text-xl font-extrabold tracking-[-.04em]">How we work together</h2><p className="mt-1 text-xs text-black/45">Edit the section intro and the steps shown below it.</p></div><div className="grid gap-4">{textField('Section eyebrow', 'processLabel', 120)}{textField('Section heading', 'processTitle', 240)}
        {form.processSteps.map((step, index) => <article key={`step-${index}`} className="rounded-xl border border-black/10 bg-white p-4 md:p-5"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-display font-bold">Step {index + 1}</h3><div className="flex items-center gap-2"><button type="button" onClick={() => moveItem(form.processSteps, index, -1, (items) => setField('processSteps', items))} disabled={index === 0} aria-label="Move step up" className="grid h-9 w-9 place-items-center rounded-lg border border-black/15 disabled:opacity-30"><ArrowUp size={15} /></button><button type="button" onClick={() => moveItem(form.processSteps, index, 1, (items) => setField('processSteps', items))} disabled={index === form.processSteps.length - 1} aria-label="Move step down" className="grid h-9 w-9 place-items-center rounded-lg border border-black/15 disabled:opacity-30"><ArrowDown size={15} /></button><button type="button" onClick={() => setField('processSteps', form.processSteps.filter((_, stepIndex) => stepIndex !== index))} aria-label="Remove step" className="grid h-9 w-9 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"><Trash2 size={15} /></button></div></div><div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-xs font-semibold text-[#5f5d55]">Number<input required maxLength={12} value={step.number} onChange={(event) => updateStep(index, { number: event.target.value })} className="form-field !border-[#d0cabd] !bg-white !text-[#211f1b]" /></label><label className="grid gap-2 text-xs font-semibold text-[#5f5d55]">Title<input required maxLength={160} value={step.title} onChange={(event) => updateStep(index, { title: event.target.value })} className="form-field !border-[#d0cabd] !bg-white !text-[#211f1b]" /></label><label className="grid gap-2 text-xs font-semibold text-[#5f5d55] md:col-span-2">Description<textarea required maxLength={1000} rows={3} value={step.description} onChange={(event) => updateStep(index, { description: event.target.value })} className="form-field resize-y !border-[#d0cabd] !bg-white !text-[#211f1b]" /></label></div></article>)}
        <button type="button" onClick={() => setField('processSteps', [...form.processSteps, { number: nextNumber(form.processSteps.length), title: '', description: '' }])} disabled={form.processSteps.length >= 12} className="inline-flex w-fit items-center gap-2 rounded-full border border-black/15 px-4 py-2.5 text-xs font-bold transition hover:bg-black/5 disabled:opacity-40"><Plus size={15} /> Add process step</button>
      </div></section>
      {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
      <div className="flex justify-end"><button type="submit" disabled={saveContent.isPending} className="btn-gold !px-5 !py-3 text-sm disabled:opacity-60">{saveContent.isPending ? 'Saving…' : 'Save all sections'} <ArrowRight size={15} /></button></div>
    </form>
  </section>;
}