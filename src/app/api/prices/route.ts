import { NextResponse } from 'next/server';
import { getLatestPrices } from '@/lib/db';

export async function GET() {
  try {
    const prices = getLatestPrices();

    return NextResponse.json({
      prices,
      count: prices.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[API /prices] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    );
  }
}
