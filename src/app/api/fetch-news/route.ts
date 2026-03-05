import { NextResponse } from 'next/server';
import { fetchAllNews } from '@/lib/fetchers';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

async function handleNewsFetch() {
  try {
    console.log('[API /fetch-news] Triggering news fetch...');
    const news = await fetchAllNews();

    return NextResponse.json({
      news,
      count: news.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[API /fetch-news] Error:', err);
    return NextResponse.json(
      { news: [], error: 'Failed to fetch news', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Both GET and POST trigger a live news fetch from RSS
export const GET = handleNewsFetch;
export const POST = handleNewsFetch;
