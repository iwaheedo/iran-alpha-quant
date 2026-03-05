import { NextResponse } from 'next/server';
import { runFullAnalysis } from '@/lib/ai/analyzer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST() {
  try {
    console.log('[API /analyze] Starting full analysis...');
    const result = await runFullAnalysis();

    return NextResponse.json({
      success: true,
      regime: result.regime,
      trades: result.trades,
      predictions: result.predictions,
      runId: result.runId,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[API /analyze] Error:', err);
    return NextResponse.json(
      {
        error: 'Analysis failed',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
