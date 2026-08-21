import { describe, expect, it } from 'vitest';
import { GenerationLineage } from './generation-lineage.js';
import { LineageMemory } from './lineage-memory.js';
import { LineageStrategyMemory } from './lineage-strategy-memory.js';

function useLesson(strategyId: string, generation: number) {
  return {
    id: `use:${strategyId}`,
    strategyId,
    kind: 'use' as const,
    context: 'build',
    lesson: `use ${strategyId}`,
    evidenceValue: 10,
    confidence: 0.9,
    occurrences: 1,
    originId: `origin-${generation}`,
    generation
  };
}

describe('GenerationLineage', () => {
  it('carries parent knowledge into a child and grandchild', () => {
    const parent = new LineageMemory(1);
    parent.add(useLesson('A', 1));

    const lineage = new GenerationLineage();
    const child = lineage.createChild({ childId: 'child-2', parent: parent.snapshot() });
    child.memory.add(useLesson('B', 2));

    const grandchild = lineage.createChild({ childId: 'child-3', parent: child.memory.snapshot() });
    const memory = new LineageStrategyMemory(grandchild.memory);

    expect(grandchild.generation).toBe(3);
    expect(memory.reusable({ strategyId: 'A', context: 'build' })).toHaveLength(1);
    expect(memory.reusable({ strategyId: 'B', context: 'build' })).toHaveLength(1);
  });

  it('rejects an empty child id without creating a lineage', () => {
    const parent = new LineageMemory(1);
    expect(() => new GenerationLineage().createChild({ childId: '  ', parent: parent.snapshot() })).toThrow('childId is required');
  });
});
