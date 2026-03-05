'use client';

import { useState, useEffect } from 'react';

interface AnalysisProgressProps {
  isAnalyzing: boolean;
}

const STEPS = [
  'Fetching news...',
  'Fetching prices...',
  'AI analyzing patterns...',
  'Generating trade ideas...',
  'Evaluating Polymarket...',
  'Complete!',
];

export default function AnalysisProgress({ isAnalyzing }: AnalysisProgressProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isAnalyzing) {
      setVisible(true);
      setStepIndex(0);
    } else {
      if (visible) {
        setStepIndex(STEPS.length - 1);
        const timer = setTimeout(() => setVisible(false), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [isAnalyzing, visible]);

  useEffect(() => {
    if (!isAnalyzing || stepIndex >= STEPS.length - 2) return;
    const timer = setTimeout(
      () => setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 2)),
      3000 + Math.random() * 2000
    );
    return () => clearTimeout(timer);
  }, [isAnalyzing, stepIndex]);

  if (!visible) return null;

  const isDone = stepIndex === STEPS.length - 1;
  const progress = isDone ? 100 : ((stepIndex + 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="fixed bottom-16 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50">
      <div className="bg-white border border-border rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          {!isDone ? (
            <span className="w-4 h-4 border-2 border-blue/30 border-t-blue rounded-full animate-spin flex-shrink-0" />
          ) : (
            <span className="w-4 h-4 rounded-full bg-up flex items-center justify-center text-white text-[10px] flex-shrink-0">
              ✓
            </span>
          )}
          <span className="text-[11px] font-medium text-txt-primary">{STEPS[stepIndex]}</span>
        </div>
        <div className="h-1 bg-surface-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
