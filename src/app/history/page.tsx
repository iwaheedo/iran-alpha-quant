import HistoryPanel from '@/components/HistoryPanel';

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-surface-1">
      <header className="px-4 md:px-6 py-3 border-b border-border bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/" className="text-sm font-bold text-txt-primary tracking-tight uppercase hover:text-blue transition-colors" style={{ fontFamily: 'var(--font-rajdhani), system-ui, sans-serif' }}>
            War Alpha Quant
          </a>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs text-txt-secondary">Analysis History</span>
        </div>
        <a
          href="/"
          className="h-7 px-4 bg-blue text-white text-xs font-medium rounded hover:bg-blue/90 transition-colors flex items-center"
        >
          ← Dashboard
        </a>
      </header>
      <HistoryPanel />
    </div>
  );
}
