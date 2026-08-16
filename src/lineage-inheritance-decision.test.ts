import { describe, expect, it } from 'vitest';
import { LineageMemory } from './lineage-memory.js';
import { LineageReproduction } from './lineage-reproduction.js';
import { LineageStrategyMemory } from './lineage-strategy-memory.js';
import { StrategyLearning } from './strategy-learning.js';

const summary = { attempts: 1, successfulAttempts: 1, verifiedValue: 1, totalCost: 1 } as never;
const healthy = {
  balance: 100,
  computeCostPerHour: 1,
  revenuePerHour: 1,
  health: 100,
  offspring: 0,
  successes: 2,
  failures: 0,
  lastHeartbeat: new Date().toISOString()
} as never;

function lesson(kind: 'use' | 'avoid', strategyId: string, generation: number, originId: string) {
  return {
    id: `${kind}:${strategyId}`,
    strategyId,
    kind,
    context: 'coding',
    lesson: `${kind} ${strategyId}`,
    evidenceValue: kind === 'use' ? 10 : 0,
    confidence: 0.9,
    occurrences: 1,
    originId,
    generation
  } as const;
}

describe('lineage inheritance decision', () => {
  it('passes accumulated parent knowledge to a grandchild selector', () => {
    const parent = new LineageMemory(1);
    parent.add(lesson('use', 'A', 1, 'parent'));

    const child = new LineageReproduction().createChild(parent.snapshot(), 'child');
    child.memory.add(lesson('avoid', 'B', 2, 'child'));

    const grandchild = new LineageReproduction().createChild(child.memory.snapshot(), 'grandchild');
    const selector = new StrategyLearning(undefined, new LineageStrategyMemory(grandchild.memory));
    const result = selector.decide(summary, healthy, [
      { name: 'A', basePriority: 0, estimatedCost: 1 },
      { name: 'B', basePriority: 0, estimatedCost: 1 },
      { name: 'C', basePriority: 0, estimatedCost: 1 }
    ], [], 'coding');

    expect(grandchild.generation).toBe(3);
    expect(grandchild.memory.lessonsFor('A', 'coding')).toHaveLength(1);
    expect(grandchild.memory.lessonsFor('B', 'coding')).toHaveLength(1);
    expect(result.selectedStrategy).toBe('A');
  });
});
