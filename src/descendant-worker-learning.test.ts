import { describe, expect, it } from 'vitest';
import { LineageMemory } from './lineage-memory.js';
import { LineageReproduction } from './lineage-reproduction.js';
import { LineageStrategyMemory } from './lineage-strategy-memory.js';
import { StrategyLearning } from './strategy-learning.js';

const summary = { attempts: 1, successfulAttempts: 1, verifiedValue: 10, totalCost: 1 } as never;
const healthy = {
  balance: 100,
  computeCostPerHour: 1,
  revenuePerHour: 2,
  health: 100,
  offspring: 0,
  successes: 10,
  failures: 1,
  lastHeartbeat: new Date().toISOString()
} as never;

function useLesson(strategyId: string, originId: string, generation: number) {
  return {
    id: `use:${strategyId}:coding`,
    strategyId,
    kind: 'use' as const,
    context: 'coding',
    lesson: 'verified worker success',
    evidenceValue: 10,
    confidence: 0.9,
    occurrences: 1,
    originId,
    generation
  };
}

describe('descendant worker learning', () => {
  it('lets a child start with a parent USE lesson instead of rediscovering it', () => {
    const parent = new LineageMemory(1);
    parent.add(useLesson('A', 'parent-1', 1));

    const child = new LineageReproduction().createChild(parent.snapshot(), 'child-1');
    const selector = new StrategyLearning(undefined, new LineageStrategyMemory(child.memory));

    const decision = selector.decide(summary, healthy, [
      { name: 'A', basePriority: 0, estimatedCost: 1 },
      { name: 'B', basePriority: 0, estimatedCost: 1 }
    ], [], 'coding');

    expect(child.generation).toBe(2);
    expect(child.memory.lessonsFor('A', 'coding')).toHaveLength(1);
    expect(decision.selectedStrategy).toBe('A');
    expect(decision.confidence).toBeGreaterThan(0.5);
  });
});
