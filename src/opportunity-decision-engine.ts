import type { Opportunity, WalletCapability } from './opportunity-bus.js';

export type OpportunityAction = 'execute' | 'watch' | 'skip';

export interface RankedOpportunity {
  opportunity: Opportunity;
  action: OpportunityAction;
  score: number;
  reason: string;
}

export interface OpportunityDecisionPolicy {
  minNetValue: number;
  maxRisk: number;
  minEvidenceConfidence: number;
}

const DEFAULT_POLICY: OpportunityDecisionPolicy = {
  minNetValue: 0,
  maxRisk: 0.8,
  minEvidenceConfidence: 0.45
};

export class OpportunityDecisionEngine {
  constructor(private readonly policy: OpportunityDecisionPolicy = DEFAULT_POLICY) {}

  rank(opportunities: readonly Opportunity[], wallet: WalletCapability): RankedOpportunity[] {
    return opportunities
      .map(opportunity => this.evaluate(opportunity, wallet))
      .sort((a, b) => b.score - a.score);
  }

  best(opportunities: readonly Opportunity[], wallet: WalletCapability): RankedOpportunity | undefined {
    return this.rank(opportunities, wallet).find(item => item.action === 'execute');
  }

  private evaluate(opportunity: Opportunity, wallet: WalletCapability): RankedOpportunity {
    const netValue = opportunity.estimatedValue - opportunity.estimatedCost;
    const evidence = opportunity.evidence.length
      ? opportunity.evidence.reduce((sum, item) => sum + item.confidence, 0) / opportunity.evidence.length
      : 0;
    const compatible = wallet.canExecute && wallet.domains.includes(opportunity.domain)
      && (!opportunity.requiredService || wallet.services.includes(opportunity.requiredService));

    if (!compatible) return { opportunity, action: 'skip', score: -Infinity, reason: 'Wallet/service capability is unavailable' };
    if (netValue <= this.policy.minNetValue) return { opportunity, action: 'skip', score: netValue, reason: 'Expected value does not cover estimated cost' };
    if (opportunity.risk > this.policy.maxRisk) return { opportunity, action: 'skip', score: netValue, reason: 'Risk exceeds policy limit' };

    const score = netValue * (0.45 + evidence * 0.35) * (0.5 + opportunity.liquidity * 0.2)
      * (0.6 + opportunity.urgency * 0.4) * (1 - opportunity.risk * 0.5);
    if (evidence < this.policy.minEvidenceConfidence) {
      return { opportunity, action: 'watch', score, reason: 'Evidence is promising but below execution threshold' };
    }
    return { opportunity, action: 'execute', score, reason: 'Executable, economically positive, sufficiently evidenced and within risk policy' };
  }
}
