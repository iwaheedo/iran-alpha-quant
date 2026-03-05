import { NextResponse } from 'next/server';
import { runFullAnalysis } from '@/lib/ai/analyzer';

export const maxDuration = 60;

// CDN-cached: fresh for 5 min, serves stale while revalidating for 1 min after.
// 1000 users hitting this = 1 serverless invocation, 999 CDN cache hits.
export async function GET() {
  try {
    console.log('[API /latest] Running analysis (CDN cache miss)...');
    const result = await runFullAnalysis();

    const response = NextResponse.json({
      trades: result.trades,
      news: result.news,
      prices: result.prices,
      predictions: result.predictions,
      regime: result.regime,
      runId: result.runId,
      generatedAt: new Date().toISOString(),
    });

    // Cache on Vercel CDN for 5 minutes, serve stale for 1 min while revalidating
    response.headers.set(
      'Cache-Control',
      's-maxage=300, stale-while-revalidate=60'
    );

    return response;
  } catch (err) {
    console.error('[API /latest] Error:', err);

    // Don't cache errors — let next request retry
    const errorResponse = NextResponse.json(
      {
        error: 'Analysis failed',
        details: err instanceof Error ? err.message : 'Unknown error',
        trades: [],
        news: [],
        prices: [],
        predictions: [],
        regime: null,
      },
      { status: 500 }
    );
    errorResponse.headers.set('Cache-Control', 'no-store');
    return errorResponse;
  }
}
