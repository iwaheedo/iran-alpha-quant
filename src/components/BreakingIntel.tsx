'use client';

import type { NewsItem } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

interface BreakingIntelProps {
  news: NewsItem[];
  onSeeAll: () => void;
}

export default function BreakingIntel({ news, onSeeAll }: BreakingIntelProps) {
  // Get top 3 breaking/high-priority items
  const topItems = news
    .filter(n => n.priority === 'BREAKING' || n.priority === 'HIGH')
    .slice(0, 3);

  if (topItems.length === 0) return null;

  return (
    <div className="md:hidden mx-4 mt-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[9px] font-bold text-txt-primary uppercase tracking-widest">Breaking Intel</span>
        <div className="flex-1 h-px bg-border" />
        <button onClick={onSeeAll} className="text-[9px] text-blue font-medium">
          See all →
        </button>
      </div>
      <div className="space-y-1.5">
        {topItems.map((item, idx) => {
          const isBreaking = item.priority === 'BREAKING';
          return (
            <div
              key={`${item.id}-${idx}`}
              onClick={onSeeAll}
              className={`flex items-start gap-2 p-2 rounded border cursor-pointer ${
                isBreaking
                  ? 'bg-down/[0.03] border-down/10'
                  : 'bg-white border-border'
              }`}
            >
              <span
                className={`text-[8px] font-bold text-white px-1 py-px rounded tracking-wider uppercase flex-shrink-0 mt-0.5 ${
                  isBreaking ? 'bg-down' : 'bg-amber'
                }`}
              >
                {isBreaking ? 'BRK' : 'HIGH'}
              </span>
              <p className="text-[11px] text-txt-primary leading-snug line-clamp-2">
                {item.title}
                {' '}
                <span className="text-txt-tertiary">
                  {item.source} · {formatRelativeTime(item.timestamp)}
                </span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
