'use client';

import type { MacroRegime } from '@/types';

interface HeaderProps {
  regime: MacroRegime | null;
  isAnalyzing: boolean;
  onRunAnalysis: () => void;
}

export default function Header({ regime, isAnalyzing, onRunAnalysis }: HeaderProps) {
  return (
    <header className="px-4 md:px-6 py-2.5 md:py-3 border-b border-border flex items-center justify-between">
      <div className="flex items-center gap-2 md:gap-4 min-w-0">
        <h1 className="text-sm md:text-base font-bold text-txt-primary tracking-tight uppercase whitespace-nowrap">
          Iran Alpha Quant
        </h1>
        <div className="h-4 w-px bg-border hidden md:block" />
        <span className="text-[10px] md:text-xs text-txt-secondary hidden md:inline truncate">
          {regime?.subtitle || 'Ready'}
          {regime?.label ? ` — ${regime.label}` : ''}
        </span>
        {regime && (
          <span className="text-[9px] md:text-[10px] font-medium text-amber bg-amber/10 px-1.5 md:px-2 py-0.5 rounded whitespace-nowrap">
            REGIME SHIFT: {regime.level}
          </span>
        )}
      </div>

      {/* Desktop header extras */}
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
        <button
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className="h-7 px-3 md:px-4 bg-blue text-white text-[11px] md:text-xs font-medium rounded hover:bg-blue/90 transition-colors disabled:opacity-60"
        >
          {isAnalyzing ? (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing...
            </span>
          ) : (
            'Run Analysis'
          )}
        </button>
        <a
          href="/history"
          className="h-7 px-3 md:px-4 bg-surface-1 border border-border text-[11px] md:text-xs text-txt-secondary rounded hover:bg-surface-2 transition-colors hidden md:flex items-center"
        >
          History
        </a>
      </div>

      {/* Mobile header extras */}
      <div className="items-center gap-2 mobile-header-extras" style={{ display: 'none' }}>
        <a
          href="https://x.com/iwaheedo"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] text-txt-tertiary"
        >
          by <span className="font-medium text-txt-secondary">@iwaheedo</span>
        </a>
        <button
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className="h-7 px-3 bg-blue text-white text-[11px] font-medium rounded disabled:opacity-60"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>
    </header>
  );
}
