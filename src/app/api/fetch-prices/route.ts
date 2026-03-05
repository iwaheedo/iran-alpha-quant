import { fetchAllPrices } from '@/lib/fetchers';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// CDN-cached: fresh for 60s, stale-while-revalidate for 30s
export async function GET() {
  try {
    console.log('[API /fetch-prices] Fetching prices (CDN cache miss)...');
    const prices = await fetchAllPrices();

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
          'Vercel-CDN-Cache-Control': 'max-age=60, stale-while-revalidate=30',
          'CDN-Cache-Control': 'max-age=60, stale-while-revalidate=30',
          'Cache-Control': 'public, max-age=0, must-revalidate',
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
