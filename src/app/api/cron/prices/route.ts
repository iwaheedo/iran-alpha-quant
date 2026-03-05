import { NextRequest } from 'next/server';
import { fetchAllPrices } from '@/lib/fetchers';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('[Cron /prices] Unauthorized cron request');
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    console.log('[Cron /prices] Fetching prices...');
    const prices = await fetchAllPrices(); // saves to DB internally

    console.log(`[Cron /prices] Done: ${prices.length} prices`);

    return Response.json({
      ok: true,
      count: prices.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Cron /prices] Error:', err);
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : 'Prices fetch failed' },
      { status: 500 }
    );
  }
}
