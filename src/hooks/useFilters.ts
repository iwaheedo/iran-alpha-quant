'use client';

import { useState, useMemo } from 'react';
import type { TradeIdea, Category, TimeHorizon } from '@/types';

export type SortOption = 'conviction' | 'orderType';

export function useFilters(trades: TradeIdea[]) {
  const [activeHorizon, setActiveHorizon] = useState<TimeHorizon | 'ALL'>('DAYS');
  const [activeCategory, setActiveCategory] = useState<Category | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('conviction');
  const [newsFilter, setNewsFilter] = useState<'all' | 'news' | 'twitter'>('all');

  const filteredTrades = useMemo(() => {
    let result = [...trades];

    // Filter by horizon
    if (activeHorizon !== 'ALL') {
      result = result.filter(t => t.timeHorizon === activeHorizon);
    }

    // Filter by category
    if (activeCategory !== 'ALL') {
      result = result.filter(t => t.categories.includes(activeCategory));
    }

    // Sort
    if (sortBy === 'conviction') {
      result.sort((a, b) => b.conviction - a.conviction);
    } else if (sortBy === 'orderType') {
      const orderRank = { '3RD_ORDER': 0, '2ND_ORDER': 1, '1ST_ORDER': 2, 'CROWDED': 3 };
      result.sort((a, b) => orderRank[a.orderType] - orderRank[b.orderType]);
    }

    return result;
  }, [trades, activeHorizon, activeCategory, sortBy]);

  return {
    activeHorizon,
    setActiveHorizon,
    activeCategory,
    setActiveCategory,
    sortBy,
    setSortBy,
    newsFilter,
    setNewsFilter,
    filteredTrades,
  };
}
