import { fetchGoogleNews } from './news-google';
import { fetchTwitterNews } from './news-twitter';
import { fetchFinnhubPrices } from './prices-finnhub';
import { fetchYahooPrices } from './prices-yahoo';
import { fetchPolymarketData } from './polymarket';
import { saveNewsItems, savePrices } from '@/lib/db';
import type { NewsItem, TickerPrice, PolymarketPrediction } from '@/types';

// ===== News Aggregation =====

export async function fetchAllNews(): Promise<NewsItem[]> {
  console.log('[Fetcher] Starting news aggregation...');

  // Fetch Google News and Twitter in parallel
  const [googleNews, twitterNews] = await Promise.allSettled([
    fetchGoogleNews(),
    fetchTwitterNews(),
  ]);

  const allNews: NewsItem[] = [];

  if (googleNews.status === 'fulfilled') {
    allNews.push(...googleNews.value);
  } else {
    console.error('[Fetcher] Google News failed:', googleNews.reason);
  }

  if (twitterNews.status === 'fulfilled') {
    allNews.push(...twitterNews.value);
  } else {
    console.error('[Fetcher] Twitter News failed:', twitterNews.reason);
  }

  // Sort by timestamp (newest first)
  allNews.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Save to DB
  if (allNews.length > 0) {
    saveNewsItems(allNews);
    console.log(`[Fetcher] Saved ${allNews.length} news items to DB`);
  }

  return allNews;
}

// ===== Price Aggregation =====

export async function fetchAllPrices(): Promise<TickerPrice[]> {
  console.log('[Fetcher] Starting price fetch...');

  // Try Finnhub first
  let prices = await fetchFinnhubPrices();

  // If Finnhub returned insufficient data, fall back to Yahoo
  if (prices.length < 5) {
    console.log('[Fetcher] Finnhub returned few results, trying Yahoo fallback...');
    const yahooPrices = await fetchYahooPrices();

    // Merge: Finnhub prices take precedence, Yahoo fills gaps
    const priceMap = new Map<string, TickerPrice>();
    for (const p of yahooPrices) {
      priceMap.set(p.symbol, p);
    }
    for (const p of prices) {
      priceMap.set(p.symbol, p); // Overwrites Yahoo with Finnhub
    }

    prices = Array.from(priceMap.values());
  }

  // Save to DB
  if (prices.length > 0) {
    savePrices(prices);
    console.log(`[Fetcher] Saved ${prices.length} prices to DB`);
  }

  return prices;
}

// ===== Polymarket =====

export async function fetchPolymarket(): Promise<PolymarketPrediction[]> {
  console.log('[Fetcher] Fetching Polymarket data...');
  const predictions = await fetchPolymarketData();
  console.log(`[Fetcher] Got ${predictions.length} Polymarket predictions`);
  return predictions;
}

// ===== Full Refresh =====

export async function fetchAll(): Promise<{
  news: NewsItem[];
  prices: TickerPrice[];
  predictions: PolymarketPrediction[];
}> {
  const [news, prices, predictions] = await Promise.allSettled([
    fetchAllNews(),
    fetchAllPrices(),
    fetchPolymarket(),
  ]);

  return {
    news: news.status === 'fulfilled' ? news.value : [],
    prices: prices.status === 'fulfilled' ? prices.value : [],
    predictions: predictions.status === 'fulfilled' ? predictions.value : [],
  };
}
