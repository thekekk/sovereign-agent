import { OpportunityProviderRegistry } from './opportunity-provider-registry.js';
import { LiveOpportunityAdapter, type LiveDomainFeed } from './live-opportunity-adapter.js';

export function registerLiveFeeds(
  registry: OpportunityProviderRegistry,
  feeds: readonly LiveDomainFeed[]
): void {
  for (const feed of feeds) {
    const adapter = new LiveOpportunityAdapter(feed.domain, feed);
    registry.register({
      id: `live:${feed.domain}`,
      discover: signal => adapter.discover(signal)
    });
  }
}
