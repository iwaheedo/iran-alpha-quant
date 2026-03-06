import { unstable_cache } from 'next/cache';
import { runFullAnalysis } from '@/lib/ai/analyzer';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Analysis results cached in Next.js Data Cache for 10 minutes.
// This cache persists across serverless invocations on Vercel.
// Flow:
//   1. GitHub Actions cron hits /api/cron/analyze every 10 min
//      → invalidates cache via revalidateTag('analysis')
//   2. Cron then hits /api/latest to warm the cache
//      → getCachedAnalysis() runs fresh analysis, caches result
//   3. Users hit /api/latest → instant response from Data Cache
//   4. stale-while-revalidate ensures users NEVER wait for analysis
const getCachedAnalysis = unstable_cache(
  async () => {
    console.log('[API /latest] Running analysis (cache miss)...');
    const result = await runFullAnalysis();
    return {
      trades: result.trades,
      news: result.news,
      prices: result.prices,
      predictions: result.predictions,
      regime: result.regime,
      runId: result.runId,
      generatedAt: new Date().toISOString(),
    };
  },
  ['full-analysis'],
  { revalidate: 600, tags: ['analysis'] }
);

export async function GET() {
  try {
    const data = await getCachedAnalysis();

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          // CDN cache: 60s fresh + 540s stale-while-revalidate = 10 min total
          'Vercel-CDN-Cache-Control': 'max-age=60, stale-while-revalidate=540',
          'CDN-Cache-Control': 'max-age=60, stale-while-revalidate=540',
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
          'Cache-Control': 'public, max-age=0, must-revalidate',
        },
      }
    );
  }
}
