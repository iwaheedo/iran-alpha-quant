import { runFullAnalysis } from '@/lib/ai/analyzer';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// CDN-cached: fresh for 5 min, serves stale while revalidating for 1 min after.
// 1000 users hitting this = 1 serverless invocation, 999 CDN cache hits.
export async function GET() {
  try {
    console.log('[API /latest] Running analysis (CDN cache miss)...');
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
          // Vercel-specific CDN header — not overridden by Next.js
          // Cache for 2 hours (7200s), serve stale for 10 min while revalidating.
          // This keeps Groq usage under 100K TPD free tier (12 calls/day × 8K tokens).
          'Vercel-CDN-Cache-Control': 'max-age=7200, stale-while-revalidate=600',
          'CDN-Cache-Control': 'max-age=7200, stale-while-revalidate=600',
          'Cache-Control': 'public, max-age=0, must-revalidate',
        },
      }
    );
  } catch (err) {
    console.error('[API /latest] Error:', err);

    // Return 200 with empty trades — keeps CDN from caching a hard error.
    // Short TTL (30s) so the next request retries quickly.
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
