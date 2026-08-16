import { describe, expect, it } from 'vitest';
import { LineageMemory } from './lineage-memory.js';
import { LineageStrategyMemory } from './lineage-strategy-memory.js';
import { StrategyOutcomeToLineage } from './strategy-outcome-to-lineage.js';
import { StrategyLearning } from './strategy-learning.js';
import { StrategyFitnessAdapter } from './strategy-fitness-adapter.js';
import { StrategyFitnessLedger } from './strategy-fitness.js';
import { OutcomeLedger } from './outcome-ledger.js';
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

describe('WorkerLoop lineage feedback', () => {
  it('turns a verified worker success into inherited USE knowledge', async () => {
    const lineage = new LineageMemory(2);
    const recorder = new StrategyOutcomeToLineage(lineage);
    const fitness = new StrategyFitnessAdapter(new StrategyFitnessLedger());
    const loop = new WorkerLoop(new StrategyLearning(), new OutcomeLedger(':memory:'), fitness, recorder, 'coding', 'child-2');
    const runner = { run: async (strategy: string) => ({
      strategy, taskId: 'task-A', durationMs: 1, cost: 1, value: 5, success: true, lesson: 'tests passed'
    }) };

    await loop.run(summary, snapshot, candidates, fitness.experiences(), runner);

    const memory = new LineageStrategyMemory(lineage);
    expect(memory.reusable({ strategyId: 'A', context: 'coding' })).toHaveLength(1);
  });

  it('turns a failed worker outcome into inherited AVOID knowledge', async () => {
    const lineage = new LineageMemory(2);
    const recorder = new StrategyOutcomeToLineage(lineage);
    const loop = new WorkerLoop(new StrategyLearning(), new OutcomeLedger(':memory:'), undefined, recorder, 'coding', 'child-2');
    const runner = { run: async (strategy: string) => ({
      strategy, taskId: 'task-A', durationMs: 1, cost: 1, value: 0, success: false, lesson: 'tests failed'
    }) };

    await loop.run(summary, snapshot, candidates, [], runner);

    const memory = new LineageStrategyMemory(lineage);
    expect(memory.shouldAvoid({ strategyId: 'A', context: 'coding' })).toBe(true);
  });
});
