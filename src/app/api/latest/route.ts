import {
  getLatestTrades,
  getLatestNews,
  getLatestPrices,
  getLatestPredictions,
  getLatestRegime,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

// Read-only endpoint — serves latest data from DB.
// Data is populated by server-side cron jobs:
//   /api/cron/analyze  — every 10 min (AI trade ideas)
//   /api/cron/news     — every 1 min
//   /api/cron/prices   — every 1 min
export async function GET() {
  try {
    const trades = getLatestTrades();
    const news = getLatestNews(50);
    const prices = getLatestPrices();
    const predictions = getLatestPredictions();
    const regime = getLatestRegime();

    return Response.json({
      trades,
      news,
      prices,
      predictions,
      regime,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[API /latest] Error:', err);
    return Response.json(
      {
        trades: [],
        news: [],
        prices: [],
        predictions: [],
        regime: null,
        error: err instanceof Error ? err.message : 'Failed to load data',
        generatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
