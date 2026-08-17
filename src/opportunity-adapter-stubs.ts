import type { Opportunity, OpportunityAdapter, OpportunityDomain } from './opportunity-bus.js';

export interface OpportunitySource {
  discover(domain: OpportunityDomain, signal: AbortSignal): Promise<readonly Opportunity[]>;
}

export class SourceBackedAdapter implements OpportunityAdapter {
  constructor(readonly domain: OpportunityDomain, private readonly source: OpportunitySource) {}
  discover(signal: AbortSignal): Promise<readonly Opportunity[]> { return this.source.discover(this.domain, signal); }
}

export const createDefaultDomainAdapters = (source: OpportunitySource): readonly OpportunityAdapter[] =>
  (['crypto', 'xstocks', 'online-service', 'social-hype', 'mint', 'goods', 'collectibles', 'pokemon', 'other'] as OpportunityDomain[])
    .map(domain => new SourceBackedAdapter(domain, source));
