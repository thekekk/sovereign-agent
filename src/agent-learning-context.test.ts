import { describe, expect, it } from 'vitest';
import { AgentLearningContext } from './agent-learning-context.js';
import { LineageMemory } from './lineage-memory.js';
import { LineageStrategyMemory } from './lineage-strategy-memory.js';
import { OutcomeToLineage } from './outcome-to-lineage.js';
import { VerifiedCodingMutation } from './verified-coding-mutation.js';

describe('agent learning integration', () => {
  it('records a successful coding strategy as reusable lineage knowledge', async () => {
    const events: string[] = [];
    const lineage = new LineageMemory(4);
    const learning = new OutcomeToLineage(lineage);
    const checkpoints = {
      create: async () => { events.push('checkpoint'); return { id: 'cp-1' }; },
      rollback: async () => { events.push('rollback'); }
    } as any;
    const deps = {
      writeFile: async () => { events.push('write'); },
      runTests: async () => { events.push('test'); return { passed: true, output: 'ok' }; }
    };
    const verifier = { verify: async () => { events.push('verify'); return { backend: 'local', verified: true, value: 12, reason: 'tests and evidence passed' }; } } as any;
    const mutation = new VerifiedCodingMutation(checkpoints, deps, verifier, learning);
    const agent = new AgentLearningContext(mutation, { strategyId: 'strategy-A', context: 'coding', originId: 'agent-4' });

    const result = await agent.execute('src/x.ts', 'export const x = 1');

    expect(result.evidence.verified).toBe(true);
    expect(events).toEqual(['checkpoint', 'write', 'test', 'verify']);
    const memory = new LineageStrategyMemory(lineage);
    expect(memory.reusable({ strategyId: 'strategy-A', context: 'coding' })).toHaveLength(1);
    expect(lineage.snapshot().generation).toBe(4);
  });

  it('records a failed coding strategy as avoid knowledge and rolls back', async () => {
    const events: string[] = [];
    const lineage = new LineageMemory(5);
    const learning = new OutcomeToLineage(lineage);
    const checkpoints = {
      create: async () => { events.push('checkpoint'); return { id: 'cp-2' }; },
      rollback: async () => { events.push('rollback'); }
    } as any;
    const deps = {
      writeFile: async () => { events.push('write'); },
      runTests: async () => { events.push('test'); return { passed: false, output: 'failed' }; }
    };
    const verifier = { verify: async () => { throw new Error('must not verify failed tests'); } } as any;
    const mutation = new VerifiedCodingMutation(checkpoints, deps, verifier, learning);
    const agent = new AgentLearningContext(mutation, { strategyId: 'strategy-B', context: 'coding', originId: 'agent-5' });

    const result = await agent.execute('src/x.ts', 'bad');

    expect(result.evidence.verified).toBe(false);
    expect(events).toEqual(['checkpoint', 'write', 'test', 'rollback']);
    const memory = new LineageStrategyMemory(lineage);
    expect(memory.shouldAvoid({ strategyId: 'strategy-B', context: 'coding' })).toBe(true);
  });
});
