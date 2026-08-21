import { describe, expect, it } from 'vitest';
import { AutonomousIteration } from './autonomous-iteration.js';
import { AutonomousIterationController } from './autonomous-iteration-controller.js';
import { AutonomousLoopRunner } from './autonomous-loop-runner.js';
import { OutcomeLedger } from './outcome-ledger.js';

const survival = {
  balance: 100,
  computeCostPerHour: 1,
  revenuePerHour: 2,
  health: 100,
  offspring: 0,
  successes: 10,
  failures: 0,
  lastHeartbeat: new Date().toISOString()
};

function gitStub() {
  return {
    checkpoint: async (label: string) => ({ commit: 'a'.repeat(40), label, createdAt: new Date().toISOString() }),
    rollback: async () => ({ ok: true, commit: 'a'.repeat(40), output: '' })
  } as never;
}

describe('AutonomousLoopRunner', () => {
  it('gates real work before AutonomousIteration executes it', async () => {
    const ledger = new OutcomeLedger(':memory:');
    const controller = new AutonomousIterationController({ beforeMutation: async () => ({ allowed: true, reason: 'safe' }) }, { maxIterations: 1 });
    const iteration = new AutonomousIteration(gitStub(), ledger);
    const runner = new AutonomousLoopRunner(controller, iteration, ledger);
    let ran = false;

    const result = await runner.run({
      taskId: 'e2e-1', taskValue: 10, costPerHour: 1, survival,
      work: async () => { ran = true; return { success: true, value: 10 }; }
    }, { taskId: 'e2e-1' });

    expect(result.authorized.completed).toBe(true);
    expect(ran).toBe(true);
    expect(result.iteration?.workSuccess).toBe(true);
  });

  it('does not execute work when the outer gate blocks mutation', async () => {
    const ledger = new OutcomeLedger(':memory:');
    const controller = new AutonomousIterationController({ beforeMutation: async () => ({ allowed: false, reason: 'recovery required' }) }, { maxIterations: 1 });
    const iteration = new AutonomousIteration(gitStub(), ledger);
    const runner = new AutonomousLoopRunner(controller, iteration, ledger);
    let ran = false;

    const result = await runner.run({
      taskId: 'e2e-2', taskValue: 10, costPerHour: 1, survival,
      work: async () => { ran = true; return { success: true }; }
    }, { taskId: 'e2e-2' });

    expect(result.authorized.stopped).toBe(true);
    expect(ran).toBe(false);
    expect(result.iteration).toBeUndefined();
  });
});
