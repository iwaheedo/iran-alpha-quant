'use client';

interface RiskRewardBarProps {
  upside: number;
  downside: number;
  ratio: string;
}

export default function RiskRewardBar({ upside, downside, ratio }: RiskRewardBarProps) {
  const total = upside + downside;
  const upsidePct = total > 0 ? (upside / total) * 100 : 50;
  const downsidePct = 100 - upsidePct;

  return (
    <div className="mb-3 md:mb-4 py-3 px-3 bg-surface-1 rounded border border-border">
      {/* Header row: label + ratio */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-txt-secondary uppercase tracking-wide">Risk / Reward</span>
        <span className="font-mono text-xs font-bold text-txt-primary bg-surface-2 px-2 py-0.5 rounded">{ratio}</span>
      </div>

      {/* Bar */}
      <div className="flex h-2 rounded-full overflow-hidden bg-surface-3 mb-2">
        <div className="bg-up/50 rounded-l-full transition-all" style={{ width: `${upsidePct}%` }} />
        <div className="bg-down/50 rounded-r-full transition-all" style={{ width: `${downsidePct}%` }} />
      </div>

      {/* Labels below bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-up/50" />
          <span className="text-[10px] text-txt-tertiary">Upside</span>
          <span className="font-mono text-[11px] font-semibold text-up">+{upside}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-down/50" />
          <span className="text-[10px] text-txt-tertiary">Downside</span>
          <span className="font-mono text-[11px] font-semibold text-down">{'\u2212'}{downside}%</span>
        </div>
      </div>
    </div>
  );
}
