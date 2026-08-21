import { OpportunityProviderRegistry } from './opportunity-provider-registry.js';
import { registerLiveFeeds } from './live-provider-registry.js';
import type { LiveDomainFeed } from './live-opportunity-adapter.js';
import type { ProviderConfig } from './provider-config.js';

export function registerConfiguredLiveProviders(
  registry: OpportunityProviderRegistry,
  configs: readonly ProviderConfig[],
  feeds: readonly LiveDomainFeed[]
): void {
  const enabled = new Set(configs.filter(config => config.enabled !== false).map(config => config.domain));
  registerLiveFeeds(registry, feeds.filter(feed => enabled.has(feed.domain)));
}
