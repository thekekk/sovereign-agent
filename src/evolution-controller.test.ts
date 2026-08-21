import { describe, expect, it } from 'vitest';
import { EvolutionController } from './evolution-controller.js';

const outcomes = { successes: 10, failures: 0, totalCost: 1, totalValue: 10, successRate: 1 };
const healthy = { balance: 100, computeCostPerHour: 1, revenuePerHour: 10, health: 100, offspring: 0, successes: 10, failures: 0, lastHeartbeat: new Date().toISOString() };

// The controller is intentionally conservative: high fitness alone is not
// enough unless the survival policy is also in its grow state.
describe('EvolutionController', () => {
  it('permits reproduction only when strategy and population agree', () => {
    const result = new EvolutionController().decide({
      population: { id: 'root', balance: 100, fitness: 0, generation: 0, maxChildren: 1, childrenCreated: 0 },
      outcomes,
      survival: healthy
    });
    expect(result.strategy.survival.priority).toBe('grow');
    expect(result.population.action).toBe('replicate');
    expect(result.reproduce).toBe(true);
  });

  it('does not reproduce when runway is exhausted', () => {
    const result = new EvolutionController().decide({
      population: { id: 'root', balance: 0, fitness: 1, generation: 0, maxChildren: 1, childrenCreated: 0 },
      outcomes,
      survival: { ...healthy, balance: 0 }
    });
    expect(result.reproduce).toBe(false);
    expect(result.population.action).toBe('terminate');
  });
});
