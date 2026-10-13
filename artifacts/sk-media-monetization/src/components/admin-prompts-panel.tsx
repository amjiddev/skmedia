import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowRight, FileText, ImagePlus, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetAdminPromptsQueryKey,
  getGetPromptsQueryKey,
  useCreatePrompt,
  useDeletePrompt,
  useGetAdminPrompts,
  useUpdatePrompt,
} from '@workspace/api-client-react';
import type { Prompt, PromptInput } from '@workspace/api-client-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

const blankPrompt: PromptInput = {
  slug: '',
  title: '',
  category: '',
  access: 'Free',
  placement: 'both',
  image: '',
  promptText: '',
  promptFileName: undefined,
  promptFileData: undefined,
  removePromptFile: false,
  isPublished: false,
  sortOrder: 0,
};

function imageSource(value: string) {
  if (value.startsWith('data:image/')) return value;
  if (/^https?:\/\//i.test(value)) return value;
  return value ? `https://images.unsplash.com/${value}?auto=format&fit=crop&w=480&q=80` : '';
}

async function prepareImage(file: File) {
  const maxInputBytes = 10 * 1024 * 1024;
  // Keep image data small so prompt requests stay comfortably under the API body limit.
  const maxOutputBytes = 48 * 1024;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPG, PNG, or WebP image.');
  }
  if (file.size > maxInputBytes) throw new Error('Image must be smaller than 10 MB.');

  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not process this image. Try another file.');
    let blob: Blob | null = null;
    for (const maxDimension of [1000, 800, 640, 480, 360, 240]) {
      const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.78, 0.62, 0.46, 0.3]) {
        blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
        if (blob && blob.size <= maxOutputBytes) break;
      }
      if (blob && blob.size <= maxOutputBytes) break;
    }
    if (!blob || blob.size > maxOutputBytes) throw new Error('Could not compress this image enough. Try a smaller image.');
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read image file.'));
      reader.onerror = () => reject(new Error('Could not read image file.'));
      reader.readAsDataURL(blob);
    });
    return dataUrl;
  } finally {
    bitmap.close();
  }
}

function makeSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function errorText(error: unknown) {
  if (typeof error === 'object' && error !== null && 'status' in error && error.status === 413) {
    return 'The upload was rejected as too large. Please choose a smaller prompt image or file and try again.';
  }
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string') return data.error;
    if (typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string') return data.message;
  }
  if (error instanceof Error && error.message && error.message !== 'Request failed') return error.message;
  if (typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number') {
    return `Could not save prompt (HTTP ${error.status}). Please check the API server and database, then retry.`;
  }
  return 'Could not save the prompt. Please try again.';
}

export default function AdminPromptsPanel() {
  const queryClient = useQueryClient();
  const promptsQuery = useGetAdminPrompts();
  const createPrompt = useCreatePrompt();
  const updatePrompt = useUpdatePrompt();
  const deletePrompt = useDeletePrompt();
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [form, setForm] = useState<PromptInput>(blankPrompt);
  const [formError, setFormError] = useState('');
  const [imageError, setImageError] = useState('');
  const [imageProcessing, setImageProcessing] = useState(false);
  const [promptFileError, setPromptFileError] = useState('');
  const [promptFileProcessing, setPromptFileProcessing] = useState(false);
  const [saving, setSaving] = useState(false);

  const prompts = promptsQuery.data ?? [];
  const visiblePrompts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return prompts.filter((prompt) => !term || `${prompt.title} ${prompt.category} ${prompt.slug}`.toLowerCase().includes(term));
  }, [prompts, search]);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetAdminPromptsQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetPromptsQueryKey() }),
    ]);
  };

  const openNewPrompt = () => {
    setEditingPrompt(null);
    setForm({ ...blankPrompt, sortOrder: prompts.length });
    setFormError('');
    setImageError('');
    setPromptFileError('');
    setEditorOpen(true);
  };

  const openEditPrompt = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setForm({
      slug: prompt.slug,
      title: prompt.title,
      category: prompt.category,
      access: prompt.access,
      placement: prompt.placement,
      image: prompt.image,
      promptText: prompt.promptText,
      promptFileName: prompt.promptFileName ?? undefined,
      promptFileData: undefined,
      removePromptFile: false,
      isPublished: prompt.isPublished,
      sortOrder: prompt.sortOrder,
    });
    setFormError('');
    setImageError('');
    setPromptFileError('');
    setEditorOpen(true);
  };

  const chooseImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    setImageError('');
    setImageProcessing(true);
    try {
      const image = await prepareImage(file);
      setForm((current) => ({ ...current, image }));
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Could not process this image.');
    } finally {
      setImageProcessing(false);
    }
  };

  const choosePromptFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    setPromptFileError('');
    if (file.size > 2 * 1024 * 1024) {
      setPromptFileError('Prompt file must be 2 MB or smaller.');
      return;
    }
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!['pdf', 'txt', 'md', 'doc', 'docx', 'rtf'].includes(extension)) {
      setPromptFileError('Choose a PDF, TXT, MD, DOC, DOCX, or RTF file.');
      return;
    }
    setPromptFileProcessing(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read the selected file.'));
        reader.onerror = () => reject(new Error('Could not read the selected file.'));
        reader.readAsDataURL(file);
      });
      const comma = dataUrl.indexOf(',');
      if (comma < 0) throw new Error('Could not encode the selected file.');
      setForm((current) => ({ ...current, promptFileName: file.name, promptFileData: dataUrl.slice(comma + 1), removePromptFile: false }));
    } catch (error) {
      setPromptFileError(error instanceof Error ? error.message : 'Could not read the selected file.');
    } finally {
      setPromptFileProcessing(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    if (imageProcessing || promptFileProcessing) return;
    
    // Validate all required fields before submission
    const validationErrors: string[] = [];
    if (!form.title || form.title.length < 3) validationErrors.push('Title must be at least 3 characters');
    if (!form.slug) validationErrors.push('URL slug is required');
    if (form.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) validationErrors.push('URL slug must be lowercase alphanumeric with hyphens only');
    if (!form.category) validationErrors.push('Category is required');
    if (!form.promptText.trim() && !(form.promptFileData || (editingPrompt && form.promptFileName && !form.removePromptFile))) validationErrors.push('Add prompt text or attach a downloadable file');
    if (!form.image) validationErrors.push('Prompt image is required');
    if (form.image.startsWith('data:image/') && form.image.length > 72 * 1024) validationErrors.push('Image is too large. Please choose the image again.');
    
    if (validationErrors.length > 0) {
      setFormError(validationErrors.join('\n'));
      return;
    }
    
    setSaving(true);
    const onSuccess = () => {
      void refresh();
      setSaving(false);
      setEditorOpen(false);
    };
    const onError = (error: unknown) => {
      setFormError(errorText(error));
      setSaving(false);
    };
    if (editingPrompt) updatePrompt.mutate({ id: editingPrompt.id, data: form }, { onSuccess, onError });
    else createPrompt.mutate({ data: form }, { onSuccess, onError });
  };

  const removePrompt = (prompt: Prompt) => {
    if (!window.confirm(`Delete “${prompt.title}”? This cannot be undone.`)) return;
    deletePrompt.mutate({ id: prompt.id }, {
      onSuccess: () => { void refresh(); },
      onError: (error) => window.alert(errorText(error)),
    });
  };

  return <section>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><div className="eyebrow text-[#826900]">Creative workspace</div><h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">Prompts</h1><p className="mt-2 text-sm text-black/55">Manage the published Prompt Party catalogue and premium content.</p></div>
      <button type="button" onClick={openNewPrompt} className="btn-gold w-fit !px-5 !py-3 text-sm"><Plus size={16} /> Add prompt <ArrowRight size={15} /></button>
    </div>
    <section className="mt-8 overflow-hidden rounded-2xl border border-black/10 bg-[#fbfaf6]">
      <div className="flex flex-col justify-between gap-4 border-b border-black/10 p-5 md:flex-row md:items-center md:p-6"><div><h2 className="font-display text-xl font-extrabold tracking-[-.04em]">Prompt catalogue</h2><p className="mt-1 text-xs text-black/45">{prompts.length} prompts · unpublished drafts are visible only here</p></div><label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" size={15} /><input className="form-field !rounded-lg !py-2.5 pl-9 text-xs sm:w-[260px]" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search prompts…" aria-label="Search prompts" /></label></div>
      {promptsQuery.isLoading ? <div className="p-8 text-sm text-black/50">Loading prompt catalogue…</div>
        : promptsQuery.isError ? <div className="p-10 text-center"><p className="font-semibold">We couldn’t load prompts.</p><button type="button" onClick={() => promptsQuery.refetch()} className="btn-gold mt-4 !py-2.5 text-xs">Retry</button></div>
          : visiblePrompts.length === 0 ? <div className="px-6 py-16 text-center"><h3 className="font-display text-xl font-bold">{prompts.length ? 'No matching prompts' : 'No prompts yet'}</h3><p className="mt-2 text-sm text-black/45">Create a prompt to publish it to the public catalogue.</p></div>
            : <div className="grid gap-3 p-4 md:p-5">{visiblePrompts.map((prompt) => <article key={prompt.id} className="grid gap-4 rounded-xl border border-black/10 bg-white p-4 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-center" data-testid={`admin-prompt-${prompt.id}`}>
              {prompt.image ? <img src={imageSource(prompt.image)} alt="" className="aspect-video w-full rounded-lg object-cover sm:w-[120px]" /> : <div className="grid aspect-video w-full place-items-center rounded-lg bg-black/5 text-black/30 sm:w-[120px]"><ImagePlus size={20} /></div>}
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-black px-2.5 py-1 text-[10px] font-bold text-white">{prompt.category}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${prompt.access === 'Premium' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{prompt.access}</span><span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold text-blue-800">{prompt.placement === 'both' ? 'Hero + Main' : prompt.placement === 'hero' ? 'Hero section' : 'Main section'}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${prompt.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-black/5 text-black/55'}`}>{prompt.isPublished ? 'Published' : 'Draft'}</span></div><h3 className="mt-2 truncate font-display text-base font-bold">{prompt.title}</h3><p className="mt-1 truncate text-xs text-black/45">/{prompt.slug} · order {prompt.sortOrder}</p></div>
              <div className="flex gap-2"><button type="button" onClick={() => openEditPrompt(prompt)} className="grid h-10 w-10 place-items-center rounded-lg border border-black/15 hover:bg-black/5" aria-label={`Edit ${prompt.title}`}><Pencil size={16} /></button><button type="button" onClick={() => removePrompt(prompt)} disabled={deletePrompt.isPending} className="grid h-10 w-10 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50" aria-label={`Delete ${prompt.title}`}><Trash2 size={16} /></button></div>
            </article>)}</div>}
    </section>
    <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
      <DialogContent className="top-[4vh] max-h-[92vh] max-w-[760px] translate-y-0 overflow-y-auto border border-[#e7dfd2] bg-[#f8f7f4] p-0 text-[#211f1b] shadow-[0_24px_70px_rgba(0,0,0,.2)] sm:rounded-2xl">
        <form onSubmit={submit}>
          <div className="border-b border-black/10 p-6 sm:p-8"><DialogTitle className="font-display text-2xl font-extrabold">{editingPrompt ? 'Edit prompt' : 'Add a prompt'}</DialogTitle><DialogDescription className="mt-2 text-sm text-[#6a655f]">Prompt details are stored in the database. Only published cards appear publicly.</DialogDescription>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-xs font-semibold">Title<input required minLength={3} maxLength={180} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value, slug: editingPrompt ? current.slug : makeSlug(event.target.value) }))} className="form-field !border-[#d0cabd] !bg-white !text-[#211f1b]" /></label>
              <label className="grid gap-2 text-xs font-semibold">URL slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={180} value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: makeSlug(event.target.value) }))} className="form-field !border-[#d0cabd] !bg-white !text-[#211f1b]" /></label>
              <label className="grid gap-2 text-xs font-semibold">Category<input required maxLength={80} value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="e.g. Nature & Wildlife" className="form-field !border-[#d0cabd] !bg-white !text-[#211f1b]" /></label>
              <label className="grid gap-2 text-xs font-semibold">Access<select value={form.access} onChange={(event) => setForm((current) => ({ ...current, access: event.target.value as PromptInput['access'] }))} className="form-field !border-[#d0cabd] !bg-white !text-[#211f1b]"><option value="Free">Free</option><option value="Premium">Premium</option></select></label>
              <label className="grid gap-2 text-xs font-semibold">Show prompt in<select value={form.placement} onChange={(event) => setForm((current) => ({ ...current, placement: event.target.value as PromptInput['placement'] }))} className="form-field !border-[#d0cabd] !bg-white !text-[#211f1b]"><option value="hero">Hero section only</option><option value="main">Main section only</option><option value="both">Both sections</option></select><span className="text-[11px] font-normal text-[#77756f]">Choose where this prompt card appears on the SK Prompt Party page.</span></label>
              <div className="grid gap-3 sm:col-span-2">
                <label className="grid gap-2 text-xs font-semibold">Prompt image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} disabled={imageProcessing} className="form-field !border-[#d0cabd] !bg-white !text-[#211f1b] file:mr-3 file:rounded-full file:border-0 file:bg-[#f1efe8] file:px-3 file:py-1.5 file:text-xs file:font-semibold" aria-describedby="prompt-image-help" />
                  <span id="prompt-image-help" className="text-[11px] font-normal text-[#77756f]">JPG, PNG or WebP · up to 10 MB. Images are resized and compressed before upload.</span>
                </label>
                {imageProcessing && <p className="text-xs text-black/55" role="status">Preparing image…</p>}
                {imageError && <p className="text-xs text-red-700" role="alert">{imageError}</p>}
                {form.image && <div className="relative w-fit"><img src={imageSource(form.image)} alt="Prompt image preview" className="aspect-video max-h-56 max-w-full rounded-lg object-cover" /><button type="button" onClick={() => { setForm((current) => ({ ...current, image: '' })); setImageError(''); }} className="mt-2 rounded-full border border-black/15 px-3 py-1.5 text-xs font-semibold hover:bg-black/5">Remove image</button></div>}
                {!form.image && <p className="text-xs text-amber-800">Add an image before saving this prompt.</p>}
              </div>
              <label className="grid gap-2 text-xs font-semibold sm:col-span-2">Full prompt content<textarea maxLength={20000} rows={8} value={form.promptText} onChange={(event) => setForm((current) => ({ ...current, promptText: event.target.value }))} className="form-field min-h-[180px] resize-y !border-[#d0cabd] !bg-white !text-[#211f1b]" /><span className="text-[11px] font-normal text-[#77756f]">Enter prompt text, attach a downloadable file, or provide both.</span></label>
              <div className="grid gap-2 text-xs font-semibold sm:col-span-2"><label htmlFor="prompt-content-file">Prompt file for download</label><label htmlFor="prompt-content-file" className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#d0cabd] bg-white p-4 text-sm"><Upload size={18} className="text-[#826900]" /><span>Choose a file</span><input id="prompt-content-file" type="file" accept=".pdf,.txt,.md,.doc,.docx,.rtf" onChange={choosePromptFile} disabled={promptFileProcessing} className="sr-only" aria-describedby="prompt-file-help" /></label><span id="prompt-file-help" className="text-[11px] font-normal text-[#77756f]">PDF, TXT, MD, DOC, DOCX or RTF · up to 2 MB. Visitors can download it from the prompt page.</span>{promptFileProcessing && <p className="text-xs text-black/55" role="status">Reading prompt file…</p>}{promptFileError && <p className="text-xs text-red-700" role="alert">{promptFileError}</p>}{form.promptFileName && !form.removePromptFile && <div className="flex flex-wrap items-center gap-2 rounded-lg bg-black/5 p-3 text-xs"><FileText size={16} /><span className="min-w-0 flex-1 break-all">{form.promptFileName}{form.promptFileData ? ' · ready to upload' : ' · attached'}</span><button type="button" onClick={() => setForm((current) => ({ ...current, promptFileName: undefined, promptFileData: undefined, removePromptFile: true }))} className="rounded-full border border-black/15 px-3 py-1.5 font-semibold hover:bg-white">Remove file</button></div>}</div>
              <label className="grid gap-2 text-xs font-semibold">Display order<input type="number" required min={0} max={1000000} value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))} className="form-field !border-[#d0cabd] !bg-white !text-[#211f1b]" /></label>
              <label className="flex items-center gap-3 self-end rounded-lg border border-black/10 bg-white p-3 text-sm font-semibold"><input type="checkbox" checked={form.isPublished} onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))} className="h-4 w-4 accent-black" /> Publish to public catalogue</label>
              {formError && <p role="alert" className="whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{formError}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3 p-5 sm:px-8"><button type="button" onClick={() => setEditorOpen(false)} className="rounded-full border border-black/15 px-5 py-2.5 text-sm font-semibold">Cancel</button><button type="submit" disabled={saving || imageProcessing || promptFileProcessing || !form.image} className="btn-gold !px-5 !py-2.5 text-sm disabled:opacity-60">{imageProcessing ? 'Preparing image…' : promptFileProcessing ? 'Reading file…' : saving ? 'Saving…' : editingPrompt ? 'Save changes' : 'Create prompt'} <ArrowRight size={15} /></button></div>
        </form>
      </DialogContent>
    </Dialog>
  </section>;
}
