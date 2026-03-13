'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { TradeIdea, NewsItem, MacroRegime, PolymarketPrediction, Category, TimeHorizon, PortfolioPosition } from '@/types';
import type { SortOption } from '@/hooks/useFilters';
import type { MobileTab } from '@/hooks/useMobileNav';
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
  activePositions: PortfolioPosition[];
  activeHorizon: TimeHorizon | 'ALL';
  onHorizonChange: (h: TimeHorizon | 'ALL') => void;
  activeCategory: Category | 'ALL';
  onCategoryChange: (c: Category | 'ALL') => void;
  sortBy: SortOption;
  onSortChange: (s: SortOption) => void;
  onSwitchToFeed: () => void;
  isLoading?: boolean;
  hasError?: boolean;
  activeTab?: MobileTab;
}

export default function TradesPanel({
  trades,
  news,
  regime,
  predictions,
  activePositions = [],
  activeHorizon,
  onHorizonChange,
  activeCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  onSwitchToFeed,
  isLoading,
  hasError,
  activeTab,
}: TradesPanelProps) {
  const polyRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<'trades' | 'polymarket'>('trades');

  const scrollPanelTo = useCallback((target: 'top' | 'polymarket') => {
    const panel = polyRef.current?.closest('.right-panel') as HTMLElement | null;
    if (!panel) return;
    if (target === 'top') {
      panel.scrollTop = 0;
    } else if (polyRef.current) {
      const panelRect = panel.getBoundingClientRect();
      const polyRect = polyRef.current.getBoundingClientRect();
      panel.scrollTop = polyRect.top - panelRect.top + panel.scrollTop;
    }
  }, []);

  const scrollToPolymarket = useCallback(() => {
    scrollPanelTo('polymarket');
  }, [scrollPanelTo]);

  const handleSectionChange = useCallback((section: 'trades' | 'polymarket') => {
    setActiveSection(section);
    if (section === 'trades') {
      scrollPanelTo('top');
    }
  }, [scrollPanelTo]);

  // Sync section with mobile bottom nav tabs
  useEffect(() => {
    if (activeTab === 'predict') {
      setActiveSection('polymarket');
      const timer = setTimeout(() => scrollPanelTo('polymarket'), 150);
      return () => clearTimeout(timer);
    } else if (activeTab === 'trades') {
      setActiveSection('trades');
      scrollPanelTo('top');
    }
  }, [activeTab, scrollPanelTo]);

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
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
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
          trades.map((trade) => {
            const pos = activePositions.find(p => p.ticker === trade.ticker);
            return <TradeCard key={trade.id} trade={trade} position={pos} />;
          })
        ) : hasError ? (
          <div className="bg-white rounded border border-amber/30 p-8 text-center">
            <p className="text-xs text-amber font-medium mb-2">
              AI analysis temporarily unavailable
            </p>
            <p className="text-[10px] text-txt-tertiary">
              Trade ideas will appear automatically when the next analysis cycle completes. News and prices continue updating live.
            </p>
          </div>
        ) : (activeHorizon !== 'ALL' || activeCategory !== 'ALL') ? (
          <div className="bg-white rounded border border-border p-8 text-center">
            <p className="text-xs text-txt-secondary font-medium mb-1">No trades match this filter</p>
            <p className="text-[10px] text-txt-tertiary">
              Try selecting &quot;All&quot; to see all available trade ideas.
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
