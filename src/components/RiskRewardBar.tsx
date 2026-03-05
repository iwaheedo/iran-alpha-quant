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
    <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4 py-2.5 px-3 bg-surface-1 rounded border border-border">
      <span className="text-[9px] font-bold text-txt-tertiary uppercase tracking-widest">R / R</span>
      <div className="flex-1 flex h-1.5 rounded-full overflow-hidden bg-surface-3">
        <div className="bg-up/40 rounded-l-full" style={{ width: `${upsidePct}%` }} />
        <div className="bg-down/40 rounded-r-full" style={{ width: `${downsidePct}%` }} />
      </div>
      <span className="font-mono text-[11px] text-up">+{upside}%</span>
      <span className="text-[10px] text-txt-tertiary">/</span>
      <span className="font-mono text-[11px] text-down">{'\u2212'}{downside}%</span>
      <span className="font-mono text-xs font-bold text-txt-primary">{ratio}</span>
    </div>
  );
}
