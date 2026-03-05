'use client';

function Shimmer({ className }: { className: string }) {
  return (
    <div className={`animate-pulse bg-surface-2 rounded ${className}`} />
  );
}

export function TickerBarSkeleton() {
  return (
    <div className="h-8 bg-surface-1 border-b border-border flex items-center overflow-hidden">
      <div className="flex-shrink-0 px-2 md:px-3 h-full flex items-center gap-1.5 border-r border-border">
        <div className="w-1.5 h-1.5 rounded-full bg-surface-3" />
        <span className="font-mono text-[9px] text-txt-tertiary tracking-widest uppercase">Live</span>
      </div>
      <div className="flex gap-6 px-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Shimmer key={i} className="h-3 w-20" />
        ))}
      </div>
    </div>
  );
}

export function NewsItemSkeleton() {
  return (
    <div className="px-4 py-3 border-b border-border">
      <div className="flex items-center gap-2 mb-2">
        <Shimmer className="h-4 w-14" />
        <Shimmer className="h-3 w-12" />
        <div className="ml-auto">
          <Shimmer className="h-3 w-20" />
        </div>
      </div>
      <Shimmer className="h-3 w-full mb-1" />
      <Shimmer className="h-3 w-3/4" />
      <div className="flex justify-between mt-2">
        <div className="flex gap-1">
          <Shimmer className="h-4 w-12" />
          <Shimmer className="h-4 w-12" />
        </div>
        <Shimmer className="h-3 w-14" />
      </div>
    </div>
  );
}

export function TradeCardSkeleton() {
  return (
    <div className="bg-white rounded border border-border overflow-hidden">
      <div className="px-4 md:px-5 py-3 border-b border-border bg-surface-1/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shimmer className="h-5 w-12" />
            <Shimmer className="h-4 w-10" />
            <Shimmer className="h-3 w-32 hidden md:block" />
            <Shimmer className="h-3 w-14" />
          </div>
          <Shimmer className="h-4 w-10" />
        </div>
        <div className="flex items-center gap-1.5">
          <Shimmer className="h-5 w-16" />
          <Shimmer className="h-5 w-14" />
        </div>
      </div>
      <div className="p-4 md:p-5">
        <Shimmer className="h-3 w-full mb-1" />
        <Shimmer className="h-3 w-5/6 mb-4" />
        <div className="flex items-center gap-2 mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="contents">
              <Shimmer className="h-6 w-24" />
              {i < 3 && <span className="text-txt-tertiary text-[10px]">→</span>}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Shimmer className="h-2 w-16 mb-2" />
            <Shimmer className="h-3 w-full" />
          </div>
          <div>
            <Shimmer className="h-2 w-12 mb-2" />
            <Shimmer className="h-3 w-full" />
          </div>
        </div>
        <Shimmer className="h-8 w-full mb-4" />
        <div className="flex gap-2">
          <Shimmer className="h-6 w-28" />
          <Shimmer className="h-6 w-28" />
        </div>
      </div>
    </div>
  );
}

export function PolymarketSkeleton() {
  return (
    <div className="bg-white rounded border border-border overflow-hidden">
      <div className="px-5 py-2 bg-surface-1 border-b border-border">
        <Shimmer className="h-3 w-full" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="px-5 py-3 border-b border-border last:border-0">
          <div className="flex items-center gap-4">
            <Shimmer className="h-3 w-48 flex-shrink-0" />
            <Shimmer className="h-5 w-8" />
            <Shimmer className="h-3 w-8" />
            <Shimmer className="h-3 w-8" />
            <Shimmer className="h-3 w-8" />
            <Shimmer className="h-3 w-8" />
            <Shimmer className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NewsFeedSkeleton() {
  return (
    <>
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between bg-surface-1">
        <span className="text-xs font-bold text-txt-primary uppercase tracking-wide">Intel Feed</span>
        <Shimmer className="h-6 w-28" />
      </div>
      <div className="overflow-y-auto flex-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <NewsItemSkeleton key={i} />
        ))}
      </div>
    </>
  );
}

export function TradesPanelSkeleton() {
  return (
    <>
      <div className="sticky top-0 bg-surface-1 z-10 border-b border-border">
        <div className="px-4 md:px-6 py-2 flex items-center gap-6">
          <Shimmer className="h-4 w-20" />
          <Shimmer className="h-4 w-20" />
        </div>
        <div className="px-4 md:px-6 pb-2 flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Shimmer key={i} className="h-6 w-16" />
          ))}
        </div>
      </div>
      <div className="px-4 md:px-6 py-4 space-y-3">
        <Shimmer className="h-20 w-full rounded" />
        {Array.from({ length: 2 }).map((_, i) => (
          <TradeCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
