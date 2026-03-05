import { NextRequest, NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const news = getLatestNews(Math.min(limit, 200), source);

    return NextResponse.json({
      news,
      count: news.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[API /news] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
