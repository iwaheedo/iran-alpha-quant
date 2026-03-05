import { NextRequest, NextResponse } from 'next/server';
import { runFullAnalysis } from '@/lib/ai/analyzer';
import { requireAuth } from '@/lib/auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { allowed, resetAt } = checkRateLimit(`analyze:${ip}`, 3, 60_000);
  if (!allowed) return rateLimitResponse(resetAt);

  try {
    console.log('[API /analyze] Starting full analysis...');
    const result = await runFullAnalysis();

    return NextResponse.json({
      success: true,
      regime: result.regime,
      trades: result.trades,
      predictions: result.predictions,
      news: result.news,
      prices: result.prices,
      runId: result.runId,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[API /analyze] Error:', err);
    return NextResponse.json(
      {
        error: 'Analysis failed',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
