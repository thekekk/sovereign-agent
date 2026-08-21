import { describe, expect, it } from 'vitest';
import { assertLiveExecutionEnabled, resolveRuntimeMode } from './runtime-mode.js';

describe('runtime mode', () => {
  it('defaults to sandbox', () => expect(resolveRuntimeMode()).toBe('sandbox'));
  it('does not enable live mode from mode alone', () => expect(resolveRuntimeMode({ mode: 'live' })).toBe('sandbox'));
  it('requires explicit live opt-in', () => expect(resolveRuntimeMode({ mode: 'live', liveExecutionEnabled: true })).toBe('live'));
  it('rejects live execution without explicit opt-in', () => expect(() => assertLiveExecutionEnabled({ mode: 'live' })).toThrow());
});
