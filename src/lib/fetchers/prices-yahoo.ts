import type { TickerPrice } from '@/types';
import { TRACKED_SYMBOLS } from '@/lib/constants';

export async function fetchYahooPrices(): Promise<TickerPrice[]> {
  const prices: TickerPrice[] = [];
  const symbols = TRACKED_SYMBOLS.filter(s => s.yahooSymbol);

  // yahoo-finance2 is ESM and has quirks — dynamic import
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let yahooFinance: any;
  try {
    const mod = await import('yahoo-finance2');
    yahooFinance = mod.default;
  } catch (err) {
    console.error('[Yahoo] Failed to load yahoo-finance2:', err instanceof Error ? err.message : err);
    return [];
  }

  // Suppress the historical data notice (API varies by version)
  try {
    if (typeof yahooFinance.suppressNotices === 'function') {
      yahooFinance.suppressNotices(['yahooSurvey']);
    }
  } catch {
    // Some versions don't have this method
  }

  for (const sym of symbols) {
    try {
      const quote = await yahooFinance.quote(sym.yahooSymbol!);

      if (!quote || !quote.regularMarketPrice) {
        console.warn(`[Yahoo] No data for ${sym.symbol} (${sym.yahooSymbol})`);
        continue;
      }

      prices.push({
        symbol: sym.symbol,
        price: quote.regularMarketPrice,
        changePercent: quote.regularMarketChangePercent || 0,
      });
    } catch (err) {
      console.warn(`[Yahoo] Error fetching ${sym.symbol}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`[Yahoo] Fetched ${prices.length}/${symbols.length} prices`);
  return prices;
}
