import Parser from 'rss-parser';
import type { NewsItem } from '@/types';
import { NEWS_SEARCH_QUERIES } from '@/lib/constants';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; IranAlphaQuant/1.0)',
  },
});

// Priority sources — if the title/source contains these, bump to HIGH
const HIGH_PRIORITY_SOURCES = [
  'reuters', 'bloomberg', 'financial times', 'ft.com', 'wsj',
  'associated press', 'ap news', 'bbc', 'al jazeera',
];

const BREAKING_KEYWORDS = [
  'breaking', 'just in', 'urgent', 'flash',
  'developing', 'exclusive',
];

function generateId(title: string, source: string): string {
  const hash = Buffer.from(`${title}:${source}`).toString('base64url').slice(0, 16);
  return `gn_${hash}`;
}

function detectPriority(title: string, source: string): NewsItem['priority'] {
  const lower = `${title} ${source}`.toLowerCase();

  if (BREAKING_KEYWORDS.some(kw => lower.includes(kw))) {
    return 'BREAKING';
  }

  if (HIGH_PRIORITY_SOURCES.some(src => lower.includes(src))) {
    return 'HIGH';
  }

  return 'NORMAL';
}

function extractTags(title: string): string[] {
  const tags: string[] = [];
  const lower = title.toLowerCase();

  const tagMap: Record<string, string> = {
    oil: 'OIL', crude: 'OIL', petroleum: 'OIL', opec: 'OPEC',
    iran: 'IRAN', tehran: 'IRAN', iranian: 'IRAN',
    israel: 'ISRAEL', idf: 'ISRAEL',
    nuclear: 'NUCLEAR', enrichment: 'NUCLEAR',
    sanction: 'SANCTIONS', embargo: 'SANCTIONS',
    shipping: 'SHIPPING', hormuz: 'SHIPPING', tanker: 'SHIPPING',
    military: 'MILITARY', strike: 'MILITARY', defense: 'DEFENSE',
    gold: 'GOLD', wheat: 'WHEAT', food: 'FOOD',
    dollar: 'USD', treasury: 'BONDS',
  };

  for (const [keyword, tag] of Object.entries(tagMap)) {
    if (lower.includes(keyword) && !tags.includes(tag)) {
      tags.push(tag);
    }
  }

  return tags.slice(0, 5);
}

function deduplicateByTitle(items: NewsItem[]): NewsItem[] {
  const seen = new Map<string, NewsItem>();

  for (const item of items) {
    // Normalize: lowercase, remove punctuation, collapse whitespace
    const normalized = item.title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Use first 60 chars as dedup key (catches near-duplicates)
    const key = normalized.slice(0, 60);

    if (!seen.has(key)) {
      seen.set(key, item);
    } else {
      // Keep the higher-priority version
      const existing = seen.get(key)!;
      const priorityRank = { BREAKING: 0, HIGH: 1, NORMAL: 2 };
      if (priorityRank[item.priority] < priorityRank[existing.priority]) {
        seen.set(key, item);
      }
    }
  }

  return Array.from(seen.values());
}

export async function fetchGoogleNews(): Promise<NewsItem[]> {
  const allItems: NewsItem[] = [];

  const fetchPromises = NEWS_SEARCH_QUERIES.map(async (query) => {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;

      const feed = await parser.parseURL(url);
      const items: NewsItem[] = [];

      for (const entry of (feed.items || []).slice(0, 10)) {
        const title = entry.title?.replace(/ - .*$/, '').trim() || '';
        if (!title) continue;

        // Extract the actual source from Google News format "Title - Source"
        const sourcePart = entry.title?.match(/ - ([^-]+)$/)?.[1]?.trim() || 'Google News';
        const pubDate = entry.pubDate ? new Date(entry.pubDate).toISOString() : new Date().toISOString();

        items.push({
          id: generateId(title, sourcePart),
          title,
          source: sourcePart,
          sourceType: 'GOOGLE_NEWS',
          priority: detectPriority(title, sourcePart),
          timestamp: pubDate,
          relativeTime: '', // Will be computed when read from DB
          tags: extractTags(title),
          url: entry.link || undefined,
        });
      }

      return items;
    } catch (err) {
      console.warn(`[GoogleNews] Failed to fetch query "${query}":`, err instanceof Error ? err.message : err);
      return [];
    }
  });

  const results = await Promise.allSettled(fetchPromises);

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
    }
  }

  // Deduplicate across all queries
  const deduped = deduplicateByTitle(allItems);

  // Sort by timestamp (newest first)
  deduped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  console.log(`[GoogleNews] Fetched ${deduped.length} unique articles from ${NEWS_SEARCH_QUERIES.length} queries`);
  return deduped;
}
