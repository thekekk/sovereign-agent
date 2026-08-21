import type { OpportunityDomain } from './opportunity-bus.js';

export interface DomainOpportunityPolicy {
  domain: OpportunityDomain;
  enabled: boolean;
  minEvidenceScore: number;
  maxRisk: number;
}

export const DEFAULT_DOMAIN_POLICIES: readonly DomainOpportunityPolicy[] = [
  { domain: 'crypto', enabled: true, minEvidenceScore: .45, maxRisk: .7 },
  { domain: 'xstocks', enabled: true, minEvidenceScore: .5, maxRisk: .6 },
  { domain: 'social-hype', enabled: true, minEvidenceScore: .65, maxRisk: .5 },
  { domain: 'mint', enabled: true, minEvidenceScore: .55, maxRisk: .6 },
  { domain: 'goods', enabled: true, minEvidenceScore: .5, maxRisk: .55 },
  { domain: 'collectibles', enabled: true, minEvidenceScore: .55, maxRisk: .6 },
  { domain: 'pokemon', enabled: true, minEvidenceScore: .6, maxRisk: .55 },
  { domain: 'online-service', enabled: true, minEvidenceScore: .5, maxRisk: .5 },
  { domain: 'other', enabled: false, minEvidenceScore: .7, maxRisk: .35 }
];
