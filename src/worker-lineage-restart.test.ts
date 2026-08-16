import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LineageMemory } from './lineage-memory.js';
import { LineagePersistence } from './lineage-persistence.js';
import { LineageStrategyMemory } from './lineage-strategy-memory.js';
import { StrategyLearning } from './strategy-learning.js';
import { StrategyOutcomeToLineage } from './strategy-outcome-to-lineage.js';
import { WorkerLoop } from './worker-loop.js';

const summary = { attempts: 1, successfulAttempts: 1, verifiedValue: 1, totalCost: 1 } as never;
const healthy = { balance: 100, computeCostPerHour: 1, revenuePerHour: 1, health: 100, offspring: 0, successes: 2, failures: 0, lastHeartbeat: new Date().toISOString() } as never;

describe('worker lineage restart', () => {
  it('persists a real worker outcome and restores it for a fresh selector', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'sovereign-lineage-'));
    const dbPath = join(dir, 'lineage.db');
    try {
      const firstMemory = new LineageMemory(2);
      const persistence = new LineagePersistence(dbPath);
      const lineage = new StrategyOutcomeToLineage(firstMemory, persistence);
      const worker = new WorkerLoop(
        new StrategyLearning(undefined, new LineageStrategyMemory(firstMemory)),
        { record: event => ({ ...event, id: 'event-1', timestamp: new Date().toISOString() }) } as never,
        undefined,
        lineage,
        'coding',
        'child-2'
      );

      await worker.run(summary, healthy, [{ name: 'A', basePriority: 0, estimatedCost: 1 }], [], {
        run: async strategy => ({ strategy, taskId: 'task-1', durationMs: 1, cost: 1, value: 10, success: true, lesson: 'verified mutation' })
      });

      const restartedMemory = new LineageMemory(2);
      new LineagePersistence(dbPath).loadInto(restartedMemory);
      const decision = new StrategyLearning(undefined, new LineageStrategyMemory(restartedMemory)).decide(
        summary,
        healthy,
        [{ name: 'A', basePriority: 0, estimatedCost: 1 }, { name: 'B', basePriority: 0, estimatedCost: 1 }],
        [],
        'coding'
      );

      expect(restartedMemory.lessonsFor('A', 'coding')).toHaveLength(1);
      expect(decision.selectedStrategy).toBe('A');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
