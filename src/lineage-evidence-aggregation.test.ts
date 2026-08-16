import { describe, expect, it } from 'vitest';
import { LineageMemory } from './lineage-memory.js';
import { StrategyOutcomeToLineage } from './strategy-outcome-to-lineage.js';

describe('lineage evidence aggregation', () => {
  it('aggregates repeated observations while capping confidence', () => {
    const memory = new LineageMemory(2);
    const recorder = new StrategyOutcomeToLineage(memory);
    recorder.record({ strategyId: 'A', context: 'coding', originId: 'w1', verified: true, value: 10, lesson: 'verified' });
    recorder.record({ strategyId: 'A', context: 'coding', originId: 'w2', verified: true, value: 20, lesson: 'verified' });
    recorder.record({ strategyId: 'A', context: 'coding', originId: 'w3', verified: true, value: 30, lesson: 'verified' });

    const [lesson] = memory.lessonsFor('A', 'coding');
    expect(lesson.occurrences).toBe(3);
    expect(lesson.evidenceValue).toBe(60);
    expect(lesson.confidence).toBeLessThanOrEqual(0.95);
  });

  it('does not count the same origin twice', () => {
    const memory = new LineageMemory(2);
    const recorder = new StrategyOutcomeToLineage(memory);
    recorder.record({ strategyId: 'A', context: 'coding', originId: 'w1', verified: true, value: 10, lesson: 'verified' });
    recorder.record({ strategyId: 'A', context: 'coding', originId: 'w1', verified: true, value: 10, lesson: 'verified' });

    expect(memory.lessonsFor('A', 'coding')[0].occurrences).toBe(1);
  });
});
