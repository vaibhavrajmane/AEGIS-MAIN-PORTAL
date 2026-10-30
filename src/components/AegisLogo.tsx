import React from 'react';

interface AegisLogoProps {
  className?: string;
  size?: number;
}

export const AegisLogo: React.FC<AegisLogoProps> = ({ className = 'w-8 h-8', size = 34 }) => {
  const pixelSize = size || 34;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 128"
      width={pixelSize}
      height={pixelSize}
      fill="none"
      className={`shrink-0 block select-none ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
        minWidth: pixelSize,
        minHeight: pixelSize,
        display: 'block',
      }}
      aria-label="AEGIS Ocean Sentinel Logo"
    >
      <defs>
        <linearGradient id="shieldGradComp" x1="64" y1="8" x2="64" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0369a1" />
          <stop offset="45%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#021526" />
        </linearGradient>
        <linearGradient id="cyanGlowComp" x1="20" y1="20" x2="108" y2="108" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="goldBeacon" x1="64" y1="36" x2="64" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <filter id="aegisGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Glow Halo */}
      <path
        d="M64 12 L108 28 C108 72 88 102 64 116 C40 102 20 72 20 28 L64 12 Z"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="6"
        strokeOpacity="0.25"
        filter="url(#aegisGlow)"
      />

      {/* Outer Tactical Shield Contour */}
      <path
        d="M64 12 L108 28 C108 72 88 102 64 116 C40 102 20 72 20 28 L64 12 Z"
        fill="url(#shieldGradComp)"
        stroke="url(#cyanGlowComp)"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Inner Inset Shield Trim */}
      <path
        d="M64 22 L98 34 C98 68 82 94 64 105 C46 94 30 68 30 34 L64 22 Z"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="1.5"
        strokeOpacity="0.5"
        strokeDasharray="4 2"
      />

      {/* Radar Sonar Arcs */}
      <path
        d="M44 48 A28 28 0 0 1 84 48"
        stroke="#0ea5e9"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M38 42 A38 38 0 0 1 90 42"
        stroke="#38bdf8"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M32 36 A48 48 0 0 1 96 36"
        stroke="#06b6d4"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />

      {/* Radar Target Rings */}
      <circle cx="64" cy="64" r="26" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.5" fill="#0284c7" fillOpacity="0.2" />
      <circle cx="64" cy="64" r="14" stroke="#0ea5e9" strokeWidth="1.5" strokeOpacity="0.7" fill="#0369a1" fillOpacity="0.3" />

      {/* Central Maritime Anchor & Star Motif */}
      <line x1="64" y1="34" x2="64" y2="86" stroke="url(#cyanGlowComp)" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="48" y1="48" x2="80" y2="48" stroke="url(#cyanGlowComp)" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="64" cy="32" r="6" stroke="#38bdf8" strokeWidth="2.5" fill="none" />

      {/* Anchor Flukes */}
      <path
        d="M42 72 C46 88 56 94 64 94 C72 94 82 88 86 72"
        stroke="url(#cyanGlowComp)"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <polygon points="42,72 37,77 44,79" fill="#38bdf8" />
      <polygon points="86,72 91,77 84,79" fill="#38bdf8" />

      {/* Center Beacon Node */}
      <circle cx="64" cy="64" r="5" fill="#ffffff" filter="url(#aegisGlow)" />
      <circle cx="64" cy="64" r="2.5" fill="#0284c7" />
    </svg>
  );
};
