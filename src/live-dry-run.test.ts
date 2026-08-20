import { describe, expect, it } from 'vitest';
import { runLiveDryRun } from './live-dry-run.js';

const opportunity = {
  id: 'btc-1', domain: 'crypto' as const, venue: 'test', asset: 'BTC',
  estimatedValue: 100, estimatedCost: 10, risk: .1, urgency: .5, liquidity: .9,
  requiredService: 'exchange', evidence: []
};

const wallet = { walletId: 'w1', canExecute: false, domains: ['crypto' as const], services: ['exchange'] };

const discovery = { discover: async () => ({ opportunities: [opportunity], staleCount: 0, providerCount: 1 }) };
const gate = { evaluate: () => ({ allowed: true, reason: 'ok', opportunity }) };
const decision = { best: () => ({ opportunity, score: 1 }) };
const execution = { execute: async () => { throw new Error('must not execute during dry run'); } };

describe('live dry run', () => {
  it('selects without executing', async () => {
    const result = await runLiveDryRun(discovery, gate, decision, execution, wallet);
    expect(result.selectedId).toBe('btc-1');
    expect(result.executed).toBe(false);
  });
});
