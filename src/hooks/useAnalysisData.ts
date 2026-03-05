'use client';

import useSWR from 'swr';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { TradeIdea, NewsItem, TickerPrice, MacroRegime, PolymarketPrediction } from '@/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// Polling intervals
const NEWS_INTERVAL = 60;        // 60 seconds — lightweight RSS poll
const PRICES_INTERVAL = 60;      // 60 seconds — Finnhub poll
const AI_INTERVAL = 15 * 60;     // 15 minutes — full AI re-analysis

// Free tier math (24h worst case):
//   News: RSS feeds, no limit ✓
//   Prices: 12 symbols × 60/hr = 12 calls/min (limit: 60/min) ✓
//   Gemini: 2 calls/run × 96 runs/day = 192/day (limit: 1,500/day) ✓

export function useAnalysisData() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [newsCountdown, setNewsCountdown] = useState(NEWS_INTERVAL);
  const hasAutoRun = useRef(false);
  const isAnalyzingRef = useRef(false);

  // --- SWR caches (initial fetch disabled since DB is ephemeral on Vercel) ---
  const { data: tradesData, mutate: mutateTrades } = useSWR<{ trades: TradeIdea[] }>(
    '/api/trades',
    fetcher,
    { refreshInterval: 0, revalidateOnFocus: false }
  );

  // News polls every 60s via live RSS fetch
  const { data: newsData, mutate: mutateNews } = useSWR<{ news: NewsItem[] }>(
    '/api/fetch-news',
    fetcher,
    { refreshInterval: NEWS_INTERVAL * 1000, revalidateOnFocus: false }
  );

  // Prices poll every 60s via live Finnhub fetch
  const { data: pricesData, mutate: mutatePrices } = useSWR<{ prices: TickerPrice[] }>(
    '/api/fetch-prices',
    fetcher,
    { refreshInterval: PRICES_INTERVAL * 1000, revalidateOnFocus: false }
  );

  const { data: regimeData, mutate: mutateRegime } = useSWR<{ regime: MacroRegime }>(
    '/api/regime',
    fetcher,
    { refreshInterval: 0, revalidateOnFocus: false }
  );

  const { data: polymarketData, mutate: mutatePolymarket } = useSWR<{ predictions: PolymarketPrediction[] }>(
    '/api/polymarket',
    fetcher,
    { refreshInterval: 0, revalidateOnFocus: false }
  );

  // --- Countdown timer (ticks every second) ---
  useEffect(() => {
    const interval = setInterval(() => {
      setNewsCountdown(prev => {
        if (prev <= 1) return NEWS_INTERVAL; // Reset after hitting 0
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Reset countdown when news data refreshes
  useEffect(() => {
    if (newsData) {
      setLastUpdated(new Date());
      setNewsCountdown(NEWS_INTERVAL);
    }
  }, [newsData]);

  // --- Full AI analysis ---
  const runAnalysis = useCallback(async () => {
    if (isAnalyzingRef.current) return;
    isAnalyzingRef.current = true;
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/analyze', { method: 'POST' });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || 'Analysis failed');
      }

      // Populate SWR caches directly from response
      if (result.trades) {
        mutateTrades({ trades: result.trades } as { trades: TradeIdea[] }, { revalidate: false });
      }
      if (result.news) {
        mutateNews({ news: result.news } as { news: NewsItem[] }, { revalidate: false });
      }
      if (result.prices) {
        mutatePrices({ prices: result.prices } as { prices: TickerPrice[] }, { revalidate: false });
      }
      if (result.regime) {
        mutateRegime({ regime: result.regime } as { regime: MacroRegime }, { revalidate: false });
      }
      if (result.predictions) {
        mutatePolymarket({ predictions: result.predictions } as { predictions: PolymarketPrediction[] }, { revalidate: false });
      }

      setLastUpdated(new Date());
      setNewsCountdown(NEWS_INTERVAL);
      return result;
    } finally {
      isAnalyzingRef.current = false;
      setIsAnalyzing(false);
    }
  }, [mutateTrades, mutateNews, mutatePrices, mutateRegime, mutatePolymarket]);

  // --- Auto-run: AI analysis on mount + every 15 minutes ---
  useEffect(() => {
    if (!hasAutoRun.current) {
      hasAutoRun.current = true;

      // Run analysis after a short delay (let UI render first)
      const initialTimeout = setTimeout(() => {
        runAnalysis();
      }, 500);

      // Re-run AI analysis every 15 minutes
      const aiInterval = setInterval(() => {
        runAnalysis();
      }, AI_INTERVAL * 1000);

      return () => {
        clearTimeout(initialTimeout);
        clearInterval(aiInterval);
      };
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const analyzeNews = async (newsId: string) => {
    const response = await fetch('/api/analyze-news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newsId }),
    });
    return response.json();
  };

  return {
    trades: tradesData?.trades || [],
    news: newsData?.news || [],
    prices: pricesData?.prices || [],
    regime: regimeData?.regime || null,
    predictions: polymarketData?.predictions || [],
    isAnalyzing,
    lastUpdated,
    newsCountdown,
    runAnalysis,
    analyzeNews,
  };
}
