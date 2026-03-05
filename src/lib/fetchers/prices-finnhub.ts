import type { TickerPrice } from '@/types';
import { TRACKED_SYMBOLS } from '@/lib/constants';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || '';
const BASE_URL = 'https://finnhub.io/api/v1';

// Rate limiting: Finnhub free tier allows 60 requests/minute
let requestCount = 0;
let windowStart = Date.now();

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  if (now - windowStart > 60000) {
    requestCount = 0;
    windowStart = now;
  }

  if (requestCount >= 55) {
    // Leave some headroom
    const waitTime = 60000 - (now - windowStart) + 100;
    console.log(`[Finnhub] Rate limit approaching, waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    requestCount = 0;
    windowStart = Date.now();
  }

  requestCount++;
  return fetch(url, { signal: AbortSignal.timeout(8000) });
}

export async function fetchFinnhubPrices(): Promise<TickerPrice[]> {
  if (!FINNHUB_API_KEY) {
    console.warn('[Finnhub] No API key configured, skipping');
    return [];
  }

  const prices: TickerPrice[] = [];
  const symbols = TRACKED_SYMBOLS.filter(s => s.finnhubSymbol);

  for (const sym of symbols) {
    try {
      const url = `${BASE_URL}/quote?symbol=${encodeURIComponent(sym.finnhubSymbol!)}&token=${FINNHUB_API_KEY}`;
      const response = await rateLimitedFetch(url);

      if (response.status === 429) {
        console.warn('[Finnhub] Rate limited, stopping batch');
        break;
      }

      if (!response.ok) {
        console.warn(`[Finnhub] Failed for ${sym.symbol}: HTTP ${response.status}`);
        continue;
      }

      const data = await response.json() as {
        c: number;  // Current price
        d: number;  // Change
        dp: number; // Percent change
        h: number;  // High
        l: number;  // Low
        o: number;  // Open
        pc: number; // Previous close
      };

      // Finnhub returns 0s for invalid symbols
      if (!data.c || data.c === 0) {
        console.warn(`[Finnhub] No data for ${sym.symbol}`);
        continue;
      }

      prices.push({
        symbol: sym.symbol,
        price: data.c,
        changePercent: data.dp || 0,
      });
    } catch (err) {
      console.warn(`[Finnhub] Error fetching ${sym.symbol}:`, err instanceof Error ? err.message : err);
    }

    // Small delay between requests to be nice
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`[Finnhub] Fetched ${prices.length}/${symbols.length} prices`);
  return prices;
}
