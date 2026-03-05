import React from 'react';

interface NextBullLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  glow?: boolean;
  showText?: boolean;
  animated?: boolean;
  className?: string;
}

const sizeMap = {
  xs: { logo: 22, text: 'text-xs', ring: 28 },
  sm: { logo: 30, text: 'text-sm', ring: 40 },
  md: { logo: 40, text: 'text-lg', ring: 52 },
  lg: { logo: 52, text: 'text-2xl', ring: 66 },
  xl: { logo: 72, text: 'text-4xl', ring: 90 },
  hero: { logo: 90, text: 'text-5xl', ring: 110 },
};

export const NextBullLogo = ({
  size = 'md',
  glow = true,
  showText = true,
  animated = true,
  className = '',
}: NextBullLogoProps) => {
  const s = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Mark */}
      <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: s.ring, height: s.ring }}>
        {/* Animated outer glow aura */}
        {glow && (
          <>
            {/* Pulsing wide glow */}
            <div
              className="absolute rounded-2xl animate-logo-glow"
              style={{
                width: s.ring * 1.8,
                height: s.ring * 1.8,
                left: -(s.ring * 0.4),
                top: -(s.ring * 0.4),
                background: 'radial-gradient(circle, rgba(59,130,246,0.35) 0%, rgba(99,102,241,0.15) 40%, transparent 70%)',
                filter: 'blur(12px)',
              }}
            />
            {/* Tight inner glow */}
            <div
              className="absolute rounded-xl animate-logo-glow-inner"
              style={{
                width: s.ring * 1.3,
                height: s.ring * 1.3,
                left: -(s.ring * 0.15),
                top: -(s.ring * 0.15),
                background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, rgba(37,99,235,0.2) 50%, transparent 75%)',
                filter: 'blur(6px)',
              }}
            />
          </>
        )}

        {/* Logo container with glowing border */}
        <div
          className={`relative z-10 flex items-center justify-center rounded-xl overflow-hidden transition-all duration-300 ${
            glow ? 'animate-logo-ring' : ''
          }`}
          style={{
            width: s.ring,
            height: s.ring,
            border: `2px solid ${glow ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.2)'}`,
            boxShadow: glow
              ? '0 0 12px rgba(59,130,246,0.4), 0 0 24px rgba(59,130,246,0.15), inset 0 0 8px rgba(59,130,246,0.1)'
              : 'none',
          }}
        >
          <img
            src="/nextbull-logo.jpg"
            alt="NextBull"
            width={s.ring}
            height={s.ring}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      </div>

      {/* Text */}
      {showText && (
        <div className="flex flex-col">
          <div className="leading-none flex items-baseline gap-1.5">
            <span
              className={`${s.text} font-black tracking-tight bg-gradient-to-r from-blue-400 via-white to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_16px_rgba(59,130,246,0.5)]`}
            >
              NEXTBULL
            </span>
            <span
              className={`${s.text} font-black tracking-tight bg-gradient-to-r from-blue-300 to-indigo-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]`}
            >
              GPT
            </span>
          </div>
          <span className="text-[10px] font-mono tracking-[0.35em] text-blue-400/70 uppercase leading-none mt-0.5">
            Trading Terminal
          </span>
        </div>
      )}
    </div>
  );
};

export default NextBullLogo;
