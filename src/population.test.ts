import { describe, expect, it } from 'vitest';
import { PopulationController } from './population.js';

describe('PopulationController', () => {
  const controller = new PopulationController();

  it('terminates when balance is exhausted', () => {
    expect(controller.decide({ id: 'a', balance: 0, fitness: 10, generation: 1, maxChildren: 2, childrenCreated: 0 }).action).toBe('terminate');
  });

  it('replicates only with positive fitness and remaining budget', () => {
    expect(controller.decide({ id: 'a', balance: 10, fitness: 1, generation: 1, maxChildren: 2, childrenCreated: 0 })).toMatchObject({ action: 'replicate', childBudget: 1 });
  });

  it('survives without replicating when fitness is not positive', () => {
    expect(controller.decide({ id: 'a', balance: 10, fitness: 0, generation: 1, maxChildren: 2, childrenCreated: 0 }).action).toBe('survive');
  });
});
