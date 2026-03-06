import { fetchAllNews, fetchAllPrices, fetchPolymarket } from '@/lib/fetchers';
import { geminiGenerate, isGeminiConfigured } from './gemini-client';
import { groqGenerate, isGroqConfigured } from './groq-client';
import {
  TRADE_SYSTEM_PROMPT,
  POLYMARKET_SYSTEM_PROMPT,
  SINGLE_NEWS_SYSTEM_PROMPT,
  buildTradeUserPrompt,
  buildPolymarketUserPrompt,
  buildSingleNewsPrompt,
} from './prompts';
import {
  safeParseJSON,
  validateRegime,
  validateTrades,
  validatePolymarketEnrichment,
} from './validators';
import {
  createAnalysisRun,
  completeAnalysisRun,
  failAnalysisRun,
  saveTradeIdeas,
  savePredictions,
  getLatestNews,
  getLatestPrices,
} from '@/lib/db';
import type { TradeIdea, PolymarketPrediction, MacroRegime, AnalysisResponse, NewsItem, TickerPrice } from '@/types';

function generateRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  // Groq primary (faster, generous free tier: 14,400 RPD)
  // Gemini fallback (rate-limited on free tier)
  if (isGroqConfigured()) {
    try {
      return await groqGenerate(systemPrompt, userPrompt);
    } catch (err) {
      console.error('[Analyzer] Groq failed:', err instanceof Error ? err.message : err);
      if (isGeminiConfigured()) {
        console.log('[Analyzer] Falling back to Gemini...');
        return await geminiGenerate(systemPrompt, userPrompt);
      }
      throw err;
    }
  }

  if (isGeminiConfigured()) {
    return await geminiGenerate(systemPrompt, userPrompt);
  }

  throw new Error('No AI provider configured. Set GEMINI_API_KEY or GROQ_API_KEY in .env.local');
}

// ===== Full Analysis =====

export async function runFullAnalysis(): Promise<AnalysisResponse> {
  const runId = generateRunId();
  try { createAnalysisRun(runId); } catch { /* DB write may fail on serverless — non-critical */ }
  console.log(`[Analyzer] Starting full analysis (${runId})...`);

  // Step 1: Fetch fresh data in parallel (this should always succeed)
  console.log('[Analyzer] Step 1: Fetching data...');
  let news: NewsItem[] = [];
  let prices: TickerPrice[] = [];
  let polymarketRaw: PolymarketPrediction[] = [];

  try {
    [news, prices, polymarketRaw] = await Promise.all([
      fetchAllNews(),
      fetchAllPrices(),
      fetchPolymarket(),
    ]);
  } catch (err) {
    console.error('[Analyzer] Data fetch failed:', err instanceof Error ? err.message : err);
  }

  console.log(`[Analyzer] Data: ${news.length} news, ${prices.length} prices, ${polymarketRaw.length} predictions`);

  // Step 2: Generate trade ideas via AI (may fail — that's OK)
  let trades: TradeIdea[] = [];
  let regime: MacroRegime = {
    label: 'Escalation Watch',
    level: 'MEDIUM',
    subtitle: 'Monitoring',
    summary: 'Geopolitical tensions being monitored.',
  };

  if (news.length > 0) {
    try {
      console.log('[Analyzer] Step 2: Generating trade ideas...');
      const tradePrompt = buildTradeUserPrompt(news, prices);
      const tradeResponse = await callAI(TRADE_SYSTEM_PROMPT, tradePrompt);

      console.log(`[Analyzer] Raw AI response length: ${tradeResponse.length} chars`);
      const parsed = safeParseJSON(tradeResponse);
      if (parsed && typeof parsed === 'object') {
        const parsedObj = parsed as Record<string, unknown>;

        regime = validateRegime(parsedObj.regime) || regime;
        trades = validateTrades(parsedObj.trades);

        if (trades.length === 0) {
          console.warn('[Analyzer] No valid trades from AI response');
        }
      } else {
        console.error(`[Analyzer] Parse failed. Response preview: ${tradeResponse.substring(0, 300)}`);
      }
    } catch (err) {
      console.error('[Analyzer] AI trade generation failed:', err instanceof Error ? err.message : err);
      // Continue with empty trades — news/prices still served
    }
  } else {
    console.warn('[Analyzer] No news items fetched — skipping AI analysis');
  }

  // Step 3: Enrich Polymarket predictions with AI estimates
  let enrichedPredictions = polymarketRaw;
  if (polymarketRaw.length > 0 && news.length > 0) {
    console.log('[Analyzer] Step 3: Enriching Polymarket predictions...');
    try {
      const polyPrompt = buildPolymarketUserPrompt(polymarketRaw, news);
      const polyResponse = await callAI(POLYMARKET_SYSTEM_PROMPT, polyPrompt);
      const polyParsed = safeParseJSON(polyResponse);
      enrichedPredictions = validatePolymarketEnrichment(polyParsed, polymarketRaw);
    } catch (err) {
      console.error('[Analyzer] Polymarket enrichment failed:', err instanceof Error ? err.message : err);
      // Continue with un-enriched predictions
    }
  }

  // Step 4: Save results
  console.log('[Analyzer] Step 4: Saving results...');
  try {
    if (trades.length > 0) {
      saveTradeIdeas(trades, runId);
    }
    if (enrichedPredictions.length > 0) {
      savePredictions(enrichedPredictions, runId);
    }
    completeAnalysisRun(runId, news.length, trades.length, regime);
  } catch (err) {
    console.error('[Analyzer] DB save failed:', err instanceof Error ? err.message : err);
    failAnalysisRun(runId, err instanceof Error ? err.message : 'Save failed');
  }

  console.log(`[Analyzer] Analysis complete: ${trades.length} trades, ${enrichedPredictions.length} predictions`);

  return {
    regime,
    trades,
    predictions: enrichedPredictions,
    news,
    prices,
    runId,
  };
}

// ===== Single News Analysis =====

export async function analyzeSpecificNews(newsId: string): Promise<TradeIdea[]> {
  console.log(`[Analyzer] Analyzing specific news: ${newsId}`);

  // Get the news item
  const allNews = getLatestNews(100);
  const newsItem = allNews.find(n => n.id === newsId);
  if (!newsItem) {
    throw new Error(`News item ${newsId} not found`);
  }

  // Get current prices
  const prices = getLatestPrices();

  // Generate trades for this specific news
  const prompt = buildSingleNewsPrompt(newsItem, prices);
  const response = await callAI(SINGLE_NEWS_SYSTEM_PROMPT, prompt);

  // Parse — response could be array directly or { trades: [...] }
  const parsed = safeParseJSON(response);
  let rawTrades: unknown[];

  if (Array.isArray(parsed)) {
    rawTrades = parsed;
  } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).trades)) {
    rawTrades = (parsed as Record<string, unknown>).trades as unknown[];
  } else {
    console.warn('[Analyzer] Could not parse single-news response');
    return [];
  }

  const trades = validateTrades(rawTrades);

  // Link to the news item
  for (const trade of trades) {
    if (!trade.newsIds.includes(newsId)) {
      trade.newsIds.push(newsId);
    }
  }

  console.log(`[Analyzer] Single-news analysis: ${trades.length} trades from "${newsItem.title.slice(0, 50)}..."`);
  return trades;
}
