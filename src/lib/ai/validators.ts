import type { TradeIdea, MacroRegime, PolymarketPrediction, CausalStep, TradePlatform } from '@/types';

// ===== JSON Parsing =====

export function safeParseJSON(text: string): unknown {
  // Try direct parse
  try {
    return JSON.parse(text);
  } catch {
    // Strip markdown code fences if present
    const cleaned = text
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      // Try to extract JSON from text
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          // Also try array format
        }
      }

      const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        try {
          return JSON.parse(arrayMatch[0]);
        } catch {
          // Give up
        }
      }

      console.error('[Validator] Failed to parse JSON from AI response');
      return null;
    }
  }
}

// ===== Regime Validation =====

const VALID_REGIME_LABELS = [
  'Escalation Watch', 'Active Conflict', 'De-escalation',
  'Sanctions Tightening', 'Diplomacy Mode',
];

const VALID_REGIME_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export function validateRegime(data: unknown): MacroRegime | null {
  if (!data || typeof data !== 'object') return null;

  const d = data as Record<string, unknown>;

  const label = typeof d.label === 'string' ? d.label : 'Escalation Watch';
  const level = typeof d.level === 'string' && VALID_REGIME_LEVELS.includes(d.level)
    ? d.level as MacroRegime['level']
    : 'MEDIUM';
  const subtitle = typeof d.subtitle === 'string' ? d.subtitle : '';
  const summary = typeof d.summary === 'string' ? d.summary : '';

  // At minimum need a label
  if (!label) return null;

  return {
    label: VALID_REGIME_LABELS.includes(label) ? label : label,
    level,
    subtitle: subtitle || label,
    summary: summary || 'Analysis in progress.',
  };
}

// ===== Trade Validation =====

const VALID_DIRECTIONS = ['LONG', 'SHORT'];
const VALID_ORDER_TYPES = ['1ST_ORDER', '2ND_ORDER', '3RD_ORDER', 'CROWDED'];
const VALID_CATEGORIES = [
  'SHIPPING', 'CURRENCY', 'COMMODITIES', 'ENERGY',
  'AGRICULTURE', 'DEFENSE', 'EMERGING_MARKETS', 'CONSUMER',
];
const VALID_TIME_HORIZONS = ['DAYS', 'WEEKS', 'MONTHS', 'YEAR_PLUS'];
const VALID_SENTIMENTS = ['negative', 'neutral', 'positive'];
const VALID_PLATFORMS = ['Robinhood', 'Trading212', 'Hyperliquid', 'Lighter', 'Ostrium'];

function cleanCausalLabel(label: string): string {
  // Strip news IDs like (gn_SW5kdXN0cnkgZG91YnRz) or (pm_xxx) that AI may copy-paste
  return label
    .replace(/\s*\((?:gn|pm|tw)_[A-Za-z0-9_-]+\)\s*/g, '')
    .trim();
}

function validateCausalChain(chain: unknown): CausalStep[] {
  if (!Array.isArray(chain)) return [];

  return chain
    .filter((step): step is Record<string, unknown> => typeof step === 'object' && step !== null)
    .map(step => ({
      label: cleanCausalLabel(typeof step.label === 'string' ? step.label : String(step.label || '')),
      sentiment: VALID_SENTIMENTS.includes(step.sentiment as string)
        ? step.sentiment as CausalStep['sentiment']
        : 'neutral',
    }))
    .filter(step => step.label.length > 0)
    .slice(0, 6);
}

function validatePlatforms(platforms: unknown): TradePlatform[] {
  if (!Array.isArray(platforms)) return [];

  return platforms
    .filter((p): p is Record<string, unknown> => typeof p === 'object' && p !== null)
    .map(p => ({
      name: VALID_PLATFORMS.includes(p.name as string)
        ? p.name as TradePlatform['name']
        : 'Robinhood' as TradePlatform['name'],
      instrument: typeof p.instrument === 'string' ? p.instrument : '',
      details: typeof p.details === 'string' ? p.details : undefined,
    }))
    .filter(p => p.instrument.length > 0);
}

export function validateTrade(data: unknown): TradeIdea | null {
  if (!data || typeof data !== 'object') return null;

  const d = data as Record<string, unknown>;

  // Required fields
  const ticker = typeof d.ticker === 'string' ? d.ticker.toUpperCase() : '';
  const direction = VALID_DIRECTIONS.includes(d.direction as string)
    ? d.direction as TradeIdea['direction']
    : null;
  const thesis = typeof d.thesis === 'string' ? d.thesis : '';

  if (!ticker || !direction || !thesis) {
    console.warn(`[Validator] Skipping trade — missing required fields (ticker=${ticker}, direction=${direction})`);
    return null;
  }

  // Conviction: clamp to 1-10
  const conviction = typeof d.conviction === 'number'
    ? Math.max(1, Math.min(10, Math.round(d.conviction)))
    : 5;

  // Order type
  const orderType = VALID_ORDER_TYPES.includes(d.orderType as string)
    ? d.orderType as TradeIdea['orderType']
    : '1ST_ORDER';

  // Categories
  const rawCats = Array.isArray(d.categories) ? d.categories : [];
  const categories = rawCats
    .filter((c): c is string => typeof c === 'string' && VALID_CATEGORIES.includes(c))
    .slice(0, 4) as TradeIdea['categories'];
  if (categories.length === 0) categories.push('COMMODITIES');

  // Time horizon
  const timeHorizon = VALID_TIME_HORIZONS.includes(d.timeHorizon as string)
    ? d.timeHorizon as TradeIdea['timeHorizon']
    : 'DAYS';

  // Causal chain — require at least 2 steps
  const causalChain = validateCausalChain(d.causalChain);
  if (causalChain.length < 2) {
    console.warn(`[Validator] Skipping trade ${ticker} — causal chain too short (${causalChain.length})`);
    return null;
  }

  // Risk/reward
  const rr = typeof d.riskReward === 'object' && d.riskReward ? d.riskReward as Record<string, unknown> : {};
  const upside = typeof rr.upside === 'number' ? Math.abs(rr.upside) : 10;
  const downside = typeof rr.downside === 'number' ? Math.abs(rr.downside) : 5;
  const ratio = typeof rr.ratio === 'string' ? rr.ratio : `${(upside / downside).toFixed(1)}:1`;

  // Breakers — require at least 2
  const rawBreakers = Array.isArray(d.breakers) ? d.breakers : [];
  const breakers = rawBreakers
    .filter((b): b is string => typeof b === 'string' && b.length > 0)
    .slice(0, 5);
  if (breakers.length < 2) {
    console.warn(`[Validator] Trade ${ticker} has insufficient breakers (${breakers.length}), adding defaults`);
    while (breakers.length < 2) {
      breakers.push(breakers.length === 0 ? 'Unexpected policy reversal' : 'Market regime change');
    }
  }

  // Platforms
  const platforms = validatePlatforms(d.platforms);
  if (platforms.length === 0) {
    platforms.push({ name: 'Robinhood', instrument: ticker });
  }

  return {
    id: typeof d.id === 'string' ? d.id : `trade_${Date.now()}_${ticker}`,
    ticker,
    fullName: typeof d.fullName === 'string' ? d.fullName : ticker,
    direction,
    conviction,
    orderType,
    categories,
    timeHorizon,
    horizonLabel: typeof d.horizonLabel === 'string' ? d.horizonLabel : timeHorizon,
    currentPrice: typeof d.currentPrice === 'number' ? d.currentPrice : 0,
    priceChange: typeof d.priceChange === 'number' ? d.priceChange : 0,
    thesis,
    causalChain,
    pricedIn: typeof d.pricedIn === 'string' ? d.pricedIn : 'General market sentiment',
    edge: typeof d.edge === 'string' ? d.edge : thesis,
    riskReward: { upside, downside, ratio },
    entry: typeof d.entry === 'string' ? d.entry : 'At current levels',
    invalidation: typeof d.invalidation === 'string' ? d.invalidation : 'Stop loss on reversal',
    breakers,
    platforms,
    isCrowded: d.isCrowded === true || orderType === 'CROWDED',
    createdAt: typeof d.createdAt === 'string' ? d.createdAt : new Date().toISOString(),
    newsIds: Array.isArray(d.newsIds) ? d.newsIds.filter((id): id is string => typeof id === 'string') : [],
  };
}

export function validateTrades(data: unknown): TradeIdea[] {
  if (!Array.isArray(data)) return [];

  const validated = data
    .map(validateTrade)
    .filter((t): t is TradeIdea => t !== null);

  console.log(`[Validator] Validated ${validated.length}/${data.length} trades`);
  return validated;
}

// ===== Polymarket Validation =====

export function validatePolymarketEnrichment(
  enrichments: unknown,
  existing: PolymarketPrediction[]
): PolymarketPrediction[] {
  // AI with json_object mode may wrap array in an object like { predictions: [...] }
  let items = enrichments;
  if (!Array.isArray(items) && typeof items === 'object' && items !== null) {
    const obj = items as Record<string, unknown>;
    const arrVal = Object.values(obj).find(v => Array.isArray(v));
    if (arrVal) {
      items = arrVal;
    } else {
      return existing;
    }
  }
  if (!Array.isArray(items)) return existing;
  const enrichmentArray = items as unknown[];

  // Build lookup maps — by ID and by question text (normalized)
  const enrichById = new Map<string, Record<string, unknown>>();
  const enrichByQuestion = new Map<string, Record<string, unknown>>();
  const enrichByIndex = new Map<number, Record<string, unknown>>();

  for (let i = 0; i < enrichmentArray.length; i++) {
    const e = enrichmentArray[i];
    if (typeof e !== 'object' || e === null) continue;
    const rec = e as Record<string, unknown>;

    if (typeof rec.id === 'string') {
      enrichById.set(rec.id, rec);
    }
    if (typeof rec.question === 'string') {
      enrichByQuestion.set(rec.question.toLowerCase().trim(), rec);
    }
    enrichByIndex.set(i, rec);
  }

  return existing.map((pred, idx) => {
    // Try matching: by ID first, then by question text, then by index position
    let enrichment = enrichById.get(pred.id);
    if (!enrichment) {
      enrichment = enrichByQuestion.get(pred.question.toLowerCase().trim());
    }
    if (!enrichment && enrichByIndex.has(idx)) {
      enrichment = enrichByIndex.get(idx);
    }
    if (!enrichment) return pred;

    const aiEstimate = typeof enrichment.aiEstimate === 'number'
      ? Math.max(0, Math.min(100, Math.round(enrichment.aiEstimate)))
      : pred.aiEstimate;

    const conviction = typeof enrichment.conviction === 'number'
      ? Math.max(1, Math.min(10, Math.round(enrichment.conviction)))
      : pred.conviction;

    const edge = aiEstimate - pred.marketPrice;

    return {
      ...pred,
      aiEstimate,
      conviction,
      edge,
      reasoning: typeof enrichment.reasoning === 'string' ? enrichment.reasoning : pred.reasoning,
    };
  });
}
