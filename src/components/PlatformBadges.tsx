'use client';

import type { TradePlatform } from '@/types';

interface PlatformBadgesProps {
  platforms: TradePlatform[];
}

export default function PlatformBadges({ platforms }: PlatformBadgesProps) {
  return (
    <div className="flex items-center gap-2 pt-3 border-t border-border flex-wrap">
      <span className="text-[9px] font-bold text-txt-tertiary uppercase tracking-widest mr-1">
        Trade on
      </span>
      {platforms.map((p, i) => (
        <span
          key={i}
          className="text-[10px] text-txt-secondary px-2 py-1 bg-surface-1 rounded border border-border font-medium"
        >
          {p.name}{' '}
          <span className="font-mono text-txt-tertiary">
            {p.instrument}
            {p.details ? ` · ${p.details}` : ''}
          </span>
        </span>
      ))}
    </div>
  );
}
