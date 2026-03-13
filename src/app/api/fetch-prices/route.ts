import { fetchAllPrices } from '@/lib/fetchers';
import { updatePositionPrices, savePrices } from '@/lib/db';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// CDN-cached: fresh for 60s, stale-while-revalidate for 30s
export async function GET() {
  try {
    console.log('[API /fetch-prices] Fetching prices (CDN cache miss)...');
    const prices = await fetchAllPrices();

    // Update portfolio position prices with latest data
    try {
      if (prices.length > 0) {
        savePrices(prices);
        updatePositionPrices(prices);
      }
    } catch (err) {
      console.error('[API /fetch-prices] Position price update failed:', err instanceof Error ? err.message : err);
    }

    return new Response(
      JSON.stringify({
        prices,
        count: prices.length,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      }
    );
  } catch (err) {
    console.error('[API /fetch-prices] Error:', err);
    return new Response(
      JSON.stringify({ prices: [], error: 'Failed to fetch prices' }),
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
