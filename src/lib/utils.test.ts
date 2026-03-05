import { describe, it, expect, vi } from 'vitest';
import { formatPrice, formatPercent, formatEngagement, formatRelativeTime, cn, generateId } from './utils';

describe('formatPrice', () => {
  it('formats large prices with no decimals', () => {
    expect(formatPrice(71163)).toBe('71,163');
  });

  it('formats hundreds with 1 decimal', () => {
    expect(formatPrice(238.7)).toBe('238.7');
  });

  it('formats small prices with 2 decimals', () => {
    expect(formatPrice(28.31)).toBe('28.31');
  });

  it('formats sub-dollar with 4 decimals', () => {
    expect(formatPrice(0.0523)).toBe('0.0523');
  });
});

describe('formatPercent', () => {
  it('adds + prefix for positive values', () => {
    expect(formatPercent(2.75)).toBe('+2.75%');
  });

  it('keeps - prefix for negative values', () => {
    expect(formatPercent(-3.31)).toBe('-3.31%');
  });

  it('formats zero as +0.00%', () => {
    expect(formatPercent(0)).toBe('+0.00%');
  });
});

describe('formatEngagement', () => {
  it('formats millions with M suffix', () => {
    expect(formatEngagement(1500000)).toBe('1.5M');
  });

  it('formats thousands with K suffix', () => {
    expect(formatEngagement(15000)).toBe('15.0K');
  });

  it('returns small numbers as-is', () => {
    expect(formatEngagement(500)).toBe('500');
  });
});

describe('formatRelativeTime', () => {
  it('returns "just now" for recent timestamps', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('just now');
  });

  it('returns minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toBe('5m ago');
  });

  it('returns hours ago', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(threeHoursAgo)).toBe('3h ago');
  });

  it('returns days ago', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twoDaysAgo)).toBe('2d ago');
  });

  it('returns weeks ago', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twoWeeksAgo)).toBe('2w ago');
  });
});

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('filters out falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });

  it('returns empty string for no truthy values', () => {
    expect(cn(false, undefined, null)).toBe('');
  });
});

describe('generateId', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('contains underscore separator', () => {
    expect(generateId()).toContain('_');
  });

  it('generates unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});
