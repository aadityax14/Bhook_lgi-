
import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  ArrowUpRight,
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

export default function HeroBanner({ onExploreZuxu }) {
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef(0);

  const visibleSlides = slides.filter(
    (slide) => slide.enabled !== false
  );

  // Load slides saved by admin.
  useEffect(() => {
    const saved = localStorage.getItem('bhook_home_slides');

    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed) && parsed.length > 0) {
          setSlides(parsed);
        }
      } catch (error) {
        console.error('Could not load homepage slides:', error);
      }
    }
  }, []);

  // Automatically change slide every four seconds.
  useEffect(() => {
    if (visibleSlides.length < 2) return undefined;

    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % visibleSlides.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [visibleSlides.length]);

  // Keep active slide index valid.
  useEffect(() => {
    if (activeIndex >= visibleSlides.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, visibleSlides.length]);

  const goTo = (index) => {
    if (!visibleSlides.length) return;

    setActiveIndex(
      (index + visibleSlides.length) % visibleSlides.length
    );
  };

  // Mobile swipe support.
  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event) => {
    const difference =
      touchStartX.current - event.changedTouches[0].clientX;

    if (difference > 50) {
      goTo(activeIndex + 1);
    }

    if (difference < -50) {
      goTo(activeIndex - 1);
    }
  };

  if (!visibleSlides.length) return null;

  const slide = visibleSlides[activeIndex];

  // Handle slide button clicks.
  const handleSlideClick = () => {
    const slideId = String(slide.id || '').toLowerCase().trim();
    const title = String(slide.title || '').toLowerCase().trim();
    const buttonText = String(slide.buttonText || '')
      .toLowerCase()
      .trim();

    // Zuxu: open the internal Zuxu Store.
    // Do not redirect to /zuxu or reload the page.
    if (
      slideId === 'zuxu' ||
      title === 'zuxu' ||
      buttonText.includes('explore zuxu')
    ) {
      if (typeof onExploreZuxu === 'function') {
        onExploreZuxu();
      } else {
        console.error(
          'Zuxu navigation callback is missing. Pass onExploreZuxu from App.js.'
        );
      }

      return;
    }

    // Advertisement slide.
    if (
      slideId === 'advertisement' ||
      buttonText.includes('advertise')
    ) {
      window.alert(
        'Interested in advertising with Bhook_Lgi?\n\nPlease contact the Bhook_Lgi admin for details.'
      );

      return;
    }

    // Open custom links for other slides.
    if (slide.link) {
      if (slide.link.startsWith('/')) {
        window.location.href = slide.link;
      } else {
        window.open(
          slide.link,
          '_blank',
          'noopener,noreferrer'
        );
      }
    }
  };

  return (
    <section
      className="relative mb-6 overflow-hidden rounded-3xl shadow-card-lift"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={`relative min-h-[230px] sm:min-h-[270px] bg-gradient-to-br ${
          slide.background || 'from-[#FFB800] to-[#F59E0B]'
        } text-black transition-all duration-500`}
      >
        {/* Background decorative circles */}
        <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full bg-white/15 blur-2xl" />

        <div className="pointer-events-none absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-black/5 blur-2xl" />

        <div className="relative z-10 flex min-h-[230px] items-center justify-between gap-4 px-6 py-7 sm:min-h-[270px] sm:px-10">
          {/* Slide content */}
          <div className="max-w-[68%]">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-black px-3 py-1.5 text-[10px] font-black tracking-wider text-[#FFB800] sm:text-xs">
              <Zap size={13} fill="currentColor" />
              {slide.badge}
            </div>

            <h2
              className={`text-3xl font-black leading-tight sm:text-5xl ${
                slide.id === 'advertisement'
                  ? 'text-white'
                  : 'text-black'
              }`}
            >
              {slide.title}
            </h2>

            <p
              className={`mt-2 max-w-sm text-sm font-semibold sm:text-base ${
                slide.id === 'advertisement'
                  ? 'text-white/80'
                  : 'text-black/75'
              }`}
            >
              {slide.subtitle}
            </p>

            {/* Main action button */}
            <button
              type="button"
              onClick={handleSlideClick}
              className={`mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black shadow-md transition hover:scale-105 sm:text-sm ${
                slide.id === 'advertisement'
                  ? 'bg-[#FFB800] text-black'
                  : 'bg-black text-white'
              }`}
            >
              {slide.buttonText}
              <ArrowUpRight size={15} />
            </button>
          </div>

          {/* Slide image or emoji */}
          <div className="flex w-[32%] items-center justify-center">
            {slide.image ? (
              <img
                src={slide.image}
                alt={slide.title}
                className="max-h-32 max-w-full rounded-2xl object-contain drop-shadow-xl sm:max-h-48"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <span className="text-6xl drop-shadow-lg sm:text-8xl">
                {slide.emoji}
              </span>
            )}
          </div>
        </div>

        {/* Navigation arrows and dots */}
        {visibleSlides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              aria-label="Previous slide"
              className="absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-md transition hover:bg-white sm:left-3 sm:h-9 sm:w-9"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              aria-label="Next slide"
              className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-md transition hover:bg-white sm:right-3 sm:h-9 sm:w-9"
            >
              <ChevronRight size={20} />
            </button>

            {/* Slide indicators */}
            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
              {visibleSlides.map((item, index) => (
                <button
                  key={item.id || index}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    activeIndex === index
                      ? 'w-7 bg-black'
                      : 'w-2 bg-black/30 hover:bg-black/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
