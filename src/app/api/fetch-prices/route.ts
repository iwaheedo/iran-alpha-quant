import { NextResponse } from 'next/server';
import { fetchAllPrices } from '@/lib/fetchers';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

async function handlePriceFetch() {
  try {
    console.log('[API /fetch-prices] Triggering price fetch...');
    const prices = await fetchAllPrices();

    return NextResponse.json({
      prices,
      count: prices.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[API /fetch-prices] Error:', err);
    return NextResponse.json(
      { prices: [], error: 'Failed to fetch prices', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Both GET and POST trigger a live price fetch from Finnhub
export const GET = handlePriceFetch;
export const POST = handlePriceFetch;
