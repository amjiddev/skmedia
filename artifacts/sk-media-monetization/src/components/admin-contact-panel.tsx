import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Save } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetAdminContactContentQueryKey,
  getGetContactContentQueryKey,
  useGetAdminContactContent,
  useUpdateContactContent,
} from '@workspace/api-client-react';
import type { ContactPageContent } from '@workspace/api-client-react';
import { toast } from '@/hooks/use-toast';

function errorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string') return data.error;
  }
  return 'Could not save Contact page content. Check the API connection and try again.';
}

export default function AdminContactPanel() {
  const queryClient = useQueryClient();
  const contentQuery = useGetAdminContactContent();
  const saveContent = useUpdateContactContent();
  const [form, setForm] = useState<ContactPageContent | null>(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (contentQuery.data) setForm(contentQuery.data);
  }, [contentQuery.data]);

  const setField = <K extends keyof ContactPageContent>(key: K, value: ContactPageContent[K]) => {
    setForm((current) => current ? { ...current, [key]: value } : current);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form) return;
    setFormError('');
    saveContent.mutate({ data: form }, {
      onSuccess: async (saved) => {
        setForm(saved);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getGetAdminContactContentQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getGetContactContentQueryKey() }),
        ]);
        toast({ title: 'Contact page updated', description: 'Your Contact page content and details are now live.' });
      },
      onError: (error) => setFormError(errorMessage(error)),
    });
  };

  const textField = (label: string, key: keyof ContactPageContent, maxLength: number, multiline = false) => (
    <label className="grid gap-2 text-xs font-semibold text-[#5f5d55]">
      {label}
      {multiline
        ? <textarea required maxLength={maxLength} rows={4} value={String(form?.[key] ?? '')} onChange={(event) => setField(key, event.target.value)} className="form-field min-h-[100px] resize-y !border-[#d0cabd] !bg-white !text-[#211f1b]" />
        : <input required maxLength={maxLength} type={key === 'email' ? 'email' : key === 'whatsappUrl' ? 'url' : 'text'} value={String(form?.[key] ?? '')} onChange={(event) => setField(key, event.target.value)} className="form-field !border-[#d0cabd] !bg-white !text-[#211f1b]" />}
    </label>
  );

  if (contentQuery.isError) return <section><div className="eyebrow text-[#826900]">Website content</div><h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">Contact</h1><div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6"><p className="text-sm text-red-800">We couldn’t load Contact page content.</p><button type="button" onClick={() => contentQuery.refetch()} className="btn-gold mt-4 !py-2.5 text-xs">Retry <ArrowRight size={14} /></button></div></section>;
  if (contentQuery.isLoading || !form) return <section><div className="eyebrow text-[#826900]">Website content</div><h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">Contact</h1><p className="mt-8 text-sm text-black/50">Loading Contact page content…</p></section>;

  return <section>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="eyebrow text-[#826900]">Website content</div><h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">Contact</h1><p className="mt-2 text-sm text-black/55">Edit the public Contact page introduction, form headings, phone numbers, email, and office location.</p></div><button form="admin-contact-content-form" type="submit" disabled={saveContent.isPending} className="btn-gold w-fit !px-5 !py-3 text-sm disabled:opacity-60" data-testid="button-save-contact-content"><Save size={16} />{saveContent.isPending ? 'Saving…' : 'Save changes'}</button></div>
    <form id="admin-contact-content-form" onSubmit={submit} className="mt-8 grid gap-6">
      <section className="rounded-2xl border border-black/10 bg-[#fbfaf6] p-5 md:p-7"><div className="mb-5"><h2 className="font-display text-xl font-extrabold tracking-[-.04em]">Page intro</h2><p className="mt-1 text-xs text-black/45">The hero displayed at the top of the public Contact page.</p></div><div className="grid gap-4">{textField('Headline', 'heroTitle', 240)}{textField('Introduction', 'heroIntro', 1000, true)}</div></section>
      <section className="rounded-2xl border border-black/10 bg-[#fbfaf6] p-5 md:p-7"><div className="mb-5"><h2 className="font-display text-xl font-extrabold tracking-[-.04em]">Contact form section</h2><p className="mt-1 text-xs text-black/45">These headings appear beside the existing enquiry form. Form submissions continue to be stored in Creator leads.</p></div><div className="grid gap-4">{textField('Heading', 'formTitle', 240)}</div></section>
      <section className="rounded-2xl border border-black/10 bg-[#fbfaf6] p-5 md:p-7"><div className="mb-5"><h2 className="font-display text-xl font-extrabold tracking-[-.04em]">Direct contact details</h2><p className="mt-1 text-xs text-black/45">Phone numbers, email, and address are reflected on the public page. The map updates from the address.</p></div><div className="grid gap-4 md:grid-cols-2">{textField('Section description', 'directDescription', 500, true)}{textField('Primary phone number', 'primaryPhone', 32)}{textField('Secondary phone number', 'secondaryPhone', 32)}{textField('Email address', 'email', 254)}{textField('Office address', 'address', 300, true)}</div></section>
      {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" data-testid="status-admin-contact-content-error">{formError}</p>}
      <div className="flex justify-end"><button type="submit" disabled={saveContent.isPending} className="btn-gold !px-5 !py-3 text-sm disabled:opacity-60">{saveContent.isPending ? 'Saving…' : 'Save all changes'} <ArrowRight size={15} /></button></div>
    </form>
  </section>;
}
