import type { Opportunity } from './opportunity-bus.js';

export interface OpportunityPolicyConfig {
  maxRisk: number;
  minEvidenceConfidence: number;
  minNetValue: number;
  maxCost: number;
  minLiquidity: number;
  maxPositionValue?: number;
}

export interface OpportunityPolicyResult {
  allowed: boolean;
  reasons: readonly string[];
  netValue: number;
  confidence: number;
}

export class OpportunityPolicy {
  constructor(private readonly config: OpportunityPolicyConfig) {}

  evaluate(opportunity: Opportunity): OpportunityPolicyResult {
    const reasons: string[] = [];
    const confidence = opportunity.evidence.length ? Math.max(...opportunity.evidence.map(e => e.confidence)) : 0;
    const netValue = opportunity.estimatedValue - opportunity.estimatedCost;
    if (opportunity.risk > this.config.maxRisk) reasons.push('risk above policy limit');
    if (confidence < this.config.minEvidenceConfidence) reasons.push('evidence confidence below policy minimum');
    if (netValue < this.config.minNetValue) reasons.push('net expected value below policy minimum');
    if (opportunity.estimatedCost > this.config.maxCost) reasons.push('cost above policy limit');
    if (opportunity.liquidity < this.config.minLiquidity) reasons.push('liquidity below policy minimum');
    if (this.config.maxPositionValue !== undefined && opportunity.estimatedValue > this.config.maxPositionValue) reasons.push('position value above policy limit');
    return { allowed: reasons.length === 0, reasons, netValue, confidence };
  }
}
