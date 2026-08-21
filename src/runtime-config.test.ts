import { describe, expect, it } from 'vitest';
import { loadRuntimeConfig } from './runtime-config.js';

describe('runtime config', () => {
  it('defaults to sandbox with no providers', () => {
    expect(loadRuntimeConfig({})).toEqual({ mode: 'sandbox', providerUrls: [], liveExecutionEnabled: false });
  });

  it('requires providers for live mode', () => {
    expect(() => loadRuntimeConfig({ SOVEREIGN_MODE: 'live', SOVEREIGN_LIVE_EXECUTION: 'true' })).toThrow();
  });

  it('accepts explicitly enabled live mode with providers', () => {
    expect(loadRuntimeConfig({ SOVEREIGN_MODE: 'live', SOVEREIGN_LIVE_EXECUTION: 'true', SOVEREIGN_PROVIDER_URLS: 'https://one.example, https://two.example' })).toEqual({
      mode: 'live', providerUrls: ['https://one.example', 'https://two.example'], liveExecutionEnabled: true
    });
  });
});
