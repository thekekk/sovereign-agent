import type { Opportunity, WalletCapability } from './opportunity-bus.js';
import type { OpportunityExecution } from './opportunity-execution-result.js';

export interface SandboxExecutionOptions {
  realizedValueMultiplier?: number;
}

export class SandboxExecutor {
  readonly id = 'sandbox';

  constructor(private readonly options: SandboxExecutionOptions = {}) {}

  supports(_opportunity: Opportunity, _wallet: WalletCapability): boolean {
    return true;
  }

  async execute(opportunity: Opportunity, _walletId: string, signal: AbortSignal): Promise<OpportunityExecution> {
    if (signal.aborted) throw signal.reason ?? new Error('execution aborted');
    const multiplier = this.options.realizedValueMultiplier ?? 1;
    return {
      success: true,
      realizedValue: Math.max(0, opportunity.estimatedValue - opportunity.estimatedCost) * multiplier,
      executorId: this.id
    };
  }
}
