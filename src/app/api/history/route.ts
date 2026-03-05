import { NextResponse } from 'next/server';
import { getAnalysisHistory } from '@/lib/db';

export async function GET() {
  try {
    const runs = getAnalysisHistory(50);

    return NextResponse.json({
      runs,
      count: runs.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[API /history] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
