'use client';

import type { MacroRegime } from '@/types';

interface HeaderProps {
  regime: MacroRegime | null;
  isAnalyzing: boolean;
}

export default function Header({ regime, isAnalyzing }: HeaderProps) {
  return (
    <header className="px-4 md:px-6 py-2.5 md:py-3 border-b border-border flex items-center justify-between">
      <div className="flex items-center gap-2 md:gap-4 min-w-0">
        <div className="flex items-center gap-2">
          {/* Quant fund logo */}
          <div className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-md bg-txt-primary flex-shrink-0">
            <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5 md:w-[22px] md:h-[22px]">
              {/* Bar chart — 4 ascending bars */}
              <rect x="3" y="20" width="4.5" height="9" rx="1" fill="white" opacity="0.4" />
              <rect x="10" y="14" width="4.5" height="15" rx="1" fill="white" opacity="0.6" />
              <rect x="17" y="9" width="4.5" height="20" rx="1" fill="white" opacity="0.8" />
              <rect x="24" y="4" width="4.5" height="25" rx="1" fill="white" opacity="1" />
              {/* Alpha trendline overlay */}
              <polyline
                points="5,22 12,16 19,11 26,5"
                stroke="#22c55e"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
          <h1 className="text-sm md:text-base font-bold text-txt-primary tracking-tight uppercase whitespace-nowrap" style={{ fontFamily: 'var(--font-rajdhani), system-ui, sans-serif' }}>
            War Alpha Quant
          </h1>
        </div>
        <div className="h-4 w-px bg-border hidden md:block" />
        <span className="text-[10px] md:text-xs text-txt-secondary hidden md:inline truncate">
          {isAnalyzing
            ? 'Fetching intelligence...'
            : 'Converting Breaking News into Trade Alphas'}
        </span>
      </div>

      {/* Desktop extras */}
      <div className="flex items-center gap-2 md:gap-3 desktop-header-extras">
        <a
          href="https://x.com/iwaheedo"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-txt-tertiary hover:text-blue transition-colors hidden md:inline"
        >
          Created by <span className="font-medium text-txt-secondary">@iwaheedo</span>
        </a>
        <div className="h-4 w-px bg-border hidden md:block" />
        {isAnalyzing ? (
          <span className="h-7 px-3 md:px-4 bg-surface-1 border border-border text-[11px] md:text-xs text-txt-secondary rounded flex items-center gap-1.5">
            <span className="w-3 h-3 border-2 border-blue/30 border-t-blue rounded-full animate-spin" />
            Loading...
          </span>
        ) : (
          <span className="h-7 px-3 md:px-4 bg-up/10 text-up text-[11px] md:text-xs font-medium rounded flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-up opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-up" />
            </span>
            Live
          </span>
        )}
      </div>

      {/* Mobile extras */}
      <div className="items-center gap-2 mobile-header-extras" style={{ display: 'none' }}>
        <a
          href="https://x.com/iwaheedo"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] text-txt-tertiary"
        >
          by <span className="font-medium text-txt-secondary">@iwaheedo</span>
        </a>
        {isAnalyzing ? (
          <span className="h-7 px-3 bg-surface-1 border border-border text-[11px] text-txt-secondary rounded flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 border-[1.5px] border-blue/30 border-t-blue rounded-full animate-spin" />
          </span>
        ) : (
          <span className="h-7 px-3 bg-up/10 text-up text-[11px] font-medium rounded flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-up" />
            Live
          </span>
        )}
      </div>
    </header>
  );
}
