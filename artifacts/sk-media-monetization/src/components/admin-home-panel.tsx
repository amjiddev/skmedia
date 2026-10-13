import { useEffect, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetAdminHomeContentQueryKey,
  getGetHomeContentQueryKey,
  useGetAdminHomeContent,
  useUpdateHomeContent,
} from '@workspace/api-client-react';
import type { HomePageContent } from '@workspace/api-client-react';
import { toast } from '@/hooks/use-toast';
import { ServiceLogoInput } from '@/components/service-logo-input';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function titleFor(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

function emptyLike(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return [];
  if (value !== null && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, emptyLike(child)]));
  if (typeof value === 'number') return 0;
  if (typeof value === 'boolean') return false;
  return '';
}

function withoutLegacyAssurances(content: HomePageContent): HomePageContent {
  const hero = { ...content.hero } as HomePageContent['hero'] & { assurances?: unknown };
  delete hero.assurances;
  const services = {
    ...content.services,
    cards: content.services.cards.map((card) => ({
      number: card.number,
      title: card.title,
      description: card.description,
      icon: card.icon,
      logo: card.logo ?? '',
      features: card.features,
      ctaLabel: card.ctaLabel,
    })),
  };
  return { ...content, hero, services };
}

function emptyArrayItem(path: string): JsonValue | undefined {
  const templates: Record<string, JsonValue> = {
    'hero.chartMonths': { month: '', earnings: 0, bonus: 0 },
    'hero.chartPlatforms': { name: '', amount: '' },
    'hero.marquee': '',
    'trust.cards': { title: '', description: '', icon: 'users' },
    'opportunity.steps': { number: '', title: '', description: '' },
    'services.cards': { number: '', title: '', description: '', icon: 'sparkles', features: [], ctaLabel: '' },
    'story.benefits': { text: '', icon: 'users' },
    'values.cards': { title: '', description: '' },
    'testimonials.cards': { quote: '', source: '', platform: '' },
  };
  return templates[path];
}

function nextArrayItem(path: string, currentItems: JsonValue[]): JsonValue {
  if (path === 'services.cards') {
    return { number: String(currentItems.length + 1).padStart(2, '0'), title: '', description: '', icon: 'sparkles', logo: '', features: [], ctaLabel: 'Explore the service' };
  }
  if (path === 'opportunity.steps') {
    return { number: String(currentItems.length + 1).padStart(2, '0'), title: '', description: '' };
  }
  if (path === 'trust.cards') {
    return { title: '', description: '', icon: 'users' };
  }
  if (currentItems.length) return emptyLike(currentItems[0]);
  return emptyArrayItem(path) ?? '';
}

function arrayLimit(path: string): number {
  if (path === 'trust.cards' || path === 'opportunity.steps' || path === 'values.cards') return 12;
  if (path === 'testimonials.cards') return 20;
  if (path === 'story.benefits') return 6;
  return 12;
}

function ContentEditor({ title, value, onChange, path = '' }: { title: string; value: JsonValue; onChange: (value: JsonValue) => void; path?: string }): ReactNode {
  if (path === 'hero.chartMonths' || path === 'hero.chartPlatforms' || path === 'hero.marquee') return null;
  if (path === 'story.highlight') return null;
  if (path === 'story.benefits') return null;
  if (path === 'values') return null;
  if (path === 'testimonials') return null;
  if (path === 'faq') return null;
  if (path === 'contact') return null;
  if (path === 'footer') return null;
  if (path === 'faq.askLabel') return null;
  if (path.startsWith('trust.cards.') && path.endsWith('.icon')) return null;
  if (path.startsWith('opportunity.steps.') && path.endsWith('.number')) return null;
  if (path.startsWith('services.cards.') && path.endsWith('.number')) return null;
  if (path.startsWith('services.cards.') && path.endsWith('.icon')) return null;
  if (path.startsWith('services.cards.') && path.endsWith('.features')) return null;
  if (path.startsWith('services.cards.') && path.endsWith('.ctaLabel')) return null;
  if (path.startsWith('services.cards.') && path.endsWith('.logo')) {
    return <ServiceLogoInput value={typeof value === 'string' ? value : ''} onChange={onChange} />;
  }
  if (path === 'services.allServicesLabel') return null;
  if (Array.isArray(value)) {
    const isFixedList = path === 'trust.cards' || path === 'opportunity.steps' || path === 'services.cards';
    return <fieldset className="grid gap-3 rounded-xl border border-black/10 bg-white p-4 md:p-5"><legend className="px-2 font-display text-base font-bold text-[#211f1b]">{title}</legend>
      {value.map((item, index) => <div key={`${title}-${index}`} className="relative rounded-lg border border-black/10 bg-[#fbfaf6] p-3 md:p-4">
        <div className="mb-3 flex items-center justify-between gap-3"><span className="text-xs font-bold text-[#5f5d55]">{title} {index + 1}</span>{!isFixedList && <div className="flex gap-1">
          <button type="button" onClick={() => { if (index === 0) return; const next = [...value]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; onChange(next); }} disabled={index === 0} aria-label={`Move ${title} up`} className="grid h-8 w-8 place-items-center rounded-md border border-black/15 disabled:opacity-30"><ArrowUp size={14} /></button>
          <button type="button" onClick={() => { if (index === value.length - 1) return; const next = [...value]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; onChange(next); }} disabled={index === value.length - 1} aria-label={`Move ${title} down`} className="grid h-8 w-8 place-items-center rounded-md border border-black/15 disabled:opacity-30"><ArrowDown size={14} /></button>
          <button type="button" onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${title}`} className="grid h-8 w-8 place-items-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
        </div>}</div>
        <ContentEditor title={`${title} ${index + 1}`} path={path ? `${path}.${index}` : `${title.toLowerCase()}.${index}`} value={item as JsonValue} onChange={(nextItem) => onChange(value.map((existing, itemIndex) => itemIndex === index ? nextItem : existing))} />
      </div>)}
      {!isFixedList && <button type="button" onClick={() => onChange([...value, nextArrayItem(path, value as JsonValue[])])} disabled={value.length >= arrayLimit(path)} className="inline-flex w-fit items-center gap-2 rounded-full border border-black/15 px-4 py-2 text-xs font-bold transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"><Plus size={14} /> Add {title.replace(/s$/, '')}</button>}
    </fieldset>;
  }
  if (value !== null && typeof value === 'object') {
    return <section className="grid gap-4 rounded-2xl border border-black/10 bg-[#fbfaf6] p-5 md:p-6"><h2 className="font-display text-xl font-extrabold tracking-[-.04em]">{title}</h2>{Object.entries(value).map(([key, child]) => <ContentEditor key={key} title={titleFor(key)} path={path ? `${path}.${key}` : key} value={child} onChange={(nextValue) => onChange({ ...value, [key]: nextValue })} />)}</section>;
  }
  const isLongText = typeof value === 'string' && (value.length > 90 || value.includes('\n'));
  return <label className="grid min-w-0 gap-2 text-xs font-semibold text-[#5f5d55]">{title}
    {typeof value === 'boolean'
      ? <span className="flex items-center gap-2"><input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[#b18a00]" />Enabled</span>
      : path.endsWith('.icon')
        ? <select value={String(value)} onChange={(event) => onChange(event.target.value)} className="form-field !border-[#d0cabd] !bg-white !text-[#211f1b]"><option value="users">People</option><option value="shield">Shield</option><option value="target">Target</option><option value="trend">Growth</option><option value="youtube">YouTube</option><option value="facebook">Facebook</option><option value="tiktok">TikTok</option><option value="pin">Location</option><option value="video">Video</option><option value="sparkles">Sparkles</option><option value="clapperboard">Content</option></select>
        : typeof value === 'number'
        ? <input type="number" min={0} value={value} onChange={(event) => onChange(Number(event.target.value))} className="form-field !border-[#d0cabd] !bg-white !text-[#211f1b]" />
        : isLongText
          ? <textarea value={value ?? ''} onChange={(event) => onChange(event.target.value)} rows={3} className="form-field min-h-[88px] resize-y !border-[#d0cabd] !bg-white !text-[#211f1b]" />
          : <input value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="form-field !border-[#d0cabd] !bg-white !text-[#211f1b]" />}
  </label>;
}

function errorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string') return data.error;
  }
  return 'Could not save homepage content. Check the API connection and try again.';
}

export default function AdminHomePanel() {
  const queryClient = useQueryClient();
  const contentQuery = useGetAdminHomeContent();
  const saveContent = useUpdateHomeContent();
  const [form, setForm] = useState<HomePageContent | null>(null);
  const [savedForm, setSavedForm] = useState<HomePageContent | null>(null);
  const [formError, setFormError] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | ''>('');
  const [sectionSaveError, setSectionSaveError] = useState<{ section: 'hero' | 'trust' | 'opportunity' | 'services'; message: string } | null>(null);
  const [hasLoadedContent, setHasLoadedContent] = useState(false);

  useEffect(() => {
    if (contentQuery.data && !hasLoadedContent) {
      const loaded = withoutLegacyAssurances(contentQuery.data);
      setForm(loaded);
      setSavedForm(loaded);
      setHasLoadedContent(true);
    }
  }, [contentQuery.data, hasLoadedContent]);

  const saveChanges = async () => {
    if (!form) return;
    setFormError('');
    setSaveStatus('');
    try {
      const saved = withoutLegacyAssurances(await saveContent.mutateAsync({ data: form }));
      setForm(saved);
      setSavedForm(saved);
      setHasLoadedContent(true);
      queryClient.setQueryData(getGetAdminHomeContentQueryKey(), saved);
      queryClient.setQueryData(getGetHomeContentQueryKey(), saved);
      setSaveStatus('saved');
      setSectionSaveError(null);
      toast({ title: 'Homepage updated', description: 'Your changes have been saved and are live.' });
    } catch (error) {
      setFormError(errorMessage(error));
    }
  };

  const saveSection = async (section: 'hero' | 'trust' | 'opportunity' | 'services') => {
    if (!form || !savedForm) return;
    setFormError('');
    setSectionSaveError(null);
    try {
      const payload = withoutLegacyAssurances({ ...savedForm, [section]: form[section] });
      const saved = withoutLegacyAssurances(await saveContent.mutateAsync({ data: payload }));
      setSavedForm(saved);
      setForm((current) => current ? { ...current, [section]: saved[section] } as HomePageContent : current);
      queryClient.setQueryData(getGetAdminHomeContentQueryKey(), saved);
      queryClient.setQueryData(getGetHomeContentQueryKey(), saved);
      toast({ title: `${titleFor(section)} updated`, description: 'Your changes have been saved and are live.', className: 'border-emerald-200 bg-emerald-50 text-emerald-900' });
    } catch (error) {
      setSectionSaveError({ section, message: errorMessage(error) });
    }
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void saveChanges();
  };

  const reloadContent = async () => {
    setFormError('');
    setSaveStatus('');
    const result = await contentQuery.refetch();
    if (result.data) {
      const loaded = withoutLegacyAssurances(result.data);
      setForm(loaded);
      setSavedForm(loaded);
      setHasLoadedContent(true);
      setSectionSaveError(null);
    }
  };

  if (contentQuery.isError) return <section><div className="eyebrow text-[#826900]">Website content</div><h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">Homepage</h1><div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6"><p className="text-sm text-red-800">We couldn’t load homepage content.</p><button type="button" onClick={() => contentQuery.refetch()} className="btn-gold mt-4 !py-2.5 text-xs">Retry <ArrowRight size={14} /></button></div></section>;
  if (contentQuery.isLoading || !form) return <section><div className="eyebrow text-[#826900]">Website content</div><h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">Homepage</h1><p className="mt-8 text-sm text-black/50">Loading homepage content…</p></section>;

  return <section>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="eyebrow text-[#826900]">Website content</div><h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">Homepage</h1><p className="mt-2 text-sm text-black/55">Edit every homepage section, chart value, card, testimonial, contact detail, and footer text. Public page styling stays unchanged.</p></div><div className="flex gap-2"><button type="button" onClick={reloadContent} disabled={saveContent.isPending || contentQuery.isFetching} className="btn-outline w-fit border-black/20 !px-4 !py-3 text-sm disabled:opacity-60"><RefreshCw size={15} /> Reload</button><button form="admin-home-content-form" type="submit" disabled={saveContent.isPending} className="btn-gold w-fit !px-5 !py-3 text-sm disabled:opacity-60"><Save size={16} />{saveContent.isPending ? 'Saving…' : 'Save changes'}</button></div></div>
    <form id="admin-home-content-form" onSubmit={submit} className="mt-8 grid gap-6">
      {(Object.entries(form) as [keyof HomePageContent, HomePageContent[keyof HomePageContent]][]).map(([section, value]) => {
        const canSaveSection = section === 'hero' || section === 'trust' || section === 'opportunity' || section === 'services';
        return <div key={section} className="grid gap-3">
          <ContentEditor title={titleFor(section)} path={section} value={value as JsonValue} onChange={(nextValue) => { setForm((current) => current ? { ...current, [section]: nextValue } as HomePageContent : current); setFormError(''); setSaveStatus(''); setSectionSaveError(null); }} />
          {canSaveSection && <div className="grid gap-2">
            {sectionSaveError?.section === section && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{sectionSaveError.message}</p>}
            <div className="flex justify-end"><button type="button" onClick={() => void saveSection(section)} disabled={saveContent.isPending} className="btn-gold !px-5 !py-3 text-sm disabled:opacity-60"><Save size={16} />{saveContent.isPending ? 'Saving…' : 'Save changes'}</button></div>
          </div>}
        </div>;
      })}
      {saveStatus === 'saved' && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">Homepage content saved successfully. The public page is updated.</p>}
      {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
      <div className="flex justify-end"><button type="submit" disabled={saveContent.isPending} className="btn-gold !px-5 !py-3 text-sm disabled:opacity-60">{saveContent.isPending ? 'Saving…' : 'Save all homepage sections'} <ArrowRight size={15} /></button></div>
    </form>
  </section>;
}
