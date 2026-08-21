import { describe, expect, it } from 'vitest';
import { LineageMemory } from './lineage-memory.js';
import { LineageStrategyMemory } from './lineage-strategy-memory.js';
import { StrategyLearning } from './strategy-learning.js';

const summary = { attempts: 1, successfulAttempts: 1, verifiedValue: 1, totalCost: 1 } as never;
const healthy = { balance: 100, computeCostPerHour: 1, revenuePerHour: 1, health: 100, offspring: 0, successes: 10, failures: 0, lastHeartbeat: new Date().toISOString() } as never;
const candidates = [
  { name: 'A', basePriority: 0, estimatedCost: 1 },
  { name: 'B', basePriority: 0, estimatedCost: 1 }
];

describe('adversarial learning e2e', () => {
  it('never lets inherited knowledge bypass a survival stop', () => {
    const memory = new LineageMemory(10);
    memory.add({ id: 'avoid', strategyId: 'A', kind: 'use', context: 'coding', lesson: 'use A', confidence: 0.99, occurrences: 100, evidenceValue: 100, originId: 'parent', generation: 1 });
    const learning = new StrategyLearning(undefined, new LineageStrategyMemory(memory));
    const unsafe = { balance: 0, computeCostPerHour: 1, revenuePerHour: 1, health: 0, offspring: 0, successes: 10, failures: 0, lastHeartbeat: new Date().toISOString() } as never;

    expect(learning.decide(summary, unsafe, candidates, [], 'coding').action).toBe('stop');
  });

  it('allows fresh evidence to defeat stale inherited advice', () => {
    const memory = new LineageMemory(10);
    memory.add({ id: 'old', strategyId: 'A', kind: 'use', context: 'coding', lesson: 'use A', confidence: 1, occurrences: 1, evidenceValue: 10, originId: 'parent', generation: 1 });
    memory.add({ id: 'fresh', strategyId: 'A', kind: 'avoid', context: 'coding', lesson: 'avoid A', confidence: 1, occurrences: 1, evidenceValue: 10, originId: 'child', generation: 10 });
    const resolved = new LineageStrategyMemory(memory).resolve({ strategyId: 'A', context: 'coding' });
    expect(resolved.winner).toBe('avoid');
  });

  it('does not manufacture confidence from duplicate-origin reports', () => {
    const memory = new LineageMemory(3);
    const lesson = { strategyId: 'A', kind: 'use' as const, context: 'coding', lesson: 'use A', confidence: 0.6, occurrences: 1, evidenceValue: 5, originId: 'worker-1', generation: 3 };
    memory.add({ ...lesson, id: 'first' });
    memory.add({ ...lesson, id: 'duplicate' });
    expect(memory.lessonsFor('A', 'coding')[0].occurrences).toBe(1);
  });
});
