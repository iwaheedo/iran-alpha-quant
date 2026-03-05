'use client';

import useSWR from 'swr';
import { useState, useEffect } from 'react';
import type { TradeIdea, NewsItem, TickerPrice, MacroRegime, PolymarketPrediction } from '@/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// Polling intervals — all hit CDN cache (instant), not serverless functions
const NEWS_POLL = 60 * 1000;     // Poll news every 60s (CDN-cached for 60s)
const PRICES_POLL = 60 * 1000;   // Poll prices every 60s (CDN-cached for 60s)
const ANALYSIS_POLL = 60 * 1000; // Poll analysis every 60s (CDN-cached for 5 min)

// Architecture:
//   /api/latest      → full AI analysis, CDN-cached 5 min (s-maxage=300)
//   /api/fetch-news  → RSS news, CDN-cached 60s (s-maxage=60)
//   /api/fetch-prices→ Finnhub prices, CDN-cached 60s (s-maxage=60)
//   1000 users = 1 serverless invocation per cache cycle, rest hit CDN

interface LatestResponse {
  trades: TradeIdea[];
  news: NewsItem[];
  prices: TickerPrice[];
  predictions: PolymarketPrediction[];
  regime: MacroRegime | null;
  generatedAt: string;
}

export function useAnalysisData() {
  const [newsCountdown, setNewsCountdown] = useState(60);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Primary: CDN-cached analysis (trades, predictions, regime)
  const { data: latestData, isLoading: isAnalysisLoading } = useSWR<LatestResponse>(
    '/api/latest',
    fetcher,
    { refreshInterval: ANALYSIS_POLL, revalidateOnFocus: false }
  );

  // Live news feed — CDN-cached 60s, polled every 60s
  const { data: newsData } = useSWR<{ news: NewsItem[] }>(
    '/api/fetch-news',
    fetcher,
    { refreshInterval: NEWS_POLL, revalidateOnFocus: false }
  );

  // Live prices — CDN-cached 60s, polled every 60s
  const { data: pricesData } = useSWR<{ prices: TickerPrice[] }>(
    '/api/fetch-prices',
    fetcher,
    { refreshInterval: PRICES_POLL, revalidateOnFocus: false }
  );

  // Countdown timer (ticks every second)
  useEffect(() => {
    const interval = setInterval(() => {
      setNewsCountdown(prev => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Track last update time
  useEffect(() => {
    if (newsData || latestData) {
      setLastUpdated(new Date());
      setNewsCountdown(60);
    }
  }, [newsData, latestData]);

  // Merge data: prefer live news/prices over analysis snapshot
  const news = newsData?.news || latestData?.news || [];
  const prices = pricesData?.prices || latestData?.prices || [];
  const trades = latestData?.trades || [];
  const regime = latestData?.regime || null;
  const predictions = latestData?.predictions || [];

  return {
    trades,
    news,
    prices,
    regime,
    predictions,
    isAnalyzing: isAnalysisLoading && !latestData,
    lastUpdated,
    newsCountdown,
  };
}
