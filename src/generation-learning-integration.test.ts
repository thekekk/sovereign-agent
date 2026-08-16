import { describe, expect, it } from 'vitest';
import { LineageMemory } from './lineage-memory.js';
import { LineageReproduction } from './lineage-reproduction.js';
import { contextForChild, toCodingLearningContext } from './generation-agent-context.js';

describe('generation learning integration', () => {
  it('carries generation identity into verified coding learning context', () => {
    const parent = new LineageMemory(1);
    const child = new LineageReproduction().createChild(parent.snapshot(), 'parent-1');
    const agent = contextForChild(child, 'strategy-A', 'coding');
    const learning = toCodingLearningContext(agent);

    expect(agent.generation).toBe(2);
    expect(agent.originId).toBe('parent-1');
    expect(learning).toEqual({ strategyId: 'strategy-A', context: 'coding', originId: 'parent-1' });
  });

  it('rejects incomplete generation identity before coding can start', () => {
    expect(() => toCodingLearningContext({ generation: 2, originId: '', strategyId: 'A', context: 'coding' })).toThrow('originId is required');
  });
});
