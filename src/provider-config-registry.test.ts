import { describe, expect, it } from 'vitest';
import { OpportunityProviderRegistry } from './opportunity-provider-registry.js';
import { registerConfiguredLiveProviders } from './provider-config-registry.js';

const feed = (domain: string) => ({
  domain,
  discover: async () => []
}) as any;

describe('provider config registry', () => {
  it('registers only enabled configured domains', async () => {
    const registry = new OpportunityProviderRegistry();
    registerConfiguredLiveProviders(registry, [
      { id: 'btc', domain: 'crypto', service: 'exchange', baseUrl: 'https://btc.example', enabled: true },
      { id: 'x', domain: 'xstocks', service: 'broker', baseUrl: 'https://x.example', enabled: false }
    ], [feed('crypto'), feed('xstocks'), feed('collectibles')]);
    expect((await registry.discover()).length).toBe(0);
    expect(registry.getHealth('live:crypto')).toBeDefined();
    expect(registry.getHealth('live:xstocks')).toBeUndefined();
    expect(registry.getHealth('live:collectibles')).toBeUndefined();
  });
});
