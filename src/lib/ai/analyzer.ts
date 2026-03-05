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
  // Try Gemini first, fall back to Groq
  if (isGeminiConfigured()) {
    try {
      return await geminiGenerate(systemPrompt, userPrompt);
    } catch (err) {
      console.error('[Analyzer] Gemini failed:', err instanceof Error ? err.message : err);
      if (isGroqConfigured()) {
        console.log('[Analyzer] Falling back to Groq...');
        return await groqGenerate(systemPrompt, userPrompt);
      }
      throw err;
    }
  }

  if (isGroqConfigured()) {
    return await groqGenerate(systemPrompt, userPrompt);
  }

  throw new Error('No AI provider configured. Set GEMINI_API_KEY or GROQ_API_KEY in .env.local');
}

// ===== Full Analysis =====

export async function runFullAnalysis(): Promise<AnalysisResponse> {
  const runId = generateRunId();
  createAnalysisRun(runId);
  console.log(`[Analyzer] Starting full analysis (${runId})...`);

  try {
    // Step 1: Fetch fresh data in parallel
    console.log('[Analyzer] Step 1: Fetching data...');
    const [news, prices, polymarketRaw] = await Promise.all([
      fetchAllNews(),
      fetchAllPrices(),
      fetchPolymarket(),
    ]);

    console.log(`[Analyzer] Data: ${news.length} news, ${prices.length} prices, ${polymarketRaw.length} predictions`);

    if (news.length === 0) {
      throw new Error('No news items fetched — cannot analyze');
    }

    // Step 2: Generate trade ideas via AI
    console.log('[Analyzer] Step 2: Generating trade ideas...');
    const tradePrompt = buildTradeUserPrompt(news, prices);
    const tradeResponse = await callAI(TRADE_SYSTEM_PROMPT, tradePrompt);

    // Parse and validate
    const parsed = safeParseJSON(tradeResponse);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Failed to parse AI response for trades');
    }

    const parsedObj = parsed as Record<string, unknown>;

    // Validate regime
    const regime = validateRegime(parsedObj.regime) || {
      label: 'Escalation Watch',
      level: 'MEDIUM' as const,
      subtitle: 'Monitoring',
      summary: 'Geopolitical tensions being monitored.',
    };

    // Validate trades
    const trades = validateTrades(parsedObj.trades);
    if (trades.length === 0) {
      console.warn('[Analyzer] No valid trades from AI response');
    }

    // Step 3: Enrich Polymarket predictions with AI estimates
    let enrichedPredictions = polymarketRaw;
    if (polymarketRaw.length > 0) {
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

    // Step 4: Save everything to DB
    console.log('[Analyzer] Step 4: Saving results...');
    if (trades.length > 0) {
      saveTradeIdeas(trades, runId);
    }
    if (enrichedPredictions.length > 0) {
      savePredictions(enrichedPredictions, runId);
    }
    completeAnalysisRun(runId, news.length, trades.length, regime);

    console.log(`[Analyzer] Analysis complete: ${trades.length} trades, ${enrichedPredictions.length} predictions`);

    return {
      regime,
      trades,
      predictions: enrichedPredictions,
      news,
      prices,
      runId,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Analyzer] Analysis failed: ${errorMsg}`);
    failAnalysisRun(runId, errorMsg);
    throw err;
  }
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
