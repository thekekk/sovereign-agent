import { describe, expect, it } from 'vitest';
import { rmSync } from 'node:fs';
import { DurableSurvivalState } from '../src/survival-state.js';
import { AccountingLedger } from '../src/accounting.js';

const db = '/tmp/sovereign-survival-test.db';

function snapshot() {
  return {
    balance: 10,
    computeCostPerHour: 1,
    revenuePerHour: 2,
    health: 100,
    offspring: 0,
    successes: 3,
    failures: 1,
    lastHeartbeat: new Date().toISOString()
  };
}

describe('DurableSurvivalState', () => {
  it('persists survival snapshots', () => {
    rmSync(db, { force: true });
    const first = new DurableSurvivalState(db);
    first.save(snapshot());
    const second = new DurableSurvivalState(db);
    expect(second.load()?.balance).toBe(10);
    expect(second.load()?.successes).toBe(3);
    rmSync(db, { force: true });
  });

  it('applies accounting without allowing negative balance', () => {
    rmSync(db, { force: true });
    const state = new DurableSurvivalState(db);
    const ledger = new AccountingLedger();
    ledger.recordCost({ id: 'c', timestamp: new Date().toISOString(), amount: 50, currency: 'USD', source: 'compute' });
    const next = state.applyAccounting(snapshot(), ledger, 1);
    expect(next.balance).toBe(0);
    rmSync(db, { force: true });
  });
});
