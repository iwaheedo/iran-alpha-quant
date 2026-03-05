'use client';

import useSWR from 'swr';
import { useState, useEffect } from 'react';
import type { TradeIdea, NewsItem, TickerPrice, MacroRegime, PolymarketPrediction } from '@/types';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
};

// Polling intervals — all hit CDN cache (instant), not serverless functions
const NEWS_POLL = 60 * 1000;          // Poll news every 60s (CDN-cached for 60s)
const PRICES_POLL = 60 * 1000;        // Poll prices every 60s (CDN-cached for 60s)
const ANALYSIS_POLL = 10 * 60 * 1000; // Poll analysis every 10min (CDN-cached for 2h)

// Architecture:
//   /api/latest      → full AI analysis, CDN-cached 2h (keeps Groq under 100K TPD free tier)
//   /api/fetch-news  → RSS news, CDN-cached 60s
//   /api/fetch-prices→ Finnhub prices, CDN-cached 60s
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
  const { data: latestData, isLoading: isAnalysisLoading, error: analysisError } = useSWR<LatestResponse>(
    '/api/latest',
    fetcher,
    {
      refreshInterval: ANALYSIS_POLL,
      revalidateOnFocus: false,
      errorRetryCount: 3,
      errorRetryInterval: 10000,
    }
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

  // Check if we got an error response (200 with error field) or SWR error
  const hasError = !!analysisError || !!(latestData && 'error' in latestData);

  return {
    trades,
    news,
    prices,
    regime,
    predictions,
    isAnalyzing: isAnalysisLoading && !latestData,
    analysisError: hasError,
    lastUpdated,
    newsCountdown,
  };
}
