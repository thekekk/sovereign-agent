import { describe, expect, it } from 'vitest';
import { AutonomousIteration } from './autonomous-iteration.js';
import { OutcomeLedger } from './outcome-ledger.js';

describe('AutonomousIteration', () => {
  it('checkpoints, records economics, and returns a bounded decision', async () => {
    const checkpoints: string[] = [];
    const git = {
      checkpoint: async (label: string) => {
        checkpoints.push(label);
        return { commit: 'a'.repeat(40), label, createdAt: new Date().toISOString() };
      },
      rollback: async () => ({ ok: true, commit: 'a'.repeat(40), output: '' })
    } as never;
    const ledger = new OutcomeLedger(':memory:');
    const loop = new AutonomousIteration(git, ledger);

    const result = await loop.run({
      taskId: 'task-1',
      taskValue: 10,
      costPerHour: 1,
      survival: {
        balance: 100,
        computeCostPerHour: 1,
        revenuePerHour: 2,
        health: 100,
        offspring: 0,
        successes: 10,
        failures: 0,
        lastHeartbeat: new Date().toISOString()
      },
      work: async () => ({ success: true })
    }, { taskId: 'task-1' });

    expect(checkpoints).toEqual(['pre-task:task-1']);
    expect(result.workSuccess).toBe(true);
    expect(result.economics.event.taskId).toBe('task-1');
    expect(result.decision.action).toBe('checkpoint');
    expect(result.recovery).toBeUndefined();
  });
});
