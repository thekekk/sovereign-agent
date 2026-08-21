import { describe, expect, it } from 'vitest';
import { TaskEconomics } from './task-economics.js';
import { OutcomeLedger } from './outcome-ledger.js';

function ledger() {
  return new OutcomeLedger(':memory:');
}

describe('TaskEconomics', () => {
  it('records measured compute cost and net value', () => {
    const economics = new TaskEconomics(ledger());
    const result = economics.record({
      taskId: 'task-1',
      startedAtMs: 0,
      finishedAtMs: 3_600_000,
      costPerHour: 0.25,
      value: 2,
      success: true,
      source: 'test'
    });
    expect(result.event.cost).toBe(0.25);
    expect(result.netValue).toBe(1.75);
    expect(result.profitable).toBe(true);
  });

  it('rejects negative duration', () => {
    const economics = new TaskEconomics(ledger());
    expect(() => economics.record({
      taskId: 'task-2', startedAtMs: 10, finishedAtMs: 1,
      costPerHour: 1, value: 1, success: false, source: 'test'
    })).toThrow('Invalid task timestamps');
  });
});
