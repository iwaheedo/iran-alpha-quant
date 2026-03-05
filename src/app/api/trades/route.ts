import { NextResponse } from 'next/server';
import { getLatestTrades } from '@/lib/db';

export async function GET() {
  try {
    const trades = getLatestTrades();

    return NextResponse.json({
      trades,
      count: trades.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[API /trades] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    );
  }
}
