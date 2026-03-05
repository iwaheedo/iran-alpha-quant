// ===== Enums =====

export type TradeDirection = 'LONG' | 'SHORT';

export type TimeHorizon = 'DAYS' | 'WEEKS' | 'MONTHS' | 'YEAR_PLUS';

export type Category =
  | 'SHIPPING'
  | 'CURRENCY'
  | 'COMMODITIES'
  | 'ENERGY'
  | 'AGRICULTURE'
  | 'DEFENSE'
  | 'EMERGING_MARKETS'
  | 'CONSUMER';

export type Priority = 'BREAKING' | 'HIGH' | 'NORMAL';

export type OrderType = '1ST_ORDER' | '2ND_ORDER' | '3RD_ORDER' | 'CROWDED';

export type NewsSource = 'GOOGLE_NEWS' | 'TWITTER';

export type RegimeLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// ===== Core Interfaces =====

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  sourceType: NewsSource;
  priority: Priority;
  timestamp: string;
  relativeTime: string;
  tags: string[];
  engagement?: {
    likes?: number;
    reposts?: number;
  };
  url?: string;
}

export interface CausalStep {
  label: string;
  sentiment: 'negative' | 'neutral' | 'positive';
}

export interface TradePlatform {
  name: 'Robinhood' | 'Trading212' | 'Hyperliquid' | 'Lighter' | 'Ostrium';
  instrument: string;
  details?: string;
}

export interface TradeIdea {
  id: string;
  ticker: string;
  fullName: string;
  direction: TradeDirection;
  conviction: number;
  orderType: OrderType;
  categories: Category[];
  timeHorizon: TimeHorizon;
  horizonLabel: string;
  currentPrice: number;
  priceChange: number;
  thesis: string;
  causalChain: CausalStep[];
  pricedIn: string;
  edge: string;
  riskReward: {
    upside: number;
    downside: number;
    ratio: string;
  };
  entry: string;
  invalidation: string;
  breakers: string[];
  platforms: TradePlatform[];
  isCrowded?: boolean;
  createdAt: string;
  newsIds: string[];
}

export interface PolymarketPrediction {
  id: string;
  question: string;
  direction: 'YES' | 'NO';
  marketPrice: number;
  aiEstimate: number;
  edge: number;
  conviction: number;
  resolvesIn: string;
  reasoning?: string;
  conditionId?: string;
}

export interface MacroRegime {
  label: string;
  level: RegimeLevel;
  subtitle: string;
  summary: string;
}

export interface TickerPrice {
  symbol: string;
  price: number;
  changePercent: number;
}

export interface AnalysisRun {
  id: string;
  startedAt: string;
  completedAt?: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  newsCount: number;
  tradesGenerated: number;
  error?: string;
}

// ===== Analysis Response =====

export interface AnalysisResponse {
  regime: MacroRegime;
  trades: TradeIdea[];
  predictions: PolymarketPrediction[];
  runId: string;
}
