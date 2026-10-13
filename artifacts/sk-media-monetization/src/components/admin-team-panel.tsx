import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowRight, ImagePlus, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetAdminTeamQueryKey,
  getGetTeamQueryKey,
  useCreateTeamMember,
  useDeleteTeamMember,
  useGetAdminTeam,
  useUpdateTeamMember,
} from '@workspace/api-client-react';
import type { TeamMember, TeamMemberInput } from '@workspace/api-client-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

const blankMember: TeamMemberInput = {
  name: '',
  role: '',
  description: '',
  image: '',
  isPublished: false,
  sortOrder: 0,
};

function imageSource(value: string) {
  if (value.startsWith('data:image/') || /^https?:\/\//i.test(value)) return value;
  return value ? `https://images.unsplash.com/${value}?auto=format&fit=crop&w=480&q=80` : '';
}

async function prepareImage(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG, or WebP image.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Image must be smaller than 10 MB.');
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not process this image.');
    let blob: Blob | null = null;
    for (const maxDimension of [900, 720, 560, 420, 300]) {
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
  return 'Could not save the team profile. Check the API connection and try again.';
}

export default function AdminTeamPanel() {
  const queryClient = useQueryClient();
  const teamQuery = useGetAdminTeam();
  const createMember = useCreateTeamMember();
  const updateMember = useUpdateTeamMember();
  const deleteMember = useDeleteTeamMember();
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [form, setForm] = useState<TeamMemberInput>(blankMember);
  const [formError, setFormError] = useState('');
  const [imageError, setImageError] = useState('');
  const [imageProcessing, setImageProcessing] = useState(false);
  const [saving, setSaving] = useState(false);

  const members = teamQuery.data ?? [];
  const visibleMembers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return members.filter((member) => !term || `${member.name} ${member.role} ${member.description}`.toLowerCase().includes(term));
  }, [members, search]);

  const refresh = async () => Promise.all([
    queryClient.invalidateQueries({ queryKey: getGetAdminTeamQueryKey() }),
    queryClient.invalidateQueries({ queryKey: getGetTeamQueryKey() }),
  ]);

  const openNewMember = () => {
    setEditingMember(null);
    setForm({ ...blankMember, sortOrder: members.length });
    setFormError('');
    setImageError('');
    setEditorOpen(true);
  };

  const openEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setForm({
      name: member.name,
      role: member.role,
      description: member.description,
      image: member.image,
      isPublished: member.isPublished,
      sortOrder: member.sortOrder,
    });
    setFormError('');
    setImageError('');
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

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    if (imageProcessing) return;
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
    if (editingMember) updateMember.mutate({ id: editingMember.id, data: form }, { onSuccess, onError });
    else createMember.mutate({ data: form }, { onSuccess, onError });
  };

  const removeMember = (member: TeamMember) => {
    if (!window.confirm(`Delete “${member.name}”? This cannot be undone.`)) return;
    deleteMember.mutate({ id: member.id }, {
      onSuccess: () => { void refresh(); },
      onError: (error) => window.alert(errorText(error)),
    });
  };

  return <section>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><div className="eyebrow text-[#826900]">Website content</div><h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">Our Team</h1><p className="mt-2 text-sm text-black/55">Manage the profiles, visibility, photos, and order shown on the public About page.</p></div>
      <button type="button" onClick={openNewMember} className="btn-gold w-fit !px-5 !py-3 text-sm"><Plus size={16} /> Add team member <ArrowRight size={15} /></button>
    </div>
    <section className="mt-8 overflow-hidden rounded-2xl border border-black/10 bg-[#fbfaf6]">
      <div className="flex flex-col justify-between gap-4 border-b border-black/10 p-5 md:flex-row md:items-center md:p-6"><div><h2 className="font-display text-xl font-extrabold tracking-[-.04em]">Team profiles</h2><p className="mt-1 text-xs text-black/45">{members.length} profiles · drafts are visible only in this workspace</p></div><label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" size={15} /><input className="form-field !rounded-lg !py-2.5 pl-9 text-xs sm:w-[260px]" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search team…" aria-label="Search team profiles" /></label></div>
      {teamQuery.isLoading ? <div className="p-8 text-sm text-black/50">Loading team profiles…</div>
        : teamQuery.isError ? <div className="p-10 text-center"><p className="font-semibold">We couldn’t load team profiles.</p><button type="button" onClick={() => teamQuery.refetch()} className="btn-gold mt-4 !py-2.5 text-xs">Retry</button></div>
          : visibleMembers.length === 0 ? <div className="px-6 py-16 text-center"><h3 className="font-display text-xl font-bold">{members.length ? 'No matching profiles' : 'No team profiles yet'}</h3><p className="mt-2 text-sm text-black/45">Add a profile to show it in the public Our Team section.</p></div>
            : <div className="grid gap-3 p-4 md:p-5">{visibleMembers.map((member) => <article key={member.id} className="grid gap-4 rounded-xl border border-black/10 bg-white p-4 sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:items-center" data-testid={`admin-team-member-${member.id}`}>
              {member.image ? <img src={imageSource(member.image)} alt="" className="aspect-square w-full rounded-lg object-cover sm:w-24" /> : <div className="grid aspect-square w-full place-items-center rounded-lg bg-black/5 text-black/30 sm:w-24"><ImagePlus size={20} /></div>}
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-black px-2.5 py-1 text-[10px] font-bold text-white">{member.role}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${member.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-black/5 text-black/55'}`}>{member.isPublished ? 'Published' : 'Draft'}</span></div><h3 className="mt-2 truncate font-display text-base font-bold">{member.name}</h3><p className="mt-1 truncate text-xs text-black/45">Order {member.sortOrder} · {member.description}</p></div>
              <div className="flex gap-2"><button type="button" onClick={() => openEditMember(member)} className="grid h-10 w-10 place-items-center rounded-lg border border-black/15 hover:bg-black/5" aria-label={`Edit ${member.name}`}><Pencil size={16} /></button><button type="button" onClick={() => removeMember(member)} disabled={deleteMember.isPending} className="grid h-10 w-10 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50" aria-label={`Delete ${member.name}`}><Trash2 size={16} /></button></div>
            </article>)}</div>}
    </section>
    <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
      <DialogContent className="top-[4vh] max-h-[92vh] max-w-[680px] translate-y-0 overflow-y-auto border border-[#e7dfd2] bg-[#f8f7f4] p-0 text-[#211f1b] shadow-[0_24px_70px_rgba(0,0,0,.2)] sm:rounded-2xl">
        <form onSubmit={submit}>
          <div className="border-b border-black/10 p-6 sm:p-8"><DialogTitle className="font-display text-2xl font-extrabold">{editingMember ? 'Edit team profile' : 'Add a team profile'}</DialogTitle><DialogDescription className="mt-2 text-sm text-[#6a655f]">Published profiles appear on the public About page in display order.</DialogDescription>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-xs font-semibold">Name<input required minLength={1} maxLength={100} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="form-field !border-[#d0cabd] !bg-white !text-[#211f1b]" /></label>
              <label className="grid gap-2 text-xs font-semibold">Role<input required minLength={1} maxLength={120} value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} placeholder="e.g. Creator Strategy" className="form-field !border-[#d0cabd] !bg-white !text-[#211f1b]" /></label>
              <label className="grid gap-2 text-xs font-semibold sm:col-span-2">Description<textarea required minLength={1} maxLength={500} rows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="form-field min-h-[90px] resize-y !border-[#d0cabd] !bg-white !text-[#211f1b]" /></label>
              <div className="grid gap-3 sm:col-span-2"><label className="grid gap-2 text-xs font-semibold">Portrait image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} disabled={imageProcessing} className="form-field !border-[#d0cabd] !bg-white !text-[#211f1b] file:mr-3 file:rounded-full file:border-0 file:bg-[#f1efe8] file:px-3 file:py-1.5 file:text-xs file:font-semibold" /><span className="text-[11px] font-normal text-[#77756f]">Upload JPG, PNG or WebP (up to 10 MB); it will be compressed before saving. Or paste an image URL / Unsplash photo ID below.</span></label>
                <label className="grid gap-2 text-xs font-semibold">Image URL or Unsplash photo ID<input required minLength={1} maxLength={200000} value={form.image} onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))} placeholder="https://… or photo-…" className="form-field !border-[#d0cabd] !bg-white !text-[#211f1b]" /></label>
                {imageProcessing && <p className="text-xs text-black/55" role="status">Preparing image…</p>}{imageError && <p className="text-xs text-red-700" role="alert">{imageError}</p>}
                {form.image && <div className="flex items-start gap-3"><img src={imageSource(form.image)} alt="Team portrait preview" className="h-24 w-24 rounded-xl object-cover" /><button type="button" onClick={() => { setForm((current) => ({ ...current, image: '' })); setImageError(''); }} className="rounded-full border border-black/15 px-3 py-1.5 text-xs font-semibold hover:bg-black/5">Remove image</button></div>}
              </div>
              <label className="grid gap-2 text-xs font-semibold">Display order<input type="number" required min={0} max={1000000} value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))} className="form-field !border-[#d0cabd] !bg-white !text-[#211f1b]" /></label>
              <label className="flex items-center gap-3 self-end rounded-lg border border-black/10 bg-white p-3 text-sm font-semibold"><input type="checkbox" checked={form.isPublished} onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))} className="h-4 w-4 accent-black" /> Publish on website</label>
              {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{formError}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3 p-5 sm:px-8"><button type="button" onClick={() => setEditorOpen(false)} className="rounded-full border border-black/15 px-5 py-2.5 text-sm font-semibold">Cancel</button><button type="submit" disabled={saving || imageProcessing || !form.image} className="btn-gold !px-5 !py-2.5 text-sm disabled:opacity-60">{imageProcessing ? 'Preparing image…' : saving ? 'Saving…' : editingMember ? 'Save changes' : 'Create profile'} <ArrowRight size={15} /></button></div>
        </form>
      </DialogContent>
    </Dialog>
  </section>;
}
