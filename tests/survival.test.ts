import { describe, expect, it } from 'vitest';
import { EvolutionEngine } from '../src/evolution.js';
import { SurvivalEngine } from '../src/survival.js';

describe('survival and evolution', () => {
  it('enters critical state when runway is short', () => {
    const result = new SurvivalEngine().evaluate({
      balance: 5,
      computeCostPerHour: 4,
      revenuePerHour: 1,
      health: 100,
      offspring: 0,
      successes: 1,
      failures: 0,
      lastHeartbeat: new Date().toISOString()
    });
    expect(result.state).toBe('critical');
    expect(result.priority).toBe('recover');
  });

  it('permits controlled replication only while thriving', () => {
    const survival = new SurvivalEngine().evaluate({
      balance: 100,
      computeCostPerHour: 1,
      revenuePerHour: 5,
      health: 100,
      offspring: 0,
      successes: 10,
      failures: 1,
      lastHeartbeat: new Date().toISOString()
    });
    const result = new EvolutionEngine().decide([{ id: 'a', description: 'A', expectedValue: 10, attempts: 10, successes: 8, failures: 2 }], survival);
    expect(result.spawnWorker).toBe(true);
  });

  it('never replicates after death condition', () => {
    const survival = new SurvivalEngine().evaluate({
      balance: 0,
      computeCostPerHour: 1,
      revenuePerHour: 0,
      health: 100,
      offspring: 0,
      successes: 0,
      failures: 1,
      lastHeartbeat: new Date().toISOString()
    });
    const result = new EvolutionEngine().decide([], survival);
    expect(result.spawnWorker).toBe(false);
  });
});
