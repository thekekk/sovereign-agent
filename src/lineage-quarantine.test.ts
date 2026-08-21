import { describe, expect, it } from 'vitest';
import { LineageMemory } from './lineage-memory.js';
import { LineageStrategyMemory } from './lineage-strategy-memory.js';

describe('lineage quarantine', () => {
  const base = {
    strategyId: 'A', context: 'coding', lesson: 'use A',
    evidenceValue: 10, confidence: 0.9, occurrences: 1, generation: 1
  } as const;

  it('marks repeatedly contradicted knowledge unusable', () => {
    const memory = new LineageMemory(5);
    memory.add({ ...base, id: 'use', kind: 'use', originId: 'parent' });
    memory.add({ ...base, id: 'avoid-1', kind: 'avoid', originId: 'child-1', evidenceValue: 20, confidence: 0.9 });
    memory.add({ ...base, id: 'avoid-2', kind: 'avoid', originId: 'child-2', evidenceValue: 20, confidence: 0.9 });

    const resolved = new LineageStrategyMemory(memory).resolve({ strategyId: 'A', context: 'coding' });
    expect(resolved.winner).toBe('avoid');
    expect(resolved.use.some(lesson => lesson.confidence >= 0.5)).toBe(false);
  });

  it('does not quarantine a lesson after a single contradiction', () => {
    const memory = new LineageMemory(2);
    memory.add({ ...base, id: 'use', kind: 'use', originId: 'parent' });
    memory.add({ ...base, id: 'avoid', kind: 'avoid', originId: 'child', evidenceValue: 5, confidence: 0.5 });
    const resolved = new LineageStrategyMemory(memory).resolve({ strategyId: 'A', context: 'coding' });
    expect(resolved.use.length).toBe(1);
  });
});
