'use client';

import useSWR from 'swr';
import { useState } from 'react';
import type { TradeIdea, NewsItem, TickerPrice, MacroRegime, PolymarketPrediction } from '@/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useAnalysisData() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  const { data: pricesData, mutate: mutatePrices } = useSWR<{ prices: TickerPrice[] }>(
    '/api/prices',
    fetcher,
    { refreshInterval: 60000, revalidateOnFocus: false }
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

  const runAnalysis = async () => {
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
        mutateTrades({ trades: result.trades, count: result.trades.length }, { revalidate: false });
      }
      if (result.news) {
        mutateNews({ news: result.news, count: result.news.length }, { revalidate: false });
      }
      if (result.prices) {
        mutatePrices({ prices: result.prices, updatedAt: new Date().toISOString() }, { revalidate: false });
      }
      if (result.regime) {
        mutateRegime({ regime: result.regime }, { revalidate: false });
      }
      if (result.predictions) {
        mutatePolymarket({ predictions: result.predictions, count: result.predictions.length }, { revalidate: false });
      }

      return result;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeNews = async (newsId: string) => {
    const response = await fetch('/api/analyze-news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newsId }),
    });
    return response.json();
  };

  const fetchNews = async () => {
    await fetch('/api/fetch-news', { method: 'POST' });
    await mutateNews();
  };

  const fetchPrices = async () => {
    await fetch('/api/fetch-prices', { method: 'POST' });
    await mutatePrices();
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
    fetchNews,
    fetchPrices,
  };
}
