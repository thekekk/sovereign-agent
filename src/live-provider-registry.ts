import { OpportunityProviderRegistry } from './opportunity-provider-registry.js';
import { LiveOpportunityAdapter, type LiveDomainFeed } from './live-opportunity-adapter.js';

export function registerLiveFeeds(
  registry: OpportunityProviderRegistry,
  feeds: readonly LiveDomainFeed[]
): void {
  for (const feed of feeds) {
    registry.register(new LiveOpportunityAdapter(feed.domain, feed));
  }
}
