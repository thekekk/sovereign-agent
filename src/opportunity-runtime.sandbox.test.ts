import { describe, expect, it } from 'vitest';
import { OpportunityRuntime } from './opportunity-runtime.js';
import { DomainPolicyGate } from './domain-policy-gate.js';
import type { Opportunity } from './opportunity-bus.js';

const opportunity: Opportunity = {
  id: 'runtime-sandbox-1', domain: 'crypto', venue: 'sandbox', asset: 'BTC',
  estimatedValue: 100, estimatedCost: 10, risk: .1, urgency: .8, liquidity: .9,
  requiredService: 'sandbox',
  evidence: [{ observedAt: new Date().toISOString(), confidence: .95, source: 'test-a', signal: 'validated' }, { observedAt: new Date().toISOString(), confidence: .9, source: 'test-b', signal: 'confirmed' }]
};

describe('opportunity runtime sandbox path', () => {
  it('passes discovery and gates before sandbox execution', async () => {
    const discovery = { discover: async () => ({ opportunities: [opportunity], staleCount: 0, providerCount: 1 }) } as any;
    const decision = { best: (items: Opportunity[]) => items[0] ? { opportunity: items[0], execute: true, reason: 'best', score: 1 } : undefined } as any;
    const execution = { execute: async () => ({ opportunityId: opportunity.id, domain: opportunity.domain, venue: opportunity.venue, authorization: { decision: 'execute', reason: 'ok', opportunityId: opportunity.id }, startedAt: new Date().toISOString(), finishedAt: new Date().toISOString(), success: true }) } as any;
    const gate = { evaluate: () => ({ allowed: true, reason: 'capable', opportunity }) } as any;
    const domainPolicy = new DomainPolicyGate([{ domain: 'crypto', enabled: true, minEvidenceScore: .4, maxRisk: .5 }]);
    const runtime = new OpportunityRuntime(discovery, decision, execution, gate, domainPolicy);
    const wallet = { walletId: 'sandbox-wallet', canExecute: true, domains: ['crypto' as const], services: ['sandbox'] };
    const result = await runtime.run(wallet);
    expect(result.selectedId).toBe(opportunity.id);
    expect(result.eligible).toBe(1);
    expect(result.rejected).toBe(0);
    expect(result.execution?.success).toBe(true);
  });
});
