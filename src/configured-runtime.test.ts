import { describe, expect, it } from 'vitest';
import { createConfiguredRuntime } from './configured-runtime.js';

describe('configured runtime', () => {
  it('assembles sandbox runtime and wallet capabilities from env', () => {
    const result = createConfiguredRuntime({
      decision: { best: () => undefined } as any,
      capabilityGate: { evaluate: () => ({ allowed: true, reason: 'test' }) } as any,
      learning: { record: () => undefined } as any,
    }, [], {
      SOVEREIGN_PROVIDERS: 'crypto|crypto|sandbox|https://crypto.example',
      SOVEREIGN_WALLET_ID: 'w1',
      SOVEREIGN_WALLET_DOMAINS: 'crypto,xstocks',
      SOVEREIGN_WALLET_SERVICES: 'sandbox',
    });
    expect(result.runtime).toBeDefined();
    expect(result.wallets).toEqual([{ walletId: 'w1', canExecute: false, domains: ['crypto', 'xstocks'], services: ['sandbox'] }]);
  });
});
