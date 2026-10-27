import { useRef, useState, type ChangeEvent } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';

const MAX_LOGO_BYTES = 48 * 1024;
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

async function compressLogo(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPG, PNG, or WebP logo.');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('Logo image must be smaller than 10 MB.');
  }

  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not process this logo. Try another image.');

    let blob: Blob | null = null;
    for (const maxDimension of [900, 720, 560, 420, 300, 200]) {
      const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.82, 0.68, 0.54, 0.4]) {
        blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
        if (blob && blob.size <= MAX_LOGO_BYTES) break;
      }
      if (blob && blob.size <= MAX_LOGO_BYTES) break;
    }

    if (!blob || blob.size > MAX_LOGO_BYTES) {
      throw new Error('Could not compress this logo enough. Choose a simpler or smaller image.');
    }

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read the logo image.'));
      reader.onerror = () => reject(new Error('Could not read the logo image.'));
      reader.readAsDataURL(blob);
    });
  } finally {
    bitmap.close();
  }
}

export function ServiceLogoInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    setError('');
    setProcessing(true);
    try {
      onChange(await compressLogo(file));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Could not upload the logo. Try again.');
    } finally {
      setProcessing(false);
    }
  };

  return <div className="grid gap-2">
    <span className="text-xs font-semibold text-[#5f5d55]">Logo image</span>
    <div className="flex flex-wrap items-center gap-3">
      <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-black/10 bg-white">
        {value ? <img src={value} alt="Service logo preview" className="h-full w-full object-contain p-1" /> : <ImagePlus size={20} className="text-black/35" />}
      </div>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleChange} className="sr-only" aria-label="Upload service logo image" />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={processing} className="rounded-full border border-black/15 px-4 py-2 text-xs font-semibold transition hover:bg-black/5 disabled:opacity-50">
        {processing ? 'Processing…' : value ? 'Change logo' : 'Upload logo'}
      </button>
      {value && <button type="button" onClick={() => { onChange(''); setError(''); }} className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"><Trash2 size={13} /> Remove</button>}
      <span className="text-[11px] text-black/45">PNG, JPG, or WebP · transparent logos supported</span>
    </div>
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
  </div>;
}
