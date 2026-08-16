import { describe, expect, it } from 'vitest';
import { StrategyController } from './strategy-controller.js';
import type { OutcomeSummary } from './outcome-ledger.js';
import type { SurvivalSnapshot } from './survival.js';

const healthy: SurvivalSnapshot = {
  balance: 100,
  computeCostPerHour: 1,
  revenuePerHour: 2,
  health: 100,
  offspring: 0,
  successes: 10,
  failures: 1,
  lastHeartbeat: new Date().toISOString()
};

const viable: OutcomeSummary = {
  successes: 8,
  failures: 1,
  totalCost: 2,
  totalValue: 10,
  successRate: 8 / 9
};

describe('StrategyController', () => {
  it('checkpoints reliable positive work while thriving', () => {
    const decision = new StrategyController().decide(viable, healthy);
    expect(decision.action).toBe('checkpoint');
    expect(decision.fitness.score).toBeGreaterThan(0.6);
  });

  it('recovers when runway is critical', () => {
    const decision = new StrategyController().decide(viable, { ...healthy, balance: 0.5, computeCostPerHour: 10, revenuePerHour: 0 });
    expect(decision.action).toBe('recover');
    expect(decision.survival.state).toBe('critical');
  });

  it('stops when resources are exhausted', () => {
    const decision = new StrategyController().decide(viable, { ...healthy, balance: 0 });
    expect(decision.action).toBe('stop');
    expect(decision.survival.state).toBe('dead');
  });
});
