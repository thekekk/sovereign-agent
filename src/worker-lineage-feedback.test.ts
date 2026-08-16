import { describe, expect, it } from 'vitest';
import { OutcomeLedger } from './outcome-ledger.js';
import { LineageMemory } from './lineage-memory.js';
import { LineageStrategyMemory } from './lineage-strategy-memory.js';
import { StrategyLearning } from './strategy-learning.js';
import { StrategyOutcomeToLineage } from './strategy-outcome-to-lineage.js';
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
const summary = { attempts: 0, successfulAttempts: 0, verifiedValue: 0, totalCost: 0 } as never;
const candidates = [
  { name: 'A', basePriority: 0, estimatedCost: 1 },
  { name: 'B', basePriority: 0, estimatedCost: 1 }
];

describe('WorkerLoop lineage feedback', () => {
  it('records a successful worker strategy as inherited USE knowledge', async () => {
    const lineage = new LineageMemory(3);
    const recorder = new StrategyOutcomeToLineage(lineage);
    const selector = new StrategyLearning(undefined, new LineageStrategyMemory(lineage));
    const fitness = new StrategyFitnessAdapter(new StrategyFitnessLedger());
    const ledger = new OutcomeLedger(':memory:');
    const runner = {
      run: async (strategy: string) => ({
        strategy,
        taskId: 'task-use',
        durationMs: 1,
        cost: 1,
        value: 5,
        success: true,
        lesson: 'verified build path'
      })
    };

    const loop = new WorkerLoop(selector, ledger, fitness, recorder, 'coding', 'agent-3');
    const first = await loop.run(summary, snapshot, candidates, fitness.experiences(), runner);

    expect(first.execution?.strategy).toBe('A');
    expect(lineage.lessonsFor('A', 'coding')).toEqual([
      expect.objectContaining({ kind: 'use', originId: 'agent-3', generation: 3 })
    ]);

    const second = await loop.run(summary, snapshot, candidates, fitness.experiences(), runner);
    expect(second.decision.selectedStrategy).toBe('A');
  });

  it('records a failed worker strategy as AVOID knowledge', async () => {
    const lineage = new LineageMemory(4);
    const recorder = new StrategyOutcomeToLineage(lineage);
    const selector = new StrategyLearning(undefined, new LineageStrategyMemory(lineage));
    const ledger = new OutcomeLedger(':memory:');
    const runner = {
      run: async (strategy: string) => ({
        strategy,
        taskId: 'task-avoid',
        durationMs: 1,
        cost: 1,
        value: 0,
        success: false,
        lesson: 'tests failed'
      })
    };

    const loop = new WorkerLoop(selector, ledger, undefined, recorder, 'coding', 'agent-4');
    await loop.run(summary, snapshot, candidates, [], runner);

    expect(lineage.lessonsFor('A', 'coding')).toEqual([
      expect.objectContaining({ kind: 'avoid', lesson: 'tests failed', originId: 'agent-4' })
    ]);
  });
});
