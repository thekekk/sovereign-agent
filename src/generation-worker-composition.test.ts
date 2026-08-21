import { describe, expect, it } from 'vitest';
import { GenerationManager } from './generation-manager.js';
import { LineageMemory } from './lineage-memory.js';
import { LineageStrategyMemory } from './lineage-strategy-memory.js';
import { StrategyLearning } from './strategy-learning.js';
import { WorkerLoop, type WorkerExecution } from './worker-loop.js';

describe('generation worker composition', () => {
  it('runs a child worker with inherited strategy knowledge', async () => {
    const parent = new LineageMemory(1);
    parent.add({
      id: 'use:A:coding',
      strategyId: 'A',
      kind: 'use',
      context: 'coding',
      lesson: 'verified parent success',
      evidenceValue: 10,
      confidence: 0.9,
      occurrences: 1,
      originId: 'parent',
      generation: 1
    });

    const manager = new GenerationManager();
    const child = manager.createChildLineage('child', parent.snapshot());
    const learning = new StrategyLearning(undefined, new LineageStrategyMemory(child.memory));
    const ledger = { record: (event: unknown) => event as never };
    const loop = new WorkerLoop(learning, ledger, undefined, undefined, 'coding', 'child');
    const execution: WorkerExecution = {
      strategy: 'A',
      taskId: 'task-1',
      durationMs: 10,
      cost: 1,
      value: 2,
      success: true,
      lesson: 'verified child success'
    };

    const result = await loop.run(
      { attempts: 1, successfulAttempts: 1, verifiedValue: 1, totalCost: 1 } as never,
      { balance: 100, computeCostPerHour: 1, revenuePerHour: 1, health: 100, offspring: 0, successes: 1, failures: 0, lastHeartbeat: new Date().toISOString() } as never,
      [
        { name: 'A', basePriority: 0, estimatedCost: 1 },
        { name: 'B', basePriority: 0, estimatedCost: 1 }
      ],
      [],
      { run: async () => execution }
    );

    expect(child.generation).toBe(2);
    expect(child.memory.lessonsFor('A', 'coding')).toHaveLength(1);
    expect(result.decision.selectedStrategy).toBe('A');
    expect(result.execution?.strategy).toBe('A');
  });
});
