import { describe, expect, it } from 'vitest';
import { LineageMemory, type LineageLesson } from './lineage-memory.js';
import { resolveLineageConflict } from './lineage-conflict-resolution.js';

describe('decay-aware lineage conflict', () => {
  it('lets fresh evidence beat stale evidence when raw scores would tie', () => {
    const memory = new LineageMemory(10);
    memory.add({ id: 'old-use', strategyId: 'A', kind: 'use', context: 'coding', lesson: 'u', confidence: 1, occurrences: 1, evidenceValue: 10, originId: 'p', generation: 1 });
    memory.add({ id: 'fresh-avoid', strategyId: 'A', kind: 'avoid', context: 'coding', lesson: 'a', confidence: 1, occurrences: 1, evidenceValue: 10, originId: 'c', generation: 10 });

    const lessons: LineageLesson[] = memory.lessonsFor('A', 'coding');
    const resolved = resolveLineageConflict(lessons, lesson => memory.effectiveQuality(lesson as LineageLesson));
    expect(resolved.winner).toBe('avoid');
  });
});
