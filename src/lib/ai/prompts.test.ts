import { describe, it, expect } from 'vitest';
import {
  TRADE_SYSTEM_PROMPT,
  SINGLE_NEWS_SYSTEM_PROMPT,
  POLYMARKET_SYSTEM_PROMPT,
  buildTradeUserPrompt,
  buildPolymarketUserPrompt,
  buildSingleNewsPrompt,
} from './prompts';
import type { NewsItem, TickerPrice, PolymarketPrediction } from '@/types';

const mockNews: NewsItem[] = Array.from({ length: 20 }, (_, i) => ({
  id: `news_${i}`,
  title: `News headline ${i}`,
  source: 'Reuters',
  sourceType: 'GOOGLE_NEWS' as const,
  priority: 'HIGH' as const,
  timestamp: new Date().toISOString(),
  relativeTime: '1h ago',
  tags: ['IRAN'],
}));

const mockPrices: TickerPrice[] = [
  { symbol: 'WTI', price: 92.84, changePercent: -2.56 },
  { symbol: 'GOLD', price: 2450, changePercent: 1.2 },
];

describe('TRADE_SYSTEM_PROMPT', () => {
  it('contains JSON format instructions', () => {
    expect(TRADE_SYSTEM_PROMPT).toContain('"regime"');
    expect(TRADE_SYSTEM_PROMPT).toContain('"trades"');
  });

  it('mentions conviction scoring rules', () => {
    expect(TRADE_SYSTEM_PROMPT).toContain('1-10');
    expect(TRADE_SYSTEM_PROMPT).toContain('conviction');
  });

  it('requires second and third-order effects', () => {
    expect(TRADE_SYSTEM_PROMPT).toContain('SECOND');
    expect(TRADE_SYSTEM_PROMPT).toContain('THIRD');
  });
});

describe('SINGLE_NEWS_SYSTEM_PROMPT', () => {
  it('is defined and non-empty', () => {
    expect(SINGLE_NEWS_SYSTEM_PROMPT.length).toBeGreaterThan(50);
  });
});

describe('POLYMARKET_SYSTEM_PROMPT', () => {
  it('mentions probability estimation', () => {
    expect(POLYMARKET_SYSTEM_PROMPT).toContain('probability');
  });
});

describe('buildTradeUserPrompt', () => {
  it('returns a string', () => {
    const result = buildTradeUserPrompt(mockNews, mockPrices);
    expect(typeof result).toBe('string');
  });

  it('contains current date', () => {
    const result = buildTradeUserPrompt(mockNews, mockPrices);
    const today = new Date().toISOString().split('T')[0];
    expect(result).toContain(today);
  });

  it('slices news to max 15 items', () => {
    const result = buildTradeUserPrompt(mockNews, mockPrices);
    // 20 mock news items but only 15 should appear
    expect(result).toContain('news_14');
    expect(result).not.toContain('news_15');
  });

  it('includes price symbols', () => {
    const result = buildTradeUserPrompt(mockNews, mockPrices);
    expect(result).toContain('WTI');
    expect(result).toContain('GOLD');
  });

  it('requests valid JSON only', () => {
    const result = buildTradeUserPrompt(mockNews, mockPrices);
    expect(result).toContain('valid JSON only');
  });
});

describe('buildPolymarketUserPrompt', () => {
  const mockPredictions: PolymarketPrediction[] = [
    {
      id: 'pred_1',
      question: 'Will Iran attack?',
      direction: 'YES',
      marketPrice: 45,
      aiEstimate: 0,
      conviction: 0,
      edge: 0,
      reasoning: '',
      resolvesIn: '2 weeks',
    },
  ];

  it('includes prediction count', () => {
    const result = buildPolymarketUserPrompt(mockPredictions, mockNews);
    expect(result).toContain('exactly 1 entries');
  });

  it('includes prediction IDs', () => {
    const result = buildPolymarketUserPrompt(mockPredictions, mockNews);
    expect(result).toContain('pred_1');
  });

  it('requests valid JSON only', () => {
    const result = buildPolymarketUserPrompt(mockPredictions, mockNews);
    expect(result).toContain('valid JSON only');
  });
});

describe('buildSingleNewsPrompt', () => {
  const singleNews: NewsItem = {
    id: 'news_single',
    title: 'Iran strikes target',
    source: 'Reuters',
    sourceType: 'GOOGLE_NEWS',
    priority: 'BREAKING',
    timestamp: new Date().toISOString(),
    relativeTime: '5m ago',
    tags: ['IRAN', 'MILITARY'],
  };

  it('contains the news title', () => {
    const result = buildSingleNewsPrompt(singleNews, mockPrices);
    expect(result).toContain('Iran strikes target');
  });

  it('contains the news tags', () => {
    const result = buildSingleNewsPrompt(singleNews, mockPrices);
    expect(result).toContain('IRAN');
    expect(result).toContain('MILITARY');
  });

  it('contains price data', () => {
    const result = buildSingleNewsPrompt(singleNews, mockPrices);
    expect(result).toContain('WTI');
    expect(result).toContain('92.84');
  });
});
