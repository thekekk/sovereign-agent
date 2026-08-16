import { describe, expect, it } from 'vitest';
import { Policy } from '../src/policy.js';

describe('Policy', () => {
  it('allows read operations by default', () => {
    expect(new Policy().authorize('read').allowed).toBe(true);
  });

  it('blocks system operations by default', () => {
    expect(new Policy().authorize('system').allowed).toBe(false);
  });

  it('blocks financial operations by default', () => {
    expect(new Policy().authorize('financial', 1).allowed).toBe(false);
  });
});
