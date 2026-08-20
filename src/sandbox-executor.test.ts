import { describe, expect, it } from 'vitest';
import { SandboxExecutor } from './sandbox-executor.js';
import type { Opportunity } from './opportunity-bus.js';

const opportunity: Opportunity = {
  id: 'sandbox-1', domain: 'crypto', venue: 'test', asset: 'BTC', estimatedValue: 100,
  estimatedCost: 10, risk: .1, urgency: .5, liquidity: .9, requiredService: 'sandbox', evidence: []
};

describe('sandbox executor', () => {
  it('returns a deterministic simulated result', async () => {
    const executor = new SandboxExecutor();
    const result = await executor.execute(opportunity, 'wallet-test', new AbortController().signal);
    expect(result.success).toBe(true);
    expect(result.realizedValue).toBe(90);
    expect(result.realizedCost).toBe(10);
  });

  it('honors cancellation before execution', async () => {
    const executor = new SandboxExecutor();
    const controller = new AbortController();
    controller.abort();
    await expect(executor.execute(opportunity, 'wallet-test', controller.signal)).rejects.toBeDefined();
  });
});
