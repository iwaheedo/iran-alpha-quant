'use client';

import type { NewsItem } from '@/types';
import NewsItemRow from './NewsItemRow';

interface NewsFeedProps {
  news: NewsItem[];
  onAnalyze: (newsId: string) => void;
  lastUpdated: Date | null;
  countdown: number;
  isAnalyzing: boolean;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export default function NewsFeed({ news, onAnalyze, lastUpdated, countdown, isAnalyzing }: NewsFeedProps) {
  return (
    <>
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border bg-surface-1">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            {/* Pulsing live dot */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-up opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-up" />
            </span>
            <span className="text-xs font-bold text-txt-primary uppercase tracking-wide">Live Events</span>
          </div>
        </div>

        {/* Last Updated + Countdown */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-txt-tertiary">
            {lastUpdated
              ? `Last updated ${formatTime(lastUpdated)}`
              : isAnalyzing
                ? 'Fetching intelligence...'
                : 'Waiting for data...'}
          </span>
          <span className="text-[10px] font-mono text-blue font-medium">
            {isAnalyzing ? (
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 border-[1.5px] border-blue/30 border-t-blue rounded-full animate-spin" />
                Scanning...
              </span>
            ) : (
              `Refreshing in ${countdown}s`
            )}
          </span>
        </div>
      </div>

      {/* News list */}
      <div className="overflow-y-auto flex-1">
        {news.length > 0 ? (
          news.map((item, idx) => (
            <NewsItemRow key={`${item.id}-${idx}`} item={item} onAnalyze={onAnalyze} />
          ))
        ) : (
          <div className="p-8 text-center">
            <p className="text-xs text-txt-tertiary">
              {isAnalyzing
                ? 'Fetching live events...'
                : 'No events yet — feed will populate automatically'}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
