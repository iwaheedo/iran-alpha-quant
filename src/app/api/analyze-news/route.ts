import { NextRequest, NextResponse } from 'next/server';
import { analyzeSpecificNews } from '@/lib/ai/analyzer';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { newsId } = body;

    if (!newsId || typeof newsId !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: newsId' },
        { status: 400 }
      );
    }

    console.log(`[API /analyze-news] Analyzing news item: ${newsId}`);
    const trades = await analyzeSpecificNews(newsId);

    return NextResponse.json({
      success: true,
      trades,
      count: trades.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[API /analyze-news] Error:', err);
    return NextResponse.json(
      {
        error: 'News analysis failed',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
