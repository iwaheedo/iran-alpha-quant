import Database from 'better-sqlite3';
import path from 'path';
import type { NewsItem, TradeIdea, PolymarketPrediction, TickerPrice, AnalysisRun, MacroRegime } from '@/types';

// Use /tmp on Vercel (serverless), project root locally
const DB_PATH = process.env.VERCEL
  ? path.join('/tmp', 'iran-alpha-quant.db')
  : path.join(process.cwd(), 'iran-alpha-quant.db');

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initializeSchema(_db);
  }
  return _db;
}

function initializeSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS news_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      source TEXT NOT NULL,
      source_type TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'NORMAL',
      timestamp TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      engagement TEXT,
      url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS analysis_runs (
      id TEXT PRIMARY KEY,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      status TEXT NOT NULL DEFAULT 'RUNNING',
      news_count INTEGER NOT NULL DEFAULT 0,
      trades_generated INTEGER NOT NULL DEFAULT 0,
      regime_data TEXT,
      error TEXT
    );

    CREATE TABLE IF NOT EXISTS trade_ideas (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      analysis_run_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (analysis_run_id) REFERENCES analysis_runs(id)
    );

    CREATE TABLE IF NOT EXISTS polymarket_predictions (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      analysis_run_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (analysis_run_id) REFERENCES analysis_runs(id)
    );

    CREATE TABLE IF NOT EXISTS ticker_prices (
      symbol TEXT PRIMARY KEY,
      price REAL NOT NULL,
      change_percent REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_news_timestamp ON news_items(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_news_source_type ON news_items(source_type);
    CREATE INDEX IF NOT EXISTS idx_trades_created ON trade_ideas(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_runs_started ON analysis_runs(started_at DESC);
  `);
}

// ===== News =====

export function saveNewsItems(items: NewsItem[]): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO news_items (id, title, source, source_type, priority, timestamp, tags, engagement, url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const tx = db.transaction(() => {
    for (const item of items) {
      stmt.run(
        item.id,
        item.title,
        item.source,
        item.sourceType,
        item.priority,
        item.timestamp,
        JSON.stringify(item.tags),
        item.engagement ? JSON.stringify(item.engagement) : null,
        item.url || null
      );
    }
  });
  tx();
}

export function getLatestNews(limit = 50, sourceType?: string): NewsItem[] {
  const db = getDb();
  let query = 'SELECT * FROM news_items';
  const params: unknown[] = [];

  if (sourceType && sourceType !== 'all') {
    query += ' WHERE source_type = ?';
    params.push(sourceType === 'news' ? 'GOOGLE_NEWS' : 'TWITTER');
  }

  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(limit);

  const rows = db.prepare(query).all(...params) as Record<string, unknown>[];
  return rows.map(rowToNewsItem);
}

function rowToNewsItem(row: Record<string, unknown>): NewsItem {
  return {
    id: row.id as string,
    title: row.title as string,
    source: row.source as string,
    sourceType: row.source_type as NewsItem['sourceType'],
    priority: row.priority as NewsItem['priority'],
    timestamp: row.timestamp as string,
    relativeTime: getRelativeTime(row.timestamp as string),
    tags: JSON.parse((row.tags as string) || '[]'),
    engagement: row.engagement ? JSON.parse(row.engagement as string) : undefined,
    url: row.url as string | undefined,
  };
}

// ===== Trades =====

export function saveTradeIdeas(trades: TradeIdea[], runId: string): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO trade_ideas (id, data, analysis_run_id)
    VALUES (?, ?, ?)
  `);
  const tx = db.transaction(() => {
    for (const trade of trades) {
      stmt.run(trade.id, JSON.stringify(trade), runId);
    }
  });
  tx();
}

export function getLatestTrades(): TradeIdea[] {
  const db = getDb();
  const latestRun = db.prepare(
    "SELECT id FROM analysis_runs WHERE status = 'COMPLETED' ORDER BY completed_at DESC LIMIT 1"
  ).get() as { id: string } | undefined;

  if (!latestRun) return [];

  const rows = db.prepare(
    'SELECT data FROM trade_ideas WHERE analysis_run_id = ? ORDER BY created_at ASC'
  ).all(latestRun.id) as { data: string }[];

  return rows.map(r => JSON.parse(r.data) as TradeIdea);
}

// ===== Polymarket =====

export function savePredictions(predictions: PolymarketPrediction[], runId: string): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO polymarket_predictions (id, data, analysis_run_id)
    VALUES (?, ?, ?)
  `);
  const tx = db.transaction(() => {
    for (const pred of predictions) {
      stmt.run(pred.id, JSON.stringify(pred), runId);
    }
  });
  tx();
}

export function getLatestPredictions(): PolymarketPrediction[] {
  const db = getDb();
  const latestRun = db.prepare(
    "SELECT id FROM analysis_runs WHERE status = 'COMPLETED' ORDER BY completed_at DESC LIMIT 1"
  ).get() as { id: string } | undefined;

  if (!latestRun) return [];

  const rows = db.prepare(
    'SELECT data FROM polymarket_predictions WHERE analysis_run_id = ? ORDER BY created_at ASC'
  ).all(latestRun.id) as { data: string }[];

  return rows.map(r => JSON.parse(r.data) as PolymarketPrediction);
}

// ===== Prices =====

export function savePrices(prices: TickerPrice[]): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO ticker_prices (symbol, price, change_percent, updated_at)
    VALUES (?, ?, ?, datetime('now'))
  `);
  const tx = db.transaction(() => {
    for (const p of prices) {
      stmt.run(p.symbol, p.price, p.changePercent);
    }
  });
  tx();
}

export function getLatestPrices(): TickerPrice[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM ticker_prices').all() as Record<string, unknown>[];
  return rows.map(r => ({
    symbol: r.symbol as string,
    price: r.price as number,
    changePercent: r.change_percent as number,
  }));
}

// ===== Analysis Runs =====

export function createAnalysisRun(id: string): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO analysis_runs (id, started_at, status) VALUES (?, datetime('now'), 'RUNNING')
  `).run(id);
}

export function completeAnalysisRun(id: string, newsCount: number, tradesGenerated: number, regime: MacroRegime): void {
  const db = getDb();
  db.prepare(`
    UPDATE analysis_runs SET completed_at = datetime('now'), status = 'COMPLETED',
    news_count = ?, trades_generated = ?, regime_data = ? WHERE id = ?
  `).run(newsCount, tradesGenerated, JSON.stringify(regime), id);
}

export function failAnalysisRun(id: string, error: string): void {
  const db = getDb();
  db.prepare(`
    UPDATE analysis_runs SET completed_at = datetime('now'), status = 'FAILED', error = ? WHERE id = ?
  `).run(error, id);
}

export function getLatestRegime(): MacroRegime | null {
  const db = getDb();
  const row = db.prepare(
    "SELECT regime_data FROM analysis_runs WHERE status = 'COMPLETED' AND regime_data IS NOT NULL ORDER BY completed_at DESC LIMIT 1"
  ).get() as { regime_data: string } | undefined;

  return row ? JSON.parse(row.regime_data) as MacroRegime : null;
}

export function getAnalysisHistory(limit = 20): AnalysisRun[] {
  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM analysis_runs ORDER BY started_at DESC LIMIT ?'
  ).all(limit) as Record<string, unknown>[];

  return rows.map(r => ({
    id: r.id as string,
    startedAt: r.started_at as string,
    completedAt: r.completed_at as string | undefined,
    status: r.status as AnalysisRun['status'],
    newsCount: r.news_count as number,
    tradesGenerated: r.trades_generated as number,
    error: r.error as string | undefined,
  }));
}

// ===== Helpers =====

function getRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

export function isDbHealthy(): boolean {
  try {
    const db = getDb();
    db.prepare('SELECT 1').get();
    return true;
  } catch {
    return false;
  }
}
