import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeSpecificNews } from '@/lib/ai/analyzer';
import { requireAuth } from '@/lib/auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const AnalyzeNewsSchema = z.object({
  newsId: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { allowed, resetAt } = checkRateLimit(`analyze-news:${ip}`, 10, 60_000);
  if (!allowed) return rateLimitResponse(resetAt);

  try {
    const body = await request.json();
    const parsed = AnalyzeNewsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { newsId } = parsed.data;

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
