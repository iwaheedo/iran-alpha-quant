'use client';

import type { MacroRegime } from '@/types';

interface MacroRegimeBoxProps {
  regime: MacroRegime | null;
}

export default function MacroRegimeBox({ regime }: MacroRegimeBoxProps) {
  if (!regime) return null;

  return (
    <div className="mx-4 md:mx-6 mt-3 md:mt-4 p-3 md:p-4 bg-white rounded border border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-txt-primary uppercase tracking-wide">
          Macro Regime Assessment
        </span>
        <span className="text-[9px] font-bold text-amber bg-amber/10 px-2 py-0.5 rounded uppercase tracking-wider">
          Regime Shift: {regime.level}
        </span>
      </div>
      <p className="text-[11px] text-txt-secondary leading-relaxed">{regime.summary}</p>
    </div>
  );
}
