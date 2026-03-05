'use client';

import useSWR from 'swr';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { TradeIdea, NewsItem, TickerPrice, MacroRegime, PolymarketPrediction } from '@/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// Auto-refresh intervals (in ms)
// Free tier math (24h worst case):
//   Gemini: 2 calls/run × 720 runs = 1,440/day (limit: 1,500/day) ✓
//   Finnhub: 12 symbols × 30/hr = 6 calls/min (limit: 60/min) ✓
//   If Gemini exhausted → auto-fallback to Groq (14,400 RPD) ✓
const ANALYSIS_INTERVAL = 2 * 60 * 1000;  // 2 minutes — full AI re-analysis
const PRICES_INTERVAL = 2 * 60 * 1000;    // 2 minutes — price ticker refresh

export function useAnalysisData() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const hasAutoRun = useRef(false);
  const analysisTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: tradesData, mutate: mutateTrades } = useSWR<{ trades: TradeIdea[] }>(
    '/api/trades',
    fetcher,
    { refreshInterval: 0, revalidateOnFocus: false }
  );

  const { data: newsData, mutate: mutateNews } = useSWR<{ news: NewsItem[] }>(
    '/api/news',
    fetcher,
    { refreshInterval: 0, revalidateOnFocus: false }
  );

  // Prices refresh every 2 min via live Finnhub fetch
  const { data: pricesData, mutate: mutatePrices } = useSWR<{ prices: TickerPrice[] }>(
    '/api/fetch-prices',
    fetcher,
    { refreshInterval: PRICES_INTERVAL, revalidateOnFocus: false }
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

  const runAnalysis = useCallback(async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/analyze', { method: 'POST' });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || 'Analysis failed');
      }

      // Populate SWR caches directly from analyze response
      // (Vercel serverless doesn't share /tmp SQLite across invocations)
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

      return result;
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, mutateTrades, mutateNews, mutatePrices, mutateRegime, mutatePolymarket]);

  // Auto-run analysis on first page load + every 30 minutes
  useEffect(() => {
    if (!hasAutoRun.current) {
      hasAutoRun.current = true;
      // Small delay so the UI renders first, then analysis starts
      const timeout = setTimeout(() => {
        runAnalysis();
      }, 500);

      // Set up recurring analysis every 30 minutes
      analysisTimer.current = setInterval(() => {
        runAnalysis();
      }, ANALYSIS_INTERVAL);

      return () => {
        clearTimeout(timeout);
        if (analysisTimer.current) clearInterval(analysisTimer.current);
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
    runAnalysis,
    analyzeNews,
  };
}
