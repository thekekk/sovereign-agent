import { describe, expect, it } from 'vitest';
import { startSandboxRuntime } from './startup.js';

describe('startup', () => {
  it('assembles the sandbox runtime and reports configured resources', () => {
    const result = startSandboxRuntime({
      discovery: { discover: async () => ({ opportunities: [], staleCount: 0, providerCount: 0 }) } as any,
      decision: { best: () => undefined } as any,
      capabilityGate: { evaluate: () => ({ allowed: true, reason: 'test' }) } as any,
      learning: { record: () => undefined } as any
    }, {
      SOVEREIGN_WALLET_ID: 'sandbox-wallet',
      SOVEREIGN_WALLET_SERVICES: 'sandbox',
      SOVEREIGN_PROVIDERS: 'crypto|crypto|exchange|https://crypto.example'
    });
    expect(result.state).toEqual({ mode: 'sandbox', walletCount: 1, providerCount: 1 });
    expect(result.runtime).toBeDefined();
  });
});
