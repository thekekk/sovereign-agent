import { describe, expect, it } from 'vitest';
import { LineageMemory, type LineageLesson } from './lineage-memory.js';
import { LineageStrategyMemory } from './lineage-strategy-memory.js';

describe('multi-generation learning', () => {
  const lesson = (originId: string, generation: number, confidence: number): LineageLesson => ({
    id: `${originId}-${generation}`,
    strategyId: 'A', kind: 'use', context: 'coding', lesson: 'verified A',
    evidenceValue: 10, confidence, occurrences: 1, originId, generation
  });

  it('carries useful knowledge parent → child → grandchild without resetting age', () => {
    const parent = new LineageMemory(1);
    parent.add(lesson('parent', 1, 0.8));

    const child = new LineageMemory(2);
    child.inherit(parent.snapshot());
    expect(child.lessonsFor('A', 'coding')[0].originId).toBe('parent');
    expect(child.lessonsFor('A', 'coding')[0].generation).toBe(1);
    expect(child.effectiveQuality(child.lessonsFor('A', 'coding')[0])).toBeLessThan(8);

    const grandchild = new LineageMemory(3);
    grandchild.inherit(child.snapshot());
    const inherited = grandchild.lessonsFor('A', 'coding')[0];
    expect(inherited.originId).toBe('parent');
    expect(inherited.generation).toBe(1);
    expect(grandchild.effectiveQuality(inherited)).toBeLessThan(child.effectiveQuality(child.lessonsFor('A', 'coding')[0]));
  });

  it('lets a fresh grandchild observation strengthen inherited knowledge', () => {
    const parent = new LineageMemory(1);
    parent.add(lesson('parent', 1, 0.6));
    const child = new LineageMemory(2);
    child.inherit(parent.snapshot());
    const grandchild = new LineageMemory(3);
    grandchild.inherit(child.snapshot());
    grandchild.add(lesson('grandchild', 3, 0.9));

    const resolved = new LineageStrategyMemory(grandchild).resolve({ strategyId: 'A', context: 'coding' });
    expect(resolved.winner).toBe('use');
    expect(resolved.use[0].occurrences).toBe(2);
  });
});
