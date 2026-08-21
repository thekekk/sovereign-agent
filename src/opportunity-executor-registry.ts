import type { Opportunity, WalletCapability } from './opportunity-bus.js';
import type { OpportunityExecutor } from './opportunity-execution-result.js';

export class OpportunityExecutorRegistry {
  private readonly executors: OpportunityExecutor[] = [];

  register(executor: OpportunityExecutor): void {
    if (this.executors.some(item => item.domain === executor.domain && item.service === executor.service)) {
      throw new Error(`executor already registered: ${executor.domain}:${executor.service ?? 'generic'}`);
    }
    this.executors.push(executor);
  }

  resolve(opportunity: Opportunity, wallet: WalletCapability): OpportunityExecutor | undefined {
    if (!wallet.canExecute || !wallet.domains.includes(opportunity.domain)) return undefined;
    return this.executors.find(executor =>
      executor.domain === opportunity.domain &&
      (!opportunity.requiredService || executor.service === opportunity.requiredService) &&
      (!executor.service || wallet.services.includes(executor.service))
    );
  }
}
