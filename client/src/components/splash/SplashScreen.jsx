
import React, { useEffect, useRef, useState } from 'react';

export default function SplashScreen({ onFinish }) {
  const [phase, setPhase] = useState('enter');

  // The parent passes a new onFinish on every render (it re-renders
  // every few seconds while polling orders/notifications). Keep the
  // latest one in a ref so the timers below start ONCE — otherwise
  // each re-render restarted them and the splash could never close.
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });

  useEffect(() => {
    // Safety net: never keep the app hidden for more than 4 seconds.
    const hardStop = setTimeout(() => onFinishRef.current?.(), 4000);

    // Logo shoots in
    const logoTimer = setTimeout(() => {
      setPhase('settle');
    }, 650);

    // Brand name appears
    const textTimer = setTimeout(() => {
      setPhase('text');
    }, 900);

    // Open app
    let exitTimer;
    const finishTimer = setTimeout(() => {
      setPhase('exit');

      exitTimer = setTimeout(() => {
        onFinishRef.current?.();
      }, 350);
    }, 2200);

    return () => {
      clearTimeout(hardStop);
      clearTimeout(logoTimer);
      clearTimeout(textTimer);
      clearTimeout(finishTimer);
      clearTimeout(exitTimer);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#121212] overflow-hidden transition-opacity duration-300 ${
        phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center">


       
{/* LOGO */}
<div
  className={`
    w-32 h-32 sm:w-40 sm:h-40
    rounded-3xl
    border-4 border-[#FFB800]
    bg-[#FFB800]
    p-4
    flex items-center justify-center
    shadow-[0_0_30px_rgba(255,184,0,0.35)]
    transition-all
    ease-out
    ${
      phase === 'enter'
        ? 'opacity-0 scale-[2.2] translate-y-[-120px] blur-[8px]'
        : 'opacity-100 scale-100 translate-y-0 blur-0'
    }
  `}
  style={{
    transitionDuration: '650ms',
  }}
>
  <img
    src="/bhook_lgi logo no bg.png"
    alt="Bhook_Lgi"
    className="w-full h-full object-contain"
  />
</div>

        {/* BRAND NAME */}
        <div
          className={`
            mt-5 overflow-hidden
            transition-all duration-500
            ${
              phase === 'text' || phase === 'exit'
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-5'
            }
          `}
        >
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            Bhook<span className="text-[#FFDA0]">_</span>Lgi
          </h1>
        </div>

      </div>

      {/* Subtle shooting light */}
      {/* Subtle shooting light */}
<div
  className={`
    absolute left-1/2 top-1/2
    w-[280px] h-[2px]
    bg-[#FFB800]
    -translate-x-1/2
    pointer-events-none
    transition-all duration-500
    ${
      phase === 'enter'
        ? 'opacity-0 scale-x-0'
        : 'opacity-0 scale-x-100'
    }
  `}
/>
    </div>
  );
}

