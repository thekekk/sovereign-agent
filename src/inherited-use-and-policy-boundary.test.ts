import { describe, expect, it } from 'vitest';
import { LineageMemory } from './lineage-memory.js';
import { LineageStrategyMemory } from './lineage-strategy-memory.js';
import { StrategyLearning } from './strategy-learning.js';

const summary = { attempts: 1, successfulAttempts: 1, verifiedValue: 1, totalCost: 1 } as never;
const healthy = {
  balance: 100,
  computeCostPerHour: 1,
  revenuePerHour: 2,
  health: 100,
  offspring: 1,
  successes: 1,
  failures: 0,
  lastHeartbeat: new Date().toISOString()
} as never;

function lesson(kind: 'use' | 'avoid', strategyId: string) {
  return {
    id: `${kind}:${strategyId}`,
    strategyId,
    kind,
    context: 'coding',
    lesson: `${kind} ${strategyId}`,
    evidenceValue: 10,
    confidence: 0.9,
    occurrences: 1,
    originId: 'parent',
    generation: 1
  } as const;
}

describe('inherited use and policy boundary', () => {
  it('lets a strong inherited USE lesson influence selection', () => {
    const lineage = new LineageMemory(2);
    lineage.add(lesson('use', 'A'));
    const selector = new StrategyLearning(undefined, new LineageStrategyMemory(lineage));
    const result = selector.decide(summary, healthy, [
      { name: 'A', basePriority: 0, estimatedCost: 1 },
      { name: 'B', basePriority: 0, estimatedCost: 1 }
    ], [], 'coding');
    expect(result.selectedStrategy).toBe('A');
  });

  it('keeps survival stop authoritative over inherited USE knowledge', () => {
    const lineage = new LineageMemory(2);
    lineage.add(lesson('use', 'A'));
    const selector = new StrategyLearning(undefined, new LineageStrategyMemory(lineage));
    const dead = {
      balance: 0,
      computeCostPerHour: 1,
      revenuePerHour: 2,
      health: 100,
      offspring: 1,
      successes: 1,
      failures: 0,
      lastHeartbeat: new Date().toISOString()
    } as never;
    const result = selector.decide(summary, dead, [{ name: 'A', basePriority: 100, estimatedCost: 1 }], [], 'coding');
    expect(result.action).toBe('stop');
    expect(result.selectedStrategy).toBeNull();
  });
});
