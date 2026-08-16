import { describe, expect, it } from 'vitest';
import { LineageMemory } from './lineage-memory.js';
import { LineageReproduction } from './lineage-reproduction.js';
import { LineageStrategyMemory } from './lineage-strategy-memory.js';
import { StrategyLearning } from './strategy-learning.js';

describe('inherited strategy selection', () => {
  it('uses an inherited AVOID lesson to prefer another strategy', () => {
    const parent = new LineageMemory(1);
    parent.add({
      id: 'avoid:A:coding',
      strategyId: 'A',
      kind: 'avoid',
      context: 'coding',
      lesson: 'tests failed',
      evidenceValue: 0,
      confidence: 0.9,
      occurrences: 1,
      originId: 'parent-1',
      generation: 1
    });

    const child = new LineageReproduction().createChild(parent.snapshot(), 'child-2');
    const learning = new StrategyLearning(
      { decide: () => ({ action: 'continue', fitness: { score: 0 }, survival: { priority: 'hold' }, reason: 'ok' }) } as never,
      new LineageStrategyMemory(child.memory)
    );

    const decision = learning.decide(
      {} as never,
      {} as never,
      [
        { name: 'A', basePriority: 1, estimatedCost: 1 },
        { name: 'B', basePriority: 1, estimatedCost: 1 }
      ],
      [],
      'coding'
    );

    expect(decision.selectedStrategy).toBe('B');
  });
});
