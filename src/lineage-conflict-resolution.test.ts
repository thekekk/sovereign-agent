import { describe, expect, it } from 'vitest';
import { LineageMemory } from './lineage-memory.js';
import { LineageStrategyMemory } from './lineage-strategy-memory.js';

describe('lineage conflict resolution', () => {
  it('does not treat a weaker AVOID lesson as stronger than proven USE evidence', () => {
    const memory = new LineageMemory(3);
    memory.add({ id: 'use-a', strategyId: 'A', kind: 'use', context: 'coding', lesson: 'verified', evidenceValue: 20, confidence: 0.95, occurrences: 4, originId: 'parent', generation: 2 });
    memory.add({ id: 'avoid-a', strategyId: 'A', kind: 'avoid', context: 'coding', lesson: 'verified', evidenceValue: 1, confidence: 0.2, occurrences: 1, originId: 'child', generation: 3 });

    const lessons = new LineageStrategyMemory(memory).lessonsFor({ strategyId: 'A', context: 'coding' });
    expect(lessons).toHaveLength(2);
    expect(lessons.find(l => l.kind === 'use')?.confidence).toBe(0.95);
    expect(new LineageStrategyMemory(memory).shouldAvoid({ strategyId: 'A', context: 'coding' })).toBe(false);
  });

  it('treats a strong AVOID lesson as authoritative over weaker USE evidence', () => {
    const memory = new LineageMemory(3);
    memory.add({ id: 'use-a', strategyId: 'A', kind: 'use', context: 'coding', lesson: 'verified', evidenceValue: 2, confidence: 0.4, occurrences: 1, originId: 'parent', generation: 2 });
    memory.add({ id: 'avoid-a', strategyId: 'A', kind: 'avoid', context: 'coding', lesson: 'verified', evidenceValue: 20, confidence: 0.95, occurrences: 4, originId: 'child', generation: 3 });

    const bridge = new LineageStrategyMemory(memory);
    expect(bridge.shouldAvoid({ strategyId: 'A', context: 'coding' })).toBe(true);
  });
});
