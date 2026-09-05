import React from 'react';

export interface LogoIconProps {
  size?: number | 'sm' | 'md' | 'lg';
  variant?: 'indigo' | 'purple';
  className?: string;
}

/**
 * Polished, modern vector logo mark for Nexora Workforce.
 * Features an engineered monogram "N" with layered isometric geometry,
 * dual-facet gradient pillars, a dynamic diagonal bridge, and an active global network node.
 */
export const LogoIcon: React.FC<LogoIconProps> = ({
  size = 'md',
  variant = 'indigo',
  className = '',
}) => {
  const pixelSize =
    typeof size === 'number'
      ? size
      : size === 'sm'
      ? 28
      : size === 'lg'
      ? 40
      : 32;

  // Generate a clean ID prefix for vector gradients
  const id = React.useId().replace(/:/g, '');
  const isPurple = variant === 'purple';

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
    >
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
        aria-label="Nexora Workforce Logo"
      >
        <defs>
          {/* Base Background Squircle Gradient */}
          <linearGradient id={`bg-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            {isPurple ? (
              <>
                <stop offset="0%" stopColor="#9333EA" />
                <stop offset="45%" stopColor="#7E22CE" />
                <stop offset="100%" stopColor="#4C1D95" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#4F46E5" />
                <stop offset="45%" stopColor="#4338CA" />
                <stop offset="100%" stopColor="#2E1065" />
              </>
            )}
          </linearGradient>

          {/* Left Vertical Pillar Gradient */}
          <linearGradient id={`left-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E0E7FF" stopOpacity="0.9" />
          </linearGradient>

          {/* Dynamic Diagonal Ribbon Gradient with subtle prism glow */}
          <linearGradient id={`diag-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            {isPurple ? (
              <>
                <stop offset="0%" stopColor="#F5D0FE" />
                <stop offset="40%" stopColor="#E9D5FF" />
                <stop offset="100%" stopColor="#FFFFFF" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#BAE6FD" />
                <stop offset="40%" stopColor="#E0E7FF" />
                <stop offset="100%" stopColor="#FFFFFF" />
              </>
            )}
          </linearGradient>

          {/* Right Vertical Pillar Gradient */}
          <linearGradient id={`right-${id}`} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#C7D2FE" stopOpacity="0.85" />
          </linearGradient>

          {/* Outer Depth Drop Shadow */}
          <filter id={`shadow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.2" stdDeviation="0.8" floodColor="#0F172A" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Squircle base with premium inner border highlight */}
        <rect width="36" height="36" rx="9" fill={`url(#bg-${id})`} />
        <rect
          x="0.6"
          y="0.6"
          width="34.8"
          height="34.8"
          rx="8.4"
          stroke="rgba(255, 255, 255, 0.24)"
          strokeWidth="1.2"
        />

        {/* Ambient Top Light Flare */}
        <ellipse cx="18" cy="2.5" rx="10" ry="2" fill="white" opacity="0.16" />

        {/* Modern Monogram "N" Geometry */}
        <g filter={`url(#shadow-${id})`}>
          {/* Left Vertical Pillar */}
          <rect x="9" y="8.5" width="4.5" height="19" rx="2.25" fill={`url(#left-${id})`} />

          {/* Right Vertical Pillar */}
          <rect x="22.5" y="8.5" width="4.5" height="19" rx="2.25" fill={`url(#right-${id})`} />

          {/* Dynamic Diagonal Ribbon */}
          <path
            d="M 11.25 10.75 L 24.75 25.25"
            stroke={`url(#diag-${id})`}
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        </g>

        {/* Precision Active Signal Node (Global Talent Network Apex) */}
        <circle cx="24.75" cy="8.75" r="2.2" fill={isPurple ? '#F0ABFC' : '#38BDF8'} />
        <circle cx="24.75" cy="8.75" r="1.1" fill="#FFFFFF" />
      </svg>
    </div>
  );
};

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'indigo' | 'purple';
  subtext?: string;
  textColor?: 'dark' | 'light';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'indigo',
  subtext,
  textColor = 'dark',
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoIcon size={size} variant={variant} />
      <div>
        <span
          className={`font-bold tracking-tight block leading-tight ${
            size === 'lg'
              ? 'text-lg'
              : size === 'sm'
              ? 'text-sm'
              : 'text-base'
          } ${textColor === 'light' ? 'text-white' : 'text-slate-900'}`}
        >
          Nexora Workforce
        </span>
        {subtext && (
          <span
            className={`block font-medium ${
              size === 'sm' ? 'text-[9px]' : 'text-[10px]'
            } ${textColor === 'light' ? 'text-slate-400' : 'text-slate-500'}`}
          >
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};
