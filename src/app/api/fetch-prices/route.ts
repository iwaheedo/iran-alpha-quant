import { NextResponse } from 'next/server';
import { fetchAllPrices } from '@/lib/fetchers';

export const maxDuration = 30;

// CDN-cached: fresh for 60s, stale-while-revalidate for 30s
export async function GET() {
  try {
    console.log('[API /fetch-prices] Fetching prices (CDN cache miss)...');
    const prices = await fetchAllPrices();

    const response = NextResponse.json({
      prices,
      count: prices.length,
      timestamp: new Date().toISOString(),
    });

    response.headers.set(
      'Cache-Control',
      's-maxage=60, stale-while-revalidate=30'
    );

    return response;
  } catch (err) {
    console.error('[API /fetch-prices] Error:', err);
    const errorResponse = NextResponse.json(
      { prices: [], error: 'Failed to fetch prices' },
      { status: 500 }
    );
    errorResponse.headers.set('Cache-Control', 'no-store');
    return errorResponse;
  }
}
