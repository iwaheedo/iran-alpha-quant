'use client';

import { useState } from 'react';
import type { NewsItem } from '@/types';
import NewsItemRow from './NewsItemRow';
import { cn } from '@/lib/utils';

interface NewsFeedProps {
  news: NewsItem[];
  onAnalyze: (newsId: string) => void;
}

type FilterType = 'all' | 'news' | 'twitter';

export default function NewsFeed({ news, onAnalyze }: NewsFeedProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredNews = news.filter((item) => {
    if (filter === 'news') return item.sourceType === 'GOOGLE_NEWS';
    if (filter === 'twitter') return item.sourceType === 'TWITTER';
    return true;
  });

  return (
    <>
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between bg-surface-1">
        <span className="text-xs font-bold text-txt-primary uppercase tracking-wide">Intel Feed</span>
        <div className="flex gap-px bg-surface-2 rounded overflow-hidden">
          {(['all', 'news', 'twitter'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-2.5 py-1 text-[10px] font-medium',
                filter === f
                  ? 'bg-white text-txt-primary shadow-sm font-semibold'
                  : 'text-txt-tertiary hover:text-txt-secondary'
              )}
            >
              {f === 'all' ? 'All' : f === 'news' ? 'News' : 'X'}
            </button>
          ))}
        </div>
      </div>

      {/* News list */}
      <div className="overflow-y-auto flex-1">
        {filteredNews.length > 0 ? (
          filteredNews.map((item) => (
            <NewsItemRow key={item.id} item={item} onAnalyze={onAnalyze} />
          ))
        ) : (
          <div className="p-8 text-center">
            <p className="text-xs text-txt-tertiary">
              {news.length === 0
                ? 'No news yet — click "Run Analysis" to fetch latest intel'
                : 'No items match this filter'}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
