'use client';

import type { TickerPrice } from '@/types';
import { formatPrice, formatPercent } from '@/lib/utils';

interface TickerBarProps {
  prices: TickerPrice[];
}

function PriceTick({ ticker }: { ticker: TickerPrice }) {
  const isUp = ticker.changePercent >= 0;
  return (
    <span className="font-mono text-[11px]">
      <span className="text-txt-tertiary">{ticker.symbol}</span>{' '}
      <span className="text-txt-primary font-medium">{formatPrice(ticker.price)}</span>{' '}
      <span className={isUp ? 'text-up' : 'text-down'}>
        {isUp ? '+' : ''}{ticker.changePercent.toFixed(2)}%
      </span>
    </span>
  );
}

export default function TickerBar({ prices }: TickerBarProps) {
  // Duplicate prices for seamless scroll animation
  const displayPrices = prices.length > 0 ? [...prices, ...prices] : [];

  return (
    <div className="h-8 bg-surface-1 border-b border-border flex items-center overflow-hidden">
      <div className="flex-shrink-0 px-2 md:px-3 h-full flex items-center gap-1.5 border-r border-border">
        <div className="w-1.5 h-1.5 rounded-full bg-up" />
        <span className="font-mono text-[9px] text-txt-tertiary tracking-widest uppercase">Live</span>
      </div>
      <div className="overflow-hidden flex-1">
        <div className="flex gap-4 md:gap-6 px-3 md:px-4 ticker-anim whitespace-nowrap">
          {displayPrices.map((p, i) => (
            <PriceTick key={`${p.symbol}-${i}`} ticker={p} />
          ))}
          {prices.length === 0 && (
            <span className="font-mono text-[11px] text-txt-tertiary">Loading prices...</span>
          )}
        </div>
      </div>
    </div>
  );
}
