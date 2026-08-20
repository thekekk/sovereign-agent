import { describe, expect, it } from 'vitest';
import { runLiveDryRun } from './live-dry-run.js';
import type { Opportunity } from './opportunity-bus.js';
import type { OpportunityDiscoveryPipeline } from './opportunity-discovery-pipeline.js';
import type { OpportunityDecisionGate } from './opportunity-decision-gate.js';
import type { OpportunityDecisionPolicy } from './opportunity-decision-policy.js';
import type { OpportunityExecutionOrchestrator } from './opportunity-execution-orchestrator.js';

const opportunity: Opportunity = {
  id: 'btc-1', domain: 'crypto', venue: 'test', asset: 'BTC',
  estimatedValue: 100, estimatedCost: 10, risk: .1, urgency: .5, liquidity: .9,
  requiredService: 'exchange', evidence: [{ observedAt: new Date().toISOString(), confidence: .9, source: 'test', signal: 'test' }]
};
const wallet = { walletId: 'w1', canExecute: false, domains: ['crypto' as const], services: ['exchange'] };
const discovery = { discover: async () => ({ opportunities: [opportunity], staleCount: 0, providerCount: 1 }) } as unknown as OpportunityDiscoveryPipeline;
const gate = { evaluate: () => ({ allowed: true, reason: 'ok', opportunity }) } as unknown as OpportunityDecisionGate;
const decision = { best: () => ({ opportunity, execute: true, reason: 'ok', score: 1 }) } as unknown as OpportunityDecisionPolicy;
const execution = { execute: async () => { throw new Error('must not execute during dry run'); } } as unknown as OpportunityExecutionOrchestrator;

describe('live dry run', () => {
  it('selects without executing', async () => {
    const result = await runLiveDryRun(discovery, gate, decision, execution, wallet);
    expect(result.selectedId).toBe('btc-1');
    expect(result.executed).toBe(false);
  });
});
