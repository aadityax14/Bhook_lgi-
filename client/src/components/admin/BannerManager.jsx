import React, { useEffect, useRef, useState } from 'react';
import {
  Save, RotateCcw, Image as ImageIcon, Eye, EyeOff,
  Upload, Trash2, ExternalLink, Link as LinkIcon, Loader2,
} from 'lucide-react';

const DEFAULT_SLIDES = [
  {
    id: 'bhook',
    title: 'Bhook_Lgi',
    subtitle: 'Your hostel cravings, delivered fresh!',
    badge: 'HOSTEL EXPRESS DELIVERY',
    buttonText: 'Explore Snacks',
    background: 'from-[#FFB800] via-[#FFC928] to-[#F59E0B]',
    emoji: '🍜',
    image: '',
    link: '/menu',
    actionType: 'internal',
    enabled: true,
  },
  {
    id: 'zuxu',
    title: 'Zuxu',
    subtitle: 'Handmade gifts, made with love.',
    badge: 'UNIQUE HANDMADE GIFTS',
    buttonText: 'Explore Zuxu',
    background: 'from-[#F8B4C8] via-[#F7D2DC] to-[#E9A3BB]',
    emoji: '🎀',
    image: '/zuxu.png',
    link: '/zuxu',
    actionType: 'internal',
    enabled: true,
  },
  {
    id: 'advertisement',
    title: 'Your Ad Here',
    subtitle: 'Promote your brand to the campus community.',
    badge: 'CAMPUS ADVERTISEMENT',
    buttonText: 'Advertise With Us',
    background: 'from-[#171717] via-[#292929] to-[#404040]',
    emoji: '📢',
    image: '',
    link: '',
    actionType: 'external',
    enabled: true,
  },
];

const STORAGE_KEY = 'bhook_home_slides';

const compressImage = (file) =>
  new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('Please select a valid image file.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('Could not process this image.'));
      img.onload = () => {
        const maxDimension = 1600;
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Image processing is not supported in this browser.'));
          return;
        }
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

export default function BannerManager() {
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [message, setMessage] = useState('');
  const [uploadingId, setUploadingId] = useState('');
  const fileInputRefs = useRef({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setSlides(DEFAULT_SLIDES.map((base) => {
          const existing = parsed.find((item) => item.id === base.id);
          return existing ? { ...base, ...existing } : base;
        }));
      }
    } catch (error) {
      console.error('Could not load slides:', error);
      setMessage('Could not load saved banners. Defaults are being shown.');
    }
  }, []);

  const showMessage = (text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 3500);
  };

  const updateSlide = (index, field, value) => {
    setSlides((current) =>
      current.map((slide, i) => i === index ? { ...slide, [field]: value } : slide)
    );
  };

  const handleImageUpload = async (index, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const slideId = slides[index].id;
    try {
      setUploadingId(slideId);
      const image = await compressImage(file);
      updateSlide(index, 'image', image);
      showMessage('Image selected. Click Save Changes to save the banner.');
    } catch (error) {
      showMessage(error.message || 'Image upload failed.');
    } finally {
      setUploadingId('');
      event.target.value = '';
    }
  };

  const saveSlides = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slides));
      showMessage('Banners saved in this browser successfully.');
    } catch (error) {
      console.error('Could not save banners:', error);
      showMessage('Could not save. Try a smaller banner image.');
    }
  };

  const resetSlides = () => {
    if (!window.confirm('Reset all homepage banners to default content?')) return;
    setSlides(DEFAULT_SLIDES);
    localStorage.removeItem(STORAGE_KEY);
    showMessage('Default banners restored.');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Homepage Banner Manager</h2>
          <p className="mt-1 text-sm text-gray-500">
            Upload banner images, edit button labels and choose where each banner opens.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={resetSlides}
            className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold hover:bg-gray-50">
            <RotateCcw size={16} /> Reset
          </button>
          <button type="button" onClick={saveSlides}
            className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-bold text-white hover:bg-gray-800">
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-xl bg-green-50 p-3 text-sm font-bold text-green-700">{message}</div>
      )}

      {slides.map((slide, index) => (
        <section key={slide.id} className="rounded-2xl border bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Banner {index + 1}
              </p>
              <h3 className="text-lg font-black">
                {slide.id === 'advertisement' ? 'Advertisement' : slide.title}
              </h3>
            </div>
            <button type="button"
              onClick={() => updateSlide(index, 'enabled', !slide.enabled)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${
                slide.enabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
              {slide.enabled ? <Eye size={15} /> : <EyeOff size={15} />}
              {slide.enabled ? 'Visible' : 'Hidden'}
            </button>
          </div>

          <div className="mb-4 overflow-hidden rounded-xl border bg-gray-50">
            {slide.image ? (
              <img src={slide.image} alt={`${slide.title} banner preview`}
                className="h-44 w-full object-cover" />
            ) : (
              <div className={`flex h-44 items-center justify-center bg-gradient-to-r ${
                slide.background || 'from-gray-800 to-gray-600'
              }`}>
                <div className="text-center text-white">
                  <div className="text-4xl">{slide.emoji || '🖼️'}</div>
                  <p className="mt-2 text-xl font-black">{slide.title}</p>
                  <p className="text-sm">{slide.subtitle}</p>
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ImageIcon size={15} />
                {slide.image ? 'Custom banner image selected' : 'Using gradient / emoji fallback'}
              </div>
              <div className="flex gap-2">
                <input ref={(el) => { fileInputRefs.current[slide.id] = el; }}
                  type="file" accept="image/*" className="hidden"
                  onChange={(event) => handleImageUpload(index, event)} />
                <button type="button" disabled={uploadingId === slide.id}
                  onClick={() => fileInputRefs.current[slide.id]?.click()}
                  className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-bold hover:bg-gray-100 disabled:opacity-50">
                  {uploadingId === slide.id ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {uploadingId === slide.id ? 'Processing…' : 'Upload image'}
                </button>
                {slide.image && (
                  <button type="button" onClick={() => updateSlide(index, 'image', '')}
                    className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['title', 'Banner title'],
              ['badge', 'Top badge'],
              ['subtitle', 'Description'],
              ['buttonText', 'Button text'],
              ['emoji', 'Emoji (shown if no image)'],
              ['background', 'Tailwind gradient classes'],
            ].map(([field, label]) => (
              <label key={field} className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">{label}</span>
                <input value={slide[field] || ''}
                  onChange={(event) => updateSlide(index, field, event.target.value)}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-yellow-500"
                  placeholder={label} />
              </label>
            ))}

            <label className="block">
              <span className="mb-1 block text-xs font-bold text-gray-500">Button action</span>
              <select value={slide.actionType || 'internal'}
                onChange={(event) => updateSlide(index, 'actionType', event.target.value)}
                className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-yellow-500">
                <option value="internal">Open a page inside Bhook_Lgi</option>
                <option value="external">Open an external website / advertisement</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 flex items-center gap-1 text-xs font-bold text-gray-500">
                <LinkIcon size={13} /> Button destination
              </span>
              <input value={slide.link || ''}
                onChange={(event) => updateSlide(index, 'link', event.target.value)}
                className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-yellow-500"
                placeholder={slide.actionType === 'external' ? 'https://example.com' : '/zuxu'} />
              <span className="mt-1 block text-[11px] text-gray-400">
                {slide.actionType === 'external'
                  ? 'Paste the full external URL, including https://'
                  : 'Enter an app route, for example /zuxu or /menu'}
              </span>
            </label>
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
            {slide.actionType === 'external'
              ? <ExternalLink size={15} className="mt-0.5 shrink-0" />
              : <LinkIcon size={15} className="mt-0.5 shrink-0" />}
            <span>
              {slide.actionType === 'external'
                ? 'The banner button is configured to open the external link above.'
                : 'The banner button is configured to navigate to the internal app route above.'}
            </span>
          </div>
        </section>
      ))}

      <p className="rounded-xl bg-yellow-50 p-3 text-xs text-yellow-800">
        Important: this version saves banner settings in this browser only using localStorage.
        Uploaded images are stored as compressed image data. To show the same banners on every
        customer device, the next step is connecting this manager and the homepage to your server API.
      </p>
    </div>
  );
}
