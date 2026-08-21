import { describe, expect, it } from 'vitest';
import { createConfiguredDiscovery } from './configured-discovery.js';

describe('configured discovery', () => {
  it('discovers through enabled configured feeds', async () => {
    const pipeline = createConfiguredDiscovery(
      [{ id: 'crypto', domain: 'crypto', service: 'exchange', baseUrl: 'https://crypto.example', enabled: true }],
      [{ domain: 'crypto', fetch: async () => [] }]
    );
    await expect(pipeline.discover()).resolves.toEqual({ opportunities: [], staleCount: 0, providerCount: 0 });
  });
});
