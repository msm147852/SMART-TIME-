import React, { useState } from 'react';
import { Sparkles, Clock } from 'lucide-react';
import { Language } from '../types';
import smartTimeLogo from '../assets/images/smart_time_logo_1788556138099.jpg';

interface BrandLogoProps {
  language?: Language;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  showText?: boolean;
  onClick?: () => void;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  language = 'ar',
  size = 'md',
  showSubtitle = false,
  showText = false,
  onClick,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';
  const isXLarge = size === 'xl';

  const containerSizes = isSmall
    ? 'w-8 h-8'
    : isLarge
    ? 'w-12 h-12'
    : isXLarge
    ? 'w-16 h-16 sm:w-20 sm:h-20'
    : 'w-9 h-9 sm:w-10 sm:h-10';

  const titleSizes = isSmall
    ? 'text-sm'
    : isLarge
    ? 'text-xl sm:text-2xl'
    : isXLarge
    ? 'text-2xl sm:text-3xl'
    : 'text-base sm:text-lg';

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 sm:gap-3 select-none ${
        onClick ? 'cursor-pointer group' : ''
      } ${className}`}
      id="brand-logo-component"
    >
      {/* Luxury Gold Icon Emblem with Official Logo */}
      <div
        className={`${containerSizes} rounded-2xl bg-slate-950 border-2 border-amber-400/80 p-0.5 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/30 group-hover:scale-105 transition-all shrink-0 relative overflow-hidden flex items-center justify-center`}
      >
        {!imageError ? (
          <img
            src={smartTimeLogo}
            alt="Logo"
            onError={() => setImageError(true)}
            className="w-full h-full object-contain rounded-xl"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-xl flex items-center justify-center text-slate-950">
            <Clock className={`${isSmall ? 'w-4 h-4' : 'w-5 h-5'} font-bold`} />
          </div>
        )}
        <span className="absolute -top-0.5 -end-0.5 pointer-events-none">
          <Sparkles className="w-2.5 h-2.5 text-amber-300 animate-pulse" />
        </span>
      </div>

      {/* Brand Typography (Only if showText is explicitly true) */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black tracking-tight ${titleSizes} text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors font-sans`}
            >
              Time Gold
            </span>
          </div>

          {showSubtitle && (
            <span className="text-[11px] sm:text-xs font-bold text-amber-700 dark:text-amber-400/90 tracking-wide mt-0.5">
              {language === 'ar' ? 'الواجهة الشخصية' : 'Personal Cockpit'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

