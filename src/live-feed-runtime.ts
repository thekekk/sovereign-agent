import type { OpportunityAdapter } from './opportunity-bus.js';
import { DomainFeedRegistry } from './domain-feed-registry.js';
import { LiveOpportunityAdapter } from './live-opportunity-adapter.js';
import { createConfiguredDomainFeeds } from './env-domain-feeds.js';

export interface LiveFeedRuntime {
  registry: DomainFeedRegistry;
  adapters: readonly OpportunityAdapter[];
}

export function createLiveFeedRuntime(env: NodeJS.ProcessEnv = process.env): LiveFeedRuntime {
  const registry = new DomainFeedRegistry();
  const feeds = createConfiguredDomainFeeds(env);
  for (const feed of feeds) registry.register(feed);
  const adapters = feeds.map(feed => new LiveOpportunityAdapter(feed.domain, feed));
  return { registry, adapters };
}
