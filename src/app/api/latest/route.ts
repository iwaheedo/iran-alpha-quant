import {
  getLatestTrades,
  getLatestPredictions,
  getLatestNews,
  getLatestPrices,
  getLatestRegime,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

// Read pre-computed results from DB — cron populates this every 10 min.
// Does NOT run AI analysis on user page refresh.
export async function GET() {
  try {
    const [trades, predictions, news, prices, regime] = await Promise.all([
      Promise.resolve(getLatestTrades()),
      Promise.resolve(getLatestPredictions()),
      Promise.resolve(getLatestNews(100)),
      Promise.resolve(getLatestPrices()),
      Promise.resolve(getLatestRegime()),
    ]);

    return new Response(
      JSON.stringify({
        trades,
        news,
        prices,
        predictions,
        regime: regime || {
          label: 'Escalation Watch',
          level: 'MEDIUM',
          subtitle: 'Monitoring',
          summary: 'Geopolitical tensions being monitored.',
        },
        generatedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
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
          'Cache-Control': 'public, max-age=30, must-revalidate',
        },
      }
    );
  }
}
