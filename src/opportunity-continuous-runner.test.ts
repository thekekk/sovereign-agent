import { describe, expect, it } from 'vitest';
import { OpportunityContinuousRunner } from './opportunity-continuous-runner.js';
import { AutonomousIterationController } from './autonomous-iteration-controller.js';

const makeOpportunity = (id: string, value: number) => ({
  id, domain: 'crypto' as const, venue: 'demo', asset: id, estimatedValue: value, estimatedCost: 10,
  risk: 0.1, urgency: 0.8, liquidity: 0.9,
  evidence: [{ source: 'test', observedAt: new Date().toISOString(), confidence: 0.95, signal: 'confirmed' }]
});
const wallet = { walletId: 'w', domains: ['crypto'] as const, services: ['demo'], canExecute: true };
const gate = { beforeMutation: async () => ({ allowed: true, reason: 'ok' }) };

describe('continuous opportunity runner', () => {
  it('discovers, selects, executes and records one bounded action per cycle', async () => {
    const controller = new AutonomousIterationController(gate, { maxIterations: 2 });
    const seen: string[] = [];
    const recorded: string[] = [];
    const runner = OpportunityContinuousRunner.create(
      [{ domain: 'crypto', discover: async () => [makeOpportunity('a', 100), makeOpportunity('b', 20)] }],
      wallet,
      { execute: async opportunity => { seen.push(opportunity.id); return { success: true, value: opportunity.estimatedValue - 5 }; } },
      { record: outcome => { recorded.push(outcome.opportunityId); } }, controller, { maxCycles: 2 }
    );
    const result = await runner.run();
    expect(result.cycles).toBe(2);
    expect(seen).toEqual(['a', 'a']);
    expect(recorded).toEqual(['a', 'a']);
    expect(result.stopped).toBe(true);
  });

  it('records a failed execution and hard-stops by default', async () => {
    const controller = new AutonomousIterationController(gate, { maxIterations: 5 });
    let recorded = false;
    const runner = OpportunityContinuousRunner.create(
      [{ domain: 'crypto', discover: async () => [makeOpportunity('fail', 100)] }], wallet,
      { execute: async () => ({ success: false, error: 'execution failed' }) },
      { record: async () => { recorded = true; } }, controller, { maxCycles: 5 }
    );
    const result = await runner.run();
    expect(recorded).toBe(true);
    expect(result.stopped).toBe(true);
    expect(controller.halted).toBe(true);
  });
});
