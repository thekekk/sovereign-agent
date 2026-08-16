import { describe, expect, it } from 'vitest';
import { LineageMemory } from './lineage-memory.js';

const base = {
  strategyId: 'A',
  context: 'coding',
  lesson: 'verified mutation',
  originId: 'worker-1',
  generation: 2,
  evidenceValue: 10,
  occurrences: 1
} as const;

describe('lineage lesson quality', () => {
  it('does not let a weaker duplicate replace stronger evidence', () => {
    const memory = new LineageMemory(2);
    memory.add({ ...base, id: 'strong', kind: 'use', confidence: 0.9 });
    memory.add({ ...base, id: 'weak', kind: 'use', confidence: 0.2, evidenceValue: 1 });

    const [lesson] = memory.lessonsFor('A', 'coding');
    expect(lesson.id).toBe('strong');
    expect(lesson.confidence).toBe(0.9);
    expect(lesson.evidenceValue).toBe(10);
  });

  it('aggregates stronger independent evidence instead of replacing provenance', () => {
    const memory = new LineageMemory(3);
    memory.inherit({ generation: 2, lessons: [{ ...base, id: 'parent', kind: 'use', confidence: 0.8 }] });
    memory.add({ ...base, id: 'local', originId: 'child', kind: 'use', confidence: 0.95, evidenceValue: 20, occurrences: 2 });

    const [lesson] = memory.lessonsFor('A', 'coding');
    expect(lesson.originId).toBe('parent');
    expect(lesson.evidenceValue).toBe(30);
    expect(lesson.occurrences).toBe(3);
    expect(lesson.confidence).toBeGreaterThan(0.8);
  });
});
