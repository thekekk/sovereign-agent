import { describe, expect, it, vi } from 'vitest';
import { GenerationManager } from './generation-manager.js';
import { LineageMemory } from './lineage-memory.js';
import { OutcomeToLineage } from './outcome-to-lineage.js';

describe('generation to lineage learning', () => {
  it('records a verified mutation outcome on the managed child lineage', () => {
    const manager = new GenerationManager();
    const parent = new LineageMemory(1);
    const child = manager.createChildLineage('child-2', parent.snapshot());
    const context = manager.createCodingLearningContext(child, 'strategy-A', 'coding');
    const lineage = new LineageMemory(child.generation);
    const recorder = new OutcomeToLineage(lineage);

    recorder.record({
      ...context,
      outcome: {
        checkpointId: 'cp-1',
        evidence: { backend: 'local', verified: true, value: 10, reason: 'verified mutation' }
      }
    });

    expect(lineage.lessonsFor('strategy-A', 'coding')).toEqual([
      expect.objectContaining({ kind: 'use', strategyId: 'strategy-A', originId: 'parent-1', generation: 2 })
    ]);
  });

  it('turns a failed verified mutation into an avoid lesson', () => {
    const manager = new GenerationManager();
    const parent = new LineageMemory(1);
    const child = manager.createChildLineage('child-2', parent.snapshot());
    const context = manager.createCodingLearningContext(child, 'strategy-A', 'coding');
    const lineage = new LineageMemory(child.generation);
    const recorder = new OutcomeToLineage(lineage);

    recorder.record({
      ...context,
      outcome: {
        checkpointId: 'cp-2',
        evidence: { backend: 'local', verified: false, value: 0, reason: 'tests failed' }
      }
    });

    expect(lineage.lessonsFor('strategy-A', 'coding')).toEqual([
      expect.objectContaining({ kind: 'avoid', lesson: 'tests failed', generation: 2 })
    ]);
  });
});
