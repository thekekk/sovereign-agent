import { describe, expect, it } from 'vitest';
import { createLiveFeedRuntime } from './live-feed-runtime.js';

describe('live feed runtime', () => {
  it('registers configured feeds only', () => {
    const runtime = createLiveFeedRuntime({
      AGENT_CRYPTO_FEED_URL: 'https://example.test/crypto',
      AGENT_SOCIAL_HYPE_FEED_URL: 'https://example.test/hype'
    });
    expect(runtime.registry.domains()).toEqual(['crypto', 'social-hype']);
    expect(runtime.adapters).toHaveLength(2);
  });

  it('starts with no external feeds when none are configured', () => {
    const runtime = createLiveFeedRuntime({});
    expect(runtime.registry.domains()).toEqual([]);
    expect(runtime.adapters).toHaveLength(0);
  });
});
