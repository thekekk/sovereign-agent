import { describe, expect, it } from 'vitest';
import { createSandboxExecutorRegistry } from './sandbox-runtime.js';
import type { Opportunity } from './opportunity-bus.js';

const opportunity: Opportunity = {
  id: 'sandbox-e2e', domain: 'crypto', venue: 'test', asset: 'BTC',
  estimatedValue: 100, estimatedCost: 10, risk: .1, urgency: .5, liquidity: .9,
  requiredService: 'sandbox', evidence: []
};

describe('sandbox runtime', () => {
  it('resolves and executes the sandbox executor', async () => {
    const registry = createSandboxExecutorRegistry();
    const wallet = { walletId: 'w-sandbox', canExecute: true, domains: ['crypto' as const], services: ['sandbox'] };
    const executor = registry.resolve(opportunity, wallet);
    expect(executor).toBeDefined();
    const result = await executor!.execute(opportunity, wallet.walletId, new AbortController().signal);
    expect(result).toEqual({ success: true, realizedValue: 90, realizedCost: 10 });
  });

  it('does not resolve when the wallet lacks the sandbox service', () => {
    const registry = createSandboxExecutorRegistry();
    const wallet = { walletId: 'w-no-sandbox', canExecute: true, domains: ['crypto' as const], services: [] };
    expect(registry.resolve(opportunity, wallet)).toBeUndefined();
  });
});
