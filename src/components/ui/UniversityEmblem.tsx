import React from 'react';

interface UniversityEmblemProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export default function UniversityEmblem({
  size = 'md',
  className = '',
  showText = false,
}: UniversityEmblemProps) {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        className={`${sizeMap[size]} shrink-0`}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="FUTMINNA University Emblem"
      >
        {/* Shield Base */}
        <path
          d="M32 4L10 12V32C10 44.5 19.5 56 32 60C44.5 56 54 44.5 54 32V12L32 4Z"
          fill="#14532d"
          stroke="#d97706"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Inner Shield Accent */}
        <path
          d="M32 8L14 15V32C14 42 21.8 51.5 32 55C42.2 51.5 50 42 50 32V15L32 8Z"
          fill="#064e3b"
          opacity="0.9"
        />

        {/* Central Cogwheel (Technology) */}
        <circle cx="32" cy="27" r="7" stroke="#fbbf24" strokeWidth="2.2" strokeDasharray="3 1.5" />
        <circle cx="32" cy="27" r="3.2" fill="#fbbf24" />

        {/* Open Academic Book (Learning) */}
        <path
          d="M23 43C27 41.5 30 42.5 32 44C34 42.5 37 41.5 41 43V37C37 35.8 34 36.8 32 38C30 36.8 27 35.8 23 37V43Z"
          fill="#fef3c7"
          stroke="#d97706"
          strokeWidth="1.2"
        />
        <line x1="32" y1="38" x2="32" y2="44" stroke="#d97706" strokeWidth="1.2" />

        {/* Torch of Knowledge */}
        <path
          d="M32 15V22M30 15C30.5 13 32 11 32 11C32 11 33.5 13 34 15C34 16.5 33 17 32 17C31 17 30 16.5 30 15Z"
          fill="#f59e0b"
          stroke="#fef3c7"
          strokeWidth="0.8"
        />

        {/* Academic Stars */}
        <circle cx="21" cy="22" r="1.2" fill="#fde68a" />
        <circle cx="43" cy="22" r="1.2" fill="#fde68a" />
      </svg>

      {showText && (
        <div className="flex flex-col text-left">
          <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 leading-tight">
            FUTMINNA
          </span>
          <span className="text-[10px] font-medium tracking-wider uppercase text-univ-700">
            Student &amp; Result Portal
          </span>
        </div>
      )}
    </div>
  );
}
