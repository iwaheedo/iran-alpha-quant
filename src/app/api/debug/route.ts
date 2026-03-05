import { geminiGenerate, isGeminiConfigured } from '@/lib/ai/gemini-client';
import { groqGenerate, isGroqConfigured } from '@/lib/ai/groq-client';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, unknown> = {
    geminiConfigured: isGeminiConfigured(),
    groqConfigured: isGroqConfigured(),
    geminiKeyPrefix: process.env.GEMINI_API_KEY?.substring(0, 10) || 'NOT_SET',
    groqKeyPrefix: process.env.GROQ_API_KEY?.substring(0, 10) || 'NOT_SET',
  };

  // Test Gemini
  try {
    const start = Date.now();
    const result = await geminiGenerate(
      'Return JSON only.',
      'Return: {"test": "hello", "model": "gemini"}'
    );
    results.gemini = {
      status: 'OK',
      elapsed: `${((Date.now() - start) / 1000).toFixed(1)}s`,
      response: result.substring(0, 200),
    };
  } catch (err) {
    results.gemini = {
      status: 'FAILED',
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack?.substring(0, 500) : undefined,
    };
  }

  // Test Groq
  try {
    const start = Date.now();
    const result = await groqGenerate(
      'Return JSON only.',
      'Return: {"test": "hello", "model": "groq"}'
    );
    results.groq = {
      status: 'OK',
      elapsed: `${((Date.now() - start) / 1000).toFixed(1)}s`,
      response: result.substring(0, 200),
    };
  } catch (err) {
    results.groq = {
      status: 'FAILED',
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return new Response(JSON.stringify(results, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
