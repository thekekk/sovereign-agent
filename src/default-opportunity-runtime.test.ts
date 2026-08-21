import { describe, expect, it } from 'vitest';
import { createDefaultSandboxRuntime } from './default-opportunity-runtime.js';

const feed = { domain: 'crypto' as const, fetch: async () => [] };

describe('default opportunity runtime', () => {
  it('composes discovery, decision, capability and sandbox execution', () => {
    const runtime = createDefaultSandboxRuntime(
      [{ id: 'sandbox-crypto', domain: 'crypto', service: 'sandbox', baseUrl: 'https://sandbox.example', enabled: true }],
      [feed],
      { SOVEREIGN_MODE: 'sandbox' }
    );
    expect(runtime).toBeDefined();
  });
});
