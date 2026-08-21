import { OpportunityProviderRegistry } from './opportunity-provider-registry.js';
import { registerLiveFeeds } from './live-provider-registry.js';
import type { LiveDomainFeed } from './live-opportunity-adapter.js';
import type { ProviderConfig } from './provider-config.js';

export function createConfiguredProviderRegistry(
  configs: readonly ProviderConfig[],
  feeds: readonly LiveDomainFeed[]
): OpportunityProviderRegistry {
  const enabledDomains = new Set(configs.filter(config => config.enabled !== false).map(config => config.domain));
  const registry = new OpportunityProviderRegistry();
  registerLiveFeeds(registry, feeds.filter(feed => enabledDomains.has(feed.domain)));
  return registry;
}
