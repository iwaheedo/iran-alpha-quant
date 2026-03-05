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

// Client polling intervals — reads from DB (populated by server-side cron jobs)
const NEWS_POLL = 60 * 1000;          // Poll DB for latest news every 60s
const PRICES_POLL = 60 * 1000;        // Poll DB for latest prices every 60s
const ANALYSIS_POLL = 10 * 60 * 1000; // Poll DB for latest trades every 10min

// Architecture:
//   Server-side cron jobs (vercel.json) populate the DB independently:
//     /api/cron/analyze  → AI trade ideas every 10 min
//     /api/cron/news     → news feed every 1 min
//     /api/cron/prices   → price data every 1 min
//   Client polls read-only endpoints to display latest data from DB.

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

  // News from DB (cron populates every 1 min)
  const { data: newsData } = useSWR<{ news: NewsItem[] }>(
    '/api/news',
    fetcher,
    { refreshInterval: NEWS_POLL, revalidateOnFocus: false }
  );

  // Prices from DB (cron populates every 1 min)
  const { data: pricesData } = useSWR<{ prices: TickerPrice[] }>(
    '/api/prices',
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
