import { describe, expect, it } from 'vitest';
import { createLiveProviderFeeds, liveProviderDefinitionsFromEnv } from './live-provider-suite.js';

describe('live provider suite', () => {
  it('discovers configured domains from environment', () => {
    const definitions = liveProviderDefinitionsFromEnv({
      SOVEREIGN_CRYPTO_URL: 'https://example.test/crypto',
      SOVEREIGN_POKEMON_URL: 'https://example.test/pokemon'
    });
    expect(definitions.map(item => item.domain)).toEqual(['crypto', 'pokemon']);
  });

  it('rejects duplicate domains', () => {
    expect(() => createLiveProviderFeeds([
      { id: 'a', name: 'a', domain: 'crypto', url: 'https://example.test/a' },
      { id: 'b', name: 'b', domain: 'crypto', url: 'https://example.test/b' }
    ])).toThrow(/duplicate live feed domain/);
  });
});
