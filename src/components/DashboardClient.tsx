'use client';

import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useFilters } from '@/hooks/useFilters';
import { useMobileNav } from '@/hooks/useMobileNav';
import TickerBar from './TickerBar';
import Header from './Header';
import NewsFeed from './NewsFeed';
import TradesPanel from './TradesPanel';
import MobileNav from './MobileNav';
import ErrorBoundary from './ErrorBoundary';
import { cn } from '@/lib/utils';

export default function DashboardClient() {
  const {
    trades,
    news,
    prices,
    regime,
    predictions,
    isAnalyzing,
    lastUpdated,
    newsCountdown,
  } = useAnalysisData();

  const {
    activeHorizon,
    setActiveHorizon,
    activeCategory,
    setActiveCategory,
    sortBy,
    setSortBy,
    filteredTrades,
  } = useFilters(trades);

  const { activeTab, switchTab } = useMobileNav();

  return (
    <div className="min-h-screen flex flex-col">
      <TickerBar prices={prices} />
      <Header regime={regime} isAnalyzing={isAnalyzing} />

      {/* Main layout */}
      <div className="desktop-layout h-[calc(100vh-76px)] md:h-[calc(100vh-76px)]" style={{ display: 'flex' }}>
        {/* LEFT: News Feed */}
        <div
          className={cn(
            'left-panel w-full md:w-[380px] border-r border-border flex flex-col flex-shrink-0 mobile-panel',
            activeTab === 'feed' && 'active'
          )}
          style={{ height: 'calc(100vh - 76px - 56px)' }}
        >
          <ErrorBoundary>
            <NewsFeed
              news={news}
              onAnalyze={() => {}}
              lastUpdated={lastUpdated}
              countdown={newsCountdown}
              isAnalyzing={isAnalyzing}
            />
          </ErrorBoundary>
        </div>

        {/* RIGHT: Trades */}
        <div
          className={cn(
            'right-panel flex-1 overflow-y-auto bg-surface-1 mobile-panel flex-col',
            (activeTab === 'trades' || activeTab === 'predict' || activeTab === 'history') && 'active'
          )}
          style={{ height: 'calc(100vh - 76px - 56px)' }}
        >
          <ErrorBoundary>
            <TradesPanel
              trades={filteredTrades}
              news={news}
              regime={regime}
              predictions={predictions}
              activeHorizon={activeHorizon}
              onHorizonChange={setActiveHorizon}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onSwitchToFeed={() => switchTab('feed')}
            />
          </ErrorBoundary>
        </div>
      </div>

      <MobileNav activeTab={activeTab} onSwitchTab={switchTab} />
    </div>
  );
}
