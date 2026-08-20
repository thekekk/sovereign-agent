import type { Opportunity } from './opportunity-bus.js';

export interface SandboxExecutionOptions {
  realizedValueMultiplier?: number;
}

export class SandboxExecutor {
  readonly domain: Opportunity['domain'] = 'crypto';
  readonly service = 'sandbox';

  constructor(private readonly options: SandboxExecutionOptions = {}) {}

  async execute(opportunity: Opportunity, _walletId: string, signal: AbortSignal): Promise<{ success: boolean; realizedValue?: number; realizedCost?: number; error?: string }> {
    if (signal.aborted) throw signal.reason ?? new Error('execution aborted');
    const multiplier = this.options.realizedValueMultiplier ?? 1;
    return {
      success: true,
      realizedValue: Math.max(0, opportunity.estimatedValue - opportunity.estimatedCost) * multiplier,
      realizedCost: opportunity.estimatedCost,
    };
  }
}
