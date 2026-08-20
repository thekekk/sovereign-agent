import { describe, expect, it } from 'vitest';
import { DomainPolicyGate } from './domain-policy-gate.js';
import type { Opportunity } from './opportunity-bus.js';

const base: Opportunity = {
  id: 'x', domain: 'crypto', venue: 'test', asset: 'BTC', estimatedValue: 100,
  estimatedCost: 1, risk: .2, urgency: .5, liquidity: .9,
  requiredService: 'exchange', evidence: [{ observedAt: new Date().toISOString(), confidence: .9, source: 'source-a', signal: 'signal' }]
};

describe('domain policy gate', () => {
  it('rejects excessive risk', () => {
    const gate = new DomainPolicyGate([{ domain: 'crypto', enabled: true, minEvidenceScore: 0, maxRisk: .1 }]);
    expect(gate.evaluate(base).allowed).toBe(false);
  });

  it('rejects insufficient evidence', () => {
    const gate = new DomainPolicyGate([{ domain: 'crypto', enabled: true, minEvidenceScore: .9, maxRisk: 1 }]);
    expect(gate.evaluate(base).allowed).toBe(false);
  });

  it('allows an opportunity that passes both limits', () => {
    const gate = new DomainPolicyGate([{ domain: 'crypto', enabled: true, minEvidenceScore: .4, maxRisk: 1 }]);
    expect(gate.evaluate(base).allowed).toBe(true);
  });
});
