import type { Category, TimeHorizon } from '@/types';

// ===== Tracked Symbols for Price Ticker =====

export const TRACKED_SYMBOLS: { symbol: string; label: string; finnhubSymbol?: string; yahooSymbol?: string }[] = [
  { symbol: 'WTI', label: 'WTI', finnhubSymbol: 'CL', yahooSymbol: 'CL=F' },
  { symbol: 'BRENT', label: 'BRENT', finnhubSymbol: 'BZ', yahooSymbol: 'BZ=F' },
  { symbol: 'GOLD', label: 'GOLD', finnhubSymbol: 'GC', yahooSymbol: 'GC=F' },
  { symbol: 'DXY', label: 'DXY', yahooSymbol: 'DX-Y.NYB' },
  { symbol: 'ZIM', label: 'ZIM', finnhubSymbol: 'ZIM', yahooSymbol: 'ZIM' },
  { symbol: 'ITA', label: 'ITA', finnhubSymbol: 'ITA', yahooSymbol: 'ITA' },
  { symbol: 'EEM', label: 'EEM', finnhubSymbol: 'EEM', yahooSymbol: 'EEM' },
  { symbol: 'TLT', label: 'TLT', finnhubSymbol: 'TLT', yahooSymbol: 'TLT' },
  { symbol: 'SPY', label: 'SPY', finnhubSymbol: 'SPY', yahooSymbol: 'SPY' },
  { symbol: 'BTC', label: 'BTC', finnhubSymbol: 'BINANCE:BTCUSDT', yahooSymbol: 'BTC-USD' },
  { symbol: 'WEAT', label: 'WEAT', finnhubSymbol: 'WEAT', yahooSymbol: 'WEAT' },
  { symbol: 'DBA', label: 'DBA', finnhubSymbol: 'DBA', yahooSymbol: 'DBA' },
];

// ===== Category Display Config =====

export const CATEGORY_CONFIG: Record<Category, { label: string; colorClass: string; bgClass: string }> = {
  SHIPPING: { label: 'Shipping', colorClass: 'text-tag-shipping', bgClass: 'bg-tag-shipping/8 border-tag-shipping/30' },
  CURRENCY: { label: 'Currency', colorClass: 'text-tag-currency', bgClass: 'bg-tag-currency/8 border-tag-currency/30' },
  EMERGING_MARKETS: { label: 'Emerging Mkts', colorClass: 'text-tag-em', bgClass: 'bg-tag-em/8 border-tag-em/30' },
  COMMODITIES: { label: 'Commodities', colorClass: 'text-tag-commodity', bgClass: 'bg-tag-commodity/8 border-tag-commodity/30' },
  ENERGY: { label: 'Energy', colorClass: 'text-tag-energy', bgClass: 'bg-tag-energy/8 border-tag-energy/30' },
  AGRICULTURE: { label: 'Agriculture', colorClass: 'text-tag-agriculture', bgClass: 'bg-tag-agriculture/8 border-tag-agriculture/30' },
  DEFENSE: { label: 'Defense', colorClass: 'text-tag-defense', bgClass: 'bg-tag-defense/8 border-tag-defense/30' },
  CONSUMER: { label: 'Consumer', colorClass: 'text-tag-consumer', bgClass: 'bg-tag-consumer/8 border-tag-consumer/30' },
};

// ===== Time Horizon Options =====

export const TIME_HORIZON_OPTIONS: { value: TimeHorizon | 'ALL'; label: string }[] = [
  { value: 'DAYS', label: 'Days' },
  { value: 'WEEKS', label: 'Weeks' },
  { value: 'MONTHS', label: 'Months' },
  { value: 'YEAR_PLUS', label: '1 Year+' },
  { value: 'ALL', label: 'All' },
];

// ===== Google News RSS Queries =====

export const NEWS_SEARCH_QUERIES = [
  'Iran strike attack today',
  'Iran Israel strike breaking',
  'US Iran military attack latest',
  'Strait of Hormuz attack today',
  'Iran nuclear IAEA breaking',
  'Qatar Iran negotiations ceasefire',
  'Iran sanctions latest breaking',
  'Iran missile drone attack',
  'IRGC military operation',
  'Iran proxy Hezbollah Houthi attack',
];

// ===== Twitter/X Accounts to Monitor =====

export const TWITTER_ACCOUNTS = [
  // Breaking news / government
  'realDonaldTrump',
  'SecDef',
  'StateDept',
  'IsraPMO',
  'IranIntl',
  'IsraelMFA',
  // Headline bots
  'DeItaone',
  'Fxhedgers',
  'zaborheadlines',
  // Macro analysts
  'KobeissiLetter',
  'unusual_whales',
  'MacroAlf',
  'shanaka86',
  // OSINT / conflict
  'sentdefender',
  'IntelCrab',
  'ByzGeneral',
  'GRDecter',
  // Traders
  'WallStJesus',
  'DarioCpx',
  'MarketRebels',
  // Prediction markets & alpha
  'Polymarket',
  'NoAlphaLimits',
  'burrytracker',
  'BullTheoryio',
  // Macro / contrarian
  'zerohedge',
];

// ===== Full Watchlist =====

export const WATCHLIST = {
  energy: ['USO', 'XLE', 'OIH', 'XOP', 'VDE', 'CVX', 'XOM', 'OXY', 'SLB', 'HAL'],
  defense: ['ITA', 'PPA', 'LMT', 'RTX', 'NOC', 'GD', 'BA', 'HII', 'LHX'],
  shipping: ['ZIM', 'GOGL', 'SBLK', 'DAC', 'BDRY'],
  currencies: ['UUP', 'FXE', 'FXY', 'FXB', 'UDN'],
  commodities: ['GLD', 'SLV', 'DBA', 'WEAT', 'CORN', 'DBC', 'USO'],
  safeHaven: ['TLT', 'SHY', 'IEF', 'GLD'],
  em: ['EEM', 'VWO', 'EWZ', 'EWJ', 'INDA', 'EZA'],
  consumer: ['DLTR', 'DG', 'WMT', 'COST'],
  agriculture: ['ADM', 'BG', 'DE', 'MOS', 'NTR'],
  broad: ['SPY', 'QQQ', 'IWM', 'DIA'],
  crypto: ['BTC', 'ETH', 'SOL'],
  defiPerps: ['WTI-USD', 'GOLD-USD', 'EUR-USD', 'GBP-USD', 'JPY-USD'],
};

// ===== Platform URLs =====

export const PLATFORM_URLS: Record<string, string> = {
  Robinhood: 'https://robinhood.com',
  Trading212: 'https://www.trading212.com',
  Hyperliquid: 'https://app.hyperliquid.xyz',
  Lighter: 'https://app.lighter.xyz',
  Ostrium: 'https://app.ostrium.io',
};
