import { HttpOpportunityFeed } from './http-opportunity-feed.js';
import type { OpportunityDomain } from './opportunity-bus.js';

export interface DomainFeedConfig {
  domain: OpportunityDomain;
  url: string;
  timeoutMs?: number;
  token?: string;
}

export function createDomainFeed(config: DomainFeedConfig): HttpOpportunityFeed {
  return new HttpOpportunityFeed({
    domain: config.domain,
    url: config.url,
    timeoutMs: config.timeoutMs ?? 10_000,
    headers: config.token ? { Authorization: `Bearer ${config.token}` } : undefined
  });
}

export function createConfiguredOpportunityFeeds(configs: readonly DomainFeedConfig[]): readonly HttpOpportunityFeed[] {
  return configs.map(createDomainFeed);
}
