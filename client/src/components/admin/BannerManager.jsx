
import React, { useEffect, useState } from 'react';
import { Save, RotateCcw, Image, Eye, EyeOff } from 'lucide-react';

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
    link: '',
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
    link: '',
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
    enabled: true,
  },
];

export default function BannerManager() {
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [message, setMessage] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bhook_home_slides');
      if (saved) setSlides(JSON.parse(saved));
    } catch (error) {
      console.error('Could not load slides:', error);
    }
  }, []);

  const updateSlide = (index, field, value) => {
    setSlides((current) =>
      current.map((slide, i) =>
        i === index ? { ...slide, [field]: value } : slide
      )
    );
  };

  const saveSlides = () => {
    localStorage.setItem('bhook_home_slides', JSON.stringify(slides));
    setMessage('Slides saved on this browser successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const resetSlides = () => {
    if (!window.confirm('Reset all slides to default content?')) return;
    setSlides(DEFAULT_SLIDES);
    localStorage.removeItem('bhook_home_slides');
    setMessage('Default slides restored.');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Homepage Carousel</h2>
          <p className="mt-1 text-sm text-gray-500">
            Edit the three slides displayed on the customer homepage.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={resetSlides}
            className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold"
          >
            <RotateCcw size={16} /> Reset
          </button>
          <button
            onClick={saveSlides}
            className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-bold text-white"
          >
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-xl bg-green-50 p-3 text-sm font-bold text-green-700">
          {message}
        </div>
      )}

      {slides.map((slide, index) => (
        <div key={slide.id} className="rounded-2xl border bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Slide {index + 1}
              </p>
              <h3 className="text-lg font-black">{slide.id === 'advertisement' ? 'Advertisement' : slide.title}</h3>
            </div>

            <button
              onClick={() => updateSlide(index, 'enabled', !slide.enabled)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${
                slide.enabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {slide.enabled ? <Eye size={15} /> : <EyeOff size={15} />}
              {slide.enabled ? 'Visible' : 'Hidden'}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['title', 'Slide title'],
              ['badge', 'Top badge'],
              ['subtitle', 'Description'],
              ['buttonText', 'Button text'],
              ['image', 'Image URL or path'],
              ['link', 'Button destination URL'],
              ['emoji', 'Emoji (if no image)'],
              ['background', 'Tailwind gradient classes'],
            ].map(([field, label]) => (
              <label key={field} className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">{label}</span>
                <input
                  value={slide[field] || ''}
                  onChange={(event) => updateSlide(index, field, event.target.value)}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-yellow-500"
                  placeholder={label}
                />
              </label>
            ))}
          </div>
        </div>
      ))}

      <p className="rounded-xl bg-yellow-50 p-3 text-xs text-yellow-800">
        Note: these changes are currently saved in this browser only. To publish
        the same changes to every customer's device, connect the manager to the
        server settings API in the next step.
      </p>
    </div>
  );
}

