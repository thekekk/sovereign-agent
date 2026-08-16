import { describe, expect, it } from 'vitest';
import { LineageMemory } from './lineage-memory.js';
import { LineageStrategyMemory } from './lineage-strategy-memory.js';
import { StrategyLearningWithMemory } from './strategy-learning-with-memory.js';

const lesson = (strategyId: string, kind: 'use' | 'avoid', confidence: number, generation = 1) => ({
  id: `${kind}:${strategyId}:build`, strategyId, kind, context: 'build', lesson: `${kind} ${strategyId}`,
  evidenceValue: kind === 'use' ? 10 : -10, confidence, occurrences: 3,
  originId: 'ancestor-1', generation
});

describe('lineage learning', () => {
  it('passes accumulated lessons from parent to child and grandchild', () => {
    const parent = new LineageMemory(1);
    parent.add(lesson('A', 'use', 0.9));
    parent.add(lesson('B', 'avoid', 0.95));

    const child = new LineageMemory(2);
    child.inherit(parent.snapshot());
    child.add(lesson('C', 'use', 0.8, 2));

    const grandchild = new LineageMemory(3);
    grandchild.inherit(child.snapshot());

    const memory = new LineageStrategyMemory(grandchild);
    expect(memory.reusable({ strategyId: 'A', context: 'build' })).toHaveLength(1);
    expect(memory.shouldAvoid({ strategyId: 'B', context: 'build' })).toBe(true);
    expect(memory.reusable({ strategyId: 'C', context: 'build' })).toHaveLength(1);
  });

  it('uses inherited memory to prefer proven strategy over a failed one', () => {
    const lineage = new LineageMemory(2);
    lineage.add(lesson('good', 'use', 0.9));
    lineage.add(lesson('bad', 'avoid', 0.95));
    const selector = new StrategyLearningWithMemory(new LineageStrategyMemory(lineage));

    const result = selector.decide(
      { attempts: 0, successfulAttempts: 0, verifiedValue: 0, totalCost: 0 } as never,
      { runway: 100, survivalScore: 1 } as never,
      [
        { name: 'good', basePriority: 1, estimatedCost: 1 },
        { name: 'bad', basePriority: 2, estimatedCost: 1 }
      ],
      [],
      'build'
    );

    expect(result.selectedStrategy).toBe('good');
  });
});
