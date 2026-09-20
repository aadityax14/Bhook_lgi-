import React, { useEffect, useState } from 'react';
import { Sparkles, Flame } from 'lucide-react';

export default function SplashScreen({ onFinish }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // 1.8 second splash presentation, then start fade-out transition
    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(() => {
        onFinish();
      }, 500); // 500ms fade transition
    }, 1800);

    return () => clearTimeout(timer);
  }, [onFinish]);

  const handleSkip = () => {
    setFading(true);
    setTimeout(() => {
      onFinish();
    }, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FFB800] select-none transition-opacity duration-500 ${
        fading ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100 scale-100'
      }`}
      style={{ transitionProperty: 'opacity, transform' }}
    >
      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 text-xs font-bold tracking-wider uppercase px-3 py-1.5 rounded-full bg-black/10 hover:bg-black/20 text-brand-black backdrop-blur-sm transition-all"
      >
        Skip ➔
      </button>

      {/* Floating food sparks & steam around the logo */}
      <div className="relative flex flex-col items-center">
        {/* Steam / sparkles floating above */}
        <div className="absolute -top-12 flex space-x-6">
          <div className="w-2 h-4 bg-white/70 rounded-full blur-[1px] animate-bounce [animation-delay:0ms]"></div>
          <div className="w-2.5 h-6 bg-white/90 rounded-full blur-[1px] animate-bounce [animation-delay:200ms]"></div>
          <div className="w-2 h-4 bg-white/70 rounded-full blur-[1px] animate-bounce [animation-delay:400ms]"></div>
        </div>

        {/* Ambient glow behind logo */}
        <div className="absolute w-48 h-48 bg-white/20 rounded-full blur-2xl animate-pulse"></div>

        {/* Central Logo Box */}
        <div className="relative z-10 flex flex-col items-center transform transition-transform duration-700 hover:scale-105">
          <div className="w-28 h-28 bg-[#121212] rounded-3xl shadow-2xl flex items-center justify-center border-4 border-white/30 relative overflow-hidden">
            {/* Inner bowl graphic */}
            <div className="relative flex flex-col items-center">
              {/* Floating steam spark */}
              <Flame className="w-7 h-7 text-[#FFB800] animate-pulse mb-0.5" />
              {/* Bowl silhouette */}
              <div className="w-14 h-7 bg-[#FFB800] rounded-b-full relative flex items-center justify-center">
                <div className="absolute -top-1 w-12 h-2 bg-white/90 rounded-full"></div>
              </div>
            </div>

            {/* Corner spark */}
            <Sparkles className="absolute top-2.5 right-2.5 w-4 h-4 text-[#FFB800] animate-spin [animation-duration:6s]" />
          </div>

          {/* Brand Typography */}
          <div className="mt-5 text-center">
            <h1 className="text-4xl sm:text-5xl font-black text-[#121212] tracking-tight font-sans flex items-center justify-center">
              Bhook<span className="text-white drop-shadow-sm">_</span>Lgi
            </h1>
            <p className="mt-2 text-sm sm:text-base font-bold text-black/75 tracking-wide flex items-center justify-center gap-1.5">
              <span>Your hostel cravings, sorted.</span>
              <span className="text-lg">😋</span>
            </p>
          </div>
        </div>

        {/* Subtle bottom loading pill */}
        <div className="mt-10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#121212] animate-ping [animation-delay:0ms]"></div>
          <div className="w-2 h-2 rounded-full bg-[#121212] animate-ping [animation-delay:200ms]"></div>
          <div className="w-2 h-2 rounded-full bg-[#121212] animate-ping [animation-delay:400ms]"></div>
        </div>
      </div>
    </div>
  );
}
