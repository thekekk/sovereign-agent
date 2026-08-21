import type { OpportunityDomain } from './opportunity-bus.js';
import type { DomainFeedRegistry } from './domain-feed-registry.js';
import type { LiveDomainFeed } from './live-opportunity-adapter.js';

export const registerLiveFeeds = (
  registry: DomainFeedRegistry,
  feeds: readonly LiveDomainFeed[]
): readonly OpportunityDomain[] => {
  for (const feed of feeds) registry.register(feed);
  return registry.domains();
};
