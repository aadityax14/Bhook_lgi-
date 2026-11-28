import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Loader2, RotateCcw, Save, Trash2, Upload } from 'lucide-react';
import { api, resolveMediaUrl } from '../../services/api';
import { compressPhoto } from '../../utils/images';
import { DEFAULT_TRACKING_AD, withTrackingAdDefaults } from '../../data/trackingAd';

const MAX_IMAGES = 4;

/*
 * Admin → Banners → "Track order ad"
 * The Zuxu advertisement customers see above their order tracking:
 * text, button and up to 4 product photos.
 */
export default function TrackingAdManager() {
  const [ad, setAd] = useState(DEFAULT_TRACKING_AD);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    api.getTrackingAd()
      .then((res) => setAd(withTrackingAdDefaults(res.data)))
      .catch(() => setMessage('Could not load the saved ad. Showing the default.'));
  }, []);

  const showMessage = (text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 3500);
  };

  const update = (field, value) => setAd((current) => ({ ...current, [field]: value }));

  const addPhotos = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;

    const room = MAX_IMAGES - ad.images.length;
    if (room <= 0) {
      showMessage(`You can use at most ${MAX_IMAGES} photos. Remove one first.`);
      return;
    }

    try {
      setUploading(true);
      const uploaded = [];
      for (const file of files.slice(0, room)) {
        const image = await compressPhoto(file, { maxDimension: 1000, quality: 0.82 });
        const res = await api.uploadBannerImage(image);
        uploaded.push(res.data.url);
      }
      setAd((current) => ({ ...current, images: [...current.images, ...uploaded].slice(0, MAX_IMAGES) }));
      showMessage('Photo added. Click Save to show it to customers.');
    } catch (error) {
      showMessage(error.message || 'Photo upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index) =>
    setAd((current) => ({ ...current, images: current.images.filter((_, i) => i !== index) }));

  const makeMain = (index) =>
    setAd((current) => {
      const images = [...current.images];
      const [picked] = images.splice(index, 1);
      return { ...current, images: [picked, ...images] };
    });

  const save = async () => {
    try {
      setSaving(true);
      const res = await api.saveTrackingAd(ad);
      setAd(withTrackingAdDefaults(res.data));
      showMessage('Ad saved ✓ Customers see it above order tracking.');
    } catch (error) {
      showMessage(error.message || 'Could not save the ad.');
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!window.confirm('Go back to the default Zuxu ad?')) return;
    try {
      await api.resetTrackingAd();
      setAd(DEFAULT_TRACKING_AD);
      showMessage('Default ad restored.');
    } catch (error) {
      showMessage(error.message || 'Could not reset the ad.');
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Track Order Ad (Zuxu)</h2>
          <p className="mt-1 text-sm text-gray-500">
            The advertisement at the top of the customer's order tracking screen.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={reset}
            className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold hover:bg-gray-50">
            <RotateCcw size={16} /> Reset
          </button>
          <button type="button" onClick={save} disabled={saving || uploading}
            className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-xl bg-green-50 p-3 text-sm font-bold text-green-700">{message}</div>
      )}

      <div className="rounded-2xl border bg-white p-4 sm:p-5 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-black">Show this ad</p>
          <button type="button" onClick={() => update('enabled', !ad.enabled)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${
              ad.enabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
            {ad.enabled ? <Eye size={15} /> : <EyeOff size={15} />}
            {ad.enabled ? 'Visible' : 'Hidden'}
          </button>
        </div>

        {/* PREVIEW (same look as the customer sees) */}
        <div className="rounded-3xl bg-gradient-to-br from-pink-50 via-white to-rose-100 border border-pink-100 p-5">
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <span className="inline-block px-2.5 py-1 rounded-full bg-pink-100 text-pink-700 text-[10px] font-black mb-2">
                {ad.badge}
              </span>
              <p className="text-xl font-black text-gray-900">{ad.title}</p>
              <p className="text-xs text-gray-600 mt-1">{ad.subtitle}</p>
              <span className="mt-3 inline-block px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-black">
                {ad.buttonText}
              </span>
            </div>
            <div className="shrink-0 w-24 h-24 bg-white rounded-2xl border border-pink-100 overflow-hidden">
              {ad.images[0] && (
                <img src={resolveMediaUrl(ad.images[0]) || ad.images[0]} alt="" className="w-full h-full object-cover" />
              )}
            </div>
          </div>
          {ad.images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {ad.images.slice(1).map((src) => (
                <img key={src} src={resolveMediaUrl(src) || src} alt="" className="w-12 h-12 rounded-xl object-cover border border-pink-100 bg-white" />
              ))}
            </div>
          )}
        </div>

        {/* PHOTOS */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-gray-500">
              PRODUCT PHOTOS ({ad.images.length}/{MAX_IMAGES}) · first photo is the big one
            </p>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={addPhotos} />
            <button type="button" disabled={uploading || ad.images.length >= MAX_IMAGES}
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-bold hover:bg-gray-100 disabled:opacity-50">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? 'Uploading…' : 'Add photo'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ad.images.map((src, index) => (
              <div key={src} className="rounded-xl border bg-gray-50 overflow-hidden">
                <img src={resolveMediaUrl(src) || src} alt={`Ad photo ${index + 1}`} className="w-full h-28 object-cover" />
                <div className="flex items-center justify-between gap-1 p-1.5">
                  {index === 0 ? (
                    <span className="text-[10px] font-black text-pink-700 px-1">MAIN</span>
                  ) : (
                    <button type="button" onClick={() => makeMain(index)}
                      className="text-[10px] font-black text-gray-600 px-1 hover:text-black">
                      Make main
                    </button>
                  )}
                  <button type="button" onClick={() => removePhoto(index)}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50" aria-label="Remove photo">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {ad.images.length === 0 && (
              <p className="col-span-full text-xs text-gray-500">No photos — the Zuxu logo will be shown.</p>
            )}
          </div>
        </div>

        {/* TEXT */}
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['badge', 'Top badge', 40],
            ['title', 'Title', 60],
            ['subtitle', 'Description', 160],
            ['buttonText', 'Button text', 30],
          ].map(([field, label, max]) => (
            <label key={field} className="block">
              <span className="mb-1 block text-xs font-bold text-gray-500">{label}</span>
              <input value={ad[field] || ''} maxLength={max}
                onChange={(event) => update(field, event.target.value)}
                className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-pink-400"
                placeholder={DEFAULT_TRACKING_AD[field]} />
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}
