import { describe, expect, it } from 'vitest';
import type { Opportunity, WalletCapability } from './opportunity-bus.js';
import { WalletServiceMatrix } from './wallet-service-matrix.js';
import { OpportunityDecisionGate } from './opportunity-decision-gate.js';

const opportunity: Opportunity = {
  id: 'o1', domain: 'crypto', venue: 'exchange', asset: 'BTC', estimatedValue: 100,
  estimatedCost: 10, risk: 0.1, urgency: 0.5, liquidity: 0.9,
  requiredService: 'exchange-x', evidence: []
};

const wallet: WalletCapability = {
  walletId: 'w1', canExecute: true, domains: ['crypto'], services: ['exchange-y']
};

describe('opportunity capability gate', () => {
  it('rejects an opportunity requiring an unavailable service', () => {
    const gate = new OpportunityDecisionGate(new WalletServiceMatrix([
      { service: 'exchange-x', domains: ['crypto'], enabled: true }
    ]));
    expect(gate.evaluate(opportunity, wallet).allowed).toBe(false);
  });
});
