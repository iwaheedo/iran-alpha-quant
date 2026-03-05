'use client';

import { useRef, useCallback } from 'react';
import type { TradeIdea, NewsItem, MacroRegime, PolymarketPrediction, Category, TimeHorizon } from '@/types';
import type { SortOption } from '@/hooks/useFilters';
import FilterBar from './FilterBar';
import BreakingIntel from './BreakingIntel';
import MacroRegimeBox from './MacroRegimeBox';
import TradeCard from './TradeCard';
import PolymarketSection from './PolymarketSection';
import Disclaimer from './Disclaimer';

interface TradesPanelProps {
  trades: TradeIdea[];
  news: NewsItem[];
  regime: MacroRegime | null;
  predictions: PolymarketPrediction[];
  activeHorizon: TimeHorizon | 'ALL';
  onHorizonChange: (h: TimeHorizon | 'ALL') => void;
  activeCategory: Category | 'ALL';
  onCategoryChange: (c: Category | 'ALL') => void;
  sortBy: SortOption;
  onSortChange: (s: SortOption) => void;
  onSwitchToFeed: () => void;
  isLoading?: boolean;
  hasError?: boolean;
}

export default function TradesPanel({
  trades,
  news,
  regime,
  predictions,
  activeHorizon,
  onHorizonChange,
  activeCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  onSwitchToFeed,
  isLoading,
  hasError,
}: TradesPanelProps) {
  const polyRef = useRef<HTMLDivElement>(null);

  const scrollToPolymarket = useCallback(() => {
    polyRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <>
      <FilterBar
        activeHorizon={activeHorizon}
        onHorizonChange={onHorizonChange}
        activeCategory={activeCategory}
        onCategoryChange={onCategoryChange}
        sortBy={sortBy}
        onSortChange={onSortChange}
        onScrollToPolymarket={scrollToPolymarket}
      />

      {/* Breaking Intel (mobile only) */}
      <BreakingIntel news={news} onSeeAll={onSwitchToFeed} />

      {/* Regime */}
      <MacroRegimeBox regime={regime} />

      {/* Trade cards */}
      <div className="px-4 md:px-6 py-3 md:py-4 space-y-3">
        {isLoading ? (
          <div className="bg-white rounded border border-border p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-4 h-4 border-2 border-blue border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-txt-secondary font-medium">Generating trade ideas...</p>
            </div>
            <p className="text-[10px] text-txt-tertiary">
              AI is analyzing the latest news and market data. This may take up to 60 seconds.
            </p>
          </div>
        ) : trades.length > 0 ? (
          trades.map((trade) => (
            <TradeCard key={trade.id} trade={trade} />
          ))
        ) : hasError ? (
          <div className="bg-white rounded border border-amber/30 p-8 text-center">
            <p className="text-xs text-amber font-medium mb-2">
              AI analysis temporarily unavailable
            </p>
            <p className="text-[10px] text-txt-tertiary">
              Trade ideas will appear automatically when the next analysis cycle completes. News and prices continue updating live.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded border border-border p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-4 h-4 border-2 border-blue border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-txt-secondary font-medium">Waiting for first analysis...</p>
            </div>
            <p className="text-[10px] text-txt-tertiary">
              Trade ideas will appear automatically once the AI completes its analysis.
            </p>
          </div>
        )}

        {/* Polymarket */}
        <div ref={polyRef}>
          <PolymarketSection predictions={predictions} />
        </div>

        {/* Disclaimer */}
        <Disclaimer />

        <div className="h-6" />
      </div>
    </>
  );
}
