import { NextResponse } from 'next/server';
import { getLatestPredictions } from '@/lib/db';

export async function GET() {
  try {
    const predictions = getLatestPredictions();

    return NextResponse.json({
      predictions,
      count: predictions.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[API /polymarket] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch predictions' },
      { status: 500 }
    );
  }
}
