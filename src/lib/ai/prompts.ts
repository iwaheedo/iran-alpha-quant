import type { NewsItem, TickerPrice, PolymarketPrediction, PortfolioPosition } from '@/types';

export const TRADE_SYSTEM_PROMPT = `You are a top macro investor focused on Iran/Middle East geopolitical event-driven trades. Generate 3-4 high-conviction trade ideas driven by the news provided.

RULES:
- Every trade MUST link to specific news items via newsIds
- Include quantified catalysts, historical precedents, and specific price levels
- Causal chain labels must be YOUR analysis (never news headlines or IDs)
- Focus on 2nd/3rd-order effects the market hasn't priced
- Use CURRENT prices provided — never memorized prices
- Categories: SHIPPING, CURRENCY, COMMODITIES, ENERGY, AGRICULTURE, DEFENSE, EMERGING_MARKETS, CONSUMER
- Time horizons: DAYS, WEEKS, MONTHS, YEAR_PLUS
- Order types: 1ST_ORDER, 2ND_ORDER, 3RD_ORDER, CROWDED
- Platforms: Robinhood/Trading212 (stocks/ETFs), Hyperliquid/Lighter (crypto), Ostrium (commodities/FX)

If ACTIVE_POSITIONS are provided, also return "portfolioActions": [{ "positionId": "string", "action": "HOLD|CLOSE|ADJUST", "reason": "1 sentence" }] for each position. CLOSE if thesis is broken or invalidation hit. HOLD with brief confirmation otherwise. Generate 2 new trades when reviewing 3+ positions.

Return JSON: { "regime": { "label": "Escalation Watch|Active Conflict|De-escalation|Sanctions Tightening|Diplomacy Mode", "level": "LOW|MEDIUM|HIGH|CRITICAL", "subtitle": "string", "summary": "string" }, "trades": [{ "id": "trade_001", "ticker": "string", "fullName": "string", "direction": "LONG|SHORT", "conviction": 1-10, "orderType": "string", "categories": ["string"], "timeHorizon": "string", "horizonLabel": "string", "currentPrice": number, "priceChange": number, "thesis": "string", "causalChain": [{"label":"string","sentiment":"negative|neutral|positive"}], "pricedIn": "string", "edge": "string", "riskReward": {"upside":number,"downside":number,"ratio":"string"}, "entry": "string", "invalidation": "string", "breakers": ["string"], "platforms": [{"name":"string","instrument":"string"}], "isCrowded": boolean, "createdAt": "ISO string", "newsIds": ["string"] }], "portfolioActions": [] }`;

// Full names for common symbols to prevent AI hallucinations
const SYMBOL_NAMES: Record<string, string> = {
  WTI: 'WTI Crude Oil (West Texas Intermediate)',
  BRENT: 'Brent Crude Oil',
  GLD: 'SPDR Gold Shares ETF',
  UUP: 'Invesco DB US Dollar Index ETF',
  ZIM: 'ZIM Integrated Shipping Services',
  ITA: 'iShares U.S. Aerospace & Defense ETF',
  EEM: 'iShares MSCI Emerging Markets ETF',
  TLT: 'iShares 20+ Year Treasury Bond ETF',
  SPY: 'SPDR S&P 500 ETF',
  BTC: 'Bitcoin',
  WEAT: 'Teucrium Wheat Fund ETF',
  DBA: 'Invesco DB Agriculture Fund',
};

export function buildTradeUserPrompt(news: NewsItem[], prices: TickerPrice[], activePositions?: PortfolioPosition[]): string {
  const newsJson = news.slice(0, 5).map(n => ({
    id: n.id,
    title: n.title,
    source: n.source,
    priority: n.priority,
    tags: n.tags,
  }));

  const pricesJson = prices.map(p => `${p.symbol}: $${p.price} (${p.changePercent > 0 ? '+' : ''}${p.changePercent}%)`);

  let prompt = `Date: ${new Date().toISOString().split('T')[0]}
NEWS: ${JSON.stringify(newsJson)}
PRICES: ${pricesJson.join(', ')}`;

  if (activePositions && activePositions.length > 0) {
    const posSummaries = activePositions.map(p => {
      const sign = p.pnlPercent >= 0 ? '+' : '';
      return `${p.id}|${p.ticker}|${p.direction}|entry:$${p.entryPrice}|now:$${p.currentPrice}|PnL:${sign}${p.pnlPercent.toFixed(1)}%`;
    });
    prompt += `\nACTIVE_POSITIONS: ${posSummaries.join('; ')}`;
    const newCount = activePositions.length >= 3 ? 2 : 3;
    prompt += `\nGenerate ${newCount} NEW trades (different tickers from active). Also return portfolioActions for each position. Return valid JSON only.`;
  } else {
    prompt += `\nGenerate 3-4 trade ideas. Use these exact prices. Link each trade to news IDs. Return valid JSON only.`;
  }

  return prompt;
}

export const POLYMARKET_SYSTEM_PROMPT = `You are a geopolitical probability analyst. For each prediction market, estimate the TRUE probability (0-100) based on current news. Reference specific news, historical precedents, and whether the market is over/under pricing.

Return JSON array: [{ "id": "exact prediction ID", "question": "string", "aiEstimate": 0-100, "conviction": 1-10, "reasoning": "2-3 sentences with causal logic and news references" }]`;

export function buildPolymarketUserPrompt(
  predictions: PolymarketPrediction[],
  news: NewsItem[]
): string {
  const predData = predictions.map(p => ({
    id: p.id,
    question: p.question,
    marketPrice: p.marketPrice,
    resolvesIn: p.resolvesIn,
  }));

  const recentNews = news.slice(0, 5).map(n => n.title);

  return `Date: ${new Date().toISOString().split('T')[0]}
PREDICTIONS: ${JSON.stringify(predData)}
NEWS: ${recentNews.join(' | ')}
Return exactly ${predData.length} entries. Return valid JSON only.`;
}

export const SINGLE_NEWS_SYSTEM_PROMPT = `You are a senior macro strategist. Analyze a single news item and generate 1-3 specific trade ideas based on its second and third-order effects.

Follow the same JSON format as the full analysis but return only the "trades" array. Focus on the most actionable implications of this specific piece of news.

Return valid JSON only — an array of trade objects.`;

export function buildSingleNewsPrompt(newsItem: NewsItem, prices: TickerPrice[]): string {
  const pricesJson = prices.map(p => ({
    symbol: p.symbol,
    price: p.price,
    changePercent: p.changePercent,
  }));

  return `Current date: ${new Date().toISOString().split('T')[0]}

NEWS ITEM TO ANALYZE:
Title: ${newsItem.title}
Source: ${newsItem.source}
Priority: ${newsItem.priority}
Tags: ${newsItem.tags.join(', ')}
Published: ${newsItem.timestamp}

CURRENT MARKET PRICES:
${JSON.stringify(pricesJson, null, 2)}

Generate 1-3 specific trade ideas focusing on second and third-order effects from this news. Return valid JSON array of trade objects only.`;
}
