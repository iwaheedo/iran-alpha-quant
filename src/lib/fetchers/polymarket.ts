import type { PolymarketPrediction } from '@/types';

const GAMMA_API_URL = 'https://gamma-api.polymarket.com';

const IRAN_KEYWORDS = [
  'iran', 'iranian', 'tehran', 'khamenei',
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

interface GammaEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  active: boolean;
  closed: boolean;
  volume24hr: number;
  markets: GammaMarket[];
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
    // Fetch top events by 24h volume — Iran markets appear here
    const url = `${GAMMA_API_URL}/events?limit=100&active=true&closed=false&order=volume24hr&ascending=false`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.warn(`[Polymarket] Events API returned HTTP ${response.status}`);
      return [];
    }

    const events = await response.json() as GammaEvent[];

    // Filter for Iran-related events
    const iranEvents = events.filter(event => {
      const text = `${event.title} ${event.slug} ${event.description || ''}`.toLowerCase();
      return IRAN_KEYWORDS.some(kw => text.includes(kw));
    });

    console.log(`[Polymarket] Found ${iranEvents.length} Iran events from ${events.length} total`);

    // For each Iran event, pick the most relevant active market
    for (const event of iranEvents) {
      const activeMarkets = (event.markets || []).filter(m => m.active && !m.closed);
      if (activeMarkets.length === 0) continue;

      // Pick the market with the latest end date (most relevant timeframe)
      const sortedMarkets = activeMarkets
        .filter(m => {
          if (!m.endDate) return true;
          return new Date(m.endDate).getTime() > Date.now();
        })
        .sort((a, b) => {
          const aEnd = a.endDate ? new Date(a.endDate).getTime() : Infinity;
          const bEnd = b.endDate ? new Date(b.endDate).getTime() : Infinity;
          return aEnd - bEnd; // Nearest expiry first (most actionable)
        });

      const market = sortedMarkets[0];
      if (!market) continue;

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
      const direction: 'YES' | 'NO' = marketPricePercent >= 50 ? 'YES' : 'NO';

      predictions.push({
        id: generateId(market.question),
        question: market.question,
        direction,
        marketPrice: marketPricePercent,
        aiEstimate: 0,
        edge: 0,
        conviction: 0,
        resolvesIn: market.endDate ? getResolvesIn(market.endDate) : 'Unknown',
        conditionId: market.conditionId,
        url: `https://polymarket.com/event/${event.slug}/${market.slug}`,
      });
    }

    // Sort by 24h volume (inherited from event order)
    console.log(`[Polymarket] Returning ${Math.min(predictions.length, 15)} predictions`);
    return predictions.slice(0, 15);
  } catch (err) {
    console.error('[Polymarket] Failed to fetch data:', err instanceof Error ? err.message : err);
    return [];
  }
}
