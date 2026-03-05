import { NextResponse } from 'next/server';
import { getLatestRegime } from '@/lib/db';

export async function GET() {
  try {
    const regime = getLatestRegime();

    return NextResponse.json({
      regime: regime || {
        label: 'No Analysis',
        level: 'LOW',
        subtitle: 'Run analysis first',
        summary: 'No analysis has been run yet. Click "Run Analysis" to generate trade ideas.',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[API /regime] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch regime' },
      { status: 500 }
    );
  }
}
