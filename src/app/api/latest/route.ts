import { runFullAnalysis } from '@/lib/ai/analyzer';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[API /latest] Running analysis...');
    const result = await runFullAnalysis();

    const data = {
      trades: result.trades,
      news: result.news,
      prices: result.prices,
      predictions: result.predictions,
      regime: result.regime,
      runId: result.runId,
      generatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // CDN caches for 5 min, serves stale for another 5 min while revalidating
        'Vercel-CDN-Cache-Control': 'max-age=300, stale-while-revalidate=300',
        'CDN-Cache-Control': 'max-age=300, stale-while-revalidate=300',
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
    });
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
          // Don't cache errors for long
          'Cache-Control': 'public, max-age=30, must-revalidate',
        },
      }
    );
  }
}
