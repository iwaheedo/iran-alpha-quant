import Parser from 'rss-parser';
import type { NewsItem } from '@/types';
import { TWITTER_ACCOUNTS } from '@/lib/constants';

const parser = new Parser({
  timeout: 8000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; IranAlphaQuant/1.0)',
  },
});

const RSSHUB_BASE_URL = process.env.RSSHUB_BASE_URL || 'http://localhost:1200';

function generateId(handle: string, title: string): string {
  const hash = Buffer.from(`${handle}:${title}`).toString('base64url').slice(0, 16);
  return `tw_${hash}`;
}

function detectPriority(title: string, handle: string): NewsItem['priority'] {
  const lower = title.toLowerCase();

  // Government accounts and headline bots = HIGH by default
  const highPriorityAccounts = [
    'realDonaldTrump', 'SecDef', 'StateDept', 'IsraPMO',
    'IranIntl', 'IsraelMFA', 'FirstSquawk', 'DeItaone', 'Fxhedgers', 'zaborheadlines',
  ];

  const breakingKeywords = ['breaking', 'just in', 'urgent', 'flash', '🚨', '⚡'];

  if (breakingKeywords.some(kw => lower.includes(kw))) {
    return 'BREAKING';
  }

  if (highPriorityAccounts.includes(handle)) {
    return 'HIGH';
  }

  return 'NORMAL';
}

function extractEngagement(description: string): { likes?: number; reposts?: number } | undefined {
  // RSSHub sometimes includes engagement data in description
  // Format varies — try common patterns
  const likes = description.match(/(\d+(?:,\d+)*)\s*(?:likes?|♥|❤)/i);
  const reposts = description.match(/(\d+(?:,\d+)*)\s*(?:retweets?|reposts?|🔁)/i);

  if (!likes && !reposts) return undefined;

  return {
    likes: likes ? parseInt(likes[1].replace(/,/g, '')) : undefined,
    reposts: reposts ? parseInt(reposts[1].replace(/,/g, '')) : undefined,
  };
}

function extractTags(text: string): string[] {
  const tags: string[] = [];
  const lower = text.toLowerCase();

  const tagMap: Record<string, string> = {
    oil: 'OIL', crude: 'OIL', '$wti': 'OIL', '$cl': 'OIL',
    iran: 'IRAN', iranian: 'IRAN',
    israel: 'ISRAEL', '$spy': 'SPY',
    gold: 'GOLD', '$gld': 'GOLD', '$gc': 'GOLD',
    shipping: 'SHIPPING', hormuz: 'SHIPPING',
    sanction: 'SANCTIONS',
    nuclear: 'NUCLEAR',
    military: 'MILITARY', defense: 'DEFENSE',
    bitcoin: 'BTC', '$btc': 'BTC',
    wheat: 'WHEAT', agriculture: 'AGRICULTURE',
  };

  for (const [keyword, tag] of Object.entries(tagMap)) {
    if (lower.includes(keyword) && !tags.includes(tag)) {
      tags.push(tag);
    }
  }

  // Also extract $TICKER mentions
  const tickers = text.match(/\$[A-Z]{1,5}/g);
  if (tickers) {
    for (const t of tickers.slice(0, 3)) {
      const sym = t.slice(1);
      if (!tags.includes(sym)) tags.push(sym);
    }
  }

  return tags.slice(0, 5);
}

function cleanTweetText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Strip HTML
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, 280);
}

export async function fetchTwitterNews(): Promise<NewsItem[]> {
  const allItems: NewsItem[] = [];

  // Check if RSSHub is available first
  try {
    const healthCheck = await fetch(`${RSSHUB_BASE_URL}`, { signal: AbortSignal.timeout(3000) });
    if (!healthCheck.ok) {
      console.warn('[Twitter] RSSHub not available, skipping Twitter fetch');
      return [];
    }
  } catch {
    console.warn('[Twitter] RSSHub not reachable at', RSSHUB_BASE_URL);
    return [];
  }

  // Fetch in batches of 5 to avoid overwhelming RSSHub
  const batchSize = 5;
  for (let i = 0; i < TWITTER_ACCOUNTS.length; i += batchSize) {
    const batch = TWITTER_ACCOUNTS.slice(i, i + batchSize);

    const batchPromises = batch.map(async (handle) => {
      try {
        const url = `${RSSHUB_BASE_URL}/twitter/user/${handle}`;
        const feed = await parser.parseURL(url);
        const items: NewsItem[] = [];

        for (const entry of (feed.items || []).slice(0, 5)) {
          const rawText = entry.contentSnippet || entry.content || entry.title || '';
          const cleanText = cleanTweetText(rawText);
          if (!cleanText || cleanText.length < 10) continue;

          const pubDate = entry.pubDate
            ? new Date(entry.pubDate).toISOString()
            : new Date().toISOString();

          items.push({
            id: generateId(handle, cleanText.slice(0, 50)),
            title: cleanText,
            source: `@${handle}`,
            sourceType: 'TWITTER',
            priority: detectPriority(cleanText, handle),
            timestamp: pubDate,
            relativeTime: '',
            tags: extractTags(cleanText),
            engagement: entry.content ? extractEngagement(entry.content) : undefined,
            url: entry.link || undefined,
          });
        }

        return items;
      } catch (err) {
        console.warn(`[Twitter] Failed to fetch @${handle}:`, err instanceof Error ? err.message : err);
        return [];
      }
    });

    const results = await Promise.allSettled(batchPromises);
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allItems.push(...result.value);
      }
    }

    // Small delay between batches
    if (i + batchSize < TWITTER_ACCOUNTS.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // Sort by timestamp newest first
  allItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  console.log(`[Twitter] Fetched ${allItems.length} tweets from ${TWITTER_ACCOUNTS.length} accounts`);
  return allItems;
}
