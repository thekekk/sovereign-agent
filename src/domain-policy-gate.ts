import type { Opportunity } from './opportunity-bus.js';
import { scoreEvidence } from './evidence-quality.js';
import type { DomainOpportunityPolicy } from './domain-opportunity-config.js';

export interface DomainPolicyDecision {
  allowed: boolean;
  reason: string;
  evidenceScore: number;
}

export class DomainPolicyGate {
  private readonly policies = new Map(this.policyList.map(policy => [policy.domain, policy]));

  constructor(private readonly policyList: readonly DomainOpportunityPolicy[]) {}

  evaluate(opportunity: Opportunity, now = Date.now()): DomainPolicyDecision {
    const policy = this.policies.get(opportunity.domain);
    if (!policy || !policy.enabled) return { allowed: false, reason: 'domain disabled', evidenceScore: 0 };
    if (opportunity.risk > policy.maxRisk) return { allowed: false, reason: 'risk exceeds domain limit', evidenceScore: 0 };
    const evidenceScore = scoreEvidence(opportunity, now).score;
    if (evidenceScore < policy.minEvidenceScore) {
      return { allowed: false, reason: 'evidence below domain threshold', evidenceScore };
    }
    return { allowed: true, reason: 'domain policy passed', evidenceScore };
  }
}
