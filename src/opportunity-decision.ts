export type OpportunityDomain =
  | 'crypto'
  | 'xstocks'
  | 'online-services'
  | 'social-hype'
  | 'mints'
  | 'goods'
  | 'collectibles'
  | 'pokemon'
  | 'other';

export interface Opportunity {
  id: string;
  domain: OpportunityDomain;
  source: string;
  title: string;
  expectedValue: number;
  estimatedCost: number;
  confidence: number;
  urgency: number;
  liquidity: number;
  walletCompatible: boolean;
  executable: boolean;
  risk: number;
  evidence: number;
  expiresAt?: string;
}

export type OpportunityAction = 'execute' | 'watch' | 'skip' | 'stop';

export interface OpportunityDecision {
  action: OpportunityAction;
  opportunity?: Opportunity;
  score: number;
  reason: string;
}

export interface OpportunityPolicy {
  minNetValue: number;
  minConfidence: number;
  maxRisk: number;
  maxCost: number;
}

/**
 * Domain-agnostic opportunity gate. Discovery is deliberately separate from
 * execution: adapters may discover unlimited opportunities, while this gate
 * decides whether one is economically and operationally worth attempting.
 */
export class OpportunityDecisionEngine {
  constructor(private readonly policy: OpportunityPolicy) {}

  decide(opportunities: readonly Opportunity[]): OpportunityDecision {
    const eligible = opportunities
      .filter(o => o.walletCompatible && o.executable)
      .filter(o => o.estimatedCost <= this.policy.maxCost)
      .filter(o => o.confidence >= this.policy.minConfidence)
      .filter(o => o.risk <= this.policy.maxRisk)
      .map(o => ({ opportunity: o, score: this.score(o) }))
      .sort((a, b) => b.score - a.score);

    const best = eligible[0];
    if (!best) return { action: 'watch', score: 0, reason: 'No executable opportunity currently satisfies wallet, confidence, cost, and risk policy' };
    if (best.opportunity.expectedValue - best.opportunity.estimatedCost < this.policy.minNetValue) {
      return { action: 'skip', opportunity: best.opportunity, score: best.score, reason: 'Expected value does not cover cost at the required margin' };
    }
    return { action: 'execute', opportunity: best.opportunity, score: best.score, reason: `Best eligible ${best.opportunity.domain} opportunity` };
  }

  private score(o: Opportunity): number {
    const net = o.expectedValue - o.estimatedCost;
    return net * o.confidence * (0.5 + 0.5 * o.urgency) * (0.5 + 0.5 * o.liquidity) * (1 - o.risk);
  }
}
