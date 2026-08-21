import { describe, expect, it } from 'vitest';
import { OpportunityExecutorRegistry, type OpportunityExecutor } from './opportunity-executor.js';
import type { Opportunity } from './opportunity-bus.js';

const opportunity: Opportunity = {
  id: 'x', domain: 'crypto', venue: 'demo', asset: 'x', estimatedValue: 100, estimatedCost: 5,
  risk: 0.1, urgency: 0.8, liquidity: 0.9,
  evidence: [{ source: 'test', observedAt: new Date().toISOString(), confidence: 0.9, signal: 'confirmed' }],
  requiredService: 'demo'
};
const executor: OpportunityExecutor = {
  domain: 'crypto', service: 'demo', canExecute: () => true,
  execute: async () => ({ success: true, realizedValue: 95 })
};

describe('opportunity executor registry', () => {
  it('resolves the compatible domain/service executor', () => {
    const registry = new OpportunityExecutorRegistry();
    registry.register(executor);
    expect(registry.resolve(opportunity)).toBe(executor);
  });

  it('does not resolve an incompatible service', () => {
    const registry = new OpportunityExecutorRegistry();
    registry.register(executor);
    expect(registry.resolve({ ...opportunity, requiredService: 'other' })).toBeUndefined();
  });
});
