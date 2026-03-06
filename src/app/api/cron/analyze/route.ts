import { NextRequest } from 'next/server';
import { runFullAnalysis } from '@/lib/ai/analyzer';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Cron endpoint: runs the full analysis and returns the result.
// The GitHub Actions cron workflow calls this every 10 min.
// The result is cached at the CDN level on /api/latest via the
// warm step that follows.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    console.log('[Cron /analyze] Running full analysis...');
    const result = await runFullAnalysis();

    return Response.json({
      ok: true,
      trades: result.trades.length,
      predictions: result.predictions.length,
      news: result.news.length,
      hasAI: result.predictions.some(p => p.aiEstimate > 0),
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
