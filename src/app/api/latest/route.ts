import { runFullAnalysis } from '@/lib/ai/analyzer';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Runs full analysis and returns results.
// CDN-cached for 10 min — GitHub Actions cron hits this every 10 min
// to keep the cache warm, so fresh data is always available.
export async function GET() {
  try {
    console.log('[API /latest] Running analysis...');
    const result = await runFullAnalysis();

    return new Response(
      JSON.stringify({
        trades: result.trades,
        news: result.news,
        prices: result.prices,
        predictions: result.predictions,
        regime: result.regime,
        runId: result.runId,
        generatedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          // CDN cache for 10 min — cron keeps this warm
          'Vercel-CDN-Cache-Control': 'max-age=600, stale-while-revalidate=120',
          'CDN-Cache-Control': 'max-age=600, stale-while-revalidate=120',
          'Cache-Control': 'public, max-age=0, must-revalidate',
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
        error: err instanceof Error ? err.message : 'Analysis failed',
        generatedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Vercel-CDN-Cache-Control': 'max-age=30, stale-while-revalidate=10',
          'CDN-Cache-Control': 'max-age=30, stale-while-revalidate=10',
          'Cache-Control': 'public, max-age=0, must-revalidate',
        },
      }
    );
  }
}
