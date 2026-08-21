import type { OpportunityBus, WalletCapability } from './opportunity-bus.js';
import type { OpportunityAutonomyBridge } from './opportunity-autonomy-bridge.js';
import type { OpportunityExecutionOrchestrator } from './opportunity-execution-orchestrator.js';

export interface ContinuousCycleResult {
  discovered: number;
  selectedOpportunityId?: string;
  allowed: boolean;
  reason: string;
}

export class OpportunityContinuousOrchestrator {
  constructor(
    private readonly bus: OpportunityBus,
    private readonly autonomy: OpportunityAutonomyBridge,
    private readonly executor: OpportunityExecutionOrchestrator
  ) {}

  async cycle(wallet: WalletCapability, signal: AbortSignal = new AbortController().signal): Promise<ContinuousCycleResult> {
    const opportunities = await this.bus.discover(signal);
    if (signal.aborted) return { discovered: opportunities.length, allowed: false, reason: 'cancelled' };
    const authorization = await this.autonomy.authorizeBest(opportunities, wallet);
    if (!authorization.allowed || !authorization.ranked) {
      return { discovered: opportunities.length, allowed: false, reason: authorization.reason };
    }
    const result = await this.executor.execute(authorization.ranked.opportunity, wallet, signal);
    return {
      discovered: opportunities.length,
      selectedOpportunityId: authorization.ranked.opportunity.id,
      allowed: result.success,
      reason: result.success ? 'execution completed' : (result.error ?? 'execution failed')
    };
  }
}
