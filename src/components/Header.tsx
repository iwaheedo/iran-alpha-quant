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
          {/* Pulsing status dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-down opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-down" />
          </span>
          <h1 className="text-sm md:text-base font-bold text-txt-primary tracking-tight uppercase whitespace-nowrap">
            Iran Alpha Quant
          </h1>
        </div>
        <div className="h-4 w-px bg-border hidden md:block" />
        <span className="text-[10px] md:text-xs text-txt-secondary hidden md:inline truncate">
          {isAnalyzing
            ? 'Fetching intelligence...'
            : regime?.subtitle
              ? `${regime.subtitle} — ${regime.label}`
              : 'Live Monitoring'}
        </span>
        {regime && (
          <span className="text-[9px] md:text-[10px] font-medium text-amber bg-amber/10 px-1.5 md:px-2 py-0.5 rounded whitespace-nowrap">
            {regime.level}
          </span>
        )}
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
