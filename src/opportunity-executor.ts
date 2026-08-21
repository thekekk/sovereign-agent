import type { Opportunity } from './opportunity-bus.js';

export interface OpportunityExecutionResult {
  success: boolean;
  realizedValue?: number;
  realizedCost?: number;
  error?: string;
}

export interface OpportunityExecutor {
  readonly domain: Opportunity['domain'];
  readonly service: string;
  canExecute(opportunity: Opportunity): boolean;
  execute(opportunity: Opportunity, signal: AbortSignal): Promise<OpportunityExecutionResult>;
}

export class OpportunityExecutorRegistry {
  private readonly executors: OpportunityExecutor[] = [];

  register(executor: OpportunityExecutor): void {
    if (this.executors.some(item => item.domain === executor.domain && item.service === executor.service)) {
      throw new Error(`executor already registered: ${executor.domain}:${executor.service}`);
    }
    this.executors.push(executor);
  }

  resolve(opportunity: Opportunity): OpportunityExecutor | undefined {
    return this.executors.find(executor =>
      executor.domain === opportunity.domain &&
      (!opportunity.requiredService || executor.service === opportunity.requiredService) &&
      executor.canExecute(opportunity)
    );
  }
}
