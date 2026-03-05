'use client';

import type { TradeIdea, Category } from '@/types';
import { CATEGORY_CONFIG } from '@/lib/constants';
import { formatPrice, cn } from '@/lib/utils';
import CausalChain from './CausalChain';
import RiskRewardBar from './RiskRewardBar';
import PlatformBadges from './PlatformBadges';

interface TradeCardProps {
  trade: TradeIdea;
}

function orderTypeStyle(orderType: TradeIdea['orderType']) {
  switch (orderType) {
    case '2ND_ORDER':
      return 'text-blue bg-blue-light';
    case '3RD_ORDER':
      return 'text-purple-600 bg-purple-50';
    case 'CROWDED':
      return 'text-amber bg-amber/10';
    default:
      return 'text-txt-secondary bg-surface-2';
  }
}

function orderTypeLabel(orderType: TradeIdea['orderType']) {
  switch (orderType) {
    case '1ST_ORDER': return '1st Order';
    case '2ND_ORDER': return '2nd Order';
    case '3RD_ORDER': return '3rd Order';
    case 'CROWDED': return 'Crowded';
  }
}

export default function TradeCard({ trade }: TradeCardProps) {
  const isLong = trade.direction === 'LONG';
  const priceUp = trade.priceChange >= 0;

  return (
    <div className="bg-white rounded border border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-5 py-2.5 md:py-3 border-b border-border bg-surface-1/50">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <span className={cn(
              'text-[9px] font-bold text-white px-2 py-0.5 rounded uppercase tracking-wider flex-shrink-0',
              isLong ? 'bg-up' : 'bg-down'
            )}>
              {trade.direction}
            </span>
            <span className="font-mono text-sm font-bold text-txt-primary">
              {trade.ticker}
            </span>
            <span className="text-[11px] text-txt-tertiary hidden md:inline">{trade.fullName}</span>
            <span className="font-mono text-[11px] text-txt-secondary">
              ${formatPrice(trade.currentPrice)}
            </span>
            <span className={cn(
              'font-mono text-[11px] font-medium',
              priceUp ? 'text-up' : 'text-down'
            )}>
              {priceUp ? '+' : ''}{trade.priceChange.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] text-txt-secondary hidden md:inline">Conviction</span>
            <span className="font-mono text-sm font-bold text-txt-primary">
              {trade.conviction}<span className="text-txt-tertiary font-normal">/10</span>
            </span>
          </div>
        </div>

        {/* Tags row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn(
            'text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider',
            orderTypeStyle(trade.orderType)
          )}>
            {orderTypeLabel(trade.orderType)}
          </span>
          {trade.categories.map((cat: Category) => {
            const config = CATEGORY_CONFIG[cat];
            return (
              <span
                key={cat}
                className={`text-[9px] font-medium ${config.colorClass} ${config.bgClass} px-2 py-0.5 rounded-full border`}
              >
                {config.label}
              </span>
            );
          })}
          <span className="text-[10px] text-txt-tertiary font-mono ml-auto">
            {trade.horizonLabel}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 md:p-5">
        {/* Thesis */}
        <p className="text-[12px] leading-relaxed mb-3 md:mb-4 text-txt-primary">
          {trade.thesis}
        </p>

        {/* Causal Chain */}
        <CausalChain steps={trade.causalChain} />

        {/* Priced In / Edge */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
          <div>
            <span className="text-[9px] font-bold text-txt-tertiary uppercase tracking-widest block mb-1.5">
              Priced In
            </span>
            <p className="text-[11px] text-txt-tertiary leading-relaxed">{trade.pricedIn}</p>
          </div>
          <div>
            <span className="text-[9px] font-bold text-up uppercase tracking-widest block mb-1.5">
              The Edge
            </span>
            <p className="text-[11px] text-txt-secondary leading-relaxed">{trade.edge}</p>
          </div>
        </div>

        {/* Risk/Reward */}
        <RiskRewardBar
          upside={trade.riskReward.upside}
          downside={trade.riskReward.downside}
          ratio={trade.riskReward.ratio}
        />

        {/* Entry / Invalidation */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
          <div>
            <span className="text-[9px] font-bold text-up uppercase tracking-widest block mb-1">Entry</span>
            <p className="text-[11px] text-txt-secondary">{trade.entry}</p>
          </div>
          <div>
            <span className="text-[9px] font-bold text-down uppercase tracking-widest block mb-1">Invalidation</span>
            <p className="text-[11px] text-txt-secondary">{trade.invalidation}</p>
          </div>
        </div>

        {/* Breakers */}
        <div className="mb-3 md:mb-4 p-3 bg-down/[0.03] rounded border border-down/10">
          <span className="text-[9px] font-bold text-down uppercase tracking-widest block mb-1.5">
            What Can Break This Trade
          </span>
          <ul className="text-[11px] text-txt-secondary leading-relaxed space-y-1">
            {trade.breakers.map((breaker, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="text-down flex-shrink-0">&#x2022;</span>
                {breaker}
              </li>
            ))}
          </ul>
        </div>

        {/* Platforms */}
        <PlatformBadges platforms={trade.platforms} />
      </div>
    </div>
  );
}
