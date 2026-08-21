import { describe, expect, it } from 'vitest';
import { createSandboxExecutorRegistry } from './sandbox-runtime.js';

describe('sandbox runtime factory', () => {
  it('creates a usable executor registry', () => {
    const registry = createSandboxExecutorRegistry();
    expect(registry).toBeDefined();
  });
});
