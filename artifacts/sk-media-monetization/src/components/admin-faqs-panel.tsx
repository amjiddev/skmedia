import { useEffect, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetAdminFaqsQueryKey,
  getGetFaqsQueryKey,
  useGetAdminFaqs,
  useUpdateAdminFaqs,
} from '@workspace/api-client-react';
import type { FAQEntry, FAQPageContent } from '@workspace/api-client-react';
import { toast } from '@/hooks/use-toast';

const emptyContent: FAQPageContent = {
  title: 'Your Questions, Answered Clearly',
  description: 'Still deciding if we’re the right fit? Start here.',
  faqs: [],
};

function errorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string') return data.error;
  }
  return 'Could not save FAQ content. Check the API connection and try again.';
}

export default function AdminFaqsPanel() {
  const queryClient = useQueryClient();
  const faqsQuery = useGetAdminFaqs();
  const saveFaqs = useUpdateAdminFaqs();
  const [form, setForm] = useState<FAQPageContent>(emptyContent);
  const [formError, setFormError] = useState('');
  const [hasLoadedFaqs, setHasLoadedFaqs] = useState(false);

  useEffect(() => {
    if (!faqsQuery.data || hasLoadedFaqs) return;
    setForm(faqsQuery.data);
    setHasLoadedFaqs(true);
  }, [faqsQuery.data, hasLoadedFaqs]);

  const updateFaq = (index: number, update: Partial<FAQEntry>) => {
    setForm((current) => ({
      ...current,
      faqs: current.faqs.map((faq, faqIndex) => faqIndex === index ? { ...faq, ...update } : faq),
    }));
  };

  const moveFaq = (index: number, offset: number) => {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= form.faqs.length) return;
    const faqs = [...form.faqs];
    [faqs[index], faqs[nextIndex]] = [faqs[nextIndex], faqs[index]];
    setForm((current) => ({ ...current, faqs }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    saveFaqs.mutate({ data: form }, {
      onSuccess: async (saved) => {
        setForm(saved);
        queryClient.setQueryData(getGetFaqsQueryKey(), {
          title: saved.title,
          description: saved.description,
          faqs: saved.faqs.filter((faq) => faq.isPublished),
        });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getGetAdminFaqsQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getGetFaqsQueryKey() }),
        ]);
        toast({ title: 'FAQs updated', description: 'Your questions and answers are now saved.' });
      },
      onError: (error) => setFormError(errorMessage(error)),
    });
  };

  const addFaq = () => {
    setForm((current) => ({
      ...current,
      faqs: [...current.faqs, { id: crypto.randomUUID(), question: '', answer: '', isPublished: true }],
    }));
  };

  if (faqsQuery.isLoading) return <section><div className="eyebrow text-[#826900]">Website content</div><h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">FAQs</h1><p className="mt-8 text-sm text-black/50">Loading questions and answers…</p></section>;
  if (faqsQuery.isError) return <section><div className="eyebrow text-[#826900]">Website content</div><h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">FAQs</h1><div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6"><p className="text-sm text-red-800">We couldn’t load FAQ content.</p><button type="button" onClick={() => faqsQuery.refetch()} className="btn-gold mt-4 !py-2.5 text-xs">Retry <ArrowRight size={14} /></button></div></section>;

  return <section>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="eyebrow text-[#826900]">Website content</div><h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">FAQs</h1><p className="mt-2 text-sm text-black/55">Add, edit, reorder, and publish the questions and answers shown on the home page.</p></div><button form="admin-faqs-form" type="submit" disabled={saveFaqs.isPending} className="btn-gold w-fit !px-5 !py-3 text-sm disabled:opacity-60"><Save size={16} />{saveFaqs.isPending ? 'Saving…' : 'Save changes'}</button></div>
    <form id="admin-faqs-form" onSubmit={submit} className="mt-8 grid gap-4">
      <section className="rounded-2xl border border-black/10 bg-[#fbfaf6] p-5 md:p-6"><div className="mb-4"><h2 className="font-display text-lg font-bold">FAQ section heading</h2><p className="mt-1 text-xs text-black/45">This title and description appear above the questions on the home page.</p></div><div className="grid gap-4"><label className="grid gap-2 text-xs font-semibold text-[#5f5d55]">Title<input required minLength={1} maxLength={240} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Your Questions, Answered Clearly" className="form-field !border-[#d0cabd] !bg-white !text-[#211f1b]" data-testid="input-faq-page-title" /></label><label className="grid gap-2 text-xs font-semibold text-[#5f5d55]">Description<textarea required minLength={1} maxLength={1000} rows={2} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="A short introduction to your FAQs" className="form-field min-h-[72px] resize-y !border-[#d0cabd] !bg-white !text-[#211f1b]" data-testid="textarea-faq-page-description" /></label></div></section>
      {form.faqs.length === 0 && <div className="rounded-2xl border border-dashed border-black/20 bg-[#fbfaf6] px-6 py-12 text-center"><h2 className="font-display text-xl font-bold">No FAQs yet</h2><p className="mt-2 text-sm text-black/50">Add a question and answer to display in the public FAQ section.</p></div>}
      {form.faqs.map((faq, index) => <article key={faq.id} className="rounded-2xl border border-black/10 bg-[#fbfaf6] p-5 md:p-6" data-testid={`admin-faq-${index}`}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#ffd700]/35 font-display text-sm font-extrabold">{String(index + 1).padStart(2, '0')}</span><h2 className="font-display text-lg font-bold">Question {index + 1}</h2><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${faq.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-black/5 text-black/45'}`}>{faq.isPublished ? 'Published' : 'Draft'}</span></div><div className="flex items-center gap-2"><button type="button" onClick={() => moveFaq(index, -1)} disabled={index === 0} aria-label={`Move question ${index + 1} up`} className="grid h-9 w-9 place-items-center rounded-lg border border-black/15 disabled:opacity-30"><ArrowUp size={15} /></button><button type="button" onClick={() => moveFaq(index, 1)} disabled={index === form.faqs.length - 1} aria-label={`Move question ${index + 1} down`} className="grid h-9 w-9 place-items-center rounded-lg border border-black/15 disabled:opacity-30"><ArrowDown size={15} /></button><button type="button" onClick={() => setForm((current) => ({ ...current, faqs: current.faqs.filter((_, faqIndex) => faqIndex !== index) }))} aria-label={`Remove question ${index + 1}`} className="grid h-9 w-9 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"><Trash2 size={15} /></button></div></div>
        <div className="grid gap-4"><label className="grid gap-2 text-xs font-semibold text-[#5f5d55]">Question / title<input required minLength={1} maxLength={300} value={faq.question} onChange={(event) => updateFaq(index, { question: event.target.value })} placeholder="Enter the question" className="form-field !border-[#d0cabd] !bg-white !text-[#211f1b]" data-testid={`input-faq-question-${index}`} /></label><label className="grid gap-2 text-xs font-semibold text-[#5f5d55]">Answer<textarea required minLength={1} maxLength={3000} rows={4} value={faq.answer} onChange={(event) => updateFaq(index, { answer: event.target.value })} placeholder="Write a clear answer" className="form-field min-h-[110px] resize-y !border-[#d0cabd] !bg-white !text-[#211f1b]" data-testid={`textarea-faq-answer-${index}`} /></label><label className="flex w-fit cursor-pointer items-center gap-2 text-xs font-semibold text-[#5f5d55]"><input type="checkbox" checked={faq.isPublished} onChange={(event) => updateFaq(index, { isPublished: event.target.checked })} className="h-4 w-4 accent-[#b18a00]" data-testid={`checkbox-faq-published-${index}`} />Show this FAQ on the website</label></div>
      </article>)}
      <button type="button" onClick={addFaq} disabled={form.faqs.length >= 50} className="inline-flex w-fit items-center gap-2 rounded-full border border-black/15 px-4 py-2.5 text-xs font-bold transition hover:bg-black/5 disabled:opacity-40" data-testid="button-add-faq"><Plus size={15} /> Add question</button>
      {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
      <div className="flex justify-end"><button type="submit" disabled={saveFaqs.isPending} className="btn-gold !px-5 !py-3 text-sm disabled:opacity-60">{saveFaqs.isPending ? 'Saving…' : 'Save all FAQs'} <ArrowRight size={15} /></button></div>
    </form>
  </section>;
}
