import { describe, expect, it } from 'vitest';
import { loadProviderConfigs } from './provider-config.js';

describe('provider config', () => {
  it('loads multiple providers from environment', () => {
    expect(loadProviderConfigs({ SOVEREIGN_PROVIDERS: 'btc|crypto|exchange|https://btc.example;xstocks|xstocks|broker|https://xstocks.example;pokemon|collectibles|marketplace|https://pokemon.example' })).toEqual([
      { id: 'btc', domain: 'crypto', service: 'exchange', baseUrl: 'https://btc.example', enabled: true },
      { id: 'xstocks', domain: 'xstocks', service: 'broker', baseUrl: 'https://xstocks.example', enabled: true },
      { id: 'pokemon', domain: 'collectibles', service: 'marketplace', baseUrl: 'https://pokemon.example', enabled: true }
    ]);
  });

  it('returns no providers when unset', () => expect(loadProviderConfigs({})).toEqual([]));

  it('rejects incomplete provider entries', () => expect(() => loadProviderConfigs({ SOVEREIGN_PROVIDERS: 'btc|crypto|exchange' })).toThrow());
});
