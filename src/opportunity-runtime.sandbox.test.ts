import { describe, expect, it } from 'vitest';
import { OpportunityRuntime } from './opportunity-runtime.js';
import { DomainPolicyGate } from './domain-policy-gate.js';
import { OpportunityExecutionOrchestrator } from './opportunity-execution-orchestrator.js';
import { OpportunityExecutorRegistry } from './opportunity-executor-registry.js';
import { SandboxExecutor } from './sandbox-executor.js';
import { ExecutionLimitsGuard } from './execution-limits.js';
import type { Opportunity } from './opportunity-bus.js';

const opportunity: Opportunity = {
  id: 'runtime-sandbox-1', domain: 'crypto', venue: 'sandbox', asset: 'BTC',
  estimatedValue: 100, estimatedCost: 10, risk: .1, urgency: .8, liquidity: .9,
  requiredService: 'sandbox',
  evidence: [{ observedAt: new Date().toISOString(), confidence: .95, source: 'test-a', signal: 'validated' }, { observedAt: new Date().toISOString(), confidence: .9, source: 'test-b', signal: 'confirmed' }]
};

describe('opportunity runtime sandbox path', () => {
  it('reaches the real sandbox executor through the runtime', async () => {
    const discovery = { discover: async () => ({ opportunities: [opportunity], staleCount: 0, providerCount: 1 }) } as any;
    const decision = { best: (items: Opportunity[]) => items[0] ? { opportunity: items[0], execute: true, reason: 'best', score: 1 } : undefined } as any;
    const gate = { authorize: () => ({ decision: 'execute', reason: 'test', opportunityId: opportunity.id }) } as any;
    const executors = new OpportunityExecutorRegistry();
    executors.register(new SandboxExecutor());
    const learning = { record: () => undefined } as any;
    const execution = new OpportunityExecutionOrchestrator(gate, executors, learning, undefined, new ExecutionLimitsGuard({ maxEstimatedCost: 100, maxEstimatedRisk: .5 }));
    const capabilityGate = { evaluate: () => ({ allowed: true, reason: 'capable', opportunity }) } as any;
    const domainPolicy = new DomainPolicyGate([{ domain: 'crypto', enabled: true, minEvidenceScore: .4, maxRisk: .5 }]);
    const runtime = new OpportunityRuntime(discovery, decision, execution, capabilityGate, domainPolicy);
    const wallet = { walletId: 'sandbox-wallet', canExecute: true, domains: ['crypto' as const], services: ['sandbox'] };
    const result = await runtime.run(wallet);
    expect(result.selectedId).toBe(opportunity.id);
    expect(result.execution?.success).toBe(true);
    expect(result.execution?.provenance.walletId).toBe(wallet.walletId);
  });
});
