import { describe, expect, it } from 'vitest';
import { WalletServiceMatrix } from './wallet-service-matrix.js';
import type { Opportunity, WalletCapability } from './opportunity-bus.js';

const wallet: WalletCapability = {
  walletId: 'w1', canExecute: true, domains: ['crypto', 'mint'], services: ['exchange-a', 'mint-x']
};
const opportunity = (requiredService?: string): Opportunity => ({
  id: 'o1', domain: 'crypto', venue: 'v', asset: 'asset-1', estimatedValue: 100, estimatedCost: 10, risk: .1,
  urgency: .5, liquidity: .9, requiredService, evidence: []
});

describe('wallet service matrix', () => {
  it('allows a matching enabled service', () => {
    const matrix = new WalletServiceMatrix([{ service: 'exchange-a', domains: ['crypto'], enabled: true }]);
    expect(matrix.canUse(wallet, opportunity('exchange-a')).allowed).toBe(true);
  });
  it('rejects a service the wallet does not have', () => {
    const matrix = new WalletServiceMatrix([{ service: 'exchange-b', domains: ['crypto'], enabled: true }]);
    expect(matrix.canUse(wallet, opportunity('exchange-b')).allowed).toBe(false);
  });
  it('rejects a service disabled for the domain', () => {
    const matrix = new WalletServiceMatrix([{ service: 'exchange-a', domains: ['mint'], enabled: true }]);
    expect(matrix.canUse(wallet, opportunity('exchange-a')).allowed).toBe(false);
  });
});
