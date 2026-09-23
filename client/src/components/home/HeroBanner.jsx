import React from 'react';
import { Zap, Clock } from 'lucide-react';

export default function HeroBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-yellow via-[#FFC01D] to-[#F59E0B] p-6 sm:p-8 text-brand-black shadow-card-lift mb-6">
      {/* Background playful circles */}
      <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/20 rounded-full blur-xl pointer-events-none"></div>
      <div className="absolute -left-10 -top-10 w-36 h-36 bg-black/5 rounded-full blur-lg pointer-events-none"></div>
      <div>
        
      </div>
      <div className="relative z-10">
        {/* Floating badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black text-brand-yellow text-xs font-black uppercase tracking-wider mb-3 shadow-sm">
          <Zap className="w-3 h-3 fill-brand-yellow" />
          <span>Hostel Express Delivery</span>
        </div>

        {/* Hero Title */}
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
          Hungry? <br />
          <span className="text-white drop-shadow-sm">Bhook_Lgi hai?</span> 😋
        </h2>

        {/* Supporting subtitle */}
        {/* <p className="mt-2 text-sm sm:text-base font-semibold text-brand-black/85 max-w-sm">
          Your hostel cravings, 
        </p> */}

        {/* Feature Pills */}
        <div className="mt-4 pt-3 border-t border-black/10 flex flex-wrap gap-2 text-xs font-bold text-brand-black">
          {/* <span className="flex items-center gap-1 bg-white/70 backdrop-blur-xs px-2.5 py-1 rounded-full">
            <Clock className="w-3 h- text-brand-black" /> ~15 Mins Delivery
          </span> */}
          <span className="flex items-center gap-1 bg-white/70 backdrop-blur-xs px-2.5 py-1 rounded-full">
            🍜 Freshly Cooked
          </span>
          <span className="flex items-center gap-1 bg-white/70 backdrop-blur-xs px-2.5 py-1 rounded-full">
            🌙 Late Night Till 3 AM
          </span>
        </div>
      </div>
    </div>
  );
}
