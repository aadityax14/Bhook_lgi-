import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Star, X } from 'lucide-react';
import { addPhotos, MAX_ORIGINAL_MB } from '../../utils/images';
import { resolveMediaUrl } from '../../services/api';

// ---------------------------------------------------------------
// Photo picker: thumbnails + "Add photo" tile + remove buttons.
// `images` are data URLs (before upload).
// ---------------------------------------------------------------
export function PhotoPicker({ images, onChange, max = 3, label = 'Add photo' }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async (event) => {
    setBusy(true);
    setError('');
    const result = await addPhotos(event.target.files, images, max);
    onChange(result.images);
    setError(result.error);
    setBusy(false);
    event.target.value = '';
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {images.map((src, index) => (
          <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
            <img src={src} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, i) => i !== index))}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center"
              aria-label={`Remove photo ${index + 1}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {images.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 hover:border-pink-400 flex flex-col items-center justify-center gap-1 text-gray-500 text-[10px] font-bold disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
            {busy ? 'Adding…' : label}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      <p className="mt-1.5 text-[11px] text-gray-500">
        Up to {max} photos · JPG, PNG or WebP · max {MAX_ORIGINAL_MB} MB each
      </p>

      {error && <p className="mt-1 text-xs font-bold text-red-600">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------
// Stars (display or input)
// ---------------------------------------------------------------
export function Stars({ value = 0, size = 16, onChange }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = shown >= n - 0.25;
        const star = (
          <Star
            style={{ width: size, height: size }}
            className={filled ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
          />
        );

        return onChange ? (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            className="p-0.5"
          >
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------
// Full-screen photo viewer (shows every photo, swipe with arrows)
// ---------------------------------------------------------------
export function Lightbox({ images, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);
  if (!images?.length) return null;

  const go = (delta) => setIndex((i) => (i + delta + images.length) % images.length);

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Shown at its real size at most (never stretched → never blurry) */}
      <img
        src={resolveMediaUrl(images[index])}
        alt={`Photo ${index + 1} of ${images.length}`}
        style={{ width: 'auto', height: 'auto' }}
        className="max-h-[85vh] max-w-full rounded-xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); go(1); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center"
            aria-label="Next photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs font-bold text-white/80">
            {index + 1} / {images.length}
          </p>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------
// Row of uploaded photos that opens the Lightbox
// ---------------------------------------------------------------
export function PhotoStrip({ images, size = 'w-16 h-16' }) {
  const [open, setOpen] = useState(null);
  if (!images?.length) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setOpen(i)}
            className={`${size} rounded-xl overflow-hidden border border-gray-200 hover:opacity-90`}
          >
            <img src={resolveMediaUrl(src)} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      {open !== null && <Lightbox images={images} startIndex={open} onClose={() => setOpen(null)} />}
    </>
  );
}

export const formatDate = (value) =>
  value
    ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';
