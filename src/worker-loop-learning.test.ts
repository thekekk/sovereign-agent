import { describe, expect, it } from 'vitest';
import { OutcomeLedger } from './outcome-ledger.js';
import { StrategyLearning } from './strategy-learning.js';
import { StrategyFitnessAdapter } from './strategy-fitness-adapter.js';
import { StrategyFitnessLedger } from './strategy-fitness.js';
import { WorkerLoop } from './worker-loop.js';

const snapshot = {
  balance: 100,
  computeCostPerHour: 1,
  revenuePerHour: 2,
  health: 100,
  offspring: 0,
  successes: 1,
  failures: 0,
  lastHeartbeat: new Date().toISOString()
};
const summary = { attempts: 1, successfulAttempts: 1, verifiedValue: 1, totalCost: 1 } as never;

const candidates = [
  { name: 'A', basePriority: 1, estimatedCost: 1 },
  { name: 'B', basePriority: 1, estimatedCost: 1 }
];

describe('WorkerLoop learning feedback', () => {
  it('uses a previous failed strategy outcome on the next iteration', async () => {
    const fitness = new StrategyFitnessAdapter(new StrategyFitnessLedger());
    const ledger = new OutcomeLedger(':memory:');
    const runner = { run: async (strategy: string) => ({
      strategy,
      taskId: `task-${strategy}`,
      durationMs: 1,
      cost: 1,
      value: 0,
      success: false,
      lesson: 'failed'
    }) };
    const loop = new WorkerLoop(new StrategyLearning(), ledger, fitness);

    const first = await loop.run(summary, snapshot, candidates, fitness.experiences(), runner);
    expect(first.decision.selectedStrategy).toBe('A');
    expect(fitness.experiences()[0]).toMatchObject({ strategy: 'A', attempts: 1, successes: 0 });

    const second = await loop.run(summary, snapshot, candidates, fitness.experiences(), runner);
    expect(second.decision.selectedStrategy).toBe('B');
  });
});
