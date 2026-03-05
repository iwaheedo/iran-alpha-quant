import { NextRequest } from 'next/server';
import { fetchAllNews } from '@/lib/fetchers';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('[Cron /news] Unauthorized cron request');
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    console.log('[Cron /news] Fetching news...');
    const news = await fetchAllNews(); // saves to DB internally

    console.log(`[Cron /news] Done: ${news.length} news items`);

    return Response.json({
      ok: true,
      count: news.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Cron /news] Error:', err);
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : 'News fetch failed' },
      { status: 500 }
    );
  }
}
