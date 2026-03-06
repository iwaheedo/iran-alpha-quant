import {
  getLatestTrades,
  getLatestPredictions,
  getLatestNews,
  getLatestPrices,
  getLatestRegime,
} from '@/lib/db';
import { runFullAnalysis } from '@/lib/ai/analyzer';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const DEFAULT_REGIME = {
  label: 'Escalation Watch',
  level: 'MEDIUM',
  subtitle: 'Monitoring',
  summary: 'Geopolitical tensions being monitored.',
};

// Combined endpoint: serves data to users AND runs analysis for cron.
//
// Cron flow (every 10 min via GitHub Actions):
//   curl -H "X-Cron-Secret: $SECRET" -H "Cache-Control: no-cache" /api/latest
//   → CDN bypasses cache → origin runs full analysis → returns data
//   → CDN caches the response for 10 min (s-maxage=600)
//
// User flow:
//   fetch('/api/latest')
//   → CDN serves cached response (HIT) — no serverless invocation needed
//   → If cache miss: falls back to reading from SQLite (may be empty on cold start)
export async function GET(request: Request) {
  const cronSecret = request.headers.get('x-cron-secret');
  const isCron = cronSecret === process.env.CRON_SECRET;

  try {
    let trades, news, prices, predictions, regime;

    if (isCron) {
      // Cron: run full analysis (fetch fresh data from APIs, AI analysis, save to DB)
      console.log('[API /latest] Cron-triggered: running full analysis...');
      const result = await runFullAnalysis();
      trades = result.trades;
      news = result.news;
      prices = result.prices;
      predictions = result.predictions;
      regime = result.regime;
      console.log(`[API /latest] Analysis complete: ${trades.length} trades, ${news.length} news, ${predictions.length} predictions`);
    } else {
      // User: read pre-computed results from DB (populated by cron on same instance)
      [trades, predictions, news, prices, regime] = await Promise.all([
        Promise.resolve(getLatestTrades()),
        Promise.resolve(getLatestPredictions()),
        Promise.resolve(getLatestNews(100)),
        Promise.resolve(getLatestPrices()),
        Promise.resolve(getLatestRegime()),
      ]);
    }

    const hasData = (news?.length || 0) > 0 || (trades?.length || 0) > 0;

    // Cache for 10 min when we have data (matches cron interval).
    // stale-while-revalidate=120 gives 2 min buffer so users always see data.
    // Short cache when empty so the next cron can populate quickly.
    const cacheControl = hasData
      ? 'public, s-maxage=600, stale-while-revalidate=120'
      : 'public, s-maxage=10, stale-while-revalidate=10';

    return new Response(
      JSON.stringify({
        trades: trades || [],
        news: news || [],
        prices: prices || [],
        predictions: predictions || [],
        regime: regime || DEFAULT_REGIME,
        generatedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': cacheControl,
        },
      }
    );
  } catch (err) {
    console.error('[API /latest] Error:', err);

    return new Response(
      JSON.stringify({
        trades: [],
        news: [],
        prices: [],
        predictions: [],
        regime: null,
        error: err instanceof Error ? err.message : 'Failed to read data',
        generatedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=10',
        },
      }
    );
  }
}
