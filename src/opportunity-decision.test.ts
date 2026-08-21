import { describe, expect, it } from 'vitest';
import { OpportunityDecisionEngine, type Opportunity } from './opportunity-decision.js';

const engine = new OpportunityDecisionEngine({ minNetValue: 5, minConfidence: 0.6, maxRisk: 0.7, maxCost: 20 });
const opportunity = (patch: Partial<Opportunity> = {}): Opportunity => ({
  id: 'x-1', domain: 'social-hype', source: 'x', title: 'candidate', expectedValue: 100,
  estimatedCost: 5, confidence: 0.9, urgency: 0.9, liquidity: 0.8,
  walletCompatible: true, executable: true, risk: 0.2, evidence: 0.9, ...patch
});

describe('opportunity decision engine', () => {
  it('can select among unrelated domains without a fixed finite opportunity list', () => {
    const result = engine.decide([
      opportunity({ id: 'crypto', domain: 'crypto', expectedValue: 20 }),
      opportunity({ id: 'pokemon', domain: 'pokemon', expectedValue: 80 }),
      opportunity({ id: 'goods', domain: 'goods', expectedValue: 40 })
    ]);
    expect(result.action).toBe('execute');
    expect(result.opportunity?.id).toBe('pokemon');
  });

  it('never executes when the wallet cannot actually operate on the service', () => {
    const result = engine.decide([opportunity({ walletCompatible: false })]);
    expect(result.action).toBe('watch');
  });

  it('rejects hype when risk or confidence violates policy', () => {
    const result = engine.decide([opportunity({ domain: 'social-hype', risk: 0.95, confidence: 0.99 })]);
    expect(result.action).toBe('watch');
  });

  it('rejects economically negative opportunities even when confidence is high', () => {
    const result = engine.decide([opportunity({ expectedValue: 7, estimatedCost: 5 })]);
    expect(result.action).toBe('skip');
  });
});
