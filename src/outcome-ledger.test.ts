import { describe, expect, it } from 'vitest';
import { OutcomeLedger } from './outcome-ledger.js';
import { FitnessEngine } from './fitness.js';

describe('OutcomeLedger', () => {
  it('persists and summarizes successful and failed work', () => {
    const ledger = new OutcomeLedger(':memory:');
    ledger.record({ taskId: 'a', kind: 'success', durationMs: 10, cost: 2, value: 8, source: 'test' });
    ledger.record({ taskId: 'b', kind: 'failure', durationMs: 20, cost: 3, value: 0, source: 'test' });

    expect(ledger.summary()).toEqual({
      successes: 1,
      failures: 1,
      totalCost: 5,
      totalValue: 8,
      successRate: 0.5
    });
    expect(ledger.recent(1)).toHaveLength(1);
  });
});

describe('FitnessEngine', () => {
  it('rewards reliable positive outcomes and penalizes failures', () => {
    const engine = new FitnessEngine();
    const strong = engine.score({ successes: 10, failures: 1, totalCost: 5, totalValue: 20, successRate: 10 / 11 });
    const weak = engine.score({ successes: 1, failures: 9, totalCost: 20, totalValue: 0, successRate: 0.1 });

    expect(strong.score).toBeGreaterThan(weak.score);
    expect(strong.reason).toContain('Reliable');
    expect(weak.reason).toContain('Negative');
  });
});
