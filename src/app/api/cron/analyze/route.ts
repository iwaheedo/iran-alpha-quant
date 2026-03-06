import { NextRequest } from 'next/server';
import { revalidateTag } from 'next/cache';

export const maxDuration = 10;
export const dynamic = 'force-dynamic';

// Cron endpoint: invalidates the analysis cache so the next request
// to /api/latest triggers a fresh analysis run.
// The GitHub Actions cron workflow calls this, then hits /api/latest
// to warm the cache — so users always get instant responses.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('[Cron /analyze] Unauthorized cron request');
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    console.log('[Cron /analyze] Invalidating analysis cache...');
    revalidateTag('analysis');

    return Response.json({
      ok: true,
      revalidated: true,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Cron /analyze] Error:', err);
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : 'Revalidation failed' },
      { status: 500 }
    );
  }
}
