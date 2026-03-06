'use client';

import type { Category, TimeHorizon } from '@/types';
import { TIME_HORIZON_OPTIONS, CATEGORY_CONFIG } from '@/lib/constants';
import type { SortOption } from '@/hooks/useFilters';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  activeHorizon: TimeHorizon | 'ALL';
  onHorizonChange: (h: TimeHorizon | 'ALL') => void;
  activeCategory: Category | 'ALL';
  onCategoryChange: (c: Category | 'ALL') => void;
  sortBy: SortOption;
  onSortChange: (s: SortOption) => void;
  onScrollToPolymarket?: () => void;
  activeSection?: 'trades' | 'polymarket';
  onSectionChange?: (section: 'trades' | 'polymarket') => void;
}

export default function FilterBar({
  activeHorizon,
  onHorizonChange,
  activeCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  onScrollToPolymarket,
  activeSection = 'trades',
  onSectionChange,
}: FilterBarProps) {
  const categories: (Category | 'ALL')[] = [
    'ALL', 'SHIPPING', 'CURRENCY', 'EMERGING_MARKETS', 'COMMODITIES',
    'ENERGY', 'AGRICULTURE', 'DEFENSE', 'CONSUMER',
  ];

  return (
    <div className="sticky top-0 bg-surface-1 z-10 border-b border-border">
      {/* Tab row */}
      <div className="px-4 md:px-6 py-2 flex items-center gap-4 md:gap-6">
        <button
          onClick={() => onSectionChange?.('trades')}
          className={cn(
            'text-[11px] md:text-xs uppercase tracking-wide pb-2 pt-1',
            activeSection === 'trades'
              ? 'font-bold text-txt-primary border-b-2 border-blue'
              : 'font-medium text-txt-tertiary hover:text-txt-secondary'
          )}
        >
          Trade Ideas
        </button>
        <button
          onClick={() => { onSectionChange?.('polymarket'); onScrollToPolymarket?.(); }}
          className={cn(
            'text-[11px] md:text-xs uppercase tracking-wide pb-2 pt-1',
            activeSection === 'polymarket'
              ? 'font-bold text-txt-primary border-b-2 border-blue'
              : 'font-medium text-txt-tertiary hover:text-txt-secondary'
          )}
        >
          Polymarket
        </button>
        <div className="ml-auto hidden md:flex items-center gap-2">
          <span className="text-[10px] text-txt-tertiary">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="bg-white border border-border rounded text-[10px] text-txt-secondary px-2 py-1 focus:outline-none focus:border-blue"
          >
            <option value="conviction">Conviction High → Low</option>
            <option value="orderType">Effect Order</option>
          </select>
        </div>
      </div>

      {/* Horizon row */}
      <div className="px-4 md:px-6 pb-2 flex items-center gap-1 overflow-x-auto">
        <span className="text-[8px] md:text-[9px] text-txt-tertiary font-bold uppercase tracking-widest mr-1 md:mr-2 flex-shrink-0">
          Return Horizon
        </span>
        {TIME_HORIZON_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onHorizonChange(opt.value)}
            className={cn(
              'px-3 py-1 text-[10px] font-medium rounded whitespace-nowrap flex-shrink-0 transition-colors',
              activeHorizon === opt.value
                ? 'bg-blue text-white font-semibold'
                : 'bg-surface-2 text-txt-secondary hover:bg-surface-3'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Category chips */}
      <div className="px-4 md:px-6 pb-2.5 flex items-center gap-1.5 overflow-x-auto">
        <span className="text-[8px] md:text-[9px] text-txt-tertiary font-bold uppercase tracking-widest mr-1 flex-shrink-0">
          Sector
        </span>
        {categories.map((cat) => {
          if (cat === 'ALL') {
            return (
              <button
                key="ALL"
                onClick={() => onCategoryChange('ALL')}
                className={cn(
                  'px-2.5 py-0.5 text-[9px] font-medium rounded-full whitespace-nowrap flex-shrink-0',
                  activeCategory === 'ALL'
                    ? 'bg-txt-primary text-white font-semibold'
                    : 'bg-surface-2 text-txt-secondary hover:bg-surface-3'
                )}
              >
                All
              </button>
            );
          }

          const config = CATEGORY_CONFIG[cat];
          const isActive = activeCategory === cat;

          return (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={cn(
                'px-2.5 py-0.5 text-[9px] font-medium rounded-full border whitespace-nowrap flex-shrink-0',
                isActive
                  ? `${config.colorClass} ${config.bgClass} font-semibold`
                  : `${config.colorClass} ${config.bgClass} hover:opacity-80`
              )}
            >
              {config.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
