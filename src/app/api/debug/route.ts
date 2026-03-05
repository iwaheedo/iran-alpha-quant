import { fetchAllNews, fetchAllPrices, fetchPolymarket } from '@/lib/fetchers';
import { groqGenerate, isGroqConfigured } from '@/lib/ai/groq-client';
import { geminiGenerate, isGeminiConfigured } from '@/lib/ai/gemini-client';
import { TRADE_SYSTEM_PROMPT, buildTradeUserPrompt } from '@/lib/ai/prompts';
import { safeParseJSON, validateTrades, validateRegime } from '@/lib/ai/validators';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  const steps: Record<string, unknown> = {};

  // Step 1: Test data fetching
  let news: unknown[] = [];
  let prices: unknown[] = [];
  try {
    const start = Date.now();
    const [n, p, poly] = await Promise.all([
      fetchAllNews(),
      fetchAllPrices(),
      fetchPolymarket(),
    ]);
    news = n;
    prices = p;
    steps.dataFetch = {
      status: 'OK',
      elapsed: `${Date.now() - start}ms`,
      news: n.length,
      prices: p.length,
      polymarket: poly.length,
    };
  } catch (err) {
    steps.dataFetch = {
      status: 'FAILED',
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // Step 2: Build prompt
  let promptLength = 0;
  let userPrompt = '';
  try {
    userPrompt = buildTradeUserPrompt(news as Parameters<typeof buildTradeUserPrompt>[0], prices as Parameters<typeof buildTradeUserPrompt>[1]);
    promptLength = userPrompt.length;
    steps.promptBuild = {
      status: 'OK',
      systemPromptLength: TRADE_SYSTEM_PROMPT.length,
      userPromptLength: promptLength,
      totalChars: TRADE_SYSTEM_PROMPT.length + promptLength,
    };
  } catch (err) {
    steps.promptBuild = {
      status: 'FAILED',
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // Step 3: Call Groq directly
  if (isGroqConfigured() && userPrompt) {
    try {
      const start = Date.now();
      const response = await groqGenerate(TRADE_SYSTEM_PROMPT, userPrompt);
      const elapsed = Date.now() - start;

      // Parse
      const parsed = safeParseJSON(response);
      const parsedObj = parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null;

      const regime = parsedObj ? validateRegime(parsedObj.regime) : null;
      const trades = parsedObj ? validateTrades(parsedObj.trades) : [];

      steps.groqCall = {
        status: 'OK',
        elapsed: `${elapsed}ms`,
        responseLength: response.length,
        responsePreview: response.substring(0, 300),
        parsedOk: !!parsedObj,
        parsedKeys: parsedObj ? Object.keys(parsedObj) : [],
        regimeValid: !!regime,
        tradesRaw: parsedObj?.trades ? (parsedObj.trades as unknown[]).length : 0,
        tradesValidated: trades.length,
        firstTradePreview: trades[0] ? {
          ticker: trades[0].ticker,
          direction: trades[0].direction,
          conviction: trades[0].conviction,
          causalChainLength: trades[0].causalChain.length,
        } : null,
      };
    } catch (err) {
      steps.groqCall = {
        status: 'FAILED',
        error: err instanceof Error ? err.message : String(err),
      };
    }
  } else {
    steps.groqCall = { status: 'SKIPPED', reason: 'Groq not configured or no prompt' };
  }

  // Step 4: Check Gemini
  steps.geminiConfigured = isGeminiConfigured();
  steps.groqConfigured = isGroqConfigured();

  return new Response(JSON.stringify(steps, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
