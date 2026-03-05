'use client';

import type { CausalStep } from '@/types';

interface CausalChainProps {
  steps: CausalStep[];
}

function sentimentColor(sentiment: CausalStep['sentiment']) {
  switch (sentiment) {
    case 'negative': return { text: 'text-down', bg: 'bg-down/[0.06]', border: 'border-down/10' };
    case 'positive': return { text: 'text-up', bg: 'bg-up/[0.06]', border: 'border-up/10' };
    default: return { text: 'text-amber', bg: 'bg-amber/[0.06]', border: 'border-amber/10' };
  }
}

export default function CausalChain({ steps }: CausalChainProps) {
  return (
    <div className="mb-3 md:mb-4">
      <span className="text-[9px] font-bold text-txt-tertiary uppercase tracking-widest block mb-2">
        Transmission
      </span>
      <div className="flex items-center gap-1.5 causal-chain-row">
        {steps.map((step, i) => {
          const colors = sentimentColor(step.sentiment);
          return (
            <span key={i} className="contents">
              <span
                className={`text-[10px] font-medium ${colors.text} ${colors.bg} px-2 md:px-2.5 py-1 rounded border ${colors.border}`}
              >
                {step.label}
              </span>
              {i < steps.length - 1 && (
                <span className="text-txt-tertiary text-[10px]">→</span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
