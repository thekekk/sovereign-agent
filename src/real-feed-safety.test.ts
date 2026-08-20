import { describe, expect, it } from 'vitest';
import { HttpOpportunityFeed } from './http-opportunity-feed.js';

describe('real feed safety boundary', () => {
  it('rejects malformed feed payloads without throwing from validation', () => {
    const feed = new HttpOpportunityFeed({ domain: 'crypto', url: 'https://example.test', timeoutMs: 1000 });
    expect((feed as any).isSignal({ id: 'x' })).toBe(false);
  });

  it('requires a positive timeout', () => {
    expect(() => new HttpOpportunityFeed({ domain: 'crypto', url: 'https://example.test', timeoutMs: 0 })).toThrow();
  });
});
