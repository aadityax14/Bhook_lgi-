import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { api } from '../../services/api';
import { PhotoPicker, Stars } from './ZuxuShared';

const LABELS = ['', 'Not happy', 'Could be better', 'Good', 'Really nice', 'Love it!'];

export default function ReviewModal({ order, item, onClose, onSaved }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!rating) {
      setError('Please tap the stars to rate it.');
      return;
    }

    setSaving(true);
    try {
      await api.createReview({
        orderId: order.id,
        productId: item.productId,
        rating,
        text: text.trim(),
        images,
      });
      onSaved();
    } catch (err) {
      setError(err.message || 'Could not save your review.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-widest text-pink-600">RATE & REVIEW</p>
            <h3 className="text-base font-black truncate">{item.productName || item.name}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-col items-center gap-1">
            <Stars value={rating} size={34} onChange={setRating} />
            <p className="text-xs font-bold text-gray-500 h-4">{LABELS[rating]}</p>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-700 mb-2">Photos of what you received (optional)</p>
            <PhotoPicker images={images} onChange={setImages} max={3} />
          </div>

          <label className="block">
            <span className="block text-xs font-bold text-gray-700 mb-1">Your review (optional)</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="How was the quality, packing and delivery?"
              className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-pink-500"
            />
          </label>

          {error && (
            <p className="rounded-xl bg-red-50 border border-red-100 px-3 py-2.5 text-xs font-bold text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-gray-900 hover:bg-pink-600 text-white font-black flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Posting…' : 'Post review'}
          </button>
        </div>
      </form>
    </div>
  );
}
