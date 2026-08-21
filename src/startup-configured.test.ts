import { describe, expect, it } from 'vitest';
import { startConfiguredSandboxRuntime } from './startup.js';

describe('configured sandbox startup', () => {
  it('assembles the runtime from environment configuration', () => {
    const result = startConfiguredSandboxRuntime(
      [{ domain: 'crypto', fetch: async () => [] }],
      {
        SOVEREIGN_MODE: 'sandbox',
        SOVEREIGN_WALLET_ID: 'wallet-1',
        SOVEREIGN_WALLET_DOMAINS: 'crypto',
        SOVEREIGN_WALLET_SERVICES: 'sandbox',
        SOVEREIGN_PROVIDERS: 'sandbox|crypto|sandbox|https://sandbox.example',
      }
    );
    expect(result.state).toEqual({ mode: 'sandbox', walletCount: 1, providerCount: 1 });
    expect(result.runtime).toBeDefined();
  });
});
