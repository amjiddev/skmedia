import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Save } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetAdminHomeContentQueryKey,
  getGetHomeContentQueryKey,
  useGetAdminHomeContent,
  useUpdateHomeContent,
} from '@workspace/api-client-react';
import type { HomePageContentFooter } from '@workspace/api-client-react';
import { toast } from '@/hooks/use-toast';

function errorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string') return data.error;
  }
  return 'Could not save footer content. Check the API connection and try again.';
}

export default function AdminFooterPanel() {
  const queryClient = useQueryClient();
  const contentQuery = useGetAdminHomeContent();
  const saveContent = useUpdateHomeContent();
  const [form, setForm] = useState<HomePageContentFooter | null>(null);
  const [formError, setFormError] = useState('');
  const [hasLoadedContent, setHasLoadedContent] = useState(false);

  useEffect(() => {
    if (!contentQuery.data || hasLoadedContent) return;
    setForm(contentQuery.data.footer);
    setHasLoadedContent(true);
  }, [contentQuery.data, hasLoadedContent]);

  const updateField = <K extends keyof HomePageContentFooter>(key: K, value: HomePageContentFooter[K]) => {
    setForm((current) => current ? { ...current, [key]: value } : current);
    setFormError('');
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form || !contentQuery.data) return;
    setFormError('');
    saveContent.mutate({ data: { ...contentQuery.data, footer: form } }, {
      onSuccess: async (saved) => {
        setForm(saved.footer);
        queryClient.setQueryData(getGetAdminHomeContentQueryKey(), saved);
        queryClient.setQueryData(getGetHomeContentQueryKey(), saved);
        toast({ title: 'Footer updated', description: 'Your footer changes are now live.' });
      },
      onError: (error) => setFormError(errorMessage(error)),
    });
  };

  if (contentQuery.isError) return <section><div className="eyebrow text-[#826900]">Website content</div><h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">Footer</h1><div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6"><p className="text-sm text-red-800">We couldn’t load footer content.</p><button type="button" onClick={() => contentQuery.refetch()} className="btn-gold mt-4 !py-2.5 text-xs">Retry <ArrowRight size={14} /></button></div></section>;
  if (contentQuery.isLoading || !form) return <section><div className="eyebrow text-[#826900]">Website content</div><h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">Footer</h1><p className="mt-8 text-sm text-black/50">Loading footer content…</p></section>;

  const field = (label: string, key: keyof HomePageContentFooter, maxLength: number, multiline = false) => (
    <label className="grid gap-2 text-xs font-semibold text-[#5f5d55]">
      {label}
      {multiline
        ? <textarea required maxLength={maxLength} rows={3} value={form[key]} onChange={(event) => updateField(key, event.target.value)} className="form-field min-h-[88px] resize-y !border-[#d0cabd] !bg-white !text-[#211f1b]" />
        : <input required={key !== 'email'} type={key === 'email' ? 'email' : 'text'} maxLength={maxLength} value={form[key]} onChange={(event) => updateField(key, event.target.value)} className="form-field !border-[#d0cabd] !bg-white !text-[#211f1b]" />}
    </label>
  );

  return <section>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="eyebrow text-[#826900]">Website content</div><h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">Footer</h1><p className="mt-2 text-sm text-black/55">Edit all footer text and contact details shown across the website.</p></div><button form="admin-footer-content-form" type="submit" disabled={saveContent.isPending} className="btn-gold w-fit !px-5 !py-3 text-sm disabled:opacity-60"><Save size={16} />{saveContent.isPending ? 'Saving…' : 'Save changes'}</button></div>
    <form id="admin-footer-content-form" onSubmit={submit} className="mt-8 grid gap-4 rounded-2xl border border-black/10 bg-[#fbfaf6] p-5 md:p-7">
      {field('Description', 'description', 1000, true)}
      <div className="grid gap-4 md:grid-cols-2">
        {field('Primary phone', 'primaryPhone', 32)}
        {field('Secondary phone', 'secondaryPhone', 32)}
      </div>
      {field('Email', 'email', 254)}
      {field('Address', 'address', 300, true)}
      {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
      <div className="flex justify-end"><button type="submit" disabled={saveContent.isPending} className="btn-gold !px-5 !py-3 text-sm disabled:opacity-60">{saveContent.isPending ? 'Saving…' : 'Save footer'} <ArrowRight size={15} /></button></div>
    </form>
  </section>;
}
