import type { PolymarketPrediction } from '@/types';

const GAMMA_API_URL = 'https://gamma-api.polymarket.com';

// Keywords to filter — must match Iran-related markets only
const IRAN_KEYWORDS = [
  'iran', 'iranian', 'tehran', 'khamenei', 'raisi',
  'irgc', 'strait of hormuz', 'hormuz', 'persian gulf',
  'iran nuclear', 'iran sanction', 'iran war', 'iran strike',
  'iran israel', 'iran attack',
];

function generateId(question: string): string {
  const hash = Buffer.from(question).toString('base64url').slice(0, 16);
  return `pm_${hash}`;
}

interface GammaMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  outcomes: string;
  outcomePrices: string;
  volume: string;
  active: boolean;
  closed: boolean;
  endDate: string;
  description: string;
}

function getResolvesIn(endDate: string): string {
  const end = new Date(endDate);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();

  if (diffMs < 0) return 'Expired';

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `${diffDays} days`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
  return `${Math.floor(diffDays / 365)}+ years`;
}

export async function fetchPolymarketData(): Promise<PolymarketPrediction[]> {
  const predictions: PolymarketPrediction[] = [];

  try {
    // Fetch active markets — Iran-focused queries only
    const searchQueries = ['iran', 'iranian', 'hormuz', 'iran nuclear', 'iran israel', 'tehran'];

    const allMarkets: GammaMarket[] = [];

    for (const query of searchQueries) {
      try {
        const url = `${GAMMA_API_URL}/markets?closed=false&active=true&limit=10&textQuery=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
          signal: AbortSignal.timeout(8000),
          headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
          console.warn(`[Polymarket] Search "${query}" returned HTTP ${response.status}`);
          continue;
        }

        const markets = await response.json() as GammaMarket[];
        allMarkets.push(...markets);
      } catch (err) {
        console.warn(`[Polymarket] Failed search "${query}":`, err instanceof Error ? err.message : err);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Deduplicate by conditionId
    const uniqueMarkets = new Map<string, GammaMarket>();
    for (const m of allMarkets) {
      if (!uniqueMarkets.has(m.conditionId)) {
        uniqueMarkets.set(m.conditionId, m);
      }
    }

    // Filter for relevance
    for (const market of uniqueMarkets.values()) {
      const fullText = `${market.question} ${market.description || ''}`.toLowerCase();
      const isRelevant = IRAN_KEYWORDS.some(kw => fullText.includes(kw));

      if (!isRelevant) continue;

      // Parse outcome prices
      let prices: number[] = [];
      try {
        prices = JSON.parse(market.outcomePrices || '[]');
      } catch {
        continue;
      }

      if (prices.length < 1) continue;

      const yesPrice = prices[0] || 0.5;
      const marketPricePercent = Math.round(yesPrice * 100);

      // Determine direction based on market price
      // If market thinks >60% likely → we evaluate if YES, else NO
      const direction: 'YES' | 'NO' = marketPricePercent >= 50 ? 'YES' : 'NO';

      predictions.push({
        id: generateId(market.question),
        question: market.question,
        direction,
        marketPrice: marketPricePercent,
        aiEstimate: 0, // Will be filled by AI in Phase 3
        edge: 0,
        conviction: 0,
        resolvesIn: market.endDate ? getResolvesIn(market.endDate) : 'Unknown',
        conditionId: market.conditionId,
        url: market.slug ? `https://polymarket.com/event/${market.slug}` : undefined,
      });
    }

    // Sort by volume/relevance (most relevant keywords first)
    predictions.sort((a, b) => {
      const aScore = IRAN_KEYWORDS.filter(kw => a.question.toLowerCase().includes(kw)).length;
      const bScore = IRAN_KEYWORDS.filter(kw => b.question.toLowerCase().includes(kw)).length;
      return bScore - aScore;
    });

    console.log(`[Polymarket] Found ${predictions.length} relevant markets from ${uniqueMarkets.size} unique markets`);
    return predictions.slice(0, 15); // Cap at 15 predictions
  } catch (err) {
    console.error('[Polymarket] Failed to fetch data:', err instanceof Error ? err.message : err);
    return [];
  }
}
