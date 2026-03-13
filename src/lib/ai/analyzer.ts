import { fetchAllNews, fetchAllPrices, fetchPolymarket } from '@/lib/fetchers';
import { cerebrasGenerate, isCerebrasConfigured } from './cerebras-client';
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
  getActivePositions,
  openPosition,
  closePosition,
  markPositionReviewed,
  updatePositionPrices,
} from '@/lib/db';
import type { TradeIdea, PolymarketPrediction, MacroRegime, AnalysisResponse, NewsItem, TickerPrice, PortfolioAction, PortfolioPosition } from '@/types';

function generateRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  // Cerebras primary (1M tokens/day free, fastest inference)
  // Groq fallback (100K tokens/day free)
  // Gemini last resort (rate-limited on free tier)
  const providers: { name: string; configured: boolean; generate: () => Promise<string> }[] = [
    { name: 'Cerebras', configured: isCerebrasConfigured(), generate: () => cerebrasGenerate(systemPrompt, userPrompt) },
    { name: 'Groq', configured: isGroqConfigured(), generate: () => groqGenerate(systemPrompt, userPrompt) },
    { name: 'Gemini', configured: isGeminiConfigured(), generate: () => geminiGenerate(systemPrompt, userPrompt) },
  ];

  const available = providers.filter(p => p.configured);
  if (available.length === 0) {
    throw new Error('No AI provider configured. Set CEREBRAS_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY');
  }

  let lastError: Error | null = null;
  for (const provider of available) {
    try {
      return await provider.generate();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`[Analyzer] ${provider.name} failed:`, lastError.message);
      if (available.indexOf(provider) < available.length - 1) {
        const next = available[available.indexOf(provider) + 1];
        console.log(`[Analyzer] Falling back to ${next.name}...`);
      }
    }
  }

  throw lastError || new Error('All AI providers failed');
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

  // Step 1.5: Load active portfolio positions
  let activePositions: PortfolioPosition[] = [];
  try {
    activePositions = getActivePositions();
    console.log(`[Analyzer] Active positions: ${activePositions.length}`);
  } catch (err) {
    console.error('[Analyzer] Failed to load positions:', err instanceof Error ? err.message : err);
  }

  // Step 2: Generate trade ideas via AI (may fail — that's OK)
  let trades: TradeIdea[] = [];
  let portfolioActions: PortfolioAction[] = [];
  let regime: MacroRegime = {
    label: 'Escalation Watch',
    level: 'MEDIUM',
    subtitle: 'Monitoring',
    summary: 'Geopolitical tensions being monitored.',
  };

  if (news.length > 0) {
    try {
      console.log('[Analyzer] Step 2: Generating trade ideas...');
      const tradePrompt = buildTradeUserPrompt(news, prices, activePositions.length > 0 ? activePositions : undefined);
      const tradeResponse = await callAI(TRADE_SYSTEM_PROMPT, tradePrompt);

      console.log(`[Analyzer] Raw AI response length: ${tradeResponse.length} chars`);
      const parsed = safeParseJSON(tradeResponse);
      if (parsed && typeof parsed === 'object') {
        const parsedObj = parsed as Record<string, unknown>;

        regime = validateRegime(parsedObj.regime) || regime;
        trades = validateTrades(parsedObj.trades);

        // Parse portfolio actions from AI response
        if (Array.isArray(parsedObj.portfolioActions)) {
          portfolioActions = (parsedObj.portfolioActions as Record<string, unknown>[])
            .filter(a => a.positionId && a.action && a.reason)
            .map(a => ({
              positionId: String(a.positionId),
              action: String(a.action) as PortfolioAction['action'],
              reason: String(a.reason),
            }));
          console.log(`[Analyzer] Portfolio actions: ${portfolioActions.length}`);
        }

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

  // Step 4: Save results & manage portfolio
  console.log('[Analyzer] Step 4: Saving results...');
  try {
    if (trades.length > 0) {
      saveTradeIdeas(trades, runId);
    }
    if (enrichedPredictions.length > 0) {
      savePredictions(enrichedPredictions, runId);
    }

    // Open new positions for new trades (skip tickers already in active portfolio)
    const activeTickers = new Set(activePositions.map(p => p.ticker));
    for (const trade of trades) {
      if (!activeTickers.has(trade.ticker)) {
        try {
          openPosition({
            id: `pos_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            tradeIdeaId: trade.id,
            ticker: trade.ticker,
            direction: trade.direction,
            entryPrice: trade.currentPrice,
            currentPrice: trade.currentPrice,
            entryDate: new Date().toISOString(),
            status: 'ACTIVE',
            pnlPercent: 0,
            pnlAbsolute: 0,
            lastReviewedRunId: runId,
            originalTradeData: JSON.stringify(trade),
          });
          console.log(`[Analyzer] Opened position: ${trade.ticker} ${trade.direction}`);
        } catch (err) {
          console.error(`[Analyzer] Failed to open position for ${trade.ticker}:`, err instanceof Error ? err.message : err);
        }
      }
    }

    // Apply AI portfolio actions (close/hold)
    for (const action of portfolioActions) {
      try {
        if (action.action === 'CLOSE') {
          const pos = activePositions.find(p => p.id === action.positionId);
          if (pos) {
            closePosition(pos.id, pos.currentPrice, action.reason, runId);
            console.log(`[Analyzer] Closed position: ${pos.ticker} — ${action.reason}`);
          }
        } else {
          markPositionReviewed(action.positionId, runId);
        }
      } catch (err) {
        console.error(`[Analyzer] Failed to apply action for ${action.positionId}:`, err instanceof Error ? err.message : err);
      }
    }

    // Update position prices with latest data
    if (prices.length > 0) {
      updatePositionPrices(prices);
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
    portfolioActions,
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
