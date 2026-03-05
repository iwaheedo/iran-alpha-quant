import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies before imports
vi.mock('@/lib/db', () => ({
  isDbHealthy: vi.fn(() => true),
  getLatestTrades: vi.fn(() => []),
  getLatestNews: vi.fn(() => []),
  getLatestPrices: vi.fn(() => []),
  getLatestRegime: vi.fn(() => null),
  getLatestPredictions: vi.fn(() => []),
}));

vi.mock('@/lib/ai/analyzer', () => ({
  runFullAnalysis: vi.fn(() => ({
    regime: null,
    trades: [],
    predictions: [],
    news: [],
    prices: [],
    runId: 'test_run',
  })),
  analyzeSpecificNews: vi.fn(() => []),
}));

vi.mock('@/lib/fetchers', () => ({
  fetchAllNews: vi.fn(() => []),
  fetchAllPrices: vi.fn(() => []),
  fetchPolymarket: vi.fn(() => []),
}));

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options as never);
}

describe('/api/health', () => {
  it('returns 200 with status ok', async () => {
    const { GET } = await import('@/app/api/health/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('db');
  });
});

describe('/api/analyze', () => {
  beforeEach(() => {
    vi.stubEnv('API_SECRET', 'test-secret-123');
  });

  it('returns 401 without auth token', async () => {
    // Re-import to pick up env change
    vi.resetModules();
    const { POST } = await import('@/app/api/analyze/route');
    const request = makeRequest('http://localhost:3000/api/analyze', { method: 'POST' });
    const response = await POST(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 200 with valid auth token', async () => {
    vi.resetModules();
    const { POST } = await import('@/app/api/analyze/route');
    const request = makeRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-secret-123' },
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });
});

describe('/api/analyze-news', () => {
  beforeEach(() => {
    vi.stubEnv('API_SECRET', 'test-secret-456');
  });

  it('returns 401 without auth token', async () => {
    vi.resetModules();
    const { POST } = await import('@/app/api/analyze-news/route');
    const request = makeRequest('http://localhost:3000/api/analyze-news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newsId: 'test_123' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('returns 400 with missing newsId', async () => {
    vi.resetModules();
    vi.stubEnv('API_SECRET', '');
    const { POST } = await import('@/app/api/analyze-news/route');
    const request = makeRequest('http://localhost:3000/api/analyze-news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 200 with valid auth and newsId', async () => {
    vi.resetModules();
    vi.stubEnv('API_SECRET', '');
    const { POST } = await import('@/app/api/analyze-news/route');
    const request = makeRequest('http://localhost:3000/api/analyze-news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newsId: 'test_news_1' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });
});
