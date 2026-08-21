import { describe, expect, it } from 'vitest';
import { GenerationManager } from './generation-manager.js';
import { LineageMemory } from './lineage-memory.js';

describe('GenerationManager learning context', () => {
  it('derives coding identity from the managed child lineage', () => {
    const manager = new GenerationManager();
    const parent = new LineageMemory(1);
    const child = manager.createChildLineage('child-2', parent.snapshot());

    expect(manager.createCodingLearningContext(child, 'strategy-A', 'coding')).toEqual({
      strategyId: 'strategy-A',
      context: 'coding',
      originId: 'child-2'
    });
  });
});
