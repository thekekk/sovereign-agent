import type { OpportunityDomain } from './opportunity-bus.js';
import { LiveOpportunityAdapter, type LiveDomainFeed } from './live-opportunity-adapter.js';

export const createDomainAdapter = (domain: OpportunityDomain, feed: LiveDomainFeed): LiveOpportunityAdapter => {
  if (feed.domain !== domain) throw new Error(`domain mismatch: ${feed.domain} !== ${domain}`);
  return new LiveOpportunityAdapter(domain, feed);
};

export const createDomainAdapters = (feeds: readonly LiveDomainFeed[]): readonly LiveOpportunityAdapter[] =>
  feeds.map(feed => createDomainAdapter(feed.domain, feed));
