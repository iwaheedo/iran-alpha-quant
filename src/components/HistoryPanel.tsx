'use client';

import useSWR from 'swr';
import type { AnalysisRun } from '@/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: AnalysisRun['status'] }) {
  const styles = {
    RUNNING: 'bg-blue/10 text-blue',
    COMPLETED: 'bg-up/10 text-up',
    FAILED: 'bg-down/10 text-down',
  };

  return (
    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${styles[status]}`}>
      {status}
    </span>
  );
}

export default function HistoryPanel() {
  const { data, isLoading } = useSWR<{ runs: AnalysisRun[] }>('/api/history', fetcher);
  const runs = data?.runs || [];

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded border border-border p-4 animate-pulse">
            <div className="h-3 bg-surface-2 rounded w-32 mb-2" />
            <div className="h-2 bg-surface-2 rounded w-48" />
          </div>
        ))}
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-txt-tertiary mb-1">No analysis history</p>
        <p className="text-[10px] text-txt-tertiary">Run your first analysis from the dashboard</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-2">
      {runs.map((run) => (
        <div key={run.id} className="bg-white rounded border border-border p-3 md:p-4 row-hover">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <StatusBadge status={run.status} />
              <span className="text-[11px] font-mono text-txt-secondary">
                {formatDate(run.startedAt)}
              </span>
            </div>
            <span className="text-[10px] text-txt-tertiary font-mono">{run.id.slice(0, 12)}...</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-txt-tertiary">
            <span>{run.newsCount} news items</span>
            <span>{run.tradesGenerated} trades generated</span>
            {run.completedAt && (
              <span>
                Duration:{' '}
                {Math.round(
                  (new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000
                )}s
              </span>
            )}
            {run.error && <span className="text-down">{run.error}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
