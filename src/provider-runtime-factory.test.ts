import { describe, expect, it } from 'vitest';
import { createConfiguredProviderRegistry } from './provider-runtime-factory.js';

const feed = (domain: 'crypto' | 'xstocks') => ({ domain, discover: async () => [] });

describe('configured provider runtime', () => {
  it('registers only enabled configured domains', async () => {
    const registry = createConfiguredProviderRegistry(
      [{ id: 'btc', domain: 'crypto', service: 'exchange', baseUrl: 'https://btc.example', enabled: true }, { id: 'stocks', domain: 'xstocks', service: 'broker', baseUrl: 'https://stocks.example', enabled: false }],
      [feed('crypto'), feed('xstocks')]
    );
    expect(await registry.discover()).toEqual([]);
    expect(registry.getHealth('live:crypto')).toEqual({ successes: 1, failures: 0, lastSuccessAt: expect.any(String) });
    expect(registry.getHealth('live:xstocks')).toBeUndefined();
  });
});
