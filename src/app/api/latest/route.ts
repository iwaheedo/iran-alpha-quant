import { NextResponse } from 'next/server';
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
          'Vercel-CDN-Cache-Control': 'max-age=300, stale-while-revalidate=60',
          'CDN-Cache-Control': 'max-age=300, stale-while-revalidate=60',
          'Cache-Control': 'public, max-age=0, must-revalidate',
        },
      }
    );
  } catch (err) {
    console.error('[API /latest] Error:', err);

    return new Response(
      JSON.stringify({
        error: 'Analysis failed',
        details: err instanceof Error ? err.message : 'Unknown error',
        trades: [],
        news: [],
        prices: [],
        predictions: [],
        regime: null,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
