import { describe, expect, it } from 'vitest';
import { GenerationManager } from './generation-manager.js';
import { LineageMemory } from './lineage-memory.js';
import { LineageStrategyMemory } from './lineage-strategy-memory.js';
import { StrategyLearning } from './strategy-learning.js';
import { StrategyOutcomeToLineage } from './strategy-outcome-to-lineage.js';
import { WorkerLoop } from './worker-loop.js';

const healthy = { balance: 100, computeCostPerHour: 1, revenuePerHour: 1, health: 100, offspring: 0, successes: 2, failures: 0, lastHeartbeat: new Date().toISOString() } as never;
const summary = { attempts: 1, successfulAttempts: 1, verifiedValue: 1, totalCost: 1 } as never;

class MemoryLedger {
  readonly events: unknown[] = [];
  record(event: unknown) { this.events.push(event); return event as never; }
}

describe('grandchild worker learning', () => {
  it('makes a child worker outcome visible to the grandchild worker', async () => {
    const manager = new GenerationManager();
    const parent = new LineageMemory(1);
    const child = manager.createChildLineage('child', parent.snapshot());
    const ledger = new MemoryLedger();
    const childWorker = new WorkerLoop(
      new StrategyLearning(undefined, new LineageStrategyMemory(child.memory)),
      ledger,
      undefined,
      new StrategyOutcomeToLineage(child.memory),
      'coding',
      'child'
    );

    await childWorker.run(summary, healthy, [{ name: 'A', basePriority: 0, estimatedCost: 1 }], [], {
      run: async strategy => ({ strategy, taskId: 't1', durationMs: 1, cost: 1, value: 10, success: true, lesson: 'verified mutation' })
    });

    const grandchild = manager.createChildLineage('grandchild', child.memory.snapshot());
    const grandchildLearning = new StrategyLearning(undefined, new LineageStrategyMemory(grandchild.memory));
    const decision = grandchildLearning.decide(summary, healthy, [
      { name: 'A', basePriority: 0, estimatedCost: 1 },
      { name: 'B', basePriority: 0, estimatedCost: 1 }
    ], [], 'coding');

    expect(grandchild.generation).toBe(3);
    expect(grandchild.memory.lessonsFor('A', 'coding')).toHaveLength(1);
    expect(decision.selectedStrategy).toBe('A');
  });
});
