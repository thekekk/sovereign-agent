import { describe, expect, it } from 'vitest';
import { LineageMemory } from './lineage-memory.js';

describe('lineage evidence decay', () => {
  it('reduces effective quality for stale lessons while preserving provenance', () => {
    const memory = new LineageMemory(10);
    memory.add({
      id: 'old', strategyId: 'A', kind: 'use', context: 'coding', lesson: 'verified',
      evidenceValue: 10, confidence: 0.9, occurrences: 1, originId: 'parent', generation: 1
    });

    const lesson = memory.lessonsFor('A', 'coding')[0];
    expect(lesson.originId).toBe('parent');
    // add() preserves the lesson's original generation; age is calculated from it.
    expect(lesson.generation).toBe(1);
    expect(memory.effectiveQuality(lesson)).toBeLessThan(lesson.confidence * lesson.evidenceValue);
  });

  it('does not decay fresh evidence', () => {
    const memory = new LineageMemory(10);
    memory.add({
      id: 'fresh', strategyId: 'A', kind: 'use', context: 'coding', lesson: 'verified',
      evidenceValue: 10, confidence: 0.9, occurrences: 1, originId: 'child', generation: 10
    });
    const lesson = memory.lessonsFor('A', 'coding')[0];
    expect(memory.effectiveQuality(lesson)).toBe(lesson.confidence * lesson.evidenceValue);
  });
});
