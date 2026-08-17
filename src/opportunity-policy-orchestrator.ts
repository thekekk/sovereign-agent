import type { OpportunityBus, WalletCapability } from './opportunity-bus.js';
import type { OpportunityExecutionOrchestrator } from './opportunity-execution-orchestrator.js';
import { OpportunityDecisionPolicy, type PolicyDecision } from './opportunity-decision-policy.js';

export interface PolicyCycleResult {
  discovered: number;
  candidates: number;
  decision?: PolicyDecision;
  executed: boolean;
  reason: string;
}

export class OpportunityPolicyOrchestrator {
  constructor(
    private readonly bus: OpportunityBus,
    private readonly policy: OpportunityDecisionPolicy,
    private readonly executor: OpportunityExecutionOrchestrator
  ) {}

  async cycle(wallet: WalletCapability, signal: AbortSignal = new AbortController().signal): Promise<PolicyCycleResult> {
    const opportunities = await this.bus.discover(signal);
    if (signal.aborted) return { discovered: opportunities.length, candidates: 0, executed: false, reason: 'cancelled' };
    const decisions = opportunities.map(opportunity => this.policy.evaluate(opportunity, wallet));
    const candidates = decisions.filter(decision => decision.execute).length;
    const decision = this.policy.best(opportunities, wallet);
    if (!decision) return { discovered: opportunities.length, candidates, executed: false, reason: 'no opportunity passed hard policy' };
    const result = await this.executor.execute(decision.opportunity, wallet, signal);
    return {
      discovered: opportunities.length,
      candidates,
      decision,
      executed: result.success,
      reason: result.success ? 'execution completed' : (result.error ?? 'execution failed')
    };
  }
}
