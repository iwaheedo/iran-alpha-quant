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
        {trades.length > 0 ? (
          trades.map((trade) => (
            <TradeCard key={trade.id} trade={trade} />
          ))
        ) : (
          <div className="bg-white rounded border border-border p-8 text-center">
            <p className="text-xs text-txt-tertiary mb-2">
              No trade ideas yet
            </p>
            <p className="text-[10px] text-txt-tertiary">
              Click &ldquo;Run Analysis&rdquo; to generate AI-powered trade ideas from the latest news
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
