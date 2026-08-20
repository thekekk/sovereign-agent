import { createDomainFeed } from './multi-domain-feed.js';
import type { OpportunityDomain } from './opportunity-bus.js';

export interface CollectiblesFeedConfig {
  url: string;
  domain?: Extract<OpportunityDomain, 'mint' | 'collectibles' | 'pokemon' | 'goods'>;
  timeoutMs?: number;
  token?: string;
}

export function createCollectiblesFeed(config: CollectiblesFeedConfig) {
  return createDomainFeed({
    domain: config.domain ?? 'collectibles',
    url: config.url,
    timeoutMs: config.timeoutMs,
    token: config.token
  });
}
