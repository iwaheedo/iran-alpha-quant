import { describe, it, expect } from 'vitest';
import { safeParseJSON, validateRegime, validateTrade, validateTrades, validatePolymarketEnrichment } from './validators';
import type { PolymarketPrediction } from '@/types';

// ===== safeParseJSON =====

describe('safeParseJSON', () => {
  it('parses valid JSON string', () => {
    expect(safeParseJSON('{"a": 1}')).toEqual({ a: 1 });
  });

  it('parses JSON wrapped in markdown code fences', () => {
    const input = '```json\n{"a": 1}\n```';
    expect(safeParseJSON(input)).toEqual({ a: 1 });
  });

  it('extracts JSON object from surrounding text', () => {
    const input = 'Here is the result: {"a": 1} That is all.';
    expect(safeParseJSON(input)).toEqual({ a: 1 });
  });

  it('extracts JSON array from text', () => {
    const input = 'Result: [1, 2, 3]';
    expect(safeParseJSON(input)).toEqual([1, 2, 3]);
  });

  it('returns null for completely invalid text', () => {
    expect(safeParseJSON('this is not json at all')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(safeParseJSON('')).toBeNull();
  });
});

// ===== validateRegime =====

describe('validateRegime', () => {
  it('returns valid MacroRegime for complete input', () => {
    const result = validateRegime({
      label: 'Active Conflict',
      level: 'CRITICAL',
      subtitle: 'Strait of Hormuz',
      summary: 'Major conflict',
    });
    expect(result).toEqual({
      label: 'Active Conflict',
      level: 'CRITICAL',
      subtitle: 'Strait of Hormuz',
      summary: 'Major conflict',
    });
  });

  it('defaults level to MEDIUM for invalid level', () => {
    const result = validateRegime({ label: 'Test', level: 'INVALID' });
    expect(result?.level).toBe('MEDIUM');
  });

  it('returns null for null input', () => {
    expect(validateRegime(null)).toBeNull();
  });

  it('returns null for non-object input', () => {
    expect(validateRegime('string')).toBeNull();
  });

  it('defaults summary to "Analysis in progress." when missing', () => {
    const result = validateRegime({ label: 'Test' });
    expect(result?.summary).toBe('Analysis in progress.');
  });

  it('uses label as subtitle when subtitle is missing', () => {
    const result = validateRegime({ label: 'Escalation Watch' });
    expect(result?.subtitle).toBe('Escalation Watch');
  });
});

// ===== validateTrade =====

const validTradeInput = {
  ticker: 'zim',
  direction: 'LONG',
  thesis: 'Shipping disruption creates opportunity',
  conviction: 8,
  orderType: '2ND_ORDER',
  categories: ['SHIPPING'],
  timeHorizon: 'WEEKS',
  causalChain: [
    { label: 'Step 1', sentiment: 'negative' },
    { label: 'Step 2', sentiment: 'positive' },
    { label: 'Step 3', sentiment: 'positive' },
  ],
  breakers: ['Ceasefire', 'Market crash'],
  platforms: [{ name: 'Robinhood', instrument: 'ZIM' }],
  riskReward: { upside: 20, downside: 8, ratio: '2.5:1' },
};

describe('validateTrade', () => {
  it('returns valid TradeIdea for complete input', () => {
    const result = validateTrade(validTradeInput);
    expect(result).not.toBeNull();
    expect(result?.ticker).toBe('ZIM'); // uppercased
    expect(result?.direction).toBe('LONG');
    expect(result?.conviction).toBe(8);
  });

  it('uppercases ticker', () => {
    const result = validateTrade({ ...validTradeInput, ticker: 'zim' });
    expect(result?.ticker).toBe('ZIM');
  });

  it('returns null when ticker is missing', () => {
    expect(validateTrade({ ...validTradeInput, ticker: '' })).toBeNull();
  });

  it('returns null when direction is missing', () => {
    expect(validateTrade({ ...validTradeInput, direction: 'INVALID' })).toBeNull();
  });

  it('returns null when thesis is missing', () => {
    expect(validateTrade({ ...validTradeInput, thesis: '' })).toBeNull();
  });

  it('clamps conviction to 1-10', () => {
    expect(validateTrade({ ...validTradeInput, conviction: 0 })?.conviction).toBe(1);
    expect(validateTrade({ ...validTradeInput, conviction: 15 })?.conviction).toBe(10);
    expect(validateTrade({ ...validTradeInput, conviction: -5 })?.conviction).toBe(1);
  });

  it('defaults conviction to 5 for non-number', () => {
    expect(validateTrade({ ...validTradeInput, conviction: 'high' })?.conviction).toBe(5);
  });

  it('defaults orderType for invalid value', () => {
    const result = validateTrade({ ...validTradeInput, orderType: 'INVALID' });
    expect(result?.orderType).toBe('1ST_ORDER');
  });

  it('returns null when causalChain has fewer than 2 steps', () => {
    expect(validateTrade({
      ...validTradeInput,
      causalChain: [{ label: 'Only one', sentiment: 'positive' }],
    })).toBeNull();
  });

  it('caps causalChain at 6 steps', () => {
    const longChain = Array.from({ length: 8 }, (_, i) => ({
      label: `Step ${i}`, sentiment: 'positive',
    }));
    const result = validateTrade({ ...validTradeInput, causalChain: longChain });
    expect(result?.causalChain.length).toBe(6);
  });

  it('adds default breakers when fewer than 2', () => {
    const result = validateTrade({ ...validTradeInput, breakers: [] });
    expect(result?.breakers.length).toBeGreaterThanOrEqual(2);
  });

  it('adds default Robinhood platform when platforms empty', () => {
    const result = validateTrade({ ...validTradeInput, platforms: [] });
    expect(result?.platforms[0]?.name).toBe('Robinhood');
  });

  it('defaults empty categories to COMMODITIES', () => {
    const result = validateTrade({ ...validTradeInput, categories: [] });
    expect(result?.categories).toContain('COMMODITIES');
  });

  it('sets isCrowded true when orderType is CROWDED', () => {
    const result = validateTrade({ ...validTradeInput, orderType: 'CROWDED' });
    expect(result?.isCrowded).toBe(true);
  });

  it('returns null for null input', () => {
    expect(validateTrade(null)).toBeNull();
  });
});

// ===== validateTrades =====

describe('validateTrades', () => {
  it('filters out invalid trades from array', () => {
    const result = validateTrades([
      validTradeInput,
      { ticker: '', direction: 'LONG', thesis: 'bad' }, // invalid
      { ...validTradeInput, ticker: 'HACK' },
    ]);
    expect(result.length).toBe(2);
  });

  it('returns empty array for non-array input', () => {
    expect(validateTrades('not an array')).toEqual([]);
    expect(validateTrades(null)).toEqual([]);
    expect(validateTrades(undefined)).toEqual([]);
  });
});

// ===== validatePolymarketEnrichment =====

describe('validatePolymarketEnrichment', () => {
  const basePrediction: PolymarketPrediction = {
    id: 'pred_1',
    question: 'Will Iran attack Israel?',
    direction: 'YES',
    marketPrice: 45,
    aiEstimate: 0,
    conviction: 0,
    edge: 0,
    reasoning: '',
    resolvesIn: '2 weeks',
  };

  it('matches enrichment by ID', () => {
    const enrichments = [{ id: 'pred_1', aiEstimate: 60, conviction: 7, reasoning: 'Likely' }];
    const result = validatePolymarketEnrichment(enrichments, [basePrediction]);
    expect(result[0].aiEstimate).toBe(60);
    expect(result[0].conviction).toBe(7);
    expect(result[0].edge).toBe(15); // 60 - 45
  });

  it('matches enrichment by question text', () => {
    const enrichments = [{ question: 'will iran attack israel?', aiEstimate: 55, conviction: 6 }];
    const result = validatePolymarketEnrichment(enrichments, [basePrediction]);
    expect(result[0].aiEstimate).toBe(55);
  });

  it('falls back to index-based matching', () => {
    const enrichments = [{ aiEstimate: 70, conviction: 8 }];
    const result = validatePolymarketEnrichment(enrichments, [basePrediction]);
    expect(result[0].aiEstimate).toBe(70);
  });

  it('clamps aiEstimate to 0-100', () => {
    const enrichments = [{ id: 'pred_1', aiEstimate: 150, conviction: 5 }];
    const result = validatePolymarketEnrichment(enrichments, [basePrediction]);
    expect(result[0].aiEstimate).toBe(100);
  });

  it('clamps conviction to 1-10', () => {
    const enrichments = [{ id: 'pred_1', aiEstimate: 50, conviction: 15 }];
    const result = validatePolymarketEnrichment(enrichments, [basePrediction]);
    expect(result[0].conviction).toBe(10);
  });

  it('returns existing predictions unchanged for non-array enrichments', () => {
    const result = validatePolymarketEnrichment('invalid', [basePrediction]);
    expect(result).toEqual([basePrediction]);
  });
});
