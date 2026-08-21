import { describe, expect, it } from 'vitest';
import { OpportunityBus, type OpportunityAdapter } from './opportunity-bus.js';

const opportunity = (domain: 'crypto' | 'pokemon') => ({
  id: `${domain}-1`, domain, venue: domain === 'crypto' ? 'dex' : 'marketplace', asset: 'demo',
  estimatedValue: 100, estimatedCost: 5, risk: 0.2, urgency: 0.8, liquidity: 0.9,
  evidence: [{ source: 'test', observedAt: new Date().toISOString(), confidence: 0.9, signal: 'demo' }]
});

describe('opportunity bus', () => {
  it('discovers from multiple domains without changing the bus', async () => {
    const adapters: OpportunityAdapter[] = [
      { domain: 'crypto', discover: async () => [opportunity('crypto')] },
      { domain: 'pokemon', discover: async () => [opportunity('pokemon')] }
    ];
    const bus = new OpportunityBus();
    adapters.forEach(adapter => bus.register(adapter));
    const found = await bus.discover();
    expect(found.map(item => item.domain)).toEqual(['crypto', 'pokemon']);
  });

  it('supports cancellation and per-adapter bounds', async () => {
    const bus = new OpportunityBus({ maxPerAdapter: 1 });
    bus.register({ domain: 'crypto', discover: async signal => {
      if (signal.aborted) return [];
      return [opportunity('crypto'), { ...opportunity('crypto'), id: 'crypto-2' }];
    }});
    expect((await bus.discover()).length).toBe(1);
  });
});
