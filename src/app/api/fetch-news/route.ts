import { NextResponse } from 'next/server';
import { fetchAllNews } from '@/lib/fetchers';

export const maxDuration = 30;

// CDN-cached: fresh for 60s, stale-while-revalidate for 30s
export async function GET() {
  try {
    console.log('[API /fetch-news] Fetching news (CDN cache miss)...');
    const news = await fetchAllNews();

    const response = NextResponse.json({
      news,
      count: news.length,
      timestamp: new Date().toISOString(),
    });

    response.headers.set(
      'Cache-Control',
      's-maxage=60, stale-while-revalidate=30'
    );

    return response;
  } catch (err) {
    console.error('[API /fetch-news] Error:', err);
    const errorResponse = NextResponse.json(
      { news: [], error: 'Failed to fetch news' },
      { status: 500 }
    );
    errorResponse.headers.set('Cache-Control', 'no-store');
    return errorResponse;
  }
}
