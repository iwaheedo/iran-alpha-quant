'use client';

import useSWR from 'swr';
import { useState, useEffect } from 'react';
import type { TradeIdea, NewsItem, TickerPrice, MacroRegime, PolymarketPrediction } from '@/types';
import { FALLBACK_TRADES, FALLBACK_REGIME } from '@/lib/fallback-data';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
};

// Client polling intervals
const NEWS_POLL = 60 * 1000;          // Poll news every 60s
const PRICES_POLL = 60 * 1000;        // Poll prices every 60s
const ANALYSIS_POLL = 10 * 60 * 1000; // Poll trades every 10min

// Architecture:
//   GitHub Actions cron runs every 10 min, hitting /api/cron/* endpoints
//   which keep /api/latest, /api/fetch-news, /api/fetch-prices CDN-cached.
//   Client polls CDN-cached endpoints — no extra serverless invocations.

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

  // Primary: reads latest data from DB (populated by server-side cron)
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

  // Live news — CDN-cached 60s, polled every 60s
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
  const liveTrades = latestData?.trades || [];
  const liveRegime = latestData?.regime || null;
  const predictions = latestData?.predictions || [];

  // Use fallback data when AI returns empty trades
  const trades = liveTrades.length > 0 ? liveTrades : FALLBACK_TRADES;
  const regime = liveRegime && liveRegime.label !== 'Escalation Watch' ? liveRegime : FALLBACK_REGIME;

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
