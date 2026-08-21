import { describe, expect, it } from 'vitest';
import { OpportunityDecisionPolicy } from './opportunity-decision-policy.js';
import { OpportunityPolicy } from './opportunity-policy.js';
import { OpportunityExecutionGate } from './opportunity-execution-gate.js';
import type { Opportunity } from './opportunity-bus.js';

const makeOpportunity = (id: string, value: number, risk: number): Opportunity => ({
  id, domain: 'crypto', venue: 'sandbox', asset: 'BTC', estimatedValue: value,
  estimatedCost: 10, risk, urgency: .8, liquidity: .9,
  requiredService: 'sandbox', evidence: [{ observedAt: new Date().toISOString(), confidence: .95, source: 'test', signal: 'validated' }]
});

describe('opportunity runtime decision policy', () => {
  it('selects the highest bounded net-value candidate that passes gates', () => {
    const decision = new OpportunityDecisionPolicy(
      new OpportunityPolicy({ maxRisk: .5, minEvidenceConfidence: .8, minNetValue: 1, maxCost: 100, minLiquidity: .5 }),
      new OpportunityExecutionGate()
    );
    const wallet = { walletId: 'w1', canExecute: true, domains: ['crypto' as const], services: ['sandbox'] };
    const result = decision.best([makeOpportunity('low', 30, .2), makeOpportunity('high', 100, .2)], wallet);
    expect(result?.opportunity.id).toBe('high');
    expect(result?.execute).toBe(true);
    expect(result?.score).toBeGreaterThan(0);
  });

  it('rejects candidates that violate risk policy', () => {
    const decision = new OpportunityDecisionPolicy(
      new OpportunityPolicy({ maxRisk: .5, minEvidenceConfidence: .8, minNetValue: 1, maxCost: 100, minLiquidity: .5 }),
      new OpportunityExecutionGate()
    );
    const wallet = { walletId: 'w1', canExecute: true, domains: ['crypto' as const], services: ['sandbox'] };
    expect(decision.best([makeOpportunity('risky', 100, .9)], wallet)).toBeUndefined();
  });
});
