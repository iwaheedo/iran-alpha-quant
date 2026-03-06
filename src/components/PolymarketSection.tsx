'use client';

import type { PolymarketPrediction } from '@/types';

interface PolymarketSectionProps {
  predictions: PolymarketPrediction[];
}

export default function PolymarketSection({ predictions }: PolymarketSectionProps) {
  if (predictions.length === 0) {
    return (
      <div id="poly" className="pt-3 md:pt-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-bold text-txt-primary uppercase tracking-wide">
            Polymarket — Mispriced Predictions
          </span>
        </div>
        <div className="bg-white rounded border border-border p-6 text-center">
          <p className="text-xs text-txt-tertiary">No prediction markets available yet. Run analysis to fetch data.</p>
        </div>
      </div>
    );
  }

  return (
    <div id="poly" className="pt-3 md:pt-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs font-bold text-txt-primary uppercase tracking-wide">
          Polymarket — Mispriced Predictions
        </span>
      </div>

      {/* Desktop table */}
      <div className="bg-white rounded border border-border overflow-hidden hidden md:block">
        {/* Header */}
        <div className="grid grid-cols-12 gap-0 px-5 py-2 bg-surface-1 border-b border-border text-[9px] font-bold text-txt-tertiary uppercase tracking-widest">
          <div className="col-span-5">Market</div>
          <div className="col-span-1 text-center">Direction</div>
          <div className="col-span-1 text-center">Market</div>
          <div className="col-span-1 text-center">AI Est.</div>
          <div className="col-span-1 text-center">Edge</div>
          <div className="col-span-1 text-center">Conv.</div>
          <div className="col-span-2 text-center">Resolves</div>
        </div>

        {/* Rows */}
        {predictions.map((pred, i) => {
          const isYes = pred.direction === 'YES';
          const edgePositive = pred.edge > 0;
          const isLast = i === predictions.length - 1;

          const content = (
            <>
              <div className="col-span-5">
                <p className="text-[12px] text-txt-primary leading-snug">{pred.question}</p>
                {pred.reasoning && (
                  <p className="text-[10px] text-txt-tertiary leading-snug mt-1">{pred.reasoning}</p>
                )}
              </div>
              <div className="col-span-1 text-center">
                <span className={`text-[9px] font-bold text-white px-1.5 py-0.5 rounded uppercase ${
                  isYes ? 'bg-up' : 'bg-down'
                }`}>
                  {pred.direction}
                </span>
              </div>
              <div className="col-span-1 text-center font-mono text-[12px] text-txt-tertiary">
                {pred.marketPrice}%
              </div>
              <div className={`col-span-1 text-center font-mono text-[12px] font-medium ${
                pred.aiEstimate > pred.marketPrice ? 'text-up' : 'text-down'
              }`}>
                {pred.aiEstimate}%
              </div>
              <div className={`col-span-1 text-center font-mono text-[12px] font-bold ${
                edgePositive ? 'text-up' : 'text-down'
              }`}>
                {edgePositive ? '+' : ''}{pred.edge}%
              </div>
              <div className="col-span-1 text-center font-mono text-[12px] text-txt-primary font-medium">
                {pred.conviction}/10
              </div>
              <div className="col-span-2 text-center text-[11px] text-txt-tertiary">
                {pred.resolvesIn}
              </div>
            </>
          );

          const rowClass = `grid grid-cols-12 gap-0 px-5 py-3 items-center ${
            !isLast ? 'border-b border-border' : ''
          }`;

          if (pred.url) {
            return (
              <a
                key={pred.id}
                href={pred.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${rowClass} cursor-pointer hover:bg-surface-1 transition-colors no-underline`}
              >
                {content}
              </a>
            );
          }

          return (
            <div key={pred.id} className={rowClass}>
              {content}
            </div>
          );
        })}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {predictions.map((pred) => {
          const isYes = pred.direction === 'YES';
          const edgePositive = pred.edge > 0;

          const content = (
            <>
              <p className="text-[12px] text-txt-primary leading-snug mb-1">{pred.question}</p>
              {pred.reasoning && (
                <p className="text-[10px] text-txt-tertiary leading-snug mb-2">{pred.reasoning}</p>
              )}
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-bold text-white px-1.5 py-0.5 rounded uppercase ${
                  isYes ? 'bg-up' : 'bg-down'
                }`}>
                  Buy {pred.direction}
                </span>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-[8px] text-txt-tertiary uppercase">Market</div>
                    <div className="font-mono text-[12px] text-txt-tertiary">{pred.marketPrice}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[8px] text-txt-tertiary uppercase">AI Est.</div>
                    <div className={`font-mono text-[12px] font-medium ${
                      pred.aiEstimate > pred.marketPrice ? 'text-up' : 'text-down'
                    }`}>
                      {pred.aiEstimate}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[8px] text-txt-tertiary uppercase">Edge</div>
                    <div className={`font-mono text-[12px] font-bold ${
                      edgePositive ? 'text-up' : 'text-down'
                    }`}>
                      {edgePositive ? '+' : ''}{pred.edge}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[8px] text-txt-tertiary uppercase">Conv.</div>
                    <div className="font-mono text-[12px] text-txt-primary font-medium">
                      {pred.conviction}/10
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-txt-tertiary mt-1.5">Resolves in {pred.resolvesIn}</div>
            </>
          );

          if (pred.url) {
            return (
              <a
                key={pred.id}
                href={pred.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded border border-border p-3 block cursor-pointer hover:bg-surface-1 transition-colors no-underline"
              >
                {content}
              </a>
            );
          }

          return (
            <div key={pred.id} className="bg-white rounded border border-border p-3">
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
