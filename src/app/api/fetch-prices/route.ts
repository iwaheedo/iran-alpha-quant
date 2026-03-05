import { NextResponse } from 'next/server';
import { fetchAllPrices } from '@/lib/fetchers';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST() {
  try {
    console.log('[API /fetch-prices] Triggering price fetch...');
    const prices = await fetchAllPrices();

    return NextResponse.json({
      success: true,
      count: prices.length,
      prices,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[API /fetch-prices] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch prices', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
