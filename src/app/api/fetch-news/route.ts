import { fetchAllNews } from '@/lib/fetchers';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// CDN-cached: fresh for 60s, stale-while-revalidate for 30s
export async function GET() {
  try {
    console.log('[API /fetch-news] Fetching news (CDN cache miss)...');
    const news = await fetchAllNews();

    return new Response(
      JSON.stringify({
        news,
        count: news.length,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      }
    );
  } catch (err) {
    console.error('[API /fetch-news] Error:', err);
    return new Response(
      JSON.stringify({ news: [], error: 'Failed to fetch news' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
