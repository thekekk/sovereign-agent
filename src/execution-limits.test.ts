import { describe, expect, it } from 'vitest';
import { ExecutionLimitsGuard } from './execution-limits.js';
import type { Opportunity } from './opportunity-bus.js';

const opportunity: Opportunity = {
  id: 'o1', domain: 'crypto', venue: 'test', asset: 'BTC', estimatedValue: 100,
  estimatedCost: 5, risk: .2, urgency: .5, liquidity: .9, requiredService: 'exchange', evidence: []
};

describe('execution limits', () => {
  it('rejects excessive cost', () => expect(new ExecutionLimitsGuard({ maxEstimatedCost: 4, maxEstimatedRisk: 1 }).authorize(opportunity).allowed).toBe(false));
  it('rejects excessive risk', () => expect(new ExecutionLimitsGuard({ maxEstimatedCost: 10, maxEstimatedRisk: .1 }).authorize(opportunity).allowed).toBe(false));
  it('rejects an opportunity after it is marked processed', () => {
    const guard = new ExecutionLimitsGuard({ maxEstimatedCost: 10, maxEstimatedRisk: 1 });
    expect(guard.authorize(opportunity).allowed).toBe(true);
    guard.markProcessed(opportunity.id);
    expect(guard.authorize(opportunity).allowed).toBe(false);
  });
});
