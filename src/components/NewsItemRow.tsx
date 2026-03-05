'use client';

import type { NewsItem } from '@/types';
import { formatRelativeTime, formatEngagement, cn } from '@/lib/utils';

interface NewsItemRowProps {
  item: NewsItem;
  onAnalyze: (newsId: string) => void;
}

export default function NewsItemRow({ item, onAnalyze }: NewsItemRowProps) {
  const isBreaking = item.priority === 'BREAKING';
  const isHigh = item.priority === 'HIGH';
  const isTwitter = item.sourceType === 'TWITTER';

  return (
    <div
      className={cn(
        'px-4 py-3 border-b border-border row-hover cursor-pointer',
        isBreaking && 'bg-down/[0.03]'
      )}
    >
      {/* Meta row */}
      <div className="flex items-center gap-2 mb-1">
        {isBreaking && (
          <span className="text-[9px] font-bold text-white bg-down px-1.5 py-px rounded tracking-wider uppercase">
            Breaking
          </span>
        )}
        {isHigh && (
          <span className="text-[9px] font-bold text-white bg-amber px-1.5 py-px rounded tracking-wider uppercase">
            High
          </span>
        )}
        <span className="text-[10px] text-txt-tertiary font-mono">
          {formatRelativeTime(item.timestamp)}
        </span>
        <span className="ml-auto text-[10px] text-txt-tertiary">
          {item.source}
        </span>
      </div>

      {/* Title */}
      <p
        className={cn(
          'text-[12px] text-txt-primary leading-relaxed',
          isBreaking && isTwitter && 'font-medium'
        )}
      >
        {item.title}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-1.5">
        <div className="flex items-center gap-1">
          {/* Tags */}
          {item.tags.length > 0 && !isTwitter && (
            <div className="flex gap-1">
              {item.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] text-txt-tertiary font-medium px-1.5 py-0.5 bg-surface-2 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {/* Engagement for Twitter */}
          {isTwitter && item.engagement && (
            <span className="text-[10px] text-txt-tertiary font-mono">
              {item.engagement.likes
                ? `${formatEngagement(item.engagement.likes)} likes`
                : ''}
              {item.engagement.likes && item.engagement.reposts ? ' · ' : ''}
              {item.engagement.reposts
                ? `${formatEngagement(item.engagement.reposts)} reposts`
                : ''}
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAnalyze(item.id);
          }}
          className="text-[10px] text-blue font-medium hover:underline"
        >
          Analyze →
        </button>
      </div>
    </div>
  );
}
