import { describe, expect, it } from 'vitest';
import { GenerationManager } from './generation-manager.js';

const sha = 'a'.repeat(40);

function input() {
  return {
    population: { id: 'parent', balance: 100, fitness: 0, generation: 0, maxChildren: 1, childrenCreated: 0 },
    outcomes: { successes: 2, failures: 0, totalCost: 1, totalValue: 10, successRate: 1 },
    survival: { balance: 100, computeCostPerHour: 1, revenuePerHour: 2, health: 100, offspring: 0, successes: 2, failures: 0, lastHeartbeat: new Date().toISOString() }
  };
}

describe('GenerationManager', () => {
  it('permits reproduction only when evolution policy agrees', () => {
    const result = new GenerationManager().evaluate(input());
    expect(result.generation).toBe(0);
    expect(result.decision.reproduce).toBe(true);
  });

  it('rewards a child only after matching successful CI provenance', () => {
    const result = new GenerationManager().finalizeChild('child-1', 1, {
      runId: 'run-1', workflow: 'CI', conclusion: 'success', sourceCommit: sha
    }, sha);
    expect(result.lifecycle.state).toBe('survived');
    expect(result.fitness.fitnessDelta).toBe(1);
  });

  it('kills a child with mismatched provenance even when CI passed', () => {
    const result = new GenerationManager().finalizeChild('child-2', 1, {
      runId: 'run-2', workflow: 'CI', conclusion: 'success', sourceCommit: sha
    }, 'b'.repeat(40));
    expect(result.lifecycle.state).toBe('terminated');
    expect(result.fitness.fitnessDelta).toBe(-1);
  });
});
