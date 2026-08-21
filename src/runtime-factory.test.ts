import { describe, expect, it } from 'vitest';
import { createRuntime } from './runtime-factory.js';

describe('runtime factory', () => {
  it('assembles sandbox runtime with real execution gate', () => {
    const runtime = createRuntime({
      discovery: { discover: async () => ({ opportunities: [], staleCount: 0, providerCount: 0 }) } as any,
      decision: { best: () => undefined } as any,
      capabilityGate: { evaluate: () => ({ allowed: true, reason: 'test' }) } as any,
      learning: { record: () => undefined } as any
    }, {});
    expect(runtime).toBeDefined();
  });

  it('does not assemble live runtime through the sandbox factory', () => {
    expect(() => createRuntime({
      discovery: {} as any,
      decision: {} as any,
      capabilityGate: {} as any,
      learning: {} as any
    }, { SOVEREIGN_MODE: 'live', SOVEREIGN_LIVE_EXECUTION: 'true', SOVEREIGN_PROVIDER_URLS: 'https://provider.example' })).toThrow('live runtime assembly requires a dedicated live executor factory');
  });
});
