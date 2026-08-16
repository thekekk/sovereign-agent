import { describe, expect, it } from 'vitest';
import { EconomicStrategyController } from './economic-strategy.js';
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

const negative: OutcomeSummary = {
  successes: 2,
  failures: 3,
  totalCost: 10,
  totalValue: 2,
  successRate: 0.4
};

const positive: OutcomeSummary = {
  successes: 9,
  failures: 1,
  totalCost: 2,
  totalValue: 20,
  successRate: 0.9
};

describe('EconomicStrategyController', () => {
  it('recovers when recent work is net negative', () => {
    const decision = new EconomicStrategyController().decide(negative, healthy);
    expect(decision.action).toBe('recover');
    expect(decision.netValue).toBeLessThan(0);
  });

  it('preserves growth when economics and survival support it', () => {
    const decision = new EconomicStrategyController().decide(positive, { ...healthy, balance: 500 });
    expect(decision.netValue).toBeGreaterThan(0);
    expect(decision.nextBudget).toBeGreaterThan(0);
  });
});
