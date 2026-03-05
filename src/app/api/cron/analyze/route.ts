import { NextRequest } from 'next/server';
import { runFullAnalysis } from '@/lib/ai/analyzer';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('[Cron /analyze] Unauthorized cron request');
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    console.log('[Cron /analyze] Running scheduled analysis...');
    const result = await runFullAnalysis();

    console.log(`[Cron /analyze] Complete: ${result.trades.length} trades, ${result.news.length} news, ${result.prices.length} prices`);

    return Response.json({
      ok: true,
      trades: result.trades.length,
      news: result.news.length,
      prices: result.prices.length,
      predictions: result.predictions.length,
      runId: result.runId,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Cron /analyze] Error:', err);
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
