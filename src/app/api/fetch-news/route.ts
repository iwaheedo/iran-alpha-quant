import { NextResponse } from 'next/server';
import { fetchAllNews } from '@/lib/fetchers';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST() {
  try {
    console.log('[API /fetch-news] Triggering news fetch...');
    const news = await fetchAllNews();

    return NextResponse.json({
      success: true,
      count: news.length,
      sources: {
        googleNews: news.filter(n => n.sourceType === 'GOOGLE_NEWS').length,
        twitter: news.filter(n => n.sourceType === 'TWITTER').length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[API /fetch-news] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch news', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
