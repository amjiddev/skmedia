import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowRight, ImagePlus, Save, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetAboutContentQueryKey,
  getGetAdminAboutContentQueryKey,
  useGetAdminAboutContent,
  useUpdateAboutContent,
} from '@workspace/api-client-react';
import type { AboutContent } from '@workspace/api-client-react';
import { toast } from '@/hooks/use-toast';

const initialContent: AboutContent = {
  heroKicker: 'A different kind of partner',
  heroTitle: 'Creators deserve to be seen',
  heroIntro: 'SK Media Monetization exists to help creators move from making content to building something sustainable around it.',
  storyLabel: 'Our story',
  storyTitle: 'Built for the people behind the posts.',
  storyBody: 'Creators are building culture, communities, and businesses every day. But the rules around platform monetization can feel opaque, and the advice available often skips the human part.\n\nOur focus is making those next steps easier to understand. From platform readiness to content strategy, we offer practical guidance with respect for what makes each creator different.\n\nWe’re based in Pakistan, built for a global creator landscape, and committed to earning trust one clear conversation at a time.',
  storyImage: 'photo-1521737711867-e3b97375f902',
  storyCaption: 'Creator-first. Built for what’s next.',
  missionLabel: 'Our mission',
  missionTitle: 'Make creator income feel more within reach.',
  missionBody: 'We help creators understand their options, build a healthier content foundation, and pursue monetization with confidence. The goal isn’t to make you someone else. It’s to help your work go further as you.',
  missionImage: 'photo-1516321318423-f06f85e504b3',
  missionCaption: 'Helping your work go further.',
};

function imageSource(value: string) {
  if (value.startsWith('data:image/') || /^https?:\/\//i.test(value)) return value;
  return value ? `https://images.unsplash.com/${value}?auto=format&fit=crop&w=900&q=85` : '';
}

async function prepareAboutImage(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG, or WebP image.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Image must be smaller than 10 MB.');
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not process this image.');
    let blob: Blob | null = null;
    for (const maxDimension of [1140, 900, 700, 500, 360]) {
      const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.72, 0.55, 0.4, 0.28]) {
        blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
        if (blob && blob.size <= 48 * 1024) break;
      }
      if (blob && blob.size <= 48 * 1024) break;
    }
    if (!blob || blob.size > 48 * 1024) throw new Error('Could not compress this image enough. Choose a smaller image.');
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read image file.'));
      reader.onerror = () => reject(new Error('Could not read image file.'));
      reader.readAsDataURL(blob);
    });
  } finally {
    bitmap.close();
  }
}

function errorText(error: unknown) {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string') return data.error;
  }
  if (error instanceof Error && error.message && error.message !== 'Request failed') return error.message;
  return 'Could not save About page content. Check the API connection and try again.';
}

export default function AdminAboutPanel() {
  const queryClient = useQueryClient();
  const contentQuery = useGetAdminAboutContent();
  const saveContent = useUpdateAboutContent();
  const [form, setForm] = useState<AboutContent>(initialContent);
  const [formError, setFormError] = useState('');
  const [hasLoadedContent, setHasLoadedContent] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);

  useEffect(() => {
    if (!contentQuery.data || hasLoadedContent) return;
    setForm(contentQuery.data);
    setHasLoadedContent(true);
  }, [contentQuery.data, hasLoadedContent]);

  const setField = <K extends keyof AboutContent>(key: K, value: AboutContent[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const chooseImage = async (event: ChangeEvent<HTMLInputElement>, key: 'storyImage' | 'missionImage') => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    setFormError('');
    setImageProcessing(true);
    try {
      setField(key, await prepareAboutImage(file));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not process this image.');
    } finally {
      setImageProcessing(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    if (imageProcessing) return;
    saveContent.mutate({ data: form }, {
      onSuccess: async (saved) => {
        setForm(saved);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getGetAdminAboutContentQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getGetAboutContentQueryKey() }),
        ]);
        toast({ title: 'About page updated', description: 'Your header, story, and mission changes are now live.' });
      },
      onError: (error) => setFormError(errorText(error)),
    });
  };

  const textField = (label: string, key: keyof AboutContent, maxLength: number, multiline = false) => (
    <label className="grid gap-2 text-xs font-semibold text-[#5f5d55]">
      {label}
      {multiline
        ? <textarea required minLength={1} maxLength={maxLength} rows={5} value={String(form[key])} onChange={(event) => setField(key, event.target.value)} className="form-field min-h-[120px] resize-y !border-[#d0cabd] !bg-white !text-[#211f1b]" />
        : <input required minLength={1} maxLength={maxLength} value={String(form[key])} onChange={(event) => setField(key, event.target.value)} className="form-field !border-[#d0cabd] !bg-white !text-[#211f1b]" />}
    </label>
  );

  const imageField = (label: string, key: 'storyImage' | 'missionImage') => {
    const src = imageSource(form[key]);
    return <div className="grid gap-3">
      <label className="grid gap-2 text-xs font-semibold text-[#5f5d55]">{label}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void chooseImage(event, key)} disabled={imageProcessing} className="form-field !border-[#d0cabd] !bg-white !text-[#211f1b] file:mr-3 file:rounded-full file:border-0 file:bg-[#f1efe8] file:px-3 file:py-1.5 file:text-xs file:font-semibold" /><span className="text-[11px] font-normal text-[#77756f]">Upload JPG, PNG, or WebP (up to 10 MB); it will be compressed automatically. Or paste an image URL, data image, or Unsplash photo ID below.</span><input maxLength={200000} value={form[key]} onChange={(event) => setField(key, event.target.value)} placeholder="https://… or photo-…" className="form-field !border-[#d0cabd] !bg-white !text-[#211f1b]" /></label>
      {src ? <div className="group relative"><img src={src} alt={`${label} preview`} className="aspect-[16/7] w-full rounded-xl border border-black/10 object-cover" loading="lazy" decoding="async" width={1360} height={595} /><button type="button" onClick={() => setField(key, '')} aria-label={`Remove ${label.toLowerCase()}`} title="Remove image" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/75 text-white shadow-lg transition hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" data-testid={`button-remove-${key}`}><X size={18} /></button></div> : <div className="grid aspect-[16/7] place-items-center rounded-xl border border-dashed border-black/20 bg-black/[.03] text-black/35"><ImagePlus size={22} /></div>}
    </div>;
  };

  if (contentQuery.isLoading) return <section><div className="eyebrow text-[#826900]">Website content</div><h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">Our Story</h1><p className="mt-8 text-sm text-black/50">Loading About page content…</p></section>;
  if (contentQuery.isError) return <section><div className="eyebrow text-[#826900]">Website content</div><h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">Our Story</h1><div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6"><p className="text-sm text-red-800">We couldn’t load About page content.</p><button type="button" onClick={() => contentQuery.refetch()} className="btn-gold mt-4 !py-2.5 text-xs">Retry <ArrowRight size={14} /></button></div></section>;

  return <section>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="eyebrow text-[#826900]">Website content</div><h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">Our Story</h1><p className="mt-2 text-sm text-black/55">Edit the About page header, Our Story, and Our Mission sections, including their images and captions.</p></div><button form="admin-about-content-form" type="submit" disabled={saveContent.isPending || imageProcessing} className="btn-gold w-fit !px-5 !py-3 text-sm disabled:opacity-60" data-testid="button-save-about-content"><Save size={16} />{imageProcessing ? 'Preparing image…' : saveContent.isPending ? 'Saving…' : 'Save changes'}</button></div>
    <form id="admin-about-content-form" onSubmit={submit} className="mt-8 grid gap-6">
      <section className="rounded-2xl border border-black/10 bg-[#fbfaf6] p-5 md:p-7"><div className="mb-5"><h2 className="font-display text-xl font-extrabold tracking-[-.04em]">Page header</h2><p className="mt-1 text-xs text-black/45">The centered intro shown at the top of the About page.</p></div><div className="grid gap-4">{textField('Eyebrow', 'heroKicker', 120)}{textField('Headline', 'heroTitle', 240)}{textField('Introduction', 'heroIntro', 1000, true)}</div></section>
      <section className="rounded-2xl border border-black/10 bg-[#fbfaf6] p-5 md:p-7"><div className="mb-5"><h2 className="font-display text-xl font-extrabold tracking-[-.04em]">Our Story</h2><p className="mt-1 text-xs text-black/45">Separate paragraphs with a blank line. The image and overlay caption are editable too.</p></div><div className="grid gap-4">{textField('Eyebrow', 'storyLabel', 120)}{textField('Headline', 'storyTitle', 240)}{textField('Story text', 'storyBody', 5000, true)}{imageField('Story image', 'storyImage')}{textField('Image caption', 'storyCaption', 240)}</div></section>
      <section className="rounded-2xl border border-black/10 bg-[#fbfaf6] p-5 md:p-7"><div className="mb-5"><h2 className="font-display text-xl font-extrabold tracking-[-.04em]">Our Mission</h2><p className="mt-1 text-xs text-black/45">The image is displayed beside the mission copy on larger screens.</p></div><div className="grid gap-4">{textField('Eyebrow', 'missionLabel', 120)}{textField('Headline', 'missionTitle', 240)}{textField('Mission statement', 'missionBody', 3000, true)}{imageField('Mission image', 'missionImage')}{textField('Image caption', 'missionCaption', 240)}</div></section>
      {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
      <div className="flex justify-end"><button type="submit" disabled={saveContent.isPending || imageProcessing} className="btn-gold !px-5 !py-3 text-sm disabled:opacity-60">{imageProcessing ? 'Preparing image…' : saveContent.isPending ? 'Saving…' : 'Save all sections'} <ArrowRight size={15} /></button></div>
    </form>
  </section>;
}
