import type { Opportunity, WalletCapability } from './opportunity-bus.js';
import { OpportunityPolicy } from './opportunity-policy.js';
import { OpportunityExecutionGate } from './opportunity-execution-gate.js';

export interface PolicyDecision { opportunity: Opportunity; execute: boolean; reason: string; score: number; }

export class OpportunityDecisionPolicy {
  constructor(private readonly policy: OpportunityPolicy, private readonly execution: OpportunityExecutionGate) {}

  evaluate(opportunity: Opportunity, wallet: WalletCapability): PolicyDecision {
    const policy = this.policy.evaluate(opportunity);
    if (!policy.allowed) return { opportunity, execute: false, reason: policy.reasons.join('; '), score: Number.NEGATIVE_INFINITY };
    const execution = this.execution.authorize({ opportunity, wallet });
    if (execution.decision !== 'execute') return { opportunity, execute: false, reason: execution.reason, score: Number.NEGATIVE_INFINITY };
    const score = policy.netValue * (1 - opportunity.risk) * Math.max(policy.confidence, 0.01) * Math.max(opportunity.liquidity, 0.01);
    return { opportunity, execute: true, reason: 'all policy and execution gates passed', score };
  }

  best(opportunities: readonly Opportunity[], wallet: WalletCapability): PolicyDecision | undefined {
    return opportunities.map(item => this.evaluate(item, wallet)).filter(item => item.execute).sort((a, b) => b.score - a.score)[0];
  }
}
